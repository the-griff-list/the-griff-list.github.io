/* Public, privacy-safe crowd-favourite display. Counts come from a Supabase RPC that never exposes requester details. */
(()=>{
 const client=window.supabaseClient, list=document.querySelector('#crowd-favourites-list');
 async function loadLiveButton(){if(!client)return;try{const {data}=await client.from('live_show_settings').select('venue_name,show_enabled,is_live').eq('id',1).maybeSingle();const btn=document.querySelector('#home-watch-live-button'),copy=document.querySelector('#home-live-copy');if(btn&&data){const venue=(data.venue_name||'').trim();btn.textContent=data.is_live&&venue?`● WATCH LIVE AT ${venue.toUpperCase()}`:venue?`WATCH LIVE AT ${venue.toUpperCase()}`:'WATCH LIVE';if(copy&&data.is_live)copy.textContent=`The show is live from ${venue||'the venue'} - watch, request a song, and support the music.`;}}catch(e){}}
 loadLiveButton();window.setInterval(loadLiveButton,15000);
 if(!list)return;
 let range='month', category='all', cache=[];
 const status=document.querySelector('#favourites-status');
 const esc=(s)=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 async function load(){
  if(!client){list.innerHTML='<p class="favourites-empty">Crowd favourites will appear once the online database is connected.</p>';return;}
  list.innerHTML='<p class="favourites-empty">Loading crowd favourites…</p>';
  try{
   const [stats,pins]=await Promise.all([
    client.rpc('get_crowd_favourites',{p_range:range}),
    client.from('crowd_favourite_pins').select('song_title,artist_name,category').eq('active',true).order('sort_order',{ascending:true}).limit(20)
   ]);
   if(stats.error)throw stats.error;
   cache=(stats.data||[]).map(x=>({...x,pinned:false}));
   if(!pins.error){for(const pin of pins.data||[]){let match=cache.find(x=>x.song_title?.toLowerCase()===pin.song_title?.toLowerCase()&&(x.artist_name||'').toLowerCase()===(pin.artist_name||'').toLowerCase());if(match)match.pinned=true;else cache.push({song_title:pin.song_title,artist_name:pin.artist_name,request_count:0,played_count:0,category:pin.category,pinned:true});}}
   render();
  }catch(e){console.warn('Crowd favourites could not load',e);list.innerHTML='<p class="favourites-empty">Crowd favourites need the included Supabase migration. The rest of the website remains available.</p>';}
 }
 async function shareSongCard(title,artist){
  const canvas=document.createElement('canvas');canvas.width=1200;canvas.height=630;const ctx=canvas.getContext('2d');
  const g=ctx.createLinearGradient(0,0,1200,630);g.addColorStop(0,'#17110b');g.addColorStop(1,'#080808');ctx.fillStyle=g;ctx.fillRect(0,0,1200,630);ctx.strokeStyle='#d8a044';ctx.lineWidth=8;ctx.strokeRect(28,28,1144,574);
  ctx.fillStyle='#d8a044';ctx.font='bold 34px sans-serif';ctx.fillText('THE GRIFFLIST · CROWD FAVOURITE',70,105);
  ctx.fillStyle='#ffffff';ctx.font='bold 68px sans-serif';let t=title;while(ctx.measureText(t).width>1050&&t.length>8)t=t.slice(0,-4)+'…';ctx.fillText(t,70,285);
  ctx.fillStyle='#d7c9b7';ctx.font='42px sans-serif';ctx.fillText(artist||'Artist not listed',70,355);ctx.fillStyle='#d8a044';ctx.font='bold 28px sans-serif';ctx.fillText('REQUEST THIS SONG · THEGRIFFLIST',70,520);
  const url=location.origin+location.pathname+'#request';
  try{const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/png'));if(blob&&navigator.canShare&&navigator.canShare({files:[new File([blob],'grifflist-song-card.png',{type:'image/png'})]})){await navigator.share({title:`${title} - Crowd Favourite`,text:`Request ${title} by ${artist} on The Grifflist`,url,files:[new File([blob],'grifflist-song-card.png',{type:'image/png'})]});return;}if(blob){const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='grifflist-song-card.png';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),2000);status.textContent='Song card saved. Share the image and include the request link: '+url;}else throw new Error('Canvas export unavailable');}catch(e){if(e.name!=='AbortError')status.textContent='Share this favourite: '+title+' - '+artist+' · '+url;}
 }
 function render(){
  const rows=cache.filter(x=>category==='all'||x.category===category).sort((a,b)=>(Number(b.pinned)-Number(a.pinned))||(Number(b.request_count)-Number(a.request_count))||String(a.song_title).localeCompare(String(b.song_title))).slice(0,10);
  if(!rows.length){list.innerHTML='<p class="favourites-empty">No requests have been counted for this period yet. Be the first to request a song!</p>';return;}
  list.innerHTML=rows.map((x,i)=>`<article class="favourite-row"><span class="favourite-rank">${String(i+1).padStart(2,'0')}</span><div class="favourite-song-copy"><strong>${esc(x.song_title)}${x.pinned?' <span aria-label="Featured">★</span>':''}</strong><small>${esc(x.artist_name||'Artist not listed')}</small></div><span class="favourite-count">${Number(x.request_count)||0} requests<br>${Number(x.played_count)||0} played</span><div class="favourite-actions"><button type="button" class="button button-quiet favourite-request" data-title="${esc(x.song_title)}" data-artist="${esc(x.artist_name||'')}">REQUEST</button><button type="button" class="button button-quiet favourite-share" data-title="${esc(x.song_title)}" data-artist="${esc(x.artist_name||'')}">SHARE CARD</button></div></article>`).join('');
  list.querySelectorAll('.favourite-request').forEach(btn=>btn.addEventListener('click',()=>{const t=document.querySelector('#request-song'),a=document.querySelector('#request-artist'),n=document.querySelector('#requester-name'),section=document.querySelector('#request');if(t)t.value=btn.dataset.title||'';if(a)a.value=btn.dataset.artist||'';if(section)section.scrollIntoView({behavior:'smooth',block:'start'});if(n&&!n.value)n.focus({preventScroll:true});else t?.focus({preventScroll:true});status.textContent='Song details added. If you saved your name on this device, the request will be sent with one tap; otherwise add your name and submit.';const remembered=localStorage.getItem('grifflistRememberName.v1')==='yes';if(remembered&&n?.value.trim()&&!document.querySelector('#request-message')?.value.trim()&&!document.querySelector('#priority-request')?.checked)document.querySelector('#request-form')?.requestSubmit();}));
  list.querySelectorAll('.favourite-share').forEach(btn=>btn.addEventListener('click',()=>shareSongCard(btn.dataset.title||'',btn.dataset.artist||'')));
 }
 document.querySelectorAll('[data-favourite-range]').forEach(btn=>btn.addEventListener('click',()=>{range=btn.dataset.favouriteRange;document.querySelectorAll('[data-favourite-range]').forEach(b=>b.classList.toggle('is-active',b===btn));load();}));
 document.querySelector('#favourites-filter')?.addEventListener('change',e=>{category=e.target.value;render();});
 document.querySelector('#share-favourites')?.addEventListener('click',async()=>{const text='Crowd Favourites on The Grifflist - '+location.origin+location.pathname+'#crowd-favourites';try{if(navigator.share){await navigator.share({title:'Crowd Favourites - The Grifflist',text,url:location.origin+location.pathname+'#crowd-favourites'});}else if(navigator.clipboard){await navigator.clipboard.writeText(text);status.textContent='Crowd Favourites link copied. Share it with your friends!';}else{status.textContent=text;}}catch(e){if(e.name!=='AbortError')status.textContent='Could not open sharing on this browser. Copy the page address to share it.';}});
 load();
})();
