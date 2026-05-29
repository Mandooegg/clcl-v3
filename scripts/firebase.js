"use strict";
// Firebase 제거 — 로컬 전용 모드로 운영
// 아래 스텁 함수들은 auth.js/pages.js에서 호출되는 참조를 안전하게 처리합니다.

function stopRealtime(){}
function saveUserState(){}
function loadUserState(){return Promise.resolve();}
function startRealtime(){}
function updNoticeBdg(){}

function rNotice(){
  var el=document.getElementById('NTL')||document.getElementById('NL');
  if(el)el.innerHTML='<p style="color:var(--text-muted);font-size:13px;padding:20px 0">공지사항 기능은 현재 사용하지 않습니다.</p>';
}
