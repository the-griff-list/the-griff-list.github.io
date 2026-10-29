/* Reuses the homepage's original sound effects on the added pages. */
(()=>{const map={nav:'ui-sound-01r.mp3',action:'select.mp3',success:'you_rockR.mp3',tip:'cash.mp3',open:'notes_ripple_up_01.mp3',close:'ui_sound_09R.mp3'};let last=0;function play(file){const now=Date.now();if(now-last<90)return;last=now;try{const a=new Audio(file);a.preload='none';a.volume=.42;a.play().catch(()=>{});}catch(e){}}document.addEventListener('click',e=>{const el=e.target.closest('button,a,summary,[role=button]');if(!el||el.disabled||el.closest('.secret-stage-overlay')||el.matches('.secret-stage-trigger'))return;if(el.matches('.top-nav a, .header-logo-link'))play(map.nav);else if(el.id==='broadcast-start'||el.id==='broadcast-stop'||el.id==='quick-go-live'||el.id==='quick-end-live')play(map.action);else if(el.closest('.live-tip-card')||el.id==='copy-email')play(map.tip);else if(el.matches('button'))play(map.action);else if(el.matches('a'))play(map.open);},true);document.addEventListener('submit',e=>{if(e.target.matches('form'))play(map.success);},true);})();


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
  const appendExplore = (el) => { if (exploreContent) exploreContent.append(el); else if (document.querySelector('main')) document.querySelector('main').append(el); };
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
  if (footer && !document.body.classList.contains('admin-page') && !$('#inbox-panel')) {
    const slot=$('.footer-appearance-slot',footer);
    (slot||footer).append(themeControls);
    themeControls.addEventListener('click',e=>{const b=e.target.closest('[data-theme]');if(b){applyTheme(b.dataset.theme);play('select-sfx');}});
  }
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

  // Seasonal holiday styling is intentionally paused until the final design review.

  // Secret Stage: deliberately discreet amp button at the footer, no code required.
  if (footer) {
    const secret=footer.querySelector('.secret-stage-trigger') || document.createElement('button');secret.type='button';secret.className='secret-stage-trigger';secret.setAttribute('aria-label','Open Secret Menu');secret.title='Open the PS2-inspired Secret Menu';secret.innerHTML='♬ <span>Secret Menu</span>';if(!secret.isConnected)footer.insertBefore(secret,footer.querySelector('.footer-bottom-row'));
    const overlay=document.createElement('div');overlay.className='secret-stage-overlay';overlay.id='secret-stage-overlay';overlay.hidden=true;
    overlay.innerHTML=`<div class="secret-stage-panel" role="dialog" aria-modal="true" aria-labelledby="secret-stage-title"><button type="button" class="secret-close" aria-label="Return to home screen" title="Home">⌂</button><h2 id="secret-stage-title">SECRET MENU</h2><div class="secret-stage-grid"><button type="button" class="secret-tile" id="lost-cassette"><span class="cassette-art" aria-hidden="true"><i></i><b></b></span><strong>THE LOST CASSETTE</strong></button><button type="button" class="secret-tile" id="high-score-open"><span class="arcade-icon" aria-hidden="true">★<br>HI-SCORE</span><strong>BACKSTAGE ARCADE</strong></button><button type="button" class="secret-tile" id="secret-message-open"><span class="secret-sparkle" aria-hidden="true">✦</span><strong>THE HIDDEN NOTE</strong></button></div><div id="secret-content" class="secret-content" aria-live="polite"></div></div>`;
    document.body.append(overlay);
    // PS2 effects are isolated to the Secret Menu; homepage menu audio pauses while it is open.
    const homeMenuAudio=document.getElementById('menu-screen-audio');
    let resumeHomeMenuOnClose=false;
    const secretBootAudio=new Audio('secret-stage-boot.mp3');
    const secretAmbience=new Audio('secret-stage-ambience.ogg');
    secretBootAudio.preload='none'; secretBootAudio.volume=.58;
    secretAmbience.preload='none'; secretAmbience.loop=true; secretAmbience.volume=.34;
    const secretEffects={
      select:new Audio('secret-menu-select.mp3'),
      pickup:new Audio('secret-pickup.mp3'),
      lostCassette:new Audio('secret-lost-cassette.mp3'),
      transition:new Audio('secret-transition.mp3'),
      highScoreOne:new Audio('secret-highscore-1.mp3'),
      highScoreTwo:new Audio('secret-highscore-2.mp3')
    };
    Object.values(secretEffects).forEach(a=>{a.preload='none';a.volume=.42;});
    const playSecretEffect=(name)=>{
      if(overlay.hidden)return;
      const original=secretEffects[name];if(!original)return;
      // Arcade pickup: use a fresh player per tap and gently fade the attack/release
      // to prevent the clipped click heard when the same MP3 is restarted rapidly.
      if(name==='pickup'){
        try{
          const a=new Audio(original.src);a.preload='auto';a.volume=0.01;
          const fadeIn=0.018,fadeOut=0.095,peak=0.23;let raf=0;
          const envelope=()=>{
            if(a.paused||!Number.isFinite(a.duration)||a.duration<=0)return;
            const t=a.currentTime,remaining=a.duration-t;
            let v=peak;
            if(t<fadeIn)v=peak*Math.max(.05,t/fadeIn);
            if(remaining<fadeOut)v=Math.min(v,peak*Math.max(0,remaining/fadeOut));
            a.volume=Math.max(0,Math.min(peak,v));
            if(!a.paused&&remaining>0)raf=requestAnimationFrame(envelope);
          };
          a.addEventListener('ended',()=>cancelAnimationFrame(raf),{once:true});
          a.play().then(()=>{raf=requestAnimationFrame(envelope);}).catch(()=>{});
        }catch(_){}
        return;
      }
      try{original.currentTime=0;const p=original.play();p?.catch?.(()=>{});}catch(_){}
    };
    const playRandomHighScore=()=>{
      if(overlay.hidden)return;
      const choices=[secretEffects.highScoreOne,secretEffects.highScoreTwo];
      const chosen=choices[Math.floor(Math.random()*choices.length)];
      try{chosen.currentTime=0;const p=chosen.play();p?.catch?.(()=>{});}catch(_){}
    };
    const stopSecretAudio=()=>{
      [secretBootAudio,secretAmbience,...Object.values(secretEffects)].forEach(a=>{a.pause();try{a.currentTime=0;}catch(_){}});
    };
    const startSecretAmbience=()=>{
      if(overlay.hidden||!document.body.classList.contains('secret-stage-open'))return;
      if(!secretBootAudio.paused&&!secretBootAudio.ended)return;
      secretAmbience.pause();try{secretAmbience.currentTime=0;}catch(_){}
      secretAmbience.play().catch(()=>{});
    };
    secretBootAudio.addEventListener('ended',startSecretAmbience);
    const close=()=>{
      overlay.hidden=true;document.body.classList.remove('secret-stage-open','secret-glitch-boot');stopSecretAudio();
      // Returning home always restarts the home menu track from its beginning.
      if(homeMenuAudio){try{homeMenuAudio.pause();homeMenuAudio.currentTime=0;}catch(_){}homeMenuAudio.play().catch(()=>{});}
      resumeHomeMenuOnClose=false;
    };
    const reveal=()=>{
      document.body.classList.remove('secret-glitch-boot');overlay.hidden=false;document.body.classList.add('secret-stage-open');
      overlay.querySelector('.secret-close')?.focus();homeMenuAudio?.pause();
      // Let the full boot track finish; its ended event starts the looping ambience.
      if(secretBootAudio.paused||secretBootAudio.ended)startSecretAmbience();
    };
    secret.addEventListener('click',()=>{
      resumeHomeMenuOnClose=Boolean(homeMenuAudio&&!homeMenuAudio.paused);
      if(homeMenuAudio){homeMenuAudio.pause();try{homeMenuAudio.currentTime=0;}catch(_){}}
      stopSecretAudio();document.body.classList.add('secret-stage-open','secret-glitch-boot');
      secretBootAudio.currentTime=0;secretBootAudio.play().catch(()=>{startSecretAmbience();});
      if(reducedMotion())reveal();else window.setTimeout(reveal,460);
    });
    overlay.addEventListener('click',e=>{
      if(e.target===overlay){close();return;}
      const button=e.target.closest('button');if(!button||!overlay.contains(button))return;
      if(button.matches('.secret-close,.secret-sound-toggle,.arcade-pick'))return;
      if(button.id==='lost-cassette')playSecretEffect('lostCassette');
      else if(button.classList.contains('secret-tile'))playSecretEffect('transition');
      else playSecretEffect('select');
    },true);
    overlay.querySelector('.secret-close').addEventListener('click',()=>{close();if(!pageIsHome)window.location.href='index.html#top';else window.scrollTo({top:0,behavior:reducedMotion()?'auto':'smooth'});});document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!overlay.hidden)close();});
    const content=$('#secret-content',overlay);
    $('#lost-cassette',overlay).addEventListener('click',()=>{content.innerHTML='<div class="cassette-flip"><div class="cassette-art large"><i></i><b></b></div><h3>SIDE B: THE LOST TRACK</h3><p class="secret-note">Original music is on the way. Stay tuned for new sounds from The Grifflist.</p></div>';content.scrollIntoView({behavior:reducedMotion()?'auto':'smooth',block:'start'});});
    $('#secret-message-open',overlay).addEventListener('click',()=>{content.innerHTML='<h3>YOU FOUND IT. 🤘</h3><p>Thanks for taking the time to explore The Grifflist. The best things in rock and roll are often hidden just offstage.</p><p class="secret-note">- Griff</p>';content.scrollIntoView({behavior:reducedMotion()?'auto':'smooth',block:'start'});});
    $('#high-score-open',overlay).addEventListener('click',()=>{
      content.innerHTML='<div class="mini-arcade"><h3>GUITAR PICK PANIC</h3><p class="arcade-instructions">TAP THE PICKS — 15 SECONDS!</p><div class="arcade-score">Score: <strong id="arcade-score">0</strong> · Time: <strong id="arcade-time">15</strong></div><div id="arcade-board" class="arcade-board"><div id="arcade-countdown" class="arcade-countdown" aria-live="assertive" hidden></div><button type="button" class="arcade-pick" aria-label="Catch guitar pick"><img class="arcade-pick-art" src="arcade-pick-treynor.png" alt="" aria-hidden="true" draggable="false"></button></div><button type="button" class="button button-hot" id="arcade-start">START GAME</button><p id="arcade-status" role="status" aria-live="polite"></p><section class="arcade-leaderboard" aria-labelledby="arcade-leaderboard-title"><h4 id="arcade-leaderboard-title">HIGH SCORES</h4><ol id="arcade-leaderboard-list"><li>Loading scores…</li></ol></section></div>';
      const board=$('#arcade-board'),start=$('#arcade-start'),scoreEl=$('#arcade-score'),timeEl=$('#arcade-time'),status=$('#arcade-status'),leaderboard=$('#arcade-leaderboard-list');let score=0,time=15,timer=null;
      const loadLeaderboard=async()=>{
        const client=window.supabaseClient;
        if(!leaderboard)return;
        if(!client){leaderboard.innerHTML='<li>Online leaderboard needs Supabase setup.</li>';return;}
        try{
          const {data,error}=await client.from('arcade_leaderboard').select('player_name,score').order('score',{ascending:false}).order('created_at',{ascending:true}).limit(10);
          if(error)throw error;
          leaderboard.innerHTML='';
          if(!data?.length){leaderboard.innerHTML='<li>Be the first on the board!</li>';return;}
          const blockedDisplayNames=/\b(mike\s*hunt|gabe\s*owners?|rock\s*star|asshole|arsehole|bastard|bitch|blowjob|bullshit|cock|cocksucker|cunt|dickhead|dick|dildo|fag|faggot|fuck\w*|motherfucker|nigger|nonce|piss|porn|prick|rape|retard|shag|shit\w*|slut|spunk|twat|wanker|whore)\b/i;const cleanEntries=data.filter(entry=>!blockedDisplayNames.test(String(entry.player_name||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'')));if(!cleanEntries.length){leaderboard.innerHTML='<li>Be the first on the board!</li>';return;}cleanEntries.forEach((entry,index)=>{const li=document.createElement('li');const name=document.createElement('span');name.textContent=entry.player_name;const points=document.createElement('b');points.textContent=String(entry.score);li.append(name,points);leaderboard.append(li);});
        }catch(_){leaderboard.innerHTML='<li>Leaderboard will appear after Supabase setup.</li>';}
      };
      loadLeaderboard();
      const saveLeaderboardScore=async(finalScore)=>{
        const client=window.supabaseClient;if(!client)return;
        let playerName=window.localStorage?.getItem('grifflistArcadeName')||'';
        if(finalScore<=0)return;
        status.textContent='YOU WON A HIGH SCORE!';
        const blockedNamePatterns=[/\bmike\s*hunt\b/,/\bgabe\s*owners?\b/,/\brock\s*star\b/,/\basshole\b/,/\barsehole\b/,/\bbastard\b/,/\bbitch\b/,/\bblowjob\b/,/\bbullshit\b/,/\bcock\b/,/\bcocksucker\b/,/\bcunt\b/,/\bdickhead\b/,/\bdick\b/,/\bdildo\b/,/\bfag\b/,/\bfaggot\b/,/\bfuck\w*\b/,/\bmotherfucker\b/,/\bnigger\b/,/\bnonce\b/,/\bpiss\b/,/\bporn\b/,/\bprick\b/,/\brape\b/,/\bretard\b/,/\bshag\b/,/\bshit\w*\b/,/\bslut\b/,/\bspunk\b/,/\btwat\b/,/\bwanker\b/,/\bwhore\b/];
        const normalizeName=value=>String(value||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[0@]/g,m=>m==='0'?'o':'a').replace(/[1!]/g,'i').replace(/[$]/g,'s').replace(/[^a-z]+/g,' ');
        const validName=value=>{const clean=String(value||'').trim().replace(/[<>]/g,'').replace(/\s+/g,' ').slice(0,24);const normalized=normalizeName(clean);return clean.length>=2&&/[a-zA-ZÀ-ÿ]/.test(clean)&&!blockedNamePatterns.some(rx=>rx.test(normalized))&&!/\b(mikehunt|gabeowners?)\b/.test(normalized.replace(/\s/g,''));};
        if(!playerName){playerName=window.prompt('YOU WON A HIGH SCORE!\nEnter your name for the leaderboard.','')||'';}
        playerName=String(playerName).trim().replace(/[<>]/g,'').replace(/\s+/g,' ').slice(0,24);
        if(!validName(playerName)){playerName=window.prompt('Please enter a respectful name for the leaderboard (up to 24 characters).','')||'';playerName=String(playerName).trim().replace(/[<>]/g,'').replace(/\s+/g,' ').slice(0,24);}
        if(!validName(playerName)){status.textContent='Name not accepted. Your score was not submitted.';return;}
        try{window.localStorage?.setItem('grifflistArcadeName',playerName);}catch(_){}
        try{
          const {error}=await client.from('arcade_leaderboard').insert({player_name:playerName,score:Math.max(0,Math.min(150,Math.floor(finalScore)))});
          if(error)throw error;
          await loadLeaderboard();
        }catch(_){status.textContent+=' Score could not be saved online yet.';}
      };
      content.scrollIntoView({behavior:reducedMotion()?'auto':'smooth',block:'start'});
      const pick=$('.arcade-pick',board);pick.addEventListener('click',()=>{if(!timer)return;score++;scoreEl.textContent=score;pick.style.left=(5+Math.random()*75)+'%';pick.style.top=(5+Math.random()*70)+'%';playSecretEffect('pickup');});
      start.addEventListener('click',()=>{if(timer)clearInterval(timer);score=0;time=15;scoreEl.textContent=score;timeEl.textContent=time;const count=$('#arcade-countdown',board);start.disabled=true;let n=3;if(count){count.hidden=false;count.textContent='3';}status.textContent='Get ready!';const countTimer=setInterval(()=>{n--;if(count)count.textContent=n>0?String(n):'GO!';if(n<=0){clearInterval(countTimer);if(count){setTimeout(()=>{count.hidden=true;},450);}start.disabled=false;status.textContent='Rock on!';timer=setInterval(()=>{time--;timeEl.textContent=time;if(time<=0){clearInterval(timer);timer=null;status.textContent=`FINAL SCORE: ${score}.`;try{const previous=Number(localStorage.getItem('grifflistArcadeBest')||0);if(score>previous){localStorage.setItem('grifflistArcadeBest',score);status.textContent='YOU WON A HIGH SCORE!';playRandomHighScore();}else{status.textContent+=` Personal best: ${previous}.`;}}catch(_){}saveLeaderboardScore(score);}},1000);}},1000);});
    });
  }

  // The main page stays focused: no duplicate decade tool or seasonal random-song card.
  // Seasonal styling will be enabled after the final design review.

  // Tip wall: only confirmed records are shown; no dates or transaction IDs displayed.
  if(document.body.classList.contains('explore-page')) {
    const wall=document.createElement('section');wall.className='section tip-wall-section';wall.innerHTML='<div class="section-heading"><h2><span>Rock Wall</span></h2></div><div id="tip-wall-list" class="tip-wall-list" aria-live="polite"></div>';
    appendExplore(wall);
    const list=$('#tip-wall-list');
    const renderTips=async()=>{const client=window.supabaseClient;if(!client||!list)return;try{const {data,error}=await client.from('confirmed_tips').select('id,display_name,amount_cad,requested_song').eq('confirmed',true).order('id',{ascending:false}).limit(50);if(error)throw error;list.replaceChildren();if(!data?.length){list.innerHTML='<p class="tip-wall-empty">No tips yet.</p>';return;}const stageAliases=['Riff Rider','Vinyl Rebel','Amp Ace','Neon Strummer','Backbeat Bandit','Power Chord','Stage Diver','Tape Deck Hero','Guitar Ghost','Rock Voyager','Feedback Fan','Midnight Riffer'];data.forEach((t,index)=>{const row=document.createElement('div');row.className='tip-wall-row';const who=document.createElement('strong');const display=(t.display_name||'').trim();const generic=!display||/^(anonymous( rocker)?|rock fan|backstage buddy|sample|example)$/i.test(display);who.textContent=generic?stageAliases[Math.abs(Number(t.id)||index)%stageAliases.length]:display;const amount=document.createElement('b');amount.textContent=new Intl.NumberFormat('en-CA',{style:'currency',currency:'CAD',maximumFractionDigits:2}).format(Number(t.amount_cad)||0);row.append(who,amount);if(t.requested_song){const song=document.createElement('small');song.textContent=t.requested_song;row.append(song);}list.append(row);});if(data.length>3){[...list.children].forEach(row=>list.append(row.cloneNode(true)));list.classList.add('tip-wall-scrolling');}}catch(_){if(list)list.innerHTML='<p class="tip-wall-empty">Rock Wall temporarily unavailable.</p>';}};
    renderTips();
  }

  // Admin-only tip ledger entry. The DB RLS policy remains the security boundary.
  if ($('#inbox-panel')) {
    const panel=$('#live-tools-panel');if(panel){const ledger=document.createElement('section');ledger.className='admin-panel';ledger.id='confirmed-tip-admin';ledger.innerHTML='<h2><span>Confirmed Tip Wall</span></h2><p>Add a tip only after verifying it in the payment provider or bank. The public page displays a chosen display name, amount, and optional requested song - never dates or payment references.</p><form id="confirmed-tip-form" class="admin-form"><label>Display name (optional)<input id="confirmed-tip-name" maxlength="50" placeholder="Nickname or Anonymous Rocker"></label><label>Confirmed amount (CAD)<input id="confirmed-tip-amount" type="number" min="0.01" step="0.01" required></label><label>Song requested (optional)<input id="confirmed-tip-song" maxlength="200" placeholder="Song title - artist"></label><button type="submit" class="button button-hot">ADD CONFIRMED TIP</button><p id="confirmed-tip-status" class="admin-status" role="status" aria-live="polite"></p></form><div id="confirmed-tip-admin-list"></div>';
      panel.insertAdjacentElement('afterend',ledger);
      $('#confirmed-tip-form').addEventListener('submit',async e=>{e.preventDefault();const status=$('#confirmed-tip-status'),client=window.supabaseClient;const amount=Number($('#confirmed-tip-amount').value);if(!client){status.textContent='Database unavailable.';return;}try{const {error}=await client.from('confirmed_tips').insert({display_name:$('#confirmed-tip-name').value.trim()||'Anonymous Rocker',amount_cad:amount,requested_song:$('#confirmed-tip-song').value.trim()||null,confirmed:true});if(error)throw error;status.textContent='Confirmed tip added to the Encore Wall.';e.target.reset();}catch(err){status.textContent='Could not save tip. Apply the included SQL migration and confirm you are signed in as the authorized admin.';}});
    }
  }

  // PS2 sounds are the single default for Secret Menu; no redundant sound-mode dropdown.

  if('serviceWorker' in navigator && location.protocol.startsWith('http')) window.addEventListener('load',()=>navigator.serviceWorker.register('./sw.js').catch(()=>{}));
})();


// Give successful request confirmations a short, accessible visual cue.
(() => { const el=document.querySelector('#form-status'); if(!el)return; const observer=new MutationObserver(()=>{ if(/request sent|request saved|priority request submitted/i.test(el.textContent||'')){el.classList.remove('request-confirmation-pop');void el.offsetWidth;el.classList.add('request-confirmation-pop');} }); observer.observe(el,{childList:true,subtree:true,characterData:true}); })();


/* Keep floating catalog actions limited to the catalog viewport. */
(() => {
  const catalog = document.getElementById('catalog');
  const meter = document.getElementById('rock-meter');
  if (!catalog || !meter || !('IntersectionObserver' in window)) return;
  let catalogVisible = false;
  let meterVisible = false;
  const sync = () => document.body.classList.toggle('catalog-tools-active', catalogVisible && !meterVisible);
  const catalogObserver = new IntersectionObserver(entries => {
    for (const entry of entries) catalogVisible = entry.isIntersecting && entry.intersectionRatio >= 0.08;
    sync();
  }, {threshold:[0,0.08,0.2]});
  const meterObserver = new IntersectionObserver(entries => {
    for (const entry of entries) meterVisible = entry.isIntersecting && entry.intersectionRatio >= 0.08;
    sync();
  }, {threshold:[0,0.08,0.2]});
  catalogObserver.observe(catalog);
  meterObserver.observe(meter);
})();
