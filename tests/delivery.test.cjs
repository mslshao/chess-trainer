'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const os=require('node:os');
const path=require('node:path');
const {CONFIG,CHECKS,options,loadConfig,assertRevision,verifyRemote,validRemote,github,probeGitHubAccess,waitForCI,installFiles,deliveryFlow}=require('../scripts/deliver.cjs');

const sequence=['preflight','apiAccess','checks','unchanged','push','remote','ci','unchanged','remote','install'];
function fakeFlow(failAt=-1) {
  const trace=[];
  const ops={};
  for(const name of new Set(sequence)) ops[name]=async()=>{
    trace.push(name);
    if(trace.length-1===failAt) throw Error('failure at '+name);
    return name==='preflight'?'abc':name==='install'?{changed:2}:undefined;
  };
  return {ops,trace};
}
test('delivery follows the checked commit through push, CI and verified installation',async()=>{
  const {ops,trace}=fakeFlow();
  assert.deepEqual(await deliveryFlow(ops),{sha:'abc',changed:2});
  assert.deepEqual(trace,sequence);
});
for(let stage=0;stage<sequence.length;stage++) test('stops after failure at stage '+(stage+1)+' ('+sequence[stage]+')',async()=>{
  const {ops,trace}=fakeFlow(stage);
  await assert.rejects(deliveryFlow(ops),/failure at/);
  assert.deepEqual(trace,sequence.slice(0,stage+1));
});
test('check-only never pushes, queries CI or copies',async()=>{
  const {ops,trace}=fakeFlow();
  assert.deepEqual(await deliveryFlow(ops,true),{sha:'abc',checkOnly:true});
  assert.deepEqual(trace,['preflight','checks','unchanged']);
});
for(const [exe,args] of CHECKS) test('a failed check stops delivery: '+exe+' '+args.join(' '),async()=>{
  const {ops,trace}=fakeFlow();
  ops.checks=async()=>{for(const check of CHECKS) if(check[0]===exe&&check[1]===args) throw Error('check failed');};
  await assert.rejects(deliveryFlow(ops),/check failed/);
  assert.deepEqual(trace,['preflight','apiAccess']);
});

function fixture(t) {
  const root=fs.mkdtempSync(path.join(os.tmpdir(),'chess-delivery-test-'));
  t.after(()=>{
    const resolved=path.resolve(root);
    assert.equal(path.dirname(resolved),path.resolve(os.tmpdir()));
    assert(path.basename(resolved).startsWith('chess-delivery-test-'));
    fs.rmSync(resolved,{recursive:true,force:true});
  });
  const destination=path.join(root,'destination');fs.mkdirSync(destination);
  const html=path.join(destination,'chess-trainer.html'),handoff=path.join(destination,'chess-trainer-handoff.md');
  fs.writeFileSync(html,'old trainer');fs.writeFileSync(handoff,'old handoff');
  return {root,html,handoff,backups:path.join(root,'backups'),
    items:[{target:html,bytes:Buffer.from('new trainer')},{target:handoff,bytes:Buffer.from('new handoff')}]};
}
test('successful copy keeps both originals in unique backups and verifies both outputs',t=>{
  const f=fixture(t),result=installFiles(f.items,f.backups);
  assert.equal(result.changed,2);
  assert.deepEqual(result.backups.map(p=>fs.readFileSync(p,'utf8')).sort(),['old handoff','old trainer']);
  for(const item of f.items) assert.deepEqual(fs.readFileSync(item.target),item.bytes);
  assert.deepEqual(fs.readdirSync(path.dirname(f.html)).sort(),['chess-trainer-handoff.md','chess-trainer.html']);
});
test('matching files are not rewritten or backed up again',t=>{
  const f=fixture(t);installFiles(f.items,f.backups);
  const before=fs.readdirSync(f.backups);
  assert.deepEqual(installFiles(f.items,f.backups),{changed:0,backups:[]});
  assert.deepEqual(fs.readdirSync(f.backups),before);
});
test('failure making the second backup leaves both originals untouched',t=>{
  const f=fixture(t);
  const io={...fs,copyFileSync(from,...rest){if(from===f.handoff)throw Error('backup denied');return fs.copyFileSync(from,...rest);}};
  assert.throws(()=>installFiles(f.items,f.backups,io),/backup denied/);
  assert.equal(fs.readFileSync(f.html,'utf8'),'old trainer');assert.equal(fs.readFileSync(f.handoff,'utf8'),'old handoff');
});
test('failure replacing handoff rolls the trainer back to its original bytes',t=>{
  const f=fixture(t);
  const io={...fs,renameSync(from,to){if(to===f.handoff)throw Error('file locked');return fs.renameSync(from,to);}};
  assert.throws(()=>installFiles(f.items,f.backups,io),/Original destination files retained or restored/);
  assert.equal(fs.readFileSync(f.html,'utf8'),'old trainer');assert.equal(fs.readFileSync(f.handoff,'utf8'),'old handoff');
});
test('failed staging hash leaves both original files untouched',t=>{
  const f=fixture(t);
  const io={...fs,readFileSync(file,...rest){if(String(file).endsWith('.tmp'))return Buffer.from('corrupt');return fs.readFileSync(file,...rest);}};
  assert.throws(()=>installFiles(f.items,f.backups,io),/Staged copy verification failed/);
  assert.equal(fs.readFileSync(f.html,'utf8'),'old trainer');assert.equal(fs.readFileSync(f.handoff,'utf8'),'old handoff');
});
test('failed final hash rolls back the delivered trainer',t=>{
  const f=fixture(t);let corruptOnce=false;
  const io={...fs,renameSync(from,to){fs.renameSync(from,to);if(to===f.html&&from.endsWith('.tmp'))corruptOnce=true;},
    readFileSync(file,...rest){if(file===f.html&&corruptOnce){corruptOnce=false;return Buffer.from('corrupt');}return fs.readFileSync(file,...rest);}};
  assert.throws(()=>installFiles(f.items,f.backups,io),/Delivered file verification failed/);
  assert.equal(fs.readFileSync(f.html,'utf8'),'old trainer');assert.equal(fs.readFileSync(f.handoff,'utf8'),'old handoff');
});
test('rollback failure reports the backup location for recovery',t=>{
  const f=fixture(t);
  const io={...fs,renameSync(from,to){if(to===f.handoff||from.endsWith('.rollback'))throw Error('locked');return fs.renameSync(from,to);}};
  assert.throws(()=>installFiles(f.items,f.backups,io),e=>e.message.includes('Recovery needs attention')&&e.message.includes(f.backups));
  assert.equal(fs.readdirSync(f.backups).length,2);
});
test('configuration keeps destinations and backups outside Git',t=>{
  const f=fixture(t),repo=path.join(f.root,'repo');fs.mkdirSync(repo);
  const file=path.join(repo,'.delivery.local.json');
  const raw={destinationHtml:f.html,backupDirectory:f.backups};
  fs.writeFileSync(file,JSON.stringify(raw));assert.equal(loadConfig(file,repo).destinationHandoff,f.handoff);
  fs.writeFileSync(file,JSON.stringify({...raw,backupDirectory:repo}));assert.throws(()=>loadConfig(file,repo),/outside/);
  fs.writeFileSync(file,JSON.stringify({...raw,skipTests:true}));assert.throws(()=>loadConfig(file,repo),/Unknown configuration/);
});
test('CLI rejects force and skip options',()=>{
  assert.equal(options(['--check-only']).checkOnly,true);
  for(const flag of ['--force','--skip-tests','--skip-ci','--config'])assert.throws(()=>options([flag]),/Unknown or incomplete/);
});
test('dirty worktree, changed HEAD and wrong branch stop delivery',()=>{
  const git=(branch,status,head)=>args=>args[0]==='branch'?branch:args[0]==='status'?status:head;
  assert.equal(assertRevision(git('main','','abc'),'abc'),'abc');
  assert.throws(()=>assertRevision(git('feature','','abc')),/main/);
  assert.throws(()=>assertRevision(git('main',' M file','abc')),/uncommitted/);
  assert.throws(()=>assertRevision(git('main','','def'),'abc'),/HEAD changed/);
});
test('remote verification rejects another repository or a moved branch',()=>{
  assert(validRemote('https://github.com/mslshao/chess-trainer.git'));
  assert(validRemote('git@github.com:mslshao/chess-trainer.git'));
  assert(!validRemote('https://github.com/other/chess-trainer.git'));
  assert(!validRemote('https://github.com.evil.example/mslshao/chess-trainer.git'));
  assert.throws(()=>verifyRemote(()=> 'def refs/heads/main','abc'),/no longer matches/);
});

function ciDeps(get) {let time=0;return {get,now:()=>time,sleep:async ms=>{time+=ms;},log:()=>{}};}
const run=(status,conclusion)=>({id:1,head_sha:'abc',status,conclusion,html_url:'https://github.com/mslshao/chess-trainer/actions/runs/1'});
test('CI waits until the exact commit succeeds',async()=>{
  let calls=0;
  const deps=ciDeps(async()=>({workflow_runs:[++calls===1?run('in_progress',null):run('completed','success')]}));
  assert.equal((await waitForCI('abc',()=>{},deps)).conclusion,'success');assert.equal(calls,2);
});
for(const conclusion of ['failure','cancelled','timed_out','skipped']) test('CI '+conclusion+' prevents delivery',async()=>{
  await assert.rejects(waitForCI('abc',()=>{},ciDeps(async()=>({workflow_runs:[run('completed',conclusion)]}))),/Nothing was delivered/);
});
test('missing CI times out rather than copying',async()=>{
  const deps=ciDeps(async()=>({workflow_runs:[]}));
  await assert.rejects(waitForCI('abc',()=>{},deps),/Timed out/);assert(deps.now()>=CONFIG.ciTimeoutMs);
});
test('CI API failure stops delivery',async()=>{
  await assert.rejects(waitForCI('abc',()=>{},ciDeps(async()=>{throw Error('API unavailable');})),/API unavailable/);
});
test('documentation-only commits can reuse CI only for identical inputs on an ancestor',async()=>{
  const prior={...run('completed','success'),head_sha:'prior'};
  const deps=ciDeps(async resource=>({workflow_runs:resource.includes('status=success')?[prior]:[]}));
  const calls=[];
  assert.equal((await waitForCI('abc',args=>calls.push(args),deps)).head_sha,'prior');
  assert.equal(calls[0][0],'merge-base');assert.equal(calls[1][0],'diff');
  await assert.rejects(waitForCI('abc',()=>{throw Error('changed inputs');},deps),/Timed out/);
});

for(const [label,env,authorization] of [
  ['public access',{},undefined],
  ['GH_TOKEN',{GH_TOKEN:'example-token'},'Bearer example-token'],
  ['GITHUB_TOKEN',{GITHUB_TOKEN:'example-token'},'Bearer example-token']
]) test('access preflight makes one workflow-runs request using '+label,async()=>{
  const requests=[];
  const get=resource=>github(resource,{env,fetch:async(url,opts)=>{
    requests.push({url,opts});
    return {ok:true,json:async()=>({workflow_runs:[]})};
  }});
  await probeGitHubAccess(get);
  assert.equal(requests.length,1);
  assert.equal(requests[0].url,'https://api.github.com/repos/'+CONFIG.repository+'/actions/workflows/tests.yml/runs?per_page=1');
  assert.equal(requests[0].opts.headers.Authorization,authorization);
});
for(const status of [401,403,404]) test('access preflight HTTP '+status+' stops before checks, push or copy',async()=>{
  const {ops,trace}=fakeFlow();
  let calls=0;
  ops.apiAccess=async()=>{
    trace.push('apiAccess');
    await probeGitHubAccess(resource=>github(resource,{env:{},fetch:async()=>{
      calls++;return {ok:false,status};
    }}));
  };
  await assert.rejects(deliveryFlow(ops),e=>e.message.includes('HTTP '+status)&&e.message.includes('Actions read access'));
  assert.equal(calls,1);
  assert.deepEqual(trace,['preflight','apiAccess']);
});
test('access preflight rejects an unexpected API response',async()=>{
  await assert.rejects(probeGitHubAccess(async()=>({message:'not a run listing'})),/invalid response/);
});
test('access preflight rejects a network failure before checks or push',async()=>{
  const {ops,trace}=fakeFlow();
  ops.apiAccess=async()=>{
    trace.push('apiAccess');
    await probeGitHubAccess(resource=>github(resource,{env:{},fetch:async()=>{throw Error('network unavailable');}}));
  };
  await assert.rejects(deliveryFlow(ops),/network unavailable/);
  assert.deepEqual(trace,['preflight','apiAccess']);
});
