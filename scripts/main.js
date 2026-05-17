"use strict";
// ===== 엔트리: DOMContentLoaded + CDN 지연 로드 =====

document.addEventListener('DOMContentLoaded',function(){
  try{if(typeof ensureLocalDemoDB==='function')ensureLocalDemoDB();}
  catch(e){try{if(typeof iDB==='function')iDB();}catch(e2){console.error('[store]',e2);}}

  if(typeof SKIP_LOGIN!=='undefined'&&SKIP_LOGIN){
    if(typeof autoEnterApp==='function')autoEnterApp('admin');
    return;
  }

  var lp=document.getElementById('LP');
  if(lp)lp.style.display='flex';
  var ap=document.getElementById('AP');
  if(ap)ap.style.display='none';

  var localOnly=!isFirebaseConfigured()||preferLocalLogin();
  if(localOnly){
    var tabs=document.getElementById('loginTabs');
    var cloud=document.getElementById('loginCloud');
    var local=document.getElementById('loginLocal');
    if(tabs)tabs.style.display='none';
    if(cloud)cloud.style.display='none';
    if(local)local.style.display='block';
  }else{
    var tabs2=document.getElementById('loginTabs');
    if(tabs2)tabs2.style.display='flex';
    switchLoginMode('local');
    var cs=document.getElementById('cloudStatus');
    if(cs)cs.innerHTML='<span style="color:var(--amber)">Firebase 연결 중...</span>';
    setTimeout(function(){
      if(!FB_AUTH&&cs){
        cs.innerHTML='<span style="color:var(--red)">Firebase 연결 실패</span><br><span style="font-size:10px">로컬 탭에서 로그인하세요</span>';
      }
    },8000);
  }
});

// ===== CDN 지연 로드 =====
(function(){
  var s1=document.createElement('script');
  s1.src='https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js';
  s1.crossOrigin='anonymous';
  s1.onerror=function(){console.warn('Three.js unavailable');};
  document.head.appendChild(s1);

  var s2=document.createElement('script');
  s2.src='https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js';
  s2.crossOrigin='anonymous';
  s2.onerror=function(){console.warn('XLSX unavailable');};
  document.head.appendChild(s2);

  if(typeof SKIP_LOGIN!=='undefined'&&SKIP_LOGIN)return;

  var fb1=document.createElement('script');
  fb1.src='https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js';
  fb1.onload=function(){
    var fb2=document.createElement('script');
    fb2.src='https://www.gstatic.com/firebasejs/9.23.0/firebase-auth-compat.js';
    fb2.onload=function(){
      var fb3=document.createElement('script');
      fb3.src='https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore-compat.js';
      fb3.onload=function(){console.log('Firebase loaded');onFirebaseReady();};
      fb3.onerror=function(){console.warn('Firebase Firestore CDN 실패');};
      document.head.appendChild(fb3);
    };
    fb2.onerror=function(){console.warn('Firebase Auth CDN 실패');};
    document.head.appendChild(fb2);
  };
  fb1.onerror=function(){console.warn('Firebase App CDN 실패');};
  document.head.appendChild(fb1);
})();
