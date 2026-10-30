(()=>{
 'use strict';
 // Bump RELEASE_ID and RELEASE_AT for every meaningful public release.
 const RELEASE_ID='v35-seasonal-holiday-effects';
 const RELEASE_AT=new Date('2026-10-29T00:00:00-03:00').getTime();
 const RELEASE_WINDOW=7*24*60*60*1000;
 const WITHIN_SEVEN_DAYS=Date.now()>=RELEASE_AT && Date.now()-RELEASE_AT<=RELEASE_WINDOW;
 const STORAGE_KEY='grifflistWhatsNewSeen.v1';
 const dialog=document.getElementById('whats-new-dialog'); if(!dialog)return;
 const done=document.getElementById('whats-new-done');
 let entered=false,previousFocus=null;
 const seen=()=>{try{return localStorage.getItem(STORAGE_KEY)===RELEASE_ID;}catch(_){return false;}};
 const markSeen=()=>{try{localStorage.setItem(STORAGE_KEY,RELEASE_ID);}catch(_){}};
 const dateOnly=d=>new Date(d.getFullYear(),d.getMonth(),d.getDate());
 const addDays=(d,n)=>new Date(d.getFullYear(),d.getMonth(),d.getDate()+n);
 const nthWeekday=(year,month,weekday,n)=>{const first=new Date(year,month,1);return new Date(year,month,1+((weekday-first.getDay()+7)%7)+(n-1)*7);};
 const lastWeekdayBefore=(year,month,day,weekday)=>{const d=new Date(year,month,day);d.setDate(d.getDate()-((d.getDay()-weekday+7)%7));return d;};
 const easterSunday=year=>{const a=year%19,b=Math.floor(year/100),c=year%100,d=Math.floor(b/4),e=b%4,f=Math.floor((b+8)/25),g=Math.floor((b-f+1)/3),h=(19*a+b-d-g+15)%30,i=Math.floor(c/4),k=c%4,l=(32+2*e+2*i-h-k)%7,m=Math.floor((a+11*h+22*l)/451),month=Math.floor((h+l-7*m+114)/31)-1,day=((h+l-7*m+114)%31)+1;return new Date(year,month,day);};
 const holidaysFor=year=>{
  const easter=easterSunday(year);
  const events=[
   {id:'new-year',date:new Date(year,0,1),title:'What’s new, midnight crew?',intro:'A fresh year. A fresh setlist. Let’s make some noise.',emoji:'✨',effect:'stars',priority:1},
   {id:'family-day',date:nthWeekday(year,1,1,3),title:'What’s new, family crew?',intro:'Good music is even better when shared.',emoji:'❤️',effect:'hearts',priority:2},
   {id:'valentines-day',date:new Date(year,1,14),title:'What’s new, love crew?',intro:'A little love for the music and the people who make it special.',emoji:'💘',effect:'hearts',priority:2},
   {id:'easter',date:easter,start:addDays(easter,-7),title:'What’s new, bunny crew?',intro:'A little springtime surprise for the crowd.',emoji:'🐣',effect:'eggs',priority:2},
   {id:'victoria-day',date:lastWeekdayBefore(year,4,25,1),title:'What’s new, royal crew?',intro:'A royal long weekend deserves a royal soundtrack.',emoji:'👑',effect:'stars',priority:1},
   {id:'memorial-day-us',date:lastWeekdayBefore(year,4,31,1),title:'What’s new, memory crew?',intro:'A respectful moment to remember those who gave their lives in service.',emoji:'🇺🇸',respectful:true,priority:3},
   {id:'juneteenth-us',date:new Date(year,5,19),title:'What’s new, freedom crew?',intro:'Recognizing freedom, resilience, and the continuing work toward equality.',emoji:'🕊️',effect:'stars',priority:3},
   {id:'canada-day',date:new Date(year,6,1),title:'What’s new, maple crew?',intro:'Celebrating Canada with a little Island rock.',emoji:'🍁',effect:'maple',priority:1},
   {id:'independence-day-us',date:new Date(year,6,4),title:'What’s new, freedom crew?',intro:'Wishing our American neighbours a joyful Independence Day.',emoji:'🇺🇸',effect:'stars',priority:3},
   {id:'civic-holiday',date:nthWeekday(year,7,1,1),title:'What’s new, sunshine crew?',intro:'One more reason to get out and enjoy the summer.',emoji:'☀️',effect:'stars',priority:2},
   {id:'labour-day',date:nthWeekday(year,8,1,1),title:'What’s new, weekend crew?',intro:'Here’s to a well-earned break and a soundtrack for it.',emoji:'🎸',effect:'stars',priority:1},
   {id:'labour-day-us',date:nthWeekday(year,8,1,1),title:'What’s new, weekend crew?',intro:'A long-weekend soundtrack for our American neighbours, too.',emoji:'🇺🇸',effect:'stars',priority:2},
   {id:'truth-reconciliation',date:new Date(year,8,30),title:'Honouring truth and remembrance',intro:'A moment to listen, learn, and honour Indigenous communities.',emoji:'🧡',respectful:true,priority:1},
   {id:'thanksgiving',date:nthWeekday(year,9,1,2),title:'What’s new, thankful crew?',intro:'Grateful for the music, the moments, and the crowd.',emoji:'🍂',effect:'leaves',priority:1},
   {id:'halloween',date:new Date(year,9,31),title:'What’s new, Griffy-Doo?',intro:'A spooky little update has entered the stage.',emoji:'👻',effect:'leaves',priority:1},
   {id:'veterans-day-us',date:new Date(year,10,11),title:'Honouring those who served',intro:'A respectful moment to recognize American veterans.',emoji:'🇺🇸',respectful:true,priority:2},
   {id:'remembrance-day',date:new Date(year,10,11),title:'We remember',intro:'Honouring those who served and those who continue to serve.',emoji:'🌺',respectful:true,priority:1},
   {id:'thanksgiving-us',date:nthWeekday(year,10,4,4),title:'What’s new, grateful crew?',intro:'Wishing our American neighbours a warm and joyful Thanksgiving.',emoji:'🦃',effect:'leaves',priority:2},
   {id:'christmas',date:new Date(year,11,25),start:new Date(year,11,18),end:new Date(year,11,25),title:'What’s new, jingle crew?',intro:'Wishing you a rockin’ Christmas and a bright holiday season.',emoji:'🎄',effect:'snow',priority:1},
   {id:'boxing-day',date:new Date(year,11,26),start:new Date(year,11,26),end:new Date(year,11,26),title:'What’s new, gift crew?',intro:'One more day for good tunes and good company.',emoji:'🎁',effect:'stars',priority:1},
   {id:'new-year-eve',date:new Date(year+1,0,1),start:new Date(year,11,27),end:new Date(year+1,0,1),title:'What’s new, midnight crew?',intro:'Count down to another year of great music.',emoji:'🥂',effect:'stars',priority:1}
  ];
  // Merge same-day observances and give Canadian home-market holidays precedence.
  const dedup=new Map();
  for(const h of events){const key=dateOnly(h.date).getTime();const old=dedup.get(key);if(!old||h.priority<old.priority)dedup.set(key,h);}
  const sorted=[...dedup.values()].sort((a,b)=>dateOnly(a.date)-dateOnly(b.date));
  // Every campaign aims for a 7-day lead-in, but its window is clipped before
  // the next campaign begins. This prevents overlapping seasonal headlines.
  return sorted.map((h,i)=>{
   const naturalStart=h.start?dateOnly(h.start):addDays(dateOnly(h.date),-7);
   const naturalEnd=h.end?dateOnly(h.end):dateOnly(h.date);
   const next=sorted[i+1];
   const nextStart=next?(next.start?dateOnly(next.start):addDays(dateOnly(next.date),-7)):null;
   const clippedEnd=next?new Date(Math.min(naturalEnd.getTime(),addDays(nextStart,-1).getTime())):naturalEnd;
   const start=naturalStart;
   const end=clippedEnd<start?naturalEnd:clippedEnd;
   return {...h,start,end};
  });
 };
 const today=dateOnly(new Date());
 const seasonal=holidaysFor(today.getFullYear()-1).concat(holidaysFor(today.getFullYear()),holidaysFor(today.getFullYear()+1)).find(h=>{
  const start=dateOnly(h.start);
  const end=dateOnly(h.end);
  return today>=start&&today<=end;
 });
 if(seasonal){
  const title=document.getElementById('whats-new-title');
  const intro=document.getElementById('whats-new-intro');
  const mark=dialog.querySelector('.whats-new-mark');
  if(title)title.textContent=seasonal.title;
  if(intro)intro.textContent=seasonal.intro;
  if(mark)mark.textContent=seasonal.emoji;
  dialog.classList.add('holiday-'+seasonal.id);
  dialog.dataset.holiday=seasonal.id;
  if(seasonal.effect){
   const fx=document.createElement('div');fx.className='whats-new-seasonal-fx effect-'+seasonal.effect;fx.setAttribute('aria-hidden','true');
   const symbols={leaves:['🍂','🍁','🍂','🍁'],snow:['❄','❅','❆'],eggs:['egg','egg','egg'],maple:['🍁'],hearts:['♥','💗'],stars:['✦','✨','★']};
   const palette=['#ffb6cf','#b9d8ff','#ffe28a','#c9a8f2','#a8dfb0'];
   (symbols[seasonal.effect]||symbols.stars).forEach((symbol,i)=>{});
   for(let i=0;i<16;i++){
    const particle=document.createElement('span');particle.className='seasonal-particle';
    const pool=symbols[seasonal.effect]||symbols.stars;
    if(seasonal.effect==='eggs'){particle.classList.add('seasonal-egg');particle.style.setProperty('--egg-color',palette[i%palette.length]);}
    else particle.textContent=pool[i%pool.length];
    particle.style.setProperty('--x',(Math.random()*100).toFixed(2)+'%');
    particle.style.setProperty('--delay',(Math.random()*.42).toFixed(2)+'s');
    particle.style.setProperty('--drift',((Math.random()-.5)*90).toFixed(0)+'px');
    particle.style.setProperty('--spin',(Math.random()*360).toFixed(0)+'deg');
    fx.appendChild(particle);
   }
   dialog.insertBefore(fx,dialog.firstChild);
   window.setTimeout(()=>fx.remove(),3000);
  }
 }
  const open=()=>{if(dialog.open)return;previousFocus=document.activeElement;if(typeof dialog.showModal==='function')dialog.showModal();else{dialog.setAttribute('open','');document.body.classList.add('whats-new-fallback-lock');}done?.focus();};
 const close=()=>{if(dialog.open&&typeof dialog.close==='function')dialog.close();else{dialog.removeAttribute('open');document.body.classList.remove('whats-new-fallback-lock');previousFocus?.focus?.();}markSeen();};
 done?.addEventListener('click',close);
 // The announcement is intentionally non-dismissible except for the explicit completion action.
 dialog.addEventListener('cancel',e=>e.preventDefault());
 dialog.addEventListener('click',e=>{if(e.target===dialog)e.preventDefault();});
 dialog.addEventListener('close',()=>{markSeen();previousFocus?.focus?.();});
 window.addEventListener('grifflist:entered',()=>{if(entered)return;entered=true;if(WITHIN_SEVEN_DAYS&&!seen())window.setTimeout(open,420);});
})();
