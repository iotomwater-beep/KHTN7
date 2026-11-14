// ===================== GIẢI THƯỞNG · HUY CHƯƠNG · BẢNG VÀNG · ĐIỀU KIỆN THAM GIA =====================
DB.hall=DB.hall||[];
const PLACE={1:{ic:'🥇',n:'Vô địch',s:'Giải Nhất'},2:{ic:'🥈',n:'Á quân',s:'Giải Nhì'},3:{ic:'🥉',n:'Hạng Ba',s:'Giải Ba'}};
const TITLES={speed:{ic:'⚡',n:'Vua tốc độ',d:'trả lời đúng nhanh nhất giải'},score:{ic:'🎯',n:'Tay ghi điểm',d:'ghi nhiều điểm nhất giải'},unbeaten:{ic:'🛡️',n:'Bất bại',d:'không thua trận nào'}};

// ---- điều kiện tham gia: ELO tối thiểu + số câu đúng khi luyện tập các chương của giải
function reqChs(t){ const c=(t.filter&&t.filter.chs)||[]; return c.length?c:null; }
function pracOk(p,chs){ let s=0; for(const [k,v] of Object.entries(p.pp||{})) if(!chs||chs.includes(k)) s+=v.ok||0; return s; }
function eligible(p,req,chs){ req=req||{}; const why=[];
  if(!(req.elo||req.ok)) return {ok:true,why};
  if(!p) return {ok:false,why:['chưa có hồ sơ trên máy này']};
  if(req.elo&&p.elo<req.elo) why.push(`ELO ${p.elo}/${req.elo}`);
  if(req.ok){ const n=pracOk(p,chs); if(n<req.ok) why.push(`luyện đúng ${n}/${req.ok} câu`); }
  return {ok:!why.length,why}; }
function reqText(t){ const r=t.req||{}; if(!(r.elo||r.ok)) return ''; const chs=reqChs(t);
  return [r.elo?`ELO từ <b>${r.elo}</b> trở lên`:'', r.ok?`đã làm đúng ít nhất <b>${r.ok} câu</b> khi luyện tập ${chs?'các chương '+chs.map(chName).join(', '):'(mọi chương)'}`:''].filter(Boolean).join(' và '); }

// ---- tính kết quả: hạng 1-2-3 và danh hiệu phụ
function tourResults(t){
  const F=t.matches.find(m=>m.st==='F'&&m.s1!=null); if(!F) return null;
  const P3=t.matches.find(m=>m.st==='3P'&&m.s1!=null);
  const w=m=>m.s1>m.s2?m.p1:m.p2, l=m=>m.s1>m.s2?m.p2:m.p1;
  const places=[{r:1,i:w(F)},{r:2,i:l(F)}]; if(P3) places.push({r:3,i:w(P3)});
  const st={}; t.players.forEach((p,i)=>st[i]={F:0,P:0,L:0,ts:0,tn:0});
  t.matches.filter(m=>!m.bye&&m.s1!=null).forEach(m=>{ const a=st[m.p1], b=st[m.p2]; a.P++; b.P++; a.F+=m.s1; b.F+=m.s2; if(m.s1<m.s2) a.L++; else if(m.s2<m.s1) b.L++;
    if(m.sp){ if(m.sp[1]){a.ts+=m.sp[1][0];a.tn+=m.sp[1][1];} if(m.sp[2]){b.ts+=m.sp[2][0];b.tn+=m.sp[2][1];} } });
  const titles=[]; const ids=Object.keys(st).map(Number);
  const mx=Math.max(...ids.map(i=>st[i].F)); if(mx>0) ids.filter(i=>st[i].F===mx).forEach(i=>titles.push({k:'score',i,v:mx+' điểm'}));
  ids.filter(i=>st[i].P>=2&&st[i].L===0).forEach(i=>titles.push({k:'unbeaten',i,v:st[i].P+' trận'}));
  const sp=ids.filter(i=>st[i].tn>=3).map(i=>({i,a:st[i].ts/st[i].tn})).sort((x,y)=>x.a-y.a);
  if(sp.length) titles.push({k:'speed',i:sp[0].i,v:(sp[0].a/1000).toFixed(1).replace('.',',')+' giây/câu'});
  return {places,titles,date:F.at||Date.now()};
}
function teamProfs(t,i){ const e=t.players[i]; if(t.mode==='doi'&&e&&e.members) return e.members.map(mb=>(mb.pid&&DB.profiles.find(x=>x.id===mb.pid))||DB.profiles.find(x=>x.name.toLowerCase()===String(mb.name).toLowerCase())||null); return [tourProf(t,i)]; }
function certBtns(t,i,key){ const e=t.players[i]; if(t.mode==='doi'&&e&&e.members) return e.members.map((mb,j)=>`<button class="btn sm" style="margin:6px 4px 0 0" data-cert="${key}:${j}">🎖 ${esc(mb.name)}</button>`).join(''); return `<button class="btn sm" style="margin-top:6px" data-cert="${key}">🎖 Giấy khen</button>`; }
function tourProf(t,i){ const p=t.players[i]; if(!p) return null; return (p.pid&&DB.profiles.find(x=>x.id===p.pid))||DB.profiles.find(x=>x.name.toLowerCase()===String(p.name).toLowerCase())||null; }
// ghi huy chương vào hồ sơ + bảng vàng (chạy lại được, sửa kết quả thì tự cập nhật)
function syncAwards(t){
  const R=tourResults(t); const before=JSON.stringify([DB.hall,DB.profiles.map(p=>p.medals||[])]);
  DB.profiles.forEach(p=>{ if(p.medals) p.medals=p.medals.filter(m=>m.tid!==t.id); });
  DB.hall=DB.hall.filter(h=>h.tid!==t.id);
  if(R){ const d=Date.now();
    const give=(i,o)=>{ teamProfs(t,i).forEach(p=>{ if(p){ p.medals=p.medals||[]; p.medals.push(Object.assign({tid:t.id,tn:t.name,d},o)); } }); };
    R.places.forEach(x=>give(x.i,{r:x.r})); R.titles.forEach(x=>give(x.i,{k:x.k}));
    const nm=i=>{ const p=t.players[i]; return {n:p.name,e:p.emo||'🙂'}; };
    DB.hall.push({tid:t.id,tn:t.name,d:t.created,places:R.places.map(x=>Object.assign({r:x.r},nm(x.i))),titles:R.titles.map(x=>Object.assign({k:x.k,v:x.v},nm(x.i)))}); }
  if(JSON.stringify([DB.hall,DB.profiles.map(p=>p.medals||[])])!==before) save();
  return R;
}
// ---- khối vinh danh trên trang giải
function awardsHTML(t,R){
  const pz=t.prizes||{};
  return `<div class="champ" style="margin-bottom:14px"><div class="big">🏆 ${pName(t,R.places[0].i)}</div><p>Vô địch ${esc(t.name)}</p>
   <div class="grid g3" style="margin-top:10px;text-align:left">${R.places.map(x=>`<div class="tile"><b>${PLACE[x.r].ic} ${PLACE[x.r].n}</b><div>${pName(t,x.i)}</div>${pz[x.r]?`<div class="small">🎁 ${esc(pz[x.r])}</div>`:''}
     ${certBtns(t,x.i,'p'+x.r)}</div>`).join('')}</div>
   ${R.titles.length?`<h3 style="margin:14px 0 6px">Danh hiệu</h3><div class="grid g3" style="text-align:left">${R.titles.map((x,j)=>`<div class="tile"><b>${TITLES[x.k].ic} ${TITLES[x.k].n}</b><div>${pName(t,x.i)}</div><div class="small muted">${TITLES[x.k].d} · ${esc(x.v)}</div>
     ${certBtns(t,x.i,'t'+j)}</div>`).join('')}</div>`:''}
   ${!R.titles.some(x=>x.k==='speed')?'<p class="small muted" style="margin:8px 0 0">⚡ Vua tốc độ chỉ tính khi các trận được đấu bằng nút ▶ Đấu (app đo thời gian trả lời).</p>':''}</div>`; }
function bindAwards(v,t,R){ $$('[data-cert]',v).forEach(b=>b.onclick=()=>{ const [k,mi]=b.dataset.cert.split(':'); const m=mi==null?null:+mi;
  if(k[0]==='p'){ const x=R.places.find(y=>y.r===+k.slice(1)); certificate(t,x.i,`${PLACE[x.r].ic} ${PLACE[x.r].s.toUpperCase()} – ${PLACE[x.r].n.toUpperCase()}`,(t.prizes||{})[x.r],m); }
  else { const x=R.titles[+k.slice(1)]; certificate(t,x.i,`${TITLES[x.k].ic} DANH HIỆU “${TITLES[x.k].n.toUpperCase()}”`,TITLES[x.k].d+' ('+x.v+')',m); } }); }

// ---- giấy khen (ảnh PNG, in A4 ngang)
function certificate(t,i,title,sub,mi){
  const W=1754,H=1240,c=document.createElement('canvas'); c.width=W; c.height=H; const g=c.getContext('2d');
  const grd=g.createLinearGradient(0,0,W,H); grd.addColorStop(0,'#fffdf5'); grd.addColorStop(1,'#f3faf5'); g.fillStyle=grd; g.fillRect(0,0,W,H);
  g.strokeStyle='#0f8a5f'; g.lineWidth=16; g.strokeRect(40,40,W-80,H-80); g.strokeStyle='#d4a72c'; g.lineWidth=5; g.strokeRect(74,74,W-148,H-148);
  [[110,110],[W-110,110],[110,H-110],[W-110,H-110]].forEach(([x,y])=>{ g.fillStyle='#d4a72c'; g.beginPath(); g.arc(x,y,16,0,7); g.fill(); });
  const T=(s,y,f,col,al)=>{ g.font=f; g.fillStyle=col||'#17322a'; g.textAlign=al||'center'; g.fillText(s,W/2,y); };
  const fit=(s,y,size,weight,col,maxW)=>{ let z=size; do{ g.font=`${weight} ${z}px "Segoe UI",system-ui,sans-serif`; z-=4; }while(g.measureText(s).width>(maxW||W-300)&&z>20); g.fillStyle=col; g.textAlign='center'; g.fillText(s,W/2,y); };
  T('KHTN·7 ĐẤU TRƯỜNG',175,'700 34px "Segoe UI",system-ui,sans-serif','#0f8a5f');
  fit('GIẤY KHEN',360,130,'800','#b8860b');
  T('Ban tổ chức trân trọng khen tặng',440,'400 40px "Segoe UI",system-ui,sans-serif','#3d5a50');
  const team=t.players[i]; const p=(mi!=null&&team.members)?team.members[mi]:team; const mate=(mi!=null&&team.members)?team.members[1-mi]:null;
  fit(`${p.emo||''} ${p.name}`,565,110,'800','#0f5f43');
  fit(title,675,58,'700','#17322a');
  if(sub) fit(sub,750,40,'400','#3d5a50');
  fit(mate?`cùng đồng đội ${mate.name} · tại ${t.name} (Giải Đôi)`:`tại ${t.name}`,830,44,'600','#17322a');
  const d=new Date(); g.font='400 34px "Segoe UI",system-ui,sans-serif'; g.fillStyle='#3d5a50'; g.textAlign='left'; g.fillText(`Ngày ${d.getDate()} tháng ${d.getMonth()+1} năm ${d.getFullYear()}`,200,1000);
  g.textAlign='center'; g.fillText('Người trao giải',W-420,960); g.font='italic 700 64px "Segoe Script","Brush Script MT",cursive'; g.fillStyle='#0f5f43'; g.fillText(t.signer||'Chú Cường',W-420,1060);
  g.font='120px serif'; g.textAlign='center'; g.fillText(/VÔ ĐỊCH/.test(title)?'🏆':/Á QUÂN/.test(title)?'🥈':/HẠNG BA/.test(title)?'🥉':'🏅',W/2,1080);
  const url=c.toDataURL('image/png'), fn=`Giay-khen-${String(p.name).replace(/\s+/g,'-')}.png`;
  const md=modal(`<h3>🎖 Giấy khen</h3><img src="${url}" style="width:100%;border-radius:8px;border:1px solid var(--line)"><div class="row" style="justify-content:flex-end;margin-top:10px"><button class="btn ghost" data-x>Đóng</button><a class="btn pri" href="${url}" download="${fn}">⬇️ Tải ảnh về</a></div>`);
  $('[data-x]',md).onclick=()=>md.remove();
}
// ---- tủ huy chương (trang chủ) & bảng vàng (trang giải)
function medalCaseHTML(p){ const ms=p&&p.medals||[]; if(!ms.length) return '';
  const cnt=r=>ms.filter(m=>m.r===r).length, tl=ms.filter(m=>m.k);
  return `<div class="card"><h3>🏅 Tủ huy chương</h3><div class="row">${[1,2,3].map(r=>`<span class="chip">${PLACE[r].ic} × ${cnt(r)}</span>`).join('')}${Object.keys(TITLES).map(k=>{ const n=tl.filter(m=>m.k===k).length; return n?`<span class="chip">${TITLES[k].ic} ${TITLES[k].n} × ${n}</span>`:''; }).join('')}</div>
   <div class="small muted" style="margin-top:8px">${ms.slice().sort((a,b)=>b.d-a.d).slice(0,6).map(m=>`${m.r?PLACE[m.r].ic+' '+PLACE[m.r].n:TITLES[m.k].ic+' '+TITLES[m.k].n} – ${esc(m.tn)}`).join('<br>')}</div></div>`; }
function hallHTML(){ if(!DB.hall.length) return '';
  return `<div class="card"><h3>📜 Bảng vàng</h3>${DB.hall.slice().reverse().map(h=>`<div class="mrow"><div><b>${esc(h.tn)}</b> <span class="small muted">${new Date(h.d).toLocaleDateString('vi-VN')}</span>
    <div class="small">${h.places.map(x=>`${PLACE[x.r].ic} ${esc(x.e)} ${esc(x.n)}`).join(' · ')}</div>${h.titles.length?`<div class="small muted">${h.titles.map(x=>`${TITLES[x.k].ic} ${esc(x.n)}`).join(' · ')}</div>`:''}</div></div>`).join('')}</div>`; }
