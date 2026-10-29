/* LiveKit viewer. Viewer tokens are issued by the Cloudflare Worker; no API secret belongs in this file. */
(()=>{
 const client=window.supabaseClient, video=document.querySelector('#live-video'), placeholder=document.querySelector('#live-placeholder');
 const heading=document.querySelector('#live-venue-heading'), desc=document.querySelector('#live-description'), status=document.querySelector('#live-player-status'), badge=document.querySelector('#live-badge'), audioButton=document.querySelector('#enable-live-audio');
 const TOKEN_ENDPOINT='https://odd-unit-91b9.grar0842.workers.dev/token';
 let room=null, lowData=false, activeKey='';
 const remoteTracks=new Set();let mediaRecorder=null,recordingChunks=[],recordingStream=null;
 function offline(message){const h=document.querySelector('#viewer-health');if(h)h.textContent=message||'Stream offline';if(placeholder){placeholder.hidden=false;status.textContent=message||"The show isn't live right now.";}if(badge)badge.hidden=true;if(audioButton)audioButton.hidden=true;}
 function cleanup(){if(mediaRecorder&&mediaRecorder.state!=='inactive'){try{mediaRecorder.stop();}catch(e){}}remoteTracks.clear();if(room){room.disconnect();room=null;}document.querySelectorAll('[data-livekit-audio="true"]').forEach(el=>el.remove());if(video){video.pause();video.srcObject=null;video.removeAttribute('src');}activeKey='';if(audioButton)audioButton.hidden=true;}
 async function connect(){if(!client){offline('Live page needs its Supabase configuration.');return;}try{
  const {data,error}=await client.from('live_show_settings').select('venue_name,show_enabled,is_live').eq('id',1).maybeSingle();if(error)throw error;
  const venue=data?.venue_name?.trim()||'Live';heading.textContent=venue;desc.textContent=data?.is_live?`You're watching live from ${venue}. Request a song or support the show below.`:`Watch the show from ${venue}, request a song, and support the music.`;
  if(!data||!data.show_enabled||!data.is_live){cleanup();offline(data?.show_enabled?'The show is not marked live right now.':'The next live show will appear here.');return;}
  if(room&&room.state==='connected')return;
  const resp=await fetch(TOKEN_ENDPOINT,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({role:'viewer'})});if(!resp.ok)throw new Error('Could not obtain a viewer token ('+resp.status+').');const payload=await resp.json();if(!payload.token||!payload.serverUrl)throw new Error('The token service response is missing token or serverUrl.');
  const LK=window.LivekitClient;if(!LK)throw new Error('LiveKit browser SDK did not load.');
  cleanup();room=new LK.Room({adaptiveStream:true,dynacast:true});activeKey='live';
  room.on(LK.RoomEvent.TrackSubscribed,(track,publication)=>{remoteTracks.add(track);if(track.kind==='video'){if(lowData){track.detach();publication?.setSubscribed(false);return;}track.attach(video);video.style.display='';video.play().catch(()=>{});}else if(track.kind==='audio'){const el=track.attach();el.autoplay=true;el.dataset.livekitAudio='true';document.body.appendChild(el);el.play().then(()=>{if(audioButton)audioButton.hidden=true;}).catch(()=>{if(audioButton)audioButton.hidden=false;});}});
  room.on(LK.RoomEvent.TrackUnsubscribed,(track)=>{remoteTracks.delete(track);track.detach();});
  room.on(LK.RoomEvent.Disconnected,()=>{offline('The stream disconnected. Reconnecting shortly…');});
  await room.connect(payload.serverUrl,payload.token);try{await room.startAudio();if(audioButton)audioButton.hidden=true;}catch(e){if(audioButton)audioButton.hidden=false;}placeholder.hidden=true;badge.hidden=false;const h=document.querySelector('#viewer-health');if(h)h.textContent=lowData?'Connected · audio-first mode':'Connected · live video and audio';
 }catch(e){console.error('LiveKit playback failed',e);cleanup();offline(e.message||'Could not connect to the live show.');}}
 audioButton?.addEventListener('click',async()=>{if(!room)return;audioButton.disabled=true;try{await room.startAudio();for(const el of document.querySelectorAll('[data-livekit-audio="true"]'))await el.play();audioButton.hidden=true;const h=document.querySelector('#viewer-health');if(h)h.textContent=lowData?'Connected · audio enabled · audio-first mode':'Connected · live video and audio';}catch(e){const h=document.querySelector('#viewer-health');if(h)h.textContent='Tap again to enable audio, or check your device volume.';}finally{audioButton.disabled=false;}});
 async function refreshMeter(){if(!client)return;try{const {data,error}=await client.from('rock_meter_settings').select('goal_amount,raised_amount').eq('id',1).maybeSingle();if(error||!data)return;const goal=Math.max(1,Number(data.goal_amount)||200),raised=Math.max(0,Number(data.raised_amount)||0),pct=Math.min(100,Math.round(raised/goal*100));const overlay=document.querySelector('#live-rockometer');const dial=document.querySelector('#live-rockometer-dial');if(!overlay)return;overlay.hidden=false;if(dial){const step=Math.min(100,Math.max(0,Math.round(pct/20)*20));dial.src=`rock-meter-${step}.webp`;dial.alt=`Rockometer at ${pct}% of goal`;}document.querySelector('#live-rockometer-raised').textContent=`$${raised.toFixed(0)} / $${goal.toFixed(0)}`;}catch(e){}}
 document.querySelector('#low-data-mode')?.addEventListener('change',e=>{lowData=e.target.checked;if(video)video.style.display=lowData?'none':'';if(room){room.remoteParticipants.forEach(participant=>participant.trackPublications.forEach(publication=>{if(publication.kind==='video')publication.setSubscribed(!lowData);}));}const h=document.querySelector('#viewer-health');if(h&&room?.state==='connected')h.textContent=lowData?'Connected · audio-only mode':'Connected · live video and audio';});

 const playerShell=document.querySelector('.live-player-shell'),expandButton=document.querySelector('#live-expand'),exitButton=document.querySelector('#live-exit-fullscreen');
 let controlsHideTimer=null;
 function syncFullscreenControls(){const full=!!(document.fullscreenElement===playerShell);if(expandButton)expandButton.hidden=full;if(exitButton)exitButton.hidden=!full;if(playerShell){playerShell.classList.add('controls-visible');playerShell.classList.toggle('is-fullscreen',full);}if(exitButton){exitButton.textContent='⤡';exitButton.setAttribute('aria-label','Exit fullscreen');exitButton.title='Return to normal view';}}
 async function enterLandscape(){if(!playerShell)return;try{if(playerShell.requestFullscreen)await playerShell.requestFullscreen();else if(video&&video.webkitEnterFullscreen){video.webkitEnterFullscreen();return;}try{if(screen.orientation&&screen.orientation.lock)await screen.orientation.lock('landscape');}catch(e){}syncFullscreenControls();}catch(e){const h=document.querySelector('#viewer-health');if(h)h.textContent='Landscape fullscreen is not available in this browser. Rotate your phone sideways instead.';}}
 async function exitLandscape(){try{if(document.fullscreenElement&&document.exitFullscreen)await document.exitFullscreen();}catch(e){}try{if(screen.orientation&&screen.orientation.unlock)screen.orientation.unlock();}catch(e){}syncFullscreenControls();}
 expandButton?.addEventListener('click',enterLandscape);exitButton?.addEventListener('click',exitLandscape);
 document.addEventListener('fullscreenchange',()=>{syncFullscreenControls();if(!document.fullscreenElement){try{if(screen.orientation&&screen.orientation.unlock)screen.orientation.unlock();}catch(e){}}});
 playerShell?.addEventListener('click',e=>{if(e.target.closest('button,select,label,a,input'))return;playerShell.classList.add('controls-visible');if(controlsHideTimer)clearTimeout(controlsHideTimer);if(document.fullscreenElement===playerShell)controlsHideTimer=setTimeout(()=>playerShell.classList.remove('controls-visible'),4500);});
 playerShell?.addEventListener('touchstart',()=>{playerShell.classList.add('controls-visible');if(controlsHideTimer)clearTimeout(controlsHideTimer);if(document.fullscreenElement===playerShell)controlsHideTimer=setTimeout(()=>playerShell.classList.remove('controls-visible'),4500);},{passive:true});

 const recordMode=document.querySelector('#recording-mode'),recordStart=document.querySelector('#recording-start'),recordStop=document.querySelector('#recording-stop'),recordStatus=document.querySelector('#recording-status');
 function setRecordingStatus(message){if(recordStatus)recordStatus.textContent=message;}
 function supportedMime(candidates){return candidates.find(type=>window.MediaRecorder&&MediaRecorder.isTypeSupported(type))||'';}
 function startRecording(){
  if(!room||room.state!=='connected'){setRecordingStatus('Connect to a live show before recording.');return;}
  if(!window.MediaRecorder){setRecordingStatus('Recording is not supported by this browser. Try the latest Chrome.');return;}
  const mode=recordMode?.value||'video';const tracks=[...remoteTracks].filter(t=>t.mediaStreamTrack&&t.mediaStreamTrack.readyState==='live');
  const audioTracks=tracks.filter(t=>t.kind==='audio').map(t=>t.mediaStreamTrack);
  const videoTracks=mode==='video'&&!lowData?tracks.filter(t=>t.kind==='video').map(t=>t.mediaStreamTrack):[];
  if(!audioTracks.length){setRecordingStatus('No live audio track is available yet. Wait for the stream audio, then try again.');return;}
  if(mode==='video'&&!videoTracks.length){setRecordingStatus(lowData?'Turn off Low-data mode to record video, or choose audio only.':'No live video track is available. Choose audio only or wait for video.');return;}
  recordingStream=new MediaStream([...videoTracks,...audioTracks]);recordingChunks=[];
  const mime=mode==='audio'?supportedMime(['audio/webm;codecs=opus','audio/webm']):supportedMime(['video/webm;codecs=vp8,opus','video/webm;codecs=vp9,opus','video/webm']);
  try{mediaRecorder=new MediaRecorder(recordingStream,{...(mime?{mimeType:mime}:{}),...(mode==='audio'?{audioBitsPerSecond:64000}:{videoBitsPerSecond:1200000,audioBitsPerSecond:64000})});}
  catch(error){setRecordingStatus('Could not start recording in this browser. Try audio-only mode.');recordingStream=null;return;}
  mediaRecorder.ondataavailable=e=>{if(e.data&&e.data.size)recordingChunks.push(e.data);};
  mediaRecorder.onerror=()=>setRecordingStatus('Recording encountered an error. Try again when the connection is stable.');
  mediaRecorder.onstop=()=>{const type=mediaRecorder?.mimeType|| (mode==='audio'?'audio/webm':'video/webm');const blob=new Blob(recordingChunks,{type});if(!blob.size){setRecordingStatus('No recording data was captured. Please try again.');return;}const url=URL.createObjectURL(blob),a=document.createElement('a'),stamp=new Date().toISOString().replace(/[:.]/g,'-');a.href=url;a.download=`grifflist-${mode==='audio'?'audio':'video'}-${stamp}.webm`;document.body.appendChild(a);a.click();a.remove();window.setTimeout(()=>URL.revokeObjectURL(url),60000);setRecordingStatus(`Recording saved as ${a.download} (${(blob.size/1048576).toFixed(1)} MB).`);recordingChunks=[];recordingStream=null;if(recordStart)recordStart.disabled=!(room&&room.state==='connected');if(recordStop)recordStop.disabled=true;};
  mediaRecorder.start(1000);if(recordStart)recordStart.disabled=true;if(recordStop)recordStop.disabled=false;setRecordingStatus(mode==='audio'?'Recording audio only. Tap Stop & Save to download the WebM file.':'Recording video and audio. Tap Stop & Save to download the WebM file.');
 }
 function stopRecording(){if(mediaRecorder&&mediaRecorder.state!=='inactive'){mediaRecorder.stop();setRecordingStatus('Finalizing recording and preparing download…');}if(recordStop)recordStop.disabled=true;}
 recordStart?.addEventListener('click',startRecording);recordStop?.addEventListener('click',stopRecording);
 const updateRecordAvailability=()=>{if(recordStart&&!mediaRecorder?.state?.match(/recording|paused/))recordStart.disabled=!(room&&room.state==='connected');};
 connect();refreshMeter();window.setInterval(()=>{if(!document.hidden&&(!room||room.state!=='connected'))connect();updateRecordAvailability();},15000);window.setInterval(()=>{if(!document.hidden)refreshMeter();},20000);window.addEventListener('pagehide',cleanup);
})();
