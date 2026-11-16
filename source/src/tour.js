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

function viewTour(v){ if(!TV.playing) musicStop();
  if(AM&&AM.phase!=='end'&&TV.playing){ AM.upd(); return; }
  const t=curTour();
  if(!t) return tourList(v);
  advance(t);
  const days=[...new Set(t.matches.map(m=>m.day))].sort((a,b)=>a-b);
  const R=syncAwards(t); const champ=R?awardsHTML(t,R):'';
  if(R&&!t.cel){ t.cel=1; save(); const c=t.players[R.places[0].i]; setTimeout(()=>celebrate(`Chúc mừng ${t.mode==='doi'?'đội '+c.name.replace('&','và'):c.name} đã giành chức vô địch ${t.name}!`,true),300); }
  if(!R&&t.cel){ delete t.cel; save(); } const F=0, P3=0;
  const champOld=F?`<div class="champ" style="margin-bottom:14px"><div class="big">🏆 ${pName(t,F.s1>F.s2?F.p1:F.p2)}</div><p>Vô địch ${esc(t.name)}</p><div class="row" style="justify-content:center"><span class="chip">🥈 ${pName(t,F.s1>F.s2?F.p2:F.p1)}</span>${P3?`<span class="chip">🥉 ${pName(t,P3.s1>P3.s2?P3.p1:P3.p2)}</span>`:''}</div></div>`:'';
  const table=g=>{ const s=standings(t,g); return `<div class="card"><h3>${t.one?'Bảng xếp hạng':'Bảng '+g}</h3><div style="overflow-x:auto"><table><tr><th>#</th><th class="l">Người chơi</th><th>Tr</th><th>T</th><th>H</th><th>B</th><th>Ghi</th><th>Mất</th><th>HS</th><th>Điểm</th></tr>
    ${s.map((r,k)=>`<tr class="${k<(t.one?2:2)?'q1':''}"><td>${k+1}</td><td class="l">${pName(t,r.i)}${r.tb?' <span class="small muted" title="Xếp theo đối đầu / điểm ghi / bốc thăm">*</span>':''}</td><td>${r.P}</td><td>${r.W}</td><td>${r.D}</td><td>${r.L}</td><td>${r.F}</td><td>${r.A}</td><td>${r.F-r.A>0?'+':''}${r.F-r.A}</td><td><b>${r.pts}</b></td></tr>`).join('')}</table></div>
    <p class="small muted" style="margin:6px 0 0">Tô xanh: vào vòng sau. * bằng điểm và hiệu số, xếp theo đối đầu → điểm ghi → bốc thăm.</p></div>`; };
  v.innerHTML=`<div class="card"><div class="row between"><div><h2 style="margin:0">🏆 ${esc(t.name)}</h2><div class="small muted">${t.mode==='doi'?`👥 Giải Đôi · ${t.players.length} đội (${t.players.length*2} bạn)`:t.players.length+' người'} · ${t.one?'1 bảng':'2 bảng'} · mỗi trận đấu đến ${t.target} điểm · ${days.length} ngày thi đấu</div>${(t.prizes&&(t.prizes[1]||t.prizes[2]||t.prizes[3]))?`<div class="small" style="margin-top:4px">🎁 ${[1,2,3].filter(r=>t.prizes[r]).map(r=>PLACE[r].ic+' '+esc(t.prizes[r])).join(' · ')}</div>`:''}</div>
    <div class="row"><button class="btn sm ghost" id="tback">← Các giải</button><button class="btn sm" id="tcopy">📋 Sao chép bảng</button><button class="btn sm" id="texp">💾 Sao lưu</button><button class="btn sm ${t.ref?'':'ghost'}" id="tref">🧑‍⚖️ ${t.ref?(TV.ref===t.id?'🔓 ':'🔒 ')+esc(t.ref.name):'Trọng tài'}</button></div></div>
    <div class="row" style="margin-top:10px">${[['sched','📅 Lịch theo ngày'],['table','📊 Bảng xếp hạng'],['rules','📜 Điều lệ']].map(([k,n])=>`<span class="tog ${TV.view===k?'on':''}" data-v="${k}">${n}</span>`).join('')}</div></div>
   ${champ}
   ${TV.view==='table'?(table('A')+(t.one?'':table('B'))):TV.view==='rules'?tourRules(t):
     days.map(d=>{ const ms=t.matches.filter(m=>m.day===d); const st=[...new Set(ms.map(m=>m.st))].map(x=>STN[x]).join(', ');
      return `<div class="daycard card"><div class="row between"><b>Ngày ${d}</b><span class="small muted">${st}</span></div>${ms.map(m=>{
        if(m.bye) return `<div class="mrow small muted"><span>${t.one?'':'Bảng '+m.g+' · '}${pName(t,m.p1)} nghỉ</span></div>`;
        const done=m.s1!=null; return `<div class="mrow"><span class="small muted" style="min-width:90px">${m.st==='G'?(t.one?'Vòng bảng':'Bảng '+m.g):STN[m.st]}</span><span style="flex:1;text-align:right">${pName(t,m.p1)}</span>
          <span class="res">${done?`${m.s1} – ${m.s2}`:'vs'}${m.wo?`<div class="small muted" style="font-weight:400">xử thua: ${esc(t.players[m.wo===1?m.p1:m.p2].name)} vắng</div>`:''}</span><span style="flex:1">${pName(t,m.p2)}</span>
          <span class="row">${done?`<button class="btn sm ghost" data-ed="${m.id}">✏️</button>`:`<button class="btn sm pri" data-play="${m.id}">▶ Đấu</button><button class="btn sm ghost" data-ed="${m.id}">✍ Nhập</button>`}</span></div>`; }).join('')}</div>`; }).join('')}`;
  $('#tback').onclick=()=>{ TV.id=null; TV.ref=null; viewTour(v); };
  $$('[data-v]',v).forEach(b=>b.onclick=()=>{ TV.view=b.dataset.v; viewTour(v); });
  $('#tcopy').onclick=()=>copyText(tourText(t),'Đã sao chép bảng xếp hạng, dán vào Zalo được ngay');
  $('#texp').onclick=()=>copyText(JSON.stringify({khtn7:'tour',v:1,tour:t}),'Đã sao chép dữ liệu giải. Dán vào Notepad để lưu.');
  $$('[data-ed]',v).forEach(b=>b.onclick=()=>refGate(t,()=>editResult(t,t.matches.find(m=>m.id===+b.dataset.ed),v)));
  $$('[data-play]',v).forEach(b=>b.onclick=()=>{ const go=()=>playTourMatch(t,t.matches.find(m=>m.id===+b.dataset.play),v); (t.ref&&t.ref.play)?refGate(t,go):go(); });
  $('#tref').onclick=()=>t.ref?refGate(t,()=>refSettings(t,v)):refSettings(t,v);
  if(R) bindAwards(v,t,R);
}
function tourRules(t){ const pz=t.prizes||{}; return `<div class="card"><h3>Điều lệ</h3><ul>
  ${t.ref?`<li>Trọng tài: <b>${esc(t.ref.name)}</b>. Chỉ trọng tài (có mã PIN) được nhập, sửa, xoá kết quả, xử thua vắng mặt và xoá giải${t.ref.play?'; trận ▶ Đấu cũng phải do trọng tài bấm bắt đầu':''}. Mọi thao tác của trọng tài được ghi vào nhật ký.</li>`:''}
  ${reqText(t)?`<li>Điều kiện tham gia: ${reqText(t)}.</li>`:''}
  ${(pz[1]||pz[2]||pz[3])?`<li>Giải thưởng: ${[1,2,3].filter(r=>pz[r]).map(r=>`${PLACE[r].ic} ${PLACE[r].s}: ${esc(pz[r])}`).join('; ')}.</li>`:''}
  <li>Danh hiệu phụ: ⚡ Vua tốc độ (trả lời đúng nhanh nhất, tính các trận đấu bằng ▶ Đấu), 🎯 Tay ghi điểm (ghi nhiều điểm nhất), 🛡️ Bất bại (không thua trận nào). Vô địch, á quân, hạng Ba và danh hiệu được giấy khen và huy chương lưu vào hồ sơ.</li>
  <li>${t.one?'Một bảng, mọi người đấu vòng tròn với nhau.':'Chia 2 bảng theo kiểu rắn (cân bằng trình độ). Trong bảng đấu vòng tròn.'} Mỗi người tối đa 1 trận mỗi ngày.</li>
  ${t.mode==='doi'?`<li>Giải Đôi: mỗi đội 2 bạn. Trong trận, 4 bạn cùng nhận một câu hỏi; bạn nào trong đội trả lời đúng trước thì đội được 1 điểm. Huy chương và giấy khen trao cho cả 2 bạn trong đội.</li>`:''}
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
   ${t.ref?`<div class="row" style="margin-top:10px"><span class="small muted">Xử thua vì vắng mặt:</span><button class="btn sm ghost" data-wo="1">${esc(t.players[m.p1].name)} vắng</button><button class="btn sm ghost" data-wo="2">${esc(t.players[m.p2].name)} vắng</button></div>`:''}
   <div class="row" style="justify-content:space-between;margin-top:14px">${m.s1!=null?'<button class="btn ghost" data-clr>Xoá kết quả</button>':'<span></span>'}<div class="row"><button class="btn ghost" data-x>Huỷ</button><button class="btn pri" data-y>Lưu</button></div></div>`);
  $('[data-x]',md).onclick=()=>md.remove();
  const lab=`${STN[m.st]} ngày ${m.day}: ${t.players[m.p1].name} – ${t.players[m.p2].name}`;
  const clr=$('[data-clr]',md); if(clr) clr.onclick=()=>{ if(laterKO(t,m)){ toast('Đã có vòng sau, không xoá được'); return; } refLog(t,`Xoá kết quả ${lab}`); m.s1=m.s2=null; delete m.wo; save(); md.remove(); viewTour(v); };
  $$('[data-wo]',md).forEach(b=>b.onclick=()=>{ const w=+b.dataset.wo; if(m.s1!=null&&laterKO(t,m)){ toast('Đã có vòng sau, xoá vòng sau trước'); return; }
    m.s1=w===1?0:t.target; m.s2=w===1?t.target:0; m.wo=w; delete m.sp; refLog(t,`Xử thua ${t.players[w===1?m.p1:m.p2].name} vắng mặt – ${lab} (${m.s1}–${m.s2})`); save(); md.remove(); viewTour(v); });
  $('[data-y]',md).onclick=()=>{ const a=parseInt($('#r1',md).value), b=parseInt($('#r2',md).value); if(isNaN(a)||isNaN(b)||a<0||b<0){ toast('Nhập tỉ số hợp lệ'); return; } if(ko&&a===b){ toast('Vòng loại trực tiếp phải có người thắng'); return; }
    if(m.s1!=null&&laterKO(t,m)&&((m.s1>m.s2)!==(a>b))){ toast('Đổi người thắng sẽ làm sai vòng sau. Xoá vòng sau trước.'); return; }
    if(t.ref) refLog(t,`${m.s1!=null?'Sửa':'Nhập'} kết quả ${lab}: ${a}–${b}${m.s1!=null?` (trước đó ${m.s1}–${m.s2})`:''}`);
    m.s1=a; m.s2=b; delete m.wo; save(); md.remove(); viewTour(v); };
}
function laterKO(t,m){ const order={G:0,SF:1,F:2,'3P':2}; return t.matches.some(x=>order[x.st]>order[m.st]); }
function playTourMatch(t,m,v){
  const prof=i=>{ const p=t.players[i]; let pr=p.pid&&DB.profiles.find(x=>x.id===p.pid); if(!pr){ pr=DB.profiles.find(x=>x.name===p.name); }
    if(!pr){ pr=newProfile(p.name,p.emo); } p.pid=pr.id; p.emo=pr.emo; return 'p:'+pr.id; };
  const profM=mb=>{ let pr=mb.pid&&DB.profiles.find(x=>x.id===mb.pid); if(!pr) pr=DB.profiles.find(x=>x.name===mb.name); if(!pr) pr=newProfile(mb.name,mb.emo); mb.pid=pr.id; mb.emo=pr.emo; return 'p:'+pr.id; };
  const doi=t.mode==='doi'; const P1=t.players[m.p1], P2=t.players[m.p2];
  const vals=doi?{A1:profM(P1.members[0]),A2:profM(P1.members[1]),B1:profM(P2.members[0]),B2:profM(P2.members[1])}:{A1:prof(m.p1),B1:prof(m.p2)}; save(); TV.playing=true;
  const ok=startLocalMatch(v,vals,{target:t.target,filter:t.filter,noDraw:m.st!=='G',endButtons:`<button class="btn pri" id="tret">Lưu & về lịch thi đấu</button>`,onQuit:()=>{TV.playing=false;viewTour(v);}},
    mm=>{ m.s1=mm.score.A; m.s2=mm.score.B; const sp={1:[0,0],2:[0,0]}; mm.history.forEach(h=>{ [['A1',1],['A2',1],['B1',2],['B2',2]].forEach(([s,k])=>{ const a=h.ans[s]; if(a&&a.ok&&h.t0){ sp[k][0]+=a.t-h.t0; sp[k][1]++; } }); }); m.sp=sp; save(); setTimeout(()=>{ const b=$('#tret',v); if(b) b.onclick=()=>{ TV.playing=false; AM=null; viewTour(v); }; },0); });
  if(!ok) TV.playing=false;
}
function tourList(v){
  const NT={name:'',split:'elo',target:5,f:{chs:[],lvs:[],mine:'all'}};
  v.innerHTML=`<div class="card"><h2>🏆 Giải đấu nhiều ngày</h2><p class="small muted" style="margin:0">Cho cả lớp hoặc nhóm 4–12 bạn: chia 2 bảng đấu vòng tròn, mỗi bạn tối đa 1 trận mỗi ngày, rồi bán kết chéo, chung kết và tranh hạng 3. Dưới 6 bạn (hoặc 6 đội) thì đấu 1 bảng. Có thể chọn <b>👥 Giải Đôi 2 vs 2</b>: 6–24 bạn ghép thành 3–12 đội.</p></div>
  ${DB.tours.length?`<div class="card"><h3>Các giải đã tạo</h3>${DB.tours.slice().reverse().map(t=>{ const done=t.matches.filter(m=>!m.bye&&m.s1!=null).length, all=t.matches.filter(m=>!m.bye).length; const F=t.matches.find(m=>m.st==='F'&&m.s1!=null);
    return `<div class="mrow"><div><b>${esc(t.name)}</b><div class="small muted">${t.mode==='doi'?`👥 ${t.players.length} đội`:t.players.length+' người'} · ${new Date(t.created).toLocaleDateString('vi-VN')} · ${F?'🏆 '+pName(t,F.s1>F.s2?F.p1:F.p2):`đã đấu ${done}/${all} trận`}</div></div><div class="row"><button class="btn sm pri" data-open="${t.id}">Mở</button><button class="btn sm ghost" data-del="${t.id}">🗑</button></div></div>`; }).join('')}</div>`:''}
  ${hallHTML()}
  <div class="card"><h3>＋ Tạo giải mới</h3>
   <label class="f">Tên giải</label><input type="text" id="tn" placeholder="Ví dụ: Giải KHTN 7A – Học kì I" maxlength="50">
   <label class="f">Người chơi – chọn hồ sơ trên máy này</label><div class="row" id="tpf">${DB.profiles.filter(p=>!p.role||p.role==='hs').map(p=>`<span class="tog" data-pid="${p.id}">${p.emo} ${esc(p.name)} <span class="small muted" data-elig="${p.id}"></span></span>`).join('')||'<span class="small muted">Chưa có hồ sơ</span>'}</div>
   <label class="f">…và/hoặc gõ thêm tên (mỗi dòng một bạn)</label><textarea id="tnames" placeholder="Na\nBin\nTôm"></textarea>
   <div class="row" style="margin-top:8px"><label class="small">Kiểu giải <select id="tmode"><option value="don">👤 Đơn (1 vs 1)</option><option value="doi">👥 Đôi (2 vs 2)</option></select></label>
    <label class="small" id="tpairw" style="display:none">Ghép đôi <select id="tpair"><option value="bal">Cân bằng ELO (mạnh + yếu)</option><option value="order">Theo thứ tự chọn (1+2, 3+4…)</option><option value="rand">Bốc thăm ngẫu nhiên</option></select></label></div>
   <p class="small muted" id="tmodehint" style="margin:4px 0 0;display:none">Giải Đôi: chọn số bạn chẵn (6–24 bạn = 3–12 đội). Mỗi trận 4 bạn ngồi chung một máy (phím 1234 · QWER · UIOP · 7890), ai trong đội trả lời đúng trước thì đội được điểm.</p>
   <div class="row" style="margin-top:8px"><label class="small">Chia bảng <select id="tsp"><option value="elo">Theo ELO (cân bằng)</option><option value="rand">Ngẫu nhiên</option></select></label>
    <label class="small">Mỗi trận đến <select id="ttg">${[3,5,7,10].map(n=>`<option ${n===5?'selected':''}>${n}</option>`).join('')}</select> điểm</label></div>
   ${filterUI('tf',NT.f)}${timeUI('tt',NT.f)}
   <div class="card" style="margin:12px 0 0;background:var(--bg2,#f6faf7)"><h3 style="margin-top:0">🎟 Điều kiện tham gia</h3>
    <div class="row"><label class="small">ELO tối thiểu <input type="number" id="treq" min="0" step="50" value="0" style="width:90px"></label>
     <label class="small">Số câu luyện tập đúng tối thiểu <input type="number" id="treqok" min="0" step="5" value="0" style="width:90px"></label></div>
    <p class="small muted" style="margin:6px 0 0">Để 0 là không giới hạn. ELO tăng khi luyện tập (📚 Luyện tập, 📝 Thi thử, 🧮 Bài tính): làm đúng câu khó được cộng nhiều hơn, sai thì bị trừ. Số câu đúng chỉ tính câu luyện tập thuộc các chương đã chọn ở bộ lọc trên (không chọn chương = mọi chương). Bạn chưa đủ điều kiện sẽ hiện ❌ và không vào giải được.</p></div>
   <div class="card" style="margin:12px 0 0;background:var(--bg2,#f6faf7)"><h3 style="margin-top:0">🧑‍⚖️ Trọng tài <span class="small muted">(tùy chọn)</span></h3>
    <label class="small"><input type="checkbox" id="trefon"> Bật quyền trọng tài</label>
    <div class="row" id="trefw" style="display:none;margin-top:6px"><label class="small">Tên <input type="text" id="trefn" maxlength="30" value="Chú Cường" style="width:150px"></label><label class="small">Email trọng tài (Google) <input type="email" id="trefe" value="${esc((DB.refEmails||[]).join(', '))}" placeholder="email-cua-chu@gmail.com" style="width:230px"></label><label class="small">PIN dự phòng <input type="text" id="trefp" inputmode="numeric" maxlength="6" placeholder="4–6 số" style="width:90px"></label><label class="small"><input type="checkbox" id="trefpl"> Trọng tài bấm bắt đầu trận ▶ Đấu</label></div>
    <p class="small muted" style="margin:6px 0 0">Bật lên thì chỉ trọng tài (đăng nhập Google đúng email, hoặc nhập PIN) được nhập/sửa/xoá kết quả, xử thua vắng mặt và xoá giải; mọi thao tác được ghi nhật ký. Bật/tắt lại được bất cứ lúc nào bằng nút 🧑‍⚖️ trong trang giải.</p></div>
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
  $('#trefon').onchange=()=>{ $('#trefw').style.display=$('#trefon').checked?'':'none'; };
  $('#tmode').onchange=()=>{ const d=$('#tmode').value==='doi'; $('#tpairw').style.display=d?'':'none'; $('#tmodehint').style.display=d?'':'none'; };
  bindFilter('tf',NT.f,showElig); $('#treq').oninput=showElig; $('#treqok').oninput=showElig; showElig();
  $$('[data-open]',v).forEach(b=>b.onclick=()=>{ TV.id=b.dataset.open; TV.view='sched'; viewTour(v); });
  $$('[data-del]',v).forEach(b=>b.onclick=()=>{ const tt=DB.tours.find(x=>x.id===b.dataset.del); refGate(tt,()=>confirmBox('Xoá giải này?',()=>{ DB.tours=DB.tours.filter(t=>t.id!==b.dataset.del); save(); viewTour(v); })); });
  $('#tmk').onclick=()=>{ const ps=[...sel].map(id=>{ const p=DB.profiles.find(x=>x.id===id); return {name:p.name,emo:p.emo,elo:p.elo,pid:p.id}; });
    $('#tnames').value.split('\n').map(s=>s.trim()).filter(Boolean).forEach(n=>{ if(ps.some(p=>p.name.toLowerCase()===n.toLowerCase())) return; const pr=DB.profiles.find(x=>x.name.toLowerCase()===n.toLowerCase()); ps.push(pr?{name:pr.name,emo:pr.emo,elo:pr.elo,pid:pr.id}:{name:n.slice(0,16),emo:pick(EMOS),elo:1000}); });
    const rq=reqNow(); if(rq.elo||rq.ok){ const bad=ps.map(x=>({x,e:eligible(x.pid?DB.profiles.find(p=>p.id===x.pid):DB.profiles.find(p=>p.name.toLowerCase()===x.name.toLowerCase()),rq,chsNow())})).filter(o=>!o.e.ok);
      if(bad.length){ modal(`<h3>❌ Chưa đủ điều kiện tham gia</h3><p class="small muted">Yêu cầu: ${rq.elo?'ELO ≥ '+rq.elo:''}${rq.elo&&rq.ok?' và ':''}${rq.ok?'luyện đúng ≥ '+rq.ok+' câu':''}</p>${bad.map(o=>`<div class="mrow"><b>${esc(o.x.emo||'')} ${esc(o.x.name)}</b><span class="small">${o.e.why.join(', ')}</span></div>`).join('')}<p class="small">Các bạn này cần vào <b>📚 Luyện tập</b> thêm rồi mới đăng ký được. Bỏ chọn các bạn này, hoặc hạ điều kiện.</p><div class="row" style="justify-content:flex-end"><button class="btn pri" data-x>Đã hiểu</button></div>`).querySelector('[data-x]').onclick=e=>e.target.closest('.modal').remove(); return; } }
    let ref=null; if($('#trefon').checked){ const pn=$('#trefp').value.trim(), ems=parseEmails($('#trefe').value); if(ems===null){ toast('Email trọng tài chưa đúng định dạng'); return; }
      if(pn&&!/^\d{4,6}$/.test(pn)){ toast('Mã PIN trọng tài cần 4–6 chữ số'); return; } if(!pn&&!ems.length){ toast('Cần email trọng tài hoặc mã PIN'); return; }
      if(ems.length) DB.refEmails=ems; ref={name:$('#trefn').value.trim()||'Trọng tài',pin:pn,emails:ems,play:$('#trefpl').checked}; }
    const doi=$('#tmode').value==='doi'; let entries=ps;
    if(doi){ if(ps.length%2){ toast('Giải Đôi cần số bạn chẵn – đang có '+ps.length+' bạn'); return; } if(ps.length<6){ toast('Giải Đôi cần ít nhất 6 bạn (3 đội)'); return; } if(ps.length>24){ toast('Tối đa 24 bạn (12 đội)'); return; }
      entries=makeTeams(ps,$('#tpair').value); }
    else { if(ps.length<3){ toast('Cần ít nhất 3 người chơi'); return; } if(ps.length>12){ toast('Tối đa 12 người'); return; } }
    const t=createTour($('#tn').value.trim(),entries,$('#tsp').value,+$('#ttg').value,NT.f,{req:rq,prizes:{1:$('#tpz1').value.trim(),2:$('#tpz2').value.trim(),3:$('#tpz3').value.trim()},signer:$('#tsig').value.trim()||'Chú Cường',mode:doi?'doi':'don',ref,rlog:ref?[{at:Date.now(),txt:'Bật quyền trọng tài: '+ref.name}]:[]}); TV.id=t.id; TV.ref=ref?t.id:null; TV.view='sched'; viewTour(v); };
  const imp=txt=>{ try{ const o=JSON.parse(txt); const t=o.tour||o; if(!t.matches||!t.players) throw 0; t.id=uid(); DB.tours.push(t); save(); TV.id=t.id; viewTour(v); toast('Đã mở giải'); }catch(e){ toast('Dữ liệu giải không đúng'); } };
  $('#tfile').onchange=e=>{ const f=e.target.files[0]; if(f) f.text().then(imp); };
  $('#tpaste').onclick=()=>{ const m=modal(`<h3>Dán dữ liệu giải</h3><textarea id="ti" style="min-height:150px"></textarea><div class="row" style="justify-content:flex-end;margin-top:8px"><button class="btn ghost" data-x>Huỷ</button><button class="btn pri" data-y>Mở</button></div>`); $('[data-x]',m).onclick=()=>m.remove(); $('[data-y]',m).onclick=()=>{ const x=$('#ti',m).value; m.remove(); imp(x); }; };
}

// Ghép đôi cho giải Đôi: cân bằng ELO (mạnh nhất + yếu nhất), theo thứ tự chọn, hoặc bốc thăm
function makeTeams(ps,how){ let a=[...ps], pairs=[];
  if(how==='bal'){ a.sort((x,y)=>(y.elo||1000)-(x.elo||1000)); for(let i=0;i<a.length/2;i++) pairs.push([a[i],a[a.length-1-i]]); }
  else { if(how==='rand') a=shuffle(a); for(let i=0;i<a.length;i+=2) pairs.push([a[i],a[i+1]]); }
  return pairs.map(([x,y])=>({name:`${x.name} & ${y.name}`,emo:(x.emo||'🙂')+(y.emo||'🙂'),elo:Math.round(((x.elo||1000)+(y.elo||1000))/2),members:[x,y]})); }

// ---- Quyền trọng tài (tùy chọn): PIN khoá nhập/sửa kết quả, xử thua vắng mặt, nhật ký
let REFAPP=null;
async function refAuth(){ await fbInit(); REFAPP=REFAPP||firebase.apps.find(a=>a.name==='ref')||firebase.initializeApp(DB.fb||FB_DEFAULT,'ref'); const au=firebase.auth(REFAPP);
  await new Promise(r=>{ const off=au.onAuthStateChanged(()=>{ off(); r(); }); }); return au; }
function refEmailOk(t,em){ return !!em&&(t.ref.emails||[]).includes(String(em).toLowerCase()); }
async function refCurEmail(){ try{ const au=await refAuth(); return au.currentUser&&au.currentUser.email?au.currentUser.email.toLowerCase():''; }catch(e){ return ''; } }
function refErr(e){ const c=e&&e.code||''; if(c==='auth/popup-closed-by-user'||c==='auth/cancelled-popup-request') return 'Đã đóng cửa sổ đăng nhập';
  if(c==='auth/operation-not-allowed') return 'Firebase chưa bật đăng nhập Google (Authentication → Sign-in method → Google)';
  if(c==='auth/unauthorized-domain') return 'Tên miền này chưa được cho phép trong Firebase (Authentication → Settings → Authorized domains)';
  if(c==='auth/popup-blocked') return 'Trình duyệt chặn cửa sổ đăng nhập – cho phép pop-up rồi thử lại'; return 'Không đăng nhập được: '+(e&&e.message||e); }
function refGate(t,ok){ if(!t||!t.ref||TV.ref===t.id) return ok();
  const unlock=()=>{ TV.ref=t.id; ok(); const b=$('#tref'); if(b) b.innerHTML='🧑‍⚖️ 🔓 '+esc(t.ref.name); };
  const hasEm=(t.ref.emails||[]).length, hasPin=!!t.ref.pin;
  const show=()=>{ const m=modal(`<h3>🧑‍⚖️ Trọng tài ${esc(t.ref.name)}</h3><p class="small muted">Chỉ trọng tài mới được làm thao tác này. Mở khoá một lần, dùng đến khi rời trang giải.</p>
     ${hasEm?`<button class="btn pri" data-g style="width:100%">🔑 Đăng nhập Google bằng email trọng tài</button><div class="small muted" id="rgm" style="margin-top:6px"></div>`:''}
     ${hasEm&&hasPin?'<p class="small muted" style="text-align:center;margin:10px 0 4px">hoặc</p>':''}
     ${hasPin?`<input type="password" id="rq" inputmode="numeric" maxlength="6" placeholder="Mã PIN trọng tài">`:''}
     <div class="row" style="justify-content:flex-end;margin-top:10px"><button class="btn ghost" data-x>Huỷ</button>${hasPin?'<button class="btn pri" data-y>Mở khoá bằng PIN</button>':''}</div>`);
    $('[data-x]',m).onclick=()=>m.remove();
    if(hasPin){ const go=()=>{ if($('#rq',m).value===t.ref.pin){ m.remove(); unlock(); } else { toast('Sai mã PIN trọng tài'); $('#rq',m).value=''; } };
      $('[data-y]',m).onclick=go; $('#rq',m).onkeydown=e=>{ if(e.key==='Enter') go(); }; if(!hasEm) setTimeout(()=>$('#rq',m).focus(),50); }
    if(hasEm) $('[data-g]',m).onclick=async()=>{ const msg=$('#rgm',m); msg.textContent='Đang mở cửa sổ đăng nhập Google…';
      try{ const au=await refAuth(); const pr=new firebase.auth.GoogleAuthProvider(); pr.setCustomParameters({prompt:'select_account'}); const r=await au.signInWithPopup(pr); const em=(r.user.email||'').toLowerCase();
        if(refEmailOk(t,em)){ m.remove(); toast('Xin chào trọng tài '+t.ref.name); unlock(); } else { msg.textContent=`Email ${em} không phải email trọng tài của giải này.`; await au.signOut(); } }
      catch(e){ msg.textContent=refErr(e); } };
  };
  if(hasEm) refCurEmail().then(em=>{ if(refEmailOk(t,em)) unlock(); else show(); }); else show(); }
function refLog(t,txt){ if(!t.ref) return; t.rlog=t.rlog||[]; t.rlog.push({at:Date.now(),txt}); }
function refSettings(t,v){ const r=t.ref||{name:'Chú Cường',pin:'',emails:DB.refEmails||[],play:false};
  const m=modal(`<h3>🧑‍⚖️ Quyền trọng tài</h3><p class="small muted">Bật lên thì chỉ trọng tài (đăng nhập Google đúng email, hoặc có PIN) mới được nhập/sửa/xoá kết quả, xử thua vắng mặt và xoá giải. Tắt đi thì ai dùng máy cũng nhập được như cũ.</p>
   <label class="f">Tên trọng tài</label><input type="text" id="rn" maxlength="30" value="${esc(r.name)}">
   <label class="f">Email trọng tài – đăng nhập Google (nhiều email cách nhau dấu phẩy)</label><input type="email" id="re" value="${esc((r.emails||[]).join(', '))}" placeholder="ví dụ: email-cua-chu@gmail.com">
   <label class="f">Mã PIN dự phòng (4–6 chữ số, có thể để trống)</label><input type="text" id="rp" inputmode="numeric" maxlength="6" value="${esc(r.pin||'')}">
   <p class="small muted" style="margin:4px 0 0">Cần ít nhất email hoặc PIN. Email chỉ lưu trên máy này, không hiện cho các bạn xem.</p>
   <div class="small" id="rwho" style="margin-top:6px"></div>
   <label class="small" style="display:block;margin-top:8px"><input type="checkbox" id="rpl" ${r.play?'checked':''}> Trận ▶ Đấu cũng phải do trọng tài bấm bắt đầu</label>
   ${(t.rlog||[]).length?`<h3 style="margin:14px 0 6px">📒 Nhật ký trọng tài</h3><div class="small" style="max-height:180px;overflow:auto">${t.rlog.slice().reverse().map(x=>`<div class="mrow"><span class="muted">${new Date(x.at).toLocaleString('vi-VN')}</span><span>${esc(x.txt)}</span></div>`).join('')}</div>`:''}
   <div class="row" style="justify-content:space-between;margin-top:14px">${t.ref?'<button class="btn ghost" data-off>Tắt trọng tài</button>':'<span></span>'}<div class="row"><button class="btn ghost" data-x>Đóng</button><button class="btn pri" data-y>Lưu</button></div></div>`);
  $('[data-x]',m).onclick=()=>m.remove();
  const off=$('[data-off]',m); if(off) off.onclick=()=>{ refLog(t,'Tắt quyền trọng tài'); delete t.ref; TV.ref=null; save(); m.remove(); viewTour(v); };
  refCurEmail().then(em=>{ const w=$('#rwho',m); if(w&&em) w.innerHTML=`Đang đăng nhập trọng tài: <b>${esc(em)}</b> <button class="btn sm ghost" data-so>Đăng xuất</button>`; const so=$('[data-so]',m); if(so) so.onclick=async()=>{ (await refAuth()).signOut(); TV.ref=null; w.textContent='Đã đăng xuất trọng tài'; }; });
  $('[data-y]',m).onclick=()=>{ const n=$('#rn',m).value.trim()||'Trọng tài', p=$('#rp',m).value.trim(), ems=parseEmails($('#re',m).value);
    if(ems===null){ toast('Email chưa đúng định dạng'); return; } if(p&&!/^\d{4,6}$/.test(p)){ toast('Mã PIN cần 4–6 chữ số'); return; } if(!p&&!ems.length){ toast('Cần email trọng tài hoặc mã PIN'); return; }
    if(ems.length) DB.refEmails=ems;
    const was=!!t.ref; t.ref={name:n,pin:p,emails:ems,play:$('#rpl',m).checked}; refLog(t,was?'Đổi cài đặt trọng tài':'Bật quyền trọng tài: '+n); TV.ref=t.id; save(); m.remove(); viewTour(v); }; }

function parseEmails(s){ const a=String(s||'').split(/[,;\s]+/).map(x=>x.trim().toLowerCase()).filter(Boolean); if(a.some(x=>!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(x))) return null; return [...new Set(a)]; }
