'use strict';
// ===== LOCAL DATA STORE (localStorage 레이어) =====
// iDB(): 초기 seed 데이터 생성
// gDB(): 현재 DB 반환 (메모리 캐시 우선)
// sDB(d): 저장 + USE_CLOUD 시 클라우드 동기화 트리거

var DK='sitemaster_db_v2';
var _memDB=null;

function iDB(){
  // 초기 seed: 빈 데이터로 시작 (운영 배포: 데모 계정 제거됨)
  // 클라우드 모드(Firebase)가 기본이며, 로컬 모드는 Firebase 미설정 시 fallback용
  var d={
    users:[],
    sites:{},
    procRules:[],
    procOrders:[],
    alerts:[],
    inspections:[],
    editHistory:[]
  };
  _memDB=d;
  try{localStorage.setItem(DK,JSON.stringify(d));}catch(e){}
  return d;
}

function gDB(){
  if(_memDB)return _memDB;
  try{
    var raw=localStorage.getItem(DK);
    if(raw){_memDB=JSON.parse(raw);return _memDB;}
  }catch(e){}
  return iDB();
}

function sDB(d){
  _memDB=d;
  try{localStorage.setItem(DK,JSON.stringify(d));}catch(e){}
  if(window.USE_CLOUD)window.saveToCloud();
}

// ===== ES Module exports (Phase 2) =====
// window 할당: 비-모듈 스크립트 (firebase.js, pages.js 등)와 하위 호환
window.gDB=gDB;
window.sDB=sDB;
window.iDB=iDB;

export { gDB, sDB, iDB };
