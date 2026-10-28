/* Admin settings for self-hosted browser streaming and pinned crowd favourites. */
(()=>{
 const client=window.supabaseClient;
 const $=s=>document.querySelector(s);
 const liveForm=$('#watch-live-settings-form'), liveStatus=$('#watch-live-admin-status');
 const pinForm=$('#favourites-pin-form'), pinStatus=$('#favourites-admin-status'), pinList=$('#admin-pinned-favourites');
 const LOCAL_WHIP_KEY='grifflist.whipEndpoint.v1', LOCAL_WHIP_USER='grifflist.whipUser.v1', LOCAL_WHIP_PASS='grifflist.whipPass.v1';
 const setStatus=(el,msg)=>{if(el)el.textContent=msg;};
 const validHttpUrl=v=>{try{const u=new URL(v);return u.protocol==='https:'||u.hostname==='localhost'||u.hostname==='127.0.0.1';}catch{return !v;}};
 async function loadSettings(){
  const saved=localStorage.getItem(LOCAL_WHIP_KEY)||'';if($('#live-whip-url'))$('#live-whip-url').value=saved;if($('#live-whip-user'))$('#live-whip-user').value=localStorage.getItem(LOCAL_WHIP_USER)||'';if($('#live-whip-pass'))$('#live-whip-pass').value=localStorage.getItem(LOCAL_WHIP_PASS)||'';
  if(!client){setStatus(liveStatus,'Connect Supabase before saving public live settings.');return;}
  try{const {data,error}=await client.from('live_show_settings').select('venue_name,whep_url,show_enabled,is_live').eq('id',1).maybeSingle();if(error)throw error;if(data){$('#live-venue-name').value=data.venue_name||'';$('#live-whep-url').value=data.whep_url||'';$('#live-show-enabled').checked=!!data.show_enabled;$('#live-is-live').checked=!!data.is_live;}}
  catch(e){setStatus(liveStatus,'Apply grifflist-next-update.sql in Supabase to enable Watch Live settings.');}
 }
 liveForm?.addEventListener('submit',async e=>{e.preventDefault();if(!client){setStatus(liveStatus,'Supabase is not connected.');return;}const whip=$('#live-whip-url').value.trim(),whep=$('#live-whep-url').value.trim();if(!validHttpUrl(whip)||!validHttpUrl(whep)){setStatus(liveStatus,'Use HTTPS URLs for public streaming, or localhost for local testing.');return;}setStatus(liveStatus,'Saving settings…');try{localStorage.setItem(LOCAL_WHIP_KEY,whip);localStorage.setItem(LOCAL_WHIP_USER,$('#live-whip-user').value.trim());localStorage.setItem(LOCAL_WHIP_PASS,$('#live-whip-pass').value);const row={id:1,venue_name:$('#live-venue-name').value.trim(),whep_url:whep,show_enabled:$('#live-show-enabled').checked,is_live:$('#live-is-live').checked,updated_at:new Date().toISOString()};const {error}=await client.from('live_show_settings').upsert(row);if(error)throw error;setStatus(liveStatus,'Saved. The public Watch Live page will update shortly.');}catch(err){setStatus(liveStatus,err.message||'Could not save settings. Check the SQL migration and table permissions.');}});
 async function loadPins(){if(!pinList||!client)return;try{const {data,error}=await client.from('crowd_favourite_pins').select('id,song_title,artist_name,category').eq('active',true).order('sort_order',{ascending:true});if(error)throw error;pinList.replaceChildren();(data||[]).forEach(row=>{const item=document.createElement('div');item.className='admin-pinned-item';const label=document.createElement('span');label.textContent=`★ ${row.song_title}${row.artist_name?' — '+row.artist_name:''} (${row.category||'all'})`;const remove=document.createElement('button');remove.type='button';remove.className='button button-quiet';remove.textContent='UNPIN';remove.addEventListener('click',async()=>{remove.disabled=true;const {error}=await client.from('crowd_favourite_pins').update({active:false}).eq('id',row.id);if(error){setStatus(pinStatus,error.message);remove.disabled=false;return;}setStatus(pinStatus,'Song unpinned.');loadPins();});item.append(label,remove);pinList.append(item);});}catch(e){setStatus(pinStatus,'Apply grifflist-next-update.sql to enable shared pins.');}}
 pinForm?.addEventListener('submit',async e=>{e.preventDefault();if(!client){setStatus(pinStatus,'Supabase is not connected.');return;}setStatus(pinStatus,'Pinning song…');try{const {error}=await client.from('crowd_favourite_pins').insert({song_title:$('#favourite-pin-title').value.trim(),artist_name:$('#favourite-pin-artist').value.trim()||null,category:$('#favourite-pin-category').value,active:true,sort_order:0});if(error)throw error;pinForm.reset();setStatus(pinStatus,'Song pinned to Crowd Favourites.');loadPins();}catch(err){setStatus(pinStatus,err.message||'Could not pin song. Check database setup.');}});
 loadSettings();loadPins();
})();

// Phone-browser broadcaster using WHIP. Requires a reachable HTTPS MediaMTX server.
(()=>{
 const client=window.supabaseClient,$=s=>document.querySelector(s);
 const start=$('#broadcast-start'),stop=$('#broadcast-stop'),preview=$('#broadcast-preview'),status=$('#broadcast-status');
 let stream=null,pc=null,sessionUrl=null;
 const set=(msg)=>{if(status)status.textContent=msg;};
 const waitIce=pc=>new Promise(resolve=>{if(pc.iceGatheringState==='complete')return resolve();const timeout=setTimeout(resolve,3000);pc.addEventListener('icegatheringstatechange',()=>{if(pc.iceGatheringState==='complete'){clearTimeout(timeout);resolve();}});});
 async function setLive(value){if(!client)return;const now=new Date().toISOString();const update={is_live:value,updated_at:now};if(value)update.session_started_at=now;const {error}=await client.from('live_show_settings').update(update).eq('id',1);if(error)throw error;}
 start?.addEventListener('click',async()=>{
  const url=$('#live-whip-url')?.value.trim();if(!url){set('Enter the phone broadcast WHIP URL and save the settings first.');return;}
  if(!window.isSecureContext){set('Camera access requires HTTPS. Open the admin page over HTTPS.');return;}
  if(!navigator.mediaDevices?.getUserMedia){set('This browser does not support camera and microphone capture. Try Chrome on your phone.');return;}
  start.disabled=true;set('Requesting camera and microphone permission…');
  try{
   stream=await navigator.mediaDevices.getUserMedia({video:{facingMode:'environment',width:{ideal:1280},height:{ideal:720}},audio:{echoCancellation:true,noiseSuppression:true,autoGainControl:true}});
   preview.srcObject=stream;preview.hidden=false;await preview.play().catch(()=>{});
   pc=new RTCPeerConnection({iceServers:[{urls:'stun:stun.l.google.com:19302'}]});stream.getTracks().forEach(track=>pc.addTrack(track,stream));
   pc.onconnectionstatechange=()=>{if(pc&&['failed','disconnected'].includes(pc.connectionState))set('Stream connection lost. Check your server/network.');};
   const offer=await pc.createOffer();await pc.setLocalDescription(offer);await waitIce(pc);
   set('Connecting to the streaming server…');const headers={'Content-Type':'application/sdp','Accept':'application/sdp'};const u=localStorage.getItem('grifflist.whipUser.v1')||'',pw=localStorage.getItem('grifflist.whipPass.v1')||'';if(u||pw)headers.Authorization='Basic '+btoa(unescape(encodeURIComponent(u+':'+pw)));const res=await fetch(url,{method:'POST',headers,body:pc.localDescription.sdp});
   if(!res.ok)throw new Error(`WHIP returned HTTP ${res.status}. Check server URL, firewall, HTTPS, and CORS.`);
   sessionUrl=res.headers.get('Location');if(sessionUrl&&!/^https?:\/\//i.test(sessionUrl))sessionUrl=new URL(sessionUrl,url).href;
   await pc.setRemoteDescription({type:'answer',sdp:await res.text()});
   await setLive(true);stop.disabled=false;set('You are broadcasting. Keep this page open and your phone awake.');const healthLabel=$('#stream-health-label');if(healthLabel)healthLabel.textContent='Connected · monitoring camera, microphone and network';
  }catch(e){console.error(e);set(e.message||'Could not start broadcast. Check camera permissions and server settings.');await cleanup(false);}
  finally{start.disabled=false;}
 });
 async function cleanup(markOffline){if(pc){pc.close();pc=null;}if(stream){stream.getTracks().forEach(t=>t.stop());stream=null;}if(preview){preview.srcObject=null;preview.hidden=true;}if(sessionUrl){try{await fetch(sessionUrl,{method:'DELETE'});}catch(e){}sessionUrl=null;}if(stop)stop.disabled=true;if(markOffline&&client){try{await setLive(false);const h=$('#stream-health-label');if(h)h.textContent='Broadcast ended';}catch(e){set('Broadcast stopped locally, but the public LIVE status could not be updated. Save Watch Live settings to retry.');}}}
 stop?.addEventListener('click',async()=>{stop.disabled=true;set('Ending broadcast…');await cleanup(true);set('Broadcast ended.');});
 const healthLabel=$('#stream-health-label'),healthDetails=$('#stream-health-details');const refreshHealth=()=>{if(!healthLabel)return;if(!pc){healthLabel.textContent='Not broadcasting';if(healthDetails)healthDetails.textContent='';return;}const tracks=stream?.getTracks()||[];const videoOk=tracks.some(t=>t.kind==='video'&&t.readyState==='live'&&t.enabled),audioOk=tracks.some(t=>t.kind==='audio'&&t.readyState==='live'&&t.enabled);healthLabel.textContent=pc.connectionState==='connected'?'Connected':('Connection '+pc.connectionState);if(healthDetails)healthDetails.textContent=` · Camera ${videoOk?'OK':'check'} · Microphone ${audioOk?'OK':'check'}`;};window.setInterval(refreshHealth,2000);$('#quick-go-live')?.addEventListener('click',()=>start?.click());$('#quick-end-live')?.addEventListener('click',()=>stop?.click());$('#quick-refresh-requests')?.addEventListener('click',()=>$('#refresh-requests')?.click());window.addEventListener('pagehide',()=>{if(pc)cleanup(true);});
})();
