"use strict";
// ===== 공통 앱 상태/네비게이션 =====
// 전역 상태 선언 (3D/뷰어 관련 변수 포함)
// setup: 앱 UI 초기화
// nav: 페이지 전환

// ===== 전역 앱 상태 =====
var CU=null,CP='dash',SBT='plate';

// 3D 뷰어 전역 상태 (viewer3d.js에서 사용)
var tS=null,tC=null,tR=null,tAF=null,ray,mse,bMs=[],editMode=false,groundMesh=null,selBldgId=null;
var rotY=.3,rotX=.5,dist=120,panX=0,panY=10,panZ=0,sunHour=10;
var _lastSunPos={alt:45,az:180};

// 현재 편집 중인 현장 ID (pages.js의 rInfo/saveSI에서 사용)
var ceSI=null;

function _findLocalUser(id){
  if(typeof ensureLocalDemoDB==='function')ensureLocalDemoDB();
  var d=gDB();
  if(!d.users||!d.users.length){
    if(typeof iDB==='function')d=iDB();
    else return null;
  }
  var i,u=null;
  if(id){
    for(i=0;i<d.users.length;i++){if(d.users[i].id===id){u=d.users[i];break;}}
  }
  if(!u)u=d.users[0];
  return u||null;
}

// 페이지 로드 시 자동으로 데모 관리자로 앱 진입
document.addEventListener('DOMContentLoaded',function(){
  try{if(typeof ensureLocalDemoDB==='function')ensureLocalDemoDB();}
  catch(e){try{if(typeof iDB==='function')iDB();}catch(e2){console.error('[store]',e2);}}
  autoEnterApp('admin');
});

function enterAsUser(u,curSite){
  CU={id:u.id,name:u.name,role:u.role,sites:u.sites,
    curSite:curSite||(u.role==='admin'?'all':(u.sites&&u.sites[0])||'all')};
  USE_CLOUD=false;
  if(typeof FB_AUTH!=='undefined'&&FB_AUTH){try{FB_AUTH.signOut();}catch(e){}}
  if(typeof FB_USER!=='undefined'){FB_USER=null;}
  if(typeof CU_ORG_ID!=='undefined'){CU_ORG_ID=null;}
  var lp=document.getElementById('LP');if(lp)lp.style.display='none';
  var ps=document.getElementById('pendingScreen');if(ps)ps.style.display='none';
  var rs=document.getElementById('rejectedScreen');if(rs)rs.style.display='none';
  var ap=document.getElementById('AP');if(ap)ap.style.display='block';
  setup();
  if(typeof resetIdleTimer==='function')resetIdleTimer();
}

// 로그인 없이 데모 관리자(admin)로 바로 진입
function autoEnterApp(userId){
  try{
    if(typeof gDB!=='function'){console.error('[autoEnter] gDB missing');return;}
    var u=_findLocalUser(userId||'admin');
    if(!u){toast('데모 사용자를 찾을 수 없습니다','error');return;}
    enterAsUser(u);
  }catch(err){
    console.error('[autoEnter]',err);
    toast('앱 진입 오류: '+(err&&err.message?err.message:String(err)),'error');
  }
}

function doLogout(){
  if(!confirm('로그아웃 하시겠습니까?'))return;
  stopRealtime();
  if(typeof _pendingUnsub!=='undefined'&&_pendingUnsub){try{_pendingUnsub();}catch(e){}_pendingUnsub=null;}
  if(USE_CLOUD&&FB_AUTH){FB_AUTH.signOut();FB_USER=null;USE_CLOUD=false;CU_ORG_ID=null;}
  CU=null;closeSB();
  var mf=document.getElementById('mascotFloat');if(mf)mf.classList.add('hide');
  var mb=document.getElementById('mascotBody');if(mb)mb.innerHTML='';
  if(tAF)cancelAnimationFrame(tAF);
  if(tR){tR.dispose();tR=null;}
  autoEnterApp('admin');
}

// ===== 로그인 후 UI 셋업 =====
function setup(){
  var ia=CU.role==='admin';
  var ua=document.getElementById('UA')||document.getElementById('user-avatar');
  var un=document.getElementById('UN')||document.getElementById('user-name');
  var ur=document.getElementById('UR')||document.getElementById('user-role');
  if(ua){if(ua.id==='UA')ua.className='ua '+(ia?'admin':'manager');ua.textContent=CU.name[0];}
  if(un)un.textContent=CU.name;
  if(ur)ur.textContent=ia?'관리자':'현장담당';
  var navPS=document.getElementById('navPS');if(navPS)navPS.style.display=ia?'flex':'none';
  var navAdmin=document.getElementById('navAdmin');if(navAdmin)navAdmin.style.display=ia?'block':'none';
  var d=gDB();
  var sn=document.getElementById('SN');if(sn)sn.textContent=ia?'전체 현장 관리':(d.sites[CU.curSite]?d.sites[CU.curSite].name:'');
  var cb=document.getElementById('cloudBadge');
  if(cb)cb.style.display=USE_CLOUD?'block':'none';
  popSel();updBdg();
  if(USE_CLOUD)updNoticeBdg();
  nav('dash');
}

// ===== 네비게이션 =====
function nav(p){
  // 엄격한 접근 제어 (프론트 가드 — Firestore 규칙이 실제 방어선)
  var adminOnly=['pset','sites','users'];
  if(adminOnly.indexOf(p)>=0&&CU.role!=='admin'){toast('관리자만 접근 가능','error');return;}
  CP=p;closeSB();
  var pages=document.querySelectorAll('.pg');
  for(var i=0;i<pages.length;i++)pages[i].classList.remove('active');
  var navs=document.querySelectorAll('.ni');
  for(var j=0;j<navs.length;j++)navs[j].classList.remove('active');
  var pe=document.getElementById('pg-'+p);if(pe)pe.classList.add('active');
  var ne=document.querySelector('.ni[data-p="'+p+'"]');if(ne)ne.classList.add('active');
  var ti={dash:['대시보드','메인>대시보드'],notice:['공지사항','메인>공지사항'],info:['현장정보','메인>현장정보'],v3d:['3D 시공현황','시공>3D'],prog:['시공현황','시공>현황'],bldg:['동 설정','시공>동설정'],alerts:['발주 알림','발주>알림'],pset:['발주 설정','발주>설정'],pstat:['발주 현황','발주>현황'],insp:['공장검수','검수>공장검수'],sites:['현장 관리','관리자>현장'],users:['담당자 배정','관리자>담당자'],hist:['수정이력','기록>이력']};
  var t=ti[p]||['',''];
  var pt=document.getElementById('PT')||document.getElementById('current-page-title');
  var pb=document.getElementById('PB')||document.getElementById('page-subtitle');
  if(pt)pt.textContent=t[0];
  if(pb)pb.textContent=t[1];
  var fn={dash:rDash,notice:rNotice,info:rInfo,v3d:init3D,prog:rPT,bldg:rBC,alerts:rAlerts,pset:rPS,pstat:rPStat,insp:rInsp,sites:rSites,users:rUsers,hist:rHist};
  if(fn[p])fn[p]();
  if(typeof mascotReact==='function')mascotReact('nav');
  if(typeof saveUserState==='function')saveUserState();
}

window.autoEnterApp=autoEnterApp;
window.enterAsUser=enterAsUser;
window.doLogout=doLogout;
window.setup=setup;
window.nav=nav;
