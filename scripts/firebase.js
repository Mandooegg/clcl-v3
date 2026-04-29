"use strict";
// ===== FIREBASE (Auth + Firestore + Realtime + Notice) =====
// onFirebaseReady(): CDN 로드 완료 시 main.js에서 호출
// cloudLogin/cloudSignup/cloudResetPw: 인증 플로우
// loadCloudData/saveToCloud: 데이터 동기화
// startRealtime/stopRealtime: onSnapshot 구독
// rNotice/saveNotice/delNotice/markNoticeRead/updNoticeBdg: 공지사항

// ===== 상태 메시지 =====
function setCloudStatus(msg,isErr){
  var el=document.getElementById('cloudStatus');
  if(el){el.textContent=msg;el.style.color=isErr?'var(--red)':'var(--green)';}
}

// Firebase 초기화 (main.js의 CDN 로더가 호출)
function onFirebaseReady(){
  if(!isFirebaseConfigured())return;
  try{
    firebase.initializeApp(FIREBASE_CONFIG);
    FB_AUTH=firebase.auth();
    FB_DB=firebase.firestore();
    FB_DB.enablePersistence({synchronizeTabs:true}).catch(function(e){
      if(e.code==='failed-precondition'){console.warn('[Firestore] 다중 탭: 오프라인 캐시 비활성');}
      else if(e.code==='unimplemented'){console.warn('[Firestore] 브라우저 오프라인 캐시 미지원');}
    });
    var cs=document.getElementById('cloudStatus');
    if(cs)cs.innerHTML='<span style="color:var(--green)">✅ Firebase 연결됨</span>';
    FB_AUTH.onAuthStateChanged(function(user){
      if(user&&!CU){FB_USER=user;USE_CLOUD=true;_loadProfileAndEnter();}
    });
  }catch(e){
    var cs2=document.getElementById('cloudStatus');
    if(cs2)cs2.innerHTML='<span style="color:var(--red)">Firebase 초기화 실패: '+esc(e.message)+'</span>';
  }
}

// OAuth(Google 등) 사용자 여부
function _isOAuthUser(user){
  if(!user||!user.providerData)return false;
  return user.providerData.some(function(p){return p.providerId&&p.providerId!=='password';});
}

// ===== 프로필 로드 & 앱 진입 =====
function _loadProfileAndEnter(){
  setCloudStatus('프로필 로딩...');
  // 이메일/비번 가입자는 이메일 인증 필요 (OAuth는 provider가 이미 인증한 것으로 간주)
  if(FB_USER&&FB_USER.email&&!FB_USER.emailVerified&&!_isOAuthUser(FB_USER)){
    // 인증 메일 자동 재발송 (이전 메일을 못 받은 경우 대비)
    var u=FB_USER;
    setCloudStatus('인증 메일을 다시 보내는 중...');
    u.sendEmailVerification().then(function(){
      var msg=document.getElementById('cloudStatus');
      if(msg){
        msg.innerHTML='<div style="color:var(--amber);font-weight:600;margin-bottom:6px">📧 인증 메일을 ('+u.email+')로 발송했습니다</div>'
          +'<div style="color:var(--t2);font-size:10px;line-height:1.6;text-align:left">'
          +'1. <strong>스팸함</strong> 또는 <strong>프로모션</strong> 탭 확인<br>'
          +'2. 발신자: noreply@site-master-2026.firebaseapp.com<br>'
          +'3. 제목: "Verify your email..."<br>'
          +'4. 메일 안의 링크 클릭 후 <strong>이 페이지에서 다시 로그인</strong></div>';
      }
    }).catch(function(e){
      // too-many-requests 등의 에러 케이스
      var msg=e.code==='auth/too-many-requests'
        ? '메일 재발송 횟수 초과. 5분 후 다시 시도하거나 이미 받은 메일의 링크를 확인해주세요.'
        : '이메일 인증이 필요합니다. 메일함(스팸함 포함)을 확인하세요. ('+e.message+')';
      setCloudStatus(msg,true);
    }).then(function(){
      // 어떤 결과든 로그아웃 (다시 로그인하도록)
      setTimeout(function(){
        FB_AUTH.signOut();FB_USER=null;USE_CLOUD=false;CU_ORG_ID=null;
      },3000);
    });
    return;
  }
  FB_DB.collection('users').doc(FB_USER.uid).get().then(function(doc){
    if(!doc.exists){
      // 프로필 없음 — 가입 중 일부 실패했거나 OAuth 첫 로그인.
      // 어느 경우든 조직 설정 모달로 복구
      setCloudStatus('프로필이 없어 조직 설정으로 이동합니다...');
      _showOrgSetupModal();
      return;
    }
    _enterApp(doc.data());
  }).catch(function(e){setCloudStatus('프로필 오류: '+e.message,true);});
}

// ===== Google 로그인 =====
function cloudLoginGoogle(){
  if(!FB_AUTH){setCloudStatus('Firebase 미설정',true);return;}
  var provider=new firebase.auth.GoogleAuthProvider();
  provider.addScope('email');provider.addScope('profile');
  setCloudStatus('Google 로그인 창 열림...');
  FB_AUTH.signInWithPopup(provider).then(function(result){
    FB_USER=result.user;USE_CLOUD=true;
    _loadProfileAndEnter();
  }).catch(function(e){
    var msg=e.message;
    if(e.code==='auth/popup-blocked')msg='팝업이 차단되었습니다. 브라우저에서 팝업을 허용해주세요.';
    else if(e.code==='auth/popup-closed-by-user')msg='로그인이 취소되었습니다.';
    else if(e.code==='auth/unauthorized-domain')msg='승인되지 않은 도메인입니다. Firebase 콘솔 > Authentication > 승인 도메인을 확인하세요.';
    else if(e.code==='auth/account-exists-with-different-credential')msg='같은 이메일로 이미 다른 방식으로 가입되어 있습니다.';
    setCloudStatus(msg,true);
  });
}

// ===== 조직 설정 모달 (OAuth 신규 사용자 전용) =====
function _showOrgSetupModal(){
  setCloudStatus('');
  var defaultName=(FB_USER&&FB_USER.displayName)||(FB_USER&&FB_USER.email?FB_USER.email.split('@')[0]:'');
  var nEl=document.getElementById('osName');if(nEl)nEl.value=defaultName;
  var oEl=document.getElementById('osOrgName');if(oEl)oEl.value='';
  oM('mOrgSetup');
}

// (deprecated, no-op) — 가입 옵션이 단일화됨
function switchOrgSetupType(type){}

function finishOrgSetup(){
  if(!FB_USER){toast('인증 상태 오류','error');return;}
  var name=document.getElementById('osName').value.trim();
  if(!name){toast('이름을 입력하세요','error');return;}
  var uid=FB_USER.uid;
  var email=(FB_USER&&FB_USER.email)||'';
  // 이미 user 문서·orgId가 있으면 차단 (중복 방지)
  FB_DB.collection('users').doc(uid).get().then(function(existing){
    if(existing.exists&&existing.data().orgId){
      throw new Error('이미 조직에 소속되어 있습니다. 로그아웃 후 다시 로그인해주세요.');
    }
    return FB_DB.collection('organizations').limit(1).get().then(function(orgSnap){
      var batch=FB_DB.batch();
      if(orgSnap.empty){
        // 첫 가입자 = 메인관리자
        var orgRef=FB_DB.collection('organizations').doc();
        var code=_genOrgCode();
        batch.set(orgRef,{name:name+'의 조직',orgCode:code,createdAt:firebase.firestore.FieldValue.serverTimestamp()});
        batch.set(FB_DB.collection('users').doc(uid),{
          name:name,email:email,role:'admin',isMainAdmin:true,
          orgId:orgRef.id,sites:['all'],status:'active',
          createdAt:firebase.firestore.FieldValue.serverTimestamp()
        });
        return batch.commit().then(function(){return {orgId:orgRef.id,role:'admin',sites:['all'],status:'active'};});
      }else{
        var orgDoc=orgSnap.docs[0];
        batch.set(FB_DB.collection('users').doc(uid),{
          name:name,email:email,role:'manager',isMainAdmin:false,
          orgId:orgDoc.id,sites:[],status:'pending',
          createdAt:firebase.firestore.FieldValue.serverTimestamp()
        });
        // 알림 문서는 startRealtime onSnapshot으로 대체 (보안 규칙 충돌 방지)
        return batch.commit().then(function(){return {orgId:orgDoc.id,role:'manager',sites:[],status:'pending'};});
      }
    });
  }).then(function(p){
    cM('mOrgSetup');
    _enterApp({name:name,role:p.role,orgId:p.orgId,sites:p.sites,status:p.status});
  }).catch(function(e){
    toast('설정 실패: '+e.message,'error');
  });
}

function cancelOrgSetup(){
  cM('mOrgSetup');
  if(FB_AUTH)FB_AUTH.signOut();
  FB_USER=null;USE_CLOUD=false;CU_ORG_ID=null;
  setCloudStatus('조직 설정이 취소되었습니다. 다시 로그인해주세요.');
}

function _genOrgCode(){
  var chars='ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';var code='';
  for(var i=0;i<6;i++)code+=chars[Math.floor(Math.random()*chars.length)];return code;
}

// 승인 대기 화면 + 실시간 status 변경 감지
var _pendingUnsub=null;
function _showPendingScreen(profileData){
  document.getElementById('LP').style.display='none';
  document.getElementById('AP').style.display='none';
  var ps=document.getElementById('pendingScreen');
  if(ps)ps.style.display='flex';
  var n=document.getElementById('pendingName');
  if(n)n.textContent=profileData.name||'';
  // 관리자가 승인하면 자동 진입
  if(_pendingUnsub){try{_pendingUnsub();}catch(e){}}
  _pendingUnsub=FB_DB.collection('users').doc(FB_USER.uid).onSnapshot(function(doc){
    if(!doc.exists)return;
    var d=doc.data();
    if(d.status==='active'){
      if(_pendingUnsub){try{_pendingUnsub();}catch(e){}_pendingUnsub=null;}
      var ps2=document.getElementById('pendingScreen');
      if(ps2)ps2.style.display='none';
      // 승인 환영 메시지 (현장명 포함)
      var sitesCount=(d.sites&&d.sites.length)||0;
      _enterApp(d);
      setTimeout(function(){
        toast('🎉 가입 승인 완료! '+sitesCount+'개 현장에 배정되었습니다.','success');
      },1200);
    }
  });
}

function _enterApp(profileData){
  // 승인 대기 상태면 대기 화면으로
  if(profileData.status==='pending'){
    _showPendingScreen(profileData);
    return;
  }
  // 거절된 사용자
  if(profileData.status==='rejected'){
    document.getElementById('LP').style.display='none';
    document.getElementById('AP').style.display='none';
    var rs=document.getElementById('rejectedScreen');
    if(rs)rs.style.display='flex';
    return;
  }
  CU_ORG_ID=profileData.orgId;
  CU={id:FB_USER.uid,name:profileData.name,role:profileData.role,
    sites:profileData.sites||['all'],
    curSite:profileData.role==='admin'?'all':(profileData.sites||[])[0]||'all'};
  loadCloudData().then(function(){
    document.getElementById('LP').style.display='none';
    document.getElementById('AP').style.display='block';
    setup();startRealtime();
    loadUserState().then(function(){
      toast(CU.name+'님 환영합니다! ☁️','success');
      setTimeout(function(){
        mascotReact('login');setMascotMood('love','jump');
        showMascotTip('Firebase 연결!','데이터가 동기화됩니다 ☁️');
      },800);
      resetIdleTimer();
    });
  }).catch(function(e){
    console.error('[enterApp] 데이터 로드 실패:',e);
    toast('데이터 로드 실패: '+e.message+'. 앱 재시작을 권장합니다.','error');
    document.getElementById('LP').style.display='none';
    document.getElementById('AP').style.display='block';
    setup();
  });
}

// ===== 로그인/가입/비번재설정 =====
function cloudLogin(){
  if(!FB_AUTH){setCloudStatus('Firebase 미설정',true);return;}
  var email=document.getElementById('loginEmail').value.trim();
  var pw=document.getElementById('loginCloudPw').value;
  if(!email||!pw){setCloudStatus('이메일과 비밀번호를 입력하세요',true);return;}
  setCloudStatus('로그인 중...');
  FB_AUTH.signInWithEmailAndPassword(email,pw).then(function(res){
    FB_USER=res.user;USE_CLOUD=true;_loadProfileAndEnter();
  }).catch(function(e){
    var msg=e.message;
    if(e.code==='auth/user-not-found'||e.code==='auth/wrong-password'||e.code==='auth/invalid-credential')msg='이메일 또는 비밀번호가 틀렸습니다';
    if(e.code==='auth/invalid-email')msg='올바른 이메일 주소를 입력하세요';
    setCloudStatus(msg,true);
  });
}

function showSignupForm(){document.getElementById('signupForm').style.display='block';}
function hideSignupForm(){document.getElementById('signupForm').style.display='none';}
// (deprecated, no-op) — 가입 옵션이 단일화됨
function switchSignupType(type){}

function cloudSignup(){
  if(!FB_AUTH){setCloudStatus('Firebase 미설정',true);return;}
  var email=document.getElementById('loginEmail').value.trim();
  var pw=document.getElementById('loginCloudPw').value;
  var name=document.getElementById('signupName').value.trim();
  if(!email||!pw){setCloudStatus('이메일과 비밀번호를 입력하세요',true);return;}
  if(pw.length<6){setCloudStatus('비밀번호 6자 이상',true);return;}
  if(!name){setCloudStatus('이름을 입력하세요',true);return;}
  setCloudStatus('가입 중...');
  FB_AUTH.createUserWithEmailAndPassword(email,pw).then(function(res){
    var uid=res.user.uid;
    setCloudStatus('조직 확인 중...');
    // 시스템에 조직이 0개 → 첫 가입자: 메인관리자 (조직 생성)
    // 조직이 있으면 → 그 조직에 'pending' manager로 합류 (관리자 승인 대기)
    return FB_DB.collection('organizations').limit(1).get().then(function(orgSnap){
      var batch=FB_DB.batch();
      if(orgSnap.empty){
        // 첫 가입자 = 메인관리자
        var orgRef=FB_DB.collection('organizations').doc();
        var code=_genOrgCode();
        batch.set(orgRef,{name:name+'의 조직',orgCode:code,createdAt:firebase.firestore.FieldValue.serverTimestamp()});
        batch.set(FB_DB.collection('users').doc(uid),{
          name:name,email:email,role:'admin',isMainAdmin:true,
          orgId:orgRef.id,sites:['all'],status:'active',
          createdAt:firebase.firestore.FieldValue.serverTimestamp()
        });
        return batch.commit().then(function(){return {first:true,orgName:name+'의 조직'};});
      }else{
        // 두번째 이후 = pending manager
        // 메인관리자/관리자는 startRealtime()의 pending users onSnapshot으로 자동 감지하므로
        // 별도 notifications 문서 생성 불필요 (보안 규칙 충돌 방지)
        var orgDoc=orgSnap.docs[0];
        batch.set(FB_DB.collection('users').doc(uid),{
          name:name,email:email,role:'manager',isMainAdmin:false,
          orgId:orgDoc.id,sites:[],status:'pending',
          createdAt:firebase.firestore.FieldValue.serverTimestamp()
        });
        return batch.commit().then(function(){return {first:false,orgName:orgDoc.data().name};});
      }
    }).then(function(result){
      return res.user.sendEmailVerification().catch(function(){}).then(function(){
        if(result.first){
          setCloudStatus('🎉 '+result.orgName+' 메인관리자로 가입 완료! 인증 메일을 확인하신 후 로그인하세요.');
        }else{
          setCloudStatus('✅ '+result.orgName+'에 가입 신청 완료! 인증 메일 확인 후 로그인하면 관리자 승인 대기 화면으로 이동합니다.');
        }
        hideSignupForm();FB_AUTH.signOut();
      });
    }).catch(function(e){
      setCloudStatus('가입 실패: '+e.message,true);
      try{res.user.delete();}catch(_){}
    });
  }).catch(function(e){
    var msg=e.message;
    if(e.code==='auth/email-already-in-use')msg='이미 사용 중인 이메일입니다';
    if(e.code==='auth/weak-password')msg='비밀번호가 너무 약합니다 (6자 이상)';
    if(e.code==='auth/invalid-email')msg='올바른 이메일 주소를 입력하세요';
    setCloudStatus(msg,true);
  });
}

function cloudResetPw(){
  if(!FB_AUTH){setCloudStatus('Firebase 미설정',true);return;}
  var email=document.getElementById('loginEmail').value.trim();
  if(!email){setCloudStatus('이메일을 입력하세요',true);return;}
  FB_AUTH.sendPasswordResetEmail(email).then(function(){
    setCloudStatus('비밀번호 재설정 메일을 보냈습니다');
  }).catch(function(e){setCloudStatus(e.message,true);});
}

var _loadedSites=new Set();
var _cloudSnapshot={};

// ===== 클라우드 데이터 동기화 =====
function loadCloudData(){
  if(!FB_DB||!USE_CLOUD||!CU_ORG_ID)return Promise.resolve();
  var op='orgs/'+CU_ORG_ID;var d=gDB();
  _loadedSites=new Set();_cloudSnapshot={};
  return Promise.all([
    FB_DB.collection(op+'/sites').get(),
    FB_DB.collection('users').where('orgId','==',CU_ORG_ID).get(),
    FB_DB.collection(op+'/procRules').get(),
    FB_DB.collection(op+'/editHistory').orderBy('createdAt','desc').limit(100).get()
  ]).then(function(rs){
    d.sites={};
    rs[0].forEach(function(doc){var s=doc.data();d.sites[doc.id]={id:doc.id,name:s.name,info:s.info||{},buildings:[],progress:{}};_cloudSnapshot['sites/'+doc.id]=JSON.stringify({name:s.name,info:s.info||{}});});
    d.users=[];rs[1].forEach(function(doc){var u=doc.data();d.users.push({id:doc.id,name:u.name,email:u.email||'',role:u.role,sites:u.sites||[],status:u.status});});
    d.procRules=[];rs[2].forEach(function(doc){var r=doc.data();d.procRules.push({id:doc.id,siteId:r.siteId,material:r.material,condFloor:r.condFloor,lead:r.lead,target:r.target,active:r.active});_cloudSnapshot['procRules/'+doc.id]=JSON.stringify({siteId:r.siteId,material:r.material,condFloor:r.condFloor,lead:r.lead,target:r.target,active:r.active});});
    d.editHistory=[];rs[3].forEach(function(doc){var h=doc.data();d.editHistory.push({time:h.time,user:h.userName,action:h.action,detail:h.detail});});
    d.procOrders=d.procOrders||[];d.alerts=d.alerts||[];d.inspections=d.inspections||[];
    sDB(d);
    var firstSite=CU&&CU.curSite&&CU.curSite!=='all'?CU.curSite:(Object.keys(d.sites)[0]||null);
    var toLoad=[];
    if(CU&&CU.role!=='admin'&&CU.sites&&CU.sites[0]!=='all'){
      toLoad=CU.sites.filter(function(id){return !!d.sites[id];});
    } else if(firstSite){
      toLoad=[firstSite];
    }
    return Promise.all(toLoad.map(function(id){return loadSiteData(id);}));
  });
}

function loadSiteData(siteId){
  if(!FB_DB||!USE_CLOUD||!CU_ORG_ID||!siteId)return Promise.resolve();
  if(_loadedSites.has(siteId))return Promise.resolve();
  var op='orgs/'+CU_ORG_ID;var d=gDB();
  return Promise.all([
    FB_DB.collection(op+'/buildings').where('siteId','==',siteId).get(),
    FB_DB.collection(op+'/progress').where('siteId','==',siteId).get(),
    FB_DB.collection(op+'/procOrders').where('siteId','==',siteId).get(),
    FB_DB.collection(op+'/alerts').where('siteId','==',siteId).get(),
    FB_DB.collection(op+'/inspections').where('siteId','==',siteId).get()
  ]).then(function(rs){
    if(!d.sites[siteId])return;
    d.sites[siteId].buildings=[];
    rs[0].forEach(function(doc){var b=doc.data();d.sites[siteId].buildings.push({id:doc.id,number:b.number,name:b.name,type:b.type,basement:b.basement,floors:b.floors,units:b.units,posX:b.posX||0,posZ:b.posZ||0,rot:b.rot||0});_cloudSnapshot['buildings/'+doc.id]=JSON.stringify({siteId:siteId,number:b.number,name:b.name,type:b.type,basement:b.basement,floors:b.floors,units:b.units,posX:b.posX||0,posZ:b.posZ||0,rot:b.rot||0});});
    d.sites[siteId].progress={};
    rs[1].forEach(function(doc){var p=doc.data();if(!d.sites[siteId].progress[p.buildingId])d.sites[siteId].progress[p.buildingId]={};if(!d.sites[siteId].progress[p.buildingId][p.floorKey])d.sites[siteId].progress[p.buildingId][p.floorKey]={};d.sites[siteId].progress[p.buildingId][p.floorKey][p.unit]=p.status;_cloudSnapshot['progress/'+doc.id]=JSON.stringify({siteId:siteId,buildingId:p.buildingId,floorKey:p.floorKey,unit:p.unit,status:p.status});});
    var oO=d.procOrders.filter(function(o){return o.siteId!==siteId;});var nO=[];
    rs[2].forEach(function(doc){var o=doc.data();nO.push({id:doc.id,siteId:o.siteId,material:o.material,orderDate:o.orderDate,status:o.status,manager:o.manager,note:o.note||''});_cloudSnapshot['procOrders/'+doc.id]=JSON.stringify({siteId:o.siteId,material:o.material,orderDate:o.orderDate,status:o.status,manager:o.manager,note:o.note||''});});
    d.procOrders=oO.concat(nO);
    var oA=d.alerts.filter(function(a){return a.siteId!==siteId;});var nA=[];
    rs[3].forEach(function(doc){var a=doc.data();nA.push({id:doc.id,siteId:a.siteId,ruleId:a.ruleId,material:a.material,message:a.message,type:a.type,date:a.date,read:a.read||false});_cloudSnapshot['alerts/'+doc.id]=JSON.stringify({siteId:a.siteId,ruleId:a.ruleId||'',material:a.material,message:a.message,type:a.type,date:a.date,read:a.read||false});});
    d.alerts=oA.concat(nA);
    var oI=d.inspections.filter(function(i){return i.siteId!==siteId;});var nI=[];
    rs[4].forEach(function(doc){var i=doc.data();nI.push({id:doc.id,siteId:i.siteId,name:i.name,category:i.category,target:i.target,vendor:i.vendor,date:i.date,status:i.status,manager:i.manager,location:i.location,note:i.note||''});_cloudSnapshot['inspections/'+doc.id]=JSON.stringify({siteId:i.siteId,name:i.name,category:i.category,target:i.target||'',vendor:i.vendor||'',date:i.date||'',status:i.status,manager:i.manager||'',location:i.location||'',note:i.note||''});});
    d.inspections=oI.concat(nI);
    _loadedSites.add(siteId);
    sDB(d);
  });
}

var _cloudSaveTimer=null;
function saveToCloud(){
  if(!FB_DB||!USE_CLOUD||!FB_USER||!CU_ORG_ID)return;
  if(_cloudSaveTimer)clearTimeout(_cloudSaveTimer);
  // 500ms 디바운스 — 사용자가 페이지 떠나도 데이터 안정성 확보
  _cloudSaveTimer=setTimeout(function(){_doCloudSave();},500);
}

// 페이지 unload 직전 동기 저장 시도 (브라우저 닫기 / 새로고침 보호)
window.addEventListener('beforeunload',function(){
  if(_cloudSaveTimer){clearTimeout(_cloudSaveTimer);_doCloudSave();}
});

var _saveErrorShown=false;
function _doCloudSave(){
  // v3: diff 기반 저장 — 변경된 문서만 write
  if(!FB_DB||!USE_CLOUD||!CU_ORG_ID){console.warn('[saveToCloud] skipped');return;}
  var d=gDB();var op='orgs/'+CU_ORG_ID;var promises=[];
  function err(lbl){return function(e){console.error('[saveToCloud] '+lbl+':',e.message);if(!_saveErrorShown){_saveErrorShown=true;try{toast('⚠️ 클라우드 저장 실패: '+e.message,'error');}catch(_){}setTimeout(function(){_saveErrorShown=false;},5000);}};}
  function chk(key,data){var s=JSON.stringify(data);if(_cloudSnapshot[key]===s)return false;_cloudSnapshot[key]=s;return true;}
  for(var si in d.sites){(function(s){
    if(chk('sites/'+s.id,{name:s.name,info:s.info}))promises.push(FB_DB.collection(op+'/sites').doc(s.id).set({name:s.name,info:s.info},{merge:true}).catch(err('sites/'+s.id)));
    if(!_loadedSites.has(s.id))return;
    s.buildings.forEach(function(b){var bd={siteId:s.id,number:b.number,name:b.name,type:b.type,basement:b.basement,floors:b.floors,units:b.units,posX:b.posX||0,posZ:b.posZ||0,rot:b.rot||0};if(chk('buildings/'+b.id,bd))promises.push(FB_DB.collection(op+'/buildings').doc(b.id).set(bd,{merge:true}).catch(err('buildings/'+b.id)));});
    for(var bi in s.progress)for(var fk in s.progress[bi])for(var u in s.progress[bi][fk]){var docId=bi+'__'+fk+'__'+u;var pd={siteId:s.id,buildingId:bi,floorKey:fk,unit:u,status:s.progress[bi][fk][u]};if(chk('progress/'+docId,pd))promises.push(FB_DB.collection(op+'/progress').doc(docId).set(pd,{merge:true}).catch(err('progress/'+docId)));}
  }(d.sites[si]));}
  d.procRules.forEach(function(r){var rd={siteId:r.siteId,material:r.material,condFloor:r.condFloor,lead:r.lead,target:r.target,active:r.active};if(chk('procRules/'+r.id,rd))promises.push(FB_DB.collection(op+'/procRules').doc(r.id).set(rd,{merge:true}).catch(err('procRules/'+r.id)));});
  d.procOrders.forEach(function(o){var od={siteId:o.siteId,material:o.material,orderDate:o.orderDate,status:o.status,manager:o.manager,note:o.note||''};if(chk('procOrders/'+o.id,od))promises.push(FB_DB.collection(op+'/procOrders').doc(o.id).set(od,{merge:true}).catch(err('procOrders/'+o.id)));});
  d.alerts.forEach(function(a){var ad={siteId:a.siteId,ruleId:a.ruleId||'',material:a.material,message:a.message,type:a.type,date:a.date,read:a.read||false};if(chk('alerts/'+a.id,ad))promises.push(FB_DB.collection(op+'/alerts').doc(a.id).set(ad,{merge:true}).catch(err('alerts/'+a.id)));});
  d.inspections.forEach(function(i){var id2={siteId:i.siteId,name:i.name,category:i.category,target:i.target||'',vendor:i.vendor||'',date:i.date||'',status:i.status,manager:i.manager||'',location:i.location||'',note:i.note||''};if(chk('inspections/'+i.id,id2))promises.push(FB_DB.collection(op+'/inspections').doc(i.id).set(id2,{merge:true}).catch(err('inspections/'+i.id)));});
  if(d.editHistory&&d.editHistory.length){var h=d.editHistory[0];var hk='hist/_'+h.time+'_'+h.action;if(chk(hk,{t:h.time,u:h.user,a:h.action}))promises.push(FB_DB.collection(op+'/editHistory').add({time:h.time,userName:h.user,action:h.action,detail:h.detail,createdAt:firebase.firestore.FieldValue.serverTimestamp()}).catch(err('editHistory')));}
  if(!promises.length){console.log('[saveToCloud] ✓ no changes');return;}
  Promise.allSettled(promises).then(function(res){var f=res.filter(function(r){return r.status==='rejected';}).length;console.log(f?'[saveToCloud] '+f+'/'+res.length+' failed':'[saveToCloud] ✓ '+res.length+' docs saved (diff)');});
}

// ===== 사용자 상태 저장/복원 =====
function saveUserState(){
  if(!FB_DB||!USE_CLOUD||!FB_USER||!CU_ORG_ID)return;
  var curSite='';var el=document.getElementById('prS');if(el&&el.value)curSite=el.value;
  FB_DB.collection('orgs/'+CU_ORG_ID+'/userStates').doc(FB_USER.uid).set(
    {lastPage:CP,lastSiteId:curSite||null,updatedAt:firebase.firestore.FieldValue.serverTimestamp()},
    {merge:true}
  );
}

function loadUserState(){
  if(!FB_DB||!USE_CLOUD||!FB_USER||!CU_ORG_ID)return Promise.resolve();
  return FB_DB.collection('orgs/'+CU_ORG_ID+'/userStates').doc(FB_USER.uid).get().then(function(doc){
    if(!doc.exists)return;var st=doc.data();
    if(st.lastSiteId){
      ['prS','cfS','psS','isS','v3dS'].forEach(function(id){
        var el=document.getElementById(id);if(!el)return;
        for(var i=0;i<el.options.length;i++){if(el.options[i].value===st.lastSiteId){el.value=st.lastSiteId;break;}}
      });
    }
    var safe=['dash','notice','info','v3d','prog','bldg','alerts','pset','pstat','insp','hist'];
    nav(st.lastPage&&safe.indexOf(st.lastPage)>=0?st.lastPage:'dash');
  });
}

// ===== 실시간 동기화 (alerts/announcements만) =====
var _rtUnsubs=[];
function startRealtime(){
  if(!FB_DB||!USE_CLOUD||!CU_ORG_ID)return;
  var op='orgs/'+CU_ORG_ID;
  var u1=FB_DB.collection(op+'/alerts').onSnapshot(function(snap){
    snap.docChanges().forEach(function(ch){
      if(ch.type==='added'&&CU){
        var a=ch.doc.data();a.id=ch.doc.id;
        var d=gDB();var exists=d.alerts.some(function(x){return x.id===a.id;});
        if(!exists){
          d.alerts.unshift({id:a.id,siteId:a.siteId,ruleId:a.ruleId,material:a.material,message:a.message,type:a.type,date:a.date,read:false});
          sDB(d);
          updBdg();toast('📦 새 발주알림: '+a.material,'warning');mascotReact('alert',a.material);
          if(CP==='alerts')rAlerts();
        }
      }
    });
  });
  var u2=FB_DB.collection(op+'/announcements').where('isActive','==',true).onSnapshot(function(snap){
    snap.docChanges().forEach(function(ch){
      if(ch.type==='added'&&CU){
        var a=ch.doc.data();toast('📢 새 공지: '+a.title,'info');updNoticeBdg();
        if(CP==='notice')rNotice();
      }
    });
  });
  // procOrders 실시간 동기화 (발주현황)
  var u4=FB_DB.collection(op+'/procOrders').onSnapshot(function(snap){
    snap.docChanges().forEach(function(ch){
      if(!CU)return;
      var o=ch.doc.data();o.id=ch.doc.id;
      var d=gDB();
      if(ch.type==='added'){
        var exists=d.procOrders.some(function(x){return x.id===o.id;});
        if(!exists){d.procOrders.unshift(o);}
      }else if(ch.type==='modified'){
        for(var i=0;i<d.procOrders.length;i++){if(d.procOrders[i].id===o.id){d.procOrders[i]=o;break;}}
      }else if(ch.type==='removed'){
        d.procOrders=d.procOrders.filter(function(x){return x.id!==o.id;});
      }
      sDB(d);
      if(CP==='pstat')rPStat();
    });
  });

  // inspections 실시간 동기화 (공장검수)
  var u5=FB_DB.collection(op+'/inspections').onSnapshot(function(snap){
    snap.docChanges().forEach(function(ch){
      if(!CU)return;
      var it=ch.doc.data();it.id=ch.doc.id;
      var d=gDB();
      if(ch.type==='added'){
        var exists=d.inspections.some(function(x){return x.id===it.id;});
        if(!exists){d.inspections.unshift(it);}
      }else if(ch.type==='modified'){
        for(var i=0;i<d.inspections.length;i++){if(d.inspections[i].id===it.id){d.inspections[i]=it;break;}}
      }else if(ch.type==='removed'){
        d.inspections=d.inspections.filter(function(x){return x.id!==it.id;});
      }
      sDB(d);
      if(CP==='insp')rInsp();
    });
  });

  _rtUnsubs=[u1,u2,u4,u5];

  // 관리자 전용: 신규 가입 신청 실시간 감지
  if(CU&&CU.role==='admin'){
    var u3=FB_DB.collection('users').where('orgId','==',CU_ORG_ID).where('status','==','pending').onSnapshot(function(snap){
      updPendingBdg(snap.size);
      snap.docChanges().forEach(function(ch){
        if(ch.type==='added'){
          var u=ch.doc.data();
          // 첫 로드가 아닌 신규 추가만 토스트
          if(!_pendingInitDone){return;}
          toast('🔔 신규 가입 신청: '+u.name,'warning');
          mascotReact('alert','신규 가입 신청');
          if(CP==='users')rUsers();
        }
      });
      _pendingInitDone=true;
    });
    _rtUnsubs.push(u3);
  }
}

var _pendingInitDone=false;
// 사이드바의 "담당자 배정" 메뉴에 승인 대기 배지
function updPendingBdg(count){
  var ne=document.querySelector('.ni[data-p="users"]');
  if(!ne)return;
  var bdg=ne.querySelector('.bdg.pendBdg');
  if(count>0){
    if(!bdg){bdg=document.createElement('span');bdg.className='bdg pendBdg';bdg.style.background='var(--amber)';ne.appendChild(bdg);}
    bdg.textContent=count;bdg.style.display='inline';
  }else if(bdg){bdg.style.display='none';}
}

function stopRealtime(){_rtUnsubs.forEach(function(fn){try{fn();}catch(e){}});_rtUnsubs=[];_pendingInitDone=false;}

// ===== 공지사항 =====
var _notices=[];var _noticeReads=[];
function updNoticeBdg(){
  if(!FB_DB||!USE_CLOUD||!CU_ORG_ID)return;
  FB_DB.collection('orgs/'+CU_ORG_ID+'/announcements').where('isActive','==',true).get().then(function(snap){
    FB_DB.collection('orgs/'+CU_ORG_ID+'/noticeReads').doc(FB_USER.uid).get().then(function(rdoc){
      var readIds=(rdoc.exists&&rdoc.data().reads)||[];
      var unread=snap.docs.filter(function(d){return readIds.indexOf(d.id)<0;}).length;
      var nb=document.getElementById('NB');
      if(nb){nb.style.display=unread>0?'inline':'none';nb.textContent=unread;}
    });
  });
}

function rNotice(){
  if(!FB_DB||!USE_CLOUD){
    document.getElementById('NL').innerHTML='<p style="color:var(--t3);font-size:12px">클라우드 모드에서만 사용 가능합니다.</p>';return;
  }
  var adminBtn=document.getElementById('noticeAdminBtn');
  if(adminBtn)adminBtn.style.display=CU.role==='admin'?'block':'none';
  document.getElementById('NL').innerHTML='<div style="text-align:center;padding:20px;color:var(--t3);font-size:12px">로딩 중...</div>';
  Promise.all([
    FB_DB.collection('orgs/'+CU_ORG_ID+'/announcements').where('isActive','==',true).get(),
    FB_DB.collection('orgs/'+CU_ORG_ID+'/noticeReads').doc(FB_USER.uid).get()
  ]).then(function(results){
    _notices=results[0].docs.slice().sort(function(a,b){var ta=a.data().createdAt&&a.data().createdAt.seconds||0;var tb=b.data().createdAt&&b.data().createdAt.seconds||0;return tb-ta;}).map(function(d){var x=d.data();x.id=d.id;return x;});
    _noticeReads=(results[1].exists&&results[1].data().reads)||[];
    var html=_notices.length?_notices.map(function(n){
      var isRead=_noticeReads.indexOf(n.id)>=0;
      var isUrgent=n.priority==='urgent';
      var dt=n.createdAt?n.createdAt.toDate():new Date();
      var dateStr=dt.getFullYear()+'.'+(dt.getMonth()+1)+'.'+dt.getDate();
      return '<div class="ac '+(isUrgent?'urgent':'normal')+'" style="opacity:'+(isRead?.6:1)+';flex-direction:column;gap:0">'+
        '<div style="display:flex;align-items:center;gap:8px;width:100%;margin-bottom:6px">'+
        '<span style="font-size:16px">'+(isUrgent?'🔴':'📢')+'</span>'+
        '<span style="font-size:13px;font-weight:700;flex:1">'+esc(n.title)+'</span>'+
        '<span style="font-size:10px;color:var(--t3)">'+esc(dateStr)+'</span>'+
        (CU.role==='admin'?'<button class="btn bx bd" onclick="delNotice(this.dataset.id)" data-id="'+esc(n.id)+'">삭제</button>':'')+
        '</div>'+
        '<div style="font-size:12px;color:var(--t2);white-space:pre-wrap;line-height:1.6;padding-left:24px">'+esc(n.content)+'</div>'+
        (!isRead?'<div style="padding-left:24px;margin-top:8px"><button class="btn bx bg" onclick="markNoticeRead(this.dataset.id)" data-id="'+esc(n.id)+'">확인 처리</button></div>':'')+
        '</div>';
    }).join(''):emptyState('공지사항이 없어요 🎉');
    document.getElementById('NL').innerHTML=html;
  }).catch(function(e){document.getElementById('NL').innerHTML='<p style="color:var(--red)">로딩 실패: '+(e&&e.message||e)+'</p>';console.error('[rNotice]',e);});
}

function openAddNotice(){
  var ss=gUS();
  document.getElementById('nSiteTarget').innerHTML='<option value="all">전체 현장</option>'+ss.map(function(s){return '<option value="'+esc(s.id)+'">'+esc(s.name)+'</option>';}).join('');
  document.getElementById('nTitle').value='';document.getElementById('nContent').value='';
  document.getElementById('nPrio').value='normal';document.getElementById('nSiteTarget').value='all';
  document.getElementById('nId').value='';document.getElementById('mNT').textContent='공지 작성';
  oM('mAddNotice');
}

function saveNotice(){
  if(!FB_DB||!USE_CLOUD){toast('클라우드 모드 필요','error');return;}
  var title=document.getElementById('nTitle').value.trim();
  var content=document.getElementById('nContent').value.trim();
  if(!title||!content){toast('제목과 내용을 입력하세요','error');return;}
  FB_DB.collection('orgs/'+CU_ORG_ID+'/announcements').add({
    title:title,content:content,
    siteId:document.getElementById('nSiteTarget').value,
    priority:document.getElementById('nPrio').value,
    createdBy:FB_USER.uid,isActive:true,
    createdAt:firebase.firestore.FieldValue.serverTimestamp()
  }).then(function(){
    cM('mAddNotice');addHist('공지 작성',title);toast('공지 등록 완료','success');rNotice();
  }).catch(function(e){toast('저장 실패: '+e.message,'error');});
}

function delNotice(id){
  if(!confirm('공지를 삭제하시겠습니까?'))return;
  FB_DB.collection('orgs/'+CU_ORG_ID+'/announcements').doc(id).update({isActive:false}).then(function(){
    toast('공지 삭제','info');rNotice();
  }).catch(function(){toast('삭제 실패','error');});
}

function markNoticeRead(id){
  FB_DB.collection('orgs/'+CU_ORG_ID+'/noticeReads').doc(FB_USER.uid).set(
    {reads:firebase.firestore.FieldValue.arrayUnion(id)},{merge:true}
  ).then(function(){_noticeReads.push(id);updNoticeBdg();rNotice();});
}
