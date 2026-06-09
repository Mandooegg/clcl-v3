"use strict";
// ===== 3D VIEWER (Three.js) =====
// init3D: Scene/Camera/Renderer 초기화 + 이벤트 바인딩
// upd3D: 건물 메쉬 재생성
// updateSun: 태양 위치 (위도/경도/시간 기반)
// drawMinimap: 2D 배치도
// 전역 상태(tS, tC, tR, bMs, rotY, rotX, dist, panX/Y/Z, sunHour, selBldgId 등)는 auth.js에 선언됨

function init3D(){
  if(typeof THREE==='undefined'){
    document.getElementById('v3d').innerHTML='<div style="display:flex;align-items:center;justify-content:center;height:100%;color:var(--t3);font-size:13px;text-align:center;padding:20px">3D 뷰어: 인터넷 연결 필요<br><small>HTTP 서버로 접속해주세요</small></div>';
    return;
  }
  popBSel(true);
  var ct=document.getElementById('v3d');
  if(tR){tR.dispose();var old=ct.querySelector('canvas');if(old)ct.removeChild(old);}
  if(tAF)cancelAnimationFrame(tAF);
  var w=ct.clientWidth,h=ct.clientHeight;
  tS=new THREE.Scene();tS.background=new THREE.Color(0x0d1117);tS.fog=new THREE.Fog(0x0d1117,200,500);
  tC=new THREE.PerspectiveCamera(45,w/h,.1,1000);
  tR=new THREE.WebGLRenderer({antialias:true});tR.setSize(w,h);tR.setPixelRatio(Math.min(window.devicePixelRatio||1,2));
  tR.shadowMap.enabled=true;tR.shadowMap.type=THREE.PCFSoftShadowMap;
  ct.appendChild(tR.domElement);
  tS.add(new THREE.AmbientLight(0x506080,.5));
  var dl=new THREE.DirectionalLight(0xffffff,1);
  dl.position.set(60,120,50);dl.castShadow=true;
  dl.shadow.mapSize.width=2048;dl.shadow.mapSize.height=2048;
  dl.shadow.camera.left=-120;dl.shadow.camera.right=120;dl.shadow.camera.top=120;dl.shadow.camera.bottom=-120;
  dl.shadow.camera.near=1;dl.shadow.camera.far=300;dl.shadow.bias=-.001;dl.shadow.normalBias=.02;
  tS.add(dl);tS.add(dl.target);
  tS.add(new THREE.PointLight(0x3b82f6,.3,250));
  tS.add(new THREE.HemisphereLight(0x8090b0,0x1a2235,.4));
  groundMesh=new THREE.Mesh(new THREE.PlaneGeometry(400,400),new THREE.MeshStandardMaterial({color:0x1a2235,roughness:.9}));
  groundMesh.rotation.x=-Math.PI/2;groundMesh.receiveShadow=true;tS.add(groundMesh);
  var gr=new THREE.GridHelper(400,80,0x1e293b,0x1e293b);gr.position.y=.01;tS.add(gr);
  ray=new THREE.Raycaster();mse=new THREE.Vector2();
  var isDr=false,isPan=false,prev={x:0,y:0},dragBldg=null,dragStart=null,mouseDownPos={x:0,y:0};
  var cv=tR.domElement;
  cv.addEventListener('contextmenu',function(e){e.preventDefault();});
  function getMse(e){var rc=cv.getBoundingClientRect();mse.x=((e.clientX-rc.left)/rc.width)*2-1;mse.y=-((e.clientY-rc.top)/rc.height)*2+1;}
  function getGroundPt(){ray.setFromCamera(mse,tC);var hits=ray.intersectObject(groundMesh);return hits.length>0?hits[0].point:null;}
  function hitBldg(){ray.setFromCamera(mse,tC);var hits=ray.intersectObjects(bMs);for(var i=0;i<hits.length;i++){var u=hits[i].object.userData;if(u.u)return u.u.bldgId;if(u.bldgId)return u.bldgId;}return null;}

  // 마우스 이벤트
  cv.addEventListener('mousedown',function(e){mouseDownPos={x:e.clientX,y:e.clientY};prev={x:e.clientX,y:e.clientY};getMse(e);if(e.button===2||e.button===1||e.shiftKey){isPan=true;cv.style.cursor='move';return;}if(editMode){var bid=hitBldg();if(bid){dragBldg=bid;var gp=getGroundPt();if(gp){var d=gDB(),sv=document.getElementById('v3dS').value;var bl;d.sites[sv].buildings.forEach(function(b){if(b.id===bid)bl=b;});dragStart={mx:gp.x,mz:gp.z,bx:bl?bl.posX||0:0,bz:bl?bl.posZ||0:0};}selectBldg(bid);cv.style.cursor='grabbing';return;}}isDr=true;});
  cv.addEventListener('mousemove',function(e){getMse(e);if(isPan){var dx=e.clientX-prev.x,dy=e.clientY-prev.y;var ps=dist*.003;var cosR=Math.cos(rotY),sinR=Math.sin(rotY);panX-=(dx*cosR+dy*sinR*Math.sin(rotX))*ps;panZ-=(-dx*sinR+dy*cosR*Math.sin(rotX))*ps;panY=Math.max(0,Math.min(80,panY+dy*Math.cos(rotX)*ps*.3));prev={x:e.clientX,y:e.clientY};return;}if(editMode&&dragBldg){var gp=getGroundPt();if(gp&&dragStart){var nx=Math.round(dragStart.bx+(gp.x-dragStart.mx)),nz=Math.round(dragStart.bz+(gp.z-dragStart.mz));var d=gDB(),sv=document.getElementById('v3dS').value;d.sites[sv].buildings.forEach(function(b){if(b.id===dragBldg&&(b.posX!==nx||b.posZ!==nz)){b.posX=nx;b.posZ=nz;sDB(d);upd3D();if(editMode)renderPosControls();}});}return;}if(isDr){rotY+=(e.clientX-prev.x)*.005;rotX+=(e.clientY-prev.y)*.005;rotX=Math.max(.1,Math.min(1.4,rotX));prev={x:e.clientX,y:e.clientY};}ray.setFromCamera(mse,tC);var its=ray.intersectObjects(bMs);var tt=document.getElementById('VT');if(its.length>0&&its[0].object.userData.u){var ud=its[0].object.userData.u;tt.style.display='block';document.getElementById('VTT').textContent=ud.bName+' '+ud.fk+' '+ud.unit;document.getElementById('VTC').textContent=editMode?'드래그: 이동':'상태: '+SL[ud.status];}else if(!editMode&&tt){tt.style.display='none';}});
  cv.addEventListener('mouseup',function(e){if(isPan){isPan=false;cv.style.cursor='default';return;}if(dragBldg){var moved=Math.abs(e.clientX-mouseDownPos.x)>3||Math.abs(e.clientY-mouseDownPos.y)>3;if(moved){addHist('배치 이동','동 이동');toast('위치 변경','success');}dragBldg=null;dragStart=null;cv.style.cursor='default';if(moved){isDr=false;return;}}isDr=false;if(Math.abs(e.clientX-mouseDownPos.x)>5||Math.abs(e.clientY-mouseDownPos.y)>5)return;getMse(e);ray.setFromCamera(mse,tC);var its=ray.intersectObjects(bMs);if(its.length>0&&its[0].object.userData.u){var ud=its[0].object.userData.u;if(editMode)selectBldg(ud.bldgId);else click3DUnit(ud.siteId,ud.bldgId,ud.fk,ud.unit);}else if(editMode)selectBldg(null);});
  cv.addEventListener('wheel',function(e){e.preventDefault();dist+=e.deltaY*.06;dist=Math.max(20,Math.min(300,dist));},{passive:false});

  // 터치 이벤트 (1-손가락 회전/클릭, 2-손가락 핀치줌 + 팬)
  var touchBldg=null,touchStart=null,touch2=null,pinchDist0=0,touchMoved=false;
  function getTouchDist(e){var dx=e.touches[0].clientX-e.touches[1].clientX,dy=e.touches[0].clientY-e.touches[1].clientY;return Math.sqrt(dx*dx+dy*dy);}
  function getTouchCenter(e){return{x:(e.touches[0].clientX+e.touches[1].clientX)/2,y:(e.touches[0].clientY+e.touches[1].clientY)/2};}

  cv.addEventListener('touchstart',function(e){
    if(e.touches.length===2){isPan=true;touch2=getTouchCenter(e);pinchDist0=getTouchDist(e);return;}
    if(e.touches.length===1){
      var t=e.touches[0];prev={x:t.clientX,y:t.clientY};mouseDownPos={x:t.clientX,y:t.clientY};touchMoved=false;
      getMse({clientX:t.clientX,clientY:t.clientY});
      if(editMode){
        var bid=hitBldg();
        if(bid){
          touchBldg=bid;
          var gp=getGroundPt(),d=gDB(),sv=document.getElementById('v3dS').value;
          var bl;d.sites[sv].buildings.forEach(function(b){if(b.id===bid)bl=b;});
          touchStart={mx:gp?gp.x:0,mz:gp?gp.z:0,bx:bl?bl.posX||0:0,bz:bl?bl.posZ||0:0};
          selectBldg(bid);return;
        }
      }
      isDr=true;
    }
  },{passive:true});

  cv.addEventListener('touchmove',function(e){
    if(e.touches.length===2){
      var newDist=getTouchDist(e);var newCenter=getTouchCenter(e);
      if(pinchDist0>0){var scale=pinchDist0/newDist;dist=Math.max(15,Math.min(300,dist*scale));pinchDist0=newDist;}
      if(touch2){var dx=newCenter.x-touch2.x,dy=newCenter.y-touch2.y;var ps=dist*.003;panX-=dx*Math.cos(rotY)*ps;panZ+=dx*Math.sin(rotY)*ps;panY=Math.max(0,Math.min(80,panY-dy*ps*.5));}
      touch2=newCenter;return;
    }
    if(e.touches.length===1){
      var t=e.touches[0];touchMoved=true;
      if(editMode&&touchBldg){
        getMse({clientX:t.clientX,clientY:t.clientY});
        var gp=getGroundPt();
        if(gp&&touchStart){
          var d=gDB(),sv=document.getElementById('v3dS').value;
          d.sites[sv].buildings.forEach(function(b){if(b.id===touchBldg){b.posX=Math.round(touchStart.bx+(gp.x-touchStart.mx));b.posZ=Math.round(touchStart.bz+(gp.z-touchStart.mz));sDB(d);upd3D();}});
        }
        return;
      }
      if(isDr){rotY+=(t.clientX-prev.x)*.005;rotX+=(t.clientY-prev.y)*.005;rotX=Math.max(.1,Math.min(1.4,rotX));prev={x:t.clientX,y:t.clientY};}
    }
  },{passive:true});

  cv.addEventListener('touchend',function(e){
    if(e.touches.length<2){isPan=false;touch2=null;pinchDist0=0;}
    if(touchBldg){touchBldg=null;touchStart=null;if(editMode)renderPosControls();}
    // 탭 감지: 손가락 이동 거의 없으면 클릭 처리
    if(isDr&&!touchMoved){
      getMse({clientX:mouseDownPos.x,clientY:mouseDownPos.y});
      ray.setFromCamera(mse,tC);var its=ray.intersectObjects(bMs);
      if(its.length>0&&its[0].object.userData.u){
        var ud=its[0].object.userData.u;
        if(editMode){selectBldg(ud.bldgId);}else{click3DUnit(ud.siteId,ud.bldgId,ud.fk,ud.unit);}
      }
    }
    isDr=false;touchMoved=false;
  });

  var mmFrame=0;
  function an(){
    tAF=requestAnimationFrame(an);
    tC.position.x=panX+Math.sin(rotY)*Math.cos(rotX)*dist;
    tC.position.y=panY+Math.sin(rotX)*dist;
    tC.position.z=panZ+Math.cos(rotY)*Math.cos(rotX)*dist;
    tC.lookAt(panX,panY,panZ);
    if(mmFrame%5===0)updateSun();
    tR.render(tS,tC);
    if(mmFrame%10===0)drawMinimap();
    mmFrame++;
  }
  an();upd3D();centerOnBuildings();
  window.addEventListener('resize',function(){
    if(!tR)return;
    var w2=ct.clientWidth,h2=ct.clientHeight;
    tC.aspect=w2/h2;tC.updateProjectionMatrix();tR.setSize(w2,h2);
  });
}

// ===== 카메라 컨트롤 =====
// 전체 동을 한 화면에 보기: 드롭다운을 'all'로 리셋 + 단지 배치도 각도
function viewAllBuildings(){
  var be=document.getElementById('v3dB');
  if(be){be.value='all';}
  selectBldg(null);
  upd3D();
  centerOnBuildings();
  // 약간 위에서 내려다보는 단지 배치도 느낌
  rotY=.3;rotX=.9;
}

function reset3DCam(){centerOnBuildings();rotY=.3;rotX=.5;}
function centerOnBuildings(){
  var d=gDB(),sv=document.getElementById('v3dS');var si=sv?sv.value:'';
  var bf=document.getElementById('v3dB');var bfv=bf?bf.value:'all';
  var s=d.sites[si];if(!s||!s.buildings.length){panX=0;panY=10;panZ=0;dist=80;return;}
  var blds=bfv==='all'?s.buildings:s.buildings.filter(function(b){return b.id===bfv;});
  if(!blds.length)blds=s.buildings;
  var sumX=0,sumZ=0,minX=1e9,maxX=-1e9,minZ=1e9,maxZ=-1e9,maxH=0;
  blds.forEach(function(b){var x=b.posX||0,z=b.posZ||0;sumX+=x;sumZ+=z;minX=Math.min(minX,x);maxX=Math.max(maxX,x);minZ=Math.min(minZ,z);maxZ=Math.max(maxZ,z);maxH=Math.max(maxH,b.floors||1);});
  panX=sumX/blds.length;panZ=sumZ/blds.length;panY=Math.min(maxH*.3,15);
  var spread=Math.max(maxX-minX,maxZ-minZ,20);
  dist=Math.max(40,Math.min(200,spread*1.8+maxH*1.2));
}
function mobToggle(panel,btn){
  var panels={vl:document.querySelector('#v3d .vl'),sun:document.getElementById('sunPanel'),map:document.querySelector('.minimap-wrap')};
  var target=panels[panel];if(!target)return;
  var isShowing=target.classList.contains('mob-show');
  for(var k in panels){if(panels[k])panels[k].classList.remove('mob-show');}
  var toggles=document.querySelectorAll('.mob-toggle');
  for(var i=0;i<toggles.length;i++)toggles[i].classList.remove('active');
  if(!isShowing){target.classList.add('mob-show');if(btn)btn.classList.add('active');}
}
function view3DTop(){centerOnBuildings();rotY=0;rotX=1.4;dist=Math.max(dist,100);}
function view3DFront(){centerOnBuildings();rotY=0;rotX=.3;}

// ===== 태양 위치 계산 =====
function getSiteCoords(){
  var d=gDB(),el=document.getElementById('v3dS');var sv=el?el.value:'';
  var s=d.sites[sv];if(!s)return{lat:36.5,lng:127};
  return{lat:s.info.lat||36.5,lng:s.info.lng||127};
}
function getSunDate(){var el=document.getElementById('sunDate');if(el&&el.value)return new Date(el.value);return new Date();}
function getSunPos(hour,lat,lng,date){
  var d2=date||new Date();
  var doy=Math.floor((d2-new Date(d2.getFullYear(),0,0))/(864e5));
  var B=(360/365)*(doy-81)*Math.PI/180;
  var decl=23.45*Math.sin(B);
  var dR=decl*Math.PI/180,lR=(lat||36.5)*Math.PI/180;
  var B2=2*Math.PI*(doy-1)/365;
  var EoT=229.18*(.000075+.001868*Math.cos(B2)-.032077*Math.sin(B2)-.014615*Math.cos(2*B2)-.04089*Math.sin(2*B2));
  var solarTime=hour+(4*(lng-135)+EoT)/60;
  var ha=(solarTime-12)*15*Math.PI/180;
  var sinAlt=Math.sin(lR)*Math.sin(dR)+Math.cos(lR)*Math.cos(dR)*Math.cos(ha);
  var alt=Math.asin(sinAlt)*180/Math.PI;
  var cosAz=(Math.sin(dR)-Math.sin(lR)*sinAlt)/(Math.cos(lR)*Math.cos(alt*Math.PI/180));
  var az=Math.acos(Math.max(-1,Math.min(1,cosAz)))*180/Math.PI;
  if(ha>0)az=360-az;
  return{alt:Math.max(-5,alt),az:az};
}
function sunXYZ(alt,az,r){
  var aR=Math.max(0,alt)*Math.PI/180,azR=(az-90)*Math.PI/180;
  return{x:Math.cos(aR)*Math.sin(azR)*r,y:Math.sin(aR)*r,z:Math.cos(aR)*Math.cos(azR)*r};
}
function getSunColor(alt){
  if(alt<0)return{c:0x334466,i:.15,a:0x101520};
  if(alt<5)return{c:0xff6b35,i:.35,a:0x2d1810};
  if(alt<15)return{c:0xffaa55,i:.65,a:0x3d2815};
  if(alt<30)return{c:0xffe0a0,i:.85,a:0x506080};
  return{c:0xffffff,i:1,a:0x506080};
}
function updateSun(){
  sunHour=parseFloat((document.getElementById('sunTime')||{}).value||10);
  var co=getSiteCoords(),sd=getSunDate();
  var sp=getSunPos(sunHour,co.lat,co.lng,sd);
  var sc=getSunColor(sp.alt);
  _lastSunPos=sp;
  var de=document.getElementById('sunDate');if(de&&!de.value)de.value=sd.toISOString().split('T')[0];
  var h=Math.floor(sunHour),m=Math.round((sunHour%1)*60);
  var tl=document.getElementById('sunTimeLabel');
  if(tl)tl.textContent=String(h<10?'0':'')+h+':'+(m<10?'0':'')+m;
  var al=document.getElementById('sunAltLabel');
  if(al)al.textContent='고도'+Math.round(sp.alt)+'°';
  var ic=document.getElementById('sunIcon');
  if(ic)ic.textContent=sp.alt<-2?'🌙':sp.alt<5?'🌅':sp.alt<15?'🌇':'☀️';
  if(!tS)return;
  var pos=sunXYZ(sp.alt,sp.az,120);
  for(var i=0;i<tS.children.length;i++){
    var c=tS.children[i];
    if(c.isDirectionalLight){
      c.position.set(panX+pos.x,Math.max(5,pos.y),panZ+pos.z);
      c.target.position.set(panX,0,panZ);c.target.updateMatrixWorld();
      c.color.setHex(sc.c);c.intensity=sc.i;break;
    }
  }
  for(var i2=0;i2<tS.children.length;i2++){
    if(tS.children[i2].isAmbientLight){
      tS.children[i2].color.setHex(sc.a);
      tS.children[i2].intensity=sp.alt<0?.15:.5;break;
    }
  }
  if(tS.background){tS.background.setHex(sp.alt<-2?0x080a12:sp.alt<5?0x1a0e08:0x0d1117);}
}

// ===== 배치 편집 =====
function toggle3DEdit(){
  editMode=document.getElementById('v3dEdit').checked;
  var pe=document.getElementById('posEditor');
  if(window.innerWidth<=768){
    if(editMode){pe.classList.add('mob-show');pe.style.display='';}else{pe.classList.remove('mob-show');}
  }else{
    pe.style.display=editMode?'block':'none';
  }
  if(editMode){renderPosControls();view3DTop();toast('배치 편집: 동을 드래그','info');}
  else{selectBldg(null);upd3D();}
}
function renderPosControls(){
  var d=gDB(),sv=document.getElementById('v3dS').value,s=d.sites[sv];if(!s)return;
  document.getElementById('posControls').innerHTML=s.buildings.map(function(b){
    var sel=selBldgId===b.id;var bid=esc(b.id);
    return '<div style="margin-bottom:8px;padding:6px;border-radius:4px;border:1px solid '+(sel?'var(--amber)':'var(--b1)')+'"><div style="font-weight:600;font-size:10px;margin-bottom:4px">'+esc(b.name)+'</div><div style="display:flex;gap:3px;align-items:center"><span style="font-size:9px;color:var(--t3)">X</span><input type="range" min="-100" max="100" value="'+(b.posX||0)+'" oninput="updPos(\''+bid+'\',\'x\',this.value)" style="flex:1"><span style="font-size:9px;color:var(--blue)" id="pv_x_'+bid+'">'+(b.posX||0)+'</span></div><div style="display:flex;gap:3px;align-items:center"><span style="font-size:9px;color:var(--t3)">Z</span><input type="range" min="-100" max="100" value="'+(b.posZ||0)+'" oninput="updPos(\''+bid+'\',\'z\',this.value)" style="flex:1"><span style="font-size:9px;color:var(--blue)" id="pv_z_'+bid+'">'+(b.posZ||0)+'</span></div><div style="display:flex;gap:3px;align-items:center"><span style="font-size:9px;color:var(--t3)">R</span><input type="range" min="0" max="345" step="15" value="'+(b.rot||0)+'" oninput="updPos(\''+bid+'\',\'r\',this.value)" style="flex:1"><span style="font-size:9px;color:var(--blue)" id="pv_r_'+bid+'">'+(b.rot||0)+'</span></div></div>';
  }).join('');
}
function updPos(bid,axis,val){
  var d=gDB(),sv=document.getElementById('v3dS').value;val=parseInt(val);
  d.sites[sv].buildings.forEach(function(b){if(b.id===bid){if(axis==='x')b.posX=val;else if(axis==='z')b.posZ=val;else b.rot=val;}});
  var el=document.getElementById('pv_'+axis[0]+'_'+bid);if(el)el.textContent=val;
  sDB(d);upd3D();
}
function savePosEdits(){addHist('배치 수정','동 위치/회전 변경');toast('배치 저장','success');}

// ===== 건물 선택 하이라이트 =====
function selectBldg(bid){
  selBldgId=bid;var tt=document.getElementById('VT');
  if(bid){
    var d=gDB(),si=document.getElementById('v3dS');var sv=si?si.value:'';
    var bl=d.sites[sv]?d.sites[sv].buildings.filter(function(b){return b.id===bid;})[0]:null;
    if(tt&&bl){
      tt.style.display='block';
      document.getElementById('VTT').textContent=(bl.name||'')+' 선택됨';
      document.getElementById('VTC').textContent='X:'+(bl.posX||0)+' Z:'+(bl.posZ||0)+' 회전:'+(bl.rot||0)+'°';
    }
  }else{
    if(tt)tt.style.display='none';
  }
  bMs.forEach(function(m){
    if(m.material&&m.material.emissive){
      var mbid=(m.userData.u?m.userData.u.bldgId:m.userData.bldgId)||'';
      if(bid&&mbid===bid){m.material.emissive.setHex(0x3b82f6);m.material.emissiveIntensity=.3;}
      else{m.material.emissive.setHex(0);m.material.emissiveIntensity=0;}
    }
  });
}

// ===== 3D 셀 클릭 (상태 순환) =====
function click3DUnit(si,bi,fk,unit){
  var d=gDB(),s=d.sites[si];
  if(!s.progress[bi])s.progress[bi]={};
  if(!s.progress[bi][fk])s.progress[bi][fk]={};
  var cur=s.progress[bi][fk][unit]||'pending';
  var ni=(SC.indexOf(cur)+1)%3;var nst=SC[ni];
  s.progress[bi][fk][unit]=nst;
  sDB(d);addHist('3D 시공',fk+' '+unit+': '+SL[nst]);
  if(nst==='complete')chkProc(si,bi,fk);
  upd3D();toast(fk+' '+unit+': '+SL[nst],'success');
}

// ===== 건물 메쉬 렌더 =====
function upd3D(){
  if(!tS)return;popBSel(true);
  var d=gDB(),sv=document.getElementById('v3dS');var si=sv?sv.value:'';
  var bf=document.getElementById('v3dB');var bfv=bf?bf.value:'all';
  var s=d.sites[si];if(!s)return;
  bMs.forEach(function(m){tS.remove(m);if(m.geometry)m.geometry.dispose();if(m.material){if(Array.isArray(m.material))m.material.forEach(function(mt){mt.dispose();});else m.material.dispose();}});
  bMs=[];
  var blds=bfv==='all'?s.buildings:s.buildings.filter(function(b){return b.id===bfv;});
  var fH=1;var gap=.6;
  blds.forEach(function(bl){
    var pr=s.progress[bl.id]||{};
    var px=bl.posX||0,pz=bl.posZ||0,rot=(bl.rot||0)*Math.PI/180;
    var unitLayout=getUnitLayout(bl.type,bl.units);
    for(var f=-bl.basement;f<=bl.floors;f++){
      if(!f)continue;
      var fk=f<0?'B'+Math.abs(f):f+'F';
      var fd=pr[fk]||{};var yPos=(f<0?f+.5:f-.5)*fH;
      unitLayout.forEach(function(uPos,idx){
        var unitNum=(idx+1)+'호';var st=fd[unitNum]||'pending';
        var co=SH[st];var op=st==='pending'?.35:.88;
        var uw=uPos.w-gap,ud2=uPos.d-gap;
        var geo=new THREE.BoxGeometry(uw,fH*.85,ud2);
        var mat=new THREE.MeshStandardMaterial({color:co,transparent:true,opacity:op,roughness:.6});
        var mesh=new THREE.Mesh(geo,mat);
        var lx=uPos.x,lz=uPos.z;
        var rx=lx*Math.cos(rot)-lz*Math.sin(rot);
        var rz=lx*Math.sin(rot)+lz*Math.cos(rot);
        mesh.position.set(px+rx,yPos,pz+rz);mesh.rotation.y=rot;
        mesh.castShadow=true;mesh.receiveShadow=true;
        mesh.userData={u:{siteId:si,bldgId:bl.id,fk:fk,unit:unitNum,bName:bl.name,status:st}};
        tS.add(mesh);bMs.push(mesh);
      });
    }
    // 라벨 (Canvas 기반 — 안전)
    var c2=document.createElement('canvas');c2.width=256;c2.height=64;
    var cx=c2.getContext('2d');
    cx.fillStyle=selBldgId===bl.id?'#f59e0b':'#3b82f6';
    cx.font='bold 28px sans-serif';cx.textAlign='center';
    cx.fillText(bl.name,128,40);
    var tx=new THREE.CanvasTexture(c2);
    var sp2=new THREE.Sprite(new THREE.SpriteMaterial({map:tx,transparent:true}));
    sp2.position.set(px,bl.floors*fH+2,pz);sp2.scale.set(10,2.5,1);
    sp2.userData={bldgId:bl.id};tS.add(sp2);bMs.push(sp2);
  });
  if(selBldgId)selectBldg(selBldgId);
  drawMinimap();
}

// ===== 건물 형태별 호수 배치 =====
function getUnitLayout(type,units){
  var layouts=[];var uw=3.2,ud=2.8;
  if(type==='plate'){
    for(var i=0;i<units;i++)layouts.push({x:(i-(units-1)/2)*(uw+.3),z:0,w:uw,d:ud});
  }else if(type==='tower'){
    var cols=Math.ceil(units/2);
    for(var i2=0;i2<units;i2++){var row=Math.floor(i2/cols),col=i2%cols;layouts.push({x:(col-(cols-1)/2)*(uw+.3),z:(row-.5)*(ud+.3),w:uw,d:ud});}
  }else if(type==='corridor'){
    var half=Math.ceil(units/2);
    for(var i3=0;i3<units;i3++){var side=i3<half?-1:1;var idx2=i3<half?i3:i3-half;var cols2=i3<half?half:units-half;layouts.push({x:(idx2-(cols2-1)/2)*(uw+.3),z:side*(ud*.7+.5),w:uw,d:ud*.7});}
  }else if(type==='lshape'){
    var a1=Math.ceil(units*.6),a2=units-a1;
    for(var i4=0;i4<a1;i4++)layouts.push({x:(i4-(a1-1)/2)*(uw+.3),z:-ud*.6,w:uw,d:ud});
    for(var i5=0;i5<a2;i5++)layouts.push({x:-(a1-1)/2*(uw+.3),z:i5*(ud+.3),w:uw,d:ud});
  }else if(type==='ushape'){
    var side2=Math.floor(units/3),mid=units-side2*2;
    for(var i6=0;i6<side2;i6++)layouts.push({x:-mid*(uw+.3)/2-uw*.7,z:(i6-(side2-1)/2)*(ud+.3),w:uw,d:ud});
    for(var i7=0;i7<mid;i7++)layouts.push({x:(i7-(mid-1)/2)*(uw+.3),z:(side2-1)/2*(ud+.3)+ud*.7,w:uw,d:ud});
    for(var i8=0;i8<side2;i8++)layouts.push({x:mid*(uw+.3)/2+uw*.7,z:(i8-(side2-1)/2)*(ud+.3),w:uw,d:ud});
  }else{
    for(var i9=0;i9<units;i9++)layouts.push({x:(i9-(units-1)/2)*(uw+.3),z:i9%2===0?-.8:.8,w:uw,d:ud});
  }
  return layouts;
}

// ===== 미니맵 =====
function drawMinimap(){
  var cv=document.getElementById('mmCv');if(!cv)return;
  var ctx=cv.getContext('2d');
  var d=gDB(),el=document.getElementById('v3dS');var si=el?el.value:'';
  var s=d.sites[si];
  if(!s||!s.buildings.length){ctx.clearRect(0,0,180,180);return;}
  var W=180,H=180;cv.width=W;cv.height=H;
  var sn=document.getElementById('mmSiteName');if(sn)sn.textContent=s.name;
  var minX=1e9,maxX=-1e9,minZ=1e9,maxZ=-1e9;
  s.buildings.forEach(function(b){var x=b.posX||0,z=b.posZ||0;var r=Math.max(b.units*2,6);minX=Math.min(minX,x-r);maxX=Math.max(maxX,x+r);minZ=Math.min(minZ,z-r);maxZ=Math.max(maxZ,z+r);});
  var pad=16;var rX=maxX-minX||1,rZ=maxZ-minZ||1;
  var scale=Math.min((W-pad*2)/rX,(H-pad*2)/rZ);
  var cxM=W/2,czM=H/2,offX=(minX+maxX)/2,offZ=(minZ+maxZ)/2;
  function toX(x){return cxM+(x-offX)*scale;}
  function toY(z){return czM+(z-offZ)*scale;}
  ctx.fillStyle='#0d1117';ctx.fillRect(0,0,W,H);
  ctx.fillStyle='rgba(100,116,139,.3)';ctx.font='bold 7px sans-serif';ctx.textAlign='center';
  ctx.fillText('N',W/2,8);ctx.fillText('S',W/2,H-3);
  s.buildings.forEach(function(b){
    var x=b.posX||0,z=b.posZ||0;var sx=toX(x),sy=toY(z);
    var pr=s.progress[b.id]||{};var total=0,comp=0;
    for(var fk in pr)for(var u in pr[fk]){total++;if(pr[fk][u]==='complete')comp++;}
    var pct=total?comp/total:0;
    var fc=pct>=1?'rgba(16,185,129,.7)':pct>.5?'rgba(59,130,246,.6)':pct>0?'rgba(245,158,11,.5)':'rgba(100,116,139,.4)';
    var sel=selBldgId===b.id;
    var bw=Math.max(b.units*2.5,8)*scale/5;var bh=4*scale/5;
    ctx.save();ctx.translate(sx,sy);ctx.rotate((b.rot||0)*Math.PI/180);
    ctx.fillStyle=fc;ctx.fillRect(-bw/2,-bh/2,bw,bh);
    ctx.strokeStyle=sel?'#f59e0b':'rgba(148,163,184,.4)';
    ctx.lineWidth=sel?2:1;ctx.strokeRect(-bw/2,-bh/2,bw,bh);
    ctx.restore();
    ctx.fillStyle=sel?'#f59e0b':'#e2e8f0';
    ctx.font=(sel?'bold ':'')+'8px sans-serif';ctx.textAlign='center';
    ctx.fillText(b.name,sx,sy+3);
    ctx.fillStyle='rgba(148,163,184,.6)';ctx.font='6px sans-serif';
    ctx.fillText(Math.round(pct*100)+'%',sx,sy+11);
  });
  if(tC){var csx=toX(panX),csy=toY(panZ);ctx.beginPath();ctx.arc(csx,csy,3,0,Math.PI*2);ctx.fillStyle='#06b6d4';ctx.fill();}
  var sp=_lastSunPos;
  if(sp&&sp.alt>0){
    var azR=(sp.az-90)*Math.PI/180;var sr=W/2-6;
    var ssx=W/2+Math.sin(azR)*sr,ssy=H/2-Math.cos(azR)*sr;
    ctx.beginPath();ctx.arc(ssx,ssy,3,0,Math.PI*2);
    ctx.fillStyle='rgba(245,158,11,'+(Math.min(1,sp.alt/40))+')';ctx.fill();
  }
}

// 미니맵 클릭으로 건물 선택
document.addEventListener('DOMContentLoaded',function(){
  var cv=document.getElementById('mmCv');
  if(cv)cv.addEventListener('click',function(e){
    var rc=this.getBoundingClientRect();
    var mx=e.clientX-rc.left,my=e.clientY-rc.top;
    var d=gDB(),el=document.getElementById('v3dS');var si=el?el.value:'';
    var s=d.sites[si];if(!s)return;
    var minX2=1e9,maxX2=-1e9,minZ2=1e9,maxZ2=-1e9;
    s.buildings.forEach(function(b){var x=b.posX||0,z=b.posZ||0;var r=Math.max(b.units*2,6);minX2=Math.min(minX2,x-r);maxX2=Math.max(maxX2,x+r);minZ2=Math.min(minZ2,z-r);maxZ2=Math.max(maxZ2,z+r);});
    var W=180,H=180,pad=16;
    var scale=Math.min((W-pad*2)/(maxX2-minX2||1),(H-pad*2)/(maxZ2-minZ2||1));
    var cxM=W/2,offX=(minX2+maxX2)/2,czM=H/2,offZ=(minZ2+maxZ2)/2;
    var closest=null,minDist=1e9;
    s.buildings.forEach(function(b){
      var sx=cxM+((b.posX||0)-offX)*scale,sy=czM+((b.posZ||0)-offZ)*scale;
      var dist2=Math.sqrt((mx-sx)*(mx-sx)+(my-sy)*(my-sy));
      if(dist2<minDist&&dist2<20){minDist=dist2;closest=b;}
    });
    if(closest){selectBldg(closest.id);panX=closest.posX||0;panZ=closest.posZ||0;document.getElementById('v3dB').value=closest.id;upd3D();}
    else{selectBldg(null);document.getElementById('v3dB').value='all';upd3D();}
    drawMinimap();
  });
});
