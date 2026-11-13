// ===================== GIẢI ĐẤU NHIỀU NGÀY =====================
// Vòng bảng đấu vòng tròn (mỗi người tối đa 1 trận/ngày) → Bán kết chéo (Nhất A – Nhì B, Nhất B – Nhì A) → Chung kết + Tranh hạng 3.
// Thắng 3 điểm, hoà 1, thua 0. Xếp hạng: Điểm → Hiệu số → Đối đầu (bảng phụ giữa các bạn bằng điểm) → Tổng điểm ghi → Bốc thăm.
let TV={id:null,view:'sched'};
function curTour(){ return DB.tours.find(t=>t.id===TV.id)||null; }
function roundRobin(ids){ // phương pháp xoay vòng; trả về [[ [a,b], ...], ...] theo từng lượt
  const a=[...ids]; if(a.length%2) a.push(null); const n=a.length, rounds=[];
  for(let r=0;r<n-1;r++){ const pr=[]; for(let i=0;i<n/2;i++){ const x=a[i], y=a[n-1-i]; if(x!==null&&y!==null) pr.push(r%2?[y,x]:[x,y]); else pr.push([x??y,null]); }
    rounds.push(pr); a.splice(1,0,a.pop()); }
  return rounds;
}
function createTour(name,players,split,target,f,ex){
  const ps=players.map((p,i)=>Object.assign({i},p));
  let order=split==='elo'?[...ps].sort((a,b)=>(b.elo||1000)-(a.elo||1000)):shuffle(ps);
  const one=ps.length<6; const groups={A:[],B:[]};
  if(one) groups.A=order.map(p=>p.i);
  else order.forEach((p,k)=>{ const g=(Math.floor(k/2)%2===0)?(k%2?'B':'A'):(k%2?'A':'B'); groups[g].push(p.i); }); // chia rắn
  const matches=[]; let mid=0;
  for(const g of ['A','B']){ if(!groups[g].length) continue; roundRobin(groups[g]).forEach((rd,r)=>rd.forEach(([x,y])=>{ matches.push(y===null?{id:mid++,st:'G',g,day:r+1,p1:x,p2:null,bye:true}:{id:mid++,st:'G',g,day:r+1,p1:x,p2:y,s1:null,s2:null}); })); }
  const t=Object.assign({id:uid(),name:name||'Giải KHTN 7',created:Date.now(),players:ps,groups,one,target,filter:f,matches,seed:Math.random()},ex||{});
  DB.tours.push(t); save(); return t;
}
function standings(t,g){
  const ids=t.groups[g]; const rows={}; ids.forEach(i=>rows[i]={i,P:0,W:0,D:0,L:0,F:0,A:0,pts:0});
  const gm=t.matches.filter(m=>m.st==='G'&&m.g===g&&!m.bye&&m.s1!=null);
  gm.forEach(m=>{ const a=rows[m.p1], b=rows[m.p2]; a.P++; b.P++; a.F+=m.s1; a.A+=m.s2; b.F+=m.s2; b.A+=m.s1;
    if(m.s1>m.s2){a.W++;b.L++;a.pts+=3;} else if(m.s1<m.s2){b.W++;a.L++;b.pts+=3;} else {a.D++;b.D++;a.pts++;b.pts++;} });
  const lot=i=>{ const x=Math.sin((t.seed*1000+i)*9301)*10000; return x-Math.floor(x); };
  const h2h=(set)=>{ const mini={}; set.forEach(i=>mini[i]={pts:0,gd:0}); gm.forEach(m=>{ if(set.includes(m.p1)&&set.includes(m.p2)){ const d=m.s1-m.s2; mini[m.p1].gd+=d; mini[m.p2].gd-=d; if(d>0)mini[m.p1].pts+=3; else if(d<0)mini[m.p2].pts+=3; else {mini[m.p1].pts++;mini[m.p2].pts++;} } }); return mini; };
  let arr=Object.values(rows).sort((a,b)=>b.pts-a.pts||(b.F-b.A)-(a.F-a.A));
  // tách nhóm bằng điểm & hiệu số → xét đối đầu, điểm ghi, bốc thăm
  const out=[]; let k=0;
  while(k<arr.length){ let j=k; while(j<arr.length&&arr[j].pts===arr[k].pts&&(arr[j].F-arr[j].A)===(arr[k].F-arr[k].A)) j++;
    const grp=arr.slice(k,j); if(grp.length>1){ const mini=h2h(grp.map(r=>r.i)); grp.sort((a,b)=>mini[b.i].pts-mini[a.i].pts||mini[b.i].gd-mini[a.i].gd||b.F-a.F||lot(b.i)-lot(a.i)); grp.forEach(r=>r.tb=true); }
    out.push(...grp); k=j; }
  return out;
}
function pName(t,i){ const p=t.players[i]; return p?`${p.emo||'🙂'} ${esc(p.name)}`:'?'; }
function groupDone(t){ return t.matches.filter(m=>m.st==='G'&&!m.bye).every(m=>m.s1!=null); }
function advance(t){ // tạo vòng loại trực tiếp khi đủ điều kiện
  const lastDay=Math.max(...t.matches.map(m=>m.day));
  if(groupDone(t)&&!t.matches.some(m=>m.st!=='G')){
    if(t.one){ const s=standings(t,'A'); if(s.length<4){ t.matches.push({id:t.matches.length,st:'F',day:lastDay+1,p1:s[0].i,p2:s[1].i,s1:null,s2:null}); }
      else { t.matches.push({id:t.matches.length,st:'F',day:lastDay+1,p1:s[0].i,p2:s[1].i,s1:null,s2:null}); t.matches.push({id:t.matches.length,st:'3P',day:lastDay+1,p1:s[2].i,p2:s[3].i,s1:null,s2:null}); } }
    else { const A=standings(t,'A'), B=standings(t,'B'); t.matches.push({id:t.matches.length,st:'SF',sf:1,day:lastDay+1,p1:A[0].i,p2:B[1].i,s1:null,s2:null}); t.matches.push({id:t.matches.length,st:'SF',sf:2,day:lastDay+1,p1:B[0].i,p2:A[1].i,s1:null,s2:null}); }
    save(); return; }
  const sf=t.matches.filter(m=>m.st==='SF');
  if(sf.length===2&&sf.every(m=>m.s1!=null)&&!t.matches.some(m=>m.st==='F')){
    const w=m=>m.s1>m.s2?m.p1:m.p2, l=m=>m.s1>m.s2?m.p2:m.p1;
    t.matches.push({id:t.matches.length,st:'F',day:lastDay+1,p1:w(sf[0]),p2:w(sf[1]),s1:null,s2:null});
    t.matches.push({id:t.matches.length,st:'3P',day:lastDay+1,p1:l(sf[0]),p2:l(sf[1]),s1:null,s2:null}); save(); }
}
const STN={G:'Vòng bảng',SF:'Bán kết',F:'🏆 Chung kết','3P':'🥉 Tranh hạng 3'};

function viewTour(v){
  if(AM&&AM.phase!=='end'&&TV.playing){ AM.upd(); return; }
  const t=curTour();
  if(!t) return tourList(v);
  advance(t);
  const days=[...new Set(t.matches.map(m=>m.day))].sort((a,b)=>a-b);
  const R=syncAwards(t); const champ=R?awardsHTML(t,R):''; const F=0, P3=0;
  const champOld=F?`<div class="champ" style="margin-bottom:14px"><div class="big">🏆 ${pName(t,F.s1>F.s2?F.p1:F.p2)}</div><p>Vô địch ${esc(t.name)}</p><div class="row" style="justify-content:center"><span class="chip">🥈 ${pName(t,F.s1>F.s2?F.p2:F.p1)}</span>${P3?`<span class="chip">🥉 ${pName(t,P3.s1>P3.s2?P3.p1:P3.p2)}</span>`:''}</div></div>`:'';
  const table=g=>{ const s=standings(t,g); return `<div class="card"><h3>${t.one?'Bảng xếp hạng':'Bảng '+g}</h3><div style="overflow-x:auto"><table><tr><th>#</th><th class="l">Người chơi</th><th>Tr</th><th>T</th><th>H</th><th>B</th><th>Ghi</th><th>Mất</th><th>HS</th><th>Điểm</th></tr>
    ${s.map((r,k)=>`<tr class="${k<(t.one?2:2)?'q1':''}"><td>${k+1}</td><td class="l">${pName(t,r.i)}${r.tb?' <span class="small muted" title="Xếp theo đối đầu / điểm ghi / bốc thăm">*</span>':''}</td><td>${r.P}</td><td>${r.W}</td><td>${r.D}</td><td>${r.L}</td><td>${r.F}</td><td>${r.A}</td><td>${r.F-r.A>0?'+':''}${r.F-r.A}</td><td><b>${r.pts}</b></td></tr>`).join('')}</table></div>
    <p class="small muted" style="margin:6px 0 0">Tô xanh: vào vòng sau. * bằng điểm và hiệu số, xếp theo đối đầu → điểm ghi → bốc thăm.</p></div>`; };
  v.innerHTML=`<div class="card"><div class="row between"><div><h2 style="margin:0">🏆 ${esc(t.name)}</h2><div class="small muted">${t.players.length} người · ${t.one?'1 bảng':'2 bảng'} · mỗi trận đấu đến ${t.target} điểm · ${days.length} ngày thi đấu</div>${(t.prizes&&(t.prizes[1]||t.prizes[2]||t.prizes[3]))?`<div class="small" style="margin-top:4px">🎁 ${[1,2,3].filter(r=>t.prizes[r]).map(r=>PLACE[r].ic+' '+esc(t.prizes[r])).join(' · ')}</div>`:''}</div>
    <div class="row"><button class="btn sm ghost" id="tback">← Các giải</button><button class="btn sm" id="tcopy">📋 Sao chép bảng</button><button class="btn sm" id="texp">💾 Sao lưu</button></div></div>
    <div class="row" style="margin-top:10px">${[['sched','📅 Lịch theo ngày'],['table','📊 Bảng xếp hạng'],['rules','📜 Điều lệ']].map(([k,n])=>`<span class="tog ${TV.view===k?'on':''}" data-v="${k}">${n}</span>`).join('')}</div></div>
   ${champ}
   ${TV.view==='table'?(table('A')+(t.one?'':table('B'))):TV.view==='rules'?tourRules(t):
     days.map(d=>{ const ms=t.matches.filter(m=>m.day===d); const st=[...new Set(ms.map(m=>m.st))].map(x=>STN[x]).join(', ');
      return `<div class="daycard card"><div class="row between"><b>Ngày ${d}</b><span class="small muted">${st}</span></div>${ms.map(m=>{
        if(m.bye) return `<div class="mrow small muted"><span>${t.one?'':'Bảng '+m.g+' · '}${pName(t,m.p1)} nghỉ</span></div>`;
        const done=m.s1!=null; return `<div class="mrow"><span class="small muted" style="min-width:90px">${m.st==='G'?(t.one?'Vòng bảng':'Bảng '+m.g):STN[m.st]}</span><span style="flex:1;text-align:right">${pName(t,m.p1)}</span>
          <span class="res">${done?`${m.s1} – ${m.s2}`:'vs'}</span><span style="flex:1">${pName(t,m.p2)}</span>
          <span class="row">${done?`<button class="btn sm ghost" data-ed="${m.id}">✏️</button>`:`<button class="btn sm pri" data-play="${m.id}">▶ Đấu</button><button class="btn sm ghost" data-ed="${m.id}">✍ Nhập</button>`}</span></div>`; }).join('')}</div>`; }).join('')}`;
  $('#tback').onclick=()=>{ TV.id=null; viewTour(v); };
  $$('[data-v]',v).forEach(b=>b.onclick=()=>{ TV.view=b.dataset.v; viewTour(v); });
  $('#tcopy').onclick=()=>copyText(tourText(t),'Đã sao chép bảng xếp hạng, dán vào Zalo được ngay');
  $('#texp').onclick=()=>copyText(JSON.stringify({khtn7:'tour',v:1,tour:t}),'Đã sao chép dữ liệu giải. Dán vào Notepad để lưu.');
  $$('[data-ed]',v).forEach(b=>b.onclick=()=>editResult(t,t.matches.find(m=>m.id===+b.dataset.ed),v));
  $$('[data-play]',v).forEach(b=>b.onclick=()=>playTourMatch(t,t.matches.find(m=>m.id===+b.dataset.play),v));
  if(R) bindAwards(v,t,R);
}
function tourRules(t){ const pz=t.prizes||{}; return `<div class="card"><h3>Điều lệ</h3><ul>
  ${reqText(t)?`<li>Điều kiện tham gia: ${reqText(t)}.</li>`:''}
  ${(pz[1]||pz[2]||pz[3])?`<li>Giải thưởng: ${[1,2,3].filter(r=>pz[r]).map(r=>`${PLACE[r].ic} ${PLACE[r].s}: ${esc(pz[r])}`).join('; ')}.</li>`:''}
  <li>Danh hiệu phụ: ⚡ Vua tốc độ (trả lời đúng nhanh nhất, tính các trận đấu bằng ▶ Đấu), 🎯 Tay ghi điểm (ghi nhiều điểm nhất), 🛡️ Bất bại (không thua trận nào). Vô địch, á quân, hạng Ba và danh hiệu được giấy khen và huy chương lưu vào hồ sơ.</li>
  <li>${t.one?'Một bảng, mọi người đấu vòng tròn với nhau.':'Chia 2 bảng theo kiểu rắn (cân bằng trình độ). Trong bảng đấu vòng tròn.'} Mỗi người tối đa 1 trận mỗi ngày.</li>
  <li>Mỗi trận: cùng một câu hỏi, ai trả lời đúng trước được 1 điểm; ai đủ <b>${t.target} điểm</b> trước thì thắng. Nếu hết ${t.target*2+6} câu mà chưa ai đủ điểm, vòng bảng tính <b>hoà</b>; vòng loại trực tiếp đấu tiếp <b>câu hỏi phụ</b> đến khi có người dẫn trước.</li>
  <li>Tính điểm: thắng 3, hoà 1, thua 0.</li>
  <li>Xếp hạng: Điểm → Hiệu số (điểm ghi − điểm mất) → Đối đầu giữa các bạn bằng điểm → Tổng điểm ghi → Bốc thăm.</li>
  <li>${t.one?(t.players.length>=4?'Hạng 1 gặp hạng 2 ở Chung kết; hạng 3 gặp hạng 4 tranh hạng Ba.':'Hạng 1 gặp hạng 2 ở Chung kết.'):'Bán kết chéo: Nhất A – Nhì B, Nhất B – Nhì A. Thắng vào Chung kết, thua tranh hạng Ba.'}</li>
  <li>Trận đấu trên máy khác (online hay trên giấy) thì trọng tài bấm <b>✍ Nhập</b> để ghi tỉ số.</li></ul></div>`; }
function tourText(t){ let s=`🏆 ${t.name}\n`; for(const g of (t.one?['A']:['A','B'])){ s+=`\n${t.one?'BẢNG XẾP HẠNG':'BẢNG '+g}\n`; standings(t,g).forEach((r,k)=>{ const p=t.players[r.i]; s+=`${k+1}. ${p.emo||''} ${p.name} – ${r.pts}đ (T${r.W} H${r.D} B${r.L}, HS ${r.F-r.A>=0?'+':''}${r.F-r.A})\n`; }); }
  const R=tourResults(t); if(R&&R.titles.length) s+='\nDanh hiệu: '+R.titles.map(x=>`${TITLES[x.k].ic} ${TITLES[x.k].n}: ${t.players[x.i].name}`).join('; ')+'\n';
  t.matches.filter(m=>m.st!=='G').forEach(m=>{ s+=`\n${STN[m.st].replace(/^(🏆|🥉) /u,'')}: ${t.players[m.p1].name} ${m.s1!=null?m.s1+' – '+m.s2:'vs'} ${t.players[m.p2].name}`; }); return s; }
function editResult(t,m,v){
  const ko=m.st!=='G';
  const md=modal(`<h3>Nhập kết quả</h3><p class="small muted">${STN[m.st]} · Ngày ${m.day}${ko?' · vòng loại trực tiếp không được hoà':''}</p>
   <div class="grid g2"><div><label class="f">${pName(t,m.p1)}</label><input type="number" id="r1" min="0" value="${m.s1??''}"></div><div><label class="f">${pName(t,m.p2)}</label><input type="number" id="r2" min="0" value="${m.s2??''}"></div></div>
   <div class="row" style="justify-content:space-between;margin-top:14px">${m.s1!=null?'<button class="btn ghost" data-clr>Xoá kết quả</button>':'<span></span>'}<div class="row"><button class="btn ghost" data-x>Huỷ</button><button class="btn pri" data-y>Lưu</button></div></div>`);
  $('[data-x]',md).onclick=()=>md.remove();
  const clr=$('[data-clr]',md); if(clr) clr.onclick=()=>{ if(laterKO(t,m)){ toast('Đã có vòng sau, không xoá được'); return; } m.s1=m.s2=null; save(); md.remove(); viewTour(v); };
  $('[data-y]',md).onclick=()=>{ const a=parseInt($('#r1',md).value), b=parseInt($('#r2',md).value); if(isNaN(a)||isNaN(b)||a<0||b<0){ toast('Nhập tỉ số hợp lệ'); return; } if(ko&&a===b){ toast('Vòng loại trực tiếp phải có người thắng'); return; }
    if(m.s1!=null&&laterKO(t,m)&&((m.s1>m.s2)!==(a>b))){ toast('Đổi người thắng sẽ làm sai vòng sau. Xoá vòng sau trước.'); return; }
    m.s1=a; m.s2=b; save(); md.remove(); viewTour(v); };
}
function laterKO(t,m){ const order={G:0,SF:1,F:2,'3P':2}; return t.matches.some(x=>order[x.st]>order[m.st]); }
function playTourMatch(t,m,v){
  const prof=i=>{ const p=t.players[i]; let pr=p.pid&&DB.profiles.find(x=>x.id===p.pid); if(!pr){ pr=DB.profiles.find(x=>x.name===p.name); }
    if(!pr){ pr=newProfile(p.name,p.emo); } p.pid=pr.id; p.emo=pr.emo; return 'p:'+pr.id; };
  const vals={A1:prof(m.p1),B1:prof(m.p2)}; save(); TV.playing=true;
  const ok=startLocalMatch(v,vals,{target:t.target,filter:t.filter,noDraw:m.st!=='G',endButtons:`<button class="btn pri" id="tret">Lưu & về lịch thi đấu</button>`,onQuit:()=>{TV.playing=false;viewTour(v);}},
    mm=>{ m.s1=mm.score.A; m.s2=mm.score.B; const sp={1:[0,0],2:[0,0]}; mm.history.forEach(h=>{ [['A1',1],['B1',2]].forEach(([s,k])=>{ const a=h.ans[s]; if(a&&a.ok&&h.t0){ sp[k][0]+=a.t-h.t0; sp[k][1]++; } }); }); m.sp=sp; save(); setTimeout(()=>{ const b=$('#tret',v); if(b) b.onclick=()=>{ TV.playing=false; AM=null; viewTour(v); }; },0); });
  if(!ok) TV.playing=false;
}
function tourList(v){
  const NT={name:'',split:'elo',target:5,f:{chs:[],lvs:[],mine:'all'}};
  v.innerHTML=`<div class="card"><h2>🏆 Giải đấu nhiều ngày</h2><p class="small muted" style="margin:0">Cho cả lớp hoặc nhóm 4–12 bạn: chia 2 bảng đấu vòng tròn, mỗi bạn tối đa 1 trận mỗi ngày, rồi bán kết chéo, chung kết và tranh hạng 3. Dưới 6 bạn thì đấu 1 bảng.</p></div>
  ${DB.tours.length?`<div class="card"><h3>Các giải đã tạo</h3>${DB.tours.slice().reverse().map(t=>{ const done=t.matches.filter(m=>!m.bye&&m.s1!=null).length, all=t.matches.filter(m=>!m.bye).length; const F=t.matches.find(m=>m.st==='F'&&m.s1!=null);
    return `<div class="mrow"><div><b>${esc(t.name)}</b><div class="small muted">${t.players.length} người · ${new Date(t.created).toLocaleDateString('vi-VN')} · ${F?'🏆 '+pName(t,F.s1>F.s2?F.p1:F.p2):`đã đấu ${done}/${all} trận`}</div></div><div class="row"><button class="btn sm pri" data-open="${t.id}">Mở</button><button class="btn sm ghost" data-del="${t.id}">🗑</button></div></div>`; }).join('')}</div>`:''}
  ${hallHTML()}
  <div class="card"><h3>＋ Tạo giải mới</h3>
   <label class="f">Tên giải</label><input type="text" id="tn" placeholder="Ví dụ: Giải KHTN 7A – Học kì I" maxlength="50">
   <label class="f">Người chơi – chọn hồ sơ trên máy này</label><div class="row" id="tpf">${DB.profiles.filter(p=>!p.role||p.role==='hs').map(p=>`<span class="tog" data-pid="${p.id}">${p.emo} ${esc(p.name)} <span class="small muted" data-elig="${p.id}"></span></span>`).join('')||'<span class="small muted">Chưa có hồ sơ</span>'}</div>
   <label class="f">…và/hoặc gõ thêm tên (mỗi dòng một bạn)</label><textarea id="tnames" placeholder="Na\nBin\nTôm"></textarea>
   <div class="row" style="margin-top:8px"><label class="small">Chia bảng <select id="tsp"><option value="elo">Theo ELO (cân bằng)</option><option value="rand">Ngẫu nhiên</option></select></label>
    <label class="small">Mỗi trận đến <select id="ttg">${[3,5,7,10].map(n=>`<option ${n===5?'selected':''}>${n}</option>`).join('')}</select> điểm</label></div>
   ${filterUI('tf',NT.f)}
   <div class="card" style="margin:12px 0 0;background:var(--bg2,#f6faf7)"><h3 style="margin-top:0">🎟 Điều kiện tham gia</h3>
    <div class="row"><label class="small">ELO tối thiểu <input type="number" id="treq" min="0" step="50" value="0" style="width:90px"></label>
     <label class="small">Số câu luyện tập đúng tối thiểu <input type="number" id="treqok" min="0" step="5" value="0" style="width:90px"></label></div>
    <p class="small muted" style="margin:6px 0 0">Để 0 là không giới hạn. ELO tăng khi luyện tập (📚 Luyện tập, 📝 Thi thử, 🧮 Bài tính): làm đúng câu khó được cộng nhiều hơn, sai thì bị trừ. Số câu đúng chỉ tính câu luyện tập thuộc các chương đã chọn ở bộ lọc trên (không chọn chương = mọi chương). Bạn chưa đủ điều kiện sẽ hiện ❌ và không vào giải được.</p></div>
   <div class="card" style="margin:12px 0 0;background:var(--bg2,#f6faf7)"><h3 style="margin-top:0">🎁 Giải thưởng</h3>
    <div class="grid g3">${[1,2,3].map(r=>`<label class="small">${PLACE[r].ic} ${PLACE[r].s}<input type="text" id="tpz${r}" maxlength="60" placeholder="${['','Ví dụ: 100.000đ + sách','Ví dụ: 50.000đ','Ví dụ: bộ bút'][r]}"></label>`).join('')}</div>
    <label class="small" style="display:block;margin-top:8px">Người ký giấy khen <input type="text" id="tsig" maxlength="30" value="Chú Cường" style="width:200px"></label>
    <p class="small muted" style="margin:6px 0 0">Kết thúc giải: Vô địch, Á quân, Hạng Ba và các danh hiệu ⚡ Vua tốc độ, 🎯 Tay ghi điểm, 🛡️ Bất bại được giấy khen (tải ảnh) và huy chương lưu vào hồ sơ.</p></div>
   <div class="row" style="justify-content:space-between;margin-top:14px"><label class="btn ghost sm">📥 Mở giải đã sao lưu<input type="file" id="tfile" accept=".json,.txt" class="hide"></label><button class="btn ghost sm" id="tpaste">📋 Dán dữ liệu giải</button><button class="btn pri" id="tmk">Tạo giải & xếp lịch</button></div></div>`;
  const sel=new Set(); $$('[data-pid]',v).forEach(b=>b.onclick=()=>{ const id=b.dataset.pid; sel.has(id)?sel.delete(id):sel.add(id); b.classList.toggle('on'); });
  const reqNow=()=>({elo:Math.max(0,+$('#treq').value||0),ok:Math.max(0,+$('#treqok').value||0)});
  const chsNow=()=>NT.f.chs&&NT.f.chs.length?NT.f.chs:null;
  const showElig=()=>{ const r=reqNow(); DB.profiles.forEach(p=>{ const e=$(`[data-elig="${p.id}"]`,v); if(!e) return; const el=eligible(p,r,chsNow());
    e.textContent=(r.elo||r.ok)?(el.ok?'✅':'❌ '+el.why.join(', ')):`ELO ${p.elo}`; }); };
  bindFilter('tf',NT.f,showElig); $('#treq').oninput=showElig; $('#treqok').oninput=showElig; showElig();
  $$('[data-open]',v).forEach(b=>b.onclick=()=>{ TV.id=b.dataset.open; TV.view='sched'; viewTour(v); });
  $$('[data-del]',v).forEach(b=>b.onclick=()=>confirmBox('Xoá giải này?',()=>{ DB.tours=DB.tours.filter(t=>t.id!==b.dataset.del); save(); viewTour(v); }));
  $('#tmk').onclick=()=>{ const ps=[...sel].map(id=>{ const p=DB.profiles.find(x=>x.id===id); return {name:p.name,emo:p.emo,elo:p.elo,pid:p.id}; });
    $('#tnames').value.split('\n').map(s=>s.trim()).filter(Boolean).forEach(n=>{ if(ps.some(p=>p.name.toLowerCase()===n.toLowerCase())) return; const pr=DB.profiles.find(x=>x.name.toLowerCase()===n.toLowerCase()); ps.push(pr?{name:pr.name,emo:pr.emo,elo:pr.elo,pid:pr.id}:{name:n.slice(0,16),emo:pick(EMOS),elo:1000}); });
    const rq=reqNow(); if(rq.elo||rq.ok){ const bad=ps.map(x=>({x,e:eligible(x.pid?DB.profiles.find(p=>p.id===x.pid):DB.profiles.find(p=>p.name.toLowerCase()===x.name.toLowerCase()),rq,chsNow())})).filter(o=>!o.e.ok);
      if(bad.length){ modal(`<h3>❌ Chưa đủ điều kiện tham gia</h3><p class="small muted">Yêu cầu: ${rq.elo?'ELO ≥ '+rq.elo:''}${rq.elo&&rq.ok?' và ':''}${rq.ok?'luyện đúng ≥ '+rq.ok+' câu':''}</p>${bad.map(o=>`<div class="mrow"><b>${esc(o.x.emo||'')} ${esc(o.x.name)}</b><span class="small">${o.e.why.join(', ')}</span></div>`).join('')}<p class="small">Các bạn này cần vào <b>📚 Luyện tập</b> thêm rồi mới đăng ký được. Bỏ chọn các bạn này, hoặc hạ điều kiện.</p><div class="row" style="justify-content:flex-end"><button class="btn pri" data-x>Đã hiểu</button></div>`).querySelector('[data-x]').onclick=e=>e.target.closest('.modal').remove(); return; } }
    if(ps.length<3){ toast('Cần ít nhất 3 người chơi'); return; } if(ps.length>12){ toast('Tối đa 12 người'); return; }
    const t=createTour($('#tn').value.trim(),ps,$('#tsp').value,+$('#ttg').value,NT.f,{req:rq,prizes:{1:$('#tpz1').value.trim(),2:$('#tpz2').value.trim(),3:$('#tpz3').value.trim()},signer:$('#tsig').value.trim()||'Chú Cường'}); TV.id=t.id; TV.view='sched'; viewTour(v); };
  const imp=txt=>{ try{ const o=JSON.parse(txt); const t=o.tour||o; if(!t.matches||!t.players) throw 0; t.id=uid(); DB.tours.push(t); save(); TV.id=t.id; viewTour(v); toast('Đã mở giải'); }catch(e){ toast('Dữ liệu giải không đúng'); } };
  $('#tfile').onchange=e=>{ const f=e.target.files[0]; if(f) f.text().then(imp); };
  $('#tpaste').onclick=()=>{ const m=modal(`<h3>Dán dữ liệu giải</h3><textarea id="ti" style="min-height:150px"></textarea><div class="row" style="justify-content:flex-end;margin-top:8px"><button class="btn ghost" data-x>Huỷ</button><button class="btn pri" data-y>Mở</button></div>`); $('[data-x]',m).onclick=()=>m.remove(); $('[data-y]',m).onclick=()=>{ const x=$('#ti',m).value; m.remove(); imp(x); }; };
}
