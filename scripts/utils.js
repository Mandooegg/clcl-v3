'use strict';
// ===== 공용 유틸 =====
// esc: XSS 방지 HTML escape
// toast/modal: UI 헬퍼
// gUS/gProg/popSel/popBSel/addHist/updBdg: 데이터 보조

// 사용자 입력을 innerHTML로 렌더링하기 전에 반드시 esc()로 감싸세요.
function esc(s){
  if(s===null||s===undefined)return '';
  return String(s).replace(/[&<>"'`/]/g,function(c){
    return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;','`':'&#96;','/':'&#47;'}[c];
  });
}

// 토스트 알림 (마스코트 반응 연동)
function toast(m,t){
  t=t||'info';
  var c=document.getElementById('TC');
  var ic={success:'✅',error:'❌',warning:'⚠️',info:'ℹ️'};
  var e=document.createElement('div');e.className='tt '+t;
  var s1=document.createElement('span');s1.textContent=ic[t]||'';
  var s2=document.createElement('span');s2.textContent=m; // XSS 방지: textContent 사용
  e.appendChild(s1);e.appendChild(s2);
  c.appendChild(e);
  setTimeout(function(){
    e.style.opacity='0';
    setTimeout(function(){try{if(e.parentNode)e.parentNode.removeChild(e)}catch(ex){}},300);
  },3500);
  // 마스코트 반응
  if(window.CU){
    if(t==='success'&&m.indexOf('삭제')>=0)window.mascotReact('delete',m);
    else if(t==='success')window.mascotReact('save',m);
    else if(t==='error')window.mascotReact('error',m);
    else if(t==='warning')window.mascotReact('alert',m);
  }
}

// 모달 열고 닫기
function cM(id){document.getElementById(id).classList.remove('show');}
function oM(id){document.getElementById(id).classList.add('show');}

// 사이드바 토글 (모바일)
function toggleSB(){
  document.getElementById('sidebarEl').classList.toggle('open');
  document.getElementById('sbOv').classList.toggle('show');
}
function closeSB(){
  var sb=document.getElementById('sidebarEl'),ov=document.getElementById('sbOv');
  if(sb)sb.classList.remove('open');
  if(ov)ov.classList.remove('show');
}

// 현재 사용자가 접근 가능한 현장 목록
function gUS(){
  var d=window.gDB();
  if(window.CU.role==='admin'){
    var r=[];for(var k in d.sites)r.push(d.sites[k]);return r;
  }
  return window.CU.sites.map(function(s){return d.sites[s];}).filter(Boolean);
}

// 셀렉트 박스 채우기 (현장)
function popSel(keep){
  var ss=gUS();
  ['v3dS','prS','cfS','psS','isS'].forEach(function(id){
    var e=document.getElementById(id);if(!e)return;
    var prev=e.value;
    e.innerHTML=ss.map(function(s){return '<option value="'+esc(s.id)+'">'+esc(s.name)+'</option>';}).join('');
    if(keep&&prev){
      for(var i=0;i<e.options.length;i++){if(e.options[i].value===prev){e.value=prev;break;}}
    }
  });
  popBSel(keep);
}

// 셀렉트 박스 채우기 (건물)
function popBSel(keep){
  var d=window.gDB();
  [['v3dS','v3dB'],['prS','prB']].forEach(function(pair){
    var se=document.getElementById(pair[0]),be=document.getElementById(pair[1]);
    if(!se||!be)return;
    var si=d.sites[se.value];if(!si)return;
    var prev=be.value;
    be.innerHTML='<option value="all">전체 동</option>'+si.buildings.map(function(bl){
      return '<option value="'+esc(bl.id)+'">'+esc(bl.name)+'</option>';
    }).join('');
    if(keep&&prev){
      for(var i=0;i<be.options.length;i++){if(be.options[i].value===prev){be.value=prev;break;}}
    }
  });
}

// 수정이력 추가 (최근 100건 유지)
function addHist(a,dt){
  var d=window.gDB();
  d.editHistory.unshift({time:new Date().toLocaleString('ko-KR'),user:window.CU.name,action:a,detail:dt});
  if(d.editHistory.length>100)d.editHistory.length=100;
  window.sDB(d);
}

// 미확인 발주 알림 배지 업데이트
function updBdg(){
  var d=window.gDB(),ss=gUS().map(function(s){return s.id;});
  var u=d.alerts.filter(function(a){return ss.indexOf(a.siteId)>=0&&!a.read;}).length;
  var b=document.getElementById('AB');
  b.style.display=u>0?'inline':'none';b.textContent=u;
}

// 현장 완료율 (%) 계산
function gProg(si){
  var d=window.gDB(),s=d.sites[si];if(!s)return 0;
  var t=0,dn=0;
  s.buildings.forEach(function(b){
    var p=s.progress[b.id]||{};
    for(var fk in p)for(var u in p[fk]){t++;if(p[fk][u]==='complete')dn++;}
  });
  return t>0?Math.round(dn/t*100):0;
}

// ===== ES Module exports (Phase 2) =====
// window 할당: 비-모듈 스크립트 (firebase.js, pages.js 등)와 하위 호환
window.esc=esc;
window.toast=toast;
window.cM=cM;
window.oM=oM;
window.toggleSB=toggleSB;
window.closeSB=closeSB;
window.gUS=gUS;
window.popSel=popSel;
window.popBSel=popBSel;
window.addHist=addHist;
window.updBdg=updBdg;
window.gProg=gProg;

export { esc, toast, cM, oM, toggleSB, closeSB, gUS, popSel, popBSel, addHist, updBdg, gProg };
