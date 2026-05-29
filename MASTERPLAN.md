# SITE-MASTER 마스터 플랜

> 건설현장 통합 관리 웹앱 · 현재 버전 **v3.0** · 로컬 전용 (Firebase 제거)

---

## 1. 비전

건설 현장의 **시공 진행·발주·검수·현장 정보**를 한 화면에서 추적하고,
관리자·현장담당자가 **모바일/PC에서 동일하게** 사용할 수 있는 경량 웹앱.
로그인 없이 바로 시작하며, 데이터는 브라우저 localStorage에 저장된다.

---

## 2. 현재 상태 (v3.0 스냅샷)

| 항목 | 상태 |
|---|---|
| 런타임 | Vite 기반 멀티 파일 구성 |
| 저장소 | `localStorage` (로컬 전용) |
| 인증 | 없음 — 앱 시작 시 데모 관리자로 자동 진입 |
| 실시간 | 해당 없음 |
| 3D | Three.js (CDN r128) |
| 엑셀 | SheetJS (CDN 0.18.5) |

### 지원 기능
- 대시보드 · 날씨 위젯 · 현장정보
- 3D 시공현황 뷰어 (태양 시뮬레이션, 미니맵, 배치 편집)
- 시공현황 테이블 (엑셀 ↑/↓)
- 동 설정 (판상형·타워형·복도형·혼합형·ㄱ자형·ㄷ자형)
- 발주 알림 / 발주 설정 / 발주 현황
- 공장검수 / 테스트
- 현장 관리 (관리자 전용)
- 담당자 배정 (관리자 전용)
- 수정이력
- 마스코트 반응형 UI

---

## 3. 아키텍처

```
.
├─ index.html              ← HTML shell (마크업 + 모달)
├─ src/
│  ├─ main.js              ← 모듈 엔트리 (DOMContentLoaded)
│  ├─ js/
│  │  ├─ router.js         ← 뷰 라우팅
│  │  ├─ auth.js           ← 사용자 정보 UI 초기화
│  │  ├─ projects.js       ← 프로젝트 목록
│  │  ├─ conditions.js     ← 사업승인조건
│  │  ├─ notifications.js  ← 알림
│  │  └─ settings.js       ← 설정
│  └─ styles/              ← CSS 모듈 (base/layout/components)
├─ scripts/                ← 레거시 전역 스크립트
│  ├─ config.js            ← 상수 (SC/SL/TN/PS 등)
│  ├─ store.js             ← localStorage 레이어 (iDB/gDB/sDB)
│  ├─ utils.js             ← esc/toast/modal/popSel/addHist
│  ├─ mascot.js            ← 마스코트 SVG + 반응
│  ├─ firebase.js          ← 스텁 (Firebase 제거됨)
│  ├─ auth.js              ← 전역 상태 + 자동 진입 + nav
│  ├─ viewer3d.js          ← Three.js 3D 뷰어
│  └─ pages.js             ← 페이지 렌더러 9종
└─ README.md
```

---

## 4. 로드맵

### Phase 1 — 완료 ✅
- [x] 파일 분리 (Vite 기반 멀티 파일)
- [x] XSS escape (`esc()`) 적용
- [x] 로그인 기능 제거 — 자동 진입
- [x] Firebase 코드 제거

### Phase 2 — 구조 개선 (예정)
- [ ] Service Worker · 오프라인 캐시
- [ ] 레거시 `scripts/` → `src/` 모듈로 완전 이전
- [ ] 단위 테스트 확대 (Vitest)

### Phase 3 — 기능 확장 (장기)
- [ ] 도면 업로드 + 3D 오버레이
- [ ] 사진 첨부 (검수·공지)
- [ ] CSV/PDF 보고서 출력
- [ ] 모바일 PWA 지원

---

## 5. 보안 설계 원칙

1. **XSS** — 모든 사용자 입력은 `esc()`로 escape 후 innerHTML.
2. **로컬 데이터** — localStorage 저장이므로 서버 측 보안 이슈 없음.
3. **운영 배포 시** `scripts/store.js`의 `iDB()` 데모 계정을 반드시 제거.

---

## 6. 성능 목표

| 지표 | 목표 |
|---|---|
| First Contentful Paint | ≤ 1.5s |
| 3D 뷰어 초기 렌더 | ≤ 1.5s |
| 번들 크기 | ≤ 120KB gzip (CDN 제외) |

---

## 7. 참고

- Three.js: https://threejs.org/docs/
- SheetJS: https://sheetjs.com/
- Vite: https://vitejs.dev/
