const $ = s => document.querySelector(s);
const loginPanel=$("#login-panel"), inboxPanel=$("#inbox-panel"), loginForm=$("#login-form"), loginStatus=$("#login-status"), inboxStatus=$("#inbox-status"), list=$("#requests-list"), empty=$("#empty-inbox");
const client=window.supabaseClient;
function setupError(){return "Dashboard setup isn't finished yet. Add your Supabase project URL and publishable/anon key to supabase-config.js, then try again.";}
function fmtDate(value){try{return new Date(value).toLocaleString(undefined,{dateStyle:"medium",timeStyle:"short"});}catch{return value||"";}}
function make(tag,cls,text){const el=document.createElement(tag);if(cls)el.className=cls;if(text!==undefined)el.textContent=text;return el;}
function applyRequestFilters(){
 const query=($("#admin-request-search")?.value||"").trim().toLowerCase();
 const mode=$("#admin-request-filter")?.value||"all";
 list.querySelectorAll(".request-card").forEach(card=>{
  const searchMatch=!query||(card.dataset.search||"").includes(query);
  const status=card.dataset.status||"new";
  const priority=card.dataset.priority==="true";
  const modeMatch=mode==="all"||(mode==="new"&&status==="new")||(mode==="played"&&status==="played")||(mode==="priority"&&priority);
  card.hidden=!(searchMatch&&modeMatch);
 });
 const visible=[...list.querySelectorAll(".request-card")].filter(card=>!card.hidden).length;
 const total=list.querySelectorAll(".request-card").length;
 if(empty)empty.hidden=total!==0;
 const count=$("#admin-filter-count");
 if(count)count.textContent=query||mode!=="all"?visible+" shown · "+total+" total":"";
 const noMatches=$("#admin-no-filter-results");if(noMatches)noMatches.hidden=!(total>0&&visible===0);
}
const stageToggle=$("#stage-mode-toggle");
function setStageMode(enabled){
 document.body.classList.toggle("stage-mode",enabled);
 if(stageToggle){stageToggle.setAttribute("aria-pressed",String(enabled));stageToggle.textContent=enabled?"EXIT STAGE MODE":"STAGE MODE";}
 try{localStorage.setItem("grifflist.admin.stageMode",enabled?"on":"off");}catch(e){}
}
if(stageToggle){
 let stageSaved=false;try{stageSaved=localStorage.getItem("grifflist.admin.stageMode")==="on";}catch(e){}
 setStageMode(stageSaved);
 stageToggle.addEventListener("click",()=>setStageMode(!document.body.classList.contains("stage-mode")));
}
$("#admin-request-search")?.addEventListener("input",applyRequestFilters);
$("#admin-request-filter")?.addEventListener("change",applyRequestFilters);

async function showSession(){if(!client){loginStatus.textContent=setupError();return;}const {data:{session}}=await client.auth.getSession();if(session){loginPanel.hidden=true;inboxPanel.hidden=false;$("#logout-button").hidden=false;if(stageToggle)stageToggle.hidden=false;await loadRequests();await loadKofiTips();}else{loginPanel.hidden=false;inboxPanel.hidden=true;$("#logout-button").hidden=true;if(stageToggle)stageToggle.hidden=true;}}
loginForm.addEventListener("submit",async e=>{e.preventDefault();if(!client){loginStatus.textContent=setupError();return;}const button=loginForm.querySelector("button");button.disabled=true;loginStatus.textContent="Signing in…";try{const {error}=await client.auth.signInWithPassword({email:$("#login-email").value.trim(),password:$("#login-password").value});if(error)throw error;loginStatus.textContent="";await showSession();}catch(err){loginStatus.textContent=err.message||"Sign-in failed. Check your email and password.";}finally{button.disabled=false;}});
async function loadRequests(){if(!client)return;inboxStatus.textContent="Loading requests…";list.replaceChildren();empty.hidden=true;try{const [{data,error},{count:newCount,error:newCountError},{count:totalCount,error:totalCountError}]=await Promise.all([client.from("song_requests").select("id,requester_name,song_title,artist_name,note,status,created_at,payment_reference,payment_method,payment_status,payment_provider,payment_verified_at").order("created_at",{ascending:false}).limit(200),client.from("song_requests").select("id",{count:"exact",head:true}).eq("status","New"),client.from("song_requests").select("id",{count:"exact",head:true})]);if(error)throw error;if(newCountError)throw newCountError;if(totalCountError)throw totalCountError;inboxStatus.textContent="";$("#inbox-summary").textContent=`New: ${newCount||0} · Requests: ${totalCount||0}`;empty.hidden=data.length>0;data.forEach(item=>{const isPlayed=item.status==="Played";const noteText=item.note||"";const priorityPending=/\[PRIORITY TIP PENDING[ —-]*VERIFY PAYMENT\]/i.test(noteText);const priorityReported=/\[PRIORITY TIP REPORTED[ —-]*VERIFY PAYMENT\]/i.test(noteText);const priorityVerified=noteText.includes("[PRIORITY PAYMENT VERIFIED]")||item.payment_status==="paid";const displayNote=noteText.replace(/\[PRIORITY TIP (?:PENDING|REPORTED)[ —-]*VERIFY PAYMENT\]\s*/gi,"").replace("[PRIORITY PAYMENT VERIFIED] ","");const card=make("article","request-card"+(isPlayed?" request-played":""));card.dataset.status=isPlayed?"played":"new";card.dataset.priority=String(!!(priorityPending||priorityReported||priorityVerified||item.payment_reference));card.dataset.search=[item.song_title,item.artist_name,item.requester_name,item.note,item.payment_reference].filter(Boolean).join(" ").toLowerCase();const top=make("div","request-card-top");const checkLabel=make("label","request-check-label");const played=make("input");played.type="checkbox";played.checked=isPlayed;played.setAttribute("aria-label",`Mark ${item.song_title||"song"} as played`);checkLabel.append(played);const details=make("div","request-details"+(isPlayed?" request-text-done":""));const title=make("h3","request-song-title",item.song_title||"Untitled song");details.append(title);details.append(make("p","",item.artist_name||"Artist not provided"));details.append(make("p","request-meta",`From ${item.requester_name||"Anonymous"} · ${fmtDate(item.created_at)}`));if(priorityPending||priorityReported||priorityVerified){const badge=make("p", "priority-admin-badge", priorityVerified?"✓ PRIORITY PAYMENT VERIFIED"+(item.payment_provider?" · "+item.payment_provider.toUpperCase():""):priorityPending?"⌛ PRIORITY PAYMENT PENDING":"⚠ PAYMENT REPORTED — VERIFY");details.append(badge);}if(item.payment_reference){details.append(make("p","request-meta","Payment reference: "+item.payment_reference+" · "+(item.payment_method||"payment").toUpperCase()+" · "+(item.payment_status||"pending").toUpperCase()));}if(item.payment_verified_at){details.append(make("p","request-meta","Verified: "+fmtDate(item.payment_verified_at)));}top.append(checkLabel,details);card.append(top);if(displayNote)card.append(make("p","request-note request-details"+(isPlayed?" request-text-done":""),`Note: ${displayNote}`));const actions=make("div","request-actions");played.addEventListener("change",async()=>{played.disabled=true;const newStatus=played.checked?"Played":"New";try{const {error}=await client.from("song_requests").update({status:newStatus}).eq("id",item.id);if(error)throw error;item.status=newStatus;card.classList.toggle("request-played",played.checked);card.querySelectorAll(".request-details").forEach(el=>el.classList.toggle("request-text-done",played.checked));inboxStatus.textContent=played.checked?"Marked as played.":"Checkmark removed.";}catch(err){played.checked=!played.checked;inboxStatus.textContent=err.message||"Could not update request.";}finally{played.disabled=false;}});const del=make("button","button button-danger","DELETE");del.type="button";del.setAttribute("aria-label",`Delete request for ${item.song_title||"song"}`);del.addEventListener("click",async()=>{if(!window.confirm(`Delete the request for “${item.song_title||"Untitled song"}” from ${item.requester_name||"Anonymous"}? This cannot be undone.`))return;del.disabled=true;try{const {error}=await client.from("song_requests").delete().eq("id",item.id);if(error)throw error;card.remove();const remaining=list.querySelectorAll(".request-card").length;empty.hidden=remaining!==0;loadRequests();inboxStatus.textContent="Request deleted.";}catch(err){inboxStatus.textContent=err.message||"Could not delete request. Check the Supabase delete policy.";del.disabled=false;}});if((priorityReported||priorityPending)&&item.payment_status!=="paid"){const verify=make("button","button button-quiet","MARK PAYMENT VERIFIED");verify.type="button";verify.addEventListener("click",async()=>{verify.disabled=true;const updatedNote=noteText.replace(/\[PRIORITY TIP (?:PENDING|REPORTED)[ —-]*VERIFY PAYMENT\]\s*/gi,"[PRIORITY PAYMENT VERIFIED] ");try{const updatePayload={note:updatedNote};if(item.payment_reference){updatePayload.payment_status="paid";updatePayload.payment_provider="manual";updatePayload.payment_verified_at=new Date().toISOString();}const {error}=await client.from("song_requests").update(updatePayload).eq("id",item.id);if(error)throw error;item.note=updatedNote;inboxStatus.textContent="Payment marked verified. Confirm you checked your payment account.";await loadRequests();}catch(err){inboxStatus.textContent=err.message||"Could not update payment status.";verify.disabled=false;}});actions.append(verify);}actions.append(del);card.append(actions);list.append(card);});applyRequestFilters();}catch(err){inboxStatus.textContent=err.message||"Couldn't load requests. Check the table and permissions in Supabase.";}}
$("#refresh-requests").addEventListener("click",loadRequests);$("#logout-button").addEventListener("click",async()=>{if(client)await client.auth.signOut();await showSession();});if(client)client.auth.onAuthStateChange(()=>{showSession();});showSession();


/* Ko-fi tip history is restricted to authenticated dashboard users by the
   kofi-tips-integration.sql migration. Never expose supporter details publicly. */
const kofiTipsList=$("#kofi-tips-list"),kofiTipsSummary=$("#kofi-tips-summary"),kofiTipsStatus=$("#kofi-tips-status");
function money(value,currency){try{return new Intl.NumberFormat(undefined,{style:"currency",currency}).format(Number(value)||0);}catch{return String(value)+" "+currency;}}
async function loadKofiTips(){
 if(!client||!kofiTipsList)return;
 kofiTipsStatus.textContent="Loading donations…";kofiTipsList.replaceChildren();
 try{
  const {data,error}=await client.from("kofi_tips").select("amount,currency,supporter_name,supporter_message,is_public,payment_type,received_at").order("received_at",{ascending:false}).limit(100);
  if(error)throw error;
  const totals={};(data||[]).forEach(t=>{totals[t.currency]=(totals[t.currency]||0)+Number(t.amount||0);});
  kofiTipsSummary.textContent=(Object.keys(totals).length?Object.entries(totals).map(([c,v])=>money(v,c)+" "+c).join(" · "):"No donations recorded yet.")+" · "+(data||[]).length+" recent donations";
  if(!data?.length){kofiTipsList.append(make("p","empty-inbox","No donations have arrived yet."));}
  (data||[]).forEach(t=>{
   const card=make("article","request-card");
   const who=t.supporter_name||"Anonymous supporter";
   card.append(make("h4","",money(t.amount,t.currency)+" · "+who));
   card.append(make("p","request-meta",(String(t.payment_type||"").toLowerCase()==="tip"?"Donation":(t.payment_type||"Ko-fi payment"))+" · "+fmtDate(t.received_at)+(t.is_public?" · Public message":" · Private")));
   if(t.supporter_message)card.append(make("p","request-note",t.supporter_message));
   kofiTipsList.append(card);
  });
  kofiTipsStatus.textContent="";
 }catch(err){
  kofiTipsStatus.textContent="Could not load donations. Apply kofi-tips-integration.sql in Supabase and confirm dashboard sign-in. "+(err.message||"");
 }
}
$("#refresh-kofi-tips")?.addEventListener("click",loadKofiTips);

// Live admin inbox: use Supabase Realtime instead of frequent full-table polling.
let requestInboxChannel=null, requestInboxRealtimeReady=false, requestRefreshTimer=null;
function queueRequestRefresh(){
 if(inboxPanel.hidden||document.hidden)return;
 window.clearTimeout(requestRefreshTimer);
 requestRefreshTimer=window.setTimeout(()=>loadRequests(),250);
}
async function connectRequestInboxRealtime(){
 if(!client||requestInboxChannel)return;
 requestInboxChannel=client.channel("admin-song-requests-live")
  .on("postgres_changes",{event:"*",schema:"public",table:"song_requests"},queueRequestRefresh)
  .subscribe(status=>{
   requestInboxRealtimeReady=status==="SUBSCRIBED";
   if(status==="SUBSCRIBED"){queueRequestRefresh();}
   else if(status==="CHANNEL_ERROR"||status==="TIMED_OUT"||status==="CLOSED"){
    requestInboxRealtimeReady=false;
   }
  });
}
connectRequestInboxRealtime();
// Safety fallback only while Realtime is disconnected; 5 seconds as requested.
window.setInterval(()=>{
 if(!inboxPanel.hidden&&!document.hidden&&!requestInboxRealtimeReady)loadRequests();
},5000);
document.addEventListener("visibilitychange",()=>{
 if(!document.hidden&&!inboxPanel.hidden){loadRequests();connectRequestInboxRealtime();}
});

// Live-show settings: requires supabase-live-features.sql to be applied first.
const rockForm=$("#rock-meter-form"),rockAdminStatus=$("#rock-meter-admin-status"),pollForm=$("#encore-poll-form"),pollAdminStatus=$("#encore-admin-status");
async function loadLiveSettings(){if(!client)return;try{const {data,error}=await client.from("rock_meter_settings").select("goal_label,goal_amount,raised_amount").eq("id",1).maybeSingle();if(error)throw error;if(data){$("#rock-goal-label").value=data.goal_label;$("#rock-goal-amount").value=data.goal_amount;$("#rock-raised-amount").value=data.raised_amount;}}catch(e){rockAdminStatus.textContent="Run supabase-live-features.sql in Supabase to enable these tools.";}}
rockForm.addEventListener("submit",async e=>{e.preventDefault();if(!client)return;rockAdminStatus.textContent="Saving…";try{const row={id:1,goal_label:$("#rock-goal-label").value.trim(),goal_amount:Number($("#rock-goal-amount").value),raised_amount:Number($("#rock-raised-amount").value),updated_at:new Date().toISOString()};const {error}=await client.from("rock_meter_settings").upsert(row);if(error)throw error;rockAdminStatus.textContent="Rockometer saved.";}catch(err){rockAdminStatus.textContent=err.message||"Could not save Rockometer.";}});
pollForm.addEventListener("submit",async e=>{e.preventDefault();if(!client)return;const parseChoice=value=>{const bits=value.split(/\s+[—–-]\s+/);return {song_title:bits[0].trim(),artist_name:bits.slice(1).join(" — ").trim()||null};};const raw=[$("#encore-song-1").value,$("#encore-song-2").value,$("#encore-song-3").value].map(v=>v.trim()).filter(Boolean).map(parseChoice);if(raw.length<2){pollAdminStatus.textContent="Enter at least two song options.";return;}if(raw.some(x=>!x.song_title)){pollAdminStatus.textContent="Check the song titles and try again.";return;}pollAdminStatus.textContent="Publishing poll…";try{const {error:closeError}=await client.from("encore_polls").update({active:false}).eq("active",true);if(closeError)throw closeError;const {data:poll,error}=await client.from("encore_polls").insert({title:$("#encore-admin-title").value.trim(),active:$("#encore-poll-active").checked}).select("id").single();if(error)throw error;const choices=raw.map((x,i)=>({...x,poll_id:poll.id,sort_order:i+1}));const {error:choiceError}=await client.from("encore_choices").insert(choices);if(choiceError)throw choiceError;pollAdminStatus.textContent=`Poll published with ${choices.length} options. The public page updates automatically.`;}catch(err){pollAdminStatus.textContent=err.message||"Could not publish poll. Check that the live-features SQL has been applied.";}});
const originalShowSession=showSession;showSession=async function(){await originalShowSession();if(client){const {data:{session}}=await client.auth.getSession();if(session)await loadLiveSettings();}};
showSession();
