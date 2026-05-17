export function initRouter() {
  const navItems = document.querySelectorAll('.nav-item');
  const views = document.querySelectorAll('.view');
  const pageTitle = document.getElementById('current-page-title');
  const pageSubtitle = document.getElementById('page-subtitle');

  const titles = {
    'dashboard': '대시보드',
    'project-add': '현장 등록',
    'projects': '현장 목록',
    'project-overview': '현장 개요',
    'conditions': '사업승인조건',
    'notice': '공지사항',
    'v3d': '3D 시공현황',
    'prog': '시공현황(표)',
    'bldg': '동 설정',
    'alerts': '발주 알림',
    'pstat': '발주 현황',
    'pset': '발주 설정',
    'insp': '공장검수',
    'sites': '현장 생성/관리',
    'users': '담당자 배정',
    'hist': '수정이력',
    'settings': '설정'
  };

  function switchView(viewId) {
    // Update active state in sidebar
    navItems.forEach(i => {
      i.classList.toggle('active', i.getAttribute('data-view') === viewId);
    });

    // Toggle views
    views.forEach(v => {
      if (v.id === `view-${viewId}`) {
        v.classList.remove('hidden');
      } else {
        v.classList.add('hidden');
      }
    });

    // Update Header
    if (pageTitle) pageTitle.textContent = titles[viewId] || viewId;
    if (pageSubtitle) {
      if (viewId === 'dashboard') {
        pageSubtitle.textContent = '2025년 5월 11일 기준 · 전체 7개 현장';
      } else {
        pageSubtitle.textContent = `SITE-MASTER > ${titles[viewId] || viewId}`;
      }
    }

    // Legacy Bridge: Call original rendering functions
    const legacyFns = {
      dashboard: window.rDash,
      notice: window.rNotice,
      'project-overview': window.rInfo,
      v3d: window.init3D,
      prog: window.rPT,
      bldg: window.rBC,
      alerts: window.rAlerts,
      pset: window.rPS,
      pstat: window.rPStat,
      insp: window.rInsp,
      sites: window.rSites,
      users: window.rUsers,
      hist: window.rHist
    };

    if (legacyFns[viewId]) {
      try {
        legacyFns[viewId]();
      } catch (e) {
        console.error(`Legacy render error for ${viewId}:`, e);
      }
    }

    if (window.lucide) window.lucide.createIcons();
  }

  navItems.forEach(item => {
    item.addEventListener('click', () => {
      const targetView = item.getAttribute('data-view');
      if (targetView) switchView(targetView);
    });
  });

  // Initial View
  switchView('dashboard');
}
