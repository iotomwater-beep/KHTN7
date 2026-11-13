// ===================== NẠP TÀI LIỆU → BẢNG CÂU HỎI =====================
// Cách 1 (không cần AI, chạy offline): tách câu trắc nghiệm có sẵn trong đề (Câu 1… A. B. C. D. + đáp án).
// Cách 2 (cần AI): Claude đọc tài liệu/ảnh trang sách rồi soạn câu mới, hoặc tách đề trình bày lộn xộn.
const CDN={pdf:'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js',pdfw:'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js',zip:'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js'};
const MK1='⟦', MK2='⟧'; // đánh dấu chữ được gạch chân / tô màu trong file Word (thường là đáp án đúng)
let IMP=null; // {name, text, images:[], items:[], busy}

// ---------- Đọc file ----------
async function readDocx(file){
  if(!window.JSZip) await loadScript(CDN.zip);
  const zip=await JSZip.loadAsync(await file.arrayBuffer()); const xml=await zip.file('word/document.xml').async('string');
  const doc=new DOMParser().parseFromString(xml,'application/xml'); const W='http://schemas.openxmlformats.org/wordprocessingml/2006/main';
  const out=[];
  for(const p of doc.getElementsByTagNameNS(W,'p')){
    let line='';
    for(const r of p.getElementsByTagNameNS(W,'r')){
      let t=''; for(const n of r.childNodes){ if(n.localName==='t') t+=n.textContent; else if(n.localName==='tab') t+='\t'; else if(n.localName==='br') t+='\n'; }
      if(!t) continue;
      const pr=r.getElementsByTagNameNS(W,'rPr')[0]; let mark=false;
      if(pr){ const u=pr.getElementsByTagNameNS(W,'u')[0], c=pr.getElementsByTagNameNS(W,'color')[0], h=pr.getElementsByTagNameNS(W,'highlight')[0];
        if(u&&u.getAttributeNS(W,'val')!=='none') mark=true;
        if(c){ const v=(c.getAttributeNS(W,'val')||'').toLowerCase(); if(v&&v!=='auto'&&v!=='000000') mark=true; }
        if(h&&h.getAttributeNS(W,'val')!=='none') mark=true; }
      line+=mark&&t.trim()?MK1+t+MK2:t;
    }
    out.push(line.split(MK2+MK1).join(''));
  }
  return out.join('\n');
}
async function readPdf(file){
  if(!window.pdfjsLib) await loadScript(CDN.pdf);
  pdfjsLib.GlobalWorkerOptions.workerSrc=CDN.pdfw;
  const pdf=await pdfjsLib.getDocument({data:new Uint8Array(await file.arrayBuffer())}).promise; const pages=[];
  for(let i=1;i<=pdf.numPages;i++){ const pg=await pdf.getPage(i); const tc=await pg.getTextContent(); let lastY=null, line='', lines=[];
    for(const it of tc.items){ const y=Math.round(it.transform[5]); if(lastY!==null&&Math.abs(y-lastY)>3){ lines.push(line); line=''; } line+=it.str+(it.hasEOL?'':''); lastY=y; if(it.hasEOL){ lines.push(line); line=''; lastY=null; } }
    if(line) lines.push(line); pages.push(lines.join('\n')); }
  return pages.join('\n');
}
async function readAnyFile(file){
  const n=file.name.toLowerCase();
  if(n.endsWith('.docx')) return {text:await readDocx(file)};
  if(n.endsWith('.pdf')) return {text:await readPdf(file)};
  if(/\.(png|jpe?g|webp|gif)$/.test(n)||file.type.startsWith('image/')) return {image:file};
  if(n.endsWith('.doc')) throw new Error('File .doc (Word cũ) chưa đọc được. Mở bằng Word và Lưu thành .docx nhé.');
  return {text:await file.text()};
}

// ---------- Tách câu có sẵn (không cần AI) ----------
const CH_KW={c0:['kĩ năng','kỹ năng','dự báo','phân loại','đo','báo cáo','thí nghiệm','đồng hồ'],c1:['nguyên tử','proton','electron','neutron','hạt nhân','nguyên tố','bảng tuần hoàn','chu kì','nhóm','amu','kí hiệu'],
 c2:['phân tử','đơn chất','hợp chất','liên kết','ion','cộng hoá trị','cộng hóa trị','hoá trị','hóa trị','công thức hoá học','công thức hóa học','khối lượng phân tử'],c3:['tốc độ','vận tốc','quãng đường','km/h','m/s','đồ thị','chuyển động'],
 c4:['âm','tần số','biên độ','tiếng vang','siêu âm','hạ âm','dao động','tiếng ồn','hz'],c5:['ánh sáng','gương','phản xạ','tia sáng','bóng tối','ảnh ảo','tia tới','pháp tuyến'],c6:['nam châm','từ trường','la bàn','cực bắc','cực nam','đường sức','nam châm điện'],
 c7:['quang hợp','hô hấp','khí khổng','diệp lục','trao đổi chất','mạch gỗ','mạch rây','thoát hơi nước','trao đổi khí','dinh dưỡng','glucose'],c8:['cảm ứng','hướng sáng','hướng nước','tập tính','hướng tiếp xúc','hướng hoá','hướng hóa'],
 c9:['sinh trưởng','phát triển','mô phân sinh','biến thái','vòng đời'],c10:['sinh sản','giao tử','thụ phấn','thụ tinh','hợp tử','nảy chồi','phân đôi','giâm','chiết','ghép','nuôi cấy mô','nhị','nhuỵ','nhụy']};
function guessCh(t){ t=t.toLowerCase(); let best='c0',bs=0; for(const [c,ks] of Object.entries(CH_KW)){ let s=0; ks.forEach(k=>{ if(t.includes(k)) s+=k.length>4?2:1; }); if(s>bs){bs=s;best=c;} } return bs?best:(IMP&&IMP.defCh)||'c1'; }
function parseKey(txt){ // bảng đáp án dạng "1-B 2.C 3:A", "1B 2C", hoặc hai dòng số / chữ
  const map={}; let m; const re=/(\d{1,3})[ \t]*[-.:)–]?[ \t]*([A-Da-d])(?![A-Za-zÀ-ỹ])/g; while((m=re.exec(txt))) map[+m[1]]=m[2].toUpperCase();
  const lines=txt.split('\n').map(l=>l.trim()).filter(Boolean);
  for(let i=0;i<lines.length-1;i++){ const nums=lines[i].match(/\d+/g), lets=lines[i+1].match(/\b[A-D]\b/g);
    if(nums&&lets&&nums.length>=2&&nums.length===lets.length&&/^[\d\s|.,;]+$/.test(lines[i])) nums.forEach((n,k)=>{ if(!map[+n]) map[+n]=lets[k]; }); }
  return map;
}
function splitOpts(s){ // "A. x  B. y  C. z  D. w" → mảng dòng
  return s.replace(/([^\n])[ \t]+(?=[*⟦]?[B-D][.)][ \t])/g,'$1\n').replace(/([^\n])[ \t]+(?=⟦[A-D][.)])/g,'$1\n');
}
function extractQuestions(raw){
  let text='\n'+raw.replace(/\r/g,'').replace(/\u00a0/g,' ').replace(/\t/g,'  ');
  text=text.replace(/⟦\s*([A-D])\s*([.)])\s*⟧/g,'*$1$2').replace(/⟦\s*([A-D])\s*⟧\s*([.)])/g,'*$1$2');
  // tách phần đáp án ở cuối (nếu có)
  let key={};
  { const re=/\n[^\S\n]*⟦?[^\S\n]*(?:bảng[^\S\n]+)?(?:đáp[^\S\n]*án|hướng[^\S\n]*dẫn[^\S\n]*chấm)[^\S\n]*⟧?[^\S\n]*[:.]?[^\S\n]*(?=\n|\d)/gi; let last=null, mm;
    while((mm=re.exec(text))) last=mm;
    if(last&&last.index>text.length*0.3){ const k=parseKey(text.slice(last.index+last[0].length).replace(/[⟦⟧*]/g,'')); if(Object.keys(k).length>=2){ key=k; text=text.slice(0,last.index); } } }
  // cắt theo "Câu N" (hoặc "N." đầu dòng)
  let parts=[]; const reC=/(?:^|\n)\s*⟦?\s*(?:câu|bài)\s*(\d{1,3})\s*⟧?\s*[:.)]?/gi; let idx=[], m;
  while((m=reC.exec(text))) idx.push({i:m.index,end:reC.lastIndex,n:+m[1]});
  if(idx.length<2){ idx=[]; const reN=/(?:^|\n)\s*(\d{1,3})\s*[.)]\s+(?=\S)/g; while((m=reN.exec(text))) idx.push({i:m.index,end:reN.lastIndex,n:+m[1]}); }
  idx.forEach((o,k)=>parts.push({n:o.n,body:text.slice(o.end,k+1<idx.length?idx[k+1].i:text.length)}));
  const items=[];
  for(const p of parts){
    const lines=splitOpts(p.body).split('\n').map(l=>l.trim()).filter(Boolean);
    let q=[], opts={}, marked={}, cur=null, inline=null, ex='';
    for(let l of lines){
      let mm;
      if((mm=l.match(/^(?:⟦)?\s*(?:đáp\s*án|chọn|đ\/a)\s*(?:đúng)?\s*[:.]?\s*(?:⟦)?\s*([A-D])\b/i))){ inline=mm[1].toUpperCase(); cur=null; continue; }
      if((mm=l.match(/^(?:giải\s*thích|lời\s*giải|hướng\s*dẫn|hd)\s*[:.]?\s*(.*)$/i))){ ex=mm[1].replace(/[⟦⟧]/g,''); cur='ex'; continue; }
      if((mm=l.match(/^([*⟦]*)\s*([A-Da-d])\s*[.)]\s*(.*)$/))&&(Object.keys(opts).length||q.length)){ const L=mm[2].toUpperCase(); let body=mm[3]; const star=mm[1].includes('*'); const mk=mm[1].includes(MK1)||(body.startsWith(MK1)&&body.endsWith(MK2))||(mm[1].includes(MK1)&&body.includes(MK2));
        if(opts[L]&&L==='A') break; opts[L]=body.replace(/[⟦⟧]/g,'').replace(/^\*+/,'').trim(); if(star||mk) marked[L]=1; cur=L; continue; }
      if(cur==='ex') ex+=' '+l.replace(/[⟦⟧]/g,'');
      else if(cur&&opts[cur]!==undefined) opts[cur]+=' '+l.replace(/[⟦⟧]/g,'');
      else q.push(l.replace(/[⟦⟧]/g,''));
    }
    const qt=q.join('\n').trim(); const L4=['A','B','C','D'];
    if(!qt||L4.some(k=>!opts[k])) continue;
    let ans=inline||key[p.n]||null; const mks=Object.keys(marked); if(!ans&&mks.length===1) ans=mks[0];
    items.push({n:p.n,q:qt,o:L4.map(k=>opts[k].trim()),ans:ans?L4.indexOf(ans):-1,ex:ex.trim(),ch:guessCh(qt+' '+qt+' '+qt+' '+L4.map(k=>opts[k]).join(' ')),lv:IMP&&IMP.defLv||1,use:true});
  }
  return items;
}

// ---------- Nhờ AI ----------
function aiAvailable(){ return !!(SAMPLE||DB.aiKey); }
let SAMPLE=null; (async()=>{ for(let i=0;i<20&&!(window.claude&&window.claude.use);i++) await new Promise(r=>setTimeout(r,250)); try{ if(window.claude&&window.claude.use){ SAMPLE=await window.claude.use('sample'); if(SAMPLE&&TAB==='myq'&&IMP) viewMyQ($('#view')); } }catch(e){} })();
function aiPrompt(mode,n,text){
  const chs=CHAPTERS.map(c=>`${c.id}: ${c.name}`).join('\n');
  const task=mode==='gen'
   ? `Dựa CHỈ vào tài liệu dưới đây, soạn ${n} câu hỏi trắc nghiệm 4 lựa chọn (1 đáp án đúng) cho học sinh lớp 7, môn Khoa học tự nhiên, theo SGK Kết nối tri thức. Trộn mức độ: khoảng 50% mức 1 (nhận biết, thông hiểu), 30% mức 2 (vận dụng, tư duy), 20% mức 3 (dạng học sinh giỏi, có tính toán hoặc suy luận nhiều bước) nếu tài liệu cho phép. Câu phải chính xác về khoa học, rõ ràng, đáp án sai phải hợp lí nhưng chắc chắn sai. Dùng tên nguyên tố, chất theo SGK mới (oxygen, hydrogen, sodium, carbon dioxide…). Không hỏi về số trang, tên sách.`
   : `Tài liệu dưới đây là một đề hoặc bài tập trắc nghiệm. Hãy TÁCH NGUYÊN VĂN các câu trắc nghiệm 4 lựa chọn có trong đó (tối đa ${n} câu), không soạn thêm câu mới, không sửa nội dung. Nếu tài liệu có đáp án thì dùng đáp án đó; nếu không có, tự giải để xác định đáp án đúng. Bỏ qua câu tự luận.`;
  return `${task}
Với mỗi câu, xếp vào một chương:
${chs}
và mức: 1, 2 hoặc 3. Viết lời giải thích ngắn (1–2 câu) bằng tiếng Việt.
Trả về DUY NHẤT một mảng JSON, không có chữ nào khác, dạng:
[{"q":"câu hỏi","correct":"đáp án đúng","wrong":["sai 1","sai 2","sai 3"],"ex":"giải thích","ch":"c3","lv":1}]
${text?`\n=== TÀI LIỆU ===\n${text}\n=== HẾT ===`:'\nTài liệu là (các) ảnh đính kèm.'}`;
}
async function blobToB64(b){ const buf=new Uint8Array(await b.arrayBuffer()); let s=''; for(let i=0;i<buf.length;i+=0x8000) s+=String.fromCharCode.apply(null,buf.subarray(i,i+0x8000)); return btoa(s); }
async function callAI(prompt,images,onText){
  if(SAMPLE){ const opts={modelTier:'default',onText}; if(images&&images.length) opts.images=images; const r=await SAMPLE(prompt,opts); return r.text; }
  if(!DB.aiKey) throw new Error('Chưa có khoá API');
  const content=[]; for(const im of images||[]) content.push({type:'image',source:{type:'base64',media_type:im.type||'image/jpeg',data:await blobToB64(im)}});
  content.push({type:'text',text:prompt});
  const res=await fetch('https://api.anthropic.com/v1/messages',{method:'POST',headers:{'content-type':'application/json','x-api-key':DB.aiKey,'anthropic-version':'2023-06-01','anthropic-dangerous-direct-browser-access':'true'},
    body:JSON.stringify({model:DB.aiModel||'claude-sonnet-5-5',max_tokens:8000,messages:[{role:'user',content}]})});
  const j=await res.json(); if(!res.ok) throw new Error((j.error&&j.error.message)||('Lỗi '+res.status));
  return j.content.map(c=>c.text||'').join('');
}
function parseAIJson(t){ const a=t.indexOf('['), b=t.lastIndexOf(']'); if(a<0||b<a) throw new Error('AI không trả về đúng định dạng'); const arr=JSON.parse(t.slice(a,b+1));
  return arr.filter(x=>x&&x.q&&x.correct&&Array.isArray(x.wrong)&&x.wrong.length>=3).map(x=>{ const o=shuffle([String(x.correct),...x.wrong.slice(0,3).map(String)]);
    return {q:String(x.q),o,ans:o.indexOf(String(x.correct)),ex:String(x.ex||''),ch:CHAPTERS.some(c=>c.id===x.ch)?x.ch:guessCh(x.q),lv:[1,2,3].includes(+x.lv)?+x.lv:1,use:true,ai:true}; }); }

// ---------- Giao diện ----------
function viewImport(v){
  const I=IMP; const ai=aiAvailable();
  const hasDoc=(I.text&&I.text.trim())||I.images.length;
  v.innerHTML=`<div class="card"><div class="row between"><h2 style="margin:0">📥 Nạp tài liệu → bảng câu hỏi</h2><button class="btn sm ghost" id="ib">← Câu của tôi</button></div>
   <p class="small muted">Nạp đề thi, phiếu bài tập, trang sách (Word .docx, PDF, ảnh chụp, hoặc dán chữ). App tách ra bảng câu hỏi để anh/chị <b>soát lại</b> rồi lưu vào Câu của tôi.</p>
   <div class="row"><label class="btn pri">📂 Chọn file (docx, pdf, txt, ảnh)<input type="file" id="ifile" multiple accept=".docx,.pdf,.txt,.md,image/*" class="hide"></label><span class="small muted" id="iname">${esc(I.name||'')}</span></div>
   <label class="f">…hoặc dán nội dung vào đây</label><textarea id="itext" style="min-height:140px" placeholder="Dán đề / bài học vào đây">${esc(I.text||'')}</textarea>
   ${I.images.length?`<div class="small">🖼 ${I.images.length} ảnh đã nạp ${ai?'(sẽ gửi cho AI đọc)':'<span style="color:var(--bad)">– ảnh cần AI mới đọc được</span>'} <button class="btn sm ghost" id="iclrimg">Bỏ ảnh</button></div>`:''}
   <div class="grid g3" style="margin-top:8px"><div><label class="f">Nguồn</label><select id="isrc">${Object.entries(SRC).map(([k,t])=>`<option value="${k}" ${I.src===k?'selected':''}>${t}</option>`).join('')}</select></div>
    <div><label class="f">Ghi chú nguồn</label><input type="text" id="inote" value="${esc(I.note||'')}" placeholder="Ví dụ: HSG huyện 2024, Bài 12"></div>
    <div><label class="f">Mức mặc định khi tách đề</label><select id="ilv">${[1,2,3].map(l=>`<option value="${l}" ${I.defLv===l?'selected':''}>${LEVELS[l].name}</option>`).join('')}</select></div></div></div>
  <div class="grid g2">
   <div class="card"><h3>① Tách câu có sẵn trong đề</h3><p class="small muted">Không cần AI, chạy cả khi không có mạng. Nhận dạng "Câu 1…", các lựa chọn A. B. C. D. (kể cả nằm cùng dòng), đáp án ghi "Đáp án: B", bảng đáp án cuối đề (1-B 2-C…), dấu * trước đáp án, hoặc đáp án được <u>gạch chân</u>/tô màu trong file Word.</p>
    <button class="btn pri" id="iparse" ${I.text&&I.text.trim()?'':'disabled'}>Tách câu hỏi</button></div>
   <div class="card"><h3>② Nhờ AI ${ai?'<span class="tag">sẵn sàng</span>':'<span class="tag l3">chưa bật</span>'}</h3>
    ${ai?`<p class="small muted">AI đọc tài liệu hoặc ảnh trang sách, rồi <b>soạn câu mới</b> hoặc <b>tách đề</b> trình bày lộn xộn. Luôn soát lại trước khi lưu: AI có thể sai.</p>
     <div class="row"><label class="small">Số câu <select id="in">${[5,10,15,20,30].map(n=>`<option ${n===(I.n||10)?'selected':''}>${n}</option>`).join('')}</select></label>
     <button class="btn acc" id="igen" ${hasDoc?'':'disabled'}>✨ Soạn câu mới</button><button class="btn" id="iext" ${hasDoc?'':'disabled'}>🧩 AI tách đề</button></div>
     ${SAMPLE?'':`<p class="small muted">Đang dùng khoá API riêng (${esc((DB.aiModel||'claude-sonnet-5-5'))}). <button class="btn sm ghost" id="ikey">Đổi khoá</button></p>`}`
    :`<p class="small muted">Bản tải về không có sẵn AI. Người lớn có thể nhập <b>khoá API Anthropic</b> của mình (tính phí theo lượt dùng, khoá chỉ lưu trên máy này). Không nhập khoá trên máy của các bé. Hoặc mở bản trên Claude, hoặc gửi tài liệu cho Claude trong khung chat và dùng 📥 Nhập dữ liệu.</p><button class="btn" id="ikey">🔑 Nhập khoá API</button>`}
    <div id="iai" class="small" style="margin-top:8px"></div></div></div>
  <div id="ires"></div>`;
  const sync=()=>{ I.text=$('#itext').value; I.src=$('#isrc').value; I.note=$('#inote').value; I.defLv=+$('#ilv').value; };
  $('#ib').onclick=()=>{ IMP=null; viewMyQ(v); };
  $('#itext').oninput=()=>{ sync(); $('#iparse').disabled=!I.text.trim(); const g=$('#igen'),x=$('#iext'); if(g){g.disabled=!(I.text.trim()||I.images.length); x.disabled=g.disabled;} };
  ['#isrc','#inote','#ilv'].forEach(s=>$(s).onchange=sync);
  $('#ifile').onchange=async e=>{ const fs=[...e.target.files]; if(!fs.length) return; $('#iname').textContent='⏳ Đang đọc…'; let txt=[];
    for(const f of fs){ try{ const r=await readAnyFile(f); if(r.text) txt.push(r.text); if(r.image) I.images.push(r.image); }catch(err){ toast(f.name+': '+(err.message||err),4000); } }
    sync(); I.text=[I.text,...txt].filter(s=>s&&s.trim()).join('\n\n'); I.name=fs.map(f=>f.name).join(', '); if(!I.note) I.note=fs[0].name.replace(/\.[^.]+$/,'').slice(0,60);
    viewImport(v); if(txt.length&&!txt.join('').trim()) toast('File không có chữ (có thể là bản scan). Dùng AI đọc ảnh nhé.',4000); };
  const ci=$('#iclrimg'); if(ci) ci.onclick=()=>{ I.images=[]; viewImport(v); };
  $('#iparse').onclick=()=>{ sync(); const items=extractQuestions(I.text); if(!items.length){ toast('Không tìm thấy câu trắc nghiệm theo mẫu. Thử ② Nhờ AI tách đề.',4000); return; } I.items=items; viewImport(v); toast(`Tách được ${items.length} câu`); };
  const kb=$('#ikey'); if(kb) kb.onclick=()=>keyDialog(()=>viewImport(v));
  const run=async mode=>{ sync(); I.n=+$('#in').value; const st=$('#iai'); const btns=[$('#igen'),$('#iext')]; btns.forEach(b=>b.disabled=true);
    try{ const text=(I.text||'').trim(); const chunks=[]; for(let i=0;i<text.length;i+=9000) chunks.push(text.slice(i,i+9000)); if(!chunks.length) chunks.push('');
      const use=chunks.slice(0,4); let all=[];
      for(let k=0;k<use.length;k++){ const per=Math.ceil(I.n/use.length); st.textContent=`⏳ AI đang ${mode==='gen'?'soạn':'tách'} câu… (phần ${k+1}/${use.length})`;
        const out=await callAI(aiPrompt(mode,per,use[k]),k===0?I.images:[],({text})=>{ st.textContent=`⏳ AI đang viết… ${text.length} kí tự`; });
        all=all.concat(parseAIJson(out)); }
      if(chunks.length>4) toast('Tài liệu dài, AI chỉ đọc khoảng 36 000 kí tự đầu',4000);
      I.items=(I.items||[]).concat(all); st.textContent=`✅ AI tạo ${all.length} câu. Soát lại bên dưới.`; viewImport(v);
    }catch(e){ st.innerHTML=`<span style="color:var(--bad)">❌ ${esc(e.message||e.code||e)}</span>`; btns.forEach(b=>b.disabled=false); } };
  const g=$('#igen'); if(g){ g.onclick=()=>run('gen'); $('#iext').onclick=()=>run('ext'); }
  renderReview($('#ires'),v);
}
function renderReview(el,v){
  const I=IMP; if(!I.items||!I.items.length){ el.innerHTML=''; return; }
  const ok=I.items.filter(x=>x.use&&x.ans>=0).length, noAns=I.items.filter(x=>x.use&&x.ans<0).length;
  el.innerHTML=`<div class="card"><div class="row between"><h3 style="margin:0">Soát lại ${I.items.length} câu</h3><div class="row"><button class="btn sm ghost" id="rall">Chọn/bỏ tất cả</button><button class="btn sm ghost" id="rclr">Xoá bảng</button></div></div>
   <p class="small muted">Bấm vào ô chữ để sửa. Chọn đáp án đúng ở cột ✔. Câu thiếu đáp án sẽ không được lưu.${noAns?` <b style="color:var(--bad)">${noAns} câu chưa có đáp án.</b>`:''}</p>
   ${I.items.map((x,i)=>`<div class="daycard" style="${x.use?'':'opacity:.5'}"><div class="row between"><label class="row small"><input type="checkbox" data-use="${i}" ${x.use?'checked':''}> <b>Câu ${i+1}</b>${x.ai?' <span class="tag my">AI</span>':''}</label>
     <div class="row"><select data-ch="${i}">${CHAPTERS.map(c=>`<option value="${c.id}" ${x.ch===c.id?'selected':''}>${c.ic} ${c.short}</option>`).join('')}</select><select data-lv="${i}">${[1,2,3].map(l=>`<option value="${l}" ${x.lv===l?'selected':''}>${LEVELS[l].tag}</option>`).join('')}</select></div></div>
     <div contenteditable="true" class="qbox" style="font-size:15px;margin:6px 0;padding:4px 6px;border:1px dashed var(--line);border-radius:8px" data-q="${i}">${esc(x.q)}</div>
     ${x.o.map((o,j)=>`<div class="row" style="margin:3px 0;flex-wrap:nowrap"><label class="tog ${x.ans===j?'on':''}" style="flex:none"><input type="radio" class="hide" name="a${i}" data-ans="${i}" value="${j}">${'ABCD'[j]} ${x.ans===j?'✔':''}</label><div contenteditable="true" style="flex:1;padding:4px 6px;border:1px dashed var(--line);border-radius:8px" data-o="${i}:${j}">${esc(o)}</div></div>`).join('')}
     <div contenteditable="true" class="small muted" style="margin-top:4px;padding:4px 6px;border:1px dashed var(--line);border-radius:8px" data-ex="${i}" data-ph="Giải thích (tuỳ chọn)">${esc(x.ex||'')}</div></div>`).join('')}
   <div class="row" style="justify-content:flex-end;position:sticky;bottom:8px"><button class="btn pri" id="rsave">💾 Lưu ${ok} câu vào Câu của tôi</button></div></div>`;
  const I2=I.items;
  $$('[data-use]',el).forEach(c=>c.onchange=()=>{ I2[+c.dataset.use].use=c.checked; renderReview(el,v); });
  $$('[data-ch]',el).forEach(s=>s.onchange=()=>I2[+s.dataset.ch].ch=s.value);
  $$('[data-lv]',el).forEach(s=>s.onchange=()=>I2[+s.dataset.lv].lv=+s.value);
  $$('[data-ans]',el).forEach(r=>r.onchange=()=>{ I2[+r.dataset.ans].ans=+r.value; renderReview(el,v); });
  $$('[data-q]',el).forEach(d=>d.oninput=()=>I2[+d.dataset.q].q=d.innerText.trim());
  $$('[data-ex]',el).forEach(d=>d.oninput=()=>I2[+d.dataset.ex].ex=d.innerText.trim());
  $$('[data-o]',el).forEach(d=>d.oninput=()=>{ const [i,j]=d.dataset.o.split(':').map(Number); I2[i].o[j]=d.innerText.trim(); });
  $('#rall').onclick=()=>{ const all=I2.every(x=>x.use); I2.forEach(x=>x.use=!all); renderReview(el,v); };
  $('#rclr').onclick=()=>confirmBox('Xoá bảng câu hỏi đang soát?',()=>{ I.items=[]; renderReview(el,v); });
  $('#rsave').onclick=()=>{ let n=0, dup=0, bad=0;
    for(const x of I2){ if(!x.use||x.ans<0) continue; const o=x.o.map(s=>s.trim()); if(!x.q.trim()||o.some(s=>!s)||new Set(o).size<4){ bad++; continue; }
      if(DB.myQ.some(y=>y.q===x.q)){ dup++; continue; }
      DB.myQ.push({id:uid(),ch:x.ch,lv:x.lv,src:I.src||'khac',note:(I.note||'').slice(0,60),q:x.q,opts:[o[x.ans],...o.filter((_,k)=>k!==x.ans)],ex:x.ex||''}); n++; }
    save(); toast(`Đã lưu ${n} câu${dup?`, bỏ ${dup} câu trùng`:''}${bad?`, ${bad} câu thiếu nội dung`:''}`,3500); IMP=null; viewMyQ(v); };
}
function keyDialog(after){
  const m=modal(`<h3>🔑 Khoá API Anthropic (dành cho người lớn)</h3><p class="small muted">Tạo khoá ở console.anthropic.com → API Keys. Mỗi lần soạn câu sẽ tính phí vào tài khoản đó. Khoá chỉ lưu trong trình duyệt trên máy này, đi thẳng tới Anthropic. <b>Không nhập khoá trên máy dùng chung với các bé.</b></p>
   <label class="f">Khoá API</label><input type="text" id="kk" placeholder="sk-ant-…" value="${esc(DB.aiKey||'')}">
   <label class="f">Mô hình</label><select id="km"><option value="claude-sonnet-5-5">Claude Sonnet 5.5 – chính xác hơn</option><option value="claude-haiku-5-5">Claude Haiku 5.5 – rẻ, nhanh</option></select>
   <div class="row" style="justify-content:space-between;margin-top:12px"><button class="btn ghost" data-del>Xoá khoá</button><div class="row"><button class="btn ghost" data-x>Huỷ</button><button class="btn pri" data-y>Lưu</button></div></div>`);
  $('#km',m).value=DB.aiModel||'claude-sonnet-5-5';
  $('[data-x]',m).onclick=()=>m.remove();
  $('[data-del]',m).onclick=()=>{ delete DB.aiKey; save(); m.remove(); after(); };
  $('[data-y]',m).onclick=()=>{ const k=$('#kk',m).value.trim(); if(!/^sk-ant-/.test(k)){ toast('Khoá phải bắt đầu bằng sk-ant-'); return; } DB.aiKey=k; DB.aiModel=$('#km',m).value; save(); m.remove(); after(); };
}
