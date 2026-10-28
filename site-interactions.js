/* Reuses the homepage's original sound effects on the added pages. */
(()=>{const map={nav:'ui-sound-01r.mp3',action:'select.mp3',success:'you_rockR.mp3',tip:'cash.mp3',open:'notes_ripple_up_01.mp3',close:'ui_sound_09R.mp3'};let last=0;function play(file){const now=Date.now();if(now-last<90)return;last=now;try{const a=new Audio(file);a.preload='none';a.volume=.42;a.play().catch(()=>{});}catch(e){}}document.addEventListener('click',e=>{const el=e.target.closest('button,a,summary,[role=button]');if(!el||el.disabled||el.closest('.secret-stage-overlay'))return;if(el.matches('.top-nav a, .header-logo-link'))play(map.nav);else if(el.id==='broadcast-start'||el.id==='broadcast-stop'||el.id==='quick-go-live'||el.id==='quick-end-live')play(map.action);else if(el.closest('.live-tip-card')||el.id==='copy-email')play(map.tip);else if(el.matches('button'))play(map.action);else if(el.matches('a'))play(map.open);},true);document.addEventListener('submit',e=>{if(e.target.matches('form'))play(map.success);},true);})();


/* Bonus experiences bundle: see BONUS-EXPERIENCES-NOTES.txt */
/* The Grifflist — bonus experiences. Lightweight, dependency-free enhancements. */
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


  // Apply the site's two-tone headline treatment consistently across public pages.
  if (!$('#inbox-panel')) $$('.section-heading h2, .tip-copy h2, .contact-section h2, .watch-live-page h1, .explore-main h1').forEach(h=>{if(h.querySelector('span'))return;const txt=h.textContent.trim().split(/\s+/);if(txt.length<2)return;const last=txt.pop();h.textContent='';h.append(document.createTextNode(txt.join(' ')+' '));const span=document.createElement('span');span.textContent=last;h.append(span);});

  // Catalog discovery tools.
  if (pageIsHome) {
    const catalog = $('#catalog');
    const tools = document.createElement('section');
    tools.className='section bonus-song-tools';
    tools.innerHTML=`<div class="section-heading"><h2><span>Find a Song</span></h2></div>
      <div class="bonus-tool-grid"><button class="button button-hot" id="surprise-song" type="button">🎸 Pick a Song for Me</button>
      </div>
      <div id="song-picker-result" class="song-picker-result" aria-live="polite" role="status">Your next anthem is waiting.</div>
      <div class="share-card-tools"><button id="make-song-card" class="button button-quiet" type="button">Make a Song Image to Share</button><span id="song-card-status" role="status" aria-live="polite"></span></div>`;
    appendExplore(tools);
    const getFiltered = () => {
      const era = $('#rock-era-picker')?.value || 'all';
      const songs=getSongs();
      return era==='all'?songs:songs.filter(s=>s.year>=Number(era)&&s.year<Number(era)+10);
    };
    const selectForRequest = (song) => {
      if(!song) return;
      const title=$('#request-song'), artist=$('#request-artist'), hint=$('#request-hint');
      if(title)title.value=song.title;if(artist)artist.value=song.artist;if(hint){hint.hidden=false;hint.classList.add('hint-pulse');}
      $('#request')?.scrollIntoView({behavior:reducedMotion()?'auto':'smooth',block:'start'});
      const result=$('#song-picker-result'); if(result)result.textContent=`${song.title} — ${song.artist}. Ready to request!`;
      play('notes-ripple-sfx');
    };
    $('#rock-era-picker')?.addEventListener('change',e=>{
      const v=e.target.value; const decade=v==='all'?'All':({'1960':'60s','1970':'70s','1980':'80s','1990':'90s','2000':'2000s','2010':'2010s'}[v]||'All');
      const chip=$$('.decade-filters button').find(b=>b.textContent.trim().toLowerCase()===(decade==='All'?'all decades':decade.toLowerCase()));
      if(chip)chip.click();
      const result=$('#song-picker-result'); if(result)result.textContent=decade==='All'?'Browsing all eras.':`Rock era selected: ${decade}. Browse the matching songs above.`;
    });
    $('#surprise-song')?.addEventListener('click',()=>{const a=getFiltered();if(!a.length)return;selectForRequest(a[Math.floor(Math.random()*a.length)]);});
    $('#make-song-card')?.addEventListener('click',async()=>{
      const last=$('#song-picker-result');let title=last?.dataset.title||$('#request-song')?.value||'';let artist=last?.dataset.artist||$('#request-artist')?.value||'';
      if(!title){const all=getSongs();if(!all.length)return;const s=all[Math.floor(Math.random()*all.length)];title=s.title;artist=s.artist;}
      const status=$('#song-card-status');
      try{
        const canvas=document.createElement('canvas');canvas.width=1080;canvas.height=1080;const c=canvas.getContext('2d');
        const grad=c.createLinearGradient(0,0,1080,1080);grad.addColorStop(0,'#090909');grad.addColorStop(.6,'#21160e');grad.addColorStop(1,'#7c211b');c.fillStyle=grad;c.fillRect(0,0,1080,1080);
        c.strokeStyle='#e3a33a';c.lineWidth=8;c.strokeRect(42,42,996,996);c.fillStyle='#e3a33a';c.font='bold 44px sans-serif';c.fillText('THE GRIFFLIST',82,132);c.fillStyle='#fff2d2';c.font='900 78px sans-serif';wrapCanvas(c,title,82,360,900,92);c.fillStyle='#ded5c8';c.font='48px sans-serif';wrapCanvas(c,artist,82,620,900,64);c.fillStyle='#e3a33a';c.font='bold 30px sans-serif';c.fillText('PICK YOUR NEXT ANTHEM',82,930);
        const blob=await new Promise(res=>canvas.toBlob(res,'image/png'));const file=new File([blob], 'grifflist-song-card.png',{type:'image/png'});
        if(navigator.canShare?.({files:[file]})){await navigator.share({files:[file],title:`${title} — ${artist}`,text:'A song from The Grifflist live repertoire'});status.textContent='Share card opened.';}
        else{const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download='grifflist-song-card.png';a.click();setTimeout(()=>URL.revokeObjectURL(url),1500);status.textContent='Share card downloaded. Attach it to your post or story.';}
      }catch(err){if(status)status.textContent='Could not create the card in this browser. Try again or use the song title text.';}
    });
  }
  function wrapCanvas(c,text,x,y,maxWidth,lineHeight){const words=String(text).split(' ');let line='';for(const word of words){const test=line?line+' '+word:word;if(c.measureText(test).width>maxWidth&&line){c.fillText(line,x,y);line=word;y+=lineHeight;}else line=test;}if(line)c.fillText(line,x,y);}

  // Secret Stage: deliberately discreet amp button at the footer, no code required.
  if (footer) {
    const secret=footer.querySelector('.secret-stage-trigger') || document.createElement('button');secret.type='button';secret.className='secret-stage-trigger';secret.setAttribute('aria-label','Hidden amp');secret.title='';secret.textContent='♬';if(!secret.isConnected)footer.append(secret);
    const overlay=document.createElement('div');overlay.className='secret-stage-overlay';overlay.id='secret-stage-overlay';overlay.hidden=true;
    overlay.innerHTML=`<div class="secret-stage-panel" role="dialog" aria-modal="true" aria-labelledby="secret-stage-title"><button type="button" class="secret-close" aria-label="Close secret stage">×</button><button type="button" class="secret-sound-toggle" aria-pressed="true" aria-label="Mute Secret Stage sounds">SOUND ON</button><p class="secret-kicker">UNLISTED AREA · LEVEL 99</p><h2 id="secret-stage-title">THE SECRET STAGE</h2><p class="secret-intro">You found the backstage door. Welcome to the part of The Grifflist that isn't on the setlist.</p><div class="secret-stage-grid"><button type="button" class="secret-tile" id="lost-cassette"><span class="cassette-art" aria-hidden="true"><i></i><b></b></span><strong>THE LOST CASSETTE</strong><small>Flip the tape for a hidden note.</small></button><button type="button" class="secret-tile" id="high-score-open"><span class="arcade-icon" aria-hidden="true">★<br>HI-SCORE</span><strong>BACKSTAGE ARCADE</strong><small>Catch the guitar picks.</small></button><button type="button" class="secret-tile" id="secret-message-open"><span class="secret-sparkle" aria-hidden="true">✦</span><strong>THE HIDDEN NOTE</strong><small>A little message from Griff.</small></button></div><div id="secret-content" class="secret-content" aria-live="polite"><p>Hint: the little music note at the bottom is the backstage door. Tell a friend where to look.</p></div><p class="secret-stage-footer">NO PASSWORD. JUST KNOW WHERE TO LOOK.</p></div>`;
    document.body.append(overlay);
    // PS2-inspired audio is isolated to the Secret Stage; homepage audio is untouched.
    const secretBootAudio=new Audio('secret-stage-boot.mp3');
    const secretMenuAudio=new Audio('secret-stage-menu.mp3');
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
    let secretSoundEnabled=true, secretBootFinished=false;
    const playSecretEffect=(name)=>{
      if(!secretSoundEnabled||overlay.hidden)return;
      const a=secretEffects[name];if(!a)return;
      try{a.currentTime=0;const p=a.play();p?.catch?.(()=>{});}catch(_){}
    };
    const playRandomHighScore=()=>{
      if(!secretSoundEnabled||overlay.hidden)return;
      const choices=[secretEffects.highScoreOne,secretEffects.highScoreTwo];
      const chosen=choices[Math.floor(Math.random()*choices.length)];
      try{chosen.currentTime=0;const p=chosen.play();p?.catch?.(()=>{});}catch(_){}
    };
    try{secretSoundEnabled=localStorage.getItem('grifflistSecretSound')!=='off';}catch(_){}
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
      if(secretSoundEnabled){secretBootAudio.currentTime=0;secretBootAudio.play().then(()=>{}).catch(()=>{secretBootFinished=true;startSecretMenu();});}
      else secretBootFinished=true;
      if(reducedMotion())reveal();else window.setTimeout(reveal,460);
    });
    soundToggle.addEventListener('click',()=>{
      secretSoundEnabled=!secretSoundEnabled;updateSoundToggle();
      try{localStorage.setItem('grifflistSecretSound',secretSoundEnabled?'on':'off');}catch(_){}
      if(!secretSoundEnabled){secretBootAudio.pause();secretMenuAudio.pause();Object.values(secretEffects).forEach(a=>a.pause());}
      else if(!overlay.hidden){if(secretBootFinished)startSecretMenu();else secretBootAudio.play().catch(()=>{secretBootFinished=true;startSecretMenu();});}
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
    $('#secret-message-open',overlay).addEventListener('click',()=>{content.innerHTML='<h3>YOU FOUND IT. 🤘</h3><p>Thanks for taking the time to explore The Grifflist. The best things in rock and roll are often hidden just offstage.</p><p class="secret-note">— Griff</p>';});
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
    const rail=$('#time-machine-rail');const years=[1960,1970,1980,1990,2000,2010];years.forEach(y=>{const b=document.createElement('button');b.type='button';b.textContent=y+'s';b.addEventListener('click',()=>{const songs=getSongs().filter(s=>s.year>=y&&s.year<y+10);const result=$('#time-machine-result');result.textContent=songs.length?`${y}s: ${songs.slice(0,5).map(s=>s.title+' — '+s.artist).join(' · ')}${songs.length>5?' …':''}`:`No dated songs from the ${y}s are currently listed.`;play('scroll-sfx');});rail.append(b);});
    // Seasonal event card changes automatically by month.
    const m=new Date().getMonth();const seasonal=[['WINTER ROCK PICK','Find a winter road-trip anthem.'],['VALENTINE RIFFS','Pick a song to share.'],['SPRING SOUNDTRACK','Choose a fresh-season favourite.'],['MAY THE RIFFS BE WITH YOU','Choose your force-of-rock anthem.'],['CANADA DAY ROCK','Pick a song for the summer celebration.'],['SUMMER ROAD-TRIP','Choose a driving anthem.'],['SUMMER ROAD-TRIP','Choose a driving anthem.'],['BACK-TO-GIG SEASON','Pick your next live singalong.'],['AUTUMN AMPLIFIERS','Choose a soundtrack for cooler nights.'],['HALLOWEEN AFTER HOURS','Unlock a spooky backstage surprise.'],['REMEMBRANCE DAY REFLECTION','Choose a meaningful song; observe the day respectfully.'],['YEAR-END RIFF REWIND','Pick a song to close out the year.']][m];
    const event=document.createElement('section');event.className='section seasonal-event';event.innerHTML=`<div><p class="eyebrow">✦ SEASONAL PICK</p><h2>${seasonal[0]}</h2></div><button class="button button-quiet" id="seasonal-discover" type="button">🎸 PICK A SONG</button>`;appendExplore(event);$('#seasonal-discover')?.addEventListener('click',()=>{const songs=getSongs();if(!songs.length)return;const s=songs[Math.floor(Math.random()*songs.length)];const input=$('#request-song');if(input){input.value=s.title;$('#request-artist').value=s.artist;$('#request')?.scrollIntoView({behavior:reducedMotion()?'auto':'smooth'});}play('you-rock-sfx');});
  }

  // Tip wall: only confirmed records are shown; no dates or transaction IDs displayed.
  if(pageIsHome) {
    const contact=$('#contact');const wall=document.createElement('section');wall.className='section tip-wall-section';wall.innerHTML='<div class="section-heading"><h2><span>Encore Wall</span></h2></div><div id="tip-wall-list" class="tip-wall-list" aria-live="polite"></div>';
    appendExplore(wall);
    const list=$('#tip-wall-list');
    const renderTips=async()=>{const client=window.supabaseClient;if(!client||!list)return;try{const {data,error}=await client.from('confirmed_tips').select('display_name,amount_cad,requested_song').eq('confirmed',true).order('id',{ascending:false}).limit(50);if(error)throw error;list.replaceChildren();if(!data?.length){[['Rock Fan','$5','Sample'],['Backstage Buddy','$10','Sample'],['Anonymous','$3','Sample']].forEach(([name,amount])=>{const row=document.createElement('div');row.className='tip-wall-row tip-wall-sample';row.innerHTML='<strong>'+name+'</strong><b>'+amount+'</b>';list.append(row);});list.classList.add('tip-wall-samples');return;}data.forEach(t=>{const row=document.createElement('div');row.className='tip-wall-row';const who=document.createElement('strong');who.textContent=t.display_name||'Anonymous Rocker';const amount=document.createElement('b');amount.textContent=new Intl.NumberFormat('en-CA',{style:'currency',currency:'CAD',maximumFractionDigits:2}).format(Number(t.amount_cad)||0);row.append(who,amount);if(t.requested_song){const song=document.createElement('small');song.textContent='Requested: '+t.requested_song;row.append(song);}list.append(row);});if(data.length>3){[...list.children].forEach(row=>list.append(row.cloneNode(true)));list.classList.add('tip-wall-scrolling');}}catch(_){if(list&&!list.children.length){[['Rock Fan','$5'],['Backstage Buddy','$10'],['Anonymous','$3']].forEach(([name,amount])=>{const row=document.createElement('div');row.className='tip-wall-row tip-wall-sample';row.innerHTML='<strong>'+name+'</strong><b>'+amount+'</b>';list.append(row);});list.classList.add('tip-wall-samples');}}};
    renderTips();
  }

  // Admin-only tip ledger entry. The DB RLS policy remains the security boundary.
  if ($('#inbox-panel')) {
    const panel=$('#live-tools-panel');if(panel){const ledger=document.createElement('section');ledger.className='admin-panel';ledger.id='confirmed-tip-admin';ledger.innerHTML='<h2><span>Confirmed Tip Wall</span></h2><p>Add a tip only after verifying it in the payment provider or bank. The public page displays a chosen display name, amount, and optional requested song — never dates or payment references.</p><form id="confirmed-tip-form" class="admin-form"><label>Display name (optional)<input id="confirmed-tip-name" maxlength="50" placeholder="Nickname or Anonymous Rocker"></label><label>Confirmed amount (CAD)<input id="confirmed-tip-amount" type="number" min="0.01" step="0.01" required></label><label>Song requested (optional)<input id="confirmed-tip-song" maxlength="200" placeholder="Song title — artist"></label><button type="submit" class="button button-hot">ADD CONFIRMED TIP</button><p id="confirmed-tip-status" class="admin-status" role="status" aria-live="polite"></p></form><div id="confirmed-tip-admin-list"></div>';
      panel.insertAdjacentElement('afterend',ledger);
      $('#confirmed-tip-form').addEventListener('submit',async e=>{e.preventDefault();const status=$('#confirmed-tip-status'),client=window.supabaseClient;const amount=Number($('#confirmed-tip-amount').value);if(!client){status.textContent='Database unavailable.';return;}try{const {error}=await client.from('confirmed_tips').insert({display_name:$('#confirmed-tip-name').value.trim()||'Anonymous Rocker',amount_cad:amount,requested_song:$('#confirmed-tip-song').value.trim()||null,confirmed:true});if(error)throw error;status.textContent='Confirmed tip added to the Encore Wall.';e.target.reset();}catch(err){status.textContent='Could not save tip. Apply the included SQL migration and confirm you are signed in as the authorized admin.';}});
    }
  }

  // Sound theme control placeholder. The requested PS2 audio files will be added when supplied.
  if (footer) {
    const sound=document.createElement('label');sound.className='sound-theme-control';sound.innerHTML='♬ Secret Stage <select id="ui-sound-theme" aria-label="Secret Stage sound setting"><option value="classic">Classic</option><option value="ps2">PS2</option><option value="silent">Muted</option></select>';
    footer.append(sound);let chosen='classic';try{chosen=localStorage.getItem('grifflistSoundTheme.v1')||'classic';}catch(_){}$('#ui-sound-theme').value=chosen;
    $('#ui-sound-theme').addEventListener('change',e=>{try{localStorage.setItem('grifflistSoundTheme.v1',e.target.value);}catch(_){} if(e.target.value==='silent'){document.querySelectorAll('audio').forEach(a=>a.muted=true);}else{document.querySelectorAll('audio').forEach(a=>a.muted=false);}});
  }

  // Install prompt where supported.
  let installPrompt=null;window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();installPrompt=e;let btn=$('#install-grifflist');if(!btn){btn=document.createElement('button');btn.id='install-grifflist';btn.className='button button-quiet';btn.textContent='INSTALL THE GRIFFLIST';footer?.append(btn);}btn.hidden=false;btn.addEventListener('click',async()=>{if(!installPrompt){alert('On Android, use your browser menu and choose Install app or Add to Home screen.');return;}installPrompt.prompt();await installPrompt.userChoice;installPrompt=null;btn.hidden=true;},{once:true});});
  if('serviceWorker' in navigator && location.protocol.startsWith('http')) window.addEventListener('load',()=>navigator.serviceWorker.register('./sw.js').catch(()=>{}));
})();


// Give successful request confirmations a short, accessible visual cue.
(() => { const el=document.querySelector('#form-status'); if(!el)return; const observer=new MutationObserver(()=>{ if(/request sent|request saved|priority request submitted/i.test(el.textContent||'')){el.classList.remove('request-confirmation-pop');void el.offsetWidth;el.classList.add('request-confirmation-pop');} }); observer.observe(el,{childList:true,subtree:true,characterData:true}); })();
