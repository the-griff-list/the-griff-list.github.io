/* Reuses the homepage's original sound effects on the added pages. */
(()=>{const map={nav:'ui-sound-01r.mp3',action:'select.mp3',success:'you_rockR.mp3',tip:'cash.mp3',open:'notes_ripple_up_01.mp3',close:'ui_sound_09R.mp3'};let last=0;function play(file){const now=Date.now();if(now-last<90)return;last=now;try{const a=new Audio(file);a.preload='none';a.volume=.42;a.play().catch(()=>{});}catch(e){}}document.addEventListener('click',e=>{const el=e.target.closest('button,a,summary,[role=button]');if(!el||el.disabled||el.closest('.secret-stage-overlay'))return;if(el.matches('.top-nav a, .header-logo-link'))play(map.nav);else if(el.id==='broadcast-start'||el.id==='broadcast-stop'||el.id==='quick-go-live'||el.id==='quick-end-live')play(map.action);else if(el.closest('.live-tip-card')||el.id==='copy-email')play(map.tip);else if(el.matches('button'))play(map.action);else if(el.matches('a'))play(map.open);},true);document.addEventListener('submit',e=>{if(e.target.matches('form'))play(map.success);},true);})();


/* Bonus experiences bundle: see BONUS-EXPERIENCES-NOTES.txt */
/* The Grifflist - bonus experiences. Lightweight, dependency-free enhancements. */
(() => {
  'use strict';
  const $ = (s, root=document) => root.querySelector(s);
  const $$ = (s, root=document) => [...root.querySelectorAll(s)];
  const reducedMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
  const play = (id) => { const a = document.getElementById(id); if (!a) return; try { a.currentTime=0; const p=a.play(); p?.catch?.(()=>{}); } catch (_) {} };
  const safeText = (s) => String(s ?? '').replace(/[<>]/g,'');
  const root = document.documentElement;
  const pageIsHome = Boolean($('#song-list') && $('#request-form'));
  const exploreContent = $('#explore-drawer-content');
  const appendExplore = (el) => { if (exploreContent) exploreContent.append(el); else if (pageIsHome) document.querySelector('main')?.append(el); };
  const getSongs = () => $$('.song-row').map(row => ({title: $('.song-title',row)?.textContent?.trim() || '', artist: $('.song-artist',row)?.textContent?.trim() || '', year: Number($('.song-year',row)?.textContent) || 0})).filter(s=>s.title);

  // Theme picker: daytime, nighttime, and colourful arcade.
  const themeControls = document.createElement('div');
  themeControls.className='gig-theme-controls';
  themeControls.setAttribute('aria-label','Website appearance');
  themeControls.innerHTML='<span class="gig-mode-label">Appearance</span><button type="button" data-theme="day" aria-pressed="false">☀ Day</button><button type="button" data-theme="night" aria-pressed="false">☾ Night</button><button type="button" data-theme="eighties" aria-pressed="false">⚡ 80s</button>';
  const applyTheme = (theme) => {
    document.body.classList.remove('theme-day','theme-night','theme-neon','theme-eighties');
    if(theme==='eighties') document.body.classList.add('theme-eighties'); else document.body.classList.add('theme-'+(['day','night'].includes(theme)?theme:'night'));
    $$('.gig-theme-controls button').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.theme===theme)));
    try{localStorage.setItem('grifflistTheme.v1',theme);}catch(_){}
  };
  const footer = $('footer');
  if (footer) { footer.append(themeControls); themeControls.addEventListener('click',e=>{const b=e.target.closest('[data-theme]');if(b){applyTheme(b.dataset.theme);play('select-sfx');}}); }
  let savedTheme='night'; try{savedTheme=localStorage.getItem('grifflistTheme.v1')||'night';}catch(_){} applyTheme(savedTheme);



  // Consistent two-tone headings across every public-facing page (admin excluded).
  // Keep the first word light and the remaining words orange for a recognizable hierarchy.
  if (!$('#inbox-panel')) {
    const headingNodes = $$('h1, h2, h3').filter(h =>
      !h.closest('footer, nav, .top-nav, .gig-theme-controls, .admin-panel, #inbox-panel')
    );
    headingNodes.forEach(h => {
      if (h.dataset.twoToneApplied === 'true') return;
      const label = h.textContent.replace(/\s+/g, ' ').trim();
      if (!label) return;
      const words = label.split(' ');
      h.textContent = '';
      const first = document.createElement('span');
      first.className = 'heading-tone-first';
      first.textContent = words.shift();
      h.append(first);
      if (words.length) {
        h.append(document.createTextNode(' '));
        const rest = document.createElement('span');
        rest.className = 'heading-tone-rest';
        rest.textContent = words.join(' ');
        h.append(rest);
      }
      h.dataset.twoToneApplied = 'true';
    });
  }
  // One random-song action lives in the request form to avoid duplicate tools.
  if (pageIsHome) {
    const randomButton=$('#random-request-song');
    const selectRandomSong=()=>{
      const songs=getSongs(); if(!songs.length)return;
      const song=songs[Math.floor(Math.random()*songs.length)];
      const title=$('#request-song'),artist=$('#request-artist'),hint=$('#request-hint');
      if(title)title.value=song.title; if(artist)artist.value=song.artist;
      if(hint){hint.hidden=false;hint.textContent=`Random song selected: ${song.title} - ${song.artist}. Add your name to request it.`;hint.classList.add('hint-pulse');}
      $('#request')?.scrollIntoView({behavior:reducedMotion()?'auto':'smooth',block:'start'});
      play('notes-ripple-sfx');
    };
    randomButton?.addEventListener('click',selectRandomSong);
  }

  // Compact seasonal spotlight: it points visitors to the catalog rather than duplicating random selection.
  if (pageIsHome) {
    const m=new Date().getMonth();
    const seasonal=[['WINTER ROCK','Winter road-trip picks'],['VALENTINE RIFFS','Songs to share'],['SPRING SOUNDTRACK','Fresh-season favourites'],['MAY THE RIFFS BE WITH YOU','Force-of-rock favourites'],['CANADA DAY ROCK','Canadian summer soundtrack'],['SUMMER ROCK','Road-trip favourites'],['SUMMER ROCK','Road-trip favourites'],['BACK-TO-GIG SEASON','Live singalong picks'],['AUTUMN AMPLIFIERS','Rock for cooler nights'],['HALLOWEEN AFTER HOURS','Spooky season soundtrack'],['REMEMBRANCE DAY','A respectful moment of reflection'],['YEAR-END RIFF REWIND','Year-end favourites']][m];
    const event=document.createElement('section'); event.className='section seasonal-event';
    event.innerHTML=`<div><p class="eyebrow">✦ SEASONAL SPOTLIGHT</p><h2>${seasonal[0]}</h2><p>${seasonal[1]}</p></div><a class="button button-quiet" href="#catalog">BROWSE SONGS ↗</a>`;
    appendExplore(event);
  }

  // Secret Stage: deliberately discreet amp button at the footer, no code required.
  if (footer) {
    const secret=footer.querySelector('.secret-stage-trigger') || document.createElement('button');secret.type='button';secret.className='secret-stage-trigger';secret.setAttribute('aria-label','Hidden amp');secret.title='';secret.textContent='♬';if(!secret.isConnected)footer.append(secret);
    const overlay=document.createElement('div');overlay.className='secret-stage-overlay';overlay.id='secret-stage-overlay';overlay.hidden=true;
    overlay.innerHTML=`<div class="secret-stage-panel" role="dialog" aria-modal="true" aria-labelledby="secret-stage-title"><button type="button" class="secret-close" aria-label="Close secret stage">×</button><button type="button" class="secret-sound-toggle" aria-pressed="true" aria-label="Mute Secret Stage sounds">SOUND ON</button><p class="secret-kicker">UNLISTED AREA · LEVEL 99</p><h2 id="secret-stage-title">THE SECRET STAGE</h2><p class="secret-intro">You found the backstage door. Welcome to the part of The Grifflist that isn't on the setlist.</p><div class="secret-stage-grid"><button type="button" class="secret-tile" id="lost-cassette"><span class="cassette-art" aria-hidden="true"><i></i><b></b></span><strong>THE LOST CASSETTE</strong><small>Flip the tape for a hidden note.</small></button><button type="button" class="secret-tile" id="high-score-open"><span class="arcade-icon" aria-hidden="true">★<br>HI-SCORE</span><strong>BACKSTAGE ARCADE</strong><small>Catch the guitar picks.</small></button><button type="button" class="secret-tile" id="secret-message-open"><span class="secret-sparkle" aria-hidden="true">✦</span><strong>THE HIDDEN NOTE</strong><small>A little message from Griff.</small></button></div><div id="secret-content" class="secret-content" aria-live="polite"><p>Hint: the little music note at the bottom is the backstage door. Tell a friend where to look.</p></div><p class="secret-stage-footer">NO PASSWORD. JUST KNOW WHERE TO LOOK.</p></div>`;
    document.body.append(overlay);
    // PS2-inspired audio is isolated to the Secret Stage; homepage audio is untouched.
    const secretBootAudio=new Audio('secret-stage-boot.mp3');
    const secretMenuAudio=new Audio();
    secretMenuAudio.src=(secretMenuAudio.canPlayType('audio/ogg; codecs="opus"') ? 'secret-stage-menu.ogg' : 'secret-stage-menu.mp3');
    secretBootAudio.preload='none'; secretBootAudio.volume=.78;
    secretMenuAudio.preload='none'; secretMenuAudio.loop=true; secretMenuAudio.volume=.22;
    // Short PS2-style effects are individually normalized and kept lightweight.
    const secretEffects={
      select:new Audio('secret-menu-select.mp3'),
      pickup:new Audio('secret-pickup.mp3'),
      lostCassette:new Audio('secret-lost-cassette.mp3'),
      transition:new Audio('secret-transition.mp3'),
      highScoreOne:new Audio('secret-highscore-1.mp3'),
      highScoreTwo:new Audio('secret-highscore-2.mp3')
    };
    Object.values(secretEffects).forEach(a=>{a.preload='none';a.volume=.42;});
    let secretSoundEnabled=true, secretBootFinished=false; let secretSoundMode='ps2'; try{secretSoundMode=localStorage.getItem('grifflistSoundTheme.v1')||'ps2';}catch(_){} secretSoundEnabled=secretSoundMode!=='silent';
    const classicEffects={select:new Audio('select.mp3'),pickup:new Audio('notes_ripple_up_01.mp3'),lostCassette:new Audio('you_rockR.mp3'),transition:new Audio('ui_sound_09R.mp3')}; Object.values(classicEffects).forEach(a=>{a.preload='none';a.volume=.42;});
    const playSecretEffect=(name)=>{
      if(!secretSoundEnabled||overlay.hidden)return;
      const a=secretSoundMode==='classic'?(classicEffects[name]||secretEffects[name]):secretEffects[name];if(!a)return;
      try{a.currentTime=0;const p=a.play();p?.catch?.(()=>{});}catch(_){}
    };
    const playRandomHighScore=()=>{
      if(!secretSoundEnabled||overlay.hidden)return;
      const choices=secretSoundMode==='classic'?[classicEffects.pickup,classicEffects.select]:[secretEffects.highScoreOne,secretEffects.highScoreTwo];
      const chosen=choices[Math.floor(Math.random()*choices.length)];
      try{chosen.currentTime=0;const p=chosen.play();p?.catch?.(()=>{});}catch(_){}
    };
    try{secretSoundEnabled=localStorage.getItem('grifflistSecretSound')!=='off' && secretSoundMode!=='silent';}catch(_){}
    document.addEventListener('grifflist-sound-mode',e=>{secretSoundMode=e.detail?.mode||'ps2';secretSoundEnabled=secretSoundMode!=='silent';updateSoundToggle();if(!secretSoundEnabled)stopSecretAudio();else if(!overlay.hidden){secretBootFinished=true;startSecretMenu();}});
    const soundToggle=overlay.querySelector('.secret-sound-toggle');
    const updateSoundToggle=()=>{soundToggle.textContent=secretSoundEnabled?'SOUND ON':'SOUND OFF';soundToggle.setAttribute('aria-pressed',String(secretSoundEnabled));soundToggle.setAttribute('aria-label',secretSoundEnabled?'Mute Secret Stage sounds':'Enable Secret Stage sounds');};
    const startSecretMenu=()=>{if(overlay.hidden||!secretSoundEnabled||!secretBootFinished)return;secretMenuAudio.play().catch(()=>{});};
    secretBootAudio.addEventListener('ended',()=>{secretBootFinished=true;startSecretMenu();});
    const stopSecretAudio=()=>{secretBootAudio.pause();secretMenuAudio.pause();Object.values(secretEffects).forEach(a=>{a.pause();try{a.currentTime=0;}catch(_){}});try{secretBootAudio.currentTime=0;secretMenuAudio.currentTime=0;}catch(_){}};
    const close=()=>{overlay.hidden=true;document.body.classList.remove('secret-stage-open');stopSecretAudio();secret.focus();};
    const reveal=()=>{document.body.classList.remove('secret-glitch-boot');overlay.hidden=false;document.body.classList.add('secret-stage-open');overlay.querySelector('.secret-close')?.focus();if(secretBootFinished)startSecretMenu();};
    secret.addEventListener('click',()=>{
      stopSecretAudio();secretBootFinished=false;
      document.body.classList.add('secret-glitch-boot');
      if(secretSoundEnabled && secretSoundMode==='ps2'){secretBootAudio.currentTime=0;secretBootAudio.play().then(()=>{}).catch(()=>{secretBootFinished=true;startSecretMenu();});}
      else {secretBootFinished=true;if(secretSoundEnabled)playSecretEffect('select');}
      if(reducedMotion())reveal();else window.setTimeout(reveal,460);
    });
    soundToggle.addEventListener('click',()=>{
      secretSoundEnabled=!secretSoundEnabled;updateSoundToggle();
      try{localStorage.setItem('grifflistSecretSound',secretSoundEnabled?'on':'off');}catch(_){}
      if(!secretSoundEnabled){secretBootAudio.pause();secretMenuAudio.pause();Object.values(secretEffects).forEach(a=>a.pause());}
      else if(!overlay.hidden){secretBootFinished=true;startSecretMenu();}
    });
    updateSoundToggle();
    overlay.addEventListener('click',e=>{
      if(e.target===overlay){close();return;}
      const button=e.target.closest('button');if(!button||!overlay.contains(button))return;
      if(button.matches('.secret-close,.secret-sound-toggle,.arcade-pick'))return;
      if(button.id==='lost-cassette')playSecretEffect('lostCassette');
      else if(button.classList.contains('secret-tile'))playSecretEffect('transition');
      else playSecretEffect('select');
    },true);
    overlay.querySelector('.secret-close').addEventListener('click',close);document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!overlay.hidden)close();});
    const content=$('#secret-content',overlay);
    $('#lost-cassette',overlay).addEventListener('click',()=>{content.innerHTML='<div class="cassette-flip"><div class="cassette-art large"><i></i><b></b></div><h3>SIDE B: THE LOST TRACK</h3><p>Every musician has a song that never made the setlist. This cassette is a place to reveal an acoustic demo, a hidden recording, or a story behind one of your songs.</p><p class="secret-note">For now, the tape is a teaser. Add your chosen recording when you are ready.</p></div>';});
    $('#secret-message-open',overlay).addEventListener('click',()=>{content.innerHTML='<h3>YOU FOUND IT. 🤘</h3><p>Thanks for taking the time to explore The Grifflist. The best things in rock and roll are often hidden just offstage.</p><p class="secret-note">- Griff</p>';});
    $('#high-score-open',overlay).addEventListener('click',()=>{
      content.innerHTML='<div class="mini-arcade"><h3>GUITAR PICK PANIC</h3><p>Tap as many picks as you can in 15 seconds.</p><div class="arcade-score">Score: <strong id="arcade-score">0</strong> · Time: <strong id="arcade-time">15</strong></div><div id="arcade-board" class="arcade-board"><button type="button" class="arcade-pick" aria-label="Catch guitar pick">◆</button></div><button type="button" class="button button-hot" id="arcade-start">START GAME</button><p id="arcade-status" role="status" aria-live="polite"></p></div>';
      const board=$('#arcade-board'),start=$('#arcade-start'),scoreEl=$('#arcade-score'),timeEl=$('#arcade-time'),status=$('#arcade-status');let score=0,time=15,timer=null;
      const pick=$('.arcade-pick',board);pick.addEventListener('click',()=>{if(!timer)return;score++;scoreEl.textContent=score;pick.style.left=(5+Math.random()*75)+'%';pick.style.top=(5+Math.random()*70)+'%';playSecretEffect('pickup');});
      start.addEventListener('click',()=>{if(timer)clearInterval(timer);score=0;time=15;scoreEl.textContent=score;timeEl.textContent=time;status.textContent='Rock on!';timer=setInterval(()=>{time--;timeEl.textContent=time;if(time<=0){clearInterval(timer);timer=null;status.textContent=`FINAL SCORE: ${score}. Try again and beat your record!`;try{const previous=Number(localStorage.getItem('grifflistArcadeBest')||0);if(score>previous){localStorage.setItem('grifflistArcadeBest',score);status.textContent+=` NEW PERSONAL BEST: ${score}!`;playRandomHighScore(); }else{status.textContent+=` Personal best: ${previous}.`;}}catch(_){}}},1000);});
    });
  }

  // Time Machine built from existing repertoire, without hard-coded song history.
  if (pageIsHome) {
    const contact=$('#contact');const tm=document.createElement('section');tm.className='section time-machine-section';tm.innerHTML='<div class="section-heading"><h2><span>Browse by Decade</span></h2></div><div class="time-machine-rail" id="time-machine-rail"></div><div id="time-machine-result" class="time-machine-result" aria-live="polite"></div>';
    appendExplore(tm);
    const rail=$('#time-machine-rail');const years=[1960,1970,1980,1990,2000,2010];years.forEach(y=>{const b=document.createElement('button');b.type='button';b.textContent=y+'s';b.addEventListener('click',()=>{const songs=getSongs().filter(s=>s.year>=y&&s.year<y+10);const result=$('#time-machine-result');result.textContent=songs.length?`${y}s: ${songs.slice(0,5).map(s=>s.title+' - '+s.artist).join(' · ')}${songs.length>5?' …':''}`:`No dated songs from the ${y}s are currently listed.`;play('scroll-sfx');});rail.append(b);});
    // Seasonal event card changes automatically by month.
    const m=new Date().getMonth();const seasonal=[['WINTER ROCK PICK','Find a winter road-trip anthem.'],['VALENTINE RIFFS','Pick a song to share.'],['SPRING SOUNDTRACK','Choose a fresh-season favourite.'],['MAY THE RIFFS BE WITH YOU','Choose your force-of-rock anthem.'],['CANADA DAY ROCK','Pick a song for the summer celebration.'],['SUMMER ROAD-TRIP','Choose a driving anthem.'],['SUMMER ROAD-TRIP','Choose a driving anthem.'],['BACK-TO-GIG SEASON','Pick your next live singalong.'],['AUTUMN AMPLIFIERS','Choose a soundtrack for cooler nights.'],['HALLOWEEN AFTER HOURS','Unlock a spooky backstage surprise.'],['REMEMBRANCE DAY REFLECTION','Choose a meaningful song; observe the day respectfully.'],['YEAR-END RIFF REWIND','Pick a song to close out the year.']][m];
    const event=document.createElement('section');event.className='section seasonal-event';event.innerHTML=`<div><p class="eyebrow">✦ SEASONAL PICK</p><h2>${seasonal[0]}</h2></div><button class="button button-quiet" id="seasonal-discover" type="button">🎸 PICK A SONG</button>`;appendExplore(event);$('#seasonal-discover')?.addEventListener('click',()=>{const songs=getSongs();if(!songs.length)return;const s=songs[Math.floor(Math.random()*songs.length)];const input=$('#request-song');if(input){input.value=s.title;$('#request-artist').value=s.artist;$('#request')?.scrollIntoView({behavior:reducedMotion()?'auto':'smooth'});}play('you-rock-sfx');});
  }

  // Tip wall: only confirmed records are shown; no dates or transaction IDs displayed.
  if(pageIsHome) {
    const contact=$('#contact');const wall=document.createElement('section');wall.className='section tip-wall-section';wall.innerHTML='<div class="section-heading"><h2><span>Encore Wall</span></h2></div><div id="tip-wall-list" class="tip-wall-list" aria-live="polite"></div>';
    appendExplore(wall);
    const list=$('#tip-wall-list');
    const renderTips=async()=>{const client=window.supabaseClient;if(!client||!list)return;try{const {data,error}=await client.from('confirmed_tips').select('display_name,amount_cad,requested_song').eq('confirmed',true).order('id',{ascending:false}).limit(50);if(error)throw error;list.replaceChildren();if(!data?.length){[['Rock Fan','$5','Sample'],['Backstage Buddy','$10','Sample'],['Anonymous','$3','Sample']].forEach(([name,amount])=>{const row=document.createElement('div');row.className='tip-wall-row tip-wall-sample';row.innerHTML='<strong>'+name+'</strong><b>'+amount+'</b><small>Sample</small>';list.append(row);});list.classList.add('tip-wall-samples');return;}data.forEach(t=>{const row=document.createElement('div');row.className='tip-wall-row';const who=document.createElement('strong');who.textContent=t.display_name||'Anonymous Rocker';const amount=document.createElement('b');amount.textContent=new Intl.NumberFormat('en-CA',{style:'currency',currency:'CAD',maximumFractionDigits:2}).format(Number(t.amount_cad)||0);row.append(who,amount);if(t.requested_song){const song=document.createElement('small');song.textContent='Requested: '+t.requested_song;row.append(song);}list.append(row);});if(data.length>3){[...list.children].forEach(row=>list.append(row.cloneNode(true)));list.classList.add('tip-wall-scrolling');}}catch(_){if(list&&!list.children.length){[['Rock Fan','$5'],['Backstage Buddy','$10'],['Anonymous','$3']].forEach(([name,amount])=>{const row=document.createElement('div');row.className='tip-wall-row tip-wall-sample';row.innerHTML='<strong>'+name+'</strong><b>'+amount+'</b><small>Sample</small>';list.append(row);});list.classList.add('tip-wall-samples');}}};
    renderTips();
  }

  // Admin-only tip ledger entry. The DB RLS policy remains the security boundary.
  if ($('#inbox-panel')) {
    const panel=$('#live-tools-panel');if(panel){const ledger=document.createElement('section');ledger.className='admin-panel';ledger.id='confirmed-tip-admin';ledger.innerHTML='<h2><span>Confirmed Tip Wall</span></h2><p>Add a tip only after verifying it in the payment provider or bank. The public page displays a chosen display name, amount, and optional requested song - never dates or payment references.</p><form id="confirmed-tip-form" class="admin-form"><label>Display name (optional)<input id="confirmed-tip-name" maxlength="50" placeholder="Nickname or Anonymous Rocker"></label><label>Confirmed amount (CAD)<input id="confirmed-tip-amount" type="number" min="0.01" step="0.01" required></label><label>Song requested (optional)<input id="confirmed-tip-song" maxlength="200" placeholder="Song title - artist"></label><button type="submit" class="button button-hot">ADD CONFIRMED TIP</button><p id="confirmed-tip-status" class="admin-status" role="status" aria-live="polite"></p></form><div id="confirmed-tip-admin-list"></div>';
      panel.insertAdjacentElement('afterend',ledger);
      $('#confirmed-tip-form').addEventListener('submit',async e=>{e.preventDefault();const status=$('#confirmed-tip-status'),client=window.supabaseClient;const amount=Number($('#confirmed-tip-amount').value);if(!client){status.textContent='Database unavailable.';return;}try{const {error}=await client.from('confirmed_tips').insert({display_name:$('#confirmed-tip-name').value.trim()||'Anonymous Rocker',amount_cad:amount,requested_song:$('#confirmed-tip-song').value.trim()||null,confirmed:true});if(error)throw error;status.textContent='Confirmed tip added to the Encore Wall.';e.target.reset();}catch(err){status.textContent='Could not save tip. Apply the included SQL migration and confirm you are signed in as the authorized admin.';}});
    }
  }

  // Secret Stage sound selector: controls only Secret Stage audio, never homepage sounds.
  if (footer) {
    const sound=document.createElement('label');sound.className='sound-theme-control';sound.innerHTML='<span aria-hidden="true">♬</span><span>Secret Stage</span><select id="ui-sound-theme" aria-label="Secret Stage sound mode"><option value="ps2">PS2 Sounds</option><option value="classic">Classic Sounds</option><option value="silent">Muted</option></select>';
    footer.append(sound);let chosen='ps2';try{chosen=localStorage.getItem('grifflistSoundTheme.v1')||'ps2';}catch(_){}$('#ui-sound-theme').value=chosen;
    const applySecretSoundMode=value=>{try{localStorage.setItem('grifflistSoundTheme.v1',value);}catch(_){};document.dispatchEvent(new CustomEvent('grifflist-sound-mode',{detail:{mode:value}}));};
    applySecretSoundMode(chosen);$('#ui-sound-theme').addEventListener('change',e=>applySecretSoundMode(e.target.value));
  }
  if('serviceWorker' in navigator && location.protocol.startsWith('http')) window.addEventListener('load',()=>navigator.serviceWorker.register('./sw.js').catch(()=>{}));
})();


// Give successful request confirmations a short, accessible visual cue.
(() => { const el=document.querySelector('#form-status'); if(!el)return; const observer=new MutationObserver(()=>{ if(/request sent|request saved|priority request submitted/i.test(el.textContent||'')){el.classList.remove('request-confirmation-pop');void el.offsetWidth;el.classList.add('request-confirmation-pop');} }); observer.observe(el,{childList:true,subtree:true,characterData:true}); })();
