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

