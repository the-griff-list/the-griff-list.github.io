/*
 * THE GRIFFLIST — EDIT THESE SETTINGS
 * Replace the example songs with your repertoire.
 * Decade should be one of: "60s", "70s", "80s", "90s", "2000s", "2010s", "2020s", or "Other".
 * difficulty is 1 (easiest live arrangement) to 5 (most challenging).
 * audio is optional and should point to a short, rights-cleared preview in the audio/ folder.
 */
const songs = [
  { title:"Take It Easy", artist:"Eagles", decade:"70s", genre:"Classic Rock", difficulty:2, key:"Not added", capo:"Not added", tuning:"Standard", notes:"Example entry — replace with your repertoire.", audio:"" },
  { title:"Country Roads", artist:"John Denver", decade:"70s", genre:"Acoustic / Country", difficulty:2, key:"Not added", capo:"Not added", tuning:"Standard", notes:"Example entry — replace with your repertoire.", audio:"" },
  { title:"Summer of '69", artist:"Bryan Adams", decade:"80s", genre:"Classic Rock", difficulty:3, key:"Not added", capo:"Not added", tuning:"Standard", notes:"Example entry — replace with your repertoire.", audio:"" },
  { title:"Wagon Wheel", artist:"Old Crow Medicine Show", decade:"2000s", genre:"Acoustic / Country", difficulty:2, key:"Not added", capo:"Not added", tuning:"Standard", notes:"Example entry — replace with your repertoire.", audio:"" },
  { title:"You Shook Me All Night Long", artist:"AC/DC", decade:"80s", genre:"Classic Rock", difficulty:3, key:"Not added", capo:"Not added", tuning:"Standard", notes:"Example entry — replace with your repertoire.", audio:"" }
];

// CHANGE THESE BEFORE PUBLISHING:
const config = {
  tipEmail: "YOUR-ETRANSFER-EMAIL@example.com",
  bookingUrl: "mailto:YOUR-BOOKING-EMAIL@example.com",
  // To receive requests, create a free Formspree form and replace the placeholder
  // action URL in index.html with your unique endpoint.
  previewSeconds: 15
};

const $ = selector => document.querySelector(selector);
const listEl = $("#song-list"), searchEl = $("#search"), decadeEl = $("#decade-filters");
const artistEl = $("#artist-filter"), countEl = $("#track-count"), emptyEl = $("#empty-state");
const dialog = $("#song-dialog");
let selectedDecade = "All";
let activeAudio = null;
let activeButton = null;
let stopTimer = null;

function safe(value, fallback="Not added") { return value && String(value).trim() ? String(value) : fallback; }
function esc(value) { return String(value ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c])); }
function decadeList() { return ["All", ...new Set(songs.map(s => safe(s.decade, "Other")))].sort((a,b) => a === "All" ? -1 : b === "All" ? 1 : a.localeCompare(b)); }
function renderDecades() {
  decadeEl.replaceChildren();
  decadeList().forEach(decade => {
    const button = document.createElement("button");
    button.type = "button"; button.className = "chip" + (decade === selectedDecade ? " active" : "");
    button.textContent = decade === "All" ? "ALL DECADES" : decade.toUpperCase();
    button.setAttribute("aria-pressed", String(decade === selectedDecade));
    button.addEventListener("click", () => { selectedDecade = decade; renderDecades(); renderSongs(); });
    decadeEl.appendChild(button);
  });
}
function renderArtists() {
  const current = artistEl.value || "All";
  const artists = [...new Set(songs.map(s => safe(s.artist, "Unknown artist")))].sort((a,b) => a.localeCompare(b));
  artistEl.replaceChildren(new Option("All artists", "All"));
  artists.forEach(artist => artistEl.add(new Option(artist, artist)));
  artistEl.value = artists.includes(current) ? current : "All";
}
function filteredSongs() {
  const q = searchEl.value.trim().toLocaleLowerCase();
  return songs.map((s,i)=>({...s,index:i})).filter(s => selectedDecade === "All" || safe(s.decade,"Other") === selectedDecade)
    .filter(s => artistEl.value === "All" || safe(s.artist,"Unknown artist") === artistEl.value)
    .filter(s => `${s.title} ${s.artist} ${s.genre} ${s.decade}`.toLocaleLowerCase().includes(q))
    .sort((a,b)=>a.title.localeCompare(b.title));
}
function levelMarkup(level) {
  const n = Math.max(1,Math.min(5,Number(level)||1));
  return `<span class="level" aria-label="Difficulty ${n} out of 5">${[1,2,3,4,5].map(i=>`<i class="${i<=n?"on":""}"></i>`).join("")}</span>`;
}
function renderSongs() {
  const visible = filteredSongs();
  countEl.textContent = `${String(songs.length).padStart(2,"0")} TRACK${songs.length===1?"":"S"}`;
  listEl.replaceChildren(); emptyEl.hidden = visible.length > 0;
  visible.forEach(song => {
    const row = document.createElement("div"); row.className = "song-row";
    const main = document.createElement("div"); main.className = "song-main";
    const preview = document.createElement("button"); preview.type = "button"; preview.className = "play-preview";
    preview.textContent = song.audio ? "▶" : "♪"; preview.title = song.audio ? `Play preview of ${song.title}` : "Add an audio preview in script.js";
    preview.setAttribute("aria-label", preview.title);
    preview.addEventListener("click", e => { e.stopPropagation(); song.audio ? togglePreview(song, preview) : openDetails(song); });
    const index = document.createElement("span"); index.className = "song-index"; index.textContent = String(song.index+1).padStart(3,"0");
    const title = document.createElement("span"); title.className = "song-title"; title.textContent = song.title;
    main.append(preview,index,title);
    const artist = document.createElement("span"); artist.className = "song-artist"; artist.textContent = song.artist || "Artist not listed";
    const level = document.createElement("span"); level.innerHTML = levelMarkup(song.difficulty);
    row.append(main,artist,level); row.tabIndex = 0; row.setAttribute("role","button"); row.setAttribute("aria-label",`Details for ${song.title} by ${song.artist}`);
    row.addEventListener("click",()=>openDetails(song)); row.addEventListener("keydown",e=>{if(e.key==="Enter"||e.key===" "){e.preventDefault();openDetails(song);}});
    listEl.appendChild(row);
  });
}
function stopPreview() {
  if (stopTimer) { clearTimeout(stopTimer); stopTimer=null; }
  if (activeAudio) { activeAudio.pause(); activeAudio.currentTime=0; activeAudio=null; }
  if (activeButton) { activeButton.classList.remove("playing"); activeButton.textContent="▶"; activeButton=null; }
}
function togglePreview(song, button) {
  if (activeButton === button) { stopPreview(); return; }
  stopPreview();
  const audio = new Audio(song.audio);
  audio.preload = "none";
  activeAudio = audio; activeButton = button;
  button.classList.add("playing"); button.textContent="Ⅱ";
  audio.addEventListener("ended",stopPreview,{once:true});
  audio.addEventListener("error",()=>{stopPreview();alert("This preview couldn't be loaded. Check the audio filename and path in script.js.");},{once:true});
  audio.play().then(()=>{stopTimer=setTimeout(stopPreview,Math.max(1,Number(config.previewSeconds)||15)*1000);}).catch(()=>{stopPreview();alert("Your browser couldn't play this preview. Check the file path and audio format.");});
}
function openDetails(song) {
  $("#dialog-number").textContent = `TRACK ${String(song.index+1).padStart(3,"0")}`;
  $("#dialog-title").textContent = song.title; $("#dialog-artist").textContent = song.artist || "Artist not listed";
  $("#dialog-difficulty").textContent = `${Math.max(1,Math.min(5,Number(song.difficulty)||1))} / 5`;
  $("#dialog-decade").textContent = safe(song.decade,"Other"); $("#dialog-key").textContent = safe(song.key);
  $("#dialog-setup").textContent = `${safe(song.capo)} / ${safe(song.tuning,"Standard")}`;
  $("#dialog-notes").textContent = safe(song.notes,"No notes added yet.");
  const tags=$("#dialog-tags"); tags.replaceChildren();
  [safe(song.genre,"Uncategorized"),safe(song.decade,"Other")].forEach(value=>{const span=document.createElement("span");span.textContent=value;tags.appendChild(span);});
  if (song.audio) {
    const p=document.createElement("span");p.textContent="PREVIEW AVAILABLE";tags.appendChild(p);
  }
  if (dialog.showModal) dialog.showModal(); else dialog.setAttribute("open","");
}
searchEl.addEventListener("input",renderSongs);
artistEl.addEventListener("change",renderSongs);
$("#close-dialog").addEventListener("click",()=>dialog.close());
dialog.addEventListener("click",e=>{if(e.target===dialog)dialog.close();});
document.addEventListener("keydown",e=>{if(e.key==="/"&&!["INPUT","TEXTAREA","SELECT"].includes(document.activeElement.tagName)){e.preventDefault();searchEl.focus();}});
window.addEventListener("pagehide",stopPreview);

// Request form: validates required name and at least one of song or artist.
// For actual delivery, connect the form to a free Formspree endpoint in index.html.
const requestForm=$("#request-form");
requestForm.addEventListener("submit",async e=>{
  e.preventDefault();
  const name=$("#requester-name").value.trim(), song=$("#request-song").value.trim(), artist=$("#request-artist").value.trim();
  const status=$("#form-status"), submit=requestForm.querySelector('button[type="submit"]');
  status.textContent="";
  if(!name){status.textContent="Please enter your name.";$("#requester-name").focus();return;}
  if(!song&&!artist){status.textContent="Please enter a song title, an artist, or both.";$("#request-song").focus();return;}
  const endpoint=requestForm.getAttribute("action");
  if(endpoint.includes("REPLACE_WITH_YOUR_FORM_ID")){
    status.textContent="The form is ready, but it isn't connected yet. Set up your free Formspree endpoint as described in README.md.";
    return;
  }
  submit.disabled=true; submit.textContent="SENDING REQUEST…";
  try{
    const response=await fetch(endpoint,{method:"POST",body:new FormData(requestForm),headers:{Accept:"application/json"}});
    if(response.ok){requestForm.reset();status.textContent="Request sent — thanks! Hopefully we can get it into a set soon.";}
    else{status.textContent="Sorry, the request couldn't be sent. Please try again in a moment.";}
  }catch(err){status.textContent="Couldn't connect to the request service. Please check your connection and try again.";}
  finally{submit.disabled=false;submit.innerHTML='SEND SONG REQUEST <span>↗</span>';}
});

// Tip email display and copy control.
$("#tip-email-display").textContent = config.tipEmail.includes("YOUR-ETRANSFER-EMAIL") ? "ADD YOUR EMAIL IN script.js" : config.tipEmail;
$("#copy-email").addEventListener("click",async()=>{
  const status=$("#tip-status");
  if(config.tipEmail.includes("YOUR-ETRANSFER-EMAIL")){status.textContent="Add your e-transfer email in script.js first.";return;}
  try{await navigator.clipboard.writeText(config.tipEmail);status.textContent="Tip email copied. Open your banking app to send an e-Transfer.";}
  catch(e){status.textContent=`Tip email: ${config.tipEmail}`;}
});
const bookingLink=$("#booking-link");
if(config.bookingUrl.includes("YOUR-BOOKING-EMAIL")) {
  bookingLink.href="#booking";
  bookingLink.addEventListener("click",e=>{e.preventDefault();alert("Add your booking email or website in the config section of script.js.");});
} else {bookingLink.href=config.bookingUrl;if(config.bookingUrl.startsWith("http")){bookingLink.target="_blank";bookingLink.rel="noopener noreferrer";}}

renderDecades();renderArtists();renderSongs();
