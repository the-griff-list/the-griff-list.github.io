(()=>{
 const RELEASE_ID='v30-highlights';
 const STORAGE_KEY='grifflistWhatsNewSeen.v1';
 const dialog=document.getElementById('whats-new-dialog');
 if(!dialog)return;
 const closeButtons=[document.getElementById('whats-new-x'),document.getElementById('whats-new-done')].filter(Boolean);
 const reopen=document.getElementById('whats-new-reopen');
 let entered=false;
 let previousFocus=null;
 let fallbackKeyHandler=null;
 const seen=()=>{try{return localStorage.getItem(STORAGE_KEY)===RELEASE_ID;}catch(_){return false;}};
 const markSeen=()=>{try{localStorage.setItem(STORAGE_KEY,RELEASE_ID);}catch(_){}};
 const open=()=>{if(dialog.open)return;previousFocus=document.activeElement;if(typeof dialog.showModal==='function'){dialog.showModal();}else{dialog.setAttribute('open','');dialog.classList.add('whats-new-fallback-open');document.body.classList.add('whats-new-fallback-lock');const first=dialog.querySelector('button');first?.focus();fallbackKeyHandler=event=>{if(event.key==='Escape'){event.preventDefault();close();}};document.addEventListener('keydown',fallbackKeyHandler);}};
 const close=()=>{if(dialog.open&&typeof dialog.close==='function')dialog.close();else{dialog.removeAttribute('open');dialog.classList.remove('whats-new-fallback-open');document.body.classList.remove('whats-new-fallback-lock');if(fallbackKeyHandler){document.removeEventListener('keydown',fallbackKeyHandler);fallbackKeyHandler=null;}previousFocus?.focus?.();}markSeen();};
 closeButtons.forEach(button=>button.addEventListener('click',close));
 reopen?.addEventListener('click',open);
 dialog.addEventListener('click',event=>{if(event.target===dialog)close();});
 dialog.addEventListener('close',()=>{markSeen();previousFocus?.focus?.();});
 window.addEventListener('grifflist:entered',()=>{if(entered)return;entered=true;if(window.__grifflistReturningVisitor&&!seen())window.setTimeout(open,380);});
 // First-time visitors are not interrupted later by this launch announcement.
 if(!window.__grifflistReturningVisitor&&!seen())markSeen();
})();
