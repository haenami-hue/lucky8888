# 데이터 소스

동행복권은 공식 API를 제공하지 않는다. 홈페이지가 내부적으로 쓰는 엔드포인트를 이용하므로
예고 없이 바뀔 수 있다. 수집이 실패하면 이 문서부터 갱신할 것.

## 현재 엔드포인트 (2026-10 확인)

`GET https://www.dhlottery.co.kr/lt645/selectPstLt645InfoNew.do`

| 파라미터 | 의미 |
|---|---|
| `srchDir=center&srchLtEpsd=N` | N회 전후 10개 회차 (1을 주면 1~10회) |
| `srchDir=latest&srchCursorLtEpsd=N` | N회 **다음** 회차부터 최대 10개, 내림차순 |
| `srchDir=older&srchCursorLtEpsd=N` | N회 **이전** 회차부터 최대 10개 |

- 커서 0 은 빈 목록을 준다. 처음 수집할 때는 `center&srchLtEpsd=1` 로 시작한다.
- 응답: `data.list[]` — `ltEpsd`(회차), `ltRflYmd`(추첨일 YYYYMMDD), `tm1WnNo`~`tm6WnNo`,
  `bnsWnNo`(보너스), `rnk{1-5}WnNope`(등위별 당첨자 수), `rnk{1-5}WnAmt`(1게임당 당첨금),
  `rlvtEpsdSumNtslAmt`(해당 회차 판매액).
- 과거에 쓰이던 `common.do?method=getLottoNumber&drwNo=N` 은 홈페이지로 리다이렉트된다 (폐기됨).

## 갱신 주기

추첨은 매주 토요일 20:35경. 앱은 재배포 없이 새 회차를 받는다:

1. 번들된 `public/data/draws.json` 과 기기에 저장해 둔 추가 회차(localStorage)를 먼저 표시
2. 마지막 회차 이후를 앱이 동행복권에서 직접 조회(`src/data/dhlottery.ts`)해 합치고 저장

엔드포인트가 요청 Origin 을 `Access-Control-Allow-Origin` 으로 돌려주므로 브라우저에서 바로 호출된다
(2026-10 확인). 이 정책이 바뀌어 막히면 조회만 실패하고 번들 데이터로 동작한다.
번들 데이터는 첫 실행·오프라인용이므로 가끔 `npm run fetch-draws` 후 빌드해 두면 충분하다.
