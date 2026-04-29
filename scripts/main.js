"use strict";
// ===== 엔트리: DOMContentLoaded + CDN 지연 로드 =====
// Three.js (3D), XLSX (엑셀), Firebase (auth/firestore)는
// 본 스크립트들이 다 로드된 후에 비동기로 로드됩니다.
// Firebase SDK 3개가 순차 로드된 후 onFirebaseReady()가 호출됩니다.

document.addEventListener('DOMContentLoaded',function(){
  // 초기 DB seed (필요 시)
  try{if(!localStorage.getItem(DK))iDB();}catch(e){iDB();}

  // Firebase 설정 여부에 따라 탭 UI 표시
  if(!isFirebaseConfigured()){
    document.getElementById('loginTabs').style.display='none';
    document.getElementById('loginCloud').style.display='none';
    document.getElementById('loginLocal').style.display='block';
  }else{
    document.getElementById('loginTabs').style.display='flex';
    document.getElementById('loginCloud').style.display='block';
    document.getElementById('loginLocal').style.display='none';
    switchLoginMode('cloud');
    document.getElementById('cloudStatus').innerHTML='<span style="color:var(--amber)">Firebase 연결 중...</span>';
    setTimeout(function(){
      if(!FB_AUTH){
        document.getElementById('cloudStatus').innerHTML='<span style="color:var(--red)">Firebase 연결 실패</span><br><span style="font-size:10px">로컬 탭으로 전환하거나 새로고침 해주세요</span>';
      }
    },8000);
  }
});

// ===== CDN 지연 로드 =====
// Three.js, XLSX는 병렬 로드 (onerror 시 해당 기능만 비활성화).
// Firebase 3개는 의존성 순서대로 순차 로드 후 onFirebaseReady() 호출.
(function(){
  var s1=document.createElement('script');
  s1.src='https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js';
  s1.integrity='sha384-CI3ELBVUz9XQO+97x6nwMDPosPR5XvsxW2ua7N1Xeygeh1IxtgqtCkGfQY9WWdHu';
  s1.crossOrigin='anonymous';
  s1.onerror=function(){console.warn('Three.js unavailable');};
  document.head.appendChild(s1);

  var s2=document.createElement('script');
  s2.src='https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js';
  s2.integrity='sha384-vtjasyidUo0kW94K5MXDXntzOJpQgBKXmE7e2Ga4LG0skTTLeBi97eFAXsqewJjw';
  s2.crossOrigin='anonymous';
  s2.onerror=function(){console.warn('XLSX unavailable');};
  document.head.appendChild(s2);

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
