// ===================== TAB BÀI TÍNH =====================
const CF={trs:[],grs:['7'],lvs:[],tops:[]}; let CS=null;
const LVN={1:'Cơ bản',2:'Nâng cao',3:'HSG / chuyên'};
function calcTags(c){ return `<span class="tag">${CALC_TR[c.tr].ic} ${CALC_TR[c.tr].name}</span> <span class="tag ${c.g!=='7'?'l2':''}">${CALC_GR[c.g]}</span> <span class="tag ${c.lv>1?'l'+c.lv:''}">${LVN[c.lv]}</span> <span class="small muted">${esc(CTOP[c.t].name)}</span>`; }
function viewCalc(v){
  if(CS) return CS.mode==='exam'?calcExam(v):calcPrac(v);
  const p=curP(); const n=calcPick(CF).length;
  const tops=Object.entries(CTOP).filter(([,t])=>(!CF.trs.length||CF.trs.includes(t.tr))&&(!CF.grs.length||CF.grs.includes(t.g)));
  v.innerHTML=`<div class="card"><h2>🧮 Bài tính – Toán Lý · Toán Hóa · Toán Sinh</h2><p class="small muted" style="margin:0">Bài tự luận có tính toán: các bạn giải ra giấy, <b>nhập đáp số</b> để app chấm, rồi xem <b>lời giải từng bước</b>. Số liệu đổi mỗi lần nên luyện không bao giờ hết bài. Đủ chương trình lớp 7, thêm phần <b>mở rộng</b> lớp 8, lớp 9 và tuyển sinh 10 cho các bạn luyện nâng cao.</p></div>
  <div class="card"><label class="f">Môn</label><div class="row">${Object.entries(CALC_TR).map(([k,t])=>`<span class="tog ${CF.trs.includes(k)?'on':''}" data-ctr="${k}">${t.ic} ${t.name}</span>`).join('')}<span class="small muted">bỏ trống = trộn cả ba</span></div>
   <label class="f">Khối</label><div class="row"><span class="tog ${CF.grs.includes('7')?'on':''}" data-cgr="7">Lớp 7</span><span class="small muted">Mở rộng:</span>${['8','9','10'].map(g=>`<span class="tog ${CF.grs.includes(g)?'on':''}" data-cgr="${g}">${CALC_GR[g]}</span>`).join('')}</div>
   <label class="f">Mức</label><div class="row">${[1,2,3].map(l=>`<span class="tog ${CF.lvs.includes(l)?'on':''}" data-clv="${l}">${LVN[l]}</span>`).join('')}</div>
   <label class="f">Dạng bài (bỏ trống = tất cả)</label><div class="row">${tops.map(([id,t])=>`<span class="tog ${CF.tops.includes(id)?'on':''}" data-ctop="${id}">${CALC_TR[t.tr].ic} ${esc(t.name)}${CF.grs.length===1?'':' · '+CALC_GR[t.g]}</span>`).join('')||'<span class="small muted">Chọn môn / khối</span>'}</div>
   <div class="row" style="margin-top:14px"><span class="small muted">${n} dạng bài khớp lựa chọn</span><span style="flex:1"></span>
    <button class="btn pri" id="cprac" ${n?'':'disabled'}>✍️ Luyện 10 bài</button><button class="btn acc" id="cexam" ${n?'':'disabled'}>📝 Đề tự luận 45 phút</button><button class="btn" id="carena" ${n?'':'disabled'}>⚔️ Đấu bài tính</button></div></div>
  ${p?`<div class="card"><h3>Tiến độ của ${esc(p.emo+' '+p.name)}</h3><div class="grid g3">${Object.entries(CALC_TR).map(([k,t])=>{ const x=p.pr[k]||{ok:0,n:0}; const pct=x.n?Math.round(x.ok/x.n*100):0; return `<div class="tile"><b>${t.ic} ${t.name}</b><div class="bar" style="margin:6px 0"><i style="width:${pct}%"></i></div><div class="small muted">${x.n?`Đúng ${x.ok}/${x.n} bài (${pct}%)`:'Chưa luyện'}</div></div>`; }).join('')}</div></div>`:''}
  <div class="card"><h3>📖 Sổ công thức</h3><p class="small muted">Theo môn và khối đang chọn. Đọc lại trước khi luyện.</p>
   ${['7','8','9','10'].filter(g=>!CF.grs.length||CF.grs.includes(g)).map(g=>{ const ts=tops.filter(([,t])=>t.g===g); return ts.length?`<div class="daycard"><b>${CALC_GR[g]}${g!=='7'?' <span class="tag l2">mở rộng</span>':''}</b>${ts.map(([,t])=>`<div class="mrow"><span>${CALC_TR[t.tr].ic} <b>${esc(t.name)}</b></span><span class="small" style="text-align:right">${esc(t.f)}</span></div>`).join('')}</div>`:''; }).join('')}</div>`;
  const tg=(attr,arr,val)=>{ const i=arr.indexOf(val); if(i>=0) arr.splice(i,1); else arr.push(val); CF.tops=CF.tops.filter(t=>calcPick({trs:CF.trs,grs:CF.grs}).some(g=>g.t===t)); viewCalc(v); };
  $$('[data-ctr]',v).forEach(b=>b.onclick=()=>tg('tr',CF.trs,b.dataset.ctr));
  $$('[data-cgr]',v).forEach(b=>b.onclick=()=>tg('gr',CF.grs,b.dataset.cgr));
  $$('[data-clv]',v).forEach(b=>b.onclick=()=>tg('lv',CF.lvs,+b.dataset.clv));
  $$('[data-ctop]',v).forEach(b=>b.onclick=()=>{ const t=b.dataset.ctop; CF.tops=CF.tops.includes(t)?CF.tops.filter(x=>x!==t):[...CF.tops,t]; viewCalc(v); });
  $('#cprac').onclick=()=>{ CS={mode:'prac',list:calcDeck(CF,10),i:0,ok:0,done:false,input:''}; viewCalc(v); };
  $('#cexam').onclick=()=>{ CS={mode:'exam',list:calcDeck(CF,5),ans:Array(5).fill(''),end:Date.now()+45*60000,done:false}; viewCalc(v); };
  $('#carena').onclick=()=>{ Object.assign(ARF,{bank:'calc',trs:[...CF.trs],grs:[...CF.grs],lvs:[...CF.lvs]}); go('arena'); };
}
function stepsHTML(c){ return `<div class="ex"><b>Lời giải</b><ol style="margin:6px 0 0;padding-left:20px">${c.steps.map(s=>`<li>${esc(s)}</li>`).join('')}</ol><div style="margin-top:6px">Đáp số: <b>${esc(calcFmt(c,c.a))}</b></div></div>`; }
function calcPrac(v){
  const S=CS; const c=S.list[S.i];
  if(!c){ const p=curP(); if(!S.logged){ S.logged=1; logAct(p,'Bài tính',{ch:[...new Set(S.list.map(x=>CALC_TR[x.tr].name))].join(', '),r:S.ok+'/'+S.list.length+' bài đúng'}); save(); }
    v.innerHTML=`<div class="card" style="text-align:center"><div class="big">${S.ok}/${S.list.length}</div><p>bài có đáp số đúng</p><div class="row" style="justify-content:center"><button class="btn pri" id="again">Luyện tiếp 10 bài</button><button class="btn ghost" id="back">Đổi lựa chọn</button></div></div>`;
    $('#again').onclick=()=>{ CS={mode:'prac',list:calcDeck(CF,10),i:0,ok:0}; viewCalc(v); }; $('#back').onclick=()=>{ CS=null; viewCalc(v); }; return; }
  v.innerHTML=`<div class="card"><div class="row between"><span class="small muted">Bài ${S.i+1}/${S.list.length}</span><span class="chip">✅ ${S.ok}</span></div>
   <div style="margin:6px 0">${calcTags(c)}</div><div class="qbox">${esc(c.q)}</div>
   <div class="row"><label class="small"><b>Đáp số</b></label><input type="text" id="cin" inputmode="decimal" autocomplete="off" placeholder="Ví dụ: 12,5" style="flex:1;min-width:140px;width:auto" ${S.res!==undefined?'disabled':''} value="${esc(S.input||'')}"><span class="chip">${esc(c.u||'—')}</span>
    ${S.res===undefined?'<button class="btn pri" id="cchk">Kiểm tra</button><button class="btn ghost" id="csol">Xem lời giải</button>':''}</div>
   <p class="small muted" style="margin:6px 0 0">Làm tròn đến 2 chữ số thập phân nếu cần. Dùng dấu phẩy hoặc dấu chấm cho phần thập phân đều được.</p>
   ${S.res!==undefined?`<div class="ex" style="background:${S.res?'var(--ok-soft)':'var(--bad-soft)'}">${S.res?'✅ Đúng rồi!':S.res===false&&S.input?'❌ Chưa đúng.':'👀 Bạn đã xem lời giải.'}</div>${stepsHTML(c)}<div class="row" style="justify-content:flex-end;margin-top:12px"><button class="btn pri" id="cnext">Bài tiếp →</button></div>`:''}
   <div class="row" style="margin-top:10px"><button class="btn ghost sm" id="cstop">Kết thúc</button></div></div>`;
  const inp=$('#cin');
  const finish=ok=>{ S.res=ok; if(ok) S.ok++; beep(ok); addProgress(curP(),c.tr,ok); save(); calcPrac(v); };
  if(S.res===undefined){ inp.focus(); inp.oninput=()=>S.input=inp.value;
    $('#cchk').onclick=()=>{ const r=calcCheck(c,inp.value); if(r===null){ toast('Nhập một con số nhé'); return; } finish(r); };
    $('#csol').onclick=()=>{ S.input=''; finish(false); };
    inp.onkeydown=e=>{ if(e.key==='Enter') $('#cchk').click(); }; }
  else { const nx=$('#cnext'); nx.onclick=()=>{ S.i++; delete S.res; S.input=''; calcPrac(v); }; nx.focus(); }
  $('#cstop').onclick=()=>{ S.list=S.list.slice(0,S.i+(S.res!==undefined?1:0)); S.i=S.list.length; delete S.res; calcPrac(v); };
}
function calcExam(v){
  const S=CS;
  if(S.done){ const res=S.list.map((c,i)=>calcCheck(c,S.ans[i])===true); const sc=res.filter(Boolean).length; const ten=sc*10/S.list.length;
    const p=curP(); if(!S.saved){ S.saved=1; S.list.forEach((c,i)=>addProgress(p,c.tr,res[i])); logAct(p,'Đề tự luận',{ch:[...new Set(S.list.map(x=>CALC_TR[x.tr].name))].join(', '),r:NF(ten,1)+' điểm ('+sc+'/'+S.list.length+')'}); save(); }
    v.innerHTML=`<div class="card" style="text-align:center"><div class="muted">Điểm phần đáp số</div><div class="big">${NF(ten,1)}<span class="muted" style="font-size:20px">/10</span></div><p class="small muted">Mỗi bài ${NF(10/S.list.length,1)} điểm. Thầy cô chấm thêm phần trình bày trên giấy theo lời giải bên dưới.</p><button class="btn pri" id="enew">Làm đề khác</button></div>
    ${S.list.map((c,i)=>`<div class="card"><div class="row between"><b>Bài ${i+1}</b><span>${res[i]?'✅':'❌'} Bạn ghi: <b>${esc(S.ans[i]||'(bỏ trống)')}</b></span></div><div style="margin:6px 0">${calcTags(c)}</div><div class="qbox" style="font-size:16px">${esc(c.q)}</div>${stepsHTML(c)}</div>`).join('')}`;
    $('#enew').onclick=()=>{ CS=null; viewCalc(v); }; return; }
  v.innerHTML=`<div class="card"><div class="row between"><b id="xclk">⏱</b><button class="btn acc sm" id="xsub">Nộp bài</button></div><p class="small muted" style="margin:6px 0 0">Giải từng bài ra giấy (ghi đủ tóm tắt, công thức, thay số), rồi nhập đáp số vào ô. Hết giờ app tự nộp.</p></div>
   ${S.list.map((c,i)=>`<div class="card"><b>Bài ${i+1}</b> <span class="small muted">(${NF(10/S.list.length,1)} điểm)</span><div style="margin:6px 0">${calcTags(c)}</div><div class="qbox" style="font-size:16px">${esc(c.q)}</div>
     <div class="row"><label class="small"><b>Đáp số</b></label><input type="text" data-xi="${i}" inputmode="decimal" autocomplete="off" value="${esc(S.ans[i])}" style="flex:1;min-width:140px;width:auto"><span class="chip">${esc(c.u||'—')}</span></div></div>`).join('')}`;
  $$('[data-xi]',v).forEach(x=>x.oninput=()=>S.ans[+x.dataset.xi]=x.value);
  const submit=()=>{ clearInterval(iv); S.done=true; calcExam(v); window.scrollTo(0,0); };
  $('#xsub').onclick=()=>{ const left=S.ans.filter(a=>!String(a).trim()).length; if(left) confirmBox(`Còn ${left} bài chưa có đáp số. Nộp bài?`,submit); else submit(); };
  const tick=()=>{ const ms=S.end-Date.now(); if(ms<=0){ toast('Hết giờ! Bài đã được nộp.'); submit(); return; } const el=$('#xclk'); if(el) el.textContent=`⏱ ${Math.floor(ms/60000)}:${String(Math.floor(ms/1000)%60).padStart(2,'0')}`; };
  const iv=setInterval(tick,500); tick(); cleanup=()=>clearInterval(iv);
}
