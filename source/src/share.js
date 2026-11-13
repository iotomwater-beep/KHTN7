// ===================== KHO CÂU CHUNG CỦA LỚP (đồng bộ hai chiều) =====================
// rooms/<mã lớp>/q/<id>      câu đã duyệt – mọi máy trong lớp bấm "Cập nhật" là nhận về (vào Câu của tôi)
// rooms/<mã lớp>/inbox/<id>  câu thành viên gửi lên – thầy cô duyệt thì chuyển sang q
// Bản offline vẫn dùng được: chỉ lúc bấm Cập nhật / Gửi mới cần mạng.
function shareCode(){ const p=curP(); return (p&&p.cls)||(DB.profiles.find(x=>x.cls)||{}).cls||((DB.adminClasses||[])[0]||{}).code||null; }
const qClean=q=>({ch:q.ch,lv:q.lv,src:q.src||'khac',note:(q.note||'').slice(0,60),q:String(q.q).slice(0,2000),opts:q.opts.map(o=>String(o).slice(0,300)),ex:String(q.ex||'').slice(0,1000)});
async function bankPull(code,quiet){
  await fbInit(); const s=await FB.ref(`rooms/${code}/q`).get(); const bank=s.val()||{}; DB.skipSid=DB.skipSid||[];
  let add=0, upd=0, del=0;
  for(const [sid,x] of Object.entries(bank)){ if(!x||!x.q||!Array.isArray(x.opts)||x.opts.length!==4) continue; if(DB.skipSid.includes(sid)) continue;
    const cur=DB.myQ.find(q=>q.sid===sid);
    if(cur){ if(cur.q!==x.q||JSON.stringify(cur.opts)!==JSON.stringify(x.opts)||cur.ex!==x.ex){ Object.assign(cur,qClean(x)); upd++; } }
    else if(!DB.myQ.some(q=>q.q===x.q)){ DB.myQ.push(Object.assign(qClean(x),{id:uid(),sid,shared:code,from:x.from||''})); add++; } }
  const before=DB.myQ.length; DB.myQ=DB.myQ.filter(q=>!(q.shared===code&&!bank[q.sid])); del=before-DB.myQ.length;
  DB.pulled=DB.pulled||{}; DB.pulled[code]=Date.now(); save();
  if(!quiet||add||upd||del) toast(add||upd||del?`Đã cập nhật kho lớp: +${add} câu mới${upd?`, ${upd} câu được sửa`:''}${del?`, ${del} câu thầy cô đã bỏ`:''}`:'Kho câu đã mới nhất',3500);
  return {add,upd,del,total:Object.keys(bank).length};
}
async function bankPush(code,direct){ // direct = thầy cô đưa thẳng vào kho, không qua duyệt
  await fbInit(); const p=curP(); const list=DB.myQ.filter(q=>!q.shared&&!(q.sentTo||[]).includes(code));
  for(const q of list){ const id=uid(); const item=Object.assign(qClean(q),{from:p?p.emo+' '+p.name:'Thầy cô',t:Date.now()});
    await FB.ref(`rooms/${code}/${direct?'q':'inbox'}/${id}`).set(item);
    if(direct){ q.shared=code; q.sid=id; } else { q.sentTo=(q.sentTo||[]).concat(code); } }
  save(); toast(list.length?(direct?`Đã đưa ${list.length} câu vào kho lớp`:`Đã gửi ${list.length} câu, chờ thầy cô duyệt`):'Không có câu mới để gửi',3500); return list.length;
}
function bankBox(id){
  const code=shareCode(); if(!code) return `<div class="card" id="${id}"><h3>📚 Kho câu chung của lớp</h3><p class="small muted" style="margin:0">Vào một lớp ở mục 👩‍🏫 Lớp học để nhận câu hỏi thầy cô cập nhật và gửi câu của mình lên cho cả lớp.</p></div>`;
  const unsent=DB.myQ.filter(q=>!q.shared&&!(q.sentTo||[]).includes(code)).length, shared=DB.myQ.filter(q=>q.shared===code).length, t=(DB.pulled||{})[code];
  return `<div class="card" id="${id}"><h3>📚 Kho câu chung – lớp ${code}</h3><p class="small muted" style="margin:0 0 10px">Máy này có ${shared} câu từ kho lớp · cập nhật lần cuối: ${t?ago(t):'chưa'}. Cần mạng lúc bấm; ngoài ra app vẫn chạy offline.</p>
   <div class="row"><button class="btn pri" data-bpull>⬇️ Cập nhật câu hỏi mới</button><button class="btn" data-bpush ${unsent?'':'disabled'}>⬆️ Gửi ${unsent} câu của tôi lên lớp</button></div>
   <p class="small muted" style="margin:8px 0 0">${(()=>{ const cp=curP(); return (cp&&cp.cls===code&&(cp.role==='gv'||cp.role==='owner'))||(DB.adminClasses||[]).some(c=>c.code===code)?'Bạn là giáo viên / quản lý: câu gửi lên vào thẳng kho lớp, không cần duyệt.':'Câu gửi lên sẽ chờ thầy cô duyệt rồi mới đến máy các bạn khác.'; })()}</p></div>`;
}
function bindBankBox(id,after){ const r=$('#'+id); if(!r) return; const code=shareCode(); if(!code) return;
  const run=async(fn,b)=>{ b.disabled=true; try{ await fn(); }catch(e){ toast('Chưa kết nối được máy chủ. Mở file đã tải về bằng Chrome và kiểm tra mạng.',4500); } after(); };
  const cp=curP(); const direct=!!(cp&&cp.cls===code&&(cp.role==='gv'||cp.role==='owner'))||(DB.adminClasses||[]).some(c=>c.code===code);
  const a=$('[data-bpull]',r), b=$('[data-bpush]',r); if(a) a.onclick=()=>run(()=>bankPull(code),a); if(b) b.onclick=()=>run(()=>bankPush(code,direct),b); }
// Phần của thầy cô trong bảng lớp
function bankAdminHTML(code){ const inbox=Object.entries(CV.inbox||{}).sort((a,b)=>(a[1].t||0)-(b[1].t||0)); const mine=DB.myQ.filter(q=>!q.shared).length;
  return `<div class="card"><div class="row between"><h3 style="margin:0">📚 Kho câu chung của lớp (${CV.qn||0} câu)</h3><div class="row"><button class="btn sm" id="bkmine" ${mine?'':'disabled'}>⬆️ Đưa ${mine} câu của tôi vào kho</button><button class="btn sm ghost" id="bkpull">⬇️ Lấy kho về máy này</button></div></div>
   <p class="small muted">Các bạn bấm "Cập nhật câu hỏi mới" ở Câu của tôi hoặc Lớp học là nhận câu trong kho. Câu các bạn gửi lên nằm ở đây chờ duyệt.</p>
   ${inbox.length?`<div class="row between"><b>Chờ duyệt (${inbox.length})</b><button class="btn sm pri" id="bkall">Duyệt tất cả</button></div>${inbox.map(([k,x])=>`<div class="mrow"><div><div class="small muted">${esc(x.from||'')} · ${chIc(x.ch)} ${esc(chName(x.ch))} · ${esc((SRC[x.src]||x.src||''))}${x.note?' · '+esc(x.note):''}</div><div>${esc(x.q)}</div><div class="small" style="color:var(--ok)">✔ ${esc(x.opts&&x.opts[0])}</div><div class="small muted">✘ ${esc((x.opts||[]).slice(1).join(' · '))}</div></div><div class="row"><button class="btn sm pri" data-ok="${k}">Duyệt</button><button class="btn sm ghost" data-no="${k}">Bỏ</button></div></div>`).join('')}`:'<p class="small muted">Không có câu nào chờ duyệt.</p>'}</div>`; }
function bindBankAdmin(v,code){
  const approve=async k=>{ const x=CV.inbox[k]; if(!x) return; await FB.ref(`rooms/${code}/q/${k}`).set(x); await FB.ref(`rooms/${code}/inbox/${k}`).remove(); };
  $$('[data-ok]',v).forEach(b=>b.onclick=async()=>{ b.disabled=true; await approve(b.dataset.ok); });
  $$('[data-no]',v).forEach(b=>b.onclick=()=>confirmBox('Bỏ câu này?',()=>FB.ref(`rooms/${code}/inbox/${b.dataset.no}`).remove()));
  const all=$('#bkall',v); if(all) all.onclick=async()=>{ all.disabled=true; for(const k of Object.keys(CV.inbox||{})) await approve(k); toast('Đã duyệt tất cả'); };
  const mine=$('#bkmine',v); if(mine) mine.onclick=async()=>{ mine.disabled=true; await bankPush(code,true); };
  $('#bkpull',v).onclick=async()=>{ await bankPull(code); };
}
