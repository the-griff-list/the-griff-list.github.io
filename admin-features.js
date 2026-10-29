/* Admin settings for LiveKit Cloud streaming and pinned crowd favourites. */
(()=>{
 const client=window.supabaseClient;
 const $=s=>document.querySelector(s);
 const liveForm=$('#watch-live-settings-form'), liveStatus=$('#watch-live-admin-status');
 const pinForm=$('#favourites-pin-form'), pinStatus=$('#favourites-admin-status'), pinList=$('#admin-pinned-favourites');
 const setStatus=(el,msg)=>{if(el)el.textContent=msg;};
 async function loadSettings(){
  if(!client){setStatus(liveStatus,'Connect Supabase before saving public live settings.');return;}
  try{const {data,error}=await client.from('live_show_settings').select('venue_name,show_enabled,is_live,session_started_at').eq('id',1).maybeSingle();if(error)throw error;if(data){$('#live-venue-name').value=data.venue_name||'';$('#live-show-enabled').checked=!!data.show_enabled;$('#live-is-live').checked=!!data.is_live;}}
  catch(e){setStatus(liveStatus,'Apply grifflist-combined-reviewed-migration.sql in Supabase to enable Watch Live settings.');}
 }
 liveForm?.addEventListener('submit',async e=>{e.preventDefault();if(!client){setStatus(liveStatus,'Supabase is not connected.');return;}setStatus(liveStatus,'Saving settings…');try{const now=new Date().toISOString();const {data:current,error:readError}=await client.from('live_show_settings').select('is_live,session_started_at').eq('id',1).maybeSingle();if(readError)throw readError;const nextLive=$('#live-is-live').checked;const row={id:1,venue_name:$('#live-venue-name').value.trim(),show_enabled:$('#live-show-enabled').checked,is_live:nextLive,updated_at:now};if(nextLive&&(!current?.is_live||!current?.session_started_at))row.session_started_at=now;const {error}=await client.from('live_show_settings').upsert(row);if(error)throw error;setStatus(liveStatus,'Saved. The public LiveKit Watch Live page will update shortly.');}catch(err){setStatus(liveStatus,err.message||'Could not save settings. Check the SQL migration and table permissions.');}});
 async function loadPins(){if(!pinList||!client)return;try{const {data,error}=await client.from('crowd_favourite_pins').select('id,song_title,artist_name,category').eq('active',true).order('sort_order',{ascending:true});if(error)throw error;pinList.replaceChildren();(data||[]).forEach(row=>{const item=document.createElement('div');item.className='admin-pinned-item';const label=document.createElement('span');label.textContent=`★ ${row.song_title}${row.artist_name?' — '+row.artist_name:''} (${row.category||'all'})`;const remove=document.createElement('button');remove.type='button';remove.className='button button-quiet';remove.textContent='UNPIN';remove.addEventListener('click',async()=>{remove.disabled=true;const {error}=await client.from('crowd_favourite_pins').update({active:false}).eq('id',row.id);if(error){setStatus(pinStatus,error.message);remove.disabled=false;return;}setStatus(pinStatus,'Song unpinned.');loadPins();});item.append(label,remove);pinList.append(item);});}catch(e){setStatus(pinStatus,'Apply grifflist-combined-reviewed-migration.sql to enable shared pins.');}}
 pinForm?.addEventListener('submit',async e=>{e.preventDefault();if(!client){setStatus(pinStatus,'Supabase is not connected.');return;}setStatus(pinStatus,'Pinning song…');try{const {error}=await client.from('crowd_favourite_pins').insert({song_title:$('#favourite-pin-title').value.trim(),artist_name:$('#favourite-pin-artist').value.trim()||null,category:$('#favourite-pin-category').value,active:true,sort_order:0});if(error)throw error;pinForm.reset();setStatus(pinStatus,'Song pinned to Crowd Favourites.');loadPins();}catch(err){setStatus(pinStatus,err.message||'Could not pin song. Check database setup.');}});
 loadSettings();loadPins();
})();

// LiveKit phone broadcaster. Publisher tokens are issued by the Cloudflare Worker after password validation.
(()=>{
 const client=window.supabaseClient,$=s=>document.querySelector(s);
 const start=$('#broadcast-start'),stop=$('#broadcast-stop'),preview=$('#broadcast-preview'),status=$('#broadcast-status');
 const TOKEN_ENDPOINT='https://odd-unit-91b9.grar0842.workers.dev/token';
 let stream=null,room=null,localTracks=[];
 const set=msg=>{if(status)status.textContent=msg;};
 async function setLive(value){if(!client)return;const now=new Date().toISOString(),update={is_live:value,updated_at:now};if(value)update.session_started_at=now;const {error}=await client.from('live_show_settings').update(update).eq('id',1);if(error)throw error;}
 start?.addEventListener('click',async()=>{
  const password=$('#livekit-broadcast-password')?.value||'';if(!password){set('Enter the broadcaster password configured in Cloudflare first.');return;}
  if(!window.isSecureContext||!navigator.mediaDevices?.getUserMedia){set('Camera access requires HTTPS and a supported browser.');return;}
  start.disabled=true;set('Requesting camera and microphone permission…');
  try{
   const tokenResponse=await fetch(TOKEN_ENDPOINT,{method:'POST',headers:{'Content-Type':'application/json','X-Broadcaster-Password':password},body:JSON.stringify({role:'publisher'})});if(!tokenResponse.ok)throw new Error(tokenResponse.status===403?'Broadcaster password was rejected.':'Could not obtain a LiveKit broadcaster token ('+tokenResponse.status+').');const auth=await tokenResponse.json();if(!auth.token||!auth.serverUrl)throw new Error('Token service response is incomplete.');
   const LK=window.LivekitClient;if(!LK)throw new Error('LiveKit browser SDK did not load.');
   stream=await navigator.mediaDevices.getUserMedia({video:{facingMode:'environment',width:{ideal:1280},height:{ideal:720}},audio:{echoCancellation:true,noiseSuppression:true,autoGainControl:true}});preview.srcObject=stream;preview.hidden=false;await preview.play().catch(()=>{});
   room=new LK.Room({adaptiveStream:true,dynacast:true});await room.connect(auth.serverUrl,auth.token);
   for(const track of stream.getTracks()){const local=await room.localParticipant.publishTrack(track);localTracks.push(local);}
   await setLive(true);stop.disabled=false;set('You are broadcasting to LiveKit. Keep this page open and your phone awake.');const h=$('#stream-health-label');if(h)h.textContent='Connected · LiveKit camera, microphone and network';
  }catch(e){console.error(e);set(e.message||'Could not start broadcast. Check permissions and Worker configuration.');await cleanup(false);}finally{start.disabled=false;const passwordField=$('#livekit-broadcast-password');if(passwordField)passwordField.value='';}
 });
 async function cleanup(markOffline){if(room){try{await room.disconnect();}catch(e){}room=null;}localTracks=[];if(stream){stream.getTracks().forEach(t=>t.stop());stream=null;}if(preview){preview.srcObject=null;preview.hidden=true;}if(stop)stop.disabled=true;if(markOffline&&client){try{await setLive(false);const h=$('#stream-health-label');if(h)h.textContent='Broadcast ended';}catch(e){set('Broadcast stopped locally, but LIVE status could not be updated.');}}}
 stop?.addEventListener('click',async()=>{stop.disabled=true;set('Ending broadcast…');await cleanup(true);set('Broadcast ended.');});
 const healthLabel=$('#stream-health-label'),healthDetails=$('#stream-health-details');window.setInterval(()=>{if(!healthLabel)return;if(!room){healthLabel.textContent='Not broadcasting';if(healthDetails)healthDetails.textContent='';return;}healthLabel.textContent=room.state==='connected'?'Connected':'Connection '+room.state;if(healthDetails)healthDetails.textContent=' · LiveKit room: the-grifflist-live';},2000);
 $('#quick-go-live')?.addEventListener('click',()=>start?.click());$('#quick-end-live')?.addEventListener('click',()=>stop?.click());window.addEventListener('pagehide',()=>{if(room)cleanup(true);});
})();
