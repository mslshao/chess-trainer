  /* Library presentation stays bounded: 34 learning cards, or one page of lines. */
  const bookView = { tab: 'learn', page: 0, boardFen: null, lessonIds: [] };
  function sourceLink(url){
    return typeof url === 'string' && /^https?:\/\//i.test(url)
      ? '<a href="' + esc(url) + '" target="_blank" rel="noopener noreferrer">Source reference</a>' : '';
  }
  function showBookTab(tab){
    bookView.tab = tab;
    for (const name of ['learn','explore','personal','packs']){
      $('book' + name[0].toUpperCase() + name.slice(1)).hidden = name !== tab;
      const button = document.querySelector('[data-book-tab="' + name + '"]');
      button.setAttribute('aria-pressed', String(name === tab));
    }
  }
  function renderLearning(){
    const query = CT.openingText($('learnSearch').value), group = $('learnGroup').value;
    const shown = CT.OPENING_LESSONS.filter(function(e){
      return (!group || e.group === group) && (!query || CT.openingText(e.nameEn + ' ' + e.idea + ' ' + e.whitePlan + ' ' + e.blackPlan).includes(query));
    });
    bookView.lessonIds = shown.map(function(e){ return e.id; });
    $('learnCount').textContent = shown.length + ' of ' + CT.OPENING_LESSONS.length + ' main families. Open a family to see its plans and learning controls.';
    $('learnPractise').disabled = !shown.length;
    $('learnPractise').textContent = 'Practise ' + Math.min(10, shown.length) + ' key decisions';
    $('lessonLists').innerHTML = shown.map(function(e){
      const card = CT.learningCards(e.id)[0], stats = CT.drillStats[card.id];
      return '<details class="lesson-card" data-lesson="' + esc(e.id) + '"' + (shown.length === 1 ? ' open' : '') + '><summary>' + esc(e.nameEn)
        + '<span class="lesson-summary">' + esc(e.idea) + '</span></summary>'
        + '<div class="study-meta">' + esc(e.group) + ' | ' + (stats ? stats.right + '/' + stats.seen + ' key decisions unaided' : 'Key decision not practised yet') + '</div>'
        + '<p><b>With White:</b> ' + esc(e.whitePlan) + '</p><p><b>With Black:</b> ' + esc(e.blackPlan) + '</p>'
        + '<p><b>Keep in mind:</b> ' + esc(e.watch) + '</p>'
        + '<p>Representative line: <code>' + esc(numberSan(e.movesSan, CT.fenAfterSan(e.movesSan, CT.START_FEN))) + '</code></p>'
        + '<div class="study-actions"><button class="mini lesson-study" data-id="' + esc(e.id) + '">Study key position</button>'
        + '<button class="mini primary lesson-drill" data-id="' + esc(e.id) + '">Practise decision</button>'
        + '<button class="mini lesson-preview" data-id="' + esc(e.id) + '">Preview line</button>'
        + '<button class="mini lesson-browse" data-id="' + esc(e.id) + '">Explore variations</button></div>'
        + '<p class="book-note">' + sourceLink(e.sourceField) + ' | Introductory guidance; plans depend on the position.</p></details>';
    }).join('') || '<p class="book-note">No matching families. Try a broader search or another group.</p>';
  }
  function renderCatalogue(){
    const result = CT.queryOpeningCatalogue({ query: $('catSearch').value, family: $('catFamily').value,
      firstMove: $('catFirst').value, favourites: $('catFavourites').checked,
      fen: $('catBoard').checked ? bookView.boardFen : null, page: bookView.page });
    bookView.page = result.page;
    $('catCount').textContent = result.total.toLocaleString('en-CA') + ' matching lines of ' + CT.catalogueEntries().length.toLocaleString('en-CA')
      + ($('catBoard').checked ? '. Matching the position shown when you opened the library, including other move orders.' : '. Search by name, opening code, or moves.');
    let family = '', h = '';
    for (const e of result.rows){
      if (family !== e.family){ family = e.family; h += '<h4>' + esc(family) + '</h4>'; }
      const saved = CT.openingPrefs.favourites.indexOf(e.id) >= 0;
      const ply = result.matches ? result.matches.get(e.id) : 0;
      h += '<article class="catalogue-line"><h5>' + esc(e.nameEn) + '</h5><div class="meta">' + esc(e.eco)
        + ' | ' + Math.ceil(e.movesSan.length / 2) + ' moves | ' + (e.sideToMove === 'white' ? 'White' : 'Black') + ' to move at the end</div>'
        + '<div class="meta"><code>' + esc(e.movesSan.join(' ')) + '</code></div>'
        + '<div class="study-actions"><button class="mini catalogue-preview" data-id="' + esc(e.id) + '" data-ply="' + ply + '">'
        + (result.matches ? 'View matching position' : 'Preview line') + '</button>'
        + '<button class="mini catalogue-drill" data-id="' + esc(e.id) + '">Practise line</button>'
        + '<button class="mini catalogue-favourite" data-id="' + esc(e.id) + '" aria-pressed="' + saved + '">' + (saved ? 'Saved' : 'Save opening') + '</button></div></article>';
    }
    $('catalogueLists').innerHTML = h || '<p class="book-note">No matching lines. Clear a filter or save an opening first.</p>';
    $('catPage').textContent = 'Page ' + (result.page + 1) + ' of ' + result.pages;
    $('catPrev').disabled = result.page === 0;
    $('catNext').disabled = result.page + 1 === result.pages;
  }
  function refreshCatalogueFamilies(){
    const old = $('catFamily').value;
    const families = Array.from(new Set(CT.catalogueEntries().map(function(e){ return e.family; }))).sort();
    $('catFamily').innerHTML = '<option value="">All families</option>' + families.map(function(f){ return '<option value="' + esc(f) + '">' + esc(f) + '</option>'; }).join('');
    if (families.indexOf(old) >= 0) $('catFamily').value = old;
  }
  function renderOpeningPacks(){
    $('catalogueOpponent').checked = CT.openingPrefs.catalogueOpponent;
    $('packLists').innerHTML = CT.openingPackList().map(function(p, i){
      return '<div class="pack-row"><b>' + esc(p.name) + '</b><p class="book-note">' + p.openings.length.toLocaleString('en-CA') + ' lines'
        + (i === 0 ? ' | Included offline' : ' | Added pack') + (p.licence ? ' | ' + esc(p.licence) : '')
        + (p.downloadedOn ? ' | Snapshot ' + esc(p.downloadedOn) : '') + '</p>'
        + '<div class="study-actions"><button class="mini pack-download" data-id="' + esc(p.id) + '">Download pack</button>'
        + (i ? '<button class="mini pack-remove" data-id="' + esc(p.id) + '">Remove pack</button>' : '') + '</div>'
        + '<p class="book-note">' + sourceLink(p.source) + '</p></div>';
    }).join('');
  }
  function renderLibraryLists(){
    $('libSummary').textContent = CT.OPENING_LESSONS.length + ' guided opening families and '
      + CT.catalogueEntries().length.toLocaleString('en-CA') + ' catalogue lines, available offline. Your personal lines, traps and study positions are kept in My lines & traps.';
    refreshCatalogueFamilies(); renderLearning(); renderCatalogue(); renderPersonalLibrary(); renderOpeningPacks(); showBookTab(bookView.tab);
  }
  function wireOpeningCatalogue(){
    $('learnGroup').innerHTML += Array.from(new Set(CT.OPENING_LESSONS.map(function(e){ return e.group; }))).map(function(g){ return '<option>' + esc(g) + '</option>'; }).join('');
    document.querySelectorAll('[data-book-tab]').forEach(function(button){
      button.addEventListener('click', function(){ showBookTab(button.getAttribute('data-book-tab')); });
    });
    $('btnLibrary').addEventListener('click', function(){ bookView.boardFen = CT.genFEN(viewData().pos); });
    $('learnSearch').addEventListener('input', renderLearning);
    $('learnGroup').addEventListener('change', renderLearning);
    $('learnOriginal').addEventListener('click', function(){ showBookTab('personal'); });
    $('learnPractise').addEventListener('click', function(){
      if (!bookView.lessonIds.length) return;
      $('dlgLibrary').close();
      startDrill({ include: 'openings', lessonsOnly: true, lessonIds: bookView.lessonIds.slice(), size: Math.min(10, bookView.lessonIds.length) });
    });
    $('lessonLists').addEventListener('click', function(event){
      const button = event.target.closest('button[data-id]'); if (!button) return;
      const entry = CT.findOpeningEntry(button.dataset.id); if (!entry) return;
      if (button.classList.contains('lesson-browse')){
        $('catSearch').value = entry.id === 'learn-colle' ? 'Colle' : '';
        $('catFamily').value = entry.id === 'learn-colle' ? '' : entry.family;
        $('catFirst').value = ''; $('catBoard').checked = false; $('catFavourites').checked = false;
        bookView.page = 0; renderCatalogue(); showBookTab('explore'); return;
      }
      if (button.classList.contains('lesson-drill')){
        $('dlgLibrary').close(); startDrill({ include: 'openings', lessonId: entry.id, size: 1 }); return;
      }
      const card = CT.learningCards(entry.id)[0], notes = [];
      notes[card.ply] = card.why;
      enterPreview(entry.nameEn, entry.idea, entry.movesSan, null, notes, button.classList.contains('lesson-study') ? card : null);
    });
    function changed(){ bookView.page = 0; renderCatalogue(); }
    $('catSearch').addEventListener('input', changed);
    for (const id of ['catFamily','catFirst','catFavourites','catBoard']) $(id).addEventListener('change', changed);
    $('catClear').addEventListener('click', function(){
      $('catSearch').value = ''; $('catFamily').value = ''; $('catFirst').value = '';
      $('catFavourites').checked = false; $('catBoard').checked = false; changed();
    });
    $('catPrev').addEventListener('click', function(){ bookView.page--; renderCatalogue(); });
    $('catNext').addEventListener('click', function(){ bookView.page++; renderCatalogue(); });
    $('catalogueLists').addEventListener('click', function(event){
      const button = event.target.closest('button[data-id]'); if (!button) return;
      const entry = CT.findOpeningEntry(button.dataset.id); if (!entry) return;
      if (button.classList.contains('catalogue-favourite')){ CT.toggleOpeningFavourite(entry.id); autosave(); renderCatalogue(); return; }
      if (button.classList.contains('catalogue-drill')){
        $('dlgLibrary').close(); startDrill({ include: 'openings', entryId: entry.id, size: Math.min(8, entry.movesSan.length) }); return;
      }
      enterPreview(entry.nameEn, entry.idea || 'A named opening line. Use the arrows to replay it, or Play from here to explore your own continuation.', entry.movesSan, entry.fen, entry.notes);
      if (Number(button.dataset.ply) > 0) setPreviewIdx(Number(button.dataset.ply));
    });
    $('openingPackFile').addEventListener('change', async function(){
      const file = this.files && this.files[0]; if (!file) return;
      $('packError').hidden = true;
      try {
        if (file.size > CT.OPENING_PACK_CONFIG.maxBytes) throw new Error('Opening packs must be smaller than 5 MB.');
        const result = CT.importOpeningPack(await file.text());
        $('packStatus').textContent = result.duplicate ? 'This pack is already available. No duplicate was added.' : result.pack.name + ' added: ' + result.pack.openings.length + ' lines. Repeated catalogue entries are shown once.';
        autosave(); renderLibraryLists();
      } catch (e){ $('packError').textContent = String(e.message || e); $('packError').hidden = false; }
      this.value = '';
    });
    $('packLists').addEventListener('click', function(event){
      const button = event.target.closest('button[data-id]'); if (!button) return;
      if (button.classList.contains('pack-download')) downloadText(button.dataset.id + '.json', CT.exportOpeningPack(button.dataset.id));
      if (button.classList.contains('pack-remove')){ CT.removeOpeningPack(button.dataset.id); autosave(); renderLibraryLists(); $('packStatus').textContent = 'Pack removed. Existing drill history is kept.'; }
    });
    $('catalogueOpponent').addEventListener('change', function(){ CT.openingPrefs.catalogueOpponent = this.checked; CT.touchOpeningBook(); autosave(); });
  }
