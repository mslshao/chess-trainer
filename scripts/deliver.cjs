'use strict';
// Usage: node scripts/deliver.cjs [--check-only] [--config path]
// No shell, automatic commits, force pushes, or switches that bypass checks.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const {spawnSync} = require('node:child_process');

const CONFIG = Object.freeze({remote:'origin', branch:'main', repository:'mslshao/chess-trainer',
  workflow:'tests.yml', browserChannel:'msedge', ciTimeoutMs:300000, pollMs:5000,
  apiTimeoutMs:20000, commandTimeoutMs:300000});
const CI_PATHS = ['chess-trainer.html','library','chess-opening-packs','tests','scripts','.github/workflows/tests.yml'];
const CHECKS = [
  ['node',['chess-opening-packs/build-learning.cjs']],
  ['node',['chess-opening-packs/build.cjs']],
  ['node',['library/extract.cjs']],
  ['git',['diff','--exit-code']],
  ['git',['diff','--check']],
  ['node',['--test','tests/delivery.test.cjs']],
  ['node',['tests/run-node.cjs']],
  ['node',['tests/browser/catalogue-browser.cjs']],
  ['node',['tests/browser/browser-test.cjs','--ui-only']]
];
const hash = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
const inside = (root, file) => { const rel=path.relative(root,file); return rel==='' || (!rel.startsWith('..'+path.sep)&&rel!=='..'&&!path.isAbsolute(rel)); };

function options(args) {
  const result={checkOnly:false,config:'.delivery.local.json',help:false};
  for(let i=0;i<args.length;i++) {
    if(args[i]==='--check-only') result.checkOnly=true;
    else if(args[i]==='--help') result.help=true;
    else if(args[i]==='--config'&&args[i+1]&&!args[i+1].startsWith('--')) result.config=args[++i];
    else throw Error('Unknown or incomplete option: '+args[i]);
  }
  return result;
}
function loadConfig(file, root) {
  const raw=JSON.parse(fs.readFileSync(file,'utf8'));
  const allowed=['destinationHtml','backupDirectory','nodeModuleDirectory'];
  for(const key of Object.keys(raw)) if(!allowed.includes(key)) throw Error('Unknown configuration field: '+key);
  for(const key of ['destinationHtml','backupDirectory'])
    if(typeof raw[key]!=='string'||!raw[key].trim()) throw Error('Configuration needs '+key);
  const cfg={};
  for(const key of allowed) if(raw[key]!==undefined) {
    if(typeof raw[key]!=='string'||!path.isAbsolute(raw[key])) throw Error(key+' must be an absolute path.');
    cfg[key]=path.resolve(raw[key]);
  }
  if(path.basename(cfg.destinationHtml)!=='chess-trainer.html') throw Error('Destination must be named chess-trainer.html.');
  if(inside(root,cfg.destinationHtml)||inside(root,cfg.backupDirectory)) throw Error('Delivery and backups must be outside the working clone.');
  if(inside(cfg.backupDirectory,cfg.destinationHtml)) throw Error('The delivered trainer cannot be inside its backup folder.');
  cfg.destinationHandoff=path.join(path.dirname(cfg.destinationHtml),'chess-trainer-handoff.md');
  for(const target of [cfg.destinationHtml,cfg.destinationHandoff]) {
    if(fs.existsSync(target)) {
      const stat=fs.lstatSync(target);
      if(!stat.isFile()||stat.isSymbolicLink()) throw Error('Destination must be an ordinary file: '+target);
    }
  }
  if(!fs.existsSync(cfg.destinationHtml)) throw Error('Original trainer not found: '+cfg.destinationHtml);
  return cfg;
}
function command(root, env, executable, args, capture=false) {
  const result=spawnSync(executable==='node'?process.execPath:executable,args,{cwd:root,env,
    shell:false,windowsHide:true,encoding:'utf8',stdio:capture?'pipe':'inherit',
    timeout:CONFIG.commandTimeoutMs,maxBuffer:16*1024*1024});
  if(result.error) throw Error(executable+' could not run: '+result.error.message);
  if(result.status!==0) throw Error(executable+' '+args.join(' ')+' failed (exit '+result.status+').');
  return capture?result.stdout.trim():'';
}
function assertRevision(git, sha) {
  if(git(['branch','--show-current'])!==CONFIG.branch) throw Error('Switch to main before delivery.');
  if(git(['status','--porcelain','--untracked-files=all'])) throw Error('Commit or safely move uncommitted changes before delivery.');
  const current=git(['rev-parse','HEAD']);
  if(sha&&current!==sha) throw Error('HEAD changed while checking. Run delivery again.');
  return current;
}
function verifyRemote(git,sha) {
  const actual=git(['ls-remote','--exit-code',CONFIG.remote,'refs/heads/'+CONFIG.branch]).split(/\s/)[0];
  if(actual!==sha) throw Error('Remote main no longer matches the checked commit. Nothing was delivered.');
}
function validRemote(url) {
  return /^(?:https:\/\/github\.com\/|git@github\.com:|ssh:\/\/git@github\.com\/)mslshao\/chess-trainer(?:\.git)?\/?$/.test(url);
}

async function github(resource, deps={}) {
  const headers={Accept:'application/vnd.github+json','X-GitHub-Api-Version':'2022-11-28','User-Agent':'chess-trainer-delivery'};
  const env=deps.env||process.env;
  const token=env.GH_TOKEN||env.GITHUB_TOKEN;
  if(token) headers.Authorization='Bearer '+token;
  const response=await (deps.fetch||fetch)('https://api.github.com/repos/'+CONFIG.repository+'/'+resource,
    {headers,signal:AbortSignal.timeout(CONFIG.apiTimeoutMs)});
  if(!response.ok) throw Error('GitHub check lookup failed (HTTP '+response.status+'). For a private repository, set GH_TOKEN or GITHUB_TOKEN with Actions read access.');
  return response.json();
}
async function probeGitHubAccess(get=github) {
  const result=await get('actions/workflows/'+CONFIG.workflow+'/runs?per_page=1');
  if(!Array.isArray(result.workflow_runs)) throw Error('GitHub workflow lookup returned an invalid response.');
}
async function waitForCI(sha, git, deps={}) {
  const get=deps.get||github, now=deps.now||Date.now;
  const sleep=deps.sleep||(ms=>new Promise(resolve=>setTimeout(resolve,ms)));
  const log=deps.log||console.log, deadline=now()+CONFIG.ciTimeoutMs;
  const resource='actions/workflows/'+CONFIG.workflow+'/runs?branch=main&event=push&per_page=100';
  let equivalentChecked=false;
  while(now()<deadline) {
    const exact=await get(resource+'&head_sha='+sha);
    const run=exact.workflow_runs?.filter(r=>r.head_sha===sha).sort((a,b)=>b.id-a.id)[0];
    if(run) {
      if(run.status==='completed') {
        if(run.conclusion!=='success') throw Error('GitHub Tests finished with '+run.conclusion+'. Nothing was delivered.');
        log('GitHub Tests passed: '+run.html_url);
        return run;
      }
    } else if(!equivalentChecked) {
      // Documentation-only commits can be path-filtered out. Reuse a successful
      // ancestor only if ALL CI inputs, including this script, are byte-identical.
      equivalentChecked=true;
      const previous=await get(resource+'&status=success');
      for(const prior of previous.workflow_runs||[]) {
        if(prior.conclusion!=='success') continue;
        try {
          git(['merge-base','--is-ancestor',prior.head_sha,sha]);
          git(['diff','--exit-code',prior.head_sha,sha,'--',...CI_PATHS]);
          log('No new CI run; all checked inputs match successful run: '+prior.html_url);
          return prior;
        } catch { /* Not an available ancestor with identical inputs. */ }
      }
    }
    log('Waiting for GitHub Tests for '+sha.slice(0,7)+'...');
    await sleep(CONFIG.pollMs);
  }
  throw Error('Timed out waiting for GitHub Tests. Nothing was delivered; rerun after CI completes.');
}

// Each replacement is staged next to its destination, flushed and hash-checked.
// Both originals are backed up before either is replaced. A later failure rolls
// back replacements already made; backups remain available if recovery fails.
function installFiles(items, backupDirectory, io=fs) {
  const batch=Date.now()+'-'+crypto.randomUUID();
  const changed=items.filter(item=>!io.existsSync(item.target)||hash(io.readFileSync(item.target))!==hash(item.bytes));
  if(!changed.length) return {changed:0,backups:[]};
  io.mkdirSync(backupDirectory,{recursive:true});
  const prepared=[], replaced=[];
  const cleanup=file=>{if(io.existsSync(file))io.unlinkSync(file);};
  try {
    for(const item of changed) {
      const record={...item,existed:io.existsSync(item.target),stage:item.target+'.delivery-'+batch+'.tmp',backup:null};
      prepared.push(record);
      if(record.existed) {
        record.originalHash=hash(io.readFileSync(item.target));
        record.backup=path.join(backupDirectory,path.basename(item.target)+'.'+batch+'.bak');
        io.copyFileSync(item.target,record.backup,fs.constants.COPYFILE_EXCL);
        if(hash(io.readFileSync(record.backup))!==record.originalHash) throw Error('Backup verification failed.');
      }
      const fd=io.openSync(record.stage,'wx');
      try {io.writeFileSync(fd,item.bytes);io.fsyncSync(fd);} finally {io.closeSync(fd);}
      if(hash(io.readFileSync(record.stage))!==hash(item.bytes)) throw Error('Staged copy verification failed.');
    }
    for(const record of prepared) {
      if(record.existed ? hash(io.readFileSync(record.target))!==record.originalHash : io.existsSync(record.target))
        throw Error('Destination changed during delivery: '+record.target);
      io.renameSync(record.stage,record.target);
      replaced.push(record);
      if(hash(io.readFileSync(record.target))!==hash(record.bytes)) throw Error('Delivered file verification failed.');
    }
    return {changed:replaced.length,backups:prepared.filter(r=>r.backup).map(r=>r.backup)};
  } catch(error) {
    const recovery=[];
    for(const record of replaced.reverse()) {
      try {
        if(record.existed) {
          const rollback=record.stage+'.rollback';
          try {
            io.copyFileSync(record.backup,rollback,fs.constants.COPYFILE_EXCL);
            io.renameSync(rollback,record.target);
            if(hash(io.readFileSync(record.target))!==record.originalHash) throw Error('Restored hash differs.');
          } finally {cleanup(rollback);}
        } else cleanup(record.target);
      } catch(e) {recovery.push(record.target+': '+e.message);}
    }
    throw Error(error.message+(recovery.length?' Recovery needs attention: '+recovery.join('; ')+'. Backups: '+backupDirectory:' Original destination files retained or restored.'));
  } finally { for(const record of prepared) cleanup(record.stage); }
}

async function deliveryFlow(ops,checkOnly=false) {
  const sha=await ops.preflight();
  if(!checkOnly) await ops.apiAccess();
  await ops.checks();
  await ops.unchanged(sha);
  if(checkOnly) return {sha,checkOnly:true};
  await ops.push(sha);
  await ops.remote(sha);
  await ops.ci(sha);
  await ops.unchanged(sha);
  await ops.remote(sha);
  return {sha,...await ops.install(sha)};
}

async function main(args=process.argv.slice(2)) {
  const opts=options(args);
  if(opts.help) {
    console.log('Usage: node scripts/deliver.cjs [--check-only] [--config path]\nCommit changes first. Configure .delivery.local.json as described in scripts/README.md.\nRuns checks, pushes main, waits for CI, then backs up and updates the original trainer and handoff.\n--check-only runs local checks without pushing or copying.');
    return;
  }
  const root=path.resolve(__dirname,'..');
  const cfg=loadConfig(path.resolve(root,opts.config),root);
  const env={...process.env,CHESS_BROWSER_CHANNEL:CONFIG.browserChannel,GIT_TERMINAL_PROMPT:'0'};
  if(cfg.nodeModuleDirectory) env.NODE_PATH=[cfg.nodeModuleDirectory,env.NODE_PATH].filter(Boolean).join(path.delimiter);
  const git=args=>command(root,env,'git',args,true);
  const lock=path.join(root,'tests','artifacts','delivery.lock');
  fs.mkdirSync(path.dirname(lock),{recursive:true});
  let lockFd;
  try {lockFd=fs.openSync(lock,'wx');fs.writeFileSync(lockFd,String(process.pid));}
  catch {throw Error('Could not acquire delivery lock. Another run may be active: '+lock);}
  let snapshots;
  try {
    const result=await deliveryFlow({
      preflight() {
        const sha=assertRevision(git);
        if(!validRemote(git(['remote','get-url',CONFIG.remote]))||!validRemote(git(['remote','get-url','--push',CONFIG.remote])))
          throw Error('origin must point to '+CONFIG.repository+' on GitHub.');
        command(root,env,'node',['-e',"require('playwright')"]);
        command(root,env,'git',['fetch',CONFIG.remote,CONFIG.branch]);
        git(['merge-base','--is-ancestor',CONFIG.remote+'/'+CONFIG.branch,sha]);
        snapshots=[{target:cfg.destinationHtml,bytes:fs.readFileSync(path.join(root,'chess-trainer.html'))},
          {target:cfg.destinationHandoff,bytes:fs.readFileSync(path.join(root,'HANDOFF.md'))}];
        console.log('Checking committed main '+sha.slice(0,7)+'. Destination: '+cfg.destinationHtml);
        return sha;
      },
      async apiAccess() {
        await probeGitHubAccess();
        console.log('GitHub workflow access confirmed.');
      },
      checks() {for(const [exe,args] of CHECKS){console.log('\nChecking: '+exe+' '+args.join(' '));command(root,env,exe,args);}},
      unchanged:sha=>assertRevision(git,sha),
      push:sha=>command(root,env,'git',['push',CONFIG.remote,sha+':refs/heads/'+CONFIG.branch]),
      remote:sha=>verifyRemote(git,sha),
      ci:sha=>waitForCI(sha,git),
      install:()=>installFiles(snapshots,cfg.backupDirectory)
    },opts.checkOnly);
    if(result.checkOnly) console.log('\nAll local checks passed. Nothing was pushed or copied.');
    else {
      console.log('\nDelivered '+result.sha+'. '+result.changed+' file(s) updated; SHA-256 hashes verified.');
      for(const backup of result.backups) console.log('Backup: '+backup);
    }
    return result;
  } finally {fs.closeSync(lockFd);fs.unlinkSync(lock);}
}
module.exports={CONFIG,CI_PATHS,CHECKS,options,loadConfig,assertRevision,verifyRemote,validRemote,github,probeGitHubAccess,waitForCI,installFiles,deliveryFlow,hash};
if(require.main===module) main().catch(error=>{console.error('\nDelivery stopped: '+error.message);process.exitCode=1;});
