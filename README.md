# 일단나와 · 모바일 웹 데모 (Vercel)

울산대 해커톤 7팀의 [원본 프로젝트](https://github.com/nxtcloud-edu/ulsan-ai-ht-team07)를 참고해 모바일 화면과 추천 흐름을 새로 구성한 데모입니다. 원본 저장소에는 변경을 올리지 않았습니다.

## 체험

- 앱: https://ildan-nawa.vercel.app
- 이전 Sites 데모: https://ildannawa-mobile-demo.workspace-907689.chatgpt.site
- GitHub: https://github.com/techtechchuchu/Ildan-Nawa
- 이전 Sites 데모에만 ChatGPT 로그인이 필요합니다.
- `예시 코스 먼저 체험하기`는 울산 삼산동 좌표에 배치한 **가상 장소**로 작동합니다. 실제 방문용 장소가 아닙니다.
- `나만의 코스 만들기`는 OpenStreetMap의 실제 장소를 검색합니다. GPT 키가 없으면 기본 규칙 추천임을 표시합니다.
- GPT 키 설정 후에는 OpenAI Responses API와 JSON Schema로 코스 3개를 생성합니다. 후보에 없는 장소 ID는 사용할 수 없습니다.

## 포함 기능

동행자·지역·인원·시간·예산·활동 입력, 지역 검색, OpenStreetMap 지도, 방문 순서 번호와 점선, 코스 비교, 카페 제외·예산 줄이기·실내 위주 수정, 브라우저 코스 저장·조회·삭제.

지도 점선은 방문 순서를 나타냅니다. 길찾기 경로가 아닙니다. 이동시간은 직선거리 보정치로 계산합니다. 가격은 카테고리별 예상 금액이고 영업시간·예약·주차 여부는 검증하지 않습니다. 실내 분류도 카테고리 기준입니다. 음식 취향과 자유 문장 해석은 GPT 연결 시 사용합니다. OSM 장소 데이터가 부족하면 결과가 적거나 생성이 어려울 수 있습니다.

## 실행

Node.js 22.13 이상이 필요합니다.

```sh
npm ci
npm run dev
```

기본 주소는 http://localhost:3000 입니다. Vercel에서는 Next.js로 자동 감지해 배포합니다. 기존 Sites 관련 파일도 보관되어 있지만 Vercel 실행에는 사용하지 않습니다. `package.sites.json`은 이전 설정의 백업입니다.

GPT 설정: 로컬 `.env.local`에 아래 값을 넣거나, 배포 환경의 비밀 환경변수로 설정하세요. 키를 브라우저 코드에 넣지 마세요.

```dotenv
OPENAI_API_KEY=발급받은_키
OPENAI_MODEL=gpt-4.1-mini
PHOTON_URL=https://photon.komoot.io/api/
```

키는 전달된 소스에 포함되어 있지 않습니다. Vercel 프로젝트 Settings → Environment Variables에서 OPENAI_API_KEY를 Secret으로 등록하고 재배포하면 활성화됩니다. 플러그인은 필요하지 않습니다.

## 검사

```sh
node node_modules/typescript/bin/tsc --noEmit
node --experimental-strip-types --test --test-isolation=none tests/planner.test.ts
npm run build
```

검증한 항목: 예산·종료시간 제한, 중복 방문 방지, 실내·제외 조건, 자정 이후 일정. 모바일 390px 화면에서 예시 생성→수정→저장→목록 흐름을 확인했습니다. Vercel 배포 페이지와 예시 코스 생성 동작도 확인했습니다.

Windows에서 로컬 Worker 실행이 제한되는 환경은 화면 확인 전용 미리보기를 사용할 수 있습니다. 이 모드는 실제 장소 검색·GPT를 호출하지 않습니다.

```sh
node scripts/preview-static.mjs
node --experimental-strip-types scripts/preview-server.mjs
```

주소: http://127.0.0.1:4173

## 데이터와 지도

- © OpenStreetMap contributors · https://www.openstreetmap.org/copyright
- 타일 정책: https://operations.osmfoundation.org/policies/tiles/
- 지역 검색: Photon · https://github.com/komoot/photon
- 장소 검색: Photon OSM 카테고리 검색 · 서버 메모리에 10분 캐시
- OpenAI 구조화 출력: https://developers.openai.com/api/docs/guides/structured-outputs

공개 OSM 타일은 화면에 필요한 범위만 요청합니다. 대량 다운로드·오프라인 프리패치는 구현하지 않았습니다. 지역 검색은 검색 버튼을 눌렀을 때만 요청합니다. 상용 확장 시 검색·타일 공급자와 사용량을 재검토하세요.
