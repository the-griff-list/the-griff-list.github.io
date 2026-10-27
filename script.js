const songs = [
  { title: "Take It Easy", artist: "Eagles", year: 1972, decade: "70s", genre: "", difficulty: "", key: "", capo: "", tuning: "", notes: "", audio: "" },
  { title: "Take Me Home, Country Roads", artist: "John Denver", year: 1971, decade: "70s", genre: "", difficulty: "", key: "", capo: "", tuning: "", notes: "", audio: "" },
  { title: "Summer of '69", artist: "Bryan Adams", year: 1984, decade: "80s", genre: "", difficulty: "", key: "", capo: "", tuning: "", notes: "", audio: "" },
  { title: "You Shook Me All Night Long", artist: "AC/DC", year: 1980, decade: "80s", genre: "", difficulty: "", key: "", capo: "", tuning: "", notes: "", audio: "" },
  { title: "Sweet Home Alabama", artist: "Lynyrd Skynyrd", year: 1974, decade: "70s", genre: "", difficulty: "", key: "", capo: "", tuning: "", notes: "", audio: "" },
  { title: "Free Fallin’", artist: "Tom Petty", year: 1989, decade: "80s", genre: "", difficulty: "", key: "", capo: "", tuning: "", notes: "", audio: "" },
  { title: "Wanted Dead or Alive", artist: "Bon Jovi", year: 1986, decade: "80s", genre: "", difficulty: "", key: "", capo: "", tuning: "", notes: "", audio: "" },
  { title: "Rock and Roll Ain't Noise Pollution", artist: "AC/DC", year: 1980, decade: "80s", genre: "", difficulty: "", key: "", capo: "", tuning: "", notes: "", audio: "" },
  { title: "Sweet Caroline", artist: "Neil Diamond", year: 1969, decade: "60s", genre: "", difficulty: "", key: "", capo: "", tuning: "", notes: "", audio: "" },
  { title: "Wonderwall", artist: "Oasis", year: 1995, decade: "90s", genre: "", difficulty: "", key: "", capo: "", tuning: "", notes: "", audio: "" },
  { title: "Copperhead Road", artist: "Steve Earle", year: 1988, decade: "80s", genre: "", difficulty: "", key: "", capo: "", tuning: "", notes: "", audio: "" },
  { title: "Brown Eyed Girl", artist: "Van Morrison", year: 1967, decade: "60s", genre: "", difficulty: "", key: "", capo: "", tuning: "", notes: "", audio: "" },
  { title: "Have You Ever Seen the Rain?", artist: "Creedence Clearwater Revival", year: 1971, decade: "70s", genre: "", difficulty: "", key: "", capo: "", tuning: "", notes: "", audio: "" },
  { title: "Bad Moon Rising", artist: "Creedence Clearwater Revival", year: 1969, decade: "60s", genre: "", difficulty: "", key: "", capo: "", tuning: "", notes: "", audio: "" },
  { title: "Jack & Diane", artist: "John Cougar Mellencamp", year: 1982, decade: "80s", genre: "", difficulty: "", key: "", capo: "", tuning: "", notes: "", audio: "" },
  { title: "Patience", artist: "Guns N’ Roses", year: 1988, decade: "80s", genre: "", difficulty: "", key: "", capo: "", tuning: "", notes: "", audio: "" },
  { title: "Wish You Were Here", artist: "Pink Floyd", year: 1975, decade: "70s", genre: "", difficulty: "", key: "", capo: "", tuning: "", notes: "", audio: "" },
  { title: "Knockin’ on Heaven’s Door", artist: "Bob Dylan", year: 1973, decade: "70s", genre: "", difficulty: "", key: "", capo: "", tuning: "", notes: "", audio: "" },
  { title: "Old Time Rock and Roll", artist: "Bob Seger", year: 1978, decade: "70s", genre: "", difficulty: "", key: "", capo: "", tuning: "", notes: "", audio: "" },
  { title: "The Joker", artist: "Steve Miller Band", year: 1973, decade: "70s", genre: "", difficulty: "", key: "", capo: "", tuning: "", notes: "", audio: "" },
  { title: "Livin’ on a Prayer", artist: "Bon Jovi", year: 1986, decade: "80s", genre: "", difficulty: "", key: "", capo: "", tuning: "", notes: "", audio: "" },
  { title: "Don’t Look Back in Anger", artist: "Oasis", year: 1996, decade: "90s", genre: "", difficulty: "", key: "", capo: "", tuning: "", notes: "", audio: "" },
  { title: "Every Rose Has Its Thorn", artist: "Poison", year: 1988, decade: "80s", genre: "", difficulty: "", key: "", capo: "", tuning: "", notes: "", audio: "" },
  { title: "Talk Dirty to Me", artist: "Poison", year: 1987, decade: "80s", genre: "", difficulty: "", key: "", capo: "", tuning: "", notes: "", audio: "" },
  { title: "Twist and Shout", artist: "The Beatles", year: 1963, decade: "60s", genre: "", difficulty: "", key: "", capo: "", tuning: "", notes: "", audio: "" },
  { title: "Mama", artist: "The Glorious Sons", year: 2013, decade: "2010s", genre: "", difficulty: "", key: "", capo: "", tuning: "", notes: "", audio: "" },
  { title: "Peaceful Easy Feeling", artist: "Eagles", year: 1972, decade: "70s", genre: "", difficulty: "", key: "", capo: "", tuning: "", notes: "", audio: "" },
  { title: "Zombie", artist: "The Cranberries", year: 1994, decade: "90s", genre: "", difficulty: "", key: "", capo: "", tuning: "", notes: "", audio: "" },
  { title: "Heart and Soul", artist: "Huey Lewis and the News", year: 1983, decade: "80s", genre: "", difficulty: "", key: "", capo: "", tuning: "", notes: "", audio: "" },
  { title: "Footloose", artist: "Kenny Loggins", year: 1984, decade: "80s", genre: "", difficulty: "", key: "", capo: "", tuning: "", notes: "", audio: "" },
  { title: "New Girl Now", artist: "Honeymoon Suite", year: 1984, decade: "80s", genre: "", difficulty: "", key: "", capo: "", tuning: "", notes: "", audio: "" },
  { title: "Sister Christian", artist: "Night Ranger", year: 1983, decade: "80s", genre: "", difficulty: "", key: "", capo: "", tuning: "", notes: "", audio: "" },
  { title: "Two Steps Behind", artist: "Def Leppard", year: 1993, decade: "90s", genre: "", difficulty: "", key: "", capo: "", tuning: "", notes: "", audio: "" },
  { title: "Going to California", artist: "Led Zeppelin", year: 1971, decade: "70s", genre: "", difficulty: "", key: "", capo: "", tuning: "", notes: "", audio: "" },
  { title: "Sex and Candy", artist: "Marcy Playground", year: 1997, decade: "90s", genre: "", difficulty: "", key: "", capo: "", tuning: "", notes: "", audio: "" },
  { title: "Some Might Say", artist: "Oasis", year: 1995, decade: "90s", genre: "", difficulty: "", key: "", capo: "", tuning: "", notes: "", audio: "" },
  { title: "Signs", artist: "Tesla", year: 1990, decade: "90s", genre: "", difficulty: "", key: "", capo: "", tuning: "", notes: "", audio: "" },
  { title: "Hell Ain't a Bad Place to Be", artist: "AC/DC", year: 1977, decade: "70s", genre: "", difficulty: "", key: "", capo: "", tuning: "", notes: "", audio: "" },
  { title: "Wasted Years", artist: "Iron Maiden", year: 1986, decade: "80s", genre: "", difficulty: "", key: "", capo: "", tuning: "", notes: "", audio: "" },
  { title: "Thinking of You", artist: "Harlequin", year: 1978, decade: "70s", genre: "", difficulty: "", key: "", capo: "", tuning: "", notes: "", audio: "" },
  { title: "Here I Go Again", artist: "Whitesnake", year: 1982, decade: "80s", genre: "", difficulty: "", key: "", capo: "", tuning: "", notes: "", audio: "" },
  { title: "Hair of the Dog", artist: "Nazareth", year: 1975, decade: "70s", genre: "", difficulty: "", key: "", capo: "", tuning: "", notes: "", audio: "" },
  { title: "I Saw Her Standing There", artist: "The Beatles", year: 1963, decade: "60s", genre: "", difficulty: "", key: "", capo: "", tuning: "", notes: "", audio: "" },
  { title: "Fly at Night", artist: "Chilliwack", year: 1977, decade: "70s", genre: "", difficulty: "", key: "", capo: "", tuning: "", notes: "", audio: "" },
  { title: "Feel Like Makin’ Love", artist: "Bad Company", year: 1975, decade: "70s", genre: "", difficulty: "", key: "", capo: "", tuning: "", notes: "", audio: "" },
  { title: "Free Bird", artist: "Lynyrd Skynyrd", year: 1973, decade: "70s", genre: "", difficulty: "", key: "", capo: "", tuning: "", notes: "", audio: "" },
  { title: "Mony Mony", artist: "Billy Idol", year: 1981, decade: "80s", genre: "", difficulty: "", key: "", capo: "", tuning: "", notes: "", audio: "" },
  { title: "Loving You Ain’t Easy", artist: "Michael Pagliaro", year: 1971, decade: "70s", genre: "", difficulty: "", key: "", capo: "", tuning: "", notes: "", audio: "" },
  { title: "Take on Me", artist: "a-ha", year: 1985, decade: "80s", genre: "", difficulty: "", key: "", capo: "", tuning: "", notes: "", audio: "" },
  { title: "Fat Bottomed Girls", artist: "Queen", year: 1978, decade: "70s", genre: "", difficulty: "", key: "", capo: "", tuning: "", notes: "", audio: "" },
  { title: "Simple Man", artist: "Lynyrd Skynyrd", year: 1973, decade: "70s", genre: "", difficulty: "", key: "", capo: "", tuning: "", notes: "", audio: "" },
  { title: "Sex on Fire", artist: "Kings of Leon", year: 2008, decade: "2000s", genre: "", difficulty: "", key: "", capo: "", tuning: "", notes: "", audio: "" },
  { title: "You May Be Right", artist: "Billy Joel", year: 1980, decade: "80s", genre: "", difficulty: "", key: "", capo: "", tuning: "", notes: "", audio: "" },
  { title: "We’re Here for a Good Time", artist: "Trooper", year: 1971, decade: "70s", genre: "", difficulty: "", key: "", capo: "", tuning: "", notes: "", audio: "" },
  { title: "Authority Song", artist: "John Cougar Mellencamp", year: 1984, decade: "80s", genre: "", difficulty: "", key: "", capo: "", tuning: "", notes: "", audio: "" },
  { title: "Tush", artist: "ZZ Top", year: 1975, decade: "70s", genre: "", difficulty: "", key: "", capo: "", tuning: "", notes: "", audio: "" },
  { title: "Enter Sandman", artist: "Metallica", year: 1991, decade: "90s", genre: "", difficulty: "", key: "", capo: "", tuning: "", notes: "", audio: "" },
  { title: "Jukebox Hero", artist: "Foreigner", year: 1981, decade: "80s", genre: "", difficulty: "", key: "", capo: "", tuning: "", notes: "", audio: "" },
  { title: "I Want to Know What Love Is", artist: "Foreigner", year: 1984, decade: "80s", genre: "", difficulty: "", key: "", capo: "", tuning: "", notes: "", audio: "" },
  { title: "Sweet Emotion", artist: "Aerosmith", year: 1975, decade: "70s", genre: "", difficulty: "", key: "", capo: "", tuning: "", notes: "", audio: "" },
  { title: "Black Magic Woman", artist: "Santana", year: 1970, decade: "70s", genre: "", difficulty: "", key: "", capo: "", tuning: "", notes: "", audio: "" },
  { title: "Harvest Moon", artist: "Neil Young", year: 1992, decade: "90s", genre: "", difficulty: "", key: "", capo: "", tuning: "", notes: "", audio: "" },
  { title: "Angel Eyes", artist: "Jeff Healey", year: 1988, decade: "80s", genre: "", difficulty: "", key: "", capo: "", tuning: "", notes: "", audio: "" },
  { title: "Sin City", artist: "AC/DC", year: 1978, decade: "70s", genre: "", difficulty: "", key: "", capo: "", tuning: "", notes: "", audio: "" },
  { title: "Let There Be Rock", artist: "AC/DC", year: 1977, decade: "70s", genre: "", difficulty: "", key: "", capo: "", tuning: "", notes: "", audio: "" },
  { title: "Whole Lotta Rosie", artist: "AC/DC", year: 1977, decade: "70s", genre: "", difficulty: "", key: "", capo: "", tuning: "", notes: "", audio: "" },
  { title: "Dog Eat Dog", artist: "AC/DC", year: 1977, decade: "70s", genre: "", difficulty: "", key: "", capo: "", tuning: "", notes: "", audio: "" },
  { title: "Shot Down in Flames", artist: "AC/DC", year: 1979, decade: "70s", genre: "", difficulty: "", key: "", capo: "", tuning: "", notes: "", audio: "" },
  { title: "I Want You to Want Me", artist: "Cheap Trick", year: 1977, decade: "70s", genre: "", difficulty: "", key: "", capo: "", tuning: "", notes: "", audio: "" },
  { title: "Tuesday’s Gone", artist: "Lynyrd Skynyrd", year: 1973, decade: "70s", genre: "", difficulty: "", key: "", capo: "", tuning: "", notes: "", audio: "" },
  { title: "Strutter", artist: "KISS", year: 1974, decade: "70s", genre: "", difficulty: "", key: "", capo: "", tuning: "", notes: "", audio: "" },
  { title: "My Own Worst Enemy", artist: "Lit", year: 1999, decade: "90s", genre: "", difficulty: "", key: "", capo: "", tuning: "", notes: "", audio: "" },
  { title: "Baba O’Riley", artist: "The Who", year: 1971, decade: "70s", genre: "", difficulty: "", key: "", capo: "", tuning: "", notes: "", audio: "" },
  { title: "I Believe in a Thing Called Love", artist: "The Darkness", year: 2003, decade: "2000s", genre: "", difficulty: "", key: "", capo: "", tuning: "", notes: "", audio: "" },
  { title: "Shout It Out Loud", artist: "KISS", year: 1976, decade: "70s", genre: "", difficulty: "", key: "", capo: "", tuning: "", notes: "", audio: "" },
  { title: "I Was Made for Lovin’ You", artist: "KISS", year: 1979, decade: "70s", genre: "", difficulty: "", key: "", capo: "", tuning: "", notes: "", audio: "" },
  { title: "Hurts So Good", artist: "John Cougar Mellencamp", year: 1982, decade: "80s", genre: "", difficulty: "", key: "", capo: "", tuning: "", notes: "", audio: "" },
  { title: "Lick It Up", artist: "KISS", year: 1983, decade: "80s", genre: "", difficulty: "", key: "", capo: "", tuning: "", notes: "", audio: "" },
  { title: "Hysteria", artist: "Def Leppard", year: 1987, decade: "80s", genre: "", difficulty: "", key: "", capo: "", tuning: "", notes: "", audio: "" },
  { title: "Rock and Roll Girls", artist: "John Fogerty", year: 1985, decade: "80s", genre: "", difficulty: "", key: "", capo: "", tuning: "", notes: "", audio: "" },
  { title: "New York Groove", artist: "Ace Frehley", year: 1978, decade: "70s", genre: "", difficulty: "", key: "", capo: "", tuning: "", notes: "", audio: "" },
  { title: "Dirty Deeds Done Dirt Cheap", artist: "AC/DC", year: 1976, decade: "70s", genre: "", difficulty: "", key: "", capo: "", tuning: "", notes: "", audio: "" },
  { title: "You Could Have Been a Lady", artist: "April Wine", year: 1972, decade: "70s", genre: "", difficulty: "", key: "", capo: "", tuning: "", notes: "", audio: "" },
  { title: "Making It Work", artist: "Doug and the Slugs", year: 1982, decade: "80s", genre: "", difficulty: "", key: "", capo: "", tuning: "", notes: "", audio: "" },
  { title: "Slow Ride", artist: "Foghat", year: 1975, decade: "70s", genre: "", difficulty: "", key: "", capo: "", tuning: "", notes: "", audio: "" },
  { title: "Cocaine", artist: "Eric Clapton", year: 1977, decade: "70s", genre: "", difficulty: "", key: "", capo: "", tuning: "", notes: "", audio: "" },
  { title: "What I Like About You", artist: "The Romantics", year: 1980, decade: "80s", genre: "", difficulty: "", key: "", capo: "", tuning: "", notes: "", audio: "" },
  { title: "High Voltage", artist: "AC/DC", year: 1975, decade: "70s", genre: "", difficulty: "", key: "", capo: "", tuning: "", notes: "", audio: "" },
  { title: "Crazy Little Thing Called Love", artist: "Queen", year: 1979, decade: "70s", genre: "", difficulty: "", key: "", capo: "", tuning: "", notes: "", audio: "" },
  { title: "Surrender", artist: "Cheap Trick", year: 1978, decade: "70s", genre: "", difficulty: "", key: "", capo: "", tuning: "", notes: "", audio: "" },
  { title: "Ballroom Blitz", artist: "Sweet", year: 1973, decade: "70s", genre: "", difficulty: "", key: "", capo: "", tuning: "", notes: "", audio: "" },
  { title: "Roxy Roller", artist: "Sweeney Todd", year: 1976, decade: "70s", genre: "", difficulty: "", key: "", capo: "", tuning: "", notes: "", audio: "" },
  { title: "You Really Got Me", artist: "Van Halen", year: 1978, decade: "70s", genre: "", difficulty: "", key: "", capo: "", tuning: "", notes: "", audio: "" },
  { title: "Ain't Talkin' 'Bout Love", artist: "Van Halen", year: 1978, decade: "70s", genre: "", difficulty: "", key: "", capo: "", tuning: "", notes: "", audio: "" },
  { title: "Panama", artist: "Van Halen", year: 1984, decade: "80s", genre: "", difficulty: "", key: "", capo: "", tuning: "", notes: "", audio: "" },
  { title: "Keep Your Hands to Yourself", artist: "Georgia Satellites", year: 1986, decade: "80s", genre: "", difficulty: "", key: "", capo: "", tuning: "", notes: "", audio: "" },
  { title: "Run to You", artist: "Bryan Adams", year: 1984, decade: "80s", genre: "", difficulty: "", key: "", capo: "", tuning: "", notes: "", audio: "" },
  { title: "Somebody", artist: "Bryan Adams", year: 1984, decade: "80s", genre: "", difficulty: "", key: "", capo: "", tuning: "", notes: "", audio: "" },
  { title: "Blow at High Dough", artist: "The Tragically Hip", year: 1989, decade: "80s", genre: "", difficulty: "", key: "", capo: "", tuning: "", notes: "", audio: "" },
  { title: "New Orleans Is Sinking", artist: "The Tragically Hip", year: 1989, decade: "80s", genre: "", difficulty: "", key: "", capo: "", tuning: "", notes: "", audio: "" },
  { title: "She Ain't Pretty", artist: "The Northern Pikes", year: 1990, decade: "90s", genre: "", difficulty: "", key: "", capo: "", tuning: "", notes: "", audio: "" },
  { title: "Cuts Like a Knife", artist: "Bryan Adams", year: 1983, decade: "80s", genre: "", difficulty: "", key: "", capo: "", tuning: "", notes: "", audio: "" },
  { title: "Heaven", artist: "Bryan Adams", year: 1984, decade: "80s", genre: "", difficulty: "", key: "", capo: "", tuning: "", notes: "", audio: "" },
  { title: "Call Me the Breeze", artist: "Lynyrd Skynyrd", year: 1974, decade: "70s", genre: "", difficulty: "", key: "", capo: "", tuning: "", notes: "", audio: "" },
  { title: "Rebel Yell", artist: "Billy Idol", year: 1983, decade: "80s", genre: "", difficulty: "", key: "", capo: "", tuning: "", notes: "", audio: "" },
  { title: "Rock and Roll All Nite", artist: "Kiss", year: 1975, decade: "70s", genre: "", difficulty: "", key: "", capo: "", tuning: "", notes: "", audio: "" }
];

// Site settings — replace these placeholders when you're ready.
const config = {
  tipEmail: "acdckicksass@hotmail.com",
  bookingUrl: "mailto:griffenarsenaultmusic@hotmail.com",
  previewSeconds: 15
};
const $ = selector => document.querySelector(selector);
const listEl = $("#song-list"), searchEl = $("#search"), decadeEl = $("#decade-filters");
const artistEl = $("#artist-filter"), countEl = $("#track-count"), emptyEl = $("#empty-state");

let selectedDecade = "All", activeAudio = null, activeButton = null, stopTimer = null;
const decades = ["All", "60s", "70s", "80s", "90s", "2000s", "2010s"];
const countryArtists = ["John Denver", "Steve Earle", "Garth Brooks", "Johnny Cash", "Old Crow Medicine Show", "Chris Stapleton", "The Eagles", "Eagles", "The Band", "Neil Young", "Lynyrd Skynyrd", "Creedence Clearwater Revival", "Bob Seger", "Tom Petty", "Tom Petty and the Heartbreakers", "The Marshall Tucker Band", "The Allman Brothers Band", "The Rolling Stones", "The Tragically Hip", "Trooper", "The Guess Who", "The Doobie Brothers", "The Northern Pikes", "Georgia Satellites", "Steve Miller Band", "The Glorious Sons", "Michael Pagliaro", "April Wine", "Sweeney Todd", "The Romantics", "The Outfield"];
function genreFor(song) {
  if (song.genre && song.genre.trim()) return song.genre;
  const a = song.artist || "";
  return countryArtists.includes(a) ? "Classic Country" : "Classic Rock";
}
function safe(value, fallback="Not added") { return value && String(value).trim() ? String(value) : fallback; }
function artistCompare(a,b) {
  const aa=(a.artist||"").trim(), bb=(b.artist||"").trim();
  const as=/^[^A-Za-z]/.test(aa), bs=/^[^A-Za-z]/.test(bb);
  if(as!==bs) return as ? 1 : -1;
  return aa.localeCompare(bb, undefined, {sensitivity:"base"}) || a.title.localeCompare(b.title,undefined,{sensitivity:"base"});
}
function renderDecades() {
  decadeEl.replaceChildren();
  decades.forEach(d => {
    const b=document.createElement("button"); b.type="button"; b.className="chip"+(selectedDecade===d?" active":"");
    b.textContent=d==="All"?"ALL DECADES":d.toUpperCase(); b.setAttribute("aria-pressed",String(selectedDecade===d));
    b.addEventListener("click",()=>{selectedDecade=d;renderDecades();renderSongs();}); decadeEl.appendChild(b);
  });
}
function renderArtists() {
  const current=artistEl.value||"All";
  const artists=[...new Set(songs.map(s=>s.artist).filter(Boolean))].sort((a,b)=>{
    const an=/^[^A-Za-z]/.test(a),bn=/^[^A-Za-z]/.test(b); if(an!==bn)return an?1:-1;
    return a.localeCompare(b,undefined,{sensitivity:"base"});
  });
  artistEl.replaceChildren(new Option("All artists","All")); artists.forEach(a=>artistEl.add(new Option(a,a)));
  artistEl.value=artists.includes(current)?current:"All";
}

function filteredSongs(){const q=searchEl.value.trim().toLocaleLowerCase();return songs.map((s,i)=>({...s,index:i,displayGenre:genreFor(s)}))
 .filter(s=>selectedDecade==="All"||s.decade===selectedDecade)
 .filter(s=>artistEl.value==="All"||s.artist===artistEl.value)
 .filter(s=>`${s.title} ${s.artist} ${s.displayGenre} ${s.decade} ${s.year||""}`.toLocaleLowerCase().includes(q))
 .sort(artistCompare);}
function renderSongs(){const visible=filteredSongs();countEl.textContent=`${songs.length} SONGS`;listEl.replaceChildren();emptyEl.hidden=visible.length>0;
 visible.forEach(song=>{const row=document.createElement("button");row.type="button";row.className="song-row";
  const artist=document.createElement("span");artist.className="song-artist";artist.textContent=song.artist||"Artist not listed";
  const songCell=document.createElement("span");songCell.className="song-cell";
  const title=document.createElement("span");title.className="song-title";title.textContent=song.title;
  songCell.append(title);
  const year=document.createElement("span");year.className="song-year";year.textContent=song.year||"—";
  row.append(artist,songCell,year);row.setAttribute("aria-label",`Select ${song.title} by ${song.artist} for a request`);row.addEventListener("click",()=>selectSongForRequest(song));listEl.appendChild(row);
 });}
function stopPreview(){if(stopTimer){clearTimeout(stopTimer);stopTimer=null;}if(activeAudio){activeAudio.pause();activeAudio.currentTime=0;activeAudio=null;}if(activeButton){activeButton.classList.remove("playing");activeButton.textContent="▶";activeButton=null;}}
function togglePreview(song,button){if(activeButton===button){stopPreview();return;}stopPreview();const audio=new Audio(song.audio);activeAudio=audio;activeButton=button;button.classList.add("playing");button.textContent="Ⅱ";audio.addEventListener("ended",stopPreview,{once:true});audio.addEventListener("error",()=>{stopPreview();alert("This preview couldn't be loaded. Check its path in script.js.");},{once:true});audio.play().then(()=>{stopTimer=setTimeout(stopPreview,Math.max(1,Number(config.previewSeconds)||15)*1000);}).catch(()=>{stopPreview();alert("Your browser couldn't play this preview.");});}
function selectSongForRequest(song){
 const songInput=$("#request-song"), artistInput=$("#request-artist"), hint=$("#request-hint");
 songInput.value=song.title; artistInput.value=song.artist||"";
 hint.hidden=false; hint.classList.remove("hint-pulse"); void hint.offsetWidth; hint.classList.add("hint-pulse");
 document.querySelector("#request").scrollIntoView({behavior:"smooth",block:"start"});
 window.setTimeout(()=>$("#requester-name").focus({preventScroll:true}),450);
}
searchEl.addEventListener("input",renderSongs);artistEl.addEventListener("change",renderSongs);document.addEventListener("keydown",e=>{if(e.key==="/"&&!['INPUT','TEXTAREA','SELECT'].includes(document.activeElement.tagName)){e.preventDefault();searchEl.focus();}});window.addEventListener("pagehide",stopPreview);
// Public visitors can submit requests; the database only permits public INSERTs.
const requestForm=$("#request-form");
requestForm.addEventListener("submit",async e=>{
 e.preventDefault();const name=$("#requester-name").value.trim(),song=$("#request-song").value.trim(),artist=$("#request-artist").value.trim(),message=$("#request-message").value.trim(),status=$("#form-status"),submit=requestForm.querySelector('button[type="submit"]');
 status.textContent="";if(!name){status.textContent="Please enter your name.";$("#requester-name").focus();return;}if(!song){status.textContent="Please enter a song name.";$("#request-song").focus();return;}
 const client=window.supabaseClient; if(!client){status.textContent="Online requests are being set up. Please try again later.";return;}
 const fingerprint=[name,song,artist,message].map(v=>v.trim().toLowerCase()).join("|");const storageKey="grifflistLastRequest";let previous=null;try{previous=JSON.parse(sessionStorage.getItem(storageKey)||"null");}catch(e){}if(previous&&previous.fingerprint===fingerprint&&Date.now()-previous.time<5*60*1000){status.textContent="That same request was just sent. Please wait five minutes before sending it again.";return;}
 if(submit.disabled)return;submit.disabled=true;submit.textContent="SENDING REQUEST…";
 try{const {error}=await client.from("song_requests").insert({requester_name:name,song_title:song,artist_name:artist||null,note:message||null});if(error)throw error;try{sessionStorage.setItem(storageKey,JSON.stringify({fingerprint,time:Date.now()}));}catch(e){}status.textContent="Request sent! Thanks for helping choose the music.";requestForm.reset();$("#request-hint").hidden=true;}catch(err){console.error("Request submission failed",err);status.textContent="Sorry, your request couldn't be sent right now. Please try again in a moment.";}finally{submit.disabled=false;submit.textContent="SEND SONG REQUEST ↗";}
});
const tipButton=$("#copy-email"),tipStatus=$("#tip-status");
tipButton.addEventListener("click",async()=>{try{await navigator.clipboard.writeText(config.tipEmail);tipStatus.textContent="E-transfer email copied — open your banking app to send it.";}catch(e){tipStatus.textContent=`E-transfer email: ${config.tipEmail}. If copying was blocked, press and hold the address to copy it.`;}});
const bookingCopy=$("#booking-copy"), bookingStatus=$("#booking-status");
bookingCopy.addEventListener("click", async()=>{try{await navigator.clipboard.writeText("griffenarsenaultmusic@hotmail.com");bookingStatus.textContent="Booking email copied.";}catch(e){bookingStatus.textContent="Email: griffenarsenaultmusic@hotmail.com — select and copy it.";}});
// Swapped sound roles: UI Sound 06R (title-screen-sound.mp3) is used for navigation; the original select sound plays when entering the site.
const splash=$("#splash"), selectSound=$("#select-sound"), titleScreenSound=$("#title-screen-sound");
function playSelectSound(){if(!selectSound)return;try{selectSound.currentTime=0;const attempt=selectSound.play();if(attempt&&typeof attempt.catch==="function")attempt.catch(()=>{});}catch(e){}}
function playTitleScreenSound(){if(!titleScreenSound)return;try{titleScreenSound.currentTime=0;const attempt=titleScreenSound.play();if(attempt&&typeof attempt.catch==="function")attempt.catch(()=>{});}catch(e){}}
document.querySelectorAll('.top-nav a, #copy-email, #booking-copy, .social-links a, .secret-entry').forEach(el=>el.addEventListener('click',playTitleScreenSound));
function enterSite(){
  if(splash.classList.contains("dismissed")) return;
  playSelectSound();
  splash.classList.add("dismissed");document.body.classList.remove("splash-open");
  try{sessionStorage.setItem("grifflistEntered","yes");}catch(e){}
}
let alreadyEntered=false;try{alreadyEntered=sessionStorage.getItem("grifflistEntered")==="yes";}catch(e){}
if(alreadyEntered){splash.classList.add("dismissed");document.body.classList.remove("splash-open");}else document.body.classList.add("splash-open");
splash.addEventListener("click",enterSite);
splash.addEventListener("keydown",e=>{if(e.key==="Enter"||e.key===" "){e.preventDefault();enterSite();}});
document.addEventListener("keydown",e=>{if(!splash.classList.contains("dismissed")&&(e.key==="Enter"||e.key===" "))enterSite();});
renderDecades();renderArtists();renderSongs();
