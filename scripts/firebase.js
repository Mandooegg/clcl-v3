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
    setCloudStatus('이메일 인증이 필요합니다. 받은 메일의 인증 링크를 클릭 후 다시 로그인하세요.',true);
    FB_AUTH.signOut();FB_USER=null;USE_CLOUD=false;CU_ORG_ID=null;
    return;
  }
  FB_DB.collection('users').doc(FB_USER.uid).get().then(function(doc){
    if(!doc.exists){
      if(_isOAuthUser(FB_USER)){
        // OAuth 신규 사용자 → 조직 설정 모달
        _showOrgSetupModal();
        return;
      }
      // 이메일/비번인데 프로필 없음 = 가입 중 실패한 고아 계정
      setCloudStatus('프로필이 없습니다. 회원가입을 다시 진행해주세요.',true);
      FB_AUTH.signOut();FB_USER=null;USE_CLOUD=false;CU_ORG_ID=null;
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
  var cEl=document.getElementById('osOrgCode');if(cEl)cEl.value='';
  switchOrgSetupType('new');
  oM('mOrgSetup');
}

function switchOrgSetupType(type){
  document.getElementById('osNewArea').style.display=type==='new'?'block':'none';
  document.getElementById('osJoinArea').style.display=type==='join'?'block':'none';
  document.getElementById('osNew').style.background=type==='new'?'rgba(16,185,129,.15)':'var(--bg2)';
  document.getElementById('osNew').style.color=type==='new'?'var(--green)':'var(--t3)';
  document.getElementById('osJoin').style.background=type==='join'?'rgba(245,158,11,.15)':'var(--bg2)';
  document.getElementById('osJoin').style.color=type==='join'?'var(--amber)':'var(--t3)';
}

function finishOrgSetup(){
  if(!FB_USER){toast('인증 상태 오류','error');return;}
  var name=document.getElementById('osName').value.trim();
  if(!name){toast('이름을 입력하세요','error');return;}
  var isJoin=document.getElementById('osJoinArea').style.display!=='none';
  var orgCode=isJoin?document.getElementById('osOrgCode').value.trim().toUpperCase():'';
  var orgName=isJoin?'':document.getElementById('osOrgName').value.trim();
  if(isJoin&&orgCode.length<4){toast('조직 코드를 입력하세요','error');return;}
  var uid=FB_USER.uid;
  var setupPromise;
  if(isJoin){
    setupPromise=FB_DB.collection('organizations').where('orgCode','==',orgCode).get().then(function(snap){
      if(snap.empty)throw new Error('잘못된 조직 코드입니다.');
      var orgDoc=snap.docs[0];
      return FB_DB.collection('users').doc(uid).set({
        name:name,role:'manager',orgId:orgDoc.id,sites:[],
        createdAt:firebase.firestore.FieldValue.serverTimestamp()
      }).then(function(){return {orgId:orgDoc.id,role:'manager',sites:[]};});
    });
  }else{
    var orgRef=FB_DB.collection('organizations').doc();
    var code=_genOrgCode();
    var batch=FB_DB.batch();
    batch.set(orgRef,{name:orgName||name+'의 조직',orgCode:code,createdAt:firebase.firestore.FieldValue.serverTimestamp()});
    batch.set(FB_DB.collection('users').doc(uid),{name:name,role:'admin',orgId:orgRef.id,sites:['all'],createdAt:firebase.firestore.FieldValue.serverTimestamp()});
    setupPromise=batch.commit().then(function(){return {orgId:orgRef.id,role:'admin',sites:['all']};});
  }
  setupPromise.then(function(p){
    cM('mOrgSetup');
    _enterApp({name:name,role:p.role,orgId:p.orgId,sites:p.sites});
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

function _enterApp(profileData){
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
function switchSignupType(type){
  document.getElementById('signupNew').style.display=type==='new'?'block':'none';
  document.getElementById('signupJoin').style.display=type==='join'?'block':'none';
  document.getElementById('stNew').style.background=type==='new'?'rgba(16,185,129,.15)':'var(--bg2)';
  document.getElementById('stNew').style.color=type==='new'?'var(--green)':'var(--t3)';
  document.getElementById('stJoin').style.background=type==='join'?'rgba(245,158,11,.15)':'var(--bg2)';
  document.getElementById('stJoin').style.color=type==='join'?'var(--amber)':'var(--t3)';
}

function cloudSignup(){
  if(!FB_AUTH){setCloudStatus('Firebase 미설정',true);return;}
  var email=document.getElementById('loginEmail').value.trim();
  var pw=document.getElementById('loginCloudPw').value;
  var name=document.getElementById('signupName').value.trim();
  if(!email||!pw){setCloudStatus('이메일과 비밀번호를 입력하세요',true);return;}
  if(pw.length<6){setCloudStatus('비밀번호 6자 이상',true);return;}
  if(!name){setCloudStatus('이름을 입력하세요',true);return;}
  var isJoin=document.getElementById('signupJoin').style.display!=='none';
  var orgCode=isJoin?document.getElementById('signupOrgCode').value.trim().toUpperCase():'';
  var orgName=isJoin?'':document.getElementById('signupOrg').value.trim();
  if(isJoin&&orgCode.length<4){setCloudStatus('조직 코드를 입력하세요',true);return;}
  setCloudStatus('가입 중...');
  FB_AUTH.createUserWithEmailAndPassword(email,pw).then(function(res){
    var uid=res.user.uid;
    var profilePromise;
    if(isJoin){
      setCloudStatus('조직 참여 중...');
      profilePromise=FB_DB.collection('organizations').where('orgCode','==',orgCode).get().then(function(snap){
        if(snap.empty){
          return res.user.delete().then(function(){throw new Error('잘못된 조직 코드입니다. 관리자에게 확인하세요.');});
        }
        var orgDoc=snap.docs[0];
        return FB_DB.collection('users').doc(uid).set({
          name:name,role:'manager',orgId:orgDoc.id,sites:[],
          createdAt:firebase.firestore.FieldValue.serverTimestamp()
        }).then(function(){return orgDoc.data().name;});
      });
    }else{
      setCloudStatus('조직 생성 중...');
      var orgRef=FB_DB.collection('organizations').doc();
      var code=_genOrgCode();
      var batch=FB_DB.batch();
      batch.set(orgRef,{name:orgName||name+'의 조직',orgCode:code,createdAt:firebase.firestore.FieldValue.serverTimestamp()});
      batch.set(FB_DB.collection('users').doc(uid),{name:name,role:'admin',orgId:orgRef.id,sites:['all'],createdAt:firebase.firestore.FieldValue.serverTimestamp()});
      profilePromise=batch.commit().then(function(){return orgName||name+'의 조직';});
    }
    profilePromise.then(function(joinedOrgName){
      return res.user.sendEmailVerification().then(function(){
        setCloudStatus('✅ '+joinedOrgName+' 가입 완료! 인증 메일을 확인하신 후 로그인하세요.');
      },function(){
        setCloudStatus('✅ '+joinedOrgName+' 가입 완료! 로그인 해주세요. (인증 메일 발송 실패)');
      });
    }).then(function(){hideSignupForm();FB_AUTH.signOut();})
    .catch(function(e){
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

// ===== 클라우드 데이터 동기화 =====
function loadCloudData(){
  if(!FB_DB||!USE_CLOUD||!CU_ORG_ID)return Promise.resolve();
  var op='orgs/'+CU_ORG_ID;var d=gDB();
  return Promise.all([
    FB_DB.collection(op+'/sites').get(),
    FB_DB.collection(op+'/buildings').get(),
    FB_DB.collection(op+'/progress').get(),
    FB_DB.collection(op+'/procRules').get(),
    FB_DB.collection(op+'/procOrders').get(),
    FB_DB.collection(op+'/alerts').get(),
    FB_DB.collection(op+'/inspections').get(),
    FB_DB.collection(op+'/editHistory').orderBy('createdAt','desc').limit(100).get()
  ]).then(function(rs){
    d.sites={};
    rs[0].forEach(function(doc){var s=doc.data();d.sites[doc.id]={id:doc.id,name:s.name,info:s.info||{},buildings:[],progress:{}};});
    rs[1].forEach(function(doc){var b=doc.data();if(d.sites[b.siteId]){d.sites[b.siteId].buildings.push({id:doc.id,number:b.number,name:b.name,type:b.type,basement:b.basement,floors:b.floors,units:b.units,posX:b.posX||0,posZ:b.posZ||0,rot:b.rot||0});}});
    rs[2].forEach(function(doc){var p=doc.data();if(d.sites[p.siteId]){if(!d.sites[p.siteId].progress[p.buildingId])d.sites[p.siteId].progress[p.buildingId]={};if(!d.sites[p.siteId].progress[p.buildingId][p.floorKey])d.sites[p.siteId].progress[p.buildingId][p.floorKey]={};d.sites[p.siteId].progress[p.buildingId][p.floorKey][p.unit]=p.status;}});
    d.procRules=[];rs[3].forEach(function(doc){var r=doc.data();d.procRules.push({id:doc.id,siteId:r.siteId,material:r.material,condFloor:r.condFloor,lead:r.lead,target:r.target,active:r.active});});
    d.procOrders=[];rs[4].forEach(function(doc){var o=doc.data();d.procOrders.push({id:doc.id,siteId:o.siteId,material:o.material,orderDate:o.orderDate,status:o.status,manager:o.manager,note:o.note||''});});
    d.alerts=[];rs[5].forEach(function(doc){var a=doc.data();d.alerts.push({id:doc.id,siteId:a.siteId,ruleId:a.ruleId,material:a.material,message:a.message,type:a.type,date:a.date,read:a.read||false});});
    d.inspections=[];rs[6].forEach(function(doc){var i=doc.data();d.inspections.push({id:doc.id,siteId:i.siteId,name:i.name,category:i.category,target:i.target,vendor:i.vendor,date:i.date,status:i.status,manager:i.manager,location:i.location,note:i.note||''});});
    d.editHistory=[];rs[7].forEach(function(doc){var h=doc.data();d.editHistory.push({time:h.time,user:h.userName,action:h.action,detail:h.detail});});
    _memDB=d;try{localStorage.setItem(DK,JSON.stringify(d));}catch(e){}
  });
}

var _cloudSaveTimer=null;
function saveToCloud(){
  if(!FB_DB||!USE_CLOUD||!FB_USER||!CU_ORG_ID)return;
  if(_cloudSaveTimer)clearTimeout(_cloudSaveTimer);
  _cloudSaveTimer=setTimeout(function(){_doCloudSave();},2000);
}

function _doCloudSave(){
  // ⚠️ v2.3: 전체 덤프 방식. v3에서 diff-based로 교체 예정
  var d=gDB();var op='orgs/'+CU_ORG_ID;
  for(var si in d.sites){(function(s){
    FB_DB.collection(op+'/sites').doc(s.id).set({name:s.name,info:s.info},{merge:true});
    s.buildings.forEach(function(b){var sid=s.id;
      FB_DB.collection(op+'/buildings').doc(b.id).set({siteId:sid,number:b.number,name:b.name,type:b.type,basement:b.basement,floors:b.floors,units:b.units,posX:b.posX||0,posZ:b.posZ||0,rot:b.rot||0},{merge:true});
    });
    for(var bi in s.progress)for(var fk in s.progress[bi])for(var u in s.progress[bi][fk]){
      var docId=bi+'__'+fk+'__'+u;
      FB_DB.collection(op+'/progress').doc(docId).set({siteId:s.id,buildingId:bi,floorKey:fk,unit:u,status:s.progress[bi][fk][u]},{merge:true});
    }
  }(d.sites[si]));}
  d.procRules.forEach(function(r){FB_DB.collection(op+'/procRules').doc(r.id).set({siteId:r.siteId,material:r.material,condFloor:r.condFloor,lead:r.lead,target:r.target,active:r.active},{merge:true});});
  d.procOrders.forEach(function(o){FB_DB.collection(op+'/procOrders').doc(o.id).set({siteId:o.siteId,material:o.material,orderDate:o.orderDate,status:o.status,manager:o.manager,note:o.note||''},{merge:true});});
  d.alerts.forEach(function(a){FB_DB.collection(op+'/alerts').doc(a.id).set({siteId:a.siteId,ruleId:a.ruleId||'',material:a.material,message:a.message,type:a.type,date:a.date,read:a.read||false},{merge:true});});
  d.inspections.forEach(function(i){FB_DB.collection(op+'/inspections').doc(i.id).set({siteId:i.siteId,name:i.name,category:i.category,target:i.target||'',vendor:i.vendor||'',date:i.date||'',status:i.status,manager:i.manager||'',location:i.location||'',note:i.note||''},{merge:true});});
  if(d.editHistory&&d.editHistory.length){var h=d.editHistory[0];
    FB_DB.collection(op+'/editHistory').add({time:h.time,userName:h.user,action:h.action,detail:h.detail,createdAt:firebase.firestore.FieldValue.serverTimestamp()}).catch(function(){});}
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
          _memDB=d;try{localStorage.setItem(DK,JSON.stringify(d));}catch(e){}
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
  _rtUnsubs=[u1,u2];
}

function stopRealtime(){_rtUnsubs.forEach(function(fn){try{fn();}catch(e){}});_rtUnsubs=[];}

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
    FB_DB.collection('orgs/'+CU_ORG_ID+'/announcements').where('isActive','==',true).orderBy('createdAt','desc').get(),
    FB_DB.collection('orgs/'+CU_ORG_ID+'/noticeReads').doc(FB_USER.uid).get()
  ]).then(function(results){
    _notices=results[0].docs.map(function(d){var x=d.data();x.id=d.id;return x;});
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
  }).catch(function(){document.getElementById('NL').innerHTML='<p style="color:var(--red)">로딩 실패</p>';});
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
