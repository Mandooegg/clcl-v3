export function initNotifications() {
  const checkList = document.getElementById('check-items-list');
  const progressList = document.getElementById('build-progress-list');
  const alertsList = document.getElementById('recent-alerts-list');

  const checkItems = [
    { title: '수변전설비 단선결선도 최종 확정', site: '향동지구 A2블록 · KEC 322조', dday: 'D-4' },
    { title: '전기차충전설비 용량 계산서 제출', site: '향동지구 A2블록 · 송전조건 3항', dday: 'D-9' },
    { title: '통합배선 등급 확인 (Cat.6 이상)', site: '파주 운정 · 스마트건물인증 2등급', dday: 'D-14' },
    { title: '접지저항 측정성적서 제출', site: '파주 운정 · KEC 142조', dday: 'D-18' }
  ];

  const buildProgress = [
    { label: 'P0', value: 40 },
    { label: 'P1', value: 0 },
    { label: 'P2', value: 0 },
    { label: 'P3', value: 0 }
  ];

  const alerts = [
    { title: 'KEC 적용기준 확정 필요', desc: '향동지구 · 평가규정 적용여부 미확정', time: '오늘', color: 'var(--danger)' },
    { title: '승인조건 업데이트 필요', desc: '파주 운정 · 발주처 요건 변경 통보', time: '2일 전', color: 'var(--accent)' },
    { title: '검측요청서 생성 완료', desc: '녹번동 재개발 · 검측요청서 자동생성', time: '3일 전', color: 'var(--success)' }
  ];

  function renderView() {
    if (checkList) {
      checkList.innerHTML = checkItems.map(item => `
        <div class="list-item animate-fade">
          <div class="list-icon"><i data-lucide="zap" style="width: 14px; color: var(--primary);"></i></div>
          <div style="flex: 1;">
            <div style="font-size: 0.8125rem; font-weight: 700;">${item.title}</div>
            <div style="font-size: 0.7rem; color: var(--text-dim);">${item.site}</div>
          </div>
          <div class="badge badge-warning" style="font-size: 0.65rem; background: #fffbeb; border: none;">${item.dday}</div>
        </div>
      `).join('');
    }

    if (progressList) {
      progressList.innerHTML = buildProgress.map(p => `
        <div class="progress-item animate-fade">
          <div class="progress-header">
            <span>${p.label}</span>
            <span>${p.value > 0 ? p.value + '%' : '-'}</span>
          </div>
          <div class="progress-bar-bg">
            <div class="progress-bar-fill" style="width: ${p.value}%"></div>
          </div>
        </div>
      `).join('');
    }

    if (alertsList) {
      alertsList.innerHTML = alerts.map(a => `
        <div style="margin-bottom: 16px;" class="animate-fade">
          <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px;">
            <span class="status-indicator" style="background: ${a.color}"></span>
            <span style="font-size: 0.8125rem; font-weight: 700;">${a.title}</span>
            <span style="margin-left: auto; font-size: 0.7rem; color: var(--text-dim);">${a.time}</span>
          </div>
          <div style="font-size: 0.75rem; color: var(--text-muted); padding-left: 16px;">${a.desc}</div>
        </div>
      `).join('');
    }

    if (window.lucide) {
      window.lucide.createIcons();
    }
  }

  renderView();
}
