export function initProjects() {
  const projectList = document.getElementById('recent-projects');
  const addBtn = document.getElementById('add-project-btn');

  // Mock Projects Data
  let projects = [
    {
      id: 1,
      type: '공동주택 · 500세대',
      name: '고양시 향동지구 A2블록',
      client: 'OO건설',
      manager: '김현장',
      approvalDate: '2024.03.15',
      startDate: '2024.06.01',
      status: '시공중',
      risks: { high: 1, mid: 3, low: 18 }
    },
    {
      id: 2,
      type: '업무시설 · 지식산업센터',
      name: '파주 운정 지식산업센터',
      client: '△△디벨로퍼',
      manager: '이담당',
      approvalDate: '2023.11.20',
      startDate: '2024.02.10',
      status: '검토중',
      risks: { high: 2, mid: 4, low: 11 }
    },
    {
      id: 3,
      type: '공동주택 · 350세대',
      name: '은평구 녹번동 주택재개발',
      client: '◇◇조합',
      manager: '박현장',
      approvalDate: '2025.01.08',
      startDate: '2024.04.15',
      status: '착공준비',
      risks: { high: 0, mid: 2, low: 22 }
    }
  ];

  function renderProjects() {
    if (!projectList) return;
    
    projectList.innerHTML = projects.map(p => `
      <div class="card project-card-h animate-fade">
        <div class="project-card-header">
          <div style="font-size: 0.65rem; color: var(--text-dim); font-weight: 600;">${p.type}</div>
          <button class="btn-ghost" style="padding: 0;"><i data-lucide="more-horizontal"></i></button>
        </div>
        <h4 style="font-size: 0.9375rem; font-weight: 800; margin-bottom: 4px;">${p.name}</h4>
        <div style="font-size: 0.75rem; color: var(--text-muted); margin-bottom: 12px;">발주처: ${p.client} · 담당: ${p.manager}</div>
        
        <div class="project-info-row">
          <div><span style="color: var(--text-dim);">승인</span> ${p.approvalDate}</div>
          <div><span style="color: var(--text-dim);">착공</span> ${p.startDate}</div>
          <span class="badge ${getStatusBadgeClass(p.status)}" style="margin-left: auto; font-size: 0.65rem;">${p.status}</span>
        </div>

        <div class="project-footer">
          <div style="display: flex; gap: 8px; font-size: 0.65rem; font-weight: 600;">
            <span style="display: flex; align-items: center; gap: 3px;"><span class="status-indicator" style="background: var(--danger);"></span> 고위험 ${p.risks.high}</span>
            <span style="display: flex; align-items: center; gap: 3px;"><span class="status-indicator" style="background: var(--accent);"></span> 중위험 ${p.risks.mid}</span>
            <span style="display: flex; align-items: center; gap: 3px;"><span class="status-indicator" style="background: var(--success);"></span> 저위험 ${p.risks.low}</span>
          </div>
          <a href="#" style="font-size: 0.7rem; font-weight: 700; color: var(--text-main);">검측요청서 →</a>
        </div>
      </div>
    `).join('');

    if (window.lucide) {
      window.lucide.createIcons();
    }
  }

  function getStatusBadgeClass(status) {
    switch (status) {
      case '시공중': return 'badge-success';
      case '검토중': return 'badge-warning';
      case '착공준비': return 'badge-info';
      default: return 'badge-secondary';
    }
  }

  if (addBtn) {
    addBtn.addEventListener('click', () => {
      alert('신규 현장 등록 모달이 표시됩니다.');
      // Logic for registration modal
    });
  }

  renderProjects();
}
