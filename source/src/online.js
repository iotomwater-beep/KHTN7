// ===================== ĐẤU ONLINE (Firebase Realtime Database) =====================
// Dùng chung máy chủ Firebase "phan-cuong" với EngLab. Phòng KHTN có mã 5 số bắt đầu bằng 7 (EngLab dùng 4 số) nên không lẫn nhau.
const FB_DEFAULT={apiKey:"AIzaSyB-tjtnkJT9rIKBRIUDGAPRaRIn2b4fKRc",authDomain:"phan-cuong.firebaseapp.com",
  databaseURL:"https://phan-cuong-default-rtdb.asia-southeast1.firebasedatabase.app",projectId:"phan-cuong",
  storageBucket:"phan-cuong.firebasestorage.app",messagingSenderId:"55335718412",appId:"1:55335718412:web:ec4be30ecac7d7bb4aa829"};
const FBV='10.12.2'; let FB=null, FBUID=null, FBP=null;
function loadScript(src){ return new Promise((ok,no)=>{ const s=document.createElement('script'); s.src=src; s.onload=ok; s.onerror=()=>no(new Error('Không tải được '+src)); document.head.appendChild(s); }); }
function fbInit(){
  if(FBP) return FBP;
  FBP=(async()=>{
    const base=`https://www.gstatic.com/firebasejs/${FBV}/`;
    await loadScript(base+'firebase-app-compat.js'); await loadScript(base+'firebase-auth-compat.js'); await loadScript(base+'firebase-database-compat.js');
    const cfg=DB.fb||FB_DEFAULT; const app=firebase.apps.length?firebase.app():firebase.initializeApp(cfg);
    const cred=await firebase.auth(app).signInAnonymously(); FBUID=cred.user.uid; FB=firebase.database(app); return FB;
  })().catch(e=>{ FBP=null; throw e; });
  return FBP;
}
const roomRef=c=>FB.ref('rooms/'+c);
let ON={role:null,code:null,offs:[]};
function onlineLeave(){ ON.offs.forEach(f=>{try{f();}catch(e){}}); ON.offs=[]; if(ON.match){ ON.match.stop(); ON.match=null; }
  if(ON.role==='host'&&ON.code&&FB) roomRef(ON.code).remove().catch(()=>{});
  if(ON.role==='guest'&&ON.code&&FB) roomRef(ON.code).child('players/'+FBUID).remove().catch(()=>{});
  ON={role:null,code:null,offs:[]}; }

function viewOnline(v){
  cleanup=onlineLeave;
  if(ON.role==='host') return hostLobby(v);
  if(ON.role==='guest') return guestView(v);
  const p=curP();
  v.innerHTML=`<div class="card"><h2>🌐 Đấu online – mỗi bạn một máy</h2>
   <p class="small muted" style="margin:0">Người lớn (thầy cô, phụ huynh) <b>tạo phòng</b> và làm trọng tài; các bạn mở app trên máy mình, chọn hồ sơ và <b>nhập mã phòng</b>. Máy tạo phòng phải mở suốt trận. Lên máy chủ chỉ có biệt danh, con vật, ELO và đáp án; phòng tự xoá khi xong.</p></div>
  <div class="grid g2"><div class="card"><h3>🏠 Tạo phòng (máy trọng tài)</h3><p class="small muted">Phòng KHTN có mã 5 số, bắt đầu bằng số 7.</p><button class="btn pri" id="oc">＋ Tạo phòng mới</button></div>
   <div class="card"><h3>🚪 Vào phòng</h3>${p?`<p class="small">Chơi với hồ sơ: <b>${p.emo} ${esc(p.name)}</b> <button class="btn sm ghost" id="osw">Đổi</button></p>
    <div class="row"><input type="text" id="ocode" inputmode="numeric" maxlength="5" placeholder="Mã phòng, ví dụ 71234" style="flex:1;width:auto"><button class="btn pri" id="oj">Vào phòng</button></div>`:`<p>Cần tạo hồ sơ trước.</p><button class="btn pri" id="omk">＋ Tạo hồ sơ</button>`}</div></div>
  <div class="card"><div class="row between"><h3 style="margin:0">⚙️ Máy chủ</h3><button class="btn sm" id="otest">Kiểm tra kết nối</button></div>
   <p class="small muted" id="ostat">Đang dùng máy chủ Firebase <b>${esc((DB.fb||FB_DEFAULT).projectId)}</b>. Chạy khi mở app bằng <b>đường link web</b> hoặc file đã tải về (trang xem trong Claude chặn kết nối ra ngoài).</p>
   <details><summary class="small">Đổi máy chủ khác</summary><p class="small muted">Dán đoạn firebaseConfig (có databaseURL) của dự án khác. Để trống rồi Lưu để quay về phan-cuong.</p><textarea id="ocfg" placeholder="{ apiKey: ..., databaseURL: ... }">${DB.fb?esc(JSON.stringify(DB.fb,null,1)):''}</textarea><button class="btn sm" id="osave" style="margin-top:6px">Lưu</button></details></div>`;
  const stat=$('#ostat');
  const connect=async()=>{ stat.innerHTML='⏳ Đang kết nối máy chủ…'; try{ await fbInit(); stat.innerHTML='<span style="color:var(--ok)">✅ Kết nối thành công.</span>'; return true; }
    catch(e){ stat.innerHTML=`<span style="color:var(--bad)">❌ Không kết nối được: ${esc(e.message||e)}.</span> Hãy mở file HTML đã tải về bằng Chrome, kiểm tra mạng, và kiểm tra Firebase đã bật đăng nhập ẩn danh.`; return false; } };
  $('#otest').onclick=connect;
  $('#osave').onclick=()=>{ const t=$('#ocfg').value.trim(); if(!t){ DB.fb=null; save(); toast('Đã quay về máy chủ phan-cuong. Tải lại trang để áp dụng.'); return; }
    const o={}; ['apiKey','authDomain','databaseURL','projectId','storageBucket','messagingSenderId','appId'].forEach(k=>{ const m=t.match(new RegExp(k+'\\s*["\']?\\s*:\\s*["\']([^"\']+)["\']')); if(m) o[k]=m[1]; });
    if(!o.apiKey||!o.databaseURL){ toast('Thiếu apiKey hoặc databaseURL'); return; } DB.fb=o; save(); toast('Đã lưu. Tải lại trang để áp dụng.'); };
  $('#oc').onclick=async()=>{ if(!await connect()) return; await createRoom(); viewOnline(v); };
  if(p){ $('#osw').onclick=()=>switchProfile(); $('#oj').onclick=async()=>{ const c=$('#ocode').value.trim(); if(!/^\d{5}$/.test(c)){ toast('Mã phòng KHTN gồm 5 chữ số'); return; } if(!await connect()) return; await joinRoom(c,v); }; }
  else $('#omk').onclick=()=>profileDialog(()=>render());
}

// ---------- CHỦ PHÒNG ----------
async function createRoom(){
  let code; for(let i=0;i<20;i++){ code='7'+String(Math.floor(Math.random()*10000)).padStart(4,'0'); const s=await roomRef(code).get(); if(!s.exists()) break; }
  await roomRef(code).set({app:'khtn7',host:FBUID,created:Date.now(),st:'lobby'});
  roomRef(code).onDisconnect().remove();
  ON={role:'host',code,offs:[],players:{},cfg:{mode:'1v1',target:5,chs:[],lvs:[],mine:'all',seats:{A1:'b:3',B1:'b:3',A2:'',B2:''}}};
  const ref=roomRef(code).child('players'); const h=ref.on('value',s=>{ ON.players=s.val()||{}; if(ON.lobbyRender) ON.lobbyRender(); });
  ON.offs.push(()=>ref.off('value',h));
}
function hostLobby(v){
  if(ON.match){ ON.match.upd(); return; } const C=ON.cfg; const two=C.mode==='2v2';
  const opts=sel=>`<option value="" ${!sel?'selected':''}>— Trống —</option>${Object.entries(ON.players).map(([u,p])=>`<option value="u:${u}" ${sel==='u:'+u?'selected':''}>🌐 ${esc(p.e)} ${esc(p.n)} (${p.elo})</option>`).join('')}
    ${DB.profiles.map(p=>`<option value="p:${p.id}" ${sel==='p:'+p.id?'selected':''}>💻 ${p.emo} ${esc(p.name)} (trên máy này)</option>`).join('')}
    ${[1,2,3,4,5,6,7,8].map(l=>`<option value="b:${l}" ${sel==='b:'+l?'selected':''}>🤖 ${BOT_NAMES[l-1]} – cấp ${l}</option>`).join('')}`;
  const seat=s=>`<div><label class="f">${s[0]==='A'?'🔵':'🟠'} Ghế ${s}</label><select data-seat="${s}" style="width:100%">${opts(C.seats[s])}</select></div>`;
  v.innerHTML=`<div class="card" style="text-align:center"><div class="muted">Mã phòng – đọc cho các bạn nhập</div><div class="code">${ON.code}</div>
   <div class="small muted">${Object.keys(ON.players).length} bạn đã vào phòng: ${Object.values(ON.players).map(p=>esc(p.e+' '+p.n)).join(', ')||'chưa có ai'}</div></div>
  <div class="card"><h3>🪑 Xếp ghế</h3><div class="row">${['1v1','2v2'].map(x=>`<span class="tog ${C.mode===x?'on':''}" data-mode="${x}">${x==='1v1'?'👤 1 vs 1':'👥 2 vs 2'}</span>`).join('')}<span style="flex:1"></span>
   <label class="small">Đấu đến <select id="htg">${[3,5,7,10,15].map(n=>`<option ${n===C.target?'selected':''}>${n}</option>`).join('')}</select> điểm</label></div>
   <div class="grid g2" style="margin-top:6px"><div>${seat('A1')}${two?seat('A2'):''}</div><div>${seat('B1')}${two?seat('B2'):''}</div></div>
   ${filterUI('hf',C)}
   <div class="row" style="justify-content:space-between;margin-top:14px"><button class="btn ghost" id="hclose">Đóng phòng</button><button class="btn pri" id="hstart">▶ Bắt đầu trận</button></div></div>`;
  ON.lobbyRender=()=>{ if(TAB==='online'&&ON.role==='host'&&!ON.match) hostLobby(v); };
  $$('[data-mode]',v).forEach(t=>t.onclick=()=>{ C.mode=t.dataset.mode; hostLobby(v); });
  $$('[data-seat]',v).forEach(s=>s.onchange=()=>{ C.seats[s.dataset.seat]=s.value; });
  $('#htg').onchange=e=>C.target=+e.target.value; bindFilter('hf',C);
  $('#hclose').onclick=()=>{ onlineLeave(); viewOnline(v); };
  $('#hstart').onclick=()=>hostStart(v);
}
async function hostStart(v){
  const C=ON.cfg; const ids=C.mode==='2v2'?['A1','A2','B1','B2']:['A1','B1']; const seats={}, pub={}; let ki=0; const used=new Set();
  for(const s of ids){ const val=C.seats[s]; if(!val) continue; if(used.has(val)&&!val.startsWith('b:')){ toast('Một người không thể ngồi hai ghế'); return; } used.add(val);
    if(val.startsWith('b:')) seats[s]=botSeat(+val.slice(2));
    else if(val.startsWith('p:')){ const p=DB.profiles.find(x=>x.id===val.slice(2)); seats[s]={kind:'human',pid:p.id,name:p.name,emo:p.emo,elo:p.elo,keys:KEYSETS[ki++]}; }
    else { const u=val.slice(2), p=ON.players[u]; if(!p){ toast('Có bạn đã rời phòng, xếp ghế lại nhé'); return; } seats[s]={kind:'remote',uid:u,name:p.n,emo:p.e,elo:p.elo||1000}; }
    pub[s]={n:seats[s].name,e:seats[s].emo,u:seats[s].uid||'',k:seats[s].kind}; }
  if(!ids.some(s=>s[0]==='A'&&seats[s])||!ids.some(s=>s[0]==='B'&&seats[s])){ toast('Cần người ngồi cả đội A và đội B'); return; }
  const R=roomRef(ON.code); await R.update({st:'play',seats:pub,target:C.target,g:null,a:null,res:null});
  let ansOff=null, curQi=-1;
  const m=new Match({seats,target:C.target,filter:{bank:C.bank,chs:C.chs,lvs:C.lvs,mine:C.mine,trs:C.trs,grs:C.grs},
    onUpdate:mm=>{
      renderMatch(v,mm,{extra:`<span class="chip">Phòng ${ON.code}</span>`,endButtons:`<button class="btn pri" id="hagain">Về sảnh, đấu tiếp</button>`,onQuit:()=>{ R.update({st:'lobby',g:null,a:null}); ON.match=null; hostLobby(v);} });
      if(mm.phase!=='end') animTimer(mm);
      const lock={}; Object.entries(mm.ans||{}).forEach(([s,a])=>lock[s]=a.ok?'ok':'x');
      const q=mm.q; const g={ph:mm.phase,qi:mm.qi,sc:mm.score,lock,sud:!!mm.sudden};
      if(q&&mm.phase!=='end'){ g.q={t:q.q,o:q.opts,lv:q.lv,ch:q.ch}; g.rem=Math.max(0,mm.deadline-Date.now()); g.lim=mm.limit; }
      if(mm.phase==='rev'){ g.ans=q.ans; g.ex=q.ex||''; g.win=mm.winner||''; }
      R.child('g').set(g);
      if(mm.phase==='q'&&mm.qi!==curQi){ curQi=mm.qi; if(ansOff) ansOff(); const ar=R.child('a/'+mm.qi);
        const h=ar.on('child_added',s=>{ const val=s.val()||{}; const st=mm.seats[s.key]; if(st&&st.kind==='remote'&&st.uid===val.u&&mm.qi===curQi) mm.answer(s.key,+val.c); });
        ansOff=()=>ar.off('child_added',h); }
      if(mm.phase==='end'){ const b=$('#hagain',v); if(b) b.onclick=()=>{ ON.match=null; R.update({st:'lobby',g:null,a:null}); hostLobby(v); }; }
    },
    onEnd:mm=>{ if(ansOff) ansOff(); const d={}; Object.entries(mm.delta||{}).forEach(([s,x])=>{ if(mm.seats[s].uid) d[mm.seats[s].uid]=x; });
      R.update({st:'end',res:{r:mm.result,sc:mm.score,d,id:Date.now()},a:null}); }});
  ON.match=m; const koff=matchKeys(m); ON.offs.push(koff); m.start();
}

// ---------- NGƯỜI CHƠI ----------
async function joinRoom(code,v){
  const s=await roomRef(code).get(); const r=s.val();
  if(!r||r.app!=='khtn7'){ toast('Không tìm thấy phòng '+code); return; }
  const p=curP(); await roomRef(code).child('players/'+FBUID).set({n:p.name,e:p.emo,elo:p.elo});
  roomRef(code).child('players/'+FBUID).onDisconnect().remove();
  ON={role:'guest',code,offs:[],room:r,pid:p.id,myAns:{}};
  const h=roomRef(code).on('value',ss=>{ ON.room=ss.val(); if(!ON.room){ toast('Phòng đã đóng'); onlineLeave(); if(TAB==='online') viewOnline(v); return; } if(TAB==='online') guestView(v); });
  ON.offs.push(()=>roomRef(code).off('value',h));
  guestView(v);
}
let GTIMER=null;
function guestView(v){
  const r=ON.room||{}; const p=DB.profiles.find(x=>x.id===ON.pid)||curP(); const seats=r.seats||{};
  const mySeat=Object.keys(seats).find(s=>seats[s].u===FBUID&&r.st!=='lobby');
  const head=`<div class="row between"><span class="chip">Phòng ${ON.code}</span><span class="chip">${p.emo} ${esc(p.name)}${mySeat?' · ghế '+mySeat:''}</span><button class="btn sm ghost" id="gl">Rời phòng</button></div>`;
  const g=r.g;
  // áp dụng ELO một lần khi trận kết thúc
  if(r.st==='end'&&r.res&&r.res.d&&r.res.d[FBUID]!==undefined){ const key=ON.code+':'+r.res.id; if(!DB.applied[key]){ DB.applied[key]=1; const d=r.res.d[FBUID]; p.elo=Math.max(100,p.elo+d);
    const myTeam=mySeat?mySeat[0]:null; if(myTeam){ if(r.res.r==='D')p.d++; else if(r.res.r===myTeam)p.w++; else p.l++; } save(); } }
  let body='';
  if(r.st==='lobby'||!g){ body=`<div style="text-align:center;padding:24px"><div class="big">⏳</div><p>Đã vào phòng. Chờ trọng tài xếp ghế và bắt đầu…</p><p class="small muted">${Object.values(r.players||{}).map(x=>esc(x.e+' '+x.n)).join(' · ')}</p></div>`; }
  else if(r.st==='end'&&r.res){ const res=r.res; const my=mySeat?mySeat[0]:null; const d=res.d&&res.d[FBUID];
    body=`<div class="champ"><div class="big">${res.r==='D'?'🤝 Hoà':my?(res.r===my?'🏆 Thắng rồi!':'💪 Thua sát nút!'):'Đội '+res.r+' thắng'}</div><p>Tỉ số ${res.sc.A} – ${res.sc.B}</p>${d!==undefined?`<span class="chip">ELO ${d>=0?'+':''}${d} → ${p.elo}</span>`:''}<p class="small muted">Chờ trọng tài mở trận tiếp…</p></div>`; }
  else if(g.q){ const q=g.q, rev=g.ph==='rev'; const mine=mySeat&&g.lock&&g.lock[mySeat]; const picked=ON.myAns[ON.code+':'+g.qi];
    const team=t=>Object.keys(seats).filter(s=>s[0]===t).map(s=>`<span class="seat ${g.lock&&g.lock[s]?(g.lock[s]==='ok'?'ok':'x'):''}">${esc(seats[s].e)} ${esc(seats[s].n)}</span>`).join('');
    body=`<div class="score"><div class="team A"><div class="pts">${g.sc.A}</div>${team('A')}</div><div class="vs">đến ${r.target}</div><div class="team B"><div class="pts">${g.sc.B}</div>${team('B')}</div></div>
     ${g.sud?'<div class="tag l3">⚡ Câu hỏi phụ</div>':''}<div class="timer"><i id="gbar" style="width:100%"></i></div>
     <div class="small muted">Câu ${g.qi+1} · ${chIc(q.ch)} ${chName(q.ch)} · <span class="tag ${q.lv>1?'l'+q.lv:''}">${(LEVELS[q.lv]||LEVELS[1]).tag}</span></div><div class="qbox">${esc(q.t)}</div>
     <div class="opts">${q.o.map((o,i)=>`<button class="opt ${rev&&i===g.ans?'ok':''} ${!rev&&picked===i?(mine==='x'?'bad':''):''} ${rev&&picked===i&&i!==g.ans?'bad':''}" data-c="${i}" ${(!mySeat||mine||rev||picked!==undefined)?'disabled':''}><b class="k">${'ABCD'[i]}</b><span>${esc(o)}</span></button>`).join('')}</div>
     ${rev?`<div class="ex">${g.win?`✅ ${esc(seats[g.win].e+' '+seats[g.win].n)} đúng trước!`:'Không ai đúng.'} Đáp án <b>${'ABCD'[g.ans]}</b>. ${esc(g.ex)}</div>`:''}
     ${!mySeat?'<p class="small muted">Bạn đang xem (không có ghế trong trận này).</p>':''}`;
    if(!rev&&g.rem){ const dl=Date.now()+g.rem, lim=g.lim||g.rem; clearInterval(GTIMER); GTIMER=setInterval(()=>{ const b=document.getElementById('gbar'); if(!b){clearInterval(GTIMER);return;} b.style.width=Math.max(0,(dl-Date.now())/lim*100)+'%'; },100); } }
  v.innerHTML=`<div class="card">${head}<div style="margin-top:12px">${body}</div></div><p class="small muted">Mẹo: bấm phím 1 2 3 4 để chọn nhanh.</p>`;
  $('#gl').onclick=()=>{ onlineLeave(); viewOnline(v); };
  const send=c=>{ if(!g||!g.q||g.ph!=='q'||!mySeat) return; const k=ON.code+':'+g.qi; if(ON.myAns[k]!==undefined) return; ON.myAns[k]=c;
    roomRef(ON.code).child(`a/${g.qi}/${mySeat}`).set({c,u:FBUID}); guestView(v); };
  $$('[data-c]',v).forEach(b=>b.onclick=()=>send(+b.dataset.c));
  if(!ON.keyBound){ ON.keyBound=true; const kh=e=>{ if(TAB!=='online'||ON.role!=='guest') return; if('1234'.includes(e.key)){ const gg=ON.room&&ON.room.g; if(gg) { const btn=$$('[data-c]')[+e.key-1]; if(btn&&!btn.disabled) btn.click(); } } };
    document.addEventListener('keydown',kh); ON.offs.push(()=>document.removeEventListener('keydown',kh)); }
}
