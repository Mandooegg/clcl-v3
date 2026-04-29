/**
 * tests/utils.test.js
 * Phase 2: Vitest 단위 테스트 — utils.js
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { esc, gProg, addHist } from '../scripts/utils.js';

// ===== 전역 모킹 (window.CU, window.gDB, window.sDB) =====
beforeEach(() => {
  window.CU = { name: '테스트유저', role: 'user', sites: ['site1'] };
  window.mascotReact = vi.fn();
});

// ===== esc(): XSS 방지 HTML escape =====
describe('esc()', () => {
  it('null/undefined → 빈 문자열', () => {
    expect(esc(null)).toBe('');
    expect(esc(undefined)).toBe('');
  });

  it('& 이스케이프', () => {
    expect(esc('a&b')).toBe('a&amp;b');
  });

  it('< > 이스케이프', () => {
    expect(esc('<script>')).toBe('&lt;script&gt;');
  });

  it('" 이스케이프', () => {
    expect(esc('"hello"')).toBe('&quot;hello&quot;');
  });

  it("' 이스케이프", () => {
    expect(esc("it's")).toBe("it&#39;s");
  });

  it('/ 이스케이프', () => {
    expect(esc('</div>')).toBe('&lt;&#47;div&gt;');
  });

  it('일반 문자열 → 그대로', () => {
    expect(esc('안녕하세요 123')).toBe('안녕하세요 123');
  });

  it('숫자 입력 처리', () => {
    expect(esc(42)).toBe('42');
  });

  it('XSS 공격 패턴 무력화', () => {
    const xss = '<img src=x onerror="alert(1)">';
    const escaped = esc(xss);
    expect(escaped).not.toContain('<');
    expect(escaped).not.toContain('>');
    expect(escaped).not.toContain('"');
  });
});

// ===== gProg(): 현장 완료율 계산 =====
describe('gProg()', () => {
  beforeEach(() => {
    window.gDB = vi.fn().mockReturnValue({
      sites: {
        site1: {
          buildings: [
            { id: 'b1', name: '101동' },
            { id: 'b2', name: '102동' }
          ],
          progress: {
            b1: { flooring: { unit1: 'complete', unit2: 'complete', unit3: 'pending' } },
            b2: { flooring: { unit1: 'complete' } }
          }
        }
      }
    });
  });

  it('완료율 계산 (3/4 = 75%)', () => {
    expect(gProg('site1')).toBe(75);
  });

  it('존재하지 않는 현장 → 0', () => {
    expect(gProg('site_unknown')).toBe(0);
  });

  it('진행 없는 현장 → 0', () => {
    window.gDB = vi.fn().mockReturnValue({
      sites: {
        empty_site: { buildings: [{ id: 'b1', name: '101동' }], progress: {} }
      }
    });
    expect(gProg('empty_site')).toBe(0);
  });
});

// ===== addHist(): 수정이력 추가 =====
describe('addHist()', () => {
  it('이력 앞에 추가되고 sDB 호출', () => {
    const mockDB = { editHistory: [] };
    window.gDB = vi.fn().mockReturnValue(mockDB);
    window.sDB = vi.fn();

    addHist('현장 추가', '현장명: 강남A');

    expect(mockDB.editHistory).toHaveLength(1);
    expect(mockDB.editHistory[0].action).toBe('현장 추가');
    expect(mockDB.editHistory[0].detail).toBe('현장명: 강남A');
    expect(mockDB.editHistory[0].user).toBe('테스트유저');
    expect(window.sDB).toHaveBeenCalledWith(mockDB);
  });

  it('100건 초과 시 자동 잘림', () => {
    const mockDB = { editHistory: new Array(100).fill({ action: 'old', detail: '', user: '', time: '' }) };
    window.gDB = vi.fn().mockReturnValue(mockDB);
    window.sDB = vi.fn();

    addHist('새 항목', '디테일');
    expect(mockDB.editHistory).toHaveLength(100);
    expect(mockDB.editHistory[0].action).toBe('새 항목');
  });
});
