'use strict';
// ===== LOCAL DATA STORE (localStorage 레이어) =====
// iDB(): 초기 seed 데이터 생성
// gDB(): 현재 DB 반환 (메모리 캐시 우선)
// sDB(d): 저장 + USE_CLOUD 시 클라우드 동기화 트리거

var DK='sitemaster_db_v2';
var _memDB=null;

function iDB(){
  // 초기 seed: 로컬 모드 데모용 기본 데이터
  // ⚠️ 운영 배포 시 데모 계정 삭제 필수
  var d={
    users:[
      {id:'admin',pw:'1234',name:'관리자',role:'admin',sites:['all']},
      {id:'manager1',pw:'1234',name:'김현장',role:'manager',sites:['site1']},
      {id:'manager2',pw:'1234',name:'박대전',role:'manager',sites:['site2']}
    ],
    sites:{
      site1:{id:'site1',name:'세종시 행복아파트',info:{projectName:'세종시 행복아파트 신축공사',location:'세종특별자치시 행복동 123-4',lat:36.48,lng:127.29,owner:'한국토지주택공사',contractor:'(주)대한건설',supervisor:'한국건설감리',totalArea:'45,000㎡',buildingArea:'12,000㎡',floors:'B2/25F',households:'1,280세대',startDate:'2024-03-15',endDate:'2026-12-31',structure:'철근콘크리트 벽식구조'},buildings:[],progress:{}},
      site2:{id:'site2',name:'대전 한빛아파트',info:{projectName:'대전 한빛아파트 신축공사',location:'대전광역시 유성구 한빛로 88',lat:36.35,lng:127.38,owner:'대전도시공사',contractor:'(주)한빛건설',supervisor:'대전감리단',totalArea:'32,000㎡',buildingArea:'8,500㎡',floors:'B2/22F',households:'864세대',startDate:'2024-06-01',endDate:'2026-09-30',structure:'철근콘크리트 벽식구조'},buildings:[],progress:{}}
    },
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

function _needsDemoReseed(parsed){
  if(!parsed||!parsed.users||!parsed.users.length)return true;
  for(var i=0;i<parsed.users.length;i++){
    if(parsed.users[i].id==='admin'&&parsed.users[i].pw==='1234')return false;
  }
  return true;
}

function gDB(){
  if(_memDB)return _memDB;
  try{
    var raw=localStorage.getItem(DK);
    if(raw){
      var parsed=JSON.parse(raw);
      if(_needsDemoReseed(parsed))return iDB();
      _memDB=parsed;
      return _memDB;
    }
  }catch(e){}
  return iDB();
}

// 페이지 로드 시 로컬 데모 계정·현장 데이터 보장
function ensureLocalDemoDB(){
  _memDB=null;
  var d=gDB();
  if(_needsDemoReseed(d))return iDB();
  return d;
}

function sDB(d){
  _memDB=d;
  try{localStorage.setItem(DK,JSON.stringify(d));}catch(e){}
  if(window.USE_CLOUD)window.saveToCloud();
}

// 전역 노출 (file:// 포함 — 일반 script 로드)
window.DK=DK;
window.gDB=gDB;
window.sDB=sDB;
window.iDB=iDB;
window.ensureLocalDemoDB=ensureLocalDemoDB;
