export function initSettings() {
  const container = document.getElementById('view-settings');

  function renderView() {
    if (!container) return;

    container.innerHTML = `
      <div class="card" style="margin-bottom: 24px;">
        <div class="card-title"><i data-lucide="user"></i> 개인 정보 관리</div>
        <div class="grid grid-cols-2">
          <div class="input-group">
            <label class="label">이름</label>
            <input type="text" class="input" value="김태형">
          </div>
          <div class="input-group">
            <label class="label">이메일</label>
            <input type="email" class="input" value="admin@site-master.com" readonly>
          </div>
        </div>
        <button class="btn btn-secondary">비밀번호 변경</button>
      </div>

      <div class="card">
        <div class="card-title"><i data-lucide="users"></i> 팀 및 조직 설정</div>
        <div class="input-group">
          <label class="label">조직명</label>
          <input type="text" class="input" value="(주) 가온건설">
        </div>
        <div class="input-group">
          <label class="label">조직 코드</label>
          <div style="display: flex; gap: 8px;">
            <input type="text" class="input" value="GAON-2024-X9" readonly style="flex: 1;">
            <button class="btn btn-secondary">복사</button>
          </div>
          <p class="text-muted" style="font-size: 0.75rem; margin-top: 4px;">팀원이 가입할 때 이 코드를 사용합니다.</p>
        </div>
        <button class="btn btn-primary">조직 정보 저장</button>
      </div>
    `;

    if (window.lucide) {
      window.lucide.createIcons();
    }
  }

  renderView();
}
