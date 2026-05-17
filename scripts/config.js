"use strict";
// ===== SITE-MASTER v2.3 =====
// ===== 상수 (상태/라벨/색상/형태) + Firebase 설정 =====

// 시공 상태
var SC=['pending','inprogress','complete'];
var SL={pending:'준비중',inprogress:'시공중',complete:'시공완료'};
var SH={pending:0x64748b,inprogress:0xf59e0b,complete:0x3b82f6};

// 발주 단계
var PS=['ready','request','bidding','bidcomplete','ordered'];
var PL={ready:'발주준비',request:'의뢰서상신',bidding:'입찰예정',bidcomplete:'입찰완료',ordered:'발주완료'};

// 건물 형태
var TN={plate:'판상형',tower:'타워형',corridor:'복도형',mixed:'혼합형',lshape:'ㄱ자형',ushape:'ㄷ자형'};
var TI={plate:'🏢',tower:'🏙️',corridor:'🏨',mixed:'🏗️',lshape:'🔲',ushape:'🔳'};

// 검수 상태
var ISL={scheduled:'예정',inprogress:'진행중',pass:'합격',fail:'불합격',retest:'재검수'};
var ISI={scheduled:'📅',inprogress:'🔄',pass:'✅',fail:'❌',retest:'🔁'};

// 현장 최대 개수
var MAX_SITES=40;

// 로그인 화면 없이 로컬 데모 관리자로 바로 진입 (로컬 개발용)
var SKIP_LOGIN=true;

// ===== FIREBASE CONFIG =====
// Firebase 콘솔(console.firebase.google.com)에서 복사하세요
var FIREBASE_CONFIG={
  apiKey:'AIzaSyB56X5THX14JAR71Knd3XNzFcSYf8Wt9Rs',
  authDomain:'site-master-2026.firebaseapp.com',
  projectId:'site-master-2026',
  storageBucket:'site-master-2026.firebasestorage.app',
  messagingSenderId:'677946471168',
  appId:'1:677946471168:web:7487f5801f6d7ca5e3b9e5',
  measurementId:'G-9GCR6GL4M0'
};

// Firebase 런타임 상태
var FB_AUTH=null;
var FB_DB=null;
var FB_USER=null;
var USE_CLOUD=false;
var CU_ORG_ID=null;

function isFirebaseConfigured(){return FIREBASE_CONFIG.apiKey!=='YOUR_FIREBASE_API_KEY';}

// file:// 직접 열기·로컬 개발 시 클라우드 대신 로컬 로그인 우선
function preferLocalLogin(){
  if(location.protocol==='file:')return true;
  if(location.hostname==='localhost'||location.hostname==='127.0.0.1')return true;
  if(/[?&]local=1(?:&|$)/.test(location.search))return true;
  try{return localStorage.getItem('sm_force_local')==='1';}catch(e){return false;}
}

// 로그인 모드 스위처
window.preferLocalLogin=preferLocalLogin;
window.switchLoginMode=switchLoginMode;

function switchLoginMode(mode){
  document.getElementById('loginCloud').style.display=mode==='cloud'?'block':'none';
  document.getElementById('loginLocal').style.display=mode==='local'?'block':'none';
  document.getElementById('tabCloud').style.background=mode==='cloud'?'rgba(59,130,246,.15)':'var(--bg1)';
  document.getElementById('tabCloud').style.color=mode==='cloud'?'var(--blue)':'var(--t3)';
  document.getElementById('tabLocal').style.background=mode==='local'?'rgba(59,130,246,.15)':'var(--bg1)';
  document.getElementById('tabLocal').style.color=mode==='local'?'var(--blue)':'var(--t3)';
  if(mode==='cloud'&&!isFirebaseConfigured()){
    document.getElementById('cloudStatus').innerHTML='<span style="color:var(--amber)">Firebase 미설정</span><br><span style="font-size:10px">scripts/config.js 상단의 FIREBASE_CONFIG를 설정하세요.</span>';
  }
}
