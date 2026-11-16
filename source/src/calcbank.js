// ===================== BÀI TÍNH: TOÁN LÝ · TOÁN HÓA · TOÁN SINH =====================
// Mỗi dạng bài sinh số liệu mới mỗi lần. Kết quả: đề, đáp số a (+ đơn vị u, số chữ số thập phân d),
// lời giải từng bước (steps) và đáp số sai theo lỗi thường gặp (w) để làm trắc nghiệm khi đấu.
const CALC_TR={ly:{name:'Toán Lý',ic:'⚡'},hoa:{name:'Toán Hóa',ic:'⚗️'},sinh:{name:'Toán Sinh',ic:'🧬'}};
const CALC_GR={'7':'Lớp 7','8':'Lớp 8','9':'Lớp 9','10':'Tuyển sinh 10'};
const RI=(a,b)=>a+Math.floor(Math.random()*(b-a+1));
const PK=a=>a[Math.floor(Math.random()*a.length)];
const NF=(x,d=2)=>{ if(!isFinite(x)) return String(x); return Number(x).toLocaleString('vi-VN',{maximumFractionDigits:d}); };
const RND2=(x,d=2)=>Math.round(x*Math.pow(10,d))/Math.pow(10,d);
// Dạng bài: id → môn, khối, tên, công thức (sổ công thức)
const CTOP={
 'ly7-v':{tr:'ly',g:'7',name:'Tốc độ – đổi đơn vị',f:'v = s / t · 1 m/s = 3,6 km/h'},
 'ly7-vtb':{tr:'ly',g:'7',name:'Tốc độ trung bình',f:'v_tb = (s₁ + s₂) / (t₁ + t₂) – không lấy trung bình cộng các tốc độ'},
 'ly7-gap':{tr:'ly',g:'7',name:'Hai vật gặp nhau, đuổi kịp',f:'Ngược chiều: t = d / (v₁ + v₂) · Cùng chiều: t = d / (v₁ − v₂)'},
 'ly7-tau':{tr:'ly',g:'7',name:'Tàu qua cầu, qua hầm',f:'s = chiều dài cầu + chiều dài tàu'},
 'ly7-am':{tr:'ly',g:'7',name:'Âm: tần số, tiếng vang, đo độ sâu',f:'f = số dao động / thời gian · Tiếng vang, siêu âm: 2d = v · t'},
 'ly7-as':{tr:'ly',g:'7',name:'Ánh sáng: phản xạ, gương phẳng',f:'i = i′ · quay gương α → tia phản xạ quay 2α · hai gương hợp góc α: n = 360°/α − 1'},
 'ly8-D':{tr:'ly',g:'8',name:'Khối lượng riêng, trọng lượng',f:'D = m / V · P = 10m · d = 10D'},
 'ly8-p':{tr:'ly',g:'8',name:'Áp suất, áp suất chất lỏng',f:'p = F / S · p = d · h · máy nén thủy lực F / f = S / s'},
 'ly8-FA':{tr:'ly',g:'8',name:'Lực đẩy Archimedes',f:'F_A = d_chất lỏng · V_chìm'},
 'ly8-don':{tr:'ly',g:'8',name:'Đòn bẩy, moment lực',f:'F₁ · d₁ = F₂ · d₂'},
 'ly9-cong':{tr:'ly',g:'9',name:'Công, công suất, năng lượng',f:'A = F · s · P = A / t · W_đ = ½ m v² · W_t = P · h = 10 m h'},
 'ly9-dien':{tr:'ly',g:'9',name:'Định luật Ohm, đoạn mạch',f:'I = U / R · nối tiếp R = R₁ + R₂ · song song 1/R = 1/R₁ + 1/R₂ · A = P · t'},
 'ly10-mach':{tr:'ly',g:'10',name:'Mạch hỗn hợp, định luật Joule',f:'R₁ nt (R₂ // R₃) · Q = I² R t'},
 'ly10-nhiet':{tr:'ly',g:'10',name:'Nhiệt lượng, cân bằng nhiệt, hiệu suất',f:'Q = m c Δt · Q_tỏa = Q_thu · H = Q_có ích / Q_toàn phần'},
 'hoa7-klpt':{tr:'hoa',g:'7',name:'Khối lượng phân tử, % khối lượng',f:'KLPT = tổng khối lượng nguyên tử · %X = (số nguyên tử X · A_X) / KLPT · 100%'},
 'hoa7-hatri':{tr:'hoa',g:'7',name:'Hóa trị, tìm nguyên tố',f:'Quy tắc hóa trị: x · a = y · b'},
 'hoa7-hat':{tr:'hoa',g:'7',name:'Bài toán số hạt p, n, e',f:'Tổng hạt = 2p + n · hạt mang điện = 2p'},
 'hoa8-mol':{tr:'hoa',g:'8',name:'Mol, khối lượng, thể tích khí',f:'n = m / M · V = n · 24,79 (L, đkc) · d_A/B = M_A / M_B'},
 'hoa8-dd':{tr:'hoa',g:'8',name:'Nồng độ dung dịch, pha loãng',f:'C% = m_ct / m_dd · 100% · C_M = n / V'},
 'hoa8-pt':{tr:'hoa',g:'8',name:'Tính theo phương trình hóa học, hiệu suất',f:'Lập PTHH → tỉ lệ mol → n chất cần tìm · H = thực tế / lí thuyết · 100%'},
 'hoa9-kl':{tr:'hoa',g:'9',name:'Kim loại, acid, base, muối',f:'Kim loại + HCl → muối + H₂ · tăng giảm khối lượng · trung hòa n_H⁺ = n_OH⁻'},
 'hoa10-hh':{tr:'hoa',g:'10',name:'Hỗn hợp, xác định kim loại, bảo toàn khối lượng',f:'Lập hệ 2 ẩn · m_muối = m_kim loại + 71 · n_H₂ (với HCl)'},
 'sinh7-ps':{tr:'sinh',g:'7',name:'Phân đôi, sinh sản vi khuẩn',f:'Sau k lần phân đôi: N = N₀ · 2ᵏ · k = thời gian / thời gian thế hệ'},
 'sinh7-tdc':{tr:'sinh',g:'7',name:'Trao đổi nước, trao đổi khí, sinh trưởng',f:'Thông khí = khí lưu thông · nhịp thở · tốc độ sinh trưởng = Δh / Δt'},
 'sinh8-tim':{tr:'sinh',g:'8',name:'Tim mạch, hô hấp ở người',f:'Lưu lượng tim = thể tích tâm thu · nhịp tim · chu kì = 60 / nhịp · khí hữu ích = (V lưu thông − khoảng chết) · nhịp'},
 'sinh8-dd':{tr:'sinh',g:'8',name:'Dinh dưỡng, khẩu phần, BMI',f:'Năng lượng = 4,1·Pr + 4,3·G + 9,3·L (kcal) · BMI = m / h²'},
 'sinh9-adn':{tr:'sinh',g:'9',name:'ADN, gen, nhân đôi',f:'L = N/2 · 3,4 Å · C = N/20 · A = T, G = X, A + G = N/2 · H = 2A + 3G · nhân đôi k lần: N_mt = N(2ᵏ − 1)'},
 'sinh9-nst':{tr:'sinh',g:'9',name:'Nguyên phân, giảm phân',f:'k lần nguyên phân: 2ᵏ tế bào, NST môi trường = 2n(2ᵏ − 1) · 1 tế bào sinh tinh → 4 tinh trùng, sinh trứng → 1 trứng'},
 'sinh9-men':{tr:'sinh',g:'9',name:'Lai Mendel',f:'Aa × Aa → 3 trội : 1 lặn · AaBb × AaBb → 9 : 3 : 3 : 1 · dị hợp m cặp → 2ᵐ giao tử'},
 'sinh10-gen':{tr:'sinh',g:'10',name:'Gen tổng hợp (tuyển sinh 10)',f:'2A + 2G = N · 2A + 3G = H → G = H − N'},
};
const MASS={H:1,C:12,N:14,O:16,Na:23,Mg:24,Al:27,S:32,Cl:35.5,K:39,Ca:40,Fe:56,Cu:64,Zn:65};
const CG=[]; const CGADD=(t,lv,make)=>CG.push({t,lv,make,tr:CTOP[t].tr,g:CTOP[t].g});

// ====================== TOÁN LÝ – LỚP 7 ======================
CGADD('ly7-v',1,()=>{ const v=PK([12,15,18,24,30,36,45,54,60]), tm=PK([10,15,20,30,40]); const s=v*tm/60;
 return {q:`Một bạn đạp xe được quãng đường ${NF(s)} km trong ${tm} phút. Tính tốc độ của bạn đó ra km/h.`,a:v,u:'km/h',d:2,
  steps:[`Đổi t = ${tm} phút = ${tm}/60 h = ${NF(tm/60,3)} h.`,`v = s / t = ${NF(s)} : ${NF(tm/60,3)} = ${v} km/h.`],w:[s/tm,s*tm/60,v*3.6,v/3.6]}; });
CGADD('ly7-v',1,()=>{ const ms=PK([5,8,10,12,15,20,25]); return {q:`Một ô tô chạy với tốc độ ${NF(ms*3.6)} km/h. Tốc độ đó bằng bao nhiêu m/s?`,a:ms,u:'m/s',d:2,
  steps:['1 m/s = 3,6 km/h nên đổi km/h sang m/s ta chia cho 3,6.',`v = ${NF(ms*3.6)} : 3,6 = ${ms} m/s.`],w:[ms*3.6*3.6,ms*10,ms*3.6/10]}; });
CGADD('ly7-v',2,()=>{ const v=PK([2,2.5,3,4,5]), s=PK([1200,1500,1800,2400,3000]); const t=s/v;
 return {q:`Một người chạy bộ với tốc độ không đổi ${v} m/s trên quãng đường ${NF(s)} m. Tính thời gian chạy (ra phút).`,a:t/60,u:'phút',d:2,
  steps:[`t = s / v = ${NF(s)} : ${v} = ${NF(t)} s.`,`Đổi ra phút: ${NF(t)} : 60 = ${NF(t/60)} phút.`],w:[t,s*v/60,t/3600]}; });
CGADD('ly7-vtb',2,()=>{ const v1=PK([30,40,50,60]), t1=PK([1,2,1.5]), v2=PK([20,30,45,60].filter(x=>x!==v1)), t2=PK([0.5,1,2]);
 const a=(v1*t1+v2*t2)/(t1+t2);
 return {q:`Một ô tô đi trong ${NF(t1)} giờ đầu với tốc độ ${v1} km/h, ${NF(t2)} giờ sau với tốc độ ${v2} km/h. Tính tốc độ trung bình của ô tô trên cả quãng đường.`,a,u:'km/h',d:2,
  steps:[`s₁ = ${v1} · ${NF(t1)} = ${NF(v1*t1)} km; s₂ = ${v2} · ${NF(t2)} = ${NF(v2*t2)} km.`,`v_tb = (s₁ + s₂) / (t₁ + t₂) = ${NF(v1*t1+v2*t2)} : ${NF(t1+t2)} = ${NF(a)} km/h.`,'Lưu ý: không lấy trung bình cộng hai tốc độ.'],w:[(v1+v2)/2,v1+v2,(v1*t1+v2*t2)]}; });
CGADD('ly7-vtb',3,()=>{ const v1=PK([20,30,40,60]), v2=PK([30,40,60,120].filter(x=>x!==v1)); const a=2*v1*v2/(v1+v2);
 return {q:`Một xe đi nửa quãng đường đầu với tốc độ ${v1} km/h và nửa quãng đường sau với tốc độ ${v2} km/h. Tính tốc độ trung bình trên cả quãng đường.`,a,u:'km/h',d:2,
  steps:['Gọi nửa quãng đường là s.',`t₁ = s/${v1}; t₂ = s/${v2}.`,`v_tb = 2s / (s/${v1} + s/${v2}) = 2 · ${v1} · ${v2} / (${v1} + ${v2}) = ${NF(a)} km/h.`],w:[(v1+v2)/2,v1+v2,a+5]}; });
CGADD('ly7-gap',2,()=>{ const d=PK([60,90,120,150,180,240]), a1=PK([20,30,40,50]), a2=PK([10,20,30,40]); const t=d/(a1+a2);
 return {q:`Hai xe xuất phát cùng lúc từ A và B cách nhau ${d} km, đi ngược chiều nhau với tốc độ ${a1} km/h và ${a2} km/h. Sau bao lâu hai xe gặp nhau?`,a:t,u:'h',d:2,
  steps:[`Mỗi giờ hai xe lại gần nhau ${a1} + ${a2} = ${a1+a2} km.`,`t = ${d} : ${a1+a2} = ${NF(t)} h.`],w:[d/Math.max(1,Math.abs(a1-a2)),d/a1,t*2]}; });
CGADD('ly7-gap',3,()=>{ const d=PK([60,90,120,180]), a1=PK([30,40,50,60]), a2=PK([20,30,40]); const t=d/(a1+a2), x=a1*t;
 return {q:`Hai xe xuất phát cùng lúc từ A và B cách nhau ${d} km, đi ngược chiều với tốc độ ${a1} km/h (xe từ A) và ${a2} km/h (xe từ B). Chỗ gặp nhau cách A bao nhiêu km?`,a:x,u:'km',d:2,
  steps:[`Thời gian gặp: t = ${d} / (${a1} + ${a2}) = ${NF(t)} h.`,`Xe từ A đi được: ${a1} · ${NF(t)} = ${NF(x)} km → chỗ gặp cách A ${NF(x)} km.`],w:[a2*t,d/2,d-a2]}; });
CGADD('ly7-gap',3,()=>{ const v1=PK([20,30,36,40]), dt=PK([0.5,1,1.5]), v2=v1+PK([10,15,20,24]); const d=v1*dt, t=d/(v2-v1);
 return {q:`Xe thứ nhất rời A lúc 7 giờ với tốc độ ${v1} km/h. Sau ${NF(dt)} giờ, xe thứ hai rời A đuổi theo cùng chiều với tốc độ ${v2} km/h. Sau bao lâu kể từ lúc xe thứ hai xuất phát thì đuổi kịp xe thứ nhất?`,a:t,u:'h',d:2,
  steps:[`Khi xe 2 xuất phát, xe 1 đã đi ${v1} · ${NF(dt)} = ${NF(d)} km.`,`Mỗi giờ xe 2 rút ngắn ${v2} − ${v1} = ${v2-v1} km.`,`t = ${NF(d)} : ${v2-v1} = ${NF(t)} h.`],w:[d/(v1+v2),t+dt,d/v2]}; });
CGADD('ly7-tau',2,()=>{ const Lt=PK([100,120,150,200,250]), Lc=PK([300,400,500,600,800]), v=PK([36,54,72]); const vs=v/3.6, t=(Lt+Lc)/vs;
 return {q:`Một đoàn tàu dài ${Lt} m chạy với tốc độ ${v} km/h qua một cây cầu dài ${Lc} m. Tính thời gian từ lúc đầu tàu lên cầu đến lúc toa cuối rời cầu.`,a:t,u:'s',d:2,
  steps:[`Đổi v = ${v} km/h = ${NF(vs)} m/s.`,`Quãng đường tàu đi = ${Lc} + ${Lt} = ${Lc+Lt} m.`,`t = ${Lc+Lt} : ${NF(vs)} = ${NF(t)} s.`],w:[Lc/vs,(Lc-Lt)/vs,(Lt+Lc)/v]}; });
CGADD('ly7-am',1,()=>{ const n=PK([600,900,1200,3000,6000]), s=PK([10,20,30,60]); return {q:`Một vật thực hiện ${n} dao động trong ${s} giây. Tính tần số dao động.`,a:n/s,u:'Hz',d:2,
  steps:[`f = số dao động / thời gian = ${n} : ${s} = ${NF(n/s)} Hz.`],w:[n*s,s/n,n/s*60]}; });
CGADD('ly7-am',2,()=>{ const t=PK([0.4,0.6,0.8,1,1.2,1.6,2,2.4]); const d=1500*t/2;
 return {q:`Một tàu phát sóng siêu âm thẳng xuống đáy biển, sau ${NF(t)} s thu được âm phản xạ. Tốc độ âm trong nước là 1500 m/s. Tính độ sâu của đáy biển.`,a:d,u:'m',d:2,
  steps:['Âm đi xuống rồi phản xạ đi lên nên quãng đường âm đi = 2h.',`2h = v · t = 1500 · ${NF(t)} = ${NF(1500*t)} m → h = ${NF(d)} m.`],w:[1500*t,d/2,340*t/2]}; });
CGADD('ly7-am',1,()=>{ const t=PK([2,3,4,5,6]); return {q:`Một người nhìn thấy tia chớp, ${t} s sau mới nghe tiếng sấm. Tốc độ âm trong không khí 340 m/s. Chỗ có sét cách người đó bao xa?`,a:340*t,u:'m',d:2,
  steps:['Ánh sáng truyền rất nhanh nên coi như thấy tia chớp ngay lúc sét đánh.',`d = v · t = 340 · ${t} = ${340*t} m.`],w:[170*t,340*t*2,1500*t]}; });
CGADD('ly7-am',2,()=>{ const t=PK([0.5,1,1.5,2]); const d=340*t/2;
 return {q:`Một bạn đứng trước vách núi và hét to, sau ${NF(t)} s nghe được tiếng vang. Tốc độ âm trong không khí 340 m/s. Bạn đó đứng cách vách núi bao xa?`,a:d,u:'m',d:2,
  steps:['Tiếng vang là âm phản xạ: âm đi tới vách núi rồi quay lại.',`2d = 340 · ${NF(t)} = ${NF(340*t)} m → d = ${NF(d)} m.`],w:[340*t,d/2,1500*t/2]}; });
CGADD('ly7-am',3,()=>{ const dt=PK([0.5,1,1.5,2]); const L=dt/(1/340-1/6100);
 return {q:`Một bạn gõ vào một đầu ống thép dài, bạn khác áp tai vào đầu kia nghe được hai tiếng cách nhau ${NF(dt)} s. Tốc độ âm trong không khí 340 m/s, trong thép 6100 m/s. Tính chiều dài ống thép.`,a:L,u:'m',d:1,
  steps:['Âm truyền trong thép đến trước, âm trong không khí đến sau.',`L/340 − L/6100 = ${NF(dt)}`,`L = ${NF(dt)} : (1/340 − 1/6100) ≈ ${NF(L,1)} m.`],w:[340*dt,6100*dt,(6100-340)*dt]}; });
CGADD('ly7-am',3,()=>{ return {q:'Để nghe được tiếng vang, âm phản xạ phải đến tai chậm hơn âm trực tiếp ít nhất 1/15 s. Với tốc độ âm trong không khí 340 m/s, người phải đứng cách bức tường ít nhất bao nhiêu mét?',a:340/30,u:'m',d:2,
  steps:['Âm đi và về: 2d ≥ 340 · 1/15 ≈ 22,67 m.','d ≥ 22,67 : 2 ≈ 11,33 m.'],w:[340/15,340/60,34]}; });
CGADD('ly7-as',1,()=>{ const a=PK([20,25,30,35,40,50,60,70]); return {q:`Chiếu một tia sáng tới gương phẳng, tia tới hợp với mặt gương một góc ${a}°. Tính góc phản xạ.`,a:90-a,u:'°',d:0,
  steps:[`Góc tới là góc giữa tia tới và pháp tuyến: i = 90° − ${a}° = ${90-a}°.`,`Góc phản xạ i′ = i = ${90-a}°.`],w:[a,2*a,180-2*a]}; });
CGADD('ly7-as',2,()=>{ const a=PK([20,25,30,35,40,50,60]); return {q:`Tia tới hợp với mặt gương phẳng một góc ${a}°. Tính góc tạo bởi tia tới và tia phản xạ.`,a:2*(90-a),u:'°',d:0,
  steps:[`Góc tới i = 90° − ${a}° = ${90-a}°.`,`Góc giữa tia tới và tia phản xạ = i + i′ = 2i = ${2*(90-a)}°.`],w:[90-a,2*a,180-a]}; });
CGADD('ly7-as',2,()=>{ const a=PK([10,15,20,25,30]); return {q:`Giữ nguyên tia tới, quay gương phẳng một góc ${a}° quanh trục đi qua điểm tới. Tia phản xạ quay một góc bao nhiêu?`,a:2*a,u:'°',d:0,
  steps:['Pháp tuyến quay theo gương một góc α nên góc tới đổi α, góc phản xạ cũng đổi α.',`Tia phản xạ quay 2α = 2 · ${a}° = ${2*a}°.`],w:[a,a/2,90-a]}; });
CGADD('ly7-as',2,()=>{ const d=PK([0.8,1,1.2,1.5,2,2.5]), m=PK([0.3,0.5]); return {q:`Một bạn đứng cách gương phẳng ${NF(d)} m rồi bước lại gần gương thêm ${NF(m)} m. Lúc đó bạn cách ảnh của mình bao nhiêu mét?`,a:2*(d-m),u:'m',d:2,
  steps:[`Bạn cách gương ${NF(d)} − ${NF(m)} = ${NF(d-m)} m.`,`Ảnh đối xứng với vật qua gương → ảnh cũng cách gương ${NF(d-m)} m.`,`Khoảng cách bạn – ảnh = 2 · ${NF(d-m)} = ${NF(2*(d-m))} m.`],w:[d-m,2*d,2*d-m]}; });
CGADD('ly7-as',3,()=>{ const a=PK([30,40,45,60,72,90,120]); return {q:`Hai gương phẳng hợp với nhau một góc ${a}°, mặt phản xạ hướng vào nhau. Một vật đặt giữa hai gương cho bao nhiêu ảnh?`,a:360/a-1,u:'ảnh',d:0,
  steps:[`360° / ${a}° = ${360/a} là số nguyên.`,`Số ảnh n = 360°/α − 1 = ${360/a} − 1 = ${360/a-1}.`],w:[360/a,360/a+1,2]}; });
CGADD('ly7-as',3,()=>{ const h=PK([1.5,1.6,1.7,1.8]); return {q:`Một người cao ${NF(h)} m đứng trước gương phẳng treo thẳng đứng. Gương phải cao ít nhất bao nhiêu mét để người đó nhìn thấy toàn bộ ảnh của mình?`,a:h/2,u:'m',d:2,
  steps:['Vẽ tia từ đỉnh đầu và từ chân tới mắt qua gương: phần gương cần dùng là đường trung bình của tam giác.',`Chiều cao gương tối thiểu = h/2 = ${NF(h)} : 2 = ${NF(h/2)} m.`],w:[h,h/4,h-0.1]}; });

// ====================== TOÁN LÝ – MỞ RỘNG ======================
CGADD('ly8-D',1,()=>{ const D=PK([2.7,7.8,8.9,11.3,1,0.8]), V=PK([10,20,25,40,50]); const m=D*V;
 return {q:`Một vật đặc có khối lượng ${NF(m)} g, thể tích ${V} cm³. Tính khối lượng riêng của vật ra kg/m³.`,a:D*1000,u:'kg/m³',d:0,
  steps:[`D = m / V = ${NF(m)} : ${V} = ${NF(D)} g/cm³.`,`1 g/cm³ = 1000 kg/m³ → D = ${NF(D*1000)} kg/m³.`],w:[D,D*100,D*10000]}; });
CGADD('ly8-D',2,()=>{ const D=PK([2700,7800,8900]), V=PK([0.002,0.005,0.01,0.02]); const P=10*D*V;
 return {q:`Một khối kim loại có khối lượng riêng ${NF(D)} kg/m³ và thể tích ${NF(V,3)} m³. Tính trọng lượng của khối kim loại.`,a:P,u:'N',d:1,
  steps:[`m = D · V = ${NF(D)} · ${NF(V,3)} = ${NF(D*V)} kg.`,`P = 10m = ${NF(P)} N.`],w:[D*V,P*10,D/V]}; });
CGADD('ly8-p',1,()=>{ const m=PK([40,45,50,60]), S=PK([200,250,300,400]); const p=10*m/(S/10000);
 return {q:`Một bạn nặng ${m} kg đứng trên sàn, tổng diện tích hai bàn chân tiếp xúc sàn là ${S} cm². Tính áp suất bạn đó tác dụng lên sàn.`,a:p,u:'Pa',d:0,
  steps:[`F = P = 10m = ${10*m} N.`,`S = ${S} cm² = ${NF(S/10000,4)} m².`,`p = F / S = ${10*m} : ${NF(S/10000,4)} = ${NF(p,0)} Pa.`],w:[10*m/S,m/(S/10000),p/2]}; });
CGADD('ly8-p',2,()=>{ const h=PK([1.2,2,2.5,3,5,10]), x=PK([0.4,0.5,1]); const p=10000*(h-x);
 return {q:`Một bể nước sâu ${NF(h)} m. Tính áp suất của nước tại điểm cách đáy bể ${NF(x)} m. Trọng lượng riêng của nước 10 000 N/m³.`,a:p,u:'Pa',d:0,
  steps:[`Độ sâu của điểm tính từ mặt nước: h = ${NF(h)} − ${NF(x)} = ${NF(h-x)} m.`,`p = d · h = 10 000 · ${NF(h-x)} = ${NF(p,0)} Pa.`],w:[10000*h,10000*x,1000*(h-x)]}; });
CGADD('ly8-p',3,()=>{ const f=PK([100,150,200,250]), s=PK([2,2.5,4,5]), S=PK([100,150,200,250]); const F=f*S/s;
 return {q:`Một máy nén thủy lực có pít-tông nhỏ diện tích ${NF(s)} cm², pít-tông lớn diện tích ${S} cm². Tác dụng lên pít-tông nhỏ lực ${f} N thì lực nâng ở pít-tông lớn là bao nhiêu?`,a:F,u:'N',d:0,
  steps:['Áp suất truyền nguyên vẹn: F / S = f / s.',`F = f · S / s = ${f} · ${S} : ${NF(s)} = ${NF(F)} N.`],w:[f*s/S,f*S,F/10]}; });
CGADD('ly8-FA',2,()=>{ const V=PK([50,100,200,250,500]); const F=10000*V/1e6;
 return {q:`Một vật có thể tích ${V} cm³ được nhúng chìm hoàn toàn trong nước (d = 10 000 N/m³). Tính lực đẩy Archimedes tác dụng lên vật.`,a:F,u:'N',d:2,
  steps:[`V = ${V} cm³ = ${NF(V/1e6,6)} m³.`,`F_A = d · V = 10 000 · ${NF(V/1e6,6)} = ${NF(F)} N.`],w:[F*10,F/10,F*100]}; });
CGADD('ly8-FA',3,()=>{ const Pk=PK([2.7,3.9,5.4,7.8]), Pn=Pk-PK([0.5,1,1.5,2]); const FA=Pk-Pn, V=FA/10000*1e6, D=Pk/10/(V/1e6);
 return {q:`Treo một vật vào lực kế ngoài không khí lực kế chỉ ${NF(Pk)} N; nhúng chìm vật trong nước lực kế chỉ ${NF(Pn)} N. Biết d_nước = 10 000 N/m³. Tính thể tích của vật (cm³).`,a:V,u:'cm³',d:1,
  steps:[`F_A = ${NF(Pk)} − ${NF(Pn)} = ${NF(FA)} N.`,`V = F_A / d = ${NF(FA)} : 10 000 = ${NF(FA/10000,6)} m³ = ${NF(V,1)} cm³.`],w:[Pk/10000*1e6,Pn/10000*1e6,V/10]}; });
CGADD('ly8-don',2,()=>{ const F1=PK([100,200,300,500]), d1=PK([0.2,0.3,0.4,0.5]), d2=PK([1,1.2,1.5,2]); const F2=F1*d1/d2;
 return {q:`Dùng đòn bẩy để nâng một vật nặng ${F1} N. Khoảng cách từ điểm tựa đến vật là ${NF(d1)} m, từ điểm tựa đến chỗ tay ấn là ${NF(d2)} m. Cần tác dụng lực ít nhất bao nhiêu?`,a:F2,u:'N',d:2,
  steps:['Điều kiện cân bằng đòn bẩy: F₁ · d₁ = F₂ · d₂.',`F₂ = ${F1} · ${NF(d1)} : ${NF(d2)} = ${NF(F2)} N.`],w:[F1*d2/d1,F1*d1*d2,F1-F2]}; });
CGADD('ly9-cong',1,()=>{ const F=PK([50,100,200,250]), s=PK([5,10,12,20]); return {q:`Một người kéo xe với lực ${F} N theo phương chuyển động, xe đi được ${s} m. Tính công của lực kéo.`,a:F*s,u:'J',d:0,
  steps:[`A = F · s = ${F} · ${s} = ${F*s} J.`],w:[F/s,F+s,F*s/10]}; });
CGADD('ly9-cong',2,()=>{ const m=PK([20,30,40,50]), h=PK([3,4,5,6]), t=PK([10,15,20,30]); const P=10*m*h/t;
 return {q:`Một người kéo đều một vật nặng ${m} kg lên cao ${h} m trong ${t} s. Tính công suất của người đó.`,a:P,u:'W',d:2,
  steps:[`A = P · h = 10m · h = ${10*m} · ${h} = ${10*m*h} J.`,`Công suất P = A / t = ${10*m*h} : ${t} = ${NF(P)} W.`],w:[m*h/t,10*m*h,10*m*h*t]}; });
CGADD('ly9-cong',2,()=>{ const m=PK([0.5,1,2,1000,1200]), v=PK([18,36,54,72]); const vs=v/3.6, W=0.5*m*vs*vs;
 return {q:`Một vật khối lượng ${NF(m)} kg chuyển động với tốc độ ${v} km/h. Tính động năng của vật.`,a:W,u:'J',d:1,
  steps:[`Đổi v = ${v} : 3,6 = ${NF(vs)} m/s.`,`W_đ = ½ m v² = 0,5 · ${NF(m)} · ${NF(vs)}² = ${NF(W,1)} J.`],w:[0.5*m*v*v,m*vs*vs,0.5*m*vs]}; });
CGADD('ly9-dien',1,()=>{ const R=PK([10,12,20,24,30,40]), U=PK([6,12,24,36]); return {q:`Đặt hiệu điện thế ${U} V vào hai đầu điện trở ${R} Ω. Tính cường độ dòng điện chạy qua điện trở.`,a:U/R,u:'A',d:2,
  steps:[`I = U / R = ${U} : ${R} = ${NF(U/R)} A.`],w:[R/U,U*R,U/R*1000]}; });
CGADD('ly9-dien',2,()=>{ const R1=PK([4,6,10,15]), R2=PK([6,10,12,20,30]), U=PK([12,24,30]); const I=U/(R1+R2);
 return {q:`Hai điện trở R₁ = ${R1} Ω và R₂ = ${R2} Ω mắc nối tiếp vào hiệu điện thế ${U} V. Tính cường độ dòng điện trong mạch.`,a:I,u:'A',d:2,
  steps:[`R_tđ = R₁ + R₂ = ${R1+R2} Ω.`,`I = U / R_tđ = ${U} : ${R1+R2} = ${NF(I)} A.`],w:[U/(R1*R2/(R1+R2)),U/R1,U/R2]}; });
CGADD('ly9-dien',2,()=>{ const R1=PK([6,10,12,20,30]), R2=PK([3,6,15,20,60].filter(x=>x!==R1)); const R=R1*R2/(R1+R2);
 return {q:`Hai điện trở R₁ = ${R1} Ω và R₂ = ${R2} Ω mắc song song. Tính điện trở tương đương.`,a:R,u:'Ω',d:2,
  steps:['1/R = 1/R₁ + 1/R₂ → R = R₁R₂ / (R₁ + R₂).',`R = ${R1} · ${R2} : ${R1+R2} = ${NF(R)} Ω.`],w:[R1+R2,(R1+R2)/2,Math.abs(R1-R2)]}; });
CGADD('ly9-dien',2,()=>{ const P=PK([75,100,1000,1500,2000]), h=PK([2,3,4,5,8]), days=30, price=PK([2000,2500,3000]); const kwh=P/1000*h*days, cost=kwh*price;
 return {q:`Một thiết bị điện công suất ${P} W, mỗi ngày dùng ${h} giờ. Giá điện ${NF(price)} đồng/kWh. Tính tiền điện phải trả cho thiết bị này trong ${days} ngày.`,a:cost,u:'đồng',d:0,
  steps:[`Điện năng mỗi ngày: A = P · t = ${NF(P/1000,3)} kW · ${h} h = ${NF(P/1000*h,3)} kWh.`,`${days} ngày: ${NF(kwh,2)} kWh.`,`Tiền điện = ${NF(kwh,2)} · ${NF(price)} = ${NF(cost,0)} đồng.`],w:[P*h*days*price,cost/days,kwh]}; });
CGADD('ly10-mach',3,()=>{ const R1=PK([4,6,8,10]), R2=PK([6,12,20,30]), R3=PK([3,6,12,30].filter(x=>x!==R2)), U=PK([12,18,24,36]); const R23=R2*R3/(R2+R3), Rt=R1+R23, I=U/Rt;
 return {q:`Cho mạch điện R₁ nối tiếp với (R₂ song song R₃), trong đó R₁ = ${R1} Ω, R₂ = ${R2} Ω, R₃ = ${R3} Ω. Hiệu điện thế hai đầu mạch ${U} V. Tính cường độ dòng điện qua mạch chính.`,a:I,u:'A',d:2,
  steps:[`R₂₃ = R₂R₃ / (R₂ + R₃) = ${R2} · ${R3} : ${R2+R3} = ${NF(R23)} Ω.`,`R_tđ = R₁ + R₂₃ = ${NF(Rt)} Ω.`,`I = U / R_tđ = ${U} : ${NF(Rt)} = ${NF(I)} A.`],w:[U/(R1+R2+R3),U/R1,U/R23]}; });
CGADD('ly10-mach',3,()=>{ const R1=PK([4,6,8,10]), R2=PK([6,12,20,30]), R3=PK([3,6,12,30].filter(x=>x!==R2)), U=PK([12,18,24,36]); const R23=R2*R3/(R2+R3), I=U/(R1+R23), U23=I*R23, I2=U23/R2;
 return {q:`Mạch R₁ nt (R₂ // R₃) với R₁ = ${R1} Ω, R₂ = ${R2} Ω, R₃ = ${R3} Ω, U = ${U} V. Tính cường độ dòng điện qua R₂.`,a:I2,u:'A',d:2,
  steps:[`R₂₃ = ${NF(R23)} Ω; R_tđ = ${NF(R1+R23)} Ω; I = ${U} : ${NF(R1+R23)} = ${NF(I)} A.`,`U₂₃ = I · R₂₃ = ${NF(U23)} V.`,`I₂ = U₂₃ / R₂ = ${NF(U23)} : ${R2} = ${NF(I2)} A.`],w:[I,U/R2,I/2]}; });
CGADD('ly10-mach',2,()=>{ const I=PK([0.5,1,1.5,2,2.5]), R=PK([10,20,40,44,50]), t=PK([5,10,15,20]); const Q=I*I*R*t*60;
 return {q:`Dòng điện ${NF(I)} A chạy qua dây đun có điện trở ${R} Ω trong ${t} phút. Tính nhiệt lượng tỏa ra.`,a:Q,u:'J',d:0,
  steps:[`t = ${t} phút = ${t*60} s.`,`Q = I² R t = ${NF(I)}² · ${R} · ${t*60} = ${NF(Q,0)} J.`],w:[I*R*t*60,I*I*R*t,Q/1000]}; });
CGADD('ly10-nhiet',2,()=>{ const m=PK([0.5,1,1.5,2,2.5]), t0=PK([20,25,30]), t1=PK([60,80,100]); const Q=m*4200*(t1-t0);
 return {q:`Tính nhiệt lượng cần để đun ${NF(m)} kg nước từ ${t0}°C lên ${t1}°C. Nhiệt dung riêng của nước 4200 J/(kg·K).`,a:Q,u:'J',d:0,
  steps:[`Δt = ${t1} − ${t0} = ${t1-t0}°C.`,`Q = m c Δt = ${NF(m)} · 4200 · ${t1-t0} = ${NF(Q,0)} J.`],w:[m*4200*t1,m*4200,Q/1000]}; });
CGADD('ly10-nhiet',3,()=>{ const m1=PK([0.2,0.3,0.5,1]), t1=PK([80,90,100]), m2=PK([0.5,1,1.5,2]), t2=PK([15,20,25]); const t=(m1*t1+m2*t2)/(m1+m2);
 return {q:`Đổ ${NF(m1)} kg nước ở ${t1}°C vào ${NF(m2)} kg nước ở ${t2}°C. Bỏ qua nhiệt lượng hao phí. Tính nhiệt độ khi cân bằng.`,a:t,u:'°C',d:2,
  steps:['Q_tỏa = Q_thu: m₁c(t₁ − t) = m₂c(t − t₂).',`t = (m₁t₁ + m₂t₂)/(m₁ + m₂) = (${NF(m1)}·${t1} + ${NF(m2)}·${t2}) : ${NF(m1+m2)} = ${NF(t)}°C.`],w:[(t1+t2)/2,t1-t2,(m1*t2+m2*t1)/(m1+m2)]}; });
CGADD('ly10-nhiet',3,()=>{ const m=PK([1,1.5,2,2.5]), t0=PK([20,25]), P=PK([1000,1500,2000]), H=PK([80,84,90]); const Q=m*4200*(100-t0), t=Q/(P*H/100);
 return {q:`Dùng bếp điện công suất ${P} W để đun sôi ${NF(m)} kg nước từ ${t0}°C. Hiệu suất của bếp là ${H}%. Nhiệt dung riêng của nước 4200 J/(kg·K). Tính thời gian đun (giây).`,a:t,u:'s',d:0,
  steps:[`Nhiệt lượng nước thu: Q = ${NF(m)} · 4200 · (100 − ${t0}) = ${NF(Q,0)} J.`,`Nhiệt lượng bếp tỏa: Q_tp = Q / H = ${NF(Q,0)} : ${H/100} = ${NF(Q/(H/100),0)} J.`,`t = Q_tp / P = ${NF(t,0)} s (≈ ${NF(t/60,1)} phút).`],w:[Q/P,Q*H/100/P,t/60]}; });

// ====================== TOÁN HÓA ======================
const CMP=[['H₂O',{H:2,O:1}],['CO₂',{C:1,O:2}],['NaCl',{Na:1,Cl:1}],['CaCO₃',{Ca:1,C:1,O:3}],['H₂SO₄',{H:2,S:1,O:4}],['NH₃',{N:1,H:3}],['CH₄',{C:1,H:4}],['Fe₂O₃',{Fe:2,O:3}],['Al₂O₃',{Al:2,O:3}],['MgO',{Mg:1,O:1}],['SO₂',{S:1,O:2}],['CuSO₄',{Cu:1,S:1,O:4}],['NaOH',{Na:1,O:1,H:1}],['KCl',{K:1,Cl:1}],['CaO',{Ca:1,O:1}],['SO₃',{S:1,O:3}],['Fe₃O₄',{Fe:3,O:4}],['HNO₃',{H:1,N:1,O:3}]];
const Mof=c=>Object.entries(c).reduce((s,[e,n])=>s+MASS[e]*n,0);
const showM=c=>Object.entries(c).map(([e,n])=>`${n>1?n+' · ':''}${MASS[e]}`).join(' + ');
const massNote='(H = 1, C = 12, N = 14, O = 16, Na = 23, Mg = 24, Al = 27, S = 32, Cl = 35,5, K = 39, Ca = 40, Fe = 56, Cu = 64, Zn = 65)';
CGADD('hoa7-klpt',1,()=>{ const [f,c]=PK(CMP); const M=Mof(c); return {q:`Tính khối lượng phân tử của ${f}. ${massNote}`,a:M,u:'amu',d:1,
  steps:[`KLPT(${f}) = ${showM(c)} = ${NF(M,1)} amu.`],w:[M-16,M+16,Object.values(MASS).length]}; });
CGADD('hoa7-klpt',2,()=>{ const [f,c]=PK(CMP.filter(x=>Object.keys(x[1]).length>=2)); const e=PK(Object.keys(c)); const M=Mof(c), p=MASS[e]*c[e]/M*100;
 return {q:`Tính phần trăm khối lượng của nguyên tố ${e} trong ${f}. ${massNote}`,a:p,u:'%',d:2,
  steps:[`KLPT(${f}) = ${NF(M,1)} amu.`,`%${e} = ${c[e]} · ${MASS[e]} / ${NF(M,1)} · 100% = ${NF(p)}%.`],w:[100-p,MASS[e]/M*100,p/2]}; });
CGADD('hoa7-klpt',3,()=>{ const [f,c]=PK([['CO₂',{C:1,O:2}],['H₂O',{H:2,O:1}],['CaCO₃',{Ca:1,C:1,O:3}],['Fe₂O₃',{Fe:2,O:3}],['SO₂',{S:1,O:2}]]); const m=PK([22,44,66,88,100,160,200]); const M=Mof(c), mO=m*16*c.O/M;
 return {q:`Tính khối lượng nguyên tố oxygen có trong ${m} g ${f}. ${massNote}`,a:mO,u:'g',d:2,
  steps:[`Trong ${NF(M,1)} g ${f} có ${16*c.O} g O.`,`m_O = ${m} · ${16*c.O} / ${NF(M,1)} = ${NF(mO)} g.`],w:[m-mO,m*16/M,mO/2]}; });
CGADD('hoa7-hatri',2,()=>{ const r=PK([['Fe₂O₃','Fe',3],['FeO','Fe',2],['Al₂O₃','Al',3],['SO₂','S',4],['SO₃','S',6],['P₂O₅','P',5],['N₂O₅','N',5],['CO₂','C',4],['Cu₂O','Cu',1],['MnO₂','Mn',4]]);
 return {q:`Biết O có hóa trị II. Tính hóa trị của ${r[1]} trong hợp chất ${r[0]} (ghi bằng số: 1, 2, 3…).`,a:r[2],u:'',d:0,
  steps:['Quy tắc hóa trị: x · a = y · b (x, y là chỉ số).',`Hóa trị của ${r[1]} = (số nguyên tử O · II) : số nguyên tử ${r[1]} = ${r[2]}.`],w:[2,r[2]*2,Math.max(1,r[2]-1)]}; });
CGADD('hoa7-hatri',2,()=>{ const r=PK([['XO₂',64,32,'S'],['X₂O₃',160,56,'Fe'],['XO',40,24,'Mg'],['X₂O',62,23,'Na'],['XO₂',44,12,'C'],['X₂O₃',102,27,'Al'],['XO',56,40,'Ca']]);
 return {q:`Một oxide có công thức ${r[0]} và khối lượng phân tử ${r[1]} amu. Tính khối lượng nguyên tử của X (O = 16).`,a:r[2],u:'amu',d:1,
  steps:[`Số nguyên tử O trong ${r[0]} cho khối lượng phần O; còn lại là X.`,`X = ${r[2]} amu → X là ${r[3]}.`],w:[r[1]-16,r[2]*2,r[1]/2]}; });
CGADD('hoa7-hat',3,()=>{ const e=PK([[11,12],[12,12],[13,14],[15,16],[16,16],[17,18],[19,20],[20,20],[8,8],[9,10]]); const T=2*e[0]+e[1], D=2*e[0]-e[1];
 return {q:`Nguyên tử X có tổng số hạt proton, neutron, electron là ${T}; số hạt mang điện nhiều hơn số hạt không mang điện là ${D}. Tính số proton của X.`,a:e[0],u:'hạt',d:0,
  steps:['Số p = số e; hạt mang điện = 2p, không mang điện = n.',`2p + n = ${T}; 2p − n = ${D}.`,`Cộng vế: 4p = ${T+D} → p = ${e[0]}; n = ${e[1]}.`],w:[e[1],(T-D)/2,T/3]}; });
CGADD('hoa7-hat',3,()=>{ const e=PK([[11,12],[12,12],[13,14],[16,16],[19,20],[20,20],[9,10]]); const T=2*e[0]+e[1], k=e[1]-e[0];
 return {q:`Nguyên tử Y có tổng số hạt là ${T}, trong đó số neutron nhiều hơn số proton là ${k}. Tính số proton của Y.`,a:e[0],u:'hạt',d:0,
  steps:[`2p + n = ${T} và n = p + ${k}.`,`3p + ${k} = ${T} → p = ${e[0]}.`],w:[e[1],T/2,T-e[0]]}; });
CGADD('hoa8-mol',1,()=>{ const [f,c]=PK(CMP); const M=Mof(c), n=PK([0.1,0.2,0.25,0.5,1.5]); const m=n*M;
 return {q:`Tính số mol của ${NF(m)} g ${f}. ${massNote}`,a:n,u:'mol',d:3,
  steps:[`M(${f}) = ${NF(M,1)} g/mol.`,`n = m / M = ${NF(m)} : ${NF(M,1)} = ${NF(n,3)} mol.`],w:[m*M,M/m,n*2]}; });
CGADD('hoa8-mol',1,()=>{ const g=PK([['O₂',32],['H₂',2],['CO₂',44],['N₂',28],['SO₂',64]]), n=PK([0.1,0.2,0.25,0.5,2]);
 return {q:`Tính thể tích (L) của ${NF(n)} mol khí ${g[0]} ở điều kiện chuẩn (25°C, 1 bar; 1 mol khí chiếm 24,79 L).`,a:n*24.79,u:'L',d:3,
  steps:[`V = n · 24,79 = ${NF(n)} · 24,79 = ${NF(n*24.79,3)} L.`],w:[n*22.4,n/24.79,n*g[1]]}; });
CGADD('hoa8-mol',2,()=>{ const g=PK([['O₂',32],['CO₂',44],['N₂',28],['SO₂',64],['CH₄',16],['NH₃',17]]); const ref=PK([['H₂',2],['không khí',29]]); const d=g[1]/ref[1];
 return {q:`Tính tỉ khối của khí ${g[0]} so với ${ref[0]}${ref[1]===29?' (M_kk = 29 g/mol)':''}.`,a:d,u:'',d:2,
  steps:[`d = M(${g[0]}) / M(${ref[0]}) = ${g[1]} : ${ref[1]} = ${NF(d)}.`],w:[ref[1]/g[1],g[1]*ref[1],d*2]}; });
CGADD('hoa8-dd',2,()=>{ const mct=PK([10,15,20,25,30,40]), mn=PK([90,135,180,200,150]); const C=mct/(mct+mn)*100;
 return {q:`Hòa tan ${mct} g muối ăn vào ${mn} g nước. Tính nồng độ phần trăm của dung dịch.`,a:C,u:'%',d:2,
  steps:[`m_dd = m_ct + m_nước = ${mct} + ${mn} = ${mct+mn} g.`,`C% = ${mct} / ${mct+mn} · 100% = ${NF(C)}%.`],w:[mct/mn*100,mn/(mct+mn)*100,C*2]}; });
CGADD('hoa8-dd',2,()=>{ const m=PK([2,4,8,10,20]), V=PK([100,200,250,500]); const n=m/40, CM=n/(V/1000);
 return {q:`Hòa tan ${m} g NaOH vào nước được ${V} mL dung dịch. Tính nồng độ mol của dung dịch (Na = 23, O = 16, H = 1).`,a:CM,u:'M',d:3,
  steps:[`n(NaOH) = ${m} : 40 = ${NF(n,3)} mol.`,`V = ${V} mL = ${NF(V/1000,3)} L.`,`C_M = n / V = ${NF(CM,3)} M.`],w:[n/V,m/(V/1000),CM*10]}; });
CGADD('hoa8-dd',3,()=>{ const m1=PK([100,150,200]), C1=PK([10,15,20,25]), add=PK([50,100,150,200]); const C2=m1*C1/(m1+add);
 return {q:`Thêm ${add} g nước vào ${m1} g dung dịch muối ${C1}%. Tính nồng độ phần trăm của dung dịch mới.`,a:C2,u:'%',d:2,
  steps:[`m_muối = ${m1} · ${C1}% = ${NF(m1*C1/100)} g (không đổi khi thêm nước).`,`m_dd mới = ${m1} + ${add} = ${m1+add} g.`,`C% = ${NF(m1*C1/100)} / ${m1+add} · 100% = ${NF(C2)}%.`],w:[C1*add/(m1+add),C1/2,C1-add/10]}; });
CGADD('hoa8-pt',2,()=>{ const k=PK([['Zn',65,1],['Mg',24,1],['Fe',56,1]]), n=PK([0.1,0.2,0.25,0.3,0.5]); const m=n*k[1], V=n*24.79;
 return {q:`Cho ${NF(m)} g ${k[0]} tác dụng hết với dung dịch HCl: ${k[0]} + 2HCl → ${k[0]}Cl₂ + H₂. Tính thể tích khí H₂ thu được ở điều kiện chuẩn (24,79 L/mol). (${k[0]} = ${k[1]})`,a:V,u:'L',d:3,
  steps:[`n(${k[0]}) = ${NF(m)} : ${k[1]} = ${NF(n,3)} mol.`,`Theo PTHH: n(H₂) = n(${k[0]}) = ${NF(n,3)} mol.`,`V(H₂) = ${NF(n,3)} · 24,79 = ${NF(V,3)} L.`],w:[n*22.4,2*n*24.79,n/2*24.79]}; });
CGADD('hoa8-pt',3,()=>{ const m=PK([10,20,25,50,100]), H=PK([80,85,90,75]); const n=m/100, mCaO=n*56*H/100;
 return {q:`Nung ${m} g CaCO₃: CaCO₃ → CaO + CO₂. Hiệu suất phản ứng ${H}%. Tính khối lượng CaO thu được (Ca = 40, C = 12, O = 16).`,a:mCaO,u:'g',d:2,
  steps:[`n(CaCO₃) = ${m} : 100 = ${NF(n,3)} mol → n(CaO) lí thuyết = ${NF(n,3)} mol.`,`m(CaO) lí thuyết = ${NF(n,3)} · 56 = ${NF(n*56)} g.`,`Thực tế = ${NF(n*56)} · ${H}% = ${NF(mCaO)} g.`],w:[n*56,n*44*H/100,m*H/100]}; });
CGADD('hoa8-pt',2,()=>{ const n=PK([0.1,0.2,0.3,0.4]); const mO2=n*32*1/2*1, mMgO=n*40;
 return {q:`Đốt cháy hoàn toàn ${NF(n*24)} g Mg trong oxygen: 2Mg + O₂ → 2MgO. Tính khối lượng MgO tạo thành (Mg = 24, O = 16).`,a:mMgO,u:'g',d:2,
  steps:[`n(Mg) = ${NF(n*24)} : 24 = ${NF(n)} mol.`,`Theo PTHH: n(MgO) = n(Mg) = ${NF(n)} mol.`,`m(MgO) = ${NF(n)} · 40 = ${NF(mMgO)} g.`],w:[n*24,n/2*40,mO2]}; });
CGADD('hoa9-kl',2,()=>{ const V=PK([100,200,250]), a=PK([0.1,0.2,0.5,1]), Vb=PK([50,100,200]); const CM=V*a/Vb;
 return {q:`Trung hòa ${V} mL dung dịch HCl ${NF(a)} M cần vừa đủ ${Vb} mL dung dịch NaOH. Tính nồng độ mol của dung dịch NaOH.`,a:CM,u:'M',d:3,
  steps:['NaOH + HCl → NaCl + H₂O; tỉ lệ mol 1 : 1.',`n(HCl) = ${NF(V/1000,3)} · ${NF(a)} = ${NF(V*a/1000,4)} mol = n(NaOH).`,`C_M(NaOH) = ${NF(V*a/1000,4)} : ${NF(Vb/1000,3)} = ${NF(CM,3)} M.`],w:[a,Vb*a/V,CM*2]}; });
CGADD('hoa9-kl',2,()=>{ const n=PK([0.05,0.1,0.15,0.2]); const V=n*24.79, m=n*100;
 return {q:`Dẫn ${NF(V,3)} L khí CO₂ (điều kiện chuẩn, 24,79 L/mol) vào dung dịch Ca(OH)₂ dư. Tính khối lượng kết tủa CaCO₃ (Ca = 40, C = 12, O = 16).`,a:m,u:'g',d:2,
  steps:['CO₂ + Ca(OH)₂ → CaCO₃↓ + H₂O.',`n(CO₂) = ${NF(V,3)} : 24,79 = ${NF(n,3)} mol = n(CaCO₃).`,`m = ${NF(n,3)} · 100 = ${NF(m)} g.`],w:[n*44,n*74,m/2]}; });
CGADD('hoa9-kl',3,()=>{ const n=PK([0.05,0.1,0.15,0.2,0.25]); const dm=n*8, mCu=n*64;
 return {q:`Nhúng một thanh sắt vào dung dịch CuSO₄. Sau một thời gian lấy ra, làm khô, thấy khối lượng thanh tăng ${NF(dm)} g. Tính khối lượng Cu bám trên thanh (Fe = 56, Cu = 64).`,a:mCu,u:'g',d:2,
  steps:['Fe + CuSO₄ → FeSO₄ + Cu. Cứ 1 mol Fe tan (56 g) thì 1 mol Cu bám (64 g), thanh tăng 8 g.',`n = ${NF(dm)} : 8 = ${NF(n,3)} mol.`,`m(Cu) = ${NF(n,3)} · 64 = ${NF(mCu)} g.`],w:[dm,n*56,dm*64/56]}; });
CGADD('hoa9-kl',3,()=>{ const k=PK([['Mg',24],['Zn',65],['Fe',56],['Ca',40]]), n=PK([0.1,0.2,0.25]); const m=n*k[1], V=n*24.79;
 return {q:`Hòa tan hoàn toàn ${NF(m)} g một kim loại R hóa trị II trong dung dịch HCl dư, thu được ${NF(V,3)} L khí H₂ (điều kiện chuẩn, 24,79 L/mol). Tính khối lượng mol của R.`,a:k[1],u:'g/mol',d:1,
  steps:['R + 2HCl → RCl₂ + H₂.',`n(H₂) = ${NF(V,3)} : 24,79 = ${NF(n,3)} mol = n(R).`,`M(R) = ${NF(m)} : ${NF(n,3)} = ${k[1]} g/mol → R là ${k[0]}.`],w:[k[1]/2,k[1]*2,m/V]}; });
CGADD('hoa10-hh',3,()=>{ const x=PK([0.1,0.2,0.3]), y=PK([0.1,0.15,0.2]); const m=24*x+56*y, V=(x+y)*24.79, pMg=24*x/m*100;
 return {q:`Hòa tan hoàn toàn ${NF(m)} g hỗn hợp Mg và Fe trong dung dịch HCl dư, thu được ${NF(V,3)} L H₂ (điều kiện chuẩn, 24,79 L/mol). Tính phần trăm khối lượng Mg trong hỗn hợp (Mg = 24, Fe = 56).`,a:pMg,u:'%',d:2,
  steps:['Gọi x, y là số mol Mg, Fe. Mg và Fe đều cho 1 mol H₂ mỗi mol kim loại.',`24x + 56y = ${NF(m)}; x + y = ${NF(V,3)} : 24,79 = ${NF(x+y,3)}.`,`Giải hệ: x = ${NF(x,3)}, y = ${NF(y,3)}.`,`%Mg = 24 · ${NF(x,3)} / ${NF(m)} · 100% = ${NF(pMg)}%.`],w:[100-pMg,x/(x+y)*100,50]}; });
CGADD('hoa10-hh',3,()=>{ const x=PK([0.1,0.2]), y=PK([0.1,0.2,0.3]); const m=27*x+24*y, nH=1.5*x+y, V=nH*24.79, mAl=27*x;
 return {q:`Cho ${NF(m)} g hỗn hợp Al và Mg tác dụng hết với HCl dư, thu được ${NF(V,3)} L H₂ (điều kiện chuẩn, 24,79 L/mol). Tính khối lượng Al trong hỗn hợp (Al = 27, Mg = 24).`,a:mAl,u:'g',d:2,
  steps:['2Al + 6HCl → 2AlCl₃ + 3H₂; Mg + 2HCl → MgCl₂ + H₂.','Gọi x, y là mol Al, Mg: 27x + 24y = '+NF(m)+'; 1,5x + y = '+NF(nH,3)+'.',`Giải hệ: x = ${NF(x,3)} → m(Al) = ${NF(mAl)} g.`],w:[m-mAl,24*y*27/24,m/2]}; });
CGADD('hoa10-hh',3,()=>{ const x=PK([0.1,0.2]), y=PK([0.1,0.15,0.2]); const mkl=24*x+65*y, nH=x+y, mm=mkl+71*nH;
 return {q:`Hòa tan hết ${NF(mkl)} g hỗn hợp Mg và Zn trong HCl dư, thu được ${NF(nH*24.79,3)} L H₂ (điều kiện chuẩn, 24,79 L/mol). Cô cạn dung dịch, tính khối lượng muối khan thu được.`,a:mm,u:'g',d:2,
  steps:[`n(H₂) = ${NF(nH,3)} mol → n(HCl phản ứng) = ${NF(2*nH,3)} mol → n(Cl) trong muối = ${NF(2*nH,3)} mol.`,`m_muối = m_kim loại + m_Cl = ${NF(mkl)} + 35,5 · ${NF(2*nH,3)} = ${NF(mm)} g.`,'Cách nhanh: m_muối = m_KL + 71 · n(H₂).'],w:[mkl+36.5*2*nH,mkl+35.5*nH,mkl]}; });
CGADD('hoa10-hh',3,()=>{ const k=PK([['Fe',56],['Al',27],['Cr',52]]), n=PK([0.02,0.05,0.1]); const Mox=2*k[1]+48, m=n*Mox, nHCl=6*n, Vml=PK([100,200,250]); const CM=nHCl/(Vml/1000);
 return {q:`Hòa tan hết ${NF(m)} g một oxide kim loại R₂O₃ cần vừa đủ ${Vml} mL dung dịch HCl ${NF(CM,3)} M. Tính khối lượng mol của R.`,a:k[1],u:'g/mol',d:1,
  steps:['R₂O₃ + 6HCl → 2RCl₃ + 3H₂O.',`n(HCl) = ${NF(Vml/1000,3)} · ${NF(CM,3)} = ${NF(nHCl,3)} mol → n(R₂O₃) = ${NF(n,3)} mol.`,`M(R₂O₃) = ${NF(m)} : ${NF(n,3)} = ${Mox} → 2R + 48 = ${Mox} → R = ${k[1]} (${k[0]}).`],w:[Mox,Mox/2,k[1]*2]}; });

// ====================== TOÁN SINH ======================
CGADD('sinh7-ps',1,()=>{ const k=PK([3,4,5,6,8,10]); return {q:`Một tế bào vi khuẩn phân đôi liên tiếp ${k} lần. Tạo ra bao nhiêu tế bào con?`,a:Math.pow(2,k),u:'tế bào',d:0,
  steps:['Mỗi lần phân đôi, số tế bào tăng gấp đôi.',`N = 2ᵏ = 2^${k} = ${Math.pow(2,k)} tế bào.`],w:[2*k,Math.pow(2,k-1),k*k]}; });
CGADD('sinh7-ps',2,()=>{ const g=PK([20,30,40,60]), T=PK([2,3,4]), N0=PK([10,50,100,1000]); const k=T*60/g, N=N0*Math.pow(2,k);
 return {q:`Một loài vi khuẩn cứ ${g} phút phân đôi một lần. Ban đầu có ${NF(N0)} tế bào, sau ${T} giờ trong điều kiện thuận lợi có bao nhiêu tế bào?`,a:N,u:'tế bào',d:0,
  steps:[`Số lần phân đôi: k = ${T*60} : ${g} = ${k} lần.`,`N = N₀ · 2ᵏ = ${NF(N0)} · 2^${k} = ${NF(N,0)} tế bào.`],w:[N0*2*k,N/2,N0*Math.pow(2,T)]}; });
CGADD('sinh7-tdc',1,()=>{ const V=PK([400,450,500,550]), f=PK([14,16,18,20]); const L=V*f/1000;
 return {q:`Mỗi lần hít vào bình thường, một bạn đưa vào phổi ${V} mL khí; nhịp thở ${f} lần/phút. Tính lượng khí lưu thông qua phổi trong 1 phút (lít).`,a:L,u:'L',d:2,
  steps:[`V/phút = ${V} · ${f} = ${V*f} mL = ${NF(L)} L.`],w:[V*f,L*60,V/f]}; });
CGADD('sinh7-tdc',1,()=>{ const h1=PK([10,12,15,20]), add=PK([6,9,12,15]), n=PK([3,5,6,10]); return {q:`Một cây đậu cao ${h1} cm, sau ${n} ngày cao ${h1+add} cm. Tính tốc độ sinh trưởng trung bình (cm/ngày).`,a:add/n,u:'cm/ngày',d:2,
  steps:[`Chiều cao tăng: ${h1+add} − ${h1} = ${add} cm.`,`Tốc độ = ${add} : ${n} = ${NF(add/n)} cm/ngày.`],w:[(h1+add)/n,add*n,h1/n]}; });
CGADD('sinh7-tdc',2,()=>{ const W=PK([2,5,10,20]), p=PK([98,99,97]); return {q:`Một cây ngô hút ${W} lít nước mỗi ngày, trong đó ${p}% lượng nước thoát ra ngoài qua lá. Tính lượng nước cây giữ lại để sử dụng (mL).`,a:W*1000*(100-p)/100,u:'mL',d:0,
  steps:[`Phần giữ lại = ${100-p}%.`,`${W} L = ${W*1000} mL → ${W*1000} · ${100-p}% = ${NF(W*1000*(100-p)/100)} mL.`],w:[W*1000*p/100,W*(100-p),W*1000]}; });
CGADD('sinh8-tim',1,()=>{ const sv=PK([60,70,75,80]), f=PK([60,70,75,80]); return {q:`Mỗi lần tâm thất trái co đẩy ${sv} mL máu vào động mạch; nhịp tim ${f} lần/phút. Tính lượng máu tim bơm trong 1 phút (lít).`,a:sv*f/1000,u:'L',d:2,
  steps:[`Lưu lượng tim = ${sv} · ${f} = ${sv*f} mL/phút = ${NF(sv*f/1000)} L/phút.`],w:[sv*f,sv*f/100,sv/f]}; });
CGADD('sinh8-tim',2,()=>{ const f=PK([60,75,80,100,120]); const T=60/f, dan=T*4/8;
 return {q:`Ở người, một chu kì tim gồm: nhĩ co, thất co, dãn chung theo tỉ lệ thời gian 1 : 3 : 4. Khi nhịp tim là ${f} lần/phút, pha dãn chung kéo dài bao nhiêu giây?`,a:dan,u:'s',d:3,
  steps:[`Thời gian một chu kì: T = 60 : ${f} = ${NF(T,3)} s.`,`Dãn chung chiếm 4/8 chu kì → ${NF(T,3)} · 4/8 = ${NF(dan,3)} s.`],w:[T,T*3/8,0.4]}; });
CGADD('sinh8-tim',3,()=>{ const V=PK([450,500,550]), f=PK([12,14,16,18]); const huu=(V-150)*f;
 return {q:`Một người thở ${f} nhịp/phút, mỗi nhịp hít vào ${V} mL khí. Biết khí ở khoảng chết (đường dẫn khí) là 150 mL không tham gia trao đổi. Tính lượng khí thực sự vào phế nang trong 1 phút (mL).`,a:huu,u:'mL',d:0,
  steps:[`Khí vào phế nang mỗi nhịp: ${V} − 150 = ${V-150} mL.`,`Mỗi phút: ${V-150} · ${f} = ${huu} mL.`],w:[V*f,150*f,(V+150)*f]}; });
CGADD('sinh8-dd',2,()=>{ const P=PK([50,60,70,80]), Gl=PK([300,350,400,450]), L=PK([30,40,50,60]); const E=4.1*P+4.3*Gl+9.3*L;
 return {q:`Khẩu phần một ngày có ${P} g protein, ${Gl} g glucid, ${L} g lipid. Biết 1 g protein cho 4,1 kcal, 1 g glucid cho 4,3 kcal, 1 g lipid cho 9,3 kcal. Tính năng lượng của khẩu phần.`,a:E,u:'kcal',d:1,
  steps:[`Protein: 4,1 · ${P} = ${NF(4.1*P,1)} kcal; glucid: 4,3 · ${Gl} = ${NF(4.3*Gl,1)} kcal; lipid: 9,3 · ${L} = ${NF(9.3*L,1)} kcal.`,`Tổng = ${NF(E,1)} kcal.`],w:[4*(P+Gl+L),4.1*P+4.3*Gl,(P+Gl+L)*9.3]}; });
CGADD('sinh8-dd',1,()=>{ const m=PK([35,40,45,50,55]), h=PK([1.4,1.45,1.5,1.55,1.6]); const B=m/(h*h);
 return {q:`Một bạn nặng ${m} kg, cao ${NF(h)} m. Tính chỉ số BMI.`,a:B,u:'kg/m²',d:2,
  steps:[`BMI = m / h² = ${m} : ${NF(h)}² = ${m} : ${NF(h*h,4)} = ${NF(B)}.`],w:[m/h,m*h*h,m/(2*h)]}; });
CGADD('sinh9-adn',1,()=>{ const N=PK([1200,1500,2400,3000,3600]); return {q:`Một gen có ${NF(N)} nucleotide. Tính chiều dài của gen (Å).`,a:N/2*3.4,u:'Å',d:1,
  steps:['Mỗi cặp nucleotide dài 3,4 Å; gen có N/2 cặp.',`L = ${NF(N)}/2 · 3,4 = ${NF(N/2*3.4,1)} Å.`],w:[N*3.4,N/2,N/20]}; });
CGADD('sinh9-adn',1,()=>{ const N=PK([1200,1800,2400,3000,4000]); return {q:`Một gen có ${NF(N)} nucleotide. Gen có bao nhiêu chu kì xoắn?`,a:N/20,u:'chu kì',d:0,
  steps:['Mỗi chu kì xoắn gồm 10 cặp = 20 nucleotide.',`C = ${NF(N)} : 20 = ${N/20}.`],w:[N/10,N/2,N/34]}; });
CGADD('sinh9-adn',2,()=>{ const N=PK([1200,1500,2400,3000]), pA=PK([10,15,20,30,35]); const A=N*pA/100, Gg=N/2-A;
 return {q:`Một gen có ${NF(N)} nucleotide, trong đó số A chiếm ${pA}%. Tính số nucleotide loại G.`,a:Gg,u:'nu',d:0,
  steps:[`A = T = ${pA}% · ${NF(N)} = ${NF(A)}.`,`A + G = N/2 → G = ${NF(N/2)} − ${NF(A)} = ${NF(Gg)}.`],w:[A,N-A,Gg*2]}; });
CGADD('sinh9-adn',2,()=>{ const N=PK([1200,1500,2400,3000]), pA=PK([20,25,30,35]); const A=N*pA/100, Gg=N/2-A, H=2*A+3*Gg;
 return {q:`Một gen có ${NF(N)} nucleotide, A chiếm ${pA}%. Tính số liên kết hydrogen của gen.`,a:H,u:'liên kết',d:0,
  steps:[`A = T = ${NF(A)}; G = X = ${NF(N/2)} − ${NF(A)} = ${NF(Gg)}.`,`H = 2A + 3G = 2 · ${NF(A)} + 3 · ${NF(Gg)} = ${NF(H)}.`],w:[3*A+2*Gg,2*N,A+Gg]}; });
CGADD('sinh9-adn',3,()=>{ const N=PK([1200,1500,2400,3000]), k=PK([2,3,4,5]); const mt=N*(Math.pow(2,k)-1);
 return {q:`Một gen có ${NF(N)} nucleotide nhân đôi liên tiếp ${k} lần. Môi trường nội bào cung cấp bao nhiêu nucleotide tự do?`,a:mt,u:'nu',d:0,
  steps:[`Sau ${k} lần nhân đôi tạo 2^${k} = ${Math.pow(2,k)} gen con.`,'Trừ đi 2 mạch của gen ban đầu: N_mt = N(2ᵏ − 1).',`= ${NF(N)} · ${Math.pow(2,k)-1} = ${NF(mt)}.`],w:[N*Math.pow(2,k),N*k,N*(Math.pow(2,k)-2)]}; });
CGADD('sinh9-nst',2,()=>{ const n2=PK([8,14,24,46,78]), k=PK([2,3,4,5]); const c=n2*(Math.pow(2,k)-1);
 return {q:`Một tế bào có bộ NST 2n = ${n2} nguyên phân liên tiếp ${k} lần. Môi trường cung cấp nguyên liệu tương đương bao nhiêu NST đơn?`,a:c,u:'NST',d:0,
  steps:[`Số tế bào con: 2^${k} = ${Math.pow(2,k)}.`,`NST môi trường = 2n(2ᵏ − 1) = ${n2} · ${Math.pow(2,k)-1} = ${c}.`],w:[n2*Math.pow(2,k),n2*k,n2/2*(Math.pow(2,k)-1)]}; });
CGADD('sinh9-nst',1,()=>{ const x=PK([5,10,12,20,25]); const sp=PK([true,false]); return {q:`Có ${x} tế bào ${sp?'sinh tinh':'sinh trứng'} giảm phân bình thường. Tạo ra bao nhiêu ${sp?'tinh trùng':'trứng'}?`,a:sp?4*x:x,u:sp?'tinh trùng':'trứng',d:0,
  steps:[sp?'Mỗi tế bào sinh tinh giảm phân tạo 4 tinh trùng.':'Mỗi tế bào sinh trứng giảm phân tạo 1 trứng và 3 thể cực.',`Số ${sp?'tinh trùng':'trứng'} = ${sp?4*x:x}.`],w:sp?[x,2*x,8*x]:[4*x,3*x,2*x]}; });
CGADD('sinh9-men',1,()=>{ const n=PK([400,800,1200,1600]); return {q:`Cho P: Aa × Aa (A trội hoàn toàn so với a). F₁ thu được ${NF(n)} cây. Theo lí thuyết, số cây mang tính trạng lặn là bao nhiêu?`,a:n/4,u:'cây',d:0,
  steps:['Aa × Aa → 1AA : 2Aa : 1aa → 3 trội : 1 lặn.',`Cây lặn = ${NF(n)} · 1/4 = ${NF(n/4)}.`],w:[n*3/4,n/2,n/3]}; });
CGADD('sinh9-men',2,()=>{ const m=PK([2,3,4,5]); return {q:`Một cơ thể dị hợp ${m} cặp gen phân li độc lập. Cơ thể đó tạo ra tối đa bao nhiêu loại giao tử?`,a:Math.pow(2,m),u:'loại',d:0,
  steps:['Mỗi cặp dị hợp cho 2 loại giao tử, các cặp phân li độc lập.',`Số loại = 2^${m} = ${Math.pow(2,m)}.`],w:[2*m,Math.pow(3,m),Math.pow(4,m)]}; });
CGADD('sinh10-gen',3,()=>{ const N=PK([1200,1500,2400,3000]), pA=PK([20,25,30,35]); const A=N*pA/100, Gg=N/2-A, H=2*A+3*Gg;
 return {q:`Một gen có tổng số ${NF(N)} nucleotide và ${NF(H)} liên kết hydrogen. Tính số nucleotide loại A của gen.`,a:A,u:'nu',d:0,
  steps:['2A + 2G = N và 2A + 3G = H.',`Trừ vế: G = H − N = ${NF(H)} − ${NF(N)} = ${NF(Gg)}.`,`A = N/2 − G = ${NF(N/2)} − ${NF(Gg)} = ${NF(A)}.`],w:[Gg,H-2*N,N-Gg]}; });
CGADD('sinh10-gen',2,()=>{ const n=PK([800,1600,3200]); return {q:`Cho P: AaBb × AaBb, hai cặp gen phân li độc lập, trội hoàn toàn. F₁ có ${NF(n)} cây. Số cây mang cả hai tính trạng trội là bao nhiêu?`,a:n*9/16,u:'cây',d:0,
  steps:['AaBb × AaBb → 9 A-B- : 3 A-bb : 3 aaB- : 1 aabb.',`Cây trội cả hai = ${NF(n)} · 9/16 = ${NF(n*9/16)}.`],w:[n*3/16,n*3/4,n/16]}; });
CGADD('sinh10-gen',3,()=>{ const L=PK([4080,5100,3060]), pG=PK([20,30,35]); const N=L/3.4*2, Gg=N*pG/100, k=PK([2,3]); const Gmt=Gg*(Math.pow(2,k)-1);
 return {q:`Một gen dài ${NF(L)} Å, có G chiếm ${pG}%. Gen nhân đôi ${k} lần. Môi trường cung cấp bao nhiêu nucleotide loại G?`,a:Gmt,u:'nu',d:0,
  steps:[`N = 2L/3,4 = 2 · ${NF(L)} : 3,4 = ${NF(N)}.`,`G = ${pG}% · ${NF(N)} = ${NF(Gg)}.`,`G_mt = G(2ᵏ − 1) = ${NF(Gg)} · ${Math.pow(2,k)-1} = ${NF(Gmt)}.`],w:[Gg*Math.pow(2,k),N*(Math.pow(2,k)-1),Gg*k]}; });

// ---------- Tạo câu ----------
function calcPick(f){ // f: {trs:[], grs:[], lvs:[], tops:[]}
  const ok=CG.filter(g=>(!f.trs||!f.trs.length||f.trs.includes(g.tr))&&(!f.grs||!f.grs.length||f.grs.includes(g.g))&&(!f.lvs||!f.lvs.length||f.lvs.includes(g.lv))&&(!f.tops||!f.tops.length||f.tops.includes(g.t)));
  return ok;
}
function calcMake(g){ const o=g.make(); return Object.assign({kind:'calc',t:g.t,tr:g.tr,g:g.g,lv:g.lv},o); }
function calcDeck(f,n){ const gs=calcPick(f); if(!gs.length) return []; const out=[]; let bag=[];
  for(let i=0;i<n;i++){ if(!bag.length) bag=shuffle(gs); out.push(calcMake(bag.pop())); } return out; }
function calcFmt(c,x){ return NF(x,c.d)+(c.u?(c.u==='°'?'°':' '+c.u):''); }
function calcToMCQ(c){ // đổi bài tính thành câu trắc nghiệm 4 lựa chọn cho Đấu trường
  const right=calcFmt(c,c.a); const opts=[right];
  const cand=[...(c.w||[]),c.a*2,c.a/2,c.a*10,c.a+1,c.a*1.5].filter(x=>isFinite(x)&&x>=0);
  for(const x of cand){ if(opts.length>=4) break; const s=calcFmt(c,x); if(!opts.includes(s)) opts.push(s); }
  let k=2; while(opts.length<4){ const s=calcFmt(c,c.a+k); if(!opts.includes(s)) opts.push(s); k++; }
  return {id:'c',src:'calc',ch:c.tr,lv:c.lv,gr:c.g,q:c.q,opts,ex:c.steps.join(' '),calc:{a:c.a,d:c.d}};
}
function calcCheck(c,str){ // đọc số người dùng nhập: chấp nhận 2,5 · 2.5 · 12.000 · 1 200
  let s=String(str||'').trim().replace(/\s/g,''); if(!s) return null;
  if(s.includes(',')) s=s.replace(/\./g,'').replace(',','.'); else if(/^\d{1,3}(\.\d{3})+$/.test(s)) s=s.replace(/\./g,'');
  const x=parseFloat(s); if(!isFinite(x)) return null;
  const tol=Math.max(Math.abs(c.a)*0.01,0.5*Math.pow(10,-Math.min(c.d,2))+1e-9); return Math.abs(x-c.a)<=tol;
}
