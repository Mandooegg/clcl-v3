"use strict";
// ===== REACTIVE MASCOT =====
// blobSVG/catSVG: SVG 문자열 생성
// setMascotMood/mascotReact/mascotPoke/showMascotTip: 상태 제어
// resetIdleTimer: 90초 미사용 시 sleep
// randomMascotTip: 50초마다 25% 확률로 팁 표시

var mascotTimer=null,mascotState={mood:'happy',pokeCount:0};

function blobSVG(sz,mood){
  sz=sz||64;var m=mood||'happy';
  var bodyC=m==='alert'?'#ef4444':m==='proud'?'#10b981':m==='work'?'#8b5cf6':m==='love'?'#ec4899':'#3b82f6';
  var bodyL=m==='alert'?'#f87171':m==='proud'?'#34d399':m==='work'?'#a78bfa':m==='love'?'#f9a8d4':'#60a5fa';
  var bodyH=m==='alert'?'#fca5a5':m==='proud'?'#6ee7b7':m==='work'?'#c4b5fd':m==='love'?'#fbcfe8':'#93c5fd';
  var hatC=m==='alert'?'#dc2626':'#f59e0b';var hatL=m==='alert'?'#b91c1c':'#eab308';
  var hatT=m==='alert'?'#ef4444':'#fbbf24';
  // 눈
  var eyes;
  if(m==='sleep') eyes='<path d="M72 118 Q80 112 88 118" fill="none" stroke="#0f172a" stroke-width="3" stroke-linecap="round"/><path d="M112 118 Q120 112 128 118" fill="none" stroke="#0f172a" stroke-width="3" stroke-linecap="round"/>';
  else if(m==='love') eyes='<path d="M74 112 L80 104 L86 112 L80 120Z" fill="#be185d"/><path d="M114 112 L120 104 L126 112 L120 120Z" fill="#be185d"/>';
  else if(m==='alert') eyes='<ellipse cx="80" cy="112" rx="13" ry="16" fill="#0f172a"/><ellipse cx="120" cy="112" rx="13" ry="16" fill="#0f172a"/><circle cx="80" cy="110" r="6" fill="#fff"/><circle cx="120" cy="110" r="6" fill="#fff"/><circle cx="83" cy="107" r="2.5" fill="#fff" opacity=".5"/><circle cx="123" cy="107" r="2.5" fill="#fff" opacity=".5"/>';
  else if(m==='work') eyes='<ellipse cx="80" cy="115" rx="11" ry="13" fill="#0f172a"/><ellipse cx="120" cy="115" rx="11" ry="13" fill="#0f172a"/><ellipse cx="82" cy="116" rx="7" ry="9" fill="#4c1d95"/><ellipse cx="122" cy="116" rx="7" ry="9" fill="#4c1d95"/><circle cx="85" cy="111" r="3.5" fill="#fff"/><circle cx="125" cy="111" r="3.5" fill="#fff"/>';
  else if(m==='surprised') eyes='<ellipse cx="80" cy="112" rx="13" ry="16" fill="#0f172a"/><ellipse cx="120" cy="112" rx="13" ry="16" fill="#0f172a"/><ellipse cx="82" cy="113" rx="8" ry="10" fill="#1e40af"/><ellipse cx="122" cy="113" rx="8" ry="10" fill="#1e40af"/><circle cx="85" cy="108" r="5" fill="#fff"/><circle cx="125" cy="108" r="5" fill="#fff"/><circle cx="79" cy="117" r="2" fill="#fff" opacity=".5"/><circle cx="119" cy="117" r="2" fill="#fff" opacity=".5"/>';
  else eyes='<ellipse cx="80" cy="115" rx="11" ry="13" fill="#0f172a"/><ellipse cx="120" cy="115" rx="11" ry="13" fill="#0f172a"/><ellipse cx="82" cy="116" rx="7" ry="9" fill="#1e40af"/><ellipse cx="122" cy="116" rx="7" ry="9" fill="#1e40af"/><circle cx="85" cy="111" r="4" fill="#fff"/><circle cx="125" cy="111" r="4" fill="#fff"/><circle cx="79" cy="118" r="2" fill="#fff" opacity=".5"/><circle cx="119" cy="118" r="2" fill="#fff" opacity=".5"/><circle cx="87" cy="108" r="1.5" fill="#fff" opacity=".7"/><circle cx="127" cy="108" r="1.5" fill="#fff" opacity=".7"/>';
  // 입
  var mouth;
  if(m==='surprised') mouth='<ellipse cx="100" cy="146" rx="7" ry="8" fill="#1e3a5f"/>';
  else if(m==='alert') mouth='<path d="M88 142 L100 136 L112 142" fill="none" stroke="#7f1d1d" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>';
  else if(m==='proud') mouth='<path d="M84 138 Q100 156 116 138" fill="none" stroke="#064e3b" stroke-width="3" stroke-linecap="round"/>';
  else if(m==='love') mouth='<path d="M86 140 Q100 156 114 140" fill="none" stroke="#9d174d" stroke-width="3" stroke-linecap="round"/>';
  else if(m==='sleep') mouth='<path d="M92 140 Q100 146 108 140" fill="none" stroke="#1e3a5f" stroke-width="2.5" stroke-linecap="round"/><text x="140" y="98" font-size="14" fill="#64748b" font-weight="bold">z</text><text x="150" y="86" font-size="10" fill="#64748b" opacity=".5">z</text>';
  else if(m==='work') mouth='<line x1="90" y1="142" x2="110" y2="142" stroke="#312e81" stroke-width="3" stroke-linecap="round"/>';
  else mouth='<path d="M88 140 Q100 152 112 140" fill="none" stroke="#1e3a5f" stroke-width="3" stroke-linecap="round"/>';
  // 볼
  var cheekC=m==='love'?'#fda4af':m==='proud'?'#6ee7b7':m==='alert'?'#fca5a5':'#818cf8';
  var ext='<ellipse cx="62" cy="134" rx="10" ry="7" fill="'+cheekC+'" opacity=".3"/><ellipse cx="138" cy="134" rx="10" ry="7" fill="'+cheekC+'" opacity=".3"/>';
  // 팔 흔들기
  if(m==='happy'||m==='proud'||m==='love') ext+='<ellipse cx="155" cy="130" rx="14" ry="10" fill="'+bodyL+'" transform="rotate(-15 155 130)"><animateTransform attributeName="transform" type="rotate" values="-15 155 130;-35 155 125;5 155 135;-15 155 130" dur="1.5s" repeatCount="indefinite"/></ellipse>';
  else ext+='<ellipse cx="155" cy="135" rx="13" ry="9" fill="'+bodyL+'" transform="rotate(-10 155 135)"/>';
  ext+='<ellipse cx="45" cy="138" rx="13" ry="9" fill="'+bodyL+'" transform="rotate(10 45 138)"/>';
  // 파티클
  if(m==='alert') ext+='<circle cx="148" cy="90" r="3.5" fill="#93c5fd" opacity=".8"><animate attributeName="cy" values="90;108;90" dur="1.2s" repeatCount="indefinite"/><animate attributeName="opacity" values=".8;0;.8" dur="1.2s" repeatCount="indefinite"/></circle><text x="56" y="92" font-size="16" fill="#fbbf24" font-weight="bold">!</text>';
  if(m==='proud') ext+='<polygon points="40,72 43,64 46,72" fill="#fbbf24"><animate attributeName="opacity" values="1;.2;1" dur="1s" repeatCount="indefinite"/></polygon><polygon points="154,62 157,54 160,62" fill="#fbbf24"><animate attributeName="opacity" values=".2;1;.2" dur=".8s" repeatCount="indefinite"/></polygon><polygon points="96,42 99,36 102,42" fill="#fbbf24"><animate attributeName="opacity" values=".5;1;.5" dur="1.2s" repeatCount="indefinite"/></polygon>';
  if(m==='love') ext+='<path d="M42 74 L46 68 L50 74 L46 80Z" fill="#f9a8d4"><animate attributeName="opacity" values="1;.3;1" dur="1.5s" repeatCount="indefinite"/></path><path d="M150 66 L154 60 L158 66 L154 72Z" fill="#f9a8d4"><animate attributeName="opacity" values=".3;1;.3" dur="1.2s" repeatCount="indefinite"/></path>';
  return '<svg width="'+sz+'" height="'+sz+'" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" style="vertical-align:middle;display:inline-block">'
    +'<ellipse cx="100" cy="188" rx="35" ry="5" fill="#1e293b" opacity=".25"/>'
    +'<ellipse cx="78" cy="176" rx="12" ry="7" fill="'+bodyC+'"/><ellipse cx="122" cy="176" rx="12" ry="7" fill="'+bodyC+'"/>'
    +'<ellipse cx="78" cy="175" rx="10" ry="5" fill="'+bodyL+'"/><ellipse cx="122" cy="175" rx="10" ry="5" fill="'+bodyL+'"/>'
    +'<ellipse cx="100" cy="130" rx="50" ry="55" fill="'+bodyC+'"/>'
    +'<ellipse cx="100" cy="128" rx="46" ry="50" fill="'+bodyL+'"/>'
    +'<ellipse cx="82" cy="108" rx="12" ry="18" fill="'+bodyH+'" opacity=".2" transform="rotate(-15 82 108)"/>'
    +'<path d="M56 80 Q58 58 100 54 Q142 58 144 80 Z" fill="'+hatC+'"/>'
    +'<rect x="50" y="76" width="100" height="10" rx="5" fill="'+hatL+'"/>'
    +'<rect x="82" y="46" width="36" height="14" rx="5" fill="'+hatT+'"/>'
    +'<circle cx="100" cy="50" r="4" fill="#fef3c7"><animate attributeName="opacity" values="1;.4;1" dur="2s" repeatCount="indefinite"/></circle>'
    +eyes+mouth+ext+'</svg>';
}
function catSVG(sz,mood){return blobSVG(sz,mood);}
function emptyState(msg){return '<div style="text-align:center;padding:20px 10px;color:var(--t3)">'+blobSVG(60,'sleep')+'<div style="margin-top:8px;font-size:11px">'+(msg||'아직 데이터가 없어요~')+'</div></div>';}

function setMascotMood(mood,anim){
  mascotState.mood=mood;
  var body=document.getElementById('mascotBody');if(!body)return;
  body.innerHTML=blobSVG(72,mood);
  body.className='';
  var glowMap={proud:'glow-green',alert:'glow-red',love:'glow-pink',work:'glow-purple',happy:'glow-blue'};
  if(glowMap[mood])body.className=glowMap[mood];
  if(anim){
    var fl=document.getElementById('mascotFloat');if(!fl)return;
    fl.classList.remove('bounce','wiggle','spin','nod','jump');
    void fl.offsetWidth;fl.classList.add(anim);
    setTimeout(function(){fl.classList.remove(anim);},900);
  }
}

function mascotPoke(){
  mascotState.pokeCount++;var p=mascotState.pokeCount;
  if(p>=10){mascotState.pokeCount=0;setMascotMood('proud','spin');showMascotTip('참았어요!','당신의 인내심 테스트 합격! 🏆');return;}
  if(p>=7){setMascotMood('work','jump');showMascotTip('일하는중!','방해하지 마세요~ 💻');return;}
  if(p>=5){setMascotMood('love','spin');showMascotTip('💕','...그래도 좋아해요');return;}
  if(p>=3){setMascotMood('alert','wiggle');showMascotTip('앗!','그만 찔러요~ 😤');return;}
  setMascotMood('surprised','bounce');
  var msgs=['앗!','왜요?','네?','뭐예요~','헤헤','안녕!'];
  showMascotTip('👆',msgs[Math.floor(Math.random()*msgs.length)]);
}

function mascotReact(event,detail){
  var fl=document.getElementById('mascotFloat');if(!fl)return;
  var wasHidden=fl.classList.contains('hide');
  fl.classList.remove('hide');
  if(wasHidden){fl.classList.add('entrance');setTimeout(function(){fl.classList.remove('entrance');},1200);}
  if(!document.getElementById('mascotBody').innerHTML)setMascotMood('happy','');
  if(event==='save'){setMascotMood('proud','bounce');showMascotTip('저장!',detail||'잘 하고 있어요 ✨');}
  else if(event==='error'){setMascotMood('alert','wiggle');showMascotTip('오류!',detail||'확인해보세요');}
  else if(event==='progress'){setMascotMood('proud','jump');showMascotTip('시공!',detail||'착착 진행중');}
  else if(event==='alert'){setMascotMood('alert','nod');showMascotTip('📢',detail||'확인 필요!');}
  else if(event==='delete'){setMascotMood('surprised','wiggle');showMascotTip('삭제',detail||'정리 완료~');}
  else if(event==='nav'){setMascotMood('happy','nod');}
  else if(event==='idle'){setMascotMood('sleep','');}
  else if(event==='login'){setMascotMood('love','jump');}
  else{setMascotMood('happy','bounce');}
}

var idleTimer=null;
function resetIdleTimer(){
  if(!CU)return;
  if(mascotState.mood==='sleep')setMascotMood('happy','');
  if(idleTimer)clearTimeout(idleTimer);
  idleTimer=setTimeout(function(){if(CU)mascotReact('idle');},90000);
}
document.addEventListener('click',function(){resetIdleTimer();},{passive:true});

var mascotTips=[
  ['시공 체크','3D에서 호수를 탭하면 상태 변경!'],
  ['발주 관리','층 완료시 자동 발주 알림 📦'],
  ['엑셀','시공현황을 엑셀로 다운로드 📊'],
  ['배치 편집','3D에서 동을 드래그로 이동'],
  ['검수','검수항목 등록하고 추적 🔬'],
  ['태양','슬라이더로 그림자 확인 ☀️'],
  ['모바일','핀치 줌, 두손가락 이동!'],
  ['화이팅!','안전 제일! 🦺']
];
function showMascotTip(title,msg){
  var fl=document.getElementById('mascotFloat'),bb=document.getElementById('mascotBubble');
  var tt=document.getElementById('mbTitle'),mm=document.getElementById('mbMsg');
  if(!fl||!bb)return;fl.classList.remove('hide');bb.style.display='block';
  var body=document.getElementById('mascotBody');
  if(body&&!body.innerHTML)body.innerHTML=blobSVG(72,'happy');
  if(tt)tt.textContent=title||'';if(mm)mm.textContent=msg||'';
  if(mascotTimer)clearTimeout(mascotTimer);
  mascotTimer=setTimeout(function(){hideMascotTip();},5000);
}
function hideMascotTip(){var bb=document.getElementById('mascotBubble');if(bb)bb.style.display='none';}
function randomMascotTip(){
  if(!CU)return;
  var tip=mascotTips[Math.floor(Math.random()*mascotTips.length)];
  setMascotMood('happy','nod');showMascotTip(tip[0],tip[1]);
}
setInterval(function(){if(CU&&Math.random()<.25)randomMascotTip();},50000);
