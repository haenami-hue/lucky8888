# 행운로또 (Lucky Lotto)

로또 6/45 통계와 질문·사주 기반 번호 추천을 제공하는 모바일(Android 우선) PWA.

> 로또 추첨은 매 회차 독립적인 무작위 사건입니다. 이 앱의 통계·사주 풀이는 **재미용**이며
> 당첨 확률을 높여주지 않습니다. 앱 화면에도 같은 안내를 표시합니다.

## 실행

```bash
npm install
npm run fetch-draws   # 동행복권에서 새 회차 수집 → public/data/draws.json
npm run dev           # 개발 서버 (같은 Wi-Fi의 폰에서 http://<PC IP>:5173 접속)
npm run build         # dist/ 에 배포용 정적 파일 생성
```

배포용 빌드는 배포 주소를 넣어 만든다. 카카오톡·문자 링크 미리보기 이미지는 절대 주소여야 하기 때문이다.

```powershell
$env:SITE_URL="https://배포주소/"; npm run build   # 끝에 / 포함
```

당첨결과는 앱이 동행복권에서 직접 받아오므로 매주 다시 배포할 필요는 없다 ([docs/data-source.md](docs/data-source.md)).

Android 폰에서 설치: 배포된 HTTPS 주소를 크롬으로 열면 앱 상단에 **설치** 배너가 뜬다 (아이폰은 사파리 공유 → 홈 화면에 추가).

## 폴더 구조

```
AI_LOT/
├─ docs/                    기획·데이터 소스 등 관리 문서
├─ scripts/                 빌드 외 도구 (데이터 수집, 아이콘 생성)
├─ public/
│  ├─ data/draws.json       회차별 당첨결과 (스크립트가 생성, 커밋 대상)
│  └─ icons/                PWA 아이콘
├─ src/
│  ├─ app/                  앱 진입점, 화면 전환(하단 탭)
│  ├─ components/           여러 화면이 함께 쓰는 UI (공, 카드, 차트)
│  │  └─ charts/
│  ├─ data/                 데이터 타입과 로딩 훅
│  ├─ features/             화면(기능) 단위 폴더
│  │  ├─ recommend/         질문 → 사주·통계 기반 번호 추천
│  │  ├─ dashboard/         통계 대시보드
│  │  └─ history/           회차별 당첨번호 목록
│  ├─ lib/                  UI와 무관한 순수 로직 (테스트·재사용 대상)
│  │  ├─ lotto/             통계 계산, 번호 생성, 공 색상
│  │  └─ saju/              간지(干支)·오행 계산
│  └─ styles/               디자인 토큰, 전역 스타일
└─ .github/workflows/       매주 당첨결과 자동 갱신
```

규칙
- 새 화면은 `src/features/<이름>/` 에 추가하고 `src/app/App.tsx` 의 탭에 등록한다.
- 계산 로직은 `src/lib/` 에 두고 React 를 import 하지 않는다.
- 색상·간격은 `src/styles/tokens.css` 의 토큰만 사용한다.
- 추후 Play 스토어 배포 시 Capacitor 로 감싸면 루트에 `android/` 폴더가 추가된다.

문서: [docs/data-source.md](docs/data-source.md), [docs/recommend-logic.md](docs/recommend-logic.md)
