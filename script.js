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

// Site settings - replace these placeholders when you're ready.
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
    b.addEventListener("click",()=>{playSfx("select-sfx");selectedDecade=d;renderDecades();renderSongs();}); decadeEl.appendChild(b);
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

function normalizeSearchText(value){return String(value||"").toLocaleLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-z0-9]+/g,"");}
function filteredSongs(){const q=normalizeSearchText(searchEl.value);return songs.map((s,i)=>({...s,index:i,displayGenre:genreFor(s)}))
 .filter(s=>selectedDecade==="All"||s.decade===selectedDecade)
 .filter(s=>artistEl.value==="All"||s.artist===artistEl.value)
 .filter(s=>!q||normalizeSearchText(`${s.title} ${s.artist} ${s.displayGenre} ${s.decade} ${s.year||""}`).includes(q))
 .sort(artistCompare);}
function renderSongs(){const visible=filteredSongs();countEl.textContent=`${songs.length} SONGS`;listEl.replaceChildren();emptyEl.hidden=visible.length>0;
 visible.forEach(song=>{const row=document.createElement("button");row.type="button";row.className="song-row";
  const artist=document.createElement("span");artist.className="song-artist";artist.textContent=song.artist||"Artist not listed";
  const songCell=document.createElement("span");songCell.className="song-cell";
  const title=document.createElement("span");title.className="song-title";title.textContent=song.title;
  songCell.append(title);
  const year=document.createElement("span");year.className="song-year";year.textContent=song.year||"-";
  row.append(artist,songCell,year);row.setAttribute("aria-label",`Select ${song.title} by ${song.artist} for a request`);row.addEventListener("click",()=>{playSfx("notes-ripple-sfx");selectSongForRequest(song);const remembered=localStorage.getItem("grifflistRememberName.v1")==="yes";const nameInput=$("#requester-name");if(remembered&&nameInput?.value.trim()&&!$("#request-message")?.value.trim()&&!$("#priority-request")?.checked){window.setTimeout(()=>requestForm.requestSubmit(),120);}else if(nameInput){/* Keep the mobile keyboard closed; the form scrolls into view. */}});listEl.appendChild(row);
 });}
function stopPreview(){if(stopTimer){clearTimeout(stopTimer);stopTimer=null;}if(activeAudio){activeAudio.pause();activeAudio.currentTime=0;activeAudio=null;}if(activeButton){activeButton.classList.remove("playing");activeButton.textContent="▶";activeButton=null;}}
function togglePreview(song,button){if(activeButton===button){stopPreview();return;}stopPreview();const audio=new Audio(song.audio);activeAudio=audio;activeButton=button;button.classList.add("playing");button.textContent="Ⅱ";audio.addEventListener("ended",stopPreview,{once:true});audio.addEventListener("error",()=>{stopPreview();alert("This preview couldn't be loaded. Check its path in script.js.");},{once:true});audio.play().then(()=>{stopTimer=setTimeout(stopPreview,Math.max(1,Number(config.previewSeconds)||15)*1000);}).catch(()=>{stopPreview();alert("Your browser couldn't play this preview.");});}
function brieflyHighlightSection(target){
 if(!target)return;
 document.querySelectorAll(".section.section-highlight").forEach(el=>el.classList.remove("section-highlight"));
 target.classList.remove("section-highlight");void target.offsetWidth;target.classList.add("section-highlight");
 window.setTimeout(()=>target.classList.remove("section-highlight"),1700);
}
function selectSongForRequest(song){
 const songInput=$("#request-song"), artistInput=$("#request-artist"), hint=$("#request-hint"), section=$("#request");
 songInput.value=song.title; artistInput.value=song.artist||"";
 hint.hidden=false; hint.classList.remove("hint-pulse");
 const reveal=document.querySelector("#song-reveal");if(reveal)reveal.open=false;const closeList=document.querySelector("#close-song-list");if(closeList)closeList.hidden=true;section.scrollIntoView({behavior:window.matchMedia("(prefers-reduced-motion: reduce)").matches?"auto":"smooth",block:"start"});
 brieflyHighlightSection(section);
 // Deliberately do not focus the name field: mobile keyboards must remain closed.
}
searchEl.addEventListener("input",()=>{const reveal=document.querySelector("#song-reveal");if(reveal&&searchEl.value.trim())reveal.open=true;renderSongs();});searchEl.addEventListener("keydown",e=>{if(e.key==="Enter"){e.preventDefault();searchEl.blur();const reveal=document.querySelector("#song-reveal");if(reveal)reveal.open=true;renderSongs();document.querySelector("#song-list")?.scrollIntoView({behavior:"smooth",block:"start"});}});artistEl.addEventListener("change",()=>{const reveal=document.querySelector("#song-reveal");if(reveal&&artistEl.value!=="All")reveal.open=true;renderSongs();});document.addEventListener("keydown",e=>{if(e.key==="/"&&!['INPUT','TEXTAREA','SELECT'].includes(document.activeElement.tagName)){e.preventDefault();searchEl.focus();}});window.addEventListener("pagehide",stopPreview);
// Public visitors can submit requests; the database only permits public INSERTs.
const requestForm=$("#request-form");
const priorityToggle=$("#priority-request"), priorityPaymentWrap=$("#priority-payment-wrap");
let priorityAlreadyTipped=false;
function isPrioritySelected(){return Boolean(priorityToggle?.checked);}
function setPrioritySelected(selected,{alreadyTipped=false}={}){
 if(!priorityToggle)return;
 priorityToggle.checked=Boolean(selected);
 priorityToggle.closest(".priority-option")?.classList.toggle("is-selected",Boolean(selected));
 priorityPaymentWrap.hidden=!selected;
 priorityAlreadyTipped=Boolean(selected&&alreadyTipped);
 if(!selected){const method=document.querySelector("#priority-payment-method");if(method)method.value="";}
}
priorityToggle.addEventListener("change",()=>setPrioritySelected(priorityToggle.checked));
const requesterNameInput=$("#requester-name"), rememberNameCheckbox=$("#remember-requester-name");
try{if(localStorage.getItem("grifflistRememberName.v1")==="yes"){rememberNameCheckbox.checked=true;requesterNameInput.value=localStorage.getItem("grifflistRememberedName.v1")||"";}}catch(e){}
rememberNameCheckbox?.addEventListener("change",()=>{try{if(rememberNameCheckbox.checked){localStorage.setItem("grifflistRememberName.v1","yes");if(requesterNameInput.value.trim())localStorage.setItem("grifflistRememberedName.v1",requesterNameInput.value.trim());}else{localStorage.removeItem("grifflistRememberName.v1");localStorage.removeItem("grifflistRememberedName.v1");}}catch(e){}});
requesterNameInput?.addEventListener("change",()=>{try{if(rememberNameCheckbox?.checked&&requesterNameInput.value.trim())localStorage.setItem("grifflistRememberedName.v1",requesterNameInput.value.trim());}catch(e){}});
const requestStatusButton=$("#check-last-request"), requestStatusResult=$("#request-status-result");
requestStatusButton?.addEventListener("click",async()=>{const token=localStorage.getItem("grifflistLastRequestToken.v1");if(!token){requestStatusResult.textContent="No recent request is saved on this device yet.";return;}if(!window.supabaseClient){requestStatusResult.textContent="Request status is temporarily unavailable.";return;}requestStatusButton.disabled=true;requestStatusResult.textContent="Checking…";try{const {data,error}=await window.supabaseClient.rpc("get_my_request_status",{p_tracking_token:token});if(error)throw error;const row=Array.isArray(data)?data[0]:data;if(!row){requestStatusResult.textContent="We couldn't find that request. It may have been archived or the status link expired.";}else{requestStatusResult.textContent=`${row.song_title}${row.artist_name?" - "+row.artist_name:""}: ${row.status||"Received"}.`;}}catch(e){requestStatusResult.textContent="Status lookup needs the included Supabase migration. Please try again later.";}finally{requestStatusButton.disabled=false;}});
requestForm.addEventListener("submit",async e=>{
 e.preventDefault();const name=$("#requester-name").value.trim(),song=$("#request-song").value.trim(),artist=$("#request-artist").value.trim(),message=$("#request-message").value.trim(),status=$("#form-status"),submit=requestForm.querySelector('button[type="submit"]');
 status.textContent="";if(!name){status.textContent="Please enter your name.";$("#requester-name").focus();return;}if(!song){status.textContent="Please enter a song name.";$("#request-song").focus();return;}
 const client=window.supabaseClient; if(!client){status.textContent="Online requests are being set up. Please try again later.";return;}
 const priority=isPrioritySelected();const paymentMethod=$("#priority-payment-method").value;if(priority&&!paymentMethod){status.textContent="Choose how you’ll send your $5 CAD tip.";$("#priority-payment-method").focus();return;}const priorityMarker=priority?(priorityAlreadyTipped?"[PRIORITY TIP REPORTED - VERIFY PAYMENT]":"[PRIORITY TIP PENDING - VERIFY PAYMENT]"):"";const savedNote=[priority?`${priorityMarker} Method: ${paymentMethod}`:"",message].filter(Boolean).join("\n\n");const fingerprint=[name,song,artist,savedNote].map(v=>v.trim().toLowerCase()).join("|");const storageKey="grifflistLastRequest";let previous=null;try{previous=JSON.parse(sessionStorage.getItem(storageKey)||"null");}catch(e){}if(previous&&previous.fingerprint===fingerprint&&Date.now()-previous.time<5*60*1000){status.textContent="That same request was just sent. Please wait five minutes before sending it again.";return;}
 if(submit.disabled)return;submit.disabled=true;submit.textContent="SENDING REQUEST…";
 try{const trackingToken=(crypto.randomUUID?crypto.randomUUID():([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g,c=>(c^crypto.getRandomValues(new Uint8Array(1))[0]&15>>c/4).toString(16)));const {error}=await client.from("song_requests").insert({requester_name:name,song_title:song,artist_name:artist||null,note:savedNote||null,tracking_token:trackingToken});if(error)throw error;try{localStorage.setItem("grifflistLastRequestToken.v1",trackingToken);sessionStorage.setItem(storageKey,JSON.stringify({fingerprint,time:Date.now()}));}catch(e){}if(requestStatusResult)requestStatusResult.textContent="Your latest request is saved on this device. Use Check My Last Request to see its status.";status.textContent=priority?(priorityAlreadyTipped?"Priority request submitted. Your payment will be checked manually.":"Request saved! Complete your $5 CAD tip using the highlighted payment option below."):"Request sent! Thanks for helping choose the music.";playSfx("you-rock-sfx");const shouldGoPay=priority&&!priorityAlreadyTipped;const chosenMethod=paymentMethod;requestForm.reset();if(rememberNameCheckbox?.checked||localStorage.getItem("grifflistRememberName.v1")==="yes"){if(rememberNameCheckbox)rememberNameCheckbox.checked=true;if(requesterNameInput)requesterNameInput.value=localStorage.getItem("grifflistRememberedName.v1")||name;}setPrioritySelected(false);$("#request-hint").hidden=true;if(shouldGoPay){window.setTimeout(()=>focusPaymentMethod(chosenMethod),180);}priorityAlreadyTipped=false;}catch(err){console.error("Request submission failed",err);const code=String(err?.code||"");if(code==="42501"||/row-level security|permission denied/i.test(String(err?.message||""))){status.textContent="The request database is blocking public submissions. The Supabase song-request INSERT policy needs to be enabled.";}else if(code==="PGRST204"||/column .* does not exist|schema cache/i.test(String(err?.message||""))){status.textContent="The song-request database is missing a required column. Apply the included Grifflist database migrations in Supabase.";}else{status.textContent="Request could not be saved. Check your connection and the Supabase song_requests table/policies, then try again.";}}finally{submit.disabled=false;submit.textContent="SEND SONG REQUEST ↗";}
});
const tipButton=$("#copy-email"),tipStatus=$("#tip-status");
tipButton.addEventListener("click",async()=>{playSfx("cash-sfx");try{await navigator.clipboard.writeText(config.tipEmail);tipStatus.textContent="E-transfer email copied - open your banking app to send it.";}catch(e){tipStatus.textContent=`E-transfer email: ${config.tipEmail}. If copying was blocked, press and hold the address to copy it.`;}});
const bookingCopy=$("#booking-copy"), bookingStatus=$("#booking-status");
bookingCopy.addEventListener("click", async()=>{playSfx("highway-riser-sfx");try{await navigator.clipboard.writeText("griffenarsenaultmusic@hotmail.com");bookingStatus.textContent="Booking email copied.";}catch(e){bookingStatus.textContent="Email: griffenarsenaultmusic@hotmail.com - select and copy it.";}});
// Audio behavior: never autoplay the title sound on page load. The first title-screen gesture starts it once; menu music crossfades in near the end.
const splash=$("#splash");
const titleAudio=$("#title-screen-audio"), menuAudio=$("#menu-screen-audio");
const audioVolumes={
  "title-screen-audio":0.78,
  "menu-screen-audio":0.30,
  "cash-sfx":0.78,
  "highway-riser-sfx":0.78,
  "notes-ripple-sfx":0.78,
  "scroll-sfx":0.78,
  "you-rock-sfx":0.78,
  "ui-sound-01r":0.78,
  "ui-sound-05r":0.78,
  "ui-sound-06r":0.78,
  "select-sfx":0.78,
  "ui-sound-10r":0.78,
  "ui-sound-09r":0.78
};
Object.entries(audioVolumes).forEach(([id,volume])=>{const audio=$("#"+id);if(audio){audio.volume=volume;audio.preload="none";}});
const sfxIds=["cash-sfx","highway-riser-sfx","notes-ripple-sfx","scroll-sfx","you-rock-sfx","ui-sound-01r","ui-sound-05r","ui-sound-06r","select-sfx","ui-sound-10r","ui-sound-09r"];
const sfxPool=new Map(sfxIds.map(id=>[id,$("#"+id)]).filter(([id,a])=>a));
function playSfx(id){const audio=sfxPool.get(id);if(!audio)return;try{audio.pause();audio.currentTime=0;const p=audio.play();if(p&&p.catch)p.catch(()=>{});}catch(e){}}
let titleStarted=false, siteEntered=false, crossfadeStarted=false, menuFadeTimer=null;
const CROSSFADE_MS=1600;
function attemptTitleAudio(){
 if(!titleAudio||titleStarted)return false;
 try{titleAudio.volume=audioVolumes["title-screen-audio"];const p=titleAudio.play();if(p&&p.then){p.then(()=>{titleStarted=true;}).catch(()=>{});return true;}}catch(e){}
 return false;
}
function startMenuMusic(){
 if(!menuAudio||crossfadeStarted)return;
 crossfadeStarted=true;
 try{
   menuAudio.volume=0;
   const p=menuAudio.play();if(p&&p.catch)p.catch(()=>{});
   if(menuFadeTimer)window.clearInterval(menuFadeTimer);
   const steps=32, stepMs=CROSSFADE_MS/steps;let step=0;
   menuFadeTimer=window.setInterval(()=>{
     step++;const t=Math.min(1,step/steps);
     menuAudio.volume=audioVolumes["menu-screen-audio"]*t;
     if(titleAudio&&!titleAudio.paused)titleAudio.volume=audioVolumes["title-screen-audio"]*(1-t);
     if(t>=1){window.clearInterval(menuFadeTimer);menuFadeTimer=null;if(titleAudio){titleAudio.pause();try{titleAudio.currentTime=0;}catch(e){}titleAudio.volume=audioVolumes["title-screen-audio"];}}
   },stepMs);
 }catch(e){}
}
function maybeCrossfadeTitle(){
 if(!siteEntered||crossfadeStarted||!titleAudio)return;
 const duration=titleAudio.duration;
 if(Number.isFinite(duration)&&duration>0&&titleAudio.currentTime>=Math.max(0,duration-(CROSSFADE_MS/1000)))startMenuMusic();
}
if(titleAudio){
 titleAudio.addEventListener("timeupdate",maybeCrossfadeTitle);
 titleAudio.addEventListener("ended",()=>{if(siteEntered&&!crossfadeStarted)startMenuMusic();});
}
function enterSite(){
 if(splash.classList.contains("dismissed"))return;
 siteEntered=true;
 splash.classList.add("dismissed");document.body.classList.remove("splash-open");
 if(titleAudio){
   try{titleAudio.pause();titleAudio.currentTime=0;titleAudio.volume=audioVolumes["title-screen-audio"];const p=titleAudio.play();if(p&&p.then){p.then(()=>{titleStarted=true;}).catch(()=>{startMenuMusic();});}else titleStarted=true;}
   catch(e){startMenuMusic();}
 }else startMenuMusic();
}
document.body.classList.add("splash-open");
splash.addEventListener("click",enterSite);
splash.addEventListener("keydown",e=>{if(e.key==="Enter"||e.key===" "){e.preventDefault();enterSite();}});
document.addEventListener("keydown",e=>{if(!splash.classList.contains("dismissed")&&(e.key==="Enter"||e.key===" "))enterSite();});
// Pause background music when the tab/app is hidden; resume only after the visitor has entered the site.
document.addEventListener("visibilitychange",()=>{
 if(!menuAudio)return;
 // Never restart homepage music while the Secret Menu is active or booting.
 if(document.body.classList.contains("secret-stage-open")){
   menuAudio.pause();return;
 }
 if(document.hidden){menuAudio.pause();}
 else if(siteEntered){const p=menuAudio.play();if(p&&p.catch)p.catch(()=>{});}
});
window.addEventListener("pagehide",()=>{if(menuAudio)menuAudio.pause();});
// Suitable UI sounds: money/support actions, navigation scroll, song selection, and achievements.
document.addEventListener("click",event=>{
 const control=event.target.closest("button,a,[role=button]");if(!control)return;
 if(control.id==="splash")return;
 if(control.matches(".top-nav a")){
   const toolbarSounds=["ui-sound-01r","ui-sound-05r","ui-sound-06r"];
   const chosen=toolbarSounds[Math.floor(Math.random()*toolbarSounds.length)];
   playSfx(chosen);
 } else if(control.matches("a[href^='#']"))playSfx("scroll-sfx");
 if(control.closest(".support-grid")||control.id==="show-kofi-qr")playSfx("cash-sfx");
 if(control.matches("button,a")){control.classList.remove("button-pressed");void control.offsetWidth;control.classList.add("button-pressed");window.setTimeout(()=>control.classList.remove("button-pressed"),220);}
},true);
// Audio cues after successful actions.
const requestFormForAchievement=$("#request-form");
requestFormForAchievement.addEventListener("submit",()=>{ /* Success cue is triggered after Supabase confirms below. */ });
function focusPaymentMethod(method){
 const targets={etransfer:document.querySelector(".payment-etransfer"),paypal:document.querySelector(".payment-paypal"),kofi:document.querySelector(".payment-kofi-wallet")};
 const target=targets[method];const status=document.querySelector("#payment-flow-status");
 if(!target)return;
 if(status){status.hidden=false;status.textContent=method==="etransfer"?"Your request is saved. Copy the e-transfer email below, then send your $5 CAD tip in your banking app.":method==="paypal"?"Your request is saved. Complete your $5 CAD tip through PayPal below.":"Your request is saved. Complete your $5 CAD tip through Ko-fi below.";}
 document.querySelectorAll(".payment-method-banner.payment-highlight").forEach(el=>el.classList.remove("payment-highlight"));
 target.classList.add("payment-highlight");target.scrollIntoView({behavior:"smooth",block:"center"});
 window.setTimeout(()=>target.classList.remove("payment-highlight"),1700);
}
const songReveal=document.querySelector("#song-reveal");
const closeSongList=document.querySelector("#close-song-list");
const songRequestTip=document.querySelector("#song-request-tip");
const songRevealLabel=songReveal?.querySelector(".song-reveal-label");
if(songReveal&&songRevealLabel){const syncSongRevealLabel=()=>{songRevealLabel.textContent=songReveal.open?"SONGS REVEALED":"REVEAL THE SONGS";};songReveal.addEventListener("toggle",()=>{syncSongRevealLabel();if(songReveal.open){playSfx("notes-ripple-sfx");}else{playSfx(Math.random()<0.5?"ui-sound-10r":"ui-sound-09r");}});syncSongRevealLabel();}
if(songReveal&&closeSongList){
 let closeHideTimer;
 const catalogSection=document.querySelector("#catalog");
 const catalogIsInView=()=>{
  if(!catalogSection)return false;
  const r=catalogSection.getBoundingClientRect();
  return r.bottom>0&&r.top<window.innerHeight;
 };
 const syncCloseButton=()=>{
  window.clearTimeout(closeHideTimer);
  const shouldShow=Boolean(songReveal.open&&catalogIsInView());
  if(shouldShow){
   closeSongList.hidden=false;
   if(songRequestTip)songRequestTip.hidden=false;
   window.requestAnimationFrame(()=>{closeSongList.classList.add("is-visible");songRequestTip?.classList.add("is-visible");});
  }else{
   closeSongList.classList.remove("is-visible");
   songRequestTip?.classList.remove("is-visible");
   closeHideTimer=window.setTimeout(()=>{closeSongList.hidden=true;if(songRequestTip)songRequestTip.hidden=true;},260);
  }
 };
 songReveal.addEventListener("toggle",syncCloseButton);
 window.addEventListener("scroll",syncCloseButton,{passive:true});
 window.addEventListener("resize",syncCloseButton,{passive:true});
 closeSongList.addEventListener("click",()=>{songReveal.open=false;songReveal.querySelector("summary").scrollIntoView({behavior:"smooth",block:"center"});});
 syncCloseButton();
}
renderDecades();renderArtists();renderSongs();

// Rockometer and encore poll use the existing Supabase project. Apply grifflist-combined-reviewed-migration.sql to enable the database features.
const rockMeterGoalLabel=document.querySelector("#rock-meter-goal-label");
const rockMeterRaised=document.querySelector("#rock-meter-raised");
const rockMeterGoal=document.querySelector("#rock-meter-goal");
const rockMeterFill=document.querySelector("#rock-meter-fill");
const rockMeterProgress=document.querySelector("#rock-meter-progress");
const rockMeterCaption=document.querySelector("#rock-meter-caption");
const rockMeterNeedle=document.querySelector("#rock-meter-needle");
const rockMeterDial=document.querySelector("#rock-meter-dial");
const meterZoneLabel=document.querySelector("#meter-zone-label");
const encoreOptions=document.querySelector("#encore-options");
const encoreStatus=document.querySelector("#encore-poll-status");
const encoreTitle=document.querySelector("#encore-poll-title");
const moneyCAD=value=>new Intl.NumberFormat("en-CA",{style:"currency",currency:"CAD",maximumFractionDigits:0}).format(Number(value)||0);
async function loadRockMeter(){
 const client=window.supabaseClient;
 if(!client){rockMeterCaption.textContent="Rockometer is waiting for its Supabase connection.";return;}
 try{
  const {data,error}=await client.from("rock_meter_settings").select("goal_label,goal_amount,raised_amount").eq("id",1).maybeSingle();
  if(error)throw error;
  if(!data)throw new Error("No Rockometer settings found. Apply grifflist-combined-reviewed-migration.sql in Supabase.");
  const goal=Math.max(1,Number(data.goal_amount)||200),raised=Math.max(0,Number(data.raised_amount)||0),pct=Math.min(100,Math.round(raised/goal*100));
  // Six supplied meter illustrations: nearest 20% increment of the configured goal.
  const meterStep=Math.min(5,Math.round(pct/20));
  const meterPosition=meterStep*20;
  const dialState=meterStep>=4?"green":meterStep>=2?"yellow":"red";
  const meterClass=dialState==="green"?"meter-green":dialState==="yellow"?"meter-yellow":"meter-red";
  if(rockMeterDial){const image=`rock-meter-${meterPosition}.webp`;if(!rockMeterDial.src.endsWith("/"+image))rockMeterDial.src=image;rockMeterDial.alt=`Rockometer illustration at ${meterPosition}% of goal; current total is ${pct}%`;rockMeterDial.dataset.zone=dialState;rockMeterDial.dataset.step=String(meterStep);rockMeterDial.dataset.position=String(meterPosition);}
  const navMeterIcon=document.querySelector("#nav-rock-meter-icon");if(navMeterIcon){const image=`rock-meter-${dialState}.webp`;if(!navMeterIcon.src.endsWith("/"+image))navMeterIcon.src=image;navMeterIcon.alt="";navMeterIcon.title=`Rockometer: ${pct}% of goal`;}
  if(meterZoneLabel){const labels=["RED ZONE · LET’S GET STARTED","RED ZONE · BUILDING MOMENTUM","YELLOW ZONE · PICKING UP","YELLOW ZONE · HALF WAY THERE","GREEN ZONE · NEAR THE GOAL","GREEN ZONE · GOAL REACHED"];meterZoneLabel.textContent=labels[meterStep];meterZoneLabel.style.color=dialState==="green"?"#72ff9b":dialState==="yellow"?"#ffe36a":"#ff7777";}
  rockMeterProgress.classList.remove("meter-red","meter-yellow","meter-green");rockMeterProgress.classList.add(meterClass);
  rockMeterGoalLabel.textContent="";rockMeterGoalLabel.hidden=true;rockMeterRaised.textContent=moneyCAD(raised);rockMeterGoal.textContent=moneyCAD(goal);rockMeterFill.style.width=pct+"%";rockMeterProgress.setAttribute("aria-valuenow",String(pct));rockMeterProgress.setAttribute("aria-valuetext",`${pct}% of the ${moneyCAD(goal)} goal reached`);
  rockMeterCaption.textContent="";rockMeterCaption.hidden=true;
 }catch(e){rockMeterCaption.textContent="";rockMeterCaption.hidden=true;console.error("Rockometer load failed:",e.message);}
}
async function loadEncorePoll(){
 const client=window.supabaseClient;if(!client)return;
 try{const {data,error}=await client.rpc("get_active_encore_poll");if(error)throw error;const poll=Array.isArray(data)?data[0]:data;if(!poll||!poll.active){encoreStatus.textContent="No active encore vote right now. Check back during a show!";encoreOptions.replaceChildren();return;}
 encoreTitle.textContent=poll.title||"VOTE FOR THE ENCORE";encoreStatus.textContent="";encoreOptions.replaceChildren();
 const choices=Array.isArray(poll.choices)?poll.choices:[];const total=choices.reduce((sum,c)=>sum+(Number(c.votes)||0),0);let voterKey="";try{voterKey=localStorage.getItem("grifflistEncoreVoter")||"";if(!voterKey){voterKey="v-"+crypto.randomUUID();localStorage.setItem("grifflistEncoreVoter",voterKey);}}catch(e){voterKey="v-"+Math.random().toString(36).slice(2);}
 let alreadyVoted=false;try{alreadyVoted=localStorage.getItem("grifflistEncoreVoted:"+poll.poll_id)==="yes";}catch(e){}
 choices.forEach(choice=>{const button=document.createElement("button");button.type="button";button.className="encore-option";button.disabled=alreadyVoted;const label=document.createElement("strong");label.textContent=choice.song_title+(choice.artist_name?" - "+choice.artist_name:"");const count=document.createElement("span");count.textContent=`${Number(choice.votes)||0} vote${Number(choice.votes)===1?"":"s"}`;button.append(label,count);button.addEventListener("click",async()=>{button.disabled=true;encoreStatus.textContent="Submitting your vote…";try{const result=await client.rpc("cast_encore_vote",{p_poll_id:poll.poll_id,p_choice_id:choice.choice_id,p_voter_key:voterKey});if(result.error)throw result.error;if(result.data===false)throw new Error("This browser has already voted in this poll, or the poll is no longer active.");try{localStorage.setItem("grifflistEncoreVoted:"+poll.poll_id,"yes");}catch(e){}encoreStatus.textContent="Vote counted! Thanks for helping choose the encore.";playSfx("you-rock-sfx");await loadEncorePoll();}catch(e){button.disabled=false;encoreStatus.textContent=e.message||"Could not submit your vote. Please try again.";}});encoreOptions.append(button);});
 if(alreadyVoted)encoreStatus.textContent=`Your vote is in. ${total} vote${total===1?"":"s"} so far.`;
 }catch(e){encoreStatus.textContent="Encore voting will be available after the database setup is complete.";console.info("Encore poll needs the combined Supabase migration.",e.message);}
}
loadRockMeter();loadEncorePoll();window.setInterval(()=>{if(!document.hidden){loadRockMeter();loadEncorePoll();}},8000);document.addEventListener("visibilitychange",()=>{if(!document.hidden){loadRockMeter();loadEncorePoll();}});


/* Smart toolbar behavior: hide on downward scroll, reveal on upward scroll, always visible at page top. */
(()=>{
 const header=document.querySelector('.site-header');
 if(!header) return;
 let lastY=window.scrollY||0;
 let ticking=false;
 const update=()=>{
   const y=Math.max(0,window.scrollY||0);
   const delta=y-lastY;
   if(y<90){header.classList.remove('toolbar-hidden');header.classList.remove('toolbar-compact');}
   else {header.classList.add('toolbar-compact');if(delta>7){header.classList.add('toolbar-hidden');}else if(delta<-7){header.classList.remove('toolbar-hidden');}}
   lastY=y; ticking=false;
 };
 window.addEventListener('scroll',()=>{if(!ticking){window.requestAnimationFrame(update);ticking=true;}},{passive:true});
 window.addEventListener('pageshow',()=>{lastY=window.scrollY||0;header.classList.remove('toolbar-hidden');});
 header.addEventListener('focusin',()=>header.classList.remove('toolbar-hidden'));
})();

/* Consistent brief section highlight for internal navigation and relevant section links. */
document.querySelectorAll('a[href^="#"]').forEach(link=>{
 const href=link.getAttribute("href");if(!href||href==="#"||href==="#top")return;
 link.addEventListener("click",()=>{const target=document.querySelector(href);if(target?.classList.contains("section")){brieflyHighlightSection(target);}});
});

/* Back-to-top and logo links should return to the absolute top of the document. */
document.querySelectorAll('a[href="#top"]').forEach(link=>link.addEventListener("click",event=>{event.preventDefault();window.scrollTo({top:0,behavior:"smooth"});history.replaceState(null,"",location.pathname+location.search);if(typeof playSfx==="function")playSfx("scroll-sfx");}));
