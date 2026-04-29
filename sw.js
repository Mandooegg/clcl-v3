'use strict';
// ===== SITE-MASTER Service Worker v1 =====
// 정적 에셋 캐시 우선, Firebase/API 요청은 네트워크 우선

var CACHE = 'sitemaster-v1';
var ASSETS = [
  './',
  './index.html',
  './styles.css',
  './scripts/config.js',
  './scripts/store.js',
  './scripts/utils.js',
  './scripts/mascot.js',
  './scripts/firebase.js',
  './scripts/viewer3d.js',
  './scripts/pages.js',
  './scripts/auth.js',
  './scripts/main.js'
];

// 설치: 정적 에셋 사전 캐시
self.addEventListener('install', function(e){
  e.waitUntil(
    caches.open(CACHE).then(function(cache){
      return cache.addAll(ASSETS);
    }).then(function(){ return self.skipWaiting(); })
  );
});

// 활성화: 구버전 캐시 삭제
self.addEventListener('activate', function(e){
  e.waitUntil(
    caches.keys().then(function(keys){
      return Promise.all(
        keys.filter(function(k){ return k !== CACHE; })
            .map(function(k){ return caches.delete(k); })
      );
    }).then(function(){ return self.clients.claim(); })
  );
});

// fetch: Firebase/API는 네트워크 우선, 정적 파일은 캐시 우선
self.addEventListener('fetch', function(e){
  var url = e.request.url;
  // Firebase, Google API, 외부 CDN 요청 → 네트워크에 맡김
  if(url.includes('firebaseio.com') ||
     url.includes('googleapis.com') ||
     url.includes('firebaseapp.com') ||
     url.includes('cloudfunctions.net') ||
     url.includes('cdnjs.cloudflare.com') ||
     url.includes('fonts.gstatic.com') ||
     e.request.method !== 'GET'){
    return;
  }
  // 정적 에셋: 캐시 우선 → 네트워크 폴백 → 캐시 업데이트
  e.respondWith(
    caches.match(e.request).then(function(cached){
      var fetchPromise = fetch(e.request).then(function(resp){
        if(resp && resp.status === 200 && resp.type !== 'opaque'){
          var clone = resp.clone();
          caches.open(CACHE).then(function(cache){ cache.put(e.request, clone); });
        }
        return resp;
      }).catch(function(){ return cached; });
      return cached || fetchPromise;
    })
  );
});
