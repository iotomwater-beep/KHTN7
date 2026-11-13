// ===================== LÕI: LƯU TRỮ, HỒ SƠ, NGÂN HÀNG =====================
const LSK='khtn7.v1';
let DB={profiles:[],cur:null,myQ:[],tours:[],applied:{},fb:null,sound:true};
try{ const s=JSON.parse(localStorage.getItem(LSK)||'null'); if(s) DB=Object.assign(DB,s); }catch(e){}
function save(){ try{ localStorage.setItem(LSK,JSON.stringify(DB)); }catch(e){} if(typeof classSyncSoon==='function') classSyncSoon(); }
const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>[...r.querySelectorAll(s)];
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const uid=()=>Math.random().toString(36).slice(2,9)+Date.now().toString(36).slice(-3);
const shuffle=a=>{a=[...a];for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;};
const chName=id=>(typeof CALC_TR!=='undefined'&&CALC_TR[id])?CALC_TR[id].name:(CHAPTERS.find(c=>c.id===id)||{short:id}).short;
const chIc=id=>(typeof CALC_TR!=='undefined'&&CALC_TR[id])?CALC_TR[id].ic:(CHAPTERS.find(c=>c.id===id)||{ic:'📘'}).ic;
function toast(m,ms=2200){ const t=document.createElement('div'); t.className='toast'; t.textContent=m; document.body.appendChild(t); setTimeout(()=>t.remove(),ms); }
function modal(html){ const m=document.createElement('div'); m.className='modal'; m.innerHTML=`<div class="card">${html}</div>`; m.addEventListener('click',e=>{ if(e.target===m) m.remove(); }); document.body.appendChild(m); return m; }
function confirmBox(msg,ok){ const m=modal(`<h3>${esc(msg)}</h3><div class="row" style="justify-content:flex-end;margin-top:12px"><button class="btn ghost" data-x>Huỷ</button><button class="btn bad" data-y>Đồng ý</button></div>`); $('[data-x]',m).onclick=()=>m.remove(); $('[data-y]',m).onclick=()=>{m.remove();ok();}; }
let AC=null; function beep(ok){ if(!DB.sound) return; try{ AC=AC||new (window.AudioContext||window.webkitAudioContext)(); const o=AC.createOscillator(),g=AC.createGain(); o.frequency.value=ok?880:220; o.type=ok?'sine':'square'; g.gain.value=.06; o.connect(g); g.connect(AC.destination); o.start(); o.stop(AC.currentTime+(ok?.12:.2)); }catch(e){} }

// ----- Hồ sơ
const EMOS=['🦊','🐼','🐯','🦁','🐸','🐵','🐰','🐨','🦉','🐬','🦄','🐙','🐢','🦖','🐝','🐧'];
function curP(){ return DB.profiles.find(p=>p.id===DB.cur)||null; }
function newProfile(name,emo){ const p={id:uid(),name:name.trim().slice(0,16)||'Bạn mới',emo:emo||pick(EMOS),elo:1000,w:0,d:0,l:0,pr:{}}; DB.profiles.push(p); if(!DB.cur) DB.cur=p.id; save(); return p; }
function profileDialog(after){
  let emo=pick(EMOS);
  const m=modal(`<h3>Tạo hồ sơ người chơi</h3><p class="small muted">Chỉ dùng biệt danh, không cần tên thật. Hồ sơ lưu trên máy này.</p>
  <label class="f">Biệt danh</label><input type="text" id="pfn" maxlength="16" placeholder="Ví dụ: Na, Tôm, Bin…">
  <label class="f">Con vật đại diện</label><div class="row" id="pfe">${EMOS.map(e=>`<button class="pf ${e===emo?'on':''}" data-e="${e}"><span class="emo">${e}</span></button>`).join('')}</div>
  <div class="row" style="justify-content:flex-end;margin-top:14px"><button class="btn ghost" data-x>Huỷ</button><button class="btn pri" data-y>Tạo</button></div>`);
  $$('#pfe .pf',m).forEach(b=>b.onclick=()=>{ emo=b.dataset.e; $$('#pfe .pf',m).forEach(x=>x.classList.toggle('on',x===b)); });
  $('[data-x]',m).onclick=()=>m.remove();
  $('[data-y]',m).onclick=()=>{ const n=$('#pfn',m).value.trim(); if(!n){toast('Nhập biệt danh nhé');return;} const p=newProfile(n,emo); m.remove(); after&&after(p); };
  setTimeout(()=>$('#pfn',m).focus(),50);
}
function addProgress(p,ch,ok,src,lv){ if(!p) return 0; p.pr[ch]=p.pr[ch]||{ok:0,n:0}; p.pr[ch].n++; if(ok) p.pr[ch].ok++;
  if(src!=='prac') return 0; // chỉ luyện tập / thi thử / bài tính mới tính vào điều kiện giải & ELO luyện tập
  p.pp=p.pp||{}; p.pp[ch]=p.pp[ch]||{ok:0,n:0}; p.pp[ch].n++; if(ok) p.pp[ch].ok++;
  const r={1:900,2:1100,3:1300}[lv]||1000; const d=Math.round(8*((ok?1:0)-1/(1+Math.pow(10,(r-p.elo)/400)))); p.elo=Math.max(100,p.elo+d); return d; }

// ----- Ngân hàng câu hỏi
const SRC={sgk:'SGK KNTT',dp:'Đột phá tư duy',hsg:'Đề HSG',khac:'Khác'};
const BUILTIN=BANK_RAW.map((r,i)=>({id:'b'+i,ch:r[0],lv:r[1],q:r[2],opts:r[3],ex:r[4],src:'app'}));
function pool(f){ // f: {chs:[], lvs:[], mine:'all'|'only'|'none', srcs:[]}
  let a=[];
  if(f.mine!=='only'&&f.mine!=='class') a=a.concat(BUILTIN);
  if(f.mine!=='none') a=a.concat(DB.myQ.filter(q=>f.mine!=='class'||q.shared).map(q=>Object.assign({},q,{mine:true})));
  return a.filter(q=>(!f.chs||!f.chs.length||f.chs.includes(q.ch))&&(!f.lvs||!f.lvs.length||f.lvs.includes(q.lv))&&(!q.mine||!f.srcs||!f.srcs.length||f.srcs.includes(q.src)));
}
function prep(q){ // xáo đáp án → {.., opts, ans}
  const idx=shuffle([0,1,2,3].slice(0,q.opts.length)); return Object.assign({},q,{opts:idx.map(i=>q.opts[i]),ans:idx.indexOf(0)});
}
function makeDeck(f,n){ // trộn câu có sẵn + câu sinh tự động
  if(f.bank==='calc') return calcDeck({trs:f.trs,grs:f.grs,lvs:f.lvs},n).map(calcToMCQ).map(prep);
  const base=shuffle(pool(f)); const out=[]; let bi=0, guard=0;
  while(out.length<n && guard++<n*6){
    const useGen=f.mine!=='only' && f.mine!=='class' && Math.random()<(f.genRate??0.3);
    let q=null;
    if(useGen){ const chs=f.chs&&f.chs.length?f.chs:null; const lvs=f.lvs&&f.lvs.length?f.lvs:null; q=genQuestion(chs?pick(chs):null, lvs?pick(lvs):null); if(q) q=Object.assign({id:'g',src:'gen'},q); }
    if(!q && base.length){ q=base[bi%base.length]; bi++; if(bi>base.length*3) break; }
    if(q) out.push(prep(q));
  }
  return out;
}
function lvTag(q){ const L=LEVELS[q.lv]||LEVELS[1]; return `${q.gr?`<span class="tag ${q.gr!=='7'?'l2':''}">${CALC_GR[q.gr]}</span> `:''}<span class="tag ${q.lv>1?'l'+q.lv:''}">${q.gr?LVN[q.lv]:L.tag}</span>${q.mine?` <span class="tag my">✍ ${esc(SRC[q.src]||q.src)}${q.note?' · '+esc(q.note):''}</span>`:''}${q.src==='gen'?' <span class="tag my">🎲 số liệu mới</span>':''}`; }

// ----- Bộ lọc chung (chương / mức / nguồn)
function filterUI(id,f){ return `<div id="${id}">${filterInner(f)}</div>`; }
function filterInner(f){
  f.bank=f.bank||'khtn'; f.chs=f.chs||[]; f.lvs=f.lvs||[]; f.mine=f.mine||'all'; f.trs=f.trs||[]; f.grs=f.grs||['7'];
  const bank=`<label class="f">Kho câu hỏi</label><div class="row"><span class="tog ${f.bank==='khtn'?'on':''}" data-bank="khtn">📘 Trắc nghiệm KHTN 7</span><span class="tog ${f.bank==='calc'?'on':''}" data-bank="calc">🧮 Bài tính Lý · Hóa · Sinh</span></div>`;
  if(f.bank==='calc') return bank+`<label class="f">Môn (bỏ trống = trộn)</label><div class="row">${Object.entries(CALC_TR).map(([k,t])=>`<span class="tog ${f.trs.includes(k)?'on':''}" data-tr="${k}">${t.ic} ${t.name}</span>`).join('')}</div>
   <label class="f">Khối</label><div class="row">${Object.entries(CALC_GR).map(([k,t])=>`<span class="tog ${f.grs.includes(k)?'on':''}" data-gr="${k}">${t}${k!=='7'?' (mở rộng)':''}</span>`).join('')}</div>
   <label class="f">Mức (bỏ trống = trộn)</label><div class="row">${[1,2,3].map(l=>`<span class="tog ${f.lvs.includes(l)?'on':''}" data-lv="${l}">${LVN[l]}</span>`).join('')}</div>
   <p class="small muted">Bài tính được đổi thành 4 lựa chọn đáp số (có đáp số sai theo lỗi thường gặp) để đấu nhanh. Thời gian mỗi câu: cơ bản 15 s, nâng cao 25 s, HSG 40 s.</p>`;
  return bank+`<label class="f">Chương (bỏ trống = tất cả)</label><div class="row">${CHAPTERS.map(c=>`<span class="tog ${f.chs.includes(c.id)?'on':''}" data-ch="${c.id}">${c.ic} ${c.short}</span>`).join('')}</div>
  <label class="f">Mức độ (bỏ trống = trộn)</label><div class="row">${[1,2,3].map(l=>`<span class="tog ${f.lvs.includes(l)?'on':''}" data-lv="${l}">${LEVELS[l].name}</span>`).join('')}</div>
  <label class="f">Nguồn câu hỏi</label><div class="row">${[['all','Câu có sẵn + câu của tôi'],['none','Chỉ câu có sẵn'],['only',`Chỉ câu của tôi (${DB.myQ.length})`],['class',`📚 Chỉ câu của lớp (${DB.myQ.filter(q=>q.shared).length})`]].map(([v,t])=>`<span class="tog ${f.mine===v?'on':''}" data-mine="${v}">${t}</span>`).join('')}</div>`;
}
function bindFilter(id,f,onchg){
  const r=$('#'+id); if(!r) return;
  const tgl=(arr,val,t)=>{ const i=arr.indexOf(val); if(i>=0) arr.splice(i,1); else arr.push(val); t.classList.toggle('on'); onchg&&onchg(); };
  $$('[data-bank]',r).forEach(t=>t.onclick=()=>{ f.bank=t.dataset.bank; f.lvs=[]; r.innerHTML=filterInner(f); bindFilter(id,f,onchg); onchg&&onchg(); });
  $$('[data-ch]',r).forEach(t=>t.onclick=()=>tgl(f.chs,t.dataset.ch,t));
  $$('[data-tr]',r).forEach(t=>t.onclick=()=>tgl(f.trs,t.dataset.tr,t));
  $$('[data-gr]',r).forEach(t=>t.onclick=()=>tgl(f.grs,t.dataset.gr,t));
  $$('[data-lv]',r).forEach(t=>t.onclick=()=>tgl(f.lvs,+t.dataset.lv,t));
  $$('[data-mine]',r).forEach(t=>t.onclick=()=>{ f.mine=t.dataset.mine; $$('[data-mine]',r).forEach(x=>x.classList.toggle('on',x===t)); onchg&&onchg(); });
}

// ===================== ĐIỀU HƯỚNG =====================
const TABS=[['home','🏠 Trang chủ'],['practice','📚 Luyện tập'],['calc','🧮 Bài tính'],['exam','📝 Thi thử'],['arena','⚔️ Đấu trường'],['online','🌐 Online'],['tour','🏆 Giải đấu'],['myq','✍️ Câu của tôi'],['class','👩‍🏫 Lớp học']];
let TAB='home'; let cleanup=null;
function go(t){ if(cleanup){ try{cleanup();}catch(e){} cleanup=null; } TAB=t; try{ if(location.hash.slice(1)!==t) history.replaceState(null,'','#'+t);}catch(e){} render(); window.scrollTo(0,0); }
function render(){
  const p=curP();
  $('#hdr').innerHTML=`<div class="logo">KHTN<span>·</span>7 <span>Đấu trường</span></div>
   <div class="row">${p?`<span class="chip" id="swp">${p.emo} ${esc(p.name)} · ${p.role&&p.role!=='hs'&&typeof ROLE_B!=='undefined'?ROLE_B[p.role]:'ELO '+p.elo}</span>`:`<button class="btn sm pri" id="swp">＋ Tạo hồ sơ</button>`}
   <button class="chip" id="snd" title="Âm thanh">${DB.sound?'🔊':'🔇'}</button></div>`;
  $('#swp').onclick=()=>p?switchProfile():profileDialog(()=>render());
  $('#snd').onclick=()=>{DB.sound=!DB.sound;save();render();};
  $('#tabs').innerHTML=TABS.map(([k,n])=>`<button class="${k===TAB?'on':''}" data-t="${k}">${n}</button>`).join('');
  $$('#tabs button').forEach(b=>b.onclick=()=>go(b.dataset.t));
  const v=$('#view'); v.innerHTML='';
  ({home:viewHome,practice:viewPractice,exam:viewExam,arena:viewArena,online:viewOnline,tour:viewTour,myq:viewMyQ,class:viewClass,calc:viewCalc}[TAB]||viewHome)(v);
}
function switchProfile(){
  const m=modal(`<h3>Chọn hồ sơ</h3><div class="grid g2">${DB.profiles.map(p=>`<div class="pf ${p.id===DB.cur?'on':''}" data-p="${p.id}"><span class="emo">${p.emo}</span> ${esc(p.name)} <span class="small muted">ELO ${p.elo}</span><span style="flex:1"></span><button class="btn sm ghost" data-del="${p.id}">🗑</button></div>`).join('')}</div>
   <div class="row" style="margin-top:12px;justify-content:space-between"><button class="btn" data-new>＋ Hồ sơ mới</button><button class="btn ghost" data-x>Đóng</button></div>`);
  $$('[data-p]',m).forEach(d=>d.onclick=e=>{ if(e.target.dataset.del) return; const pp=DB.profiles.find(x=>x.id===d.dataset.p); m.remove(); askPin(pp,()=>{ DB.cur=pp.id; save(); render(); }); });
  $$('[data-del]',m).forEach(b=>b.onclick=()=>{ const p=DB.profiles.find(x=>x.id===b.dataset.del); confirmBox(`Xoá hồ sơ "${p.name}"?`,()=>{ DB.profiles=DB.profiles.filter(x=>x!==p); if(DB.cur===p.id) DB.cur=DB.profiles[0]?.id||null; save(); m.remove(); render(); }); });
  $('[data-new]',m).onclick=()=>{ m.remove(); profileDialog(p=>{DB.cur=p.id;save();render();}); };
  $('[data-x]',m).onclick=()=>m.remove();
}

// ===================== TRANG CHỦ =====================
function viewHome(v){
  const p=curP(); const total=BUILTIN.length;
  v.innerHTML=`<div class="card"><h2>Chào ${p?esc(p.emo+' '+p.name):'bạn'} 👋</h2>
   <p class="muted" style="margin:0">Ôn Khoa học tự nhiên 7 theo SGK <b>Kết nối tri thức</b>, luyện dạng <b>tư duy</b> và <b>đề học sinh giỏi</b>, rồi đấu với bạn bè hoặc bot.</p>
   <div class="row small muted" style="margin-top:8px"><span class="chip" style="background:var(--pri-soft);color:var(--pri)">📚 Ngân hàng: <b>${total+DB.myQ.length}</b> câu</span><span class="chip">📘 ${total} câu có sẵn</span><span class="chip">✍️ ${DB.myQ.length} câu đã nhập</span><span class="chip">🎲 ${GENS.length+CG.length} dạng bài tự sinh số liệu</span></div>
   ${p?'':'<div style="margin-top:12px"><button class="btn pri" id="mk">＋ Tạo hồ sơ để lưu tiến độ</button></div>'}</div>
  <div class="grid g4" style="margin-bottom:14px">
   ${[['practice','📚','Luyện tập','Từng câu, có giải thích'],['calc','🧮','Bài tính','Toán Lý · Hóa · Sinh, lớp 7 → TS10'],['exam','📝','Thi thử','20 câu · 45 phút'],['arena','⚔️','Đấu trường','1 vs 1, 2 vs 2, đấu bot'],['online','🌐','Đấu online','Mỗi bạn một máy'],['tour','🏆','Giải đấu','Nhiều ngày, chia bảng'],['myq','📥','Câu của tôi','Nạp Word, PDF, ảnh → câu hỏi'],['class','👩‍🏫','Lớp học','Thầy cô xem các bạn tự luyện']].map(([t,i,n,d])=>`<button class="tile" data-go="${t}"><div class="ic">${i}</div><b>${n}</b><div class="small muted">${d}</div></button>`).join('')}
  </div>
  <div class="card"><h3>Tiến độ theo chương ${p?'':'<span class="small muted">(tạo hồ sơ để lưu)</span>'}</h3><div class="grid g3">
   ${CHAPTERS.map(c=>{ const pr=p&&p.pr[c.id]||{ok:0,n:0}; const pct=pr.n?Math.round(pr.ok/pr.n*100):0; const cnt=BUILTIN.filter(q=>q.ch===c.id).length+DB.myQ.filter(q=>q.ch===c.id).length;
     return `<button class="tile" data-ch="${c.id}"><div class="row between"><b>${c.ic} ${c.short}</b><span class="small muted">${cnt} câu</span></div><div class="small muted" style="margin:2px 0 6px">${c.name}</div><div class="bar"><i style="width:${pct}%"></i></div><div class="small muted">${pr.n?`Đúng ${pr.ok}/${pr.n} (${pct}%)`:'Chưa luyện'}</div></button>`;}).join('')}
  </div></div>
  ${p?`<div class="card"><h3>Thành tích đấu trường</h3><div class="row"><span class="chip">🏅 ELO ${p.elo}</span><span class="chip">✅ Thắng ${p.w}</span><span class="chip">🤝 Hoà ${p.d}</span><span class="chip">❌ Thua ${p.l}</span></div></div>`:''}
  ${p?medalCaseHTML(p):''}
  <div class="card small muted">Câu hỏi có sẵn do ứng dụng tự soạn theo chương trình KHTN 7 (KNTT) và theo dạng bài thường gặp trong sách nâng cao, đề HSG; không chép nguyên văn từ sách hay đề nào. Muốn luyện đúng câu trong <b>SGK KNTT</b>, <b>Đột phá tư duy</b> hay <b>đề HSG</b> của trường, hãy nhập vào mục ✍️ Câu của tôi và chọn nguồn tương ứng.</div>`;
  $$('[data-go]',v).forEach(b=>b.onclick=()=>go(b.dataset.go));
  $$('[data-ch]',v).forEach(b=>b.onclick=()=>{ PRF.chs=[b.dataset.ch]; go('practice'); });
  const mk=$('#mk',v); if(mk) mk.onclick=()=>profileDialog(()=>render());
}

// ===================== LUYỆN TẬP =====================
const PRF={chs:[],lvs:[],mine:'all'}; let PS=null;
function viewPractice(v){
  if(!PS){
    v.innerHTML=`<div class="card"><h2>📚 Luyện tập</h2><p class="muted small" style="margin:0">Làm từng câu, xem ngay đáp án và lời giải. Câu tính toán (tốc độ, âm, gương, nguyên tử, công thức hoá học) được sinh số liệu mới mỗi lần.</p>
     ${filterUI('pf',PRF)}<div class="row" style="margin-top:14px"><span class="small muted" id="pcnt"></span><span style="flex:1"></span><button class="btn pri" id="pgo">Bắt đầu 10 câu</button><button class="btn" id="pgo2">20 câu</button></div></div>`;
    const cnt=()=>$('#pcnt').textContent=PRF.bank==='calc'?`${calcPick(PRF).length} dạng bài tính, số liệu mới mỗi lần`:`${pool(PRF).length} câu khớp bộ lọc`; cnt(); bindFilter('pf',PRF,cnt);
    const start=n=>{ const d=makeDeck(PRF,n); if(!d.length){toast('Không có câu nào khớp bộ lọc');return;} PS={deck:d,i:0,ok:0,picked:null}; viewPractice(v); };
    $('#pgo').onclick=()=>start(10); $('#pgo2').onclick=()=>start(20); return;
  }
  const q=PS.deck[PS.i];
  if(!q){ if(!PS.deck.length){ PS=null; return viewPractice(v); } const pct=Math.round(PS.ok/PS.deck.length*100);
    if(!PS.logged){ PS.logged=1; logAct(curP(),'Luyện tập',{ch:PRF.chs.map(chName).join(', ')||'Trộn chương',r:PS.ok+'/'+PS.deck.length+' đúng'}); save(); }
    v.innerHTML=`<div class="card" style="text-align:center"><div class="big">${PS.ok}/${PS.deck.length}</div><p>${pct>=80?'🌟 Xuất sắc!':pct>=50?'👍 Khá lắm, luyện thêm chút nữa!':'💪 Cố lên, xem lại lời giải nhé!'}</p><div class="row" style="justify-content:center"><button class="btn pri" id="again">Luyện tiếp</button><button class="btn ghost" id="back">Đổi bộ lọc</button></div></div>`;
    $('#again').onclick=()=>{ PS={deck:makeDeck(PRF,PS.deck.length),i:0,ok:0,picked:null}; viewPractice(v); }; $('#back').onclick=()=>{PS=null;viewPractice(v);}; return; }
  v.innerHTML=`<div class="card"><div class="row between"><span class="small muted">Câu ${PS.i+1}/${PS.deck.length} · ${chIc(q.ch)} ${chName(q.ch)} · ${lvTag(q)}</span><span class="chip">✅ ${PS.ok}</span></div>
   <div class="bar" style="margin:8px 0"><i style="width:${PS.i/PS.deck.length*100}%"></i></div>
   <div class="qbox">${esc(q.q)}</div><div class="opts">${q.opts.map((o,i)=>`<button class="opt" data-i="${i}"><b class="k">${'ABCD'[i]}</b><span>${esc(o)}</span></button>`).join('')}</div>
   <div id="pex"></div><div class="row" style="margin-top:12px;justify-content:space-between"><button class="btn ghost sm" id="pstop">Kết thúc</button><button class="btn pri hide" id="pnext">Câu tiếp →</button></div></div>
   <p class="small muted">Mẹo: bấm phím 1 2 3 4 để chọn, Enter để sang câu.</p>`;
  const choose=i=>{ if(PS.picked!==null) return; PS.picked=i; const ok=i===q.ans; if(ok) PS.ok++; beep(ok);
    const p=curP(); const de=addProgress(p,q.ch,ok,'prac',q.lv); save();
    $$('.opt',v).forEach((b,j)=>{ b.disabled=true; if(j===q.ans) b.classList.add('ok'); else if(j===i) b.classList.add('bad'); });
    $('#pex').innerHTML=`<div class="ex">${ok?'✅ Chính xác!':'❌ Chưa đúng. Đáp án: <b>'+'ABCD'[q.ans]+'</b>'}${p&&de?` <span class="chip" style="margin-left:6px">ELO ${de>0?'+':''}${de} → ${p.elo}</span>`:''}<br>${esc(q.ex||'')}</div>`; $('#pnext').classList.remove('hide'); };
  $$('.opt',v).forEach(b=>b.onclick=()=>choose(+b.dataset.i));
  $('#pnext').onclick=()=>{ PS.i++; PS.picked=null; viewPractice(v); };
  $('#pstop').onclick=()=>{ PS.deck=PS.deck.slice(0,PS.i+(PS.picked!==null?1:0)); PS.i=PS.deck.length; viewPractice(v); };
  const kh=e=>{ if(TAB!=='practice'||!PS) return; if('1234'.includes(e.key)&&PS.picked===null) choose(+e.key-1); else if(e.key==='Enter'&&PS.picked!==null) $('#pnext').click(); };
  document.addEventListener('keydown',kh); cleanup=()=>document.removeEventListener('keydown',kh);
}

// ===================== THI THỬ =====================
const EXF={chs:[],lvs:[],mine:'all',n:20,min:45}; let ES=null;
function viewExam(v){
  if(!ES){
    v.innerHTML=`<div class="card"><h2>📝 Thi thử</h2><p class="small muted" style="margin:0">Làm cả đề trong thời gian giới hạn, nộp bài rồi mới xem đáp án. Điểm quy về thang 10.</p>
    ${filterUI('ef',EXF)}
    <div class="row" style="margin-top:10px"><label class="small">Số câu <select id="en">${[10,20,30,40].map(n=>`<option ${n===EXF.n?'selected':''}>${n}</option>`).join('')}</select></label>
    <label class="small">Thời gian <select id="em">${[15,30,45,60,90].map(n=>`<option value="${n}" ${n===EXF.min?'selected':''}>${n} phút</option>`).join('')}</select></label>
    <span style="flex:1"></span><button class="btn pri" id="ego">Bắt đầu thi</button></div>
    <div class="row small" style="margin-top:10px"><span class="muted">Mẫu nhanh:</span><button class="btn sm" id="eq1">Kiểm tra 15 phút (10 câu SGK)</button><button class="btn sm" id="eq2">Đề HSG (20 câu tư duy + HSG, 45 phút)</button></div></div>`;
    bindFilter('ef',EXF);
    const start=()=>{ EXF.n=+$('#en').value; EXF.min=+$('#em').value; const d=makeDeck(EXF,EXF.n); if(!d.length){toast('Không có câu nào khớp bộ lọc');return;} ES={deck:d,ans:Array(d.length).fill(null),i:0,end:Date.now()+EXF.min*60000,done:false}; viewExam(v); };
    $('#ego').onclick=start;
    $('#eq1').onclick=()=>{ EXF.lvs=[1]; $('#en').value=10; $('#em').value=15; start(); };
    $('#eq2').onclick=()=>{ EXF.lvs=[2,3]; $('#en').value=20; $('#em').value=45; start(); };
    return;
  }
  const d=ES.deck;
  if(ES.done){ const sc=d.reduce((s,q,i)=>s+(ES.ans[i]===q.ans?1:0),0); const ten=Math.round(sc/d.length*100)/10;
    const p=curP(); if(!ES.saved){ d.forEach((q,i)=>addProgress(p,q.ch,ES.ans[i]===q.ans,'prac',q.lv)); logAct(p,'Thi thử',{ch:EXF.chs.map(chName).join(', ')||'Trộn chương',r:String(ten).replace('.',',')+' điểm ('+sc+'/'+d.length+')'}); save(); ES.saved=true; }
    v.innerHTML=`<div class="card" style="text-align:center"><div class="muted">Điểm</div><div class="big">${String(ten).replace('.',',')}<span class="muted" style="font-size:20px">/10</span></div><p>Đúng ${sc}/${d.length} câu</p><button class="btn pri" id="enew">Làm đề khác</button></div>
    ${d.map((q,i)=>`<div class="card"><div class="small muted">Câu ${i+1} · ${chName(q.ch)} · ${lvTag(q)}</div><div class="qbox" style="font-size:16px">${esc(q.q)}</div>
     ${q.opts.map((o,j)=>`<div class="opt ${j===q.ans?'ok':ES.ans[i]===j?'bad':''}" style="margin-bottom:6px"><b class="k">${'ABCD'[j]}</b><span>${esc(o)}</span></div>`).join('')}
     ${ES.ans[i]===null?'<div class="small" style="color:var(--bad)">Bỏ trống</div>':''}<div class="ex">${esc(q.ex||'')}</div></div>`).join('')}`;
    $('#enew').onclick=()=>{ES=null;viewExam(v);}; return; }
  const q=d[ES.i];
  v.innerHTML=`<div class="card"><div class="row between"><b id="eclk">⏱</b><button class="btn acc sm" id="esub">Nộp bài</button></div>
   <div class="mgrid" style="margin:10px 0">${d.map((_,i)=>`<button class="${ES.ans[i]!==null?'done':''} ${i===ES.i?'cur':''}" data-j="${i}">${i+1}</button>`).join('')}</div>
   <div class="small muted">Câu ${ES.i+1} · ${chName(q.ch)} · ${lvTag(q)}</div><div class="qbox">${esc(q.q)}</div>
   <div class="opts">${q.opts.map((o,i)=>`<button class="opt ${ES.ans[ES.i]===i?'ok':''}" data-i="${i}"><b class="k">${'ABCD'[i]}</b><span>${esc(o)}</span></button>`).join('')}</div>
   <div class="row" style="justify-content:space-between;margin-top:12px"><button class="btn ghost" id="eprev" ${ES.i?'':'disabled'}>← Câu trước</button><button class="btn" id="enext" ${ES.i<d.length-1?'':'disabled'}>Câu sau →</button></div></div>`;
  $$('.opt',v).forEach(b=>b.onclick=()=>{ ES.ans[ES.i]=+b.dataset.i; if(ES.i<d.length-1) ES.i++; viewExam(v); });
  $$('[data-j]',v).forEach(b=>b.onclick=()=>{ ES.i=+b.dataset.j; viewExam(v); });
  $('#eprev').onclick=()=>{ES.i--;viewExam(v);}; $('#enext').onclick=()=>{ES.i++;viewExam(v);};
  const submit=()=>{ ES.done=true; viewExam(v); };
  $('#esub').onclick=()=>{ const left=ES.ans.filter(a=>a===null).length; if(left) confirmBox(`Còn ${left} câu chưa làm. Nộp bài?`,submit); else submit(); };
  const tick=()=>{ const ms=ES.end-Date.now(); if(ms<=0){ clearInterval(iv); toast('Hết giờ! Bài đã được nộp.'); submit(); return; } const el=$('#eclk'); if(el) el.textContent=`⏱ ${Math.floor(ms/60000)}:${String(Math.floor(ms/1000)%60).padStart(2,'0')}`; };
  const iv=setInterval(tick,500); tick(); cleanup=()=>clearInterval(iv);
}

// ===================== CÂU CỦA TÔI =====================
function viewMyQ(v){
  if(IMP) return viewImport(v);
  v.innerHTML=`<div class="card"><h2>✍️ Câu hỏi của tôi</h2><p class="small muted" style="margin:0">Thêm câu từ SGK KNTT, sách Đột phá tư duy, đề HSG của trường… Câu của tôi được trộn vào Luyện tập, Thi thử, Đấu trường và Giải đấu. Chỉ lưu trên máy này, nhớ <b>Xuất file</b> để sao lưu hoặc gửi cho máy khác.</p>
   <div class="row" style="margin-top:10px"><button class="btn acc" id="mimpdoc">📥 Nạp tài liệu → tạo bảng câu hỏi</button><span class="small muted">Word, PDF, ảnh chụp trang sách hoặc dán chữ</span></div></div>
  ${bankBox('mbank')}
  <div class="card"><h3>Thêm một câu</h3>
   <div class="grid g3"><div><label class="f">Chương</label><select id="mch">${CHAPTERS.map(c=>`<option value="${c.id}">${c.ic} ${c.short}</option>`).join('')}</select></div>
   <div><label class="f">Mức</label><select id="mlv">${[1,2,3].map(l=>`<option value="${l}">${LEVELS[l].name}</option>`).join('')}</select></div>
   <div><label class="f">Nguồn</label><select id="msrc">${Object.entries(SRC).map(([k,t])=>`<option value="${k}">${t}</option>`).join('')}</select></div></div>
   <label class="f">Ghi chú nguồn (tuỳ chọn, ví dụ "Bài 8 trang 45", "HSG huyện 2024")</label><input type="text" id="mnote" maxlength="60">
   <label class="f">Câu hỏi</label><textarea id="mq"></textarea>
   <label class="f">Đáp án đúng</label><input type="text" id="ma0">
   <label class="f">3 đáp án sai</label><div class="grid g3"><input type="text" id="ma1"><input type="text" id="ma2"><input type="text" id="ma3"></div>
   <label class="f">Giải thích (tuỳ chọn)</label><input type="text" id="mex">
   <div class="row" style="margin-top:12px;justify-content:flex-end"><button class="btn pri" id="madd">＋ Lưu câu</button></div></div>
  <div class="card"><h3>Dán nhiều câu một lúc</h3><p class="small muted">Mỗi câu theo mẫu dưới, các câu cách nhau một dòng trống. Chương, mức, nguồn lấy theo lựa chọn ở khung trên.</p>
   <textarea id="mbulk" style="min-height:150px" placeholder="Câu: Đơn vị đo tần số là gì?
A. Hz
B. dB
C. m/s
D. N
Đáp án: A
Giải thích: Tần số đo bằng hertz."></textarea>
   <div class="row" style="justify-content:flex-end;margin-top:10px"><button class="btn" id="mbadd">Nhập các câu đã dán</button></div></div>
  <div class="card"><div class="row between"><h3 style="margin:0">Danh sách (${DB.myQ.length} câu)</h3><div class="row"><button class="btn sm" id="mexp">📋 Sao chép dữ liệu</button><button class="btn sm" id="mimp">📥 Nhập dữ liệu</button><label class="btn sm ghost">📂 Mở file<input type="file" id="mfile" accept=".json,.txt" class="hide"></label></div></div>
   <div id="mlist" style="margin-top:10px">${DB.myQ.length?'':'<p class="muted small">Chưa có câu nào.</p>'}${DB.myQ.slice().reverse().map(q=>`<div class="mrow"><div><div class="small muted">${chIc(q.ch)} ${chName(q.ch)} · ${lvTag(Object.assign({mine:true},q))}${q.shared?' <span class="tag">📚 kho lớp'+(q.from?' · '+esc(q.from):'')+'</span>':(q.sentTo&&q.sentTo.length?' <span class="tag l2">⬆️ đã gửi</span>':'')}</div><div>${esc(q.q)}</div><div class="small" style="color:var(--ok)">✔ ${esc(q.opts[0])}</div></div><button class="btn sm ghost" data-del="${q.id}">🗑</button></div>`).join('')}</div></div>`;
  bindBankBox('mbank',()=>viewMyQ(v));
  $('#mimpdoc').onclick=()=>{ IMP={text:'',images:[],items:[],src:'khac',defLv:1}; viewImport(v); };
  const base=()=>({ch:$('#mch').value,lv:+$('#mlv').value,src:$('#msrc').value,note:$('#mnote').value.trim()});
  $('#madd').onclick=()=>{ const o=[0,1,2,3].map(i=>$('#ma'+i).value.trim()); const q=$('#mq').value.trim();
    if(!q||o.some(x=>!x)){toast('Cần đủ câu hỏi và 4 đáp án');return;} if(new Set(o).size<4){toast('4 đáp án phải khác nhau');return;}
    DB.myQ.push(Object.assign(base(),{id:uid(),q,opts:o,ex:$('#mex').value.trim()})); save(); toast('Đã lưu câu hỏi'); viewMyQ(v); };
  $('#mbadd').onclick=()=>{ const res=parseBulk($('#mbulk').value,base()); if(!res.ok.length){toast(res.err||'Không đọc được câu nào');return;} DB.myQ.push(...res.ok); save(); toast(`Đã nhập ${res.ok.length} câu${res.bad?`, bỏ qua ${res.bad} câu sai mẫu`:''}`,3500); viewMyQ(v); };
  $$('[data-del]',v).forEach(b=>b.onclick=()=>confirmBox('Xoá câu này?',()=>{ const dq=DB.myQ.find(q=>q.id===b.dataset.del); if(dq&&dq.sid){ DB.skipSid=(DB.skipSid||[]).concat(dq.sid); } DB.myQ=DB.myQ.filter(q=>q.id!==b.dataset.del); save(); viewMyQ(v); }));
  $('#mexp').onclick=()=>copyText(JSON.stringify({khtn7:'myQ',v:1,items:DB.myQ}),'Đã sao chép. Dán vào Zalo/Notepad để lưu.');
  $('#mimp').onclick=()=>{ const m=modal(`<h3>Nhập dữ liệu câu hỏi</h3><textarea id="mi" style="min-height:160px" placeholder="Dán dữ liệu đã sao chép vào đây"></textarea><div class="row" style="justify-content:flex-end;margin-top:10px"><button class="btn ghost" data-x>Huỷ</button><button class="btn pri" data-y>Nhập</button></div>`);
    $('[data-x]',m).onclick=()=>m.remove(); $('[data-y]',m).onclick=()=>{ if(importMyQ($('#mi',m).value)){ m.remove(); viewMyQ(v);} }; };
  $('#mfile').onchange=e=>{ const f=e.target.files[0]; if(!f) return; f.text().then(t=>{ if(importMyQ(t)) viewMyQ(v); }); };
}
function importMyQ(t){ try{ const o=JSON.parse(t); const items=Array.isArray(o)?o:o.items; const ok=items.filter(q=>q&&q.q&&Array.isArray(q.opts)&&q.opts.length===4&&CHAPTERS.some(c=>c.id===q.ch)); let n=0;
  ok.forEach(q=>{ if(!DB.myQ.some(x=>x.q===q.q)){ DB.myQ.push({id:uid(),ch:q.ch,lv:+q.lv||1,src:q.src||'khac',note:q.note||'',q:q.q,opts:q.opts.map(String),ex:q.ex||''}); n++; } });
  save(); toast(`Đã nhập ${n} câu mới`); return true; }catch(e){ toast('Dữ liệu không đúng định dạng'); return false; } }
function parseBulk(txt,base){
  const blocks=txt.split(/\n\s*\n/).map(b=>b.trim()).filter(Boolean); const ok=[]; let bad=0;
  for(const b of blocks){ const lines=b.split('\n').map(l=>l.trim()).filter(Boolean); let q='',o={},ans='',ex='';
    for(const l of lines){ let m;
      if((m=l.match(/^(?:câu(?:\s*\d+)?\s*[:.]?)\s*(.*)$/i))&&!q) q=m[1];
      else if((m=l.match(/^([A-Da-d])[.)]\s*(.+)$/))) o[m[1].toUpperCase()]=m[2];
      else if((m=l.match(/^đáp\s*án\s*[:.]?\s*([A-Da-d])/i))) ans=m[1].toUpperCase();
      else if((m=l.match(/^(?:giải\s*thích|lời\s*giải|hd)\s*[:.]?\s*(.*)$/i))) ex=m[1];
      else if(!Object.keys(o).length && q) q+='\n'+l; else if(!q) q=l; }
    const keys=['A','B','C','D']; if(!q||keys.some(k=>!o[k])||!ans){bad++;continue;}
    const opts=[o[ans],...keys.filter(k=>k!==ans).map(k=>o[k])]; if(new Set(opts).size<4){bad++;continue;}
    ok.push(Object.assign({},base,{id:uid(),q,opts,ex})); }
  return {ok,bad,err:blocks.length?'Sai mẫu: cần "Câu:", 4 dòng A. B. C. D. và "Đáp án: X"':'Chưa dán nội dung'};
}
function copyText(t,msg){ const done=()=>toast(msg||'Đã sao chép'); try{ navigator.clipboard.writeText(t).then(done,()=>fallbackCopy(t,done)); }catch(e){ fallbackCopy(t,done); } }
function fallbackCopy(t,done){ const m=modal(`<h3>Sao chép thủ công</h3><p class="small muted">Bấm vào ô, Ctrl+A rồi Ctrl+C.</p><textarea style="min-height:160px">${esc(t)}</textarea><div class="row" style="justify-content:flex-end;margin-top:8px"><button class="btn" data-x>Đóng</button></div>`); $('textarea',m).select(); $('[data-x]',m).onclick=()=>m.remove(); }
