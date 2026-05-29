# 🏗️ SITE-MASTER

건설 현장의 **시공 진행·발주·검수·현장 정보**를 한 화면에서 관리하는 경량 웹앱.

![version](https://img.shields.io/badge/version-3.0-blue)
![license](https://img.shields.io/badge/license-MIT-green)

---

## ✨ 주요 기능

| 영역 | 기능 |
|---|---|
| **대시보드** | 현장·동수·완료율·미확인 알림 요약, 날씨 위젯 |
| **3D 시공현황** | Three.js 기반 뷰어, 태양 위치 시뮬레이션, 미니맵, 드래그 배치 편집 |
| **시공현황 테이블** | 층·호수별 상태 토글, 엑셀 ↑/↓ |
| **동 설정** | 판상형·타워형·복도형·혼합형·ㄱ자형·ㄷ자형 지원, 최대 50동 |
| **발주 관리** | N층 완료 시 자동 알림 → 발주 워크플로 (준비 → 의뢰서 → 입찰 → 발주완료) |
| **공장검수/테스트** | 검수 항목 등록·상태 추적 |
| **관리자** | 현장 생성·삭제·수정, 담당자 역할/현장 배정 |
| **마스코트** | 상황별 반응 UI (저장·오류·알림·유휴) |

---

## 🚀 빠른 시작

```bash
npm install
npm run dev
# → http://localhost:5173
```

앱을 열면 **로그인 없이 데모 관리자로 자동 진입**합니다.

---

## 🧪 브라우저 지원

| 브라우저 | 상태 |
|---|---|
| Chrome 120+ | ✅ |
| Edge 120+ | ✅ |
| Safari 16+ | ✅ |
| Firefox 115+ | ✅ |
| iOS Safari 16+ | ✅ |
| IE 11 | ❌ 미지원 |

Three.js·WebGL 지원이 필요합니다. 3D 뷰어가 실패하면 다른 기능은 정상 작동합니다.

---

## ⚠️ 알려진 제한사항

- 데이터는 브라우저 **localStorage**에만 저장됩니다. 다른 기기와 공유되지 않습니다.
- 오프라인 캐시 (Service Worker) 미구현. CDN이 내려가면 3D·엑셀 기능 일시 정지.
- 한 현장 당 동 50개, 층 50개, 호수 6개까지 안정적으로 동작합니다.

---

## 🔧 개발 가이드

### 로컬 개발
```bash
npm run dev     # Vite 개발 서버 (HMR 포함)
npm run build   # 프로덕션 빌드
npm run test    # 테스트 실행
```

### 데이터 초기화
브라우저 DevTools → Application → Local Storage → `sitemaster_db_v2` 삭제 후 새로고침.

---

## 📂 파일 구조

```
.
├─ index.html              ← HTML shell (마크업 + 모달)
├─ src/
│  ├─ main.js              ← 모듈 엔트리
│  ├─ js/                  ← 신규 모듈 (router, auth, projects 등)
│  └─ styles/              ← CSS 모듈
├─ scripts/
│  ├─ config.js            ← 상수 (상태/라벨/색상/형태)
│  ├─ store.js             ← localStorage 레이어 (iDB/gDB/sDB)
│  ├─ utils.js             ← esc/toast/modal/popSel/addHist
│  ├─ mascot.js            ← 마스코트 SVG + 반응
│  ├─ firebase.js          ← 스텁 (Firebase 제거됨)
│  ├─ auth.js              ← 전역 상태 + 자동 진입 + nav
│  ├─ viewer3d.js          ← Three.js 3D 뷰어
│  └─ pages.js             ← 페이지 렌더러 9종
├─ README.md
└─ MASTERPLAN.md           ← 로드맵 & 아키텍처
```

---

## 🤝 기여

1. 이슈 먼저 등록해서 방향 합의
2. 기능 브랜치 (`feature/xxx`) → PR

---

## 📄 라이선스

MIT License. 자유롭게 사용·수정·배포 가능합니다.
