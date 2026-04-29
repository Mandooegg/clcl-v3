"use strict";
var _histPage=0,_pstatPage=0;
var HIST_PER_PAGE=20,PSTAT_PER_PAGE=10;
// ===== 페이지 렌더러 =====
// 대시보드/현장정보/동설정/시공현황/발주/검수/현장관리/사용자관리/수정이력
// 각 페이지는 nav() 호출 시 fn 매핑으로 진입

// ===== 대시보드 =====
function rDash(){
  var d=gDB();
  if(typeof _loadedSites!=='undefined'&&typeof loadSiteData==='function'){var _ul=Object.keys(d.sites).filter(function(id){return !_loadedSites.has(id);});if(_ul.length){Promise.all(_ul.slice(0,10).map(loadSiteData)).then(rDash);if(_loadedSites.size===0)return;}}
  var ss=gUS();var tb=0,th=0;
  ss.forEach(function(s){tb+=s.buildings.length;s.buildings.forEach(function(b){th+=(b.basement+b.floors)*b.units;});});
  var avg=ss.length?Math.round(ss.reduce(function(sum,s){return sum+gProg(s.id);},0)/ss.length):0;
  var als=d.alerts.filter(function(a){return gUS().map(function(s){return s.id;}).indexOf(a.siteId)>=0;});
  var ur=als.filter(function(a){return !a.read;}).length;
  var hr=new Date().getHours();
  var greet=hr<9?'좋은 아침이에요!':hr<12?'오전 파이팅!':hr<14?'점심 맛있게 드세요~':hr<18?'오후도 화이팅!':'고생 많으셨어요!';
  var catMood=avg>=80?'proud':avg>=50?'happy':ur>0?'surprised':'happy';
  document.getElementById('dashGreet').innerHTML='<div style="display:flex;align-items:center;gap:12px;padding:14px 16px;background:linear-gradient(135deg,rgba(59,130,246,.08),rgba(6,182,212,.06));border:1px solid var(--b1);border-radius:var(--r);margin-bottom:12px">'+catSVG(48,catMood)+'<div><div style="font-size:14px;font-weight:700">'+esc(CU.name)+'님, '+greet+'</div><div style="font-size:11px;color:var(--t2);margin-top:2px">'+(ur>0?'확인할 알림이 '+ur+'건 있어요!':'현장이 순조롭게 진행중이에요 ✨')+'</div></div></div>';
  document.getElementById('DS').innerHTML='<div class="sc blue"><div class="sl">현장</div><div class="sv">'+ss.length+'</div><div class="ss">개</div></div><div class="sc green"><div class="sl">완료율</div><div class="sv">'+avg+'%</div></div><div class="sc amber"><div class="sl">동수</div><div class="sv">'+tb+'</div><div class="ss">'+th.toLocaleString()+'세대</div></div><div class="sc red"><div class="sl">알림</div><div class="sv">'+ur+'</div><div class="ss">미확인</div></div>';
  document.getElementById('SP').innerHTML=ss.map(function(s){var p=gProg(s.id);return '<div style="margin-bottom:12px"><div style="display:flex;justify-content:space-between;margin-bottom:4px"><span style="font-size:12px;font-weight:500">'+esc(s.name)+'</span><span style="font-size:12px;color:var(--blue)">'+p+'%</span></div><div class="pb"><div class="pf blue" style="width:'+p+'%"></div></div></div>';}).join('');
  document.getElementById('RA').innerHTML=als.slice(0,5).map(function(a){return '<div class="ac '+esc(a.type)+'"><div style="font-size:16px">'+(a.type==='urgent'?'🔴':'🔵')+'</div><div style="flex:1"><div style="font-size:12px;font-weight:600">'+esc(a.material)+'</div><div style="font-size:10px;color:var(--t3)">'+esc(a.message)+'</div></div></div>';}).join('')||emptyState('알림이 없어요 🎉');  loadWeather(ss);

}

// ===== 날씨 위젯 =====
function loadWeather(ss){
  var wd=document.getElementById('WD');
  if(!wd){
    wd=document.createElement('div');
    wd.id='WD';wd.style.marginBottom='12px';
    var dg=document.getElementById('dashGreet');
    if(!dg)return;
    dg.insertAdjacentElement('afterend',wd);
  }
  var lat=37.5665,lon=126.9780;
  var cs=ss&&ss[0];
  if(cs&&cs.info){
    if(cs.info.lat)lat=parseFloat(cs.info.lat);
    if(cs.info.lon)lon=parseFloat(cs.info.lon);
  }
  wd.innerHTML='<div style="padding:8px 14px;color:var(--t3);font-size:11px">⏳ 날씨 로딩 중...</div>';
  fetch('https://api.open-meteo.com/v1/forecast?latitude='+lat+'&longitude='+lon+'&current=temperature_2m,relative_humidity_2m,precipitation,weather_code,wind_speed_10m&wind_speed_unit=ms&timezone=Asia%2FSeoul')
  .then(function(r){return r.json();})
  .then(function(data){
    var c=data.current,wc=c.weather_code;
    var icon=wc===0?'☀️':wc<=2?'🌤️':wc<=3?'☁️':wc<=48?'🌫️':wc<=67?'🌧️':wc<=77?'🌨️':wc<=82?'🌦️':wc<=99?'⛈️':'🌡️';
    var desc=wc===0?'맑음':wc<=2?'구름 조금':wc<=3?'흐림':wc<=48?'안개':wc<=67?'비':wc<=77?'눈':wc<=82?'소나기':'뇌우';
    wd.innerHTML='<div style="display:flex;align-items:center;gap:12px;padding:10px 16px;background:var(--bg1);border-radius:8px;border:1px solid var(--b1);margin-bottom:4px">'
      +'<span style="font-size:28px">'+icon+'</span>'
      +'<div style="flex:1">'
        +'<div style="display:flex;align-items:baseline;gap:8px">'
          +'<span style="font-size:22px;font-weight:700;color:var(--t1)">'+c.temperature_2m+'°C</span>'
          +'<span style="font-size:12px;color:var(--t2)">'+desc+'</span>'
        +'</div>'
        +'<div style="font-size:11px;color:var(--t3);margin-top:2px">'
          +'💧 '+c.relative_humidity_2m+'%'
          +(c.precipitation>0?'  🌧 '+c.precipitation+'mm':'')
          +'  💨 '+c.wind_speed_10m+'m/s'
        +'</div>'
      +'</div>'
      +(cs?'<div style="font-size:10px;color:var(--t3);text-align:right;line-height:1.6">'+esc(cs.name)+'<br>현재 날씨</div>':'')
    +'</div>';
  }).catch(function(){wd.innerHTML='';});
}


// ===== 현장정보 =====
function rInfo(){
  var ss=gUS();
  if(CU.role==='admin'&&ss.length>1){
    document.getElementById('SLS').style.display='block';
    document.getElementById('SLA').innerHTML=ss.map(function(s){return '<div style="padding:8px;margin-bottom:6px;background:var(--bg1);border-radius:6px;cursor:pointer;border:1px solid var(--b1)" onclick="showSD(\''+esc(s.id)+'\')"><div style="font-weight:600;font-size:12px">'+esc(s.name)+'</div><div style="font-size:10px;color:var(--t3)">'+esc(s.info.location)+'</div></div>';}).join('');
  }
  showSD(ss[0]?ss[0].id:null);
}
function showSD(si){
  if(!si)return;var d=gDB(),s=d.sites[si];if(!s)return;
  ceSI=si;var i=s.info;
  var fs=[['현장명',s.name],['공사명',i.projectName],['위치',i.location],['위도/경도',(i.lat||'-')+'°N / '+(i.lng||'-')+'°E'],['발주처',i.owner],['시공사',i.contractor],['감리사',i.supervisor],['대지면적',i.totalArea],['건축면적',i.buildingArea],['층수',i.floors],['세대수',i.households],['착공일',i.startDate],['준공예정일',i.endDate],['구조',i.structure]];
  document.getElementById('SV').innerHTML='<h3 style="font-size:14px;margin-bottom:12px;color:var(--cyan)">'+esc(s.name)+'</h3><div class="gr g2">'+fs.map(function(f){return '<div style="margin-bottom:8px"><div style="font-size:10px;color:var(--t3);margin-bottom:2px">'+esc(f[0])+'</div><div style="font-size:12px;font-weight:500">'+esc(f[1]||'-')+'</div></div>';}).join('')+'</div>';
}
function toggleEdit(){
  var v=document.getElementById('SV'),e=document.getElementById('SE');
  if(e.style.display==='none'){
    var d=gDB(),ss=gUS();
    var si=ceSI||(ss.length?ss[0].id:null);
    if(!si){toast('현장 정보를 먼저 선택하세요','error');return;}
    var s=d.sites[si];if(!s){toast('현장 데이터 없음','error');return;}
    var i=s.info;
    var ef=[['siteName','현장명',s.name||''],['projectName','공사명',i.projectName||''],['location','위치',i.location||''],['lat','위도(°N)',String(i.lat||'')],['lng','경도(°E)',String(i.lng||'')],['owner','발주처',i.owner||''],['contractor','시공사',i.contractor||''],['supervisor','감리사',i.supervisor||''],['totalArea','대지면적',i.totalArea||''],['buildingArea','건축면적',i.buildingArea||''],['floors','층수',i.floors||''],['households','세대수',i.households||''],['startDate','착공일',i.startDate||''],['endDate','준공예정일',i.endDate||''],['structure','구조',i.structure||'']];
    var h='';
    for(var r=0;r<ef.length;r+=2){
      var pair=ef.slice(r,r+2);h+='<div class="fr">';
      for(var p=0;p<pair.length;p++){
        var k=pair[p][0],lb=pair[p][1],val=esc(pair[p][2]);
        h+='<div class="fd"><label>'+esc(lb)+'</label><input id="e_'+esc(k)+'" value="'+val+'"></div>';
      }
      h+='</div>';
    }
    h+='<div style="display:flex;gap:6px;margin-top:10px"><button class="btn bs bg" onclick="saveSI()">저장</button><button class="btn bs bo" onclick="toggleEdit()">취소</button></div>';
    e.innerHTML=h;e.style.display='block';v.style.display='none';
  }else{
    e.style.display='none';v.style.display='block';
  }
}
function saveSI(){
  try{
    var d=gDB(),ss=gUS();
    var si=ceSI||(ss.length?ss[0].id:null);
    if(!si){toast('현장 없음','error');return;}
    var s=d.sites[si];if(!s){toast('현장 데이터 없음','error');return;}
    var nameEl=document.getElementById('e_siteName');
    if(nameEl&&nameEl.value.trim())s.name=nameEl.value.trim();
    var fields=['projectName','location','owner','contractor','supervisor','totalArea','buildingArea','floors','households','startDate','endDate','structure'];
    for(var i=0;i<fields.length;i++){var el=document.getElementById('e_'+fields[i]);if(el)s.info[fields[i]]=el.value;}
    var latEl=document.getElementById('e_lat'),lngEl=document.getElementById('e_lng');
    s.info.lat=parseFloat(latEl?latEl.value:0)||0;
    s.info.lng=parseFloat(lngEl?lngEl.value:0)||0;
    sDB(d);addHist('현장정보 수정',s.name);toast('저장 완료','success');toggleEdit();
    popSel(true);showSD(si);rInfo();
    var snEl=document.getElementById('SN');
    if(snEl)snEl.textContent=CU.role==='admin'?'전체 현장 관리':s.name;
  }catch(err){toast('저장 오류: '+err.message,'error');}
}

// ===== 시공현황 테이블 =====
function rPT(){
  var d=gDB();popBSel(true);
  var si=document.getElementById('prS')?document.getElementById('prS').value:'';
  var bi=document.getElementById('prB')?document.getElementById('prB').value:'';
  if(si&&typeof _loadedSites!=='undefined'&&!_loadedSites.has(si)&&typeof loadSiteData==='function'){var ptEl=document.getElementById('PT');if(ptEl)ptEl.innerHTML='<div style="text-align:center;padding:40px;color:var(--t3)">⏳ 현장 데이터 로딩 중...</div>';loadSiteData(si).then(rPT);return;}
  var s=d.sites[si];
  if(!s){document.getElementById('PTW').innerHTML='<p style="color:var(--t3);font-size:11px">현장을 선택하세요</p>';return;}
  var w=document.getElementById('PTW');
  if(!bi||bi==='all'){
    w.innerHTML='<table><thead><tr><th>동</th><th>형태</th><th>준비</th><th>시공중</th><th>완료</th><th>율</th><th></th></tr></thead><tbody>'+s.buildings.map(function(b){
      var p=s.progress[b.id]||{};var t=0,cn={pending:0,inprogress:0,complete:0};
      for(var fk in p)for(var u in p[fk]){t++;cn[p[fk][u]]=(cn[p[fk][u]]||0)+1;}
      var pc=t?Math.round(cn.complete/t*100):0;
      return '<tr><td style="font-weight:600">'+esc(b.name)+'</td><td>'+esc(TN[b.type]||'')+'</td><td style="color:var(--t3)">'+cn.pending+'</td><td style="color:var(--amber)">'+cn.inprogress+'</td><td style="color:var(--blue)">'+cn.complete+'</td><td><div style="display:flex;align-items:center;gap:4px"><div class="pb" style="flex:1;min-width:40px"><div class="pf blue" style="width:'+pc+'%"></div></div><span style="font-size:10px;color:var(--blue)">'+pc+'%</span></div></td><td><button class="btn bx bo" onclick="document.getElementById(\'prB\').value=\''+esc(b.id)+'\';rPT()">상세</button></td></tr>';
    }).join('')+'</tbody></table>';return;
  }
  var bl=null;s.buildings.forEach(function(b){if(b.id===bi)bl=b;});if(!bl)return;
  var pr=s.progress[bl.id]||{};
  var fls=[];for(var f=bl.floors;f>=1;f--)fls.push(f+'F');
  for(var b2=1;b2<=bl.basement;b2++)fls.push('B'+b2);
  var uH=[];for(var i=1;i<=bl.units;i++)uH.push(i+'호');
  w.innerHTML='<div style="margin-bottom:8px;font-size:11px;color:var(--t2)"><strong>'+esc(bl.name)+'</strong> | '+esc(TN[bl.type]||'')+' | B'+bl.basement+'~'+bl.floors+'F</div><table><thead><tr><th>층</th>'+uH.map(function(u){return '<th style="text-align:center">'+esc(u)+'</th>';}).join('')+'<th>율</th></tr></thead><tbody>'+fls.map(function(fk){
    var fd=pr[fk]||{};var dn=0;
    var cs=uH.map(function(u){
      var st=fd[u]||'pending';if(st==='complete')dn++;
      return '<td style="text-align:center"><div class="fc '+esc(st)+'" onclick="tgF(\''+esc(si)+'\',\''+esc(bl.id)+'\',\''+esc(fk)+'\',\''+esc(u)+'\')">'+(st==='complete'?'완':st==='inprogress'?'중':'')+'</div></td>';
    }).join('');
    var pc=Math.round(dn/bl.units*100);
    return '<tr><td style="font-weight:600;font-size:10px">'+esc(fk)+'</td>'+cs+'<td><span style="font-size:10px;color:var(--blue)">'+pc+'%</span></td></tr>';
  }).join('')+'</tbody></table>';
}

function tgF(si,bi,fk,u){
  var d=gDB(),s=d.sites[si];
  if(!s.progress[bi])s.progress[bi]={};
  if(!s.progress[bi][fk])s.progress[bi][fk]={};
  var cur=s.progress[bi][fk][u]||'pending';
  var ni=(SC.indexOf(cur)+1)%3;var nst=SC[ni];
  s.progress[bi][fk][u]=nst;
  sDB(d);addHist('시공현황',fk+' '+u+': '+SL[nst]);
  if(nst==='complete')chkProc(si,bi,fk);
  rPT();toast(fk+' '+u+': '+SL[nst],'success');
}

// 층 전체 완료 시 발주 알림 자동 생성
function chkProc(si,bi,fk){
  var d=gDB(),s=d.sites[si];
  var bl=null;s.buildings.forEach(function(b){if(b.id===bi)bl=b;});
  if(!bl)return;
  var fn=0;
  if(fk[0]==='B')fn=-parseInt(fk.substring(1));else fn=parseInt(fk);
  var fd=s.progress[bi][fk]||{};
  var allDone=true,cnt=0;
  for(var u in fd){cnt++;if(fd[u]!=='complete')allDone=false;}
  if(!allDone||cnt!==bl.units)return;
  d.procRules.forEach(function(r){
    if(r.siteId===si&&r.active&&r.condFloor===fn){
      var exists=false;
      d.alerts.forEach(function(a){if(a.siteId===si&&a.ruleId===r.id)exists=true;});
      if(!exists){
        d.alerts.unshift({id:'a'+Date.now(),siteId:si,ruleId:r.id,material:r.material,message:bl.name+' '+fk+' 전체완료 - '+r.material+' 발주필요',type:'urgent',date:new Date().toISOString().split('T')[0],read:false});
        sDB(d);updBdg();toast(r.material+' 발주알림','warning');
      }
    }
  });
  sDB(d);
}

// ===== Excel 입출력 =====
function dlExcel(){
  if(typeof XLSX==='undefined'){toast('엑셀: 인터넷 연결 필요','error');return;}
  var d=gDB(),si=document.getElementById('prS').value,bi=document.getElementById('prB').value,s=d.sites[si];
  if(!s)return;
  var blds=bi&&bi!=='all'?s.buildings.filter(function(b){return b.id===bi;}):s.buildings;
  var wb=XLSX.utils.book_new();
  blds.forEach(function(bl){
    var pr=s.progress[bl.id]||{},rows=[];
    var uH=[];for(var i=1;i<=bl.units;i++)uH.push(i+'호');
    rows.push(['층'].concat(uH));
    for(var f=bl.floors;f>=1;f--){var fk=f+'F',fd=pr[fk]||{};rows.push([fk].concat(uH.map(function(u){return SL[fd[u]||'pending'];})));}
    for(var b=1;b<=bl.basement;b++){var fk2='B'+b,fd2=pr[fk2]||{};rows.push([fk2].concat(uH.map(function(u){return SL[fd2[u]||'pending'];})));}
    XLSX.utils.book_append_sheet(wb,XLSX.utils.aoa_to_sheet(rows),bl.name);
  });
  XLSX.writeFile(wb,'시공현황_'+s.name+'.xlsx');toast('다운로드 완료','success');
}
function ulExcel(ev){
  if(typeof XLSX==='undefined'){toast('엑셀: 인터넷 연결 필요','error');ev.target.value='';return;}
  var f=ev.target.files[0];if(!f)return;
  var rd=new FileReader();
  rd.onload=function(e){
    try{
      var wb=XLSX.read(new Uint8Array(e.target.result),{type:'array'});
      var d=gDB(),si=document.getElementById('prS').value,s=d.sites[si];if(!s)return;
      var rm={'준비중':'pending','시공중':'inprogress','시공완료':'complete'};
      wb.SheetNames.forEach(function(sn){
        var bl=null;s.buildings.forEach(function(b){if(b.name===sn)bl=b;});if(!bl)return;
        var rows=XLSX.utils.sheet_to_json(wb.Sheets[sn],{header:1});if(rows.length<2)return;
        var hd=rows[0];if(!s.progress[bl.id])s.progress[bl.id]={};
        for(var i=1;i<rows.length;i++){
          var rw=rows[i],fk=rw[0];if(!fk)continue;
          if(!s.progress[bl.id][fk])s.progress[bl.id][fk]={};
          for(var j=1;j<hd.length;j++){var u=hd[j],v=(rw[j]||'').toString().trim();s.progress[bl.id][fk][u]=rm[v]||'pending';}
        }
      });
      sDB(d);addHist('엑셀 업로드',s.name);rPT();toast('반영 완료','success');
    }catch(er){toast('오류: '+er.message,'error');}
  };
  rd.readAsArrayBuffer(f);ev.target.value='';
}

// ===== 동 설정 =====
function rBC(){
  var d=gDB(),si=document.getElementById('cfS').value;
  if(si&&typeof _loadedSites!=='undefined'&&!_loadedSites.has(si)&&typeof loadSiteData==='function'){var blEl=document.getElementById('BL');if(blEl)blEl.innerHTML='<div style="text-align:center;padding:40px;color:var(--t3)">⏳ 현장 데이터 로딩 중...</div>';loadSiteData(si).then(rBC);return;}
  var s=d.sites[si];if(!s)return;
  var header='<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;gap:6px;flex-wrap:wrap">'
    +'<span style="font-size:10px;color:var(--t3)">'+s.buildings.length+'개 동 (최대50)</span>'
    +(s.buildings.length>1?'<button class="btn bx bo" onclick="autoLayoutBuildings(\''+esc(si)+'\')" title="모든 동을 그리드로 재배치">⚏ 자동 배치</button>':'')
    +'</div>';
  document.getElementById('BCL').innerHTML=header+'<div class="gr g3">'+s.buildings.map(function(b){
    return '<div class="cd" style="margin:0"><div style="display:flex;align-items:center;gap:6px;margin-bottom:8px"><span style="font-size:20px">'+esc(TI[b.type]||'')+'</span><div><div style="font-size:13px;font-weight:700">'+esc(b.name)+'</div><div style="font-size:10px;color:var(--t3)">'+esc(TN[b.type]||'')+'</div></div><button class="btn bx bd" style="margin-left:auto" onclick="delB(\''+esc(si)+'\',\''+esc(b.id)+'\')">삭제</button></div><div style="display:grid;grid-template-columns:repeat(3,1fr);gap:4px;font-size:10px"><div><span style="color:var(--t3)">지하</span><br><strong>'+b.basement+'</strong></div><div><span style="color:var(--t3)">지상</span><br><strong>'+b.floors+'</strong></div><div><span style="color:var(--t3)">호수</span><br><strong>'+b.units+'</strong></div></div></div>';
  }).join('')+'</div>';
}
function selBT(el){
  var cards=document.querySelectorAll('.btc');
  for(var i=0;i<cards.length;i++)cards[i].classList.remove('selected');
  el.classList.add('selected');SBT=el.getAttribute('data-t');
}
function openAddB(){
  var d=gDB(),si=document.getElementById('cfS').value,s=d.sites[si];
  if(s&&s.buildings.length>=50){toast('최대 50개','warning');return;}
  oM('mAddB');
}
// 겹치지 않는 기본 위치 계산: 기존 동들이 점유한 그리드 셀을 피해 다음 빈 칸 반환
function nextFreeSlot(s){
  var GRID=30; // 셀 크기 (m). 25~50세대 동 하나가 충분히 들어가는 크기.
  var COLS=5;  // 한 행에 5동까지. 그 이상은 다음 행.
  var taken={};
  s.buildings.forEach(function(b){
    var gx=Math.round((b.posX||0)/GRID), gz=Math.round((b.posZ||0)/GRID);
    taken[gx+','+gz]=true;
  });
  // 중앙부터 바깥쪽으로 빈 슬롯 탐색
  for(var i=0;i<100;i++){
    var col=i%COLS, row=Math.floor(i/COLS);
    var gx=col-Math.floor(COLS/2), gz=row;
    if(!taken[gx+','+gz])return {x:gx*GRID, z:gz*GRID};
  }
  return {x:0,z:0};
}

// 기존 동 전체를 그리드로 재배치 (사용자가 수동 위치를 건드리지 않았을 때 유용)
function autoLayoutBuildings(si){
  var d=gDB(),s=d.sites[si];if(!s||!s.buildings.length)return;
  if(!confirm(s.buildings.length+'개 동을 그리드로 재배치합니다.\n기존 X/Z 위치는 덮어씁니다. 계속할까요?'))return;
  var GRID=30,COLS=5;
  s.buildings.forEach(function(b,i){
    var col=i%COLS, row=Math.floor(i/COLS);
    b.posX=(col-Math.floor(COLS/2))*GRID;
    b.posZ=row*GRID;
  });
  sDB(d);addHist('배치 재정렬',s.name+' '+s.buildings.length+'개 동');
  rBC();toast('자동 배치 완료','success');
}

function addB(){
  var d=gDB(),si=document.getElementById('cfS').value,s=d.sites[si];if(!s)return;
  var nm=document.getElementById('nBN').value.trim(),name=document.getElementById('nBNm').value.trim();
  var bm=Math.min(10,Math.max(0,parseInt(document.getElementById('nBBm').value)||0));
  var fl=Math.min(50,Math.max(1,parseInt(document.getElementById('nBF').value)||1));
  var un=Math.min(6,Math.max(1,parseInt(document.getElementById('nBU').value)||1));
  var px=parseInt(document.getElementById('nBX').value)||0;
  var pz=parseInt(document.getElementById('nBZ').value)||0;
  var rot=parseInt(document.getElementById('nBRot').value)||0;
  if(!nm||!name){toast('번호와 이름 입력','error');return;}

  // 사용자가 위치를 기본값(0,0) 그대로 뒀고 그 자리가 이미 점유됐으면 자동 분산
  if(px===0&&pz===0){
    var conflict=s.buildings.some(function(b){
      return (b.posX||0)===0 && (b.posZ||0)===0;
    });
    if(conflict){
      var slot=nextFreeSlot(s);
      px=slot.x;pz=slot.z;
    }
  }

  var id='b'+Date.now();
  s.buildings.push({id:id,number:nm,name:name,type:SBT,basement:bm,floors:fl,units:un,posX:px,posZ:pz,rot:rot});
  s.progress[id]={};
  for(var f=-bm;f<=fl;f++){
    if(!f)continue;
    var fk=f<0?'B'+Math.abs(f):f+'F';
    s.progress[id][fk]={};
    for(var u=1;u<=un;u++)s.progress[id][fk][u+'호']='pending';
  }
  sDB(d);addHist('동 추가',s.name+' '+name);cM('mAddB');popSel(true);rBC();toast(name+' 추가','success');
}
function delB(si,bi){
  if(!confirm('삭제?'))return;
  var d=gDB(),s=d.sites[si];var bn='';
  s.buildings=s.buildings.filter(function(b){if(b.id===bi){bn=b.name;return false;}return true;});
  delete s.progress[bi];
  sDB(d);addHist('동 삭제',bn);popSel(true);rBC();toast('삭제','info');
}

// ===== 발주 =====
function rAlerts(){
  var d=gDB(),ss=gUS().map(function(s){return s.id;});
  var als=d.alerts.filter(function(a){return ss.indexOf(a.siteId)>=0;});
  document.getElementById('PAL').innerHTML=als.length?als.map(function(a){
    return '<div class="ac '+esc(a.type)+'"><div style="font-size:16px">'+(a.type==='urgent'?'🔴':'🔵')+'</div><div style="flex:1"><div style="font-size:12px;font-weight:600">'+esc(a.material)+' - '+esc(d.sites[a.siteId]?d.sites[a.siteId].name:'')+'</div><div style="font-size:10px;color:var(--t3)">'+esc(a.message)+'</div></div><div style="display:flex;gap:4px;flex-shrink:0">'+(!a.read?'<button class="btn bx bo" onclick="markR(\''+esc(a.id)+'\')">확인</button>':'')+'<button class="btn bx bg" onclick="createOrd(\''+esc(a.id)+'\')">발주</button></div></div>';
  }).join(''):emptyState('발주 알림이 없어요~');
}
function markR(id){var d=gDB();d.alerts.forEach(function(a){if(a.id===id)a.read=true;});sDB(d);updBdg();rAlerts();}
function createOrd(id){
  var d=gDB();var a=null;
  d.alerts.forEach(function(x){if(x.id===id)a=x;});if(!a)return;
  d.procOrders.push({id:'o'+Date.now(),siteId:a.siteId,material:a.material,orderDate:new Date().toISOString().split('T')[0],status:'ready',manager:CU.id,note:a.message});
  a.read=true;sDB(d);updBdg();addHist('발주 시작',a.material);toast(a.material+' 발주준비','success');rAlerts();
}

function rPS(){
  var d=gDB(),si=document.getElementById('psS').value;
  var rs=d.procRules.filter(function(r){return r.siteId===si;});
  document.getElementById('PSB').innerHTML=rs.map(function(r){
    return '<tr><td style="font-weight:600">'+esc(r.material)+'</td><td>'+r.condFloor+'층</td><td>'+r.lead+'일</td><td>'+(r.target==='all'?'전체':r.target==='admin'?'관리자':'현장담당')+'</td><td><span class="st '+(r.active?'stc':'stp')+'">'+(r.active?'활성':'비활성')+'</span></td><td><button class="btn bx bo" onclick="tgRule(\''+esc(r.id)+'\')">'+(r.active?'OFF':'ON')+'</button> <button class="btn bx bd" onclick="delRule(\''+esc(r.id)+'\')">삭제</button></td></tr>';
  }).join('')||'<tr><td colspan="6">'+emptyState('규칙을 추가해보세요')+'</td></tr>';
}
function openAddRule(){oM('mAddR');}
function addRule(){
  var d=gDB(),si=document.getElementById('psS').value;
  var mt=document.getElementById('nRM').value.trim();
  var fl=parseInt(document.getElementById('nRF').value);
  var lt=parseInt(document.getElementById('nRL').value);
  var tg=document.getElementById('nRT').value;
  if(!mt||!fl||!lt){toast('필수 입력','error');return;}
  d.procRules.push({id:'r'+Date.now(),siteId:si,material:mt,condFloor:fl,lead:lt,target:tg,active:true});
  sDB(d);addHist('규칙 추가',mt);cM('mAddR');rPS();toast('추가','success');
}
function tgRule(id){var d=gDB();d.procRules.forEach(function(r){if(r.id===id)r.active=!r.active;});sDB(d);rPS();}
function delRule(id){if(!confirm('삭제?'))return;var d=gDB();d.procRules=d.procRules.filter(function(r){return r.id!==id;});sDB(d);rPS();}

function rPStat(){
  var d=gDB(),ss=gUS().map(function(s){return s.id;});
  var ords=d.procOrders.filter(function(o){return ss.indexOf(o.siteId)>=0;});
  var users=d.users||[];
  var total=ords.length;
  var totalPages=Math.max(1,Math.ceil(total/PSTAT_PER_PAGE));
  if(_pstatPage>=totalPages)_pstatPage=totalPages-1;
  var start=_pstatPage*PSTAT_PER_PAGE;
  var slice=ords.slice(start,start+PSTAT_PER_PAGE);
  document.getElementById('PST').innerHTML=slice.map(function(o){
    var s=d.sites[o.siteId];var ci=PS.indexOf(o.status);
    var u=null;users.forEach(function(x){if(x.id===o.manager)u=x;});
    return '<tr><td>'+esc(s?s.name:'')+'</td><td style="font-weight:600">'+esc(o.material)+'</td><td>'+esc(o.orderDate)+'</td><td><div class="pfl">'+PS.map(function(st,i){return '<span class="ps '+(i<ci?'done':i===ci?'active':'')+'">'+esc(PL[st]||'')+'</span>'+(i<PS.length-1?'<span class="pa">→</span>':'')+'';}).join('')+'</div></td><td>'+esc(u?u.name:o.manager)+'</td><td style="white-space:nowrap">'+(ci<PS.length-1?'<button class="btn bx bg" onclick="advOrd(\''+esc(o.id)+'\')">▶</button> ':'')+( ci>0?'<button class="btn bx bo" onclick="regOrd(\''+esc(o.id)+'\')">◀</button> ':'')+'<button class="btn bx bpu" onclick="editOrd(\''+esc(o.id)+'\')">✏️</button></td></tr>';
  }).join('')||'<tr><td colspan="6">'+emptyState('발주 내역이 없어요')+'</td></tr>';
  var pgEl=document.getElementById('pstatPager');
  if(!pgEl){pgEl=document.createElement('div');pgEl.id='pstatPager';var tw=document.querySelector('#pg-pstat .tw');if(tw&&tw.parentNode)tw.parentNode.insertBefore(pgEl,tw.nextSibling);}
  pgEl.innerHTML=total>PSTAT_PER_PAGE?'<div style="display:flex;align-items:center;justify-content:center;gap:8px;margin-top:10px;font-size:11px">'+(_pstatPage>0?'<button class="btn bx bo" onclick="_pstatPage--;rPStat()">◀ 이전</button>':'')+'<span style="color:var(--t3)">'+(_pstatPage+1)+'/'+totalPages+'페이지 (총 '+total+'건)</span>'+(_pstatPage<totalPages-1?'<button class="btn bx bo" onclick="_pstatPage++;rPStat()">다음 ▶</button>':'')+'</div>':''; 
}
function advOrd(id){var d=gDB();d.procOrders.forEach(function(o){if(o.id===id){var ci=PS.indexOf(o.status);if(ci<PS.length-1){o.status=PS[ci+1];addHist('발주',o.material+': '+PL[o.status]);}}});sDB(d);rPStat();toast('상태 변경','success');}
function regOrd(id){var d=gDB();d.procOrders.forEach(function(o){if(o.id===id){var ci=PS.indexOf(o.status);if(ci>0)o.status=PS[ci-1];}});sDB(d);rPStat();}
function editOrd(id){
  var d=gDB();
  d.procOrders.forEach(function(o){
    if(o.id===id){
      document.getElementById('oId').value=o.id;
      document.getElementById('oMat').value=o.material;
      document.getElementById('oDt').value=o.orderDate;
      document.getElementById('oSt').value=o.status;
      document.getElementById('oNt').value=o.note||'';
      oM('mOrd');
    }
  });
}
function saveOrd(){
  var d=gDB(),id=document.getElementById('oId').value;
  d.procOrders.forEach(function(o){
    if(o.id===id){
      o.material=document.getElementById('oMat').value.trim();
      o.orderDate=document.getElementById('oDt').value;
      o.status=document.getElementById('oSt').value;
      o.note=document.getElementById('oNt').value.trim();
      addHist('발주 수정',o.material);
    }
  });
  sDB(d);cM('mOrd');rPStat();toast('수정','success');
}
function delOrd(){if(!confirm('삭제?'))return;var d=gDB(),id=document.getElementById('oId').value;d.procOrders=d.procOrders.filter(function(o){return o.id!==id;});sDB(d);cM('mOrd');rPStat();}

// ===== 공장검수 =====
function rInsp(){
  var d=gDB(),si=document.getElementById('isS')?document.getElementById('isS').value:'';
  if(si&&typeof _loadedSites!=='undefined'&&!_loadedSites.has(si)&&typeof loadSiteData==='function'){var ilEl=document.getElementById('IL');if(ilEl)ilEl.innerHTML='<div style="text-align:center;padding:40px;color:var(--t3)">⏳ 현장 데이터 로딩 중...</div>';loadSiteData(si).then(rInsp);return;}
  var its=d.inspections.filter(function(i){return i.siteId===si;});
  var fac=its.filter(function(i){return i.category==='factory';});
  var tst=its.filter(function(i){return i.category==='test';});
  document.getElementById('IL').innerHTML='<h3 style="font-size:12px;color:var(--cyan);margin-bottom:8px">공장검수 ('+fac.length+'건)</h3>'+(fac.length?fac.map(rIC).join(''):emptyState('공장검수 항목이 없어요'))+'<h3 style="font-size:12px;color:var(--purple);margin:16px 0 8px">테스트 ('+tst.length+'건)</h3>'+(tst.length?tst.map(rIC).join(''):emptyState('테스트 항목이 없어요'));
}
function rIC(i){
  return '<div class="ic"><div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;flex-wrap:wrap;gap:4px"><div style="font-size:13px;font-weight:700">'+(ISI[i.status]||'')+' '+esc(i.name)+'</div><div style="display:flex;gap:4px;align-items:center"><span class="isb '+esc(i.status)+'">'+esc(ISL[i.status]||'')+'</span><button class="btn bx bo" onclick="editInsp(\''+esc(i.id)+'\')">수정</button><button class="btn bx bd" onclick="delInsp(\''+esc(i.id)+'\')">삭제</button></div></div><div class="im"><div><div style="color:var(--t3);font-size:9px">대상</div><div style="font-weight:500">'+esc(i.target||'-')+'</div></div><div><div style="color:var(--t3);font-size:9px">업체</div><div style="font-weight:500">'+esc(i.vendor||'-')+'</div></div><div><div style="color:var(--t3);font-size:9px">예정일</div><div style="font-weight:500">'+esc(i.date||'-')+'</div></div><div><div style="color:var(--t3);font-size:9px">담당</div><div style="font-weight:500">'+esc(i.manager||'-')+'</div></div>'+(i.note?'<div style="grid-column:1/-1"><div style="color:var(--t3);font-size:9px">비고</div><div style="font-weight:500;white-space:pre-wrap">'+esc(i.note)+'</div></div>':'')+'</div></div>';
}
function openAddInsp(){
  document.getElementById('mIT').textContent='검수 추가';
  document.getElementById('iEid').value='';
  ['iNm','iTgt','iVen','iMgr','iLoc','iNt'].forEach(function(id){document.getElementById(id).value='';});
  document.getElementById('iDt').value='';
  document.getElementById('iCat').value='factory';
  document.getElementById('iSt').value='scheduled';
  oM('mInsp');
}
function editInsp(id){
  var d=gDB();
  d.inspections.forEach(function(i){
    if(i.id===id){
      document.getElementById('mIT').textContent='검수 수정';
      document.getElementById('iEid').value=i.id;
      document.getElementById('iNm').value=i.name;
      document.getElementById('iCat').value=i.category;
      document.getElementById('iTgt').value=i.target||'';
      document.getElementById('iVen').value=i.vendor||'';
      document.getElementById('iDt').value=i.date||'';
      document.getElementById('iSt').value=i.status;
      document.getElementById('iMgr').value=i.manager||'';
      document.getElementById('iLoc').value=i.location||'';
      document.getElementById('iNt').value=i.note||'';
      oM('mInsp');
    }
  });
}
function saveInsp(){
  var d=gDB(),si=document.getElementById('isS')?document.getElementById('isS').value:'';
  var eid=document.getElementById('iEid').value;
  var dt={
    name:document.getElementById('iNm').value.trim(),
    category:document.getElementById('iCat').value,
    target:document.getElementById('iTgt').value.trim(),
    vendor:document.getElementById('iVen').value.trim(),
    date:document.getElementById('iDt').value,
    status:document.getElementById('iSt').value,
    manager:document.getElementById('iMgr').value.trim(),
    location:document.getElementById('iLoc').value.trim(),
    note:document.getElementById('iNt').value.trim()
  };
  if(!dt.name){toast('검수명 입력','error');return;}
  if(eid){
    d.inspections.forEach(function(i){
      if(i.id===eid){for(var k in dt)i[k]=dt[k];i.uAt=new Date().toLocaleString('ko-KR');}
    });
    addHist('검수 수정',dt.name);
  }else{
    dt.id='i'+Date.now();dt.siteId=si;dt.uAt=new Date().toLocaleString('ko-KR');
    d.inspections.push(dt);addHist('검수 추가',dt.name);
  }
  sDB(d);cM('mInsp');rInsp();toast(eid?'수정':'추가','success');
}
function delInsp(id){if(!confirm('삭제?'))return;var d=gDB();d.inspections=d.inspections.filter(function(x){return x.id!==id;});sDB(d);rInsp();toast('삭제','info');}

// ===== 현장 관리 (관리자) =====
function rSites(){
  if(CU.role!=='admin')return;
  var d=gDB();var siteList=[];for(var k in d.sites)siteList.push(d.sites[k]);
  document.getElementById('siteCount').textContent='('+siteList.length+'/'+MAX_SITES+' 현장)';
  if(!siteList.length){document.getElementById('SML').innerHTML=emptyState('현장을 추가해보세요');return;}
  document.getElementById('SML').innerHTML='<div class="gr g2">'+siteList.map(function(s){
    var bCnt=s.buildings?s.buildings.length:0;var prog=gProg(s.id);
    var mgrs=(d.users||[]).filter(function(u){return u.role==='manager'&&u.sites.indexOf(s.id)>=0;});
    return '<div class="cd" style="margin:0"><div style="display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:10px"><div><div style="font-size:14px;font-weight:700">'+esc(s.name)+'</div><div style="font-size:11px;color:var(--t3);margin-top:2px">'+esc(s.info.projectName||'-')+'</div></div><div style="display:flex;gap:4px"><button class="btn bx bpu" onclick="editSite(\''+esc(s.id)+'\')">수정</button><button class="btn bx bd" onclick="delSite(\''+esc(s.id)+'\')">삭제</button></div></div>'
      +'<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;font-size:11px;margin-bottom:8px">'
      +'<div><span style="color:var(--t3);font-size:9px">위치</span><br>'+esc((s.info.location||'-').substring(0,15))+'</div>'
      +'<div><span style="color:var(--t3);font-size:9px">동수</span><br><strong>'+bCnt+'</strong>개</div>'
      +'<div><span style="color:var(--t3);font-size:9px">담당자</span><br><strong>'+mgrs.length+'</strong>명</div></div>'
      +'<div style="display:flex;align-items:center;gap:6px"><div class="pb" style="flex:1"><div class="pf blue" style="width:'+prog+'%"></div></div><span style="font-size:10px;color:var(--blue)">'+prog+'%</span></div>'
      +'<div style="margin-top:6px;font-size:9px;color:var(--t3)">담당: '+(mgrs.length?esc(mgrs.map(function(m){return m.name;}).join(', ')):'미배정')+'</div>'
      +'</div>';
  }).join('')+'</div>';
}

function openAddSite(){
  if(CU.role!=='admin')return;
  var d=gDB();var cnt=0;for(var k in d.sites)cnt++;
  if(cnt>=MAX_SITES){toast('최대 '+MAX_SITES+'개까지 생성 가능','warning');return;}
  document.getElementById('mSiteTitle').textContent='현장 추가';
  document.getElementById('nsEditId').value='';
  var fields=['nsName','nsProject','nsLocation','nsStructure','nsLat','nsLng','nsOwner','nsContractor','nsSupervisor','nsHouseholds','nsTotalArea','nsBuildArea','nsStart','nsEnd'];
  for(var i=0;i<fields.length;i++){var el=document.getElementById(fields[i]);if(el)el.value='';}
  oM('mAddSite');
}

function editSite(si){
  if(CU.role!=='admin')return;
  var d=gDB(),s=d.sites[si];if(!s)return;
  document.getElementById('mSiteTitle').textContent='현장 수정';
  document.getElementById('nsEditId').value=si;
  document.getElementById('nsName').value=s.name||'';
  document.getElementById('nsProject').value=s.info.projectName||'';
  document.getElementById('nsLocation').value=s.info.location||'';
  document.getElementById('nsStructure').value=s.info.structure||'';
  document.getElementById('nsLat').value=s.info.lat||'';
  document.getElementById('nsLng').value=s.info.lng||'';
  document.getElementById('nsOwner').value=s.info.owner||'';
  document.getElementById('nsContractor').value=s.info.contractor||'';
  document.getElementById('nsSupervisor').value=s.info.supervisor||'';
  document.getElementById('nsHouseholds').value=s.info.households||'';
  document.getElementById('nsTotalArea').value=s.info.totalArea||'';
  document.getElementById('nsBuildArea').value=s.info.buildingArea||'';
  document.getElementById('nsStart').value=s.info.startDate||'';
  document.getElementById('nsEnd').value=s.info.endDate||'';
  oM('mAddSite');
}

function saveSite(){
  if(CU.role!=='admin')return;
  var name=document.getElementById('nsName').value.trim();
  if(!name){toast('현장명을 입력하세요','error');return;}
  var d=gDB();var editId=document.getElementById('nsEditId').value;
  var info={
    projectName:document.getElementById('nsProject').value.trim(),
    location:document.getElementById('nsLocation').value.trim(),
    lat:parseFloat(document.getElementById('nsLat').value)||0,
    lng:parseFloat(document.getElementById('nsLng').value)||0,
    owner:document.getElementById('nsOwner').value.trim(),
    contractor:document.getElementById('nsContractor').value.trim(),
    supervisor:document.getElementById('nsSupervisor').value.trim(),
    households:document.getElementById('nsHouseholds').value.trim(),
    totalArea:document.getElementById('nsTotalArea').value.trim(),
    buildingArea:document.getElementById('nsBuildArea').value.trim(),
    startDate:document.getElementById('nsStart').value,
    endDate:document.getElementById('nsEnd').value,
    structure:document.getElementById('nsStructure').value.trim(),
    floors:''
  };
  if(editId){
    if(!d.sites[editId])return;
    d.sites[editId].name=name;d.sites[editId].info=info;
    addHist('현장 수정',name);
  }else{
    var cnt=0;for(var k in d.sites)cnt++;
    if(cnt>=MAX_SITES){toast('최대 '+MAX_SITES+'개','warning');return;}
    var newId='site'+Date.now();
    d.sites[newId]={id:newId,name:name,info:info,buildings:[],progress:{}};
    addHist('현장 생성',name);
  }
  sDB(d);cM('mAddSite');popSel(true);rSites();
  toast(editId?'현장 수정 완료':'현장 생성 완료','success');
}

function delSite(si){
  if(CU.role!=='admin')return;
  var d=gDB(),s=d.sites[si];if(!s)return;
  if(!confirm(s.name+' 현장을 삭제하시겠습니까?\n모든 동, 시공현황, 발주, 검수 데이터가 삭제됩니다.'))return;
  var sname=s.name;
  delete d.sites[si];
  d.procRules=d.procRules.filter(function(r){return r.siteId!==si;});
  d.procOrders=d.procOrders.filter(function(o){return o.siteId!==si;});
  d.alerts=d.alerts.filter(function(a){return a.siteId!==si;});
  d.inspections=d.inspections.filter(function(i){return i.siteId!==si;});
  if(d.users)d.users.forEach(function(u){if(u.sites){u.sites=u.sites.filter(function(x){return x!==si;});}});
  sDB(d);addHist('현장 삭제',sname);popSel(true);rSites();toast(sname+' 삭제됨','info');
}

// ===== 사용자 관리 =====
function rUsers(){
  if(CU.role!=='admin')return;
  var d=gDB();
  if(USE_CLOUD&&FB_DB&&CU_ORG_ID){
    document.getElementById('UML').innerHTML='<div id="pendingArea"></div>'
      +'<div id="adminInfoArea"></div>'
      +'<div class="tw" id="cloudUserTable"><div style="text-align:center;padding:20px;color:var(--t3)">사용자 로딩...</div></div>'
      +'<div style="margin-top:12px;padding:12px;background:rgba(59,130,246,.06);border:1px solid var(--b1);border-radius:var(--rs);font-size:11px;color:var(--t2);line-height:1.7">'
      +'<div style="font-weight:600;margin-bottom:4px;color:var(--cyan)">권한 안내</div>'
      +'• <span style="color:#fbbf24">👑 메인관리자</span>: 모든 권한, 다른 관리자 등급 변경 가능<br>'
      +'• <span style="color:var(--blue)">관리자</span>: 가입 승인, 현장담당 지정 (최대 4명, 메인관리자 포함 총 5명)<br>'
      +'• <span style="color:var(--green)">현장담당</span>: 배정된 현장만 접근</div>';
    FB_DB.collection('users').where('orgId','==',CU_ORG_ID).get().then(function(snap){
      var users=snap.docs.map(function(doc){var x=doc.data();x.id=doc.id;return x;});
      var pending=users.filter(function(u){return u.status==='pending';});
      var active=users.filter(function(u){return u.status!=='pending';});
      var adminCount=active.filter(function(u){return u.role==='admin';}).length;
      var ADMIN_MAX=5;
      var meIsMain=active.some(function(u){return u.id===FB_USER.uid&&u.isMainAdmin===true;});

      // 관리자 한도 안내 카드
      var infoArea=document.getElementById('adminInfoArea');
      var slotColor=adminCount>=ADMIN_MAX?'var(--red)':adminCount>=4?'var(--amber)':'var(--green)';
      infoArea.innerHTML='<div style="padding:12px 14px;background:linear-gradient(135deg,rgba(59,130,246,.06),rgba(6,182,212,.04));border:1px solid var(--b1);border-radius:var(--r);margin-bottom:12px;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px">'
        +'<div><div style="font-size:12px;font-weight:700;color:var(--cyan)">관리자 슬롯</div>'
        +'<div style="font-size:10px;color:var(--t3);margin-top:2px">메인관리자 1명 + 일반 관리자 최대 4명</div></div>'
        +'<div style="font-family:monospace;font-size:18px;font-weight:900;color:'+slotColor+'">'+adminCount+' / '+ADMIN_MAX+'</div></div>';

      // 승인 대기 카드 섹션
      var pendingArea=document.getElementById('pendingArea');
      if(pending.length){
        pendingArea.innerHTML='<div style="background:linear-gradient(135deg,rgba(245,158,11,.08),rgba(239,68,68,.06));border:1px solid var(--amber);border-radius:var(--r);padding:14px;margin-bottom:14px">'
          +'<div style="font-size:13px;font-weight:700;color:var(--amber);margin-bottom:10px">⏳ 가입 승인 대기 ('+pending.length+'명)</div>'
          +'<div class="gr g2">'+pending.map(function(u){
            return '<div style="background:var(--bg1);border:1px solid var(--b1);border-radius:var(--rs);padding:10px">'
              +'<div style="margin-bottom:8px"><div style="font-size:13px;font-weight:700">'+esc(u.name)+'</div>'
              +'<div style="font-size:10px;color:var(--t3);margin-top:2px">'+esc(u.email||'-')+'</div></div>'
              +'<div style="display:flex;gap:4px"><button class="btn bx bg" style="flex:1" onclick="editUserSites(this.dataset.uid)" data-uid="'+esc(u.id)+'">✓ 승인 + 현장 배정</button>'
              +'<button class="btn bx bd" onclick="rejectPendingUser(this.dataset.uid,this.dataset.name)" data-uid="'+esc(u.id)+'" data-name="'+esc(u.name)+'">거절</button></div></div>';
          }).join('')+'</div></div>';
      }else{
        pendingArea.innerHTML='';
      }

      // 활성 사용자 테이블
      // - mainAdmin: 누구도 등급 변경 불가
      // - admin: 메인관리자만 등급 변경 가능 (다른 admin은 못 함)
      // - manager: 모든 admin이 등급 변경 가능 (단, admin 슬롯 여유 있을 때만 admin 승격)
      document.getElementById('cloudUserTable').innerHTML='<div style="font-size:11px;color:var(--t3);margin-bottom:6px">활성 사용자 ('+active.length+'명)</div>'
        +'<table><thead><tr><th>이름</th><th>역할</th><th>배정 현장</th><th>관리</th></tr></thead><tbody>'
        +active.map(function(u){
          var isMe=u.id===FB_USER.uid;
          var isMain=u.isMainAdmin===true;
          var siteNames=[];
          if(u.role==='admin')siteNames=['전체 현장'];
          else if(u.sites)u.sites.forEach(function(si){var s=d.sites[si];if(s)siteNames.push(s.name);});
          // 등급 변경 권한 판정
          // 1) 메인관리자(본인) 등급 변경: 절대 불가
          // 2) 다른 admin 변경: 메인관리자만 가능
          // 3) manager 변경: 모든 admin 가능 (단, admin 승격은 슬롯 여유 있을 때)
          var canChangeRole=false;
          if(!isMain){
            if(u.role==='admin') canChangeRole=meIsMain; // 메인관리자만 admin 강등 가능
            else canChangeRole=true; // manager는 누구나 변경 가능
          }
          var adminFull=adminCount>=ADMIN_MAX&&u.role!=='admin';
          var nameCell='<span style="font-weight:600">'+esc(u.name)+'</span>'
            +(isMain?' <span title="메인관리자" style="font-size:11px">👑</span>':'')
            +(isMe?' <span style="font-size:9px;color:var(--cyan)">(나)</span>':'');
          var roleCell;
          if(isMain){
            roleCell='<span class="st stc" style="font-size:10px;background:linear-gradient(135deg,#f59e0b,#ef4444);color:#fff;padding:3px 8px;border-radius:4px;font-weight:700">👑 메인관리자</span>';
          }else if(canChangeRole){
            roleCell='<select onchange="changeUserRole(this.dataset.uid,this.value)" data-uid="'+esc(u.id)+'" style="padding:4px 8px;background:var(--bg1);border:1px solid var(--b1);color:var(--t1);border-radius:4px;font-size:11px">'
              +'<option value="admin"'+(u.role==='admin'?' selected':'')+(adminFull?' disabled':'')+'>관리자'+(adminFull?' (한도)':'')+'</option>'
              +'<option value="manager"'+(u.role==='manager'?' selected':'')+'>현장담당</option></select>';
          }else{
            // 일반 admin이 다른 admin을 본 경우 — 변경 불가, 표시만
            roleCell='<span class="st stc" style="font-size:10px;color:var(--blue);font-weight:600">관리자 🔒</span>'
              +'<div style="font-size:9px;color:var(--t3);margin-top:2px">메인관리자만 변경 가능</div>';
          }
          return '<tr><td>'+nameCell+'</td><td>'+roleCell+'</td>'
            +'<td style="font-size:11px">'+(siteNames.length?esc(siteNames.join(', ')):'<span style="color:var(--amber)">미배정</span>')+'</td>'
            +'<td>'+(u.role==='manager'?'<button class="btn bx bpu" onclick="editUserSites(this.dataset.uid)" data-uid="'+esc(u.id)+'">현장배정</button>':'<span style="font-size:10px;color:var(--t3)">전체</span>')+'</td></tr>';
        }).join('')+'</tbody></table>';
    });
    return;
  }

  // pending 사용자 거절 (Firestore 사용자 문서 + Auth 계정 삭제는 관리자가 직접 Console에서)
  // 여기서는 status를 'rejected'로 표시
  // (전역 함수는 rejectPendingUser 아래 별도 정의)
  // 로컬 모드
  document.getElementById('UML').innerHTML='<div class="tw"><table><thead><tr><th>이름</th><th>아이디</th><th>역할</th><th>배정 현장</th><th>관리</th></tr></thead><tbody>'
    +(d.users||[]).map(function(u){
      var assignedNames=[];
      if(u.role==='admin'){assignedNames=['전체 현장'];}
      else{u.sites.forEach(function(si){if(d.sites[si])assignedNames.push(d.sites[si].name);});}
      return '<tr><td style="font-weight:600">'+esc(u.name)+'</td><td style="font-size:11px;color:var(--t3)">'+esc(u.id)+'</td>'
        +'<td><span class="st '+(u.role==='admin'?'stc':'stp')+'" style="font-size:10px">'+(u.role==='admin'?'관리자':'현장담당')+'</span></td>'
        +'<td style="font-size:11px">'+(assignedNames.length?esc(assignedNames.join(', ')):'<span style="color:var(--red)">미배정</span>')+'</td>'
        +'<td>'+(u.role==='manager'?'<button class="btn bx bpu" onclick="editUserSites(this.dataset.uid)" data-uid="'+esc(u.id)+'">배정</button>':'<span style="font-size:10px;color:var(--t3)">-</span>')+'</td></tr>';
    }).join('')+'</tbody></table></div>';
}

function changeUserRole(userId,newRole){
  if(CU.role!=='admin')return;
  if(USE_CLOUD&&FB_DB){
    // 1) 대상 사용자 + 본인 + 조직 내 admin 수 확인
    Promise.all([
      FB_DB.collection('users').doc(userId).get(),
      FB_DB.collection('users').doc(FB_USER.uid).get(),
      FB_DB.collection('users').where('orgId','==',CU_ORG_ID).where('role','==','admin').get()
    ]).then(function(rs){
      var target=rs[0].exists?rs[0].data():null;
      var me=rs[1].exists?rs[1].data():null;
      var adminCount=rs[2].size;
      var ADMIN_MAX=5;
      if(!target){toast('사용자 로딩 실패','error');return;}
      // 메인관리자는 어떤 변경도 차단
      if(target.isMainAdmin===true){
        toast('메인관리자의 등급은 변경할 수 없습니다','error');rUsers();return;
      }
      // 일반 관리자 강등은 메인관리자만 가능
      if(target.role==='admin'&&newRole==='manager'){
        if(!(me&&me.isMainAdmin===true)){
          toast('관리자 강등은 메인관리자만 가능합니다','error');rUsers();return;
        }
      }
      // manager → admin 승격 시 슬롯 체크
      if(target.role!=='admin'&&newRole==='admin'){
        if(adminCount>=ADMIN_MAX){
          toast('관리자 슬롯이 가득 찼습니다 ('+adminCount+'/'+ADMIN_MAX+')','error');rUsers();return;
        }
      }
      // 통과 — 업데이트
      var update={role:newRole,sites:newRole==='admin'?['all']:[]};
      FB_DB.collection('users').doc(userId).update(update).then(function(){
        toast(newRole==='admin'?'관리자로 승격':'현장담당으로 변경','success');rUsers();
      }).catch(function(e){toast('역할 변경 실패: '+e.message,'error');});
    }).catch(function(e){toast('확인 실패: '+e.message,'error');});
  }else{
    var d=gDB();
    for(var i=0;i<d.users.length;i++){
      if(d.users[i].id===userId){d.users[i].role=newRole;if(newRole==='admin')d.users[i].sites=['all'];}
    }
    sDB(d);rUsers();
  }
}

function editUserSites(userId){
  if(CU.role!=='admin')return;
  if(USE_CLOUD&&FB_DB){
    FB_DB.collection('users').doc(userId).get().then(function(doc){
      if(!doc.exists){toast('사용자 로딩 실패','error');return;}
      var u=doc.data();u.id=doc.id;
      document.getElementById('ueUserId').value=userId;
      document.getElementById('ueUserName').textContent=u.name||'';
      var d=gDB();var allSites=[];for(var k in d.sites)allSites.push(d.sites[k]);
      var currentSites=u.sites||[];
      document.getElementById('ueSiteChecks').innerHTML=allSites.map(function(s){
        var checked=currentSites.indexOf(s.id)>=0;
        return '<label style="display:flex;align-items:center;gap:8px;padding:8px;margin-bottom:4px;background:var(--bg1);border-radius:6px;cursor:pointer;border:1px solid '+(checked?'var(--blue)':'var(--b1)')+'">'
          +'<input type="checkbox" value="'+esc(s.id)+'" '+(checked?'checked':'')+' style="width:16px;height:16px">'
          +'<div><div style="font-size:12px;font-weight:500">'+esc(s.name)+'</div>'
          +'<div style="font-size:10px;color:var(--t3)">'+esc(s.info.location||'위치 미설정')+'</div></div></label>';
      }).join('')||'<p style="color:var(--t3);font-size:11px">현장을 먼저 생성하세요</p>';
      oM('mUserEdit');
    });
  }else{
    var d=gDB();var u=null;
    for(var i=0;i<d.users.length;i++){if(d.users[i].id===userId){u=d.users[i];break;}}
    if(!u)return;
    document.getElementById('ueUserId').value=userId;
    document.getElementById('ueUserName').textContent=u.name+' ('+u.id+')';
    var allSites=[];for(var k in d.sites)allSites.push(d.sites[k]);
    var currentSites=u.sites||[];
    document.getElementById('ueSiteChecks').innerHTML=allSites.map(function(s){
      var checked=currentSites.indexOf(s.id)>=0;
      return '<label style="display:flex;align-items:center;gap:8px;padding:8px;margin-bottom:4px;background:var(--bg1);border-radius:6px;cursor:pointer;border:1px solid '+(checked?'var(--blue)':'var(--b1)')+'">'
        +'<input type="checkbox" value="'+esc(s.id)+'" '+(checked?'checked':'')+' style="width:16px;height:16px">'
        +'<div><div style="font-size:12px;font-weight:500">'+esc(s.name)+'</div>'
        +'<div style="font-size:10px;color:var(--t3)">'+esc(s.info.location||'위치 미설정')+'</div></div></label>';
    }).join('')||'<p style="color:var(--t3);font-size:11px">생성된 현장이 없습니다</p>';
    oM('mUserEdit');
  }
}

function saveUserSites(){
  if(CU.role!=='admin')return;
  var userId=document.getElementById('ueUserId').value;
  var checks=document.querySelectorAll('#ueSiteChecks input[type=checkbox]');
  var selected=[];for(var i=0;i<checks.length;i++){if(checks[i].checked)selected.push(checks[i].value);}
  if(USE_CLOUD&&FB_DB){
    // 사용자 문서를 가져와서 pending이면 status도 active로 전환
    FB_DB.collection('users').doc(userId).get().then(function(doc){
      var wasPending=doc.exists&&doc.data().status==='pending';
      var userName=doc.exists?doc.data().name:'';
      var update={sites:selected};
      if(wasPending){
        update.status='active';
        update.approvedAt=firebase.firestore.FieldValue.serverTimestamp();
        update.approvedBy=FB_USER.uid;
      }
      return FB_DB.collection('users').doc(userId).update(update).then(function(){
        // pending → active 전환 시 가입자에게 인앱 알림 + 관리자 알림 read 처리
        if(wasPending){
          // 가입자에게 알림
          FB_DB.collection('orgs/'+CU_ORG_ID+'/notifications').add({
            type:'approved',targetUid:userId,
            sites:selected,
            read:false,
            createdAt:firebase.firestore.FieldValue.serverTimestamp()
          }).catch(function(){});
          // 관리자가 본 newMember 알림 read 처리
          FB_DB.collection('orgs/'+CU_ORG_ID+'/notifications')
            .where('type','==','newMember').where('uid','==',userId).get().then(function(snap){
            snap.forEach(function(d){d.ref.update({read:true}).catch(function(){});});
          });
          toast('✅ '+userName+'님 승인 완료 ('+selected.length+'개 현장 배정)','success');
        }else{
          toast('현장 배정 완료 ('+selected.length+'개)','success');
        }
        cM('mUserEdit');rUsers();
      });
    }).catch(function(e){toast('배정 실패: '+e.message,'error');});
  }else{
    var d=gDB();
    for(var i2=0;i2<d.users.length;i2++){if(d.users[i2].id===userId){d.users[i2].sites=selected;break;}}
    sDB(d);cM('mUserEdit');addHist('담당자 배정',userId+': '+selected.length+'개 현장');rUsers();toast('배정 완료','success');
  }
}

// 가입 신청 거절 (status를 rejected로) — 클라이언트만 처리. Auth 계정은 콘솔에서 수동 삭제
function rejectPendingUser(userId,userName){
  if(CU.role!=='admin')return;
  if(!confirm('"'+userName+'"님의 가입 신청을 거절하시겠습니까?\n해당 사용자는 더 이상 로그인할 수 없습니다.\n(Auth 계정 완전 삭제는 Firebase Console에서 수동으로 진행)'))return;
  if(USE_CLOUD&&FB_DB){
    FB_DB.collection('users').doc(userId).update({
      status:'rejected',
      rejectedAt:firebase.firestore.FieldValue.serverTimestamp(),
      rejectedBy:FB_USER.uid
    }).then(function(){
      // newMember 알림 read 처리
      FB_DB.collection('orgs/'+CU_ORG_ID+'/notifications')
        .where('type','==','newMember').where('uid','==',userId).get().then(function(snap){
        snap.forEach(function(d){d.ref.update({read:true}).catch(function(){});});
      });
      toast(userName+'님 거절됨','info');rUsers();
    }).catch(function(e){toast('거절 실패: '+e.message,'error');});
  }
}

// ===== 수정이력 =====
function rHist(){
  var d=gDB();
  var items=d.editHistory||[];
  var total=items.length;
  var totalPages=Math.max(1,Math.ceil(total/HIST_PER_PAGE));
  if(_histPage>=totalPages)_histPage=totalPages-1;
  var start=_histPage*HIST_PER_PAGE;
  var slice=items.slice(start,start+HIST_PER_PAGE);
  var rows=slice.map(function(h){
    return '<div class="hi"><div style="width:6px;height:6px;border-radius:50%;background:var(--blue);margin-top:4px;flex-shrink:0"></div><div style="flex:1"><div><span style="color:var(--cyan);font-weight:500">'+esc(h.user)+'</span> - '+esc(h.action)+'</div><div style="color:var(--t3);margin-top:1px">'+esc(h.detail)+'</div><div style="color:var(--t3);font-size:9px">'+esc(h.time)+'</div></div></div>';
  }).join('')||emptyState('수정 이력이 없어요');
  var pager=total>HIST_PER_PAGE?'<div style="display:flex;align-items:center;justify-content:center;gap:8px;margin-top:10px;font-size:11px">'+(_histPage>0?'<button class="btn bx bo" onclick="_histPage--;rHist()">◀ 이전</button>':'')+'<span style="color:var(--t3)">'+(_histPage+1)+'/'+totalPages+'페이지 (총 '+total+'건)</span>'+(_histPage<totalPages-1?'<button class="btn bx bo" onclick="_histPage++;rHist()">다음 ▶</button>':'')+'</div>':'' ;
  document.getElementById('HL').innerHTML=rows+pager;
}
