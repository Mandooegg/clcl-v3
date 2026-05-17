export function initConditions() {
  const container = document.getElementById('view-conditions');
  
  const mockConditions = [
    {
      id: 101,
      project: '세종 행복아파트',
      category: '환경영향평가',
      condition: '공사 중 비산먼지 저감 대책 수립 및 주기적 살수 실시',
      tags: ['환경', '먼지', '살수'],
      date: '2024-05-15'
    },
    {
      id: 102,
      project: '판교 테크노벨리',
      category: '교통영향평가',
      condition: '진출입로 가감속차로 확보 및 신호체계 연동',
      tags: ['교통', '진출입로', '신호'],
      date: '2024-04-20'
    }
  ];

  function renderView() {
    if (!container) return;
    
    container.innerHTML = `
      <div class="card" style="margin-bottom: 24px;">
        <div class="card-title">승인조건 신규 입력</div>
        <div class="grid grid-cols-2">
          <div class="input-group">
            <label class="label">현장 선택</label>
            <select class="input">
              <option>세종 행복아파트</option>
              <option>판교 테크노벨리</option>
            </select>
          </div>
          <div class="input-group">
            <label class="label">카테고리</label>
            <input type="text" class="input" placeholder="예: 환경영향평가">
          </div>
        </div>
        <div class="input-group">
          <label class="label">승인조건 텍스트</label>
          <textarea class="input" rows="3" placeholder="조건 내용을 입력하세요..."></textarea>
        </div>
        <div class="input-group">
          <label class="label">키워드 태그 (콤마로 구분)</label>
          <input type="text" class="input" placeholder="환경, 먼지, 소음">
        </div>
        <button class="btn btn-primary">조건 등록</button>
      </div>

      <h3 style="margin-bottom: 16px;">승인조건 관리 내역</h3>
      <div class="card" style="padding: 0; overflow: hidden;">
        <table style="width: 100%; border-collapse: collapse; text-align: left;">
          <thead style="background: var(--bg-elevated); color: var(--text-muted); font-size: 0.75rem; text-transform: uppercase;">
            <tr>
              <th style="padding: 16px;">현장명</th>
              <th style="padding: 16px;">카테고리</th>
              <th style="padding: 16px;">조건 내용</th>
              <th style="padding: 16px;">태그</th>
              <th style="padding: 16px;">등록일</th>
            </tr>
          </thead>
          <tbody id="conditions-table-body">
            ${mockConditions.map(c => `
              <tr style="border-top: 1px solid var(--border);">
                <td style="padding: 16px; font-weight: 600;">${c.project}</td>
                <td style="padding: 16px;"><span class="badge badge-info">${c.category}</span></td>
                <td style="padding: 16px; font-size: 0.875rem;">${c.condition}</td>
                <td style="padding: 16px;">
                  ${c.tags.map(t => `<span style="font-size: 0.7rem; background: rgba(255,255,255,0.05); padding: 2px 6px; border-radius: 4px; margin-right: 4px;">#${t}</span>`).join('')}
                </td>
                <td style="padding: 16px; font-size: 0.75rem; color: var(--text-dim);">${c.date}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  }

  renderView();
}
