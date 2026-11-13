// ===================== ĐẤU TRƯỜNG: BỘ MÁY TRẬN ĐẤU =====================
// Ghế: A1, A2 (đội A) – B1, B2 (đội B). Loại ghế: human (trên máy này), bot, remote (online).
const BOT_NAMES=['Bot Mầm','Bot Chồi','Bot Lá','Bot Hoa','Bot Quả','Bot Cây','Bot Rừng','Bot Đại Ngàn'];
const BOT_EMO=['🌱','🌿','🍃','🌼','🍎','🌳','🌲','🏔️'];
const KEYSETS=[['1','2','3','4'],['q','w','e','r'],['u','i','o','p'],['7','8','9','0']];
const ARENA_TIME={1:15,2:25,3:40};
function botSeat(l){ return {kind:'bot',lvl:l,name:BOT_NAMES[l-1],emo:BOT_EMO[l-1],elo:700+100*l}; }
function eloExpected(a,b){ return 1/(1+Math.pow(10,(b-a)/400)); }

class Match{
  constructor(cfg){ // cfg: {seats:{A1:{..},B1:{..},..}, target, filter, noDraw, onUpdate, onEnd}
    this.cfg=cfg; this.seats=cfg.seats; this.score={A:0,B:0}; this.qi=-1; this.q=null; this.phase='ready';
    this.cap=cfg.target*2+6; this.timers=[]; this.history=[]; this.deck=makeDeck(cfg.filter,this.cap+20); this.extra=0;
  }
  team(s){ return s[0]; }
  seatIds(){ return Object.keys(this.seats).filter(k=>this.seats[k]); }
  clearT(){ this.timers.forEach(clearTimeout); this.timers=[]; }
  start(){ this.next(); }
  next(){
    this.clearT();
    const {A,B}=this.score, t=this.cfg.target;
    const asked=this.qi+1;
    if(A>=t||B>=t||(asked>=this.cap&&!(this.cfg.noDraw&&A===B))) return this.finish();
    this.qi++; this.q=this.deck[this.qi]||prep(pick(pool({}))); if(!this.deck[this.qi]) this.deck[this.qi]=this.q;
    this.ans={}; this.winner=null; this.phase='q';
    this.limit=(ARENA_TIME[this.q.lv]||20)*1000; this.deadline=Date.now()+this.limit;
    this.sudden=asked>=this.cap;
    this.timers.push(setTimeout(()=>this.reveal(),this.limit));
    for(const s of this.seatIds()){ const st=this.seats[s]; if(st.kind!=='bot') continue;
      const acc=Math.max(.15,Math.min(.97,.35+.075*st.lvl-.08*(this.q.lv-1)));
      const t=Math.max(1500,this.limit*(.78-.07*st.lvl)*(.6+Math.random()*.6));
      const ok=Math.random()<acc; const c=ok?this.q.ans:pick([0,1,2,3].filter(x=>x!==this.q.ans));
      if(t<this.limit-300) this.timers.push(setTimeout(()=>this.answer(s,c),t)); }
    this.upd();
  }
  answer(seat,c){
    if(this.phase!=='q'||!this.seats[seat]||this.ans[seat]) return;
    const ok=c===this.q.ans; this.ans[seat]={c,ok,t:Date.now()};
    if(ok){ this.winner=seat; this.score[this.team(seat)]++; beep(true); return this.reveal(); }
    beep(false);
    // đội có tất cả thành viên đã sai thì không trả lời được nữa; nếu mọi ghế đã trả lời → lộ đáp án
    if(this.seatIds().every(s=>this.ans[s])) return this.reveal();
    this.upd();
  }
  reveal(){ if(this.phase!=='q') return; this.clearT(); this.phase='rev';
    this.history.push({q:this.q,winner:this.winner,ans:this.ans,t0:this.deadline-this.limit});
    this.upd(); this.timers.push(setTimeout(()=>this.next(),this.cfg.revealMs||3200)); }
  finish(){
    this.clearT(); this.phase='end'; const {A,B}=this.score; const res=A>B?'A':B>A?'B':'D';
    // ELO cho hồ sơ người thật
    const teamElo=t=>{ const ss=this.seatIds().filter(s=>s[0]===t); return ss.reduce((x,s)=>x+(this.seats[s].elo||1000),0)/Math.max(1,ss.length); };
    const eA=eloExpected(teamElo('A'),teamElo('B')); const sA=res==='A'?1:res==='D'?.5:0;
    this.delta={};
    for(const s of this.seatIds()){ const st=this.seats[s]; if(st.kind==='bot') continue;
      const exp=s[0]==='A'?eA:1-eA, sc=s[0]==='A'?sA:1-sA; const d=Math.round(32*(sc-exp)); this.delta[s]=d;
      if(st.pid){ const p=DB.profiles.find(x=>x.id===st.pid); if(p){ p.elo=Math.max(100,p.elo+d); if(sc===1)p.w++; else if(sc===.5)p.d++; else p.l++;
        this.history.forEach(h=>{ if(h.ans[s]) addProgress(p,h.q.ch,h.ans[s].ok,'arena'); });
        logAct(p,'Đấu '+(this.seatIds().length>2?'2 vs 2':'1 vs 1'),{r:(sc===1?'Thắng ':sc===.5?'Hoà ':'Thua ')+(s[0]==='A'?A+'–'+B:B+'–'+A)}); } } }
    save(); this.result=res; this.upd(); this.cfg.onEnd&&this.cfg.onEnd(this);
  }
  stop(){ this.clearT(); this.phase='end'; }
  upd(){ this.cfg.onUpdate&&this.cfg.onUpdate(this); }
}

// ----- Giao diện trận đấu dùng chung (chạy trên máy chủ trận)
function seatLabel(st){ return `${st.emo||'🙂'} ${esc(st.name)}`; }
function renderMatch(el,m,opts={}){
  const ids=m.seatIds(); const q=m.q;
  const teamNames=t=>ids.filter(s=>s[0]===t).map(s=>`<span class="seat ${m.ans&&m.ans[s]?(m.ans[s].ok?'ok':'x'):''}">${seatLabel(m.seats[s])}${m.seats[s].kind==='remote'?' 🌐':''}</span>`).join('');
  let body='';
  if(m.phase==='end'){
    const r=m.result; const nm=t=>ids.filter(s=>s[0]===t).map(s=>m.seats[s].name).join(' & ');
    body=`<div class="champ"><div class="big">${r==='D'?'🤝 Hoà':'🏆 '+esc(nm(r))}</div><p>${r==='D'?'Hai đội bất phân thắng bại':'chiến thắng!'} · Tỉ số ${m.score.A} – ${m.score.B}</p>
      <div class="row" style="justify-content:center">${Object.entries(m.delta||{}).map(([s,d])=>`<span class="chip">${seatLabel(m.seats[s])} ELO ${d>=0?'+':''}${d}</span>`).join('')}</div>
      <div class="row" style="justify-content:center;margin-top:12px">${opts.endButtons||''}</div></div>
      <details style="margin-top:12px"><summary class="small muted">Xem lại ${m.history.length} câu đã đấu</summary>${m.history.map((h,i)=>`<div class="mrow"><div><div class="small muted">Câu ${i+1} · ${chName(h.q.ch)}</div>${esc(h.q.q)}<div class="small" style="color:var(--ok)">✔ ${esc(h.q.opts[h.q.ans])}</div><div class="small muted">${esc(h.q.ex||'')}</div></div><span class="small">${h.winner?'+1 '+esc(m.seats[h.winner].name):'—'}</span></div>`).join('')}</details>`;
  } else if(q){
    const humans=ids.filter(s=>m.seats[s].kind==='human');
    const rev=m.phase==='rev';
    body=`${m.sudden?'<div class="tag l3" style="margin-bottom:6px">⚡ Câu hỏi phụ – ai đúng trước thắng</div>':''}<div class="timer"><i id="tbar" style="width:100%"></i></div>
     <div class="small muted">Câu ${m.qi+1} · ${chIc(q.ch)} ${chName(q.ch)} · ${lvTag(q)}</div><div class="qbox">${esc(q.q)}</div>
     <div class="opts">${q.opts.map((o,i)=>`<div class="opt ${rev&&i===q.ans?'ok':''}"><b class="k">${'ABCD'[i]}</b><span>${esc(o)}</span></div>`).join('')}</div>
     ${rev?`<div class="ex">${m.winner?`✅ ${seatLabel(m.seats[m.winner])} trả lời đúng trước, +1 cho đội ${m.winner[0]}`:'Không ai trả lời đúng.'} Đáp án <b>${'ABCD'[q.ans]}</b>. ${esc(q.ex||'')}</div>`:''}
     ${humans.length?`<div class="pads">${humans.map(s=>{ const ks=m.seats[s].keys; const lk=m.ans[s]||rev;
        return `<div class="pad ${s[0]} ${lk?'locked':''}"><div class="small"><b>${seatLabel(m.seats[s])}</b> <span class="muted">· phím ${ks.join(' ').toUpperCase()}</span></div><div class="pb">${[0,1,2,3].map(i=>`<button data-s="${s}" data-c="${i}" ${lk?'disabled':''}>${'ABCD'[i]} <span class="small muted">(${ks[i].toUpperCase()})</span></button>`).join('')}</div></div>`; }).join('')}</div>`:''}`;
  }
  el.innerHTML=`<div class="card"><div class="score"><div class="team A"><div class="small">ĐỘI A</div><div class="pts">${m.score.A}</div><div>${teamNames('A')}</div></div>
    <div class="vs">đến ${m.cfg.target}</div><div class="team B"><div class="small">ĐỘI B</div><div class="pts">${m.score.B}</div><div>${teamNames('B')}</div></div></div>${body}
    ${m.phase!=='end'?`<div class="row" style="justify-content:flex-end;margin-top:12px">${opts.extra||''}<button class="btn ghost sm" id="mquit">Dừng trận</button></div>`:''}</div>`;
  $$('[data-s]',el).forEach(b=>b.onclick=()=>m.answer(b.dataset.s,+b.dataset.c));
  const qb=$('#mquit',el); if(qb) qb.onclick=()=>confirmBox('Dừng trận đấu? Kết quả sẽ không được tính.',()=>{ m.stop(); opts.onQuit&&opts.onQuit(); });
}
function animTimer(m){ const raf=()=>{ const b=document.getElementById('tbar'); if(!b||m.phase==='end') return; const w=m.phase==='q'?Math.max(0,(m.deadline-Date.now())/m.limit*100):0; b.style.width=w+'%'; requestAnimationFrame(raf); }; requestAnimationFrame(raf); }
function matchKeys(m){ const h=e=>{ if(m.phase!=='q'||e.target.tagName==='INPUT'||e.target.tagName==='TEXTAREA') return; const k=e.key.toLowerCase();
    for(const s of m.seatIds()){ const st=m.seats[s]; if(st.kind!=='human') continue; const i=st.keys.indexOf(k); if(i>=0){ m.answer(s,i); return; } } };
  document.addEventListener('keydown',h); return ()=>document.removeEventListener('keydown',h); }

// ----- Trang Đấu trường (trên một máy)
const ARF={chs:[],lvs:[],mine:'all',mode:'1v1',target:5,seats:{}}; let AM=null;
function seatOptions(sel,allowEmpty){
  return `${DB.profiles.map(p=>`<option value="p:${p.id}" ${sel==='p:'+p.id?'selected':''}>${p.emo} ${esc(p.name)} (${p.elo})</option>`).join('')}
   ${[1,2,3,4,5,6,7,8].map(l=>`<option value="b:${l}" ${sel==='b:'+l?'selected':''}>🤖 ${BOT_NAMES[l-1]} – cấp ${l}</option>`).join('')}`;
}
function buildSeat(val,keyIdx){
  if(val.startsWith('b:')) return botSeat(+val.slice(2));
  const p=DB.profiles.find(x=>x.id===val.slice(2)); return {kind:'human',pid:p.id,name:p.name,emo:p.emo,elo:p.elo,keys:KEYSETS[keyIdx]};
}
function startLocalMatch(v,seatVals,cfg,onEnd){
  let ki=0; const seats={}; const used=new Set();
  for(const [s,val] of Object.entries(seatVals)){ if(!val) continue; if(val.startsWith('p:')){ if(used.has(val)){ toast('Một hồ sơ không thể ngồi hai ghế'); return false; } used.add(val); }
    seats[s]=buildSeat(val,ki); if(seats[s].kind==='human') ki++; }
  if(!Object.keys(seats).some(s=>s[0]==='A')||!Object.keys(seats).some(s=>s[0]==='B')){ toast('Cần người ngồi cả đội A và đội B'); return false; }
  let off=null;
  const m=new Match({seats,target:cfg.target,filter:cfg.filter,noDraw:cfg.noDraw,
    onUpdate:mm=>{ renderMatch(v,mm,{endButtons:cfg.endButtons||`<button class="btn pri" id="rem">Đấu lại</button><button class="btn ghost" id="back">Về sảnh</button>`,onQuit:()=>{ off&&off(); AM=null; cfg.onQuit?cfg.onQuit():viewArena(v);} });
      if(mm.phase!=='end') animTimer(mm);
      else { off&&off(); const r=$('#rem',v), b=$('#back',v); if(r) r.onclick=()=>startLocalMatch(v,seatVals,cfg,onEnd); if(b) b.onclick=()=>{AM=null;viewArena(v);}; } },
    onEnd:mm=>{ onEnd&&onEnd(mm); render0(); }});
  function render0(){ const p=$('#hdr .chip'); if(p&&curP()) p.textContent=`${curP().emo} ${curP().name} · ELO ${curP().elo}`; }
  AM=m; off=matchKeys(m); cleanup=()=>{ m.stop(); off&&off(); AM=null; };
  m.start(); return true;
}
function viewArena(v){
  if(AM&&AM.phase!=='end'){ AM.upd(); return; }
  const p=curP();
  if(!DB.profiles.length){ v.innerHTML=`<div class="card"><h2>⚔️ Đấu trường</h2><p>Tạo hồ sơ người chơi trước nhé.</p><button class="btn pri" id="mk">＋ Tạo hồ sơ</button></div>`; $('#mk').onclick=()=>profileDialog(()=>render()); return; }
  const S=ARF.seats; const two=ARF.mode==='2v2';
  if(!S.A1) S.A1='p:'+(p?p.id:DB.profiles[0].id); if(!S.B1) S.B1='b:3'; if(!S.A2) S.A2='b:2'; if(!S.B2) S.B2='b:2';
  const seatSel=(s)=>`<div><label class="f">${s[0]==='A'?'🔵':'🟠'} Ghế ${s}</label><select data-seat="${s}" style="width:100%">${seatOptions(S[s])}</select></div>`;
  v.innerHTML=`<div class="card"><h2>⚔️ Đấu trường</h2><p class="small muted" style="margin:0">Cùng một câu hỏi, <b>ai bấm đúng trước</b> ghi 1 điểm cho đội. Bấm sai thì bị khoá ở câu đó. Đội nào đủ điểm trước thì thắng. Nhiều bạn chơi chung một máy: mỗi bạn dùng một bộ phím riêng hoặc bấm nút trên màn hình.</p>
   <div class="row" style="margin-top:10px">${['1v1','2v2'].map(x=>`<span class="tog ${ARF.mode===x?'on':''}" data-mode="${x}">${x==='1v1'?'👤 1 vs 1':'👥 2 vs 2'}</span>`).join('')}
    <span style="flex:1"></span><label class="small">Đấu đến <select id="atg">${[3,5,7,10,15].map(n=>`<option ${n===ARF.target?'selected':''}>${n}</option>`).join('')}</select> điểm</label></div>
   <div class="grid g2" style="margin-top:8px"><div>${seatSel('A1')}${two?seatSel('A2'):''}</div><div>${seatSel('B1')}${two?seatSel('B2'):''}</div></div>
   <p class="small muted">Bộ phím theo thứ tự người thật: người 1 dùng <b>1 2 3 4</b>, người 2 <b>Q W E R</b>, người 3 <b>U I O P</b>, người 4 <b>7 8 9 0</b>. Bot cấp 1 rất dễ, cấp 8 gần như không sai. <button class="btn sm ghost" id="anp">＋ Thêm hồ sơ</button></p>
   ${filterUI('af',ARF)}
   <div class="row" style="margin-top:14px;justify-content:flex-end"><button class="btn pri" id="ago">▶ Bắt đầu trận</button></div></div>
   <div class="card"><h3>Bảng xếp hạng ELO trên máy này</h3><table><tr><th>#</th><th class="l">Người chơi</th><th>ELO</th><th>T</th><th>H</th><th>B</th></tr>
   ${DB.profiles.filter(p=>!p.role||p.role==='hs').sort((a,b)=>b.elo-a.elo).map((p,i)=>`<tr><td>${i+1}</td><td class="l">${p.emo} ${esc(p.name)}</td><td><b>${p.elo}</b></td><td>${p.w}</td><td>${p.d}</td><td>${p.l}</td></tr>`).join('')}</table></div>`;
  $$('[data-mode]',v).forEach(t=>t.onclick=()=>{ ARF.mode=t.dataset.mode; viewArena(v); });
  $$('[data-seat]',v).forEach(sel=>sel.onchange=()=>{ S[sel.dataset.seat]=sel.value; });
  $('#atg').onchange=e=>ARF.target=+e.target.value;
  $('#anp').onclick=()=>profileDialog(()=>viewArena(v));
  bindFilter('af',ARF);
  $('#ago').onclick=()=>{ const vals=two?{A1:S.A1,A2:S.A2,B1:S.B1,B2:S.B2}:{A1:S.A1,B1:S.B1};
    startLocalMatch(v,vals,{target:ARF.target,filter:{bank:ARF.bank,chs:ARF.chs,lvs:ARF.lvs,mine:ARF.mine,trs:ARF.trs,grs:ARF.grs}}); };
}
