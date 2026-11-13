// ===================== KHỞI ĐỘNG =====================
(function(){ const h=location.hash.slice(1); if(TABS.some(t=>t[0]===h)) TAB=h;
  window.addEventListener('hashchange',()=>{ const h=location.hash.slice(1); if(h!==TAB&&TABS.some(t=>t[0]===h)) go(h); });
  render();
  setTimeout(()=>{ const c=shareCode(); if(c) bankPull(c,true).then(()=>{ if(TAB==='myq'&&!IMP) viewMyQ($('#view')); }).catch(()=>{}); },3000); })();
