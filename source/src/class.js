// ===================== LỚP HỌC: GIÁO VIÊN THEO DÕI CÁC BẠN TỰ LUYỆN =====================
// Giáo viên tạo lớp (mã 6 số bắt đầu bằng 7) → các bạn nhập mã lớp trên máy mình → mỗi lần luyện tập / thi thử / đấu,
// tiến độ tự gửi lên máy chủ Firebase. Giáo viên mở "Lớp học" trên máy mình là thấy cả lớp, cập nhật trực tiếp.
// Lên máy chủ chỉ có: biệt danh, con vật, ELO, số câu đúng/sai theo chương, nhật kí luyện tập. Không có tên thật, mật khẩu.
function logAct(p,kind,detail){ if(!p) return; p.log=p.log||[]; p.log.unshift(Object.assign({t:Date.now(),k:kind},detail)); p.log=p.log.slice(0,30); }
let SYNC_T=null, SYNC_ERR=false;
function classSyncSoon(){ if(!DB.profiles.some(p=>p.cls)) return; clearTimeout(SYNC_T); SYNC_T=setTimeout(classSync,2500); }
async function classSync(){
  const ps=DB.profiles.filter(p=>p.cls); if(!ps.length) return;
  try{ await fbInit(); }catch(e){ SYNC_ERR=true; return; }
  SYNC_ERR=false;
  for(const p of ps){
    try{
      if(p.role&&p.role!=='hs'){ // giáo viên, phụ huynh, quản lý: ghi vào staff, kiểm tra có bị thu hồi quyền không
        const rv=await FB.ref(`rooms/${p.cls}/revoked/${p.id}`).get();
        if(rv.exists()){ toast(`Quyền ${ROLE_N[p.role]} của ${p.name} ở lớp ${p.cls} đã bị quản lý thu hồi`,4500); delete p.cls; delete p.role; delete p.kids; continue; }
        await FB.ref(`rooms/${p.cls}/staff/${p.id}`).set({n:p.name,e:p.emo,role:p.role,kids:p.kids||[],t:Date.now()});
      } else {
        await FB.ref(`rooms/${p.cls}/m/${p.id}`).set({n:p.name,e:p.emo,elo:p.elo,w:p.w,d:p.d,l:p.l,pr:p.pr||{},log:(p.log||[]).slice(0,15),t:Date.now()});
      }
      p.synced=Date.now();
    }catch(e){ SYNC_ERR=true; } }
  try{ localStorage.setItem(LSK,JSON.stringify(DB)); }catch(e){}
}
const ROLE_N={hs:'học sinh',gv:'giáo viên',ph:'phụ huynh',owner:'quản lý'};
const ROLE_B={gv:'🧑‍🏫 Giáo viên',ph:'👪 Phụ huynh',owner:'⭐ Quản lý'};
const invCode=()=>Array.from({length:6},()=>'ABCDEFGHJKMNPQRSTUVWXYZ23456789'[Math.floor(Math.random()*31)]).join('');
function memberHTML(r){
  return `<div class="row small"><span class="chip">ELO ${r.elo}</span><span class="chip">T ${r.w} · H ${r.d} · B ${r.l}</span><span class="chip">${(r.log&&r.log[0])?'Luyện '+ago(r.log[0].t):'Chưa luyện'}</span></div>
   <h3 style="margin-top:12px">Theo chương</h3>${CHAPTERS.concat(Object.entries(CALC_TR).map(([id,t])=>({id,short:t.name,ic:t.ic}))).map(c=>{ const x=(r.pr||{})[c.id]; if(!x||!x.n) return ''; const pct=Math.round(x.ok/x.n*100); return `<div class="mrow"><span>${c.ic} ${c.short}</span><span style="color:${pct<50?'var(--bad)':pct<75?'var(--acc)':'var(--ok)'}"><b>${pct}%</b> · ${x.ok}/${x.n}</span></div>`; }).join('')||'<p class="small muted">Chưa luyện chương nào</p>'}
   <h3 style="margin-top:12px">Nhật kí gần đây</h3>${(r.log||[]).map(l=>`<div class="mrow small"><span>${new Date(l.t).toLocaleString('vi-VN',{day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'})} · ${esc(l.k)}${l.ch?' · '+esc(l.ch):''}</span><b>${esc(l.r||'')}</b></div>`).join('')||'<p class="small muted">Chưa có</p>'}`;
}
function ago(t){ if(!t) return '—'; const s=(Date.now()-t)/1000; if(s<60) return 'vừa xong'; if(s<3600) return Math.floor(s/60)+' phút trước'; if(s<86400) return Math.floor(s/3600)+' giờ trước'; return Math.floor(s/86400)+' ngày trước'; }
function prSum(pr){ let ok=0,n=0; Object.values(pr||{}).forEach(x=>{ok+=x.ok;n+=x.n;}); return {ok,n,pct:n?Math.round(ok/n*100):0}; }

let CV={code:null,off:null,data:null,sort:'t'};
function viewClass(v){
  cleanup=()=>{ if(CV.off){ CV.off(); CV.off=null; } };
  DB.adminClasses=DB.adminClasses||[];
  if(CV.code) return classDash(v);
  const p=curP();
  v.innerHTML=`<div class="card"><h2>👩‍🏫 Lớp học</h2><p class="small muted" style="margin:0">Các bạn <b>không cần đăng nhập</b>. Mỗi bạn có một hồ sơ (biệt danh + con vật), có thể đặt <b>mã PIN 4 số</b> để bạn khác không dùng nhầm. Bạn nào <b>vào lớp</b> thì mỗi lần luyện tập, thi thử, đấu, kết quả tự gửi về cho thầy cô xem.</p></div>
  <div class="grid g2">
   <div class="card"><h3>🙋 Hồ sơ của bạn trong lớp</h3>
    ${p?`<p>Hồ sơ đang dùng: <b>${p.emo} ${esc(p.name)}</b> ${p.role&&p.role!=='hs'?`<span class="tag">${ROLE_B[p.role]}</span>`:''} <button class="btn sm ghost" id="csw">Đổi</button></p>
     ${p.cls?(p.role==='gv'||p.role==='owner'?`<p>${ROLE_B[p.role]} lớp <b>${p.cls}</b>: xem cả lớp, duyệt câu, đưa câu và tài liệu vào kho lớp.</p><div class="row"><button class="btn sm pri" id="cdash">Mở bảng lớp</button><button class="btn sm ghost" id="cleave">Rời lớp</button></div>`
       :p.role==='ph'?`<p>👪 Phụ huynh lớp <b>${p.cls}</b> của: <b>${esc((p.kidNames||[]).join(', ')||'chưa chọn')}</b></p><div class="row"><button class="btn sm pri" id="cdash">Xem kết quả của con</button><button class="btn sm" id="ckids">Chọn lại con</button><button class="btn sm ghost" id="cleave">Rời lớp</button></div>`
       :`<p>✅ Đã vào lớp <b>${p.cls}</b> (học sinh). ${p.synced?'Gửi kết quả lần cuối: '+ago(p.synced):'Chưa gửi lần nào'}${SYNC_ERR?' <span style="color:var(--bad)">(chưa kết nối được máy chủ)</span>':''}</p><div class="row"><button class="btn sm" id="cnow">Gửi kết quả ngay</button><button class="btn sm ghost" id="cleave">Rời lớp</button></div>`)
     :`<label class="f">Vào lớp với vai trò</label><div class="row">${[['hs','🧒 Học sinh'],['gv','🧑‍🏫 Giáo viên'],['ph','👪 Phụ huynh']].map(([k,t])=>`<span class="tog ${(CV.jr||'hs')===k?'on':''}" data-jr="${k}">${t}</span>`).join('')}</div>
      <label class="f">Mã lớp (6 số)</label><input type="text" id="ccode" inputmode="numeric" maxlength="6" placeholder="7xxxxx">
      ${(CV.jr||'hs')!=='hs'?`<label class="f">Mã mời ${CV.jr==='gv'?'giáo viên':'phụ huynh'} (6 ký tự, quản lý lớp gửi)</label><input type="text" id="cinv" maxlength="6" placeholder="Ví dụ: K7PQ2M" style="text-transform:uppercase">`:''}
      <div class="row" style="margin-top:8px"><button class="btn pri" id="cjoin">Vào lớp</button></div>`}
     <div style="margin-top:10px"><button class="btn sm ghost" id="cpin">${p.pin?'🔒 Đổi / bỏ mã PIN':'🔒 Đặt mã PIN cho hồ sơ'}</button></div>`
    :`<p>Tạo hồ sơ trước nhé.</p><button class="btn pri" id="cmk">＋ Tạo hồ sơ</button>`}</div>
   <div class="card"><h3>⭐ Quản lý lớp (người tạo lớp)</h3>
    ${DB.adminClasses.length?DB.adminClasses.map(c=>`<div class="mrow"><div><b>${esc(c.name)}</b><div class="small muted">Mã lớp <b>${c.code}</b></div></div><div class="row"><button class="btn sm pri" data-open="${c.code}">Xem lớp</button><button class="btn sm ghost" data-forget="${c.code}">Ẩn</button></div></div>`).join(''):'<p class="small muted">Chưa có lớp nào trên máy này.</p>'}
    <label class="f">Tên lớp mới ${p?`<span class="muted">– hồ sơ quản lý: ${p.emo} ${esc(p.name)}</span>`:''}</label><div class="row"><input type="text" id="cname" placeholder="Ví dụ: 7A – KHTN" maxlength="40" style="flex:1;width:auto"><button class="btn" id="cnew">＋ Tạo lớp</button></div>
    <details style="margin-top:8px"><summary class="small">Mở lớp đã tạo ở máy khác</summary><div class="row" style="margin-top:6px"><input type="text" id="cadd" maxlength="6" placeholder="Mã lớp" style="flex:1;width:auto"><button class="btn sm" id="caddb">Mở</button></div></details>
    <p class="small muted" id="cst"></p></div></div>
  ${bankBox('cbank')}
  <div class="card"><h3>👥 Tạo nhanh nhiều hồ sơ trên máy này</h3><p class="small muted">Dùng khi cả lớp chung một máy (máy phòng học, máy nhà). Gõ mỗi dòng một biệt danh. Mỗi bạn được một con vật riêng để dễ nhận ra mình${DB.adminClasses.length?', và tự vào lớp chọn dưới đây':''}.</p>
   <textarea id="cbulk" placeholder="Na\nBin\nTôm\nMít"></textarea>
   <div class="row" style="margin-top:8px">${DB.adminClasses.length?`<label class="small">Vào lớp <select id="cbcls"><option value="">— không —</option>${DB.adminClasses.map(c=>`<option value="${c.code}">${esc(c.name)} (${c.code})</option>`).join('')}</select></label>`:''}<span style="flex:1"></span><button class="btn pri" id="cbgo">Tạo hồ sơ</button></div>
   ${DB.profiles.length?`<div class="row" style="margin-top:12px">${DB.profiles.map(x=>`<span class="pf ${x.id===DB.cur?'on':''}"><span class="emo">${x.emo}</span>${esc(x.name)}${x.pin?' 🔒':''}${x.cls?' <span class="tag">'+x.cls+'</span>':''}</span>`).join('')}</div>`:''}</div>`;
  bindBankBox('cbank',()=>viewClass(v));
  const st=$('#cst');
  const need=async()=>{ try{ await fbInit(); return true; }catch(e){ toast('Chưa kết nối được máy chủ. Mở file HTML đã tải về bằng Chrome và kiểm tra mạng.',4500); return false; } };
  if(p){
    $('#csw').onclick=()=>switchProfile();
    $('#cpin').onclick=()=>pinSetDialog(p,()=>render());
    $$('[data-jr]',v).forEach(b=>b.onclick=()=>{ CV.jr=b.dataset.jr; viewClass(v); });
    const leave=$('#cleave'); if(leave) leave.onclick=()=>confirmBox('Rời lớp?',async()=>{ const c=p.cls, staff=p.role&&p.role!=='hs'; delete p.cls; delete p.role; delete p.kids; delete p.kidNames; save(); try{ await fbInit(); await FB.ref(`rooms/${c}/${staff?'staff':'m'}/${p.id}`).remove(); }catch(e){} render(); });
    const now=$('#cnow'); if(now) now.onclick=async()=>{ await classSync(); toast(SYNC_ERR?'Chưa gửi được, kiểm tra mạng':'Đã gửi kết quả'); viewClass(v); };
    const dsh=$('#cdash'); if(dsh) dsh.onclick=async()=>{ if(!await need()) return; CV.code=p.cls; viewClass(v); };
    const ck=$('#ckids'); if(ck) ck.onclick=async()=>{ if(!await need()) return; pickKids(p,p.cls,()=>viewClass(v)); };
    const jn=$('#cjoin'); if(jn) jn.onclick=async()=>{ const c=$('#ccode').value.trim(), role=CV.jr||'hs'; if(!/^7\d{5}$/.test(c)){ toast('Mã lớp gồm 6 số, bắt đầu bằng 7'); return; } if(!await need()) return;
      const s=await FB.ref(`rooms/${c}/info`).get(); const info=s.val(); if(!info||info.app!=='khtn7class'){ toast('Không tìm thấy lớp '+c); return; }
      if(role!=='hs'){ const k=($('#cinv').value||'').trim().toUpperCase(); if(!info.inv||!k||info.inv[role]!==k){ toast(`Mã mời ${ROLE_N[role]} không đúng. Hỏi lại người quản lý lớp.`,4000); return; }
        const rv=await FB.ref(`rooms/${c}/revoked/${p.id}`).get(); if(rv.exists()){ toast('Hồ sơ này đã bị thu hồi quyền ở lớp này'); return; } }
      p.cls=c; p.role=role==='hs'?undefined:role; if(!p.role) delete p.role; save(); await classSync();
      toast(`Đã vào lớp ${info.name} với vai trò ${ROLE_N[role]}`);
      if(role==='ph') pickKids(p,c,()=>render()); else render(); };

  } else $('#cmk').onclick=()=>profileDialog(()=>render());
  $('#cnew').onclick=async()=>{ const name=$('#cname').value.trim()||'Lớp KHTN 7'; if(!await need()) return; st.textContent='⏳ Đang tạo lớp…';
    let code; for(let i=0;i<20;i++){ code='7'+String(Math.floor(Math.random()*100000)).padStart(5,'0'); if(!(await FB.ref('rooms/'+code).get()).exists()) break; }
    await FB.ref(`rooms/${code}/info`).set({app:'khtn7class',name,created:Date.now(),owner:FBUID,inv:{gv:invCode(),ph:invCode()}});
    DB.adminClasses.push({code,name}); if(p&&!p.cls){ p.cls=code; p.role='owner'; } save(); classSync(); CV.code=code; viewClass(v); };
  $('#caddb').onclick=async()=>{ const c=$('#cadd').value.trim(); if(!/^7\d{5}$/.test(c)){ toast('Mã lớp gồm 6 số'); return; } if(!await need()) return; const s=await FB.ref(`rooms/${c}/info`).get();
    if(!s.exists()){ toast('Không tìm thấy lớp'); return; } if(!DB.adminClasses.some(x=>x.code===c)) DB.adminClasses.push({code:c,name:s.val().name}); save(); CV.code=c; viewClass(v); };
  $$('[data-open]',v).forEach(b=>b.onclick=async()=>{ if(!await need()) return; CV.code=b.dataset.open; viewClass(v); });
  $$('[data-forget]',v).forEach(b=>b.onclick=()=>confirmBox('Ẩn lớp này khỏi máy? (Dữ liệu trên máy chủ vẫn còn, mở lại bằng mã lớp)',()=>{ DB.adminClasses=DB.adminClasses.filter(c=>c.code!==b.dataset.forget); save(); viewClass(v); }));
  $('#cbgo').onclick=()=>{ const names=$('#cbulk').value.split('\n').map(s=>s.trim()).filter(Boolean); if(!names.length){ toast('Gõ ít nhất một biệt danh'); return; }
    const cls=$('#cbcls')?$('#cbcls').value:''; const used=new Set(DB.profiles.map(x=>x.emo)); let n=0;
    names.forEach(nm=>{ if(DB.profiles.some(x=>x.name.toLowerCase()===nm.toLowerCase())) return; const free=EMOS.filter(e=>!used.has(e)); const e=free.length?free[0]:pick(EMOS); used.add(e);
      const pr=newProfile(nm,e); if(cls) pr.cls=cls; n++; });
    save(); if(cls) classSync(); toast(`Đã tạo ${n} hồ sơ`); render(); };
}
function classPerm(code){ const cp=curP(); const owner=(DB.adminClasses||[]).some(c=>c.code===code)||(cp&&cp.cls===code&&cp.role==='owner');
  return {owner, teacher:!owner&&cp&&cp.cls===code&&cp.role==='gv', parent:!owner&&cp&&cp.cls===code&&cp.role==='ph'}; }
async function pickKids(p,code,after){
  const s=await FB.ref(`rooms/${code}/m`).get(); const m=s.val()||{}; const ids=Object.keys(m);
  if(!ids.length){ toast('Lớp chưa có học sinh nào. Khi con vào lớp, bấm "Chọn lại con".',4500); after(); return; }
  const sel=new Set(p.kids||[]);
  const md=modal(`<h3>👪 Chọn con của bạn</h3><p class="small muted">Chọn hồ sơ của con trong lớp ${code} (theo biệt danh và con vật con dùng).</p><div class="row">${ids.map(id=>`<span class="tog ${sel.has(id)?'on':''}" data-k="${id}">${esc(m[id].e)} ${esc(m[id].n)}</span>`).join('')}</div>
   <div class="row" style="justify-content:flex-end;margin-top:12px"><button class="btn pri" data-y>Lưu</button></div>`);
  $$('[data-k]',md).forEach(b=>b.onclick=()=>{ const k=b.dataset.k; sel.has(k)?sel.delete(k):sel.add(k); b.classList.toggle('on'); });
  $('[data-y]',md).onclick=()=>{ p.kids=[...sel]; p.kidNames=p.kids.map(k=>m[k]?m[k].e+' '+m[k].n:k); save(); classSync(); md.remove(); after(); };
}
function parentDash(v,code){
  const cp=curP(); const kids=cp.kids||[];
  const draw=()=>{ if(TAB!=='class'||CV.code!==code) return; const m=CV.data||{};
    v.innerHTML=`<div class="card"><div class="row between"><div><h2 style="margin:0">👪 Kết quả của con – lớp ${code}</h2><div class="small muted">Chỉ xem, tự cập nhật mỗi khi con luyện xong.</div></div><div class="row"><button class="btn sm" id="pk">Chọn lại con</button><button class="btn sm ghost" id="dback">← Quay lại</button></div></div></div>
     ${kids.length?kids.map(k=>m[k]?`<div class="card"><h3>${esc(m[k].e)} ${esc(m[k].n)}</h3>${memberHTML(m[k])}</div>`:`<div class="card small muted">Không tìm thấy hồ sơ ${esc(k)} (con đã rời lớp?)</div>`).join(''):'<div class="card">Chưa chọn con. Bấm "Chọn lại con".</div>'}`;
    $('#dback').onclick=()=>{ if(CV.off){CV.off();CV.off=null;} CV.code=null; CV.data=null; viewClass(v); };
    $('#pk').onclick=()=>pickKids(cp,code,()=>{ parentDash(v,code); });
  };
  if(!CV.off){ const ref=FB.ref(`rooms/${code}/m`); const h=ref.on('value',s=>{ CV.data=s.val()||{}; draw(); }); CV.off=()=>ref.off('value',h); v.innerHTML='<div class="card">⏳ Đang tải…</div>'; } else draw();
}
function rolesHTML(code){ const inf=CV.info||{}, inv=inf.inv||{}; const staff=Object.entries(CV.staff||{});
  return `<div class="card"><h3>🔑 Phân quyền</h3>
   <div class="grid g2"><div class="tile"><b>🧑‍🏫 Mã mời giáo viên</b><div class="code" style="font-size:28px">${inv.gv||'—'}</div><div class="small muted">Giáo viên: xem cả lớp, duyệt câu học sinh gửi, đưa câu và tài liệu thẳng vào kho lớp.</div></div>
    <div class="tile"><b>👪 Mã mời phụ huynh</b><div class="code" style="font-size:28px">${inv.ph||'—'}</div><div class="small muted">Phụ huynh: chỉ xem kết quả của con mình, gửi câu lên chờ duyệt.</div></div></div>
   <p class="small muted">Gửi mã lớp <b>${code}</b> kèm mã mời. Người nhận vào Lớp học → chọn vai trò → nhập hai mã. Lộ mã thì bấm Đổi mã mời: ai đã vào vẫn giữ quyền, người mới phải dùng mã mới.</p>
   <div class="row"><button class="btn sm" id="rinv">🔄 ${inv.gv?'Đổi':'Tạo'} mã mời</button><button class="btn sm ghost" id="rcopy">📋 Sao chép lời mời</button></div>
   <h3 style="margin-top:14px">Giáo viên, phụ huynh, quản lý (${staff.length})</h3>
   ${staff.length?staff.map(([id,x])=>`<div class="mrow"><span>${esc(x.e)} <b>${esc(x.n)}</b> <span class="tag">${ROLE_B[x.role]||x.role}</span>${x.role==='ph'&&x.kids&&x.kids.length?` <span class="small muted">con: ${esc(x.kids.map(k=>(CV.data&&CV.data[k])?CV.data[k].n:'?').join(', '))}</span>`:''} <span class="small muted">· ${ago(x.t)}</span></span>${x.role!=='owner'?`<button class="btn sm ghost" data-rv="${id}">Thu hồi quyền</button>`:''}</div>`).join(''):'<p class="small muted">Chưa có ai.</p>'}</div>`; }
function classDash(v){
  const code=CV.code; const perm=classPerm(code);
  if(perm.parent) return parentDash(v,code);
  if(!perm.owner&&!perm.teacher){ CV.code=null; toast('Bạn không có quyền xem bảng lớp này'); return viewClass(v); }
  const info=(DB.adminClasses||[]).find(c=>c.code===code)||{name:'Lớp '+code};
  const draw=()=>{ if(TAB!=='class'||CV.code!==code) return; const m=CV.data||{}; if(CV.info&&CV.info.name) info.name=CV.info.name;
    let rows=Object.entries(m).map(([id,x])=>Object.assign({id},x,{s:prSum(x.pr),last:(x.log&&x.log[0]&&x.log[0].t)||0}));
    const key={t:(a,b)=>b.last-a.last,elo:(a,b)=>b.elo-a.elo,n:(a,b)=>b.s.n-a.s.n,pct:(a,b)=>b.s.pct-a.s.pct,name:(a,b)=>a.n.localeCompare(b.n)}[CV.sort];
    rows.sort(key);
    const chAgg={}; rows.forEach(r=>Object.entries(r.pr||{}).forEach(([c,x])=>{ chAgg[c]=chAgg[c]||{ok:0,n:0}; chAgg[c].ok+=x.ok; chAgg[c].n+=x.n; }));
    const today=new Date().setHours(0,0,0,0);
    v.innerHTML=`<div class="card"><div class="row between"><div><h2 style="margin:0">👩‍🏫 ${esc(info.name)} <span class="tag">${perm.owner?'⭐ Quản lý':'🧑‍🏫 Giáo viên'}</span></h2><div class="small muted">Mã lớp <b style="font-size:18px;color:var(--pri)">${code}</b> – học sinh nhập mã này ở mục Lớp học · ${rows.length} bạn · ${rows.filter(r=>r.last>=today).length} bạn luyện hôm nay · tự cập nhật</div></div>
      <div class="row"><button class="btn sm ghost" id="dback">← Quay lại</button><button class="btn sm" id="dcopy">📋 Sao chép báo cáo</button></div></div></div>
     ${perm.owner?rolesHTML(code):''}
     ${bankAdminHTML(code)}
     ${rows.length?`<div class="card"><h3>Cả lớp theo chương</h3><div class="grid g4">${CHAPTERS.concat(Object.entries(CALC_TR).map(([id,t])=>({id,short:t.name,ic:t.ic}))).map(c=>{ const x=chAgg[c.id]; const pct=x&&x.n?Math.round(x.ok/x.n*100):null;
        return `<div class="tile"><b>${c.ic} ${c.short}</b><div class="bar" style="margin:6px 0"><i style="width:${pct||0}%;background:${pct===null?'var(--line)':pct<50?'var(--bad)':pct<75?'var(--acc)':'var(--ok)'}"></i></div><div class="small" style="color:${pct===null?'var(--muted)':pct<50?'var(--bad)':pct<75?'var(--acc)':'var(--ok)'}">${pct===null?'Chưa ai luyện':`Đúng ${pct}% · ${x.n} câu`}</div></div>`; }).join('')}</div>
        <p class="small muted">Đỏ dưới 50% · cam 50–75% · xanh trên 75%. Chương đỏ là chương cả lớp cần ôn lại.</p></div>
      <div class="card"><div class="row between"><h3 style="margin:0">Từng bạn</h3><label class="small">Xếp theo <select id="dsort">${[['t','Hoạt động gần nhất'],['elo','ELO'],['n','Số câu đã làm'],['pct','% đúng'],['name','Tên']].map(([k,t])=>`<option value="${k}" ${CV.sort===k?'selected':''}>${t}</option>`).join('')}</select></label></div>
       <div style="overflow-x:auto;margin-top:8px"><table><tr><th class="l">Bạn</th><th>Lần cuối</th><th>Câu đã làm</th><th>% đúng</th><th>ELO</th><th>T/H/B</th><th class="l">Chương yếu nhất</th><th></th></tr>
       ${rows.map(r=>{ const weak=Object.entries(r.pr||{}).filter(([,x])=>x.n>=3).map(([c,x])=>[c,x.ok/x.n]).sort((a,b)=>a[1]-b[1])[0];
         return `<tr><td class="l">${esc(r.e)} <b>${esc(r.n)}</b></td><td class="small">${r.last?ago(r.last):'chưa luyện'}</td><td>${r.s.n}</td><td><b style="color:${r.s.n?(r.s.pct<50?'var(--bad)':r.s.pct<75?'var(--acc)':'var(--ok)'):'inherit'}">${r.s.n?r.s.pct+'%':'—'}</b></td><td>${r.elo}</td><td class="small">${r.w}/${r.d}/${r.l}</td><td class="l small">${weak?`${chIc(weak[0])} ${chName(weak[0])} (${Math.round(weak[1]*100)}%)`:'—'}</td><td><button class="btn sm ghost" data-det="${r.id}">Chi tiết</button></td></tr>`; }).join('')}</table></div></div>`
     :`<div class="card" style="text-align:center"><div class="big">🕐</div><p>Chưa có bạn nào vào lớp.</p><p class="small muted">Các bạn mở app → <b>👩‍🏫 Lớp học</b> → vai trò Học sinh → nhập mã <b>${code}</b> → Vào lớp.</p></div>`}`;
    bindBankAdmin(v,code);
    $('#dback').onclick=()=>{ if(CV.off){CV.off();CV.off=null;} CV.code=null; CV.data=null; viewClass(v); };
    const ds=$('#dsort'); if(ds) ds.onchange=()=>{ CV.sort=ds.value; draw(); };
    $('#dcopy').onclick=()=>copyText(`📊 ${info.name} (mã ${code}) – ${new Date().toLocaleDateString('vi-VN')}\n`+rows.map((r,i)=>`${i+1}. ${r.e} ${r.n}: ${r.s.n} câu, đúng ${r.s.pct}%, ELO ${r.elo}, ${r.last?'luyện '+ago(r.last):'chưa luyện'}`).join('\n'),'Đã sao chép báo cáo');
    $$('[data-det]',v).forEach(b=>b.onclick=()=>{ const r=m[b.dataset.det]; modal(`<h3>${esc(r.e)} ${esc(r.n)}</h3>${memberHTML(r)}<div class="row" style="justify-content:flex-end;margin-top:10px"><button class="btn" onclick="this.closest('.modal').remove()">Đóng</button></div>`); });
    if(perm.owner){
      $('#rinv').onclick=()=>confirmBox('Tạo mã mời mới? Mã cũ sẽ không dùng được nữa.',async()=>{ await FB.ref(`rooms/${code}/info/inv`).set({gv:invCode(),ph:invCode()}); toast('Đã đổi mã mời'); });
      $('#rcopy').onclick=()=>{ const inv=(CV.info||{}).inv||{}; copyText(`Mời vào lớp "${info.name}" trên app KHTN·7 Đấu trường\n• Mã lớp: ${code}\n• Giáo viên dùng mã mời: ${inv.gv||'?'}\n• Phụ huynh dùng mã mời: ${inv.ph||'?'}\nCách vào: mở app → 👩‍🏫 Lớp học → chọn vai trò → nhập mã lớp và mã mời → Vào lớp.`,'Đã sao chép lời mời, dán vào Zalo gửi đi'); };
      $$('[data-rv]',v).forEach(b=>b.onclick=()=>confirmBox('Thu hồi quyền người này? Lần đồng bộ sau họ sẽ tự rời lớp.',async()=>{ await FB.ref(`rooms/${code}/revoked/${b.dataset.rv}`).set(Date.now()); await FB.ref(`rooms/${code}/staff/${b.dataset.rv}`).remove(); toast('Đã thu hồi'); }));
    }
  };
  if(!CV.off){ const ref=FB.ref(`rooms/${code}/m`); const h=ref.on('value',s=>{ CV.data=s.val()||{}; draw(); });
    const ri=FB.ref(`rooms/${code}/inbox`), hi=ri.on('value',s=>{ CV.inbox=s.val()||{}; if(CV.data) draw(); });
    const rq=FB.ref(`rooms/${code}/q`), hq=rq.on('value',s=>{ CV.qn=Object.keys(s.val()||{}).length; if(CV.data) draw(); });
    const rs=FB.ref(`rooms/${code}/staff`), hs=rs.on('value',s=>{ CV.staff=s.val()||{}; if(CV.data) draw(); });
    const rf=FB.ref(`rooms/${code}/info`), hf=rf.on('value',s=>{ CV.info=s.val()||{}; if(perm.owner&&CV.info.app&&!CV.info.inv) FB.ref(`rooms/${code}/info/inv`).set({gv:invCode(),ph:invCode()}); if(CV.data) draw(); });
    CV.off=()=>{ ref.off('value',h); ri.off('value',hi); rq.off('value',hq); rs.off('value',hs); rf.off('value',hf); CV.staff=null; CV.info=null; };
    v.innerHTML=`<div class="card">⏳ Đang tải lớp ${code}…</div>`; } else draw();
}
function pinSetDialog(p,after){
  const m=modal(`<h3>🔒 Mã PIN cho ${esc(p.emo+' '+p.name)}</h3><p class="small muted">Khi chọn hồ sơ này sẽ phải nhập PIN, để bạn khác trên cùng máy không dùng nhầm. Quên PIN thì nhờ thầy cô xoá hồ sơ và tạo lại.</p>
   <input type="text" id="pp" inputmode="numeric" maxlength="4" placeholder="4 chữ số" value="">
   <div class="row" style="justify-content:space-between;margin-top:12px">${p.pin?'<button class="btn ghost" data-off>Bỏ PIN</button>':'<span></span>'}<div class="row"><button class="btn ghost" data-x>Huỷ</button><button class="btn pri" data-y>Lưu</button></div></div>`);
  $('[data-x]',m).onclick=()=>m.remove();
  const off=$('[data-off]',m); if(off) off.onclick=()=>askPin(p,()=>{ delete p.pin; save(); m.remove(); after(); });
  $('[data-y]',m).onclick=()=>{ const v=$('#pp',m).value.trim(); if(!/^\d{4}$/.test(v)){ toast('PIN gồm 4 chữ số'); return; } const set=()=>{ p.pin=v; save(); m.remove(); toast('Đã đặt PIN'); after(); }; p.pin?askPin(p,set):set(); };
}
function askPin(p,ok){
  if(!p.pin) return ok();
  const m=modal(`<h3>${esc(p.emo+' '+p.name)}</h3><p class="small muted">Nhập mã PIN của hồ sơ</p><input type="password" id="pq" inputmode="numeric" maxlength="4"><div class="row" style="justify-content:flex-end;margin-top:10px"><button class="btn ghost" data-x>Huỷ</button><button class="btn pri" data-y>Vào</button></div>`);
  const go=()=>{ if($('#pq',m).value===p.pin){ m.remove(); ok(); } else { toast('Sai PIN'); $('#pq',m).value=''; } };
  $('[data-x]',m).onclick=()=>m.remove(); $('[data-y]',m).onclick=go; $('#pq',m).onkeydown=e=>{ if(e.key==='Enter') go(); }; setTimeout(()=>$('#pq',m).focus(),50);
}
