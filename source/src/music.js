// ===================== NHẠC NỀN · NHẠC CHIẾN THẮNG · LỜI CHÚC MỪNG · PHÁO GIẤY =====================
// Nhạc tự tổng hợp bằng Web Audio (không dùng bản nhạc có bản quyền). 🎵 bật/tắt nhạc nền, 🔊 bật/tắt hiệu ứng + giọng đọc.
if(DB.music===undefined) DB.music=true;
const MU={on:false,timer:null,step:0,next:0,fast:false,cur:null,cel:null,gain:null};
function muCtx(){ try{ AC=AC||new (window.AudioContext||window.webkitAudioContext)(); if(AC.state==='suspended') AC.resume(); return AC; }catch(e){ return null; } }
const NOTE=n=>440*Math.pow(2,(n-69)/12);
function tone(ctx,out,f,t,d,type,vol){ const o=ctx.createOscillator(),g=ctx.createGain(); o.type=type; o.frequency.value=f;
  g.gain.setValueAtTime(0.0001,t); g.gain.exponentialRampToValueAtTime(vol,t+0.012); g.gain.exponentialRampToValueAtTime(0.0001,t+d); o.connect(g); g.connect(out); o.start(t); o.stop(t+d+0.02); }
let NOISE=null; function hat(ctx,out,t,vol){ if(!NOISE){ NOISE=ctx.createBuffer(1,ctx.sampleRate*0.05,ctx.sampleRate); const d=NOISE.getChannelData(0); for(let i=0;i<d.length;i++) d[i]=Math.random()*2-1; }
  const s=ctx.createBufferSource(), f=ctx.createBiquadFilter(), g=ctx.createGain(); s.buffer=NOISE; f.type='highpass'; f.frequency.value=7000; g.gain.setValueAtTime(vol,t); g.gain.exponentialRampToValueAtTime(0.0001,t+0.04); s.connect(f); f.connect(g); g.connect(out); s.start(t); }
// vòng hoà âm Am – F – C – G, bass + rải hợp âm + hi-hat
const PROG=[[57,60,64],[53,57,60],[48,52,55],[55,59,62]];
function muSchedule(){ const ctx=AC; if(!ctx||!MU.on) return; const spb=60/(MU.fast?150:118)/4; // 1 phách 16
  while(MU.next<ctx.currentTime+0.15){ const st=MU.step%64, bar=Math.floor(st/16), ch=PROG[bar], t=MU.next, s16=st%16;
    if(s16%4===0) tone(ctx,MU.gain,NOTE(ch[0]-24+(s16===8?12:0)),t,spb*3.2,'triangle',0.5);
    const arp=[0,1,2,1,0,2,1,2][s16%8]; if(s16%2===0||MU.fast) tone(ctx,MU.gain,NOTE(ch[arp]+12),t,spb*0.9,'square',0.07);
    if(s16%2===1) hat(ctx,MU.gain,t,MU.fast?0.18:0.1);
    if(s16===0&&bar%2===0) tone(ctx,MU.gain,NOTE(ch[2]+24),t,spb*6,'sine',0.08);
    MU.next+=spb; MU.step++; } }
function musicStart(){ if(!DB.music) return; const ctx=muCtx(); if(!ctx) return; if(MU.on) return;
  MU.gain=ctx.createGain(); MU.gain.gain.value=0.12; MU.gain.connect(ctx.destination); MU.on=true; MU.step=0; MU.next=ctx.currentTime+0.05; MU.timer=setInterval(muSchedule,40); }
function musicStop(){ if(!MU.on) return; MU.on=false; clearInterval(MU.timer); try{ const g=MU.gain; g.gain.setTargetAtTime(0.0001,AC.currentTime,0.15); setTimeout(()=>g.disconnect(),800); }catch(e){} }
function fanfare(big){ if(!DB.sound) return; const ctx=muCtx(); if(!ctx) return; const out=ctx.createGain(); out.gain.value=0.22; out.connect(ctx.destination); const t0=ctx.currentTime+0.05;
  const mel=big?[[67,0,.18],[72,.18,.18],[76,.36,.18],[79,.54,.36],[76,.9,.18],[79,1.08,1.1]]:[[72,0,.15],[76,.15,.15],[79,.3,.15],[84,.45,.9]];
  mel.forEach(([n,a,d])=>{ tone(ctx,out,NOTE(n),t0+a,d+0.25,'square',0.18); tone(ctx,out,NOTE(n-12),t0+a,d+0.25,'triangle',0.3); });
  const end=t0+mel[mel.length-1][1]; [60,64,67,72].forEach(n=>tone(ctx,out,NOTE(n),end,1.3,'sawtooth',0.05));
  for(let i=0;i<(big?28:16);i++) hat(ctx,out,end+0.2+i*0.045+Math.random()*0.03,0.25*Math.random()); // tiếng vỗ tay
}
function sayVi(text){ if(!DB.sound||!('speechSynthesis' in window)) return; try{ speechSynthesis.cancel(); const u=new SpeechSynthesisUtterance(text); u.lang='vi-VN'; u.rate=0.95; u.pitch=1.1;
  const vs=speechSynthesis.getVoices(); const vi=vs.find(v=>/^vi/i.test(v.lang)&&/natural|online|hoaimy/i.test(v.name))||vs.find(v=>/^vi/i.test(v.lang)); if(vi) u.voice=vi; setTimeout(()=>speechSynthesis.speak(u),900); }catch(e){} }
if('speechSynthesis' in window){ try{ speechSynthesis.getVoices(); speechSynthesis.onvoiceschanged=()=>speechSynthesis.getVoices(); }catch(e){} }
function confetti(big){ const c=document.createElement('canvas'); c.style.cssText='position:fixed;inset:0;width:100%;height:100%;pointer-events:none;z-index:9999'; document.body.appendChild(c);
  const W=c.width=innerWidth, H=c.height=innerHeight, g=c.getContext('2d'), cols=['#0f8a5f','#f2b705','#e8505b','#3b82f6','#a855f7','#22c55e'];
  const ps=Array.from({length:big?220:130},()=>({x:Math.random()*W,y:-20-Math.random()*H*0.4,vx:(Math.random()-.5)*4,vy:2+Math.random()*4,r:4+Math.random()*6,a:Math.random()*6,va:(Math.random()-.5)*.3,c:cols[Math.random()*cols.length|0]}));
  const t0=performance.now(); const fr=now=>{ g.clearRect(0,0,W,H); ps.forEach(p=>{ p.x+=p.vx; p.y+=p.vy; p.vy+=0.05; p.a+=p.va; g.save(); g.translate(p.x,p.y); g.rotate(p.a); g.fillStyle=p.c; g.fillRect(-p.r,-p.r/2,p.r*2,p.r); g.restore(); });
    if(now-t0<(big?4500:3200)) requestAnimationFrame(fr); else c.remove(); }; requestAnimationFrame(fr); }
function celebrate(text,big){ musicStop(); fanfare(big); confetti(big); if(text) sayVi(text); }
// gọi mỗi lần vẽ trận đấu: tự bật nhạc khi đấu, đổi nhịp nhanh lúc "điểm quyết định", mừng chiến thắng khi kết thúc
function matchMusic(key,phase,score,target,winText){
  if(phase==='end'){ if(MU.cel!==key){ MU.cel=key; celebrate(winText); } return; }
  if(MU.cur!==key){ MU.cur=key; musicStop(); }
  MU.fast=!!(score&&target&&Math.max(score.A||0,score.B||0)>=target-1);
  if(phase!=='ready') musicStart(); }
