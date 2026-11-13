// BỘ SINH CÂU HỎI TÍNH TOÁN — mỗi lần gọi ra một câu mới với số liệu khác
const R = (a,b)=>a+Math.floor(Math.random()*(b-a+1));
const pick = a=>a[Math.floor(Math.random()*a.length)];
const fmt = x=>{const r=Math.round(x*100)/100; return String(r).replace('.',',');};
function uniq(correct, cands){ // trả về [đúng, 3 nhiễu khác nhau]
  const out=[correct]; for(const c of cands){ if(out.length>=4) break; if(!out.includes(c)) out.push(c); }
  let k=2; while(out.length<4){ const v=correct+' ('+k+')'; out.push(v); k++; } return out;
}
const ELEM = [ // Z, kí hiệu, tên, số neutron phổ biến, khối lượng nguyên tử
 [1,'H','hydrogen',0,1],[2,'He','helium',2,4],[3,'Li','lithium',4,7],[4,'Be','beryllium',5,9],[5,'B','boron',6,11],
 [6,'C','carbon',6,12],[7,'N','nitrogen',7,14],[8,'O','oxygen',8,16],[9,'F','fluorine',10,19],[10,'Ne','neon',10,20],
 [11,'Na','sodium',12,23],[12,'Mg','magnesium',12,24],[13,'Al','aluminium',14,27],[14,'Si','silicon',14,28],[15,'P','phosphorus',16,31],
 [16,'S','sulfur',16,32],[17,'Cl','chlorine',18,35.5],[18,'Ar','argon',22,40],[19,'K','potassium',20,39],[20,'Ca','calcium',20,40]];
const shells = z=>{const s=[];let r=z;for(const m of [2,8,8,2]){if(r<=0)break;const t=Math.min(m,r);s.push(t);r-=t;}return s;};
const GROUPS = ['IA','IIA','IIIA','IVA','VA','VIA','VIIA','VIIIA'];
function groupOf(z){ if(z===2) return 'VIIIA'; const s=shells(z); const last=s[s.length-1]; return GROUPS[last-1]; }

const CMPD = [['H₂O',18],['CO₂',44],['NaCl',58.5],['CaCO₃',100],['H₂SO₄',98],['NH₃',17],['CH₄',16],['Fe₂O₃',160],['Al₂O₃',102],
 ['MgO',40],['SO₂',64],['O₂',32],['N₂',28],['KCl',74.5],['CuSO₄',160],['HCl',36.5],['NaOH',40],['CaO',56],['SO₃',80],['P₂O₅',142]];
const MET = [['Na','I'],['K','I'],['Ca','II'],['Mg','II'],['Al','III'],['Zn','II'],['Cu','II'],['Fe','III'],['Ba','II']];
const ANI = [['O','II',false],['Cl','I',false],['SO₄','II',true],['NO₃','I',true],['OH','I',true],['PO₄','III',true],['CO₃','II',true]];
const RN = {I:1,II:2,III:3};
const SUB = n=>n===1?'':String(n).split('').map(d=>'₀₁₂₃₄₅₆₇₈₉'[d]).join('');
function gcd(a,b){return b?gcd(b,a%b):a;}
function formula(m,a,x,y){ const part = (a[2] && y>1)?'('+a[0]+')'+SUB(y):a[0]+SUB(y); return m[0]+SUB(x)+part; }

const GENS = [
 // ---- c1 nguyên tử
 ()=>{ const e=pick(ELEM.slice(2)); const opts=uniq(e[2]+' ('+e[1]+')', ELEM.filter(x=>Math.abs(x[0]-e[0])<=3&&x!==e).map(x=>x[2]+' ('+x[1]+')').sort(()=>Math.random()-.5));
   return {ch:'c1',lv:1,q:`Nguyên tử có ${e[0]} proton trong hạt nhân là nguyên tử của nguyên tố nào?`,opts,ex:`Số proton = số thứ tự ô = ${e[0]} → ${e[2]} (${e[1]}).`}; },
 ()=>{ const e=pick(ELEM.slice(2)); const s=shells(e[0]); const c=s.join(', ');
   const wrong=[ [...s].reverse().join(', '), shells(e[0]+1).join(', '), shells(Math.max(1,e[0]-1)).join(', '), s.map((v,i)=>i===s.length-1?v+1:v).join(', '), shells(e[0]+2).join(', '), shells(Math.max(1,e[0]-2)).join(', '), [...s,1].join(', ')];
   return {ch:'c1',lv:2,q:`Số electron trên mỗi lớp của nguyên tử ${e[2]} (Z = ${e[0]}) là:`,opts:uniq(c,wrong),ex:`Xếp lần lượt tối đa 2 e lớp 1, 8 e lớp 2, 8 e lớp 3: ${c}.`}; },
 ()=>{ const e=pick(ELEM.slice(2)); const s=shells(e[0]); const g=groupOf(e[0]); const c=`Chu kì ${s.length}, nhóm ${g}`;
   const gs=GROUPS.filter(x=>x!==g); return {ch:'c1',lv:2,q:`Nguyên tố ${e[1]} (Z = ${e[0]}) nằm ở vị trí nào trong bảng tuần hoàn?`,
   opts:uniq(c,[`Chu kì ${s[s.length-1]}, nhóm ${GROUPS[s.length-1]}`,`Chu kì ${s.length===3?2:3}, nhóm ${g}`,`Chu kì ${s.length}, nhóm ${pick(gs)}`,`Chu kì ${s.length+1}, nhóm ${pick(gs)}`]),
   ex:`Cấu hình ${s.join(', ')}: ${s.length} lớp → chu kì ${s.length}; ${s[s.length-1]} e lớp ngoài cùng → nhóm ${g}.`}; },
 ()=>{ const e=pick(ELEM.filter(x=>x[0]>=3&&x[3]>0&&x[0]!==17)); const z=e[0],n=e[3],T=2*z+n,D=2*z-n;
   return {ch:'c1',lv:3,q:`Nguyên tử X có tổng số hạt p, n, e là ${T}; số hạt mang điện nhiều hơn số hạt không mang điện là ${D}. X là:`,
   opts:uniq(`${e[2]} (${e[1]})`,ELEM.filter(x=>Math.abs(x[0]-z)<=3&&x!==e).sort(()=>Math.random()-.5).map(x=>`${x[2]} (${x[1]})`)),ex:`2p + n = ${T}; 2p − n = ${D} → 4p = ${T+D} → p = ${z}, n = ${n} → ${e[2]}.`}; },
 // ---- c2 phân tử
 ()=>{ const c=pick(CMPD); const ws=[c[1]+2,c[1]-1,Math.round(c[1]*1.5),c[1]+16,c[1]-16].filter(v=>v>0&&v!==c[1]).map(v=>fmt(v)+' amu');
   return {ch:'c2',lv:1,q:`Khối lượng phân tử của ${c[0]} là (H = 1, C = 12, N = 14, O = 16, Na = 23, Mg = 24, Al = 27, P = 31, S = 32, Cl = 35,5, K = 39, Ca = 40, Fe = 56, Cu = 64):`,
   opts:uniq(fmt(c[1])+' amu',ws.sort(()=>Math.random()-.5)),ex:`Cộng khối lượng tất cả nguyên tử trong phân tử ${c[0]} = ${fmt(c[1])} amu.`}; },
 ()=>{ const m=pick(MET), a=pick(ANI); const vm=RN[m[1]], va=RN[a[1]]; const l=vm*va/gcd(vm,va); const x=l/vm, y=l/va;
   const c=formula(m,a,x,y); const ws=[formula(m,a,y,x),formula(m,a,1,1),formula(m,a,x+1,y),formula(m,a,x,y+1),formula(m,a,2,3),formula(m,a,3,2),formula(m,a,1,3),formula(m,a,3,1)];
   return {ch:'c2',lv:2,q:`Công thức hoá học đúng của hợp chất tạo bởi ${m[0]} (hoá trị ${m[1]}) và ${a[2]?'nhóm ':''}${a[0]} (hoá trị ${a[1]}) là:`,
   opts:uniq(c,ws),ex:`Quy tắc hoá trị: x · ${m[1]} = y · ${a[1]} → x = ${x}, y = ${y} → ${c}.`}; },
 ()=>{ const list=[['H₂O','H',2,18],['CO₂','C',12,44],['SO₂','S',32,64],['CaCO₃','Ca',40,100],['MgO','Mg',24,40],['NH₃','N',14,17],['CH₄','C',12,16],['Fe₂O₃','Fe',112,160],['Al₂O₃','Al',54,102],['SO₃','S',32,80]];
   const c=pick(list); const p=c[2]/c[3]*100; const ws=[100-p,p/2,Math.min(99,p*1.3),p+10].map(v=>fmt(v)+' %');
   return {ch:'c2',lv:3,q:`Phần trăm khối lượng của nguyên tố ${c[1]} trong ${c[0]} xấp xỉ là:`,opts:uniq(fmt(p)+' %',ws),ex:`%${c[1]} = ${c[2]} / ${c[3]} × 100 ≈ ${fmt(p)} %.`}; },
 // ---- c3 tốc độ
 ()=>{ const v=pick([12,15,18,24,30,36,40,45,54,60]); const tm=pick([10,15,20,30,40,45]); const s=v*tm/60;
   return {ch:'c3',lv:2,q:`Một người đi được ${fmt(s)} km trong ${tm} phút. Tốc độ của người đó là:`,opts:uniq(v+' km/h',[fmt(s/tm)+' km/h',fmt(s*tm)+' km/h',(v*2)+' km/h',fmt(v/2)+' km/h']),ex:`${tm} phút = ${fmt(tm/60)} h → v = ${fmt(s)} : ${fmt(tm/60)} = ${v} km/h.`}; },
 ()=>{ const ms=pick([5,10,15,20,25,30]); const kmh=ms*3.6;
   return Math.random()<.5? {ch:'c3',lv:1,q:`Đổi ${fmt(kmh)} km/h ra m/s:`,opts:uniq(ms+' m/s',[fmt(kmh*3.6)+' m/s',fmt(kmh/10)+' m/s',(ms*2)+' m/s']),ex:`Chia cho 3,6: ${fmt(kmh)} : 3,6 = ${ms} m/s.`}
   : {ch:'c3',lv:1,q:`Đổi ${ms} m/s ra km/h:`,opts:uniq(fmt(kmh)+' km/h',[fmt(ms/3.6)+' km/h',ms*10+' km/h',fmt(kmh/2)+' km/h']),ex:`Nhân với 3,6: ${ms} × 3,6 = ${fmt(kmh)} km/h.`}; },
 ()=>{ const v1=pick([20,30,40,60]), v2=pick([30,40,60,120].filter(x=>x!==v1)); const vtb=2*v1*v2/(v1+v2);
   return {ch:'c3',lv:3,q:`Một xe đi nửa đầu quãng đường với tốc độ ${v1} km/h, nửa sau với ${v2} km/h. Tốc độ trung bình cả quãng đường là:`,
   opts:uniq(fmt(vtb)+' km/h',[fmt((v1+v2)/2)+' km/h',fmt(v1+v2)+' km/h',fmt(Math.abs(v2-v1))+' km/h',fmt(vtb+5)+' km/h']),ex:`v = 2·v₁·v₂/(v₁+v₂) = 2·${v1}·${v2}/${v1+v2} ≈ ${fmt(vtb)} km/h (không lấy trung bình cộng).`}; },
 ()=>{ const d=pick([60,90,120,150,180]); const a=pick([20,30,40]), b=pick([10,20,30,50]); const t=d/(a+b);
   return {ch:'c3',lv:3,q:`Hai xe xuất phát cùng lúc từ hai điểm cách nhau ${d} km, đi ngược chiều với tốc độ ${a} km/h và ${b} km/h. Thời gian đến lúc gặp nhau là:`,
   opts:uniq(fmt(t)+' h',[fmt(d/Math.max(1,Math.abs(a-b)))+' h',fmt(d/a)+' h',fmt(t*2)+' h',fmt(d/b)+' h',fmt(t+1)+' h',fmt(t+0.5)+' h',fmt(t*3)+' h']),ex:`Hai xe lại gần nhau ${a+b} km mỗi giờ → t = ${d} : ${a+b} = ${fmt(t)} h.`}; },
 // ---- c4 âm thanh
 ()=>{ const n=pick([600,900,1200,3000,6000,12000]); const s=pick([30,60,120]); const f=n/s;
   return {ch:'c4',lv:2,q:`Một vật thực hiện ${n} dao động trong ${s} giây. Tần số dao động là:`,opts:uniq(fmt(f)+' Hz',[fmt(n*s)+' Hz',fmt(s/n)+' Hz',fmt(f*60)+' Hz',fmt(f/2)+' Hz']),ex:`f = ${n} : ${s} = ${fmt(f)} Hz.`}; },
 ()=>{ const t=pick([0.4,0.6,0.8,1,1.2,1.6,2,3]); const d=1500*t/2;
   return {ch:'c4',lv:3,q:`Tàu phát siêu âm xuống đáy biển, sau ${fmt(t)} s thu được âm phản xạ. Tốc độ âm trong nước 1500 m/s. Độ sâu đáy biển là:`,
   opts:uniq(fmt(d)+' m',[fmt(d*2)+' m',fmt(d/2)+' m',fmt(340*t/2)+' m']),ex:`Âm đi xuống và đi lên: h = 1500 × ${fmt(t)} : 2 = ${fmt(d)} m.`}; },
 ()=>{ const t=pick([1,2,3,4,5,6]); const d=340*t;
   return {ch:'c4',lv:2,q:`Thấy tia chớp, ${t} s sau mới nghe tiếng sấm. Lấy tốc độ âm trong không khí 340 m/s. Chỗ có sét cách người quan sát khoảng:`,
   opts:uniq(fmt(d)+' m',[fmt(d/2)+' m',fmt(d*2)+' m',fmt(1500*t)+' m']),ex:`Ánh sáng đến gần như tức thời → d = 340 × ${t} = ${fmt(d)} m.`}; },
 // ---- c5 ánh sáng
 ()=>{ const a=pick([10,20,25,30,35,40,50,60,70]); const i=90-a;
   return {ch:'c5',lv:2,q:`Tia tới hợp với mặt gương phẳng một góc ${a}°. Góc hợp bởi tia tới và tia phản xạ là:`,opts:uniq((2*i)+'°',[i+'°',a+'°',(2*a)+'°',(180-a)+'°','90°',(90+a)+'°','180°']),ex:`Góc tới i = 90° − ${a}° = ${i}° → góc giữa tia tới và tia phản xạ = 2i = ${2*i}°.`}; },
 ()=>{ const d=pick([0.5,0.8,1,1.2,1.5,2,2.5,3]); const m=pick([0.2,0.3,0.5]);
   return {ch:'c5',lv:3,q:`Một người đứng cách gương phẳng ${fmt(d)} m rồi tiến lại gần gương thêm ${fmt(m)} m. Khi đó khoảng cách giữa người và ảnh là:`,
   opts:uniq(fmt(2*(d-m))+' m',[fmt(d-m)+' m',fmt(2*d)+' m',fmt(2*d-m)+' m',fmt(2*(d+m))+' m']),ex:`Người cách gương ${fmt(d-m)} m, ảnh cũng cách gương ${fmt(d-m)} m → người cách ảnh ${fmt(2*(d-m))} m.`}; },
 ()=>{ const a=pick([10,15,20,25,30]);
   return {ch:'c5',lv:3,q:`Giữ nguyên tia tới, quay gương phẳng một góc ${a}° quanh trục đi qua điểm tới. Tia phản xạ quay một góc:`,opts:uniq((2*a)+'°',[a+'°',fmt(a/2)+'°',(90-a)+'°',(3*a)+'°',(180-2*a)+'°',(4*a)+'°']),ex:`Tia phản xạ quay gấp đôi góc quay của gương: 2 × ${a}° = ${2*a}°.`}; },
];
// ---- c2 liên kết ion / cộng hoá trị (tự sinh)
const ION_M=[3,11,12,13,19,20], ION_N=[8,9,16,17], NONMET=[1,6,7,8,9,15,16,17];
const EL=z=>ELEM.find(e=>e[0]===z);
const SUP=(n,s)=>(n>1?'⁰¹²³⁴⁵⁶⁷⁸⁹'[n]:'')+(s>0?'⁺':'⁻');
const ionOf=z=>{ const s=shells(z), v=s[s.length-1]; return v<=3?{n:v,s:1}:{n:8-v,s:-1}; };
GENS.push(
 ()=>{ const z=pick([...ION_M,...ION_N]); const e=EL(z), io=ionOf(z), s=shells(z);
   const c=e[1]+SUP(io.n,io.s); const w=[e[1]+SUP(io.n,-io.s),e[1]+SUP(io.n%3+1,io.s),e[1]+SUP(io.n%3+1,-io.s),e[1]+SUP((io.n+1)%3+1,io.s)];
   return {ch:'c2',lv:1,q:`Nguyên tử ${e[2]} (${e[1]}, Z = ${z}) có xu hướng tạo thành ion nào?`,opts:uniq(c,w),
   ex:`${e[1]}: ${s.join(', ')} → ${io.s>0?`nhường ${io.n} e lớp ngoài cùng`:`nhận thêm ${io.n} e cho đủ 8`} → ${c}.`}; },
 ()=>{ const ionic=Math.random()<.5; let a,b;
   if(ionic){ a=EL(pick(ION_M)); b=EL(pick(ION_N)); } else { const p=[...NONMET].sort(()=>Math.random()-.5); a=EL(p[0]); b=EL(p[1]); }
   const c=ionic?'Liên kết ion':'Liên kết cộng hoá trị';
   return {ch:'c2',lv:1,q:`Liên kết giữa nguyên tố ${a[2]} (${a[1]}) và ${b[2]} (${b[1]}) trong hợp chất của chúng thường là:`,
   opts:[c,ionic?'Liên kết cộng hoá trị':'Liên kết ion','Không tạo được liên kết','Liên kết giữa các neutron'],
   ex:ionic?`${a[1]} là kim loại, ${b[1]} là phi kim → kim loại nhường e, phi kim nhận e → ion trái dấu hút nhau.`:`${a[1]} và ${b[1]} đều là phi kim → góp chung electron.`}; },
 ()=>{ const z=pick([...ION_M,...ION_N]); const e=EL(z), io=ionOf(z); const ne=z-io.s*io.n;
   return {ch:'c2',lv:2,q:`Ion ${e[1]}${SUP(io.n,io.s)} (Z của ${e[1]} = ${z}) có bao nhiêu electron?`,opts:uniq(String(ne),[String(z),String(z+io.s*io.n),String(ne+1),String(ne-1),String(ne+2)]),
   ex:`Nguyên tử ${e[1]} có ${z} e, ${io.s>0?'nhường':'nhận'} ${io.n} e → ${ne} e.`}; },
 ()=>{ const z=pick([...ION_M,...ION_N]); const e=EL(z), io=ionOf(z); const ne=z-io.s*io.n; const ion='X'+SUP(io.n,io.s);
   const near=ELEM.filter(x=>x!==e&&Math.abs(x[0]-z)<=3).sort(()=>Math.random()-.5).map(x=>`${x[2]} (${x[1]}, Z = ${x[0]})`);
   return {ch:'c2',lv:3,q:`Ion ${ion} có ${ne} electron. Nguyên tố X là:`,opts:uniq(`${e[2]} (${e[1]}, Z = ${z})`,near),
   ex:`X ${io.s>0?'nhường':'nhận'} ${io.n} e còn ${ne} e → X có ${ne}${io.s>0?'+':'−'}${io.n} = ${z} e → Z = ${z}.`}; },
 ()=>{ const m=EL(pick(ION_M)), n=EL(pick(ION_N)); const a=ionOf(m[0]).n, b=ionOf(n[0]).n; const l=a*b/gcd(a,b), x=l/a, y=l/b;
   const f=(p,q)=>m[1]+SUB(p)+n[1]+SUB(q); const c=f(x,y);
   return {ch:'c2',lv:3,q:`Nguyên tố X có Z = ${m[0]}, nguyên tố Y có Z = ${n[0]}. Công thức hợp chất tạo bởi X và Y (thay X, Y bằng kí hiệu) là:`,
   opts:uniq(c,[f(y,x),f(1,1),f(x,y+1),f(x+1,y),f(2,3),f(1,2),f(2,1)]),
   ex:`X = ${m[1]} (${shells(m[0]).join(', ')}) → ${m[1]}${SUP(a,1)}; Y = ${n[1]} (${shells(n[0]).join(', ')}) → ${n[1]}${SUP(b,-1)}. Tổng điện tích bằng 0 → ${x} × (+${a}) = ${y} × (−${b}) → ${c} (liên kết ion).`}; }
);
GENS.forEach((g,i)=>g.id='g'+i);
function genQuestion(ch, lv){ const ok=GENS.map(g=>({g,s:g()})).filter(o=>(!ch||o.s.ch===ch)&&(!lv||o.s.lv===lv)); return ok.length? pick(ok).s : null; }
