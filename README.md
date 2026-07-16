# THE ROAD — 영상 중심 진행 (v2)

`THE_ROAD_영상중심_진행구조_수정지시서_v2.md`에 따라 만든 **영상 자동 재생 + 퍼즐/기믹
인터럽트** 웹 앱. React + Vite + TypeScript. 전역 상태 라이브러리 없이 `localStorage`로
진행을 저장한다.

```text
영상 자동 재생 → 영상 종료 → 퍼즐 또는 기믹 → 정답 입력 / 기믹 종료
→ 다음 영상 자동 재생 → 반복 → 엔딩
```

참가자는 **영상을 건너뛸 수 없고**, 퍼즐을 풀기 전에는 다음 단계로 갈 수 없다.
`다음` 버튼, 화면 클릭 넘김, Enter/Space 넘김, 퍼즐 `나가기`는 존재하지 않는다.

## 실행

```bash
npm install
npm run dev        # 개발 서버
npm run validate   # 콘텐츠(manifest·에셋) 검증
npm run build      # validate → clean → tsc → vite build
npm run preview    # 빌드 결과 미리보기
```

- 참가자 모드: `http://localhost:5173/`
- 디버그 모드: `http://localhost:5173/?debug=1`
  - 좌상단 패널: 현재 단계, 이전/다음 단계, 단계 점프, 진행 초기화, 재생 중인 오디오 파일명
  - 영상 화면: 재생 위치 이동, 영상 종료 강제 실행
  - 퍼즐 화면: 퍼즐 강제 성공
  - 기믹 화면: 타이머 즉시 0초
- 특정 단계 바로 열기: `?debug=1&step=puzzle-07`
  - 영상을 처음부터 보지 않고 퍼즐 하나만 점검할 때 쓴다.
  - 단계 ID는 `sequenceManifest.ts` 참고 (`video-01` … `puzzle-09`, `gimmick-06`, `complete`).
- 참가자 모드에는 위 기능이 **절대** 노출되지 않는다. `?debug=1`이 없으면 `step`도 무시된다.

## 핵심 원칙

진행 순서는 컴포넌트가 아니라 **데이터**로만 제어된다. 컴포넌트는 파일명을 분석하지 않고
현재 단계의 `nextStepId`로만 이동한다. 순서를 바꾸려면 `sequenceManifest.ts`만 고친다.

## 진행 순서

| 단계 | 내용 | 정답 |
|---|---|---|
| 영상 1 | 길 위에서 깨어나다 | — |
| 퍼즐 1 | 길을 잃은 아이 | `식량 창고 구석` |
| 영상 2 | 붉은 실의 시작 | — |
| 퍼즐 2 | 닫힌 약 상자 | `0912` |
| 퍼즐 3 | 공동 식량 창고의 마법 지도 | `마법의 지도` |
| 영상 3 | 필요한 존재 | — |
| 기믹 6 | 10초 안에 대답하라 | 입력 없음 (타이머) |
| 영상 4 | 무너진 관계, 황금의 유혹 | — |
| 퍼즐 4 | 종이컵 암호 | `35173` |
| 퍼즐 5 | 벽돌 모양 암호 | `1227` |
| 영상 5 | 소음 속에 감춰진 음성 | — |
| 퍼즐 7 | 노이즈 제거 1 | `사람을 두려워하면 올무에 걸리게 되거니와` (`울무`도 허용) |
| 퍼즐 8 | 노이즈 제거 2 | `그런즉 너희는 먼저 그의 나라와 그의 의를 구하라` |
| 영상 6 | 빛을 향하여 | — |
| 퍼즐 9 | 걸어온 길의 모양 | `십자가` (`CROSS`는 미등록) |
| 영상 7 | 기다리고 계신 분 | — |
| 완료 | 엔딩 정지 화면 (5초 후 `처음으로`) | — |

**6번은 정답 입력 퍼즐이 아니라 10초 타이머 기믹이다.** 그래서 `puzzle-06`은 없다.
퍼즐 7·8은 핵심 문장이 포함되면 앞뒤에 다른 글자가 있어도 정답 처리된다(`contains`).

## 퍼즐 화면 레이아웃

`puzzleManifest.ts`의 `layout` 값으로 정해진다.

| layout | 쓰는 퍼즐 | 구성 |
|---|---|---|
| `frame` (기본) | 1·2·3·4·5·9 | 공통 프레임(`puzzle-frame.png`) + 큐시트 + 입력창 + 확인 |
| `scene` | 7·8 | 노이즈 장면 배경 + 목탄·양피지 설명 박스 + 하단 입력줄(입력창 + `정답` 버튼) |

### 노이즈 퍼즐 7·8

다른 퍼즐과 달리 공통 프레임과 큐시트를 쓰지 않는다.

```text
배경   puzzle-noise-bg.png (주인공이 소음에 괴로워하는 장면)
설명   화면 위쪽 양피지 쪽지 — 주인공을 가리지 않고,
       정답 후 '말씀'이 나타나는 자리와 같은 높이라 해독 흐름이 이어진다
입력   하단에 입력창 + 정답 버튼
정답 후 성공 이미지를 전체 화면으로 띄우고 음성을 재생 → 끝나면 자동으로 다음 단계
```

| 퍼즐 | 성공 이미지 | 함께 나오는 음성 | 음성 길이 |
|---|---|---|---|
| 7 | `puzzle-07-cleared.png` | `noise-layer-01-cleared.mp3` | 13.0초 |
| 8 | `puzzle-08-cleared.png` | `noise-layer-02-cleared.mp3` | 12.5초 |

성공 이미지는 **음성이 끝날 때까지** 자동으로 유지된다.
따라서 정답 후 총 소요는 `3초(BGM 페이드) + 음성 길이` ≈ 16초다.

`puzzleManifest.ts`의 `successRevealMs`는 **음성 파일이 없을 때만** 쓰이는 예비값이라
지금은 사용되지 않는다. 음성을 교체하면 길이에 맞춰 자동으로 따라간다.

### ⚠ 퍼즐 번호가 두 가지다

기획 쪽은 입력 퍼즐만 1~8로 세고(기믹 제외), 코드는 지시서대로 1~5·7~9를 쓴다.

| 기획 번호 | 코드 ID | 받은 파일명 | 실제 배치 |
|---|---|---|---|
| 퍼즐 6 | `puzzle-07` | `puzzle-06-cleared.mp3` | `noise-layer-01-cleared.mp3` |
| 퍼즐 7 | `puzzle-08` | `puzzle-07-cleared.mp3` | `noise-layer-02-cleared.mp3` |

받은 이름을 그대로 두면 **음성 `puzzle-07-cleared.mp3`(코드 puzzle-08용)** 와
**이미지 `puzzle-07-cleared.png`(코드 puzzle-07용)** 가 같은 이름인데 다른 퍼즐을 가리켜
사고가 나기 쉽다. 그래서 코드 번호 기준 이름으로 바꿔 두었다.
받은 원본은 `story/asset_0/`에 받은 이름 그대로 보관한다.

## 퍼즐 배경음

```text
퍼즐 진입  →  BGM 반복 재생 (정답을 맞출 때까지)
정답       →  BGM 3초 페이드아웃
           →  페이드가 끝나면 다음 영상 또는 성공 이미지 + 음성
오답       →  BGM 유지 + 오답 효과음만 겹쳐 재생
영상 재생 중 →  퍼즐 오디오 전부 정지 (영상 소리만)
```

3초 페이드가 **끝난 뒤에** 다음 오디오가 시작되므로 BGM과 영상/음성이 겹치지 않는다.
페이드 길이는 `audioManifest.ts`의 `BGM_FADE_MS` 하나로 조절한다.

| 퍼즐 | BGM 파일 | 길이 |
|---|---|---|
| 1 | `puzzle-01-bgm.mp3` | 1분 00초 |
| 2·3 | `puzzle-23-bgm.mp3` (공용) | 2분 50초 |
| 4·5 | `puzzle-45-bgm.mp3` (공용) | 2분 44초 |
| 7·8 | `puzzle-67-bgm.mp3` (공용) | 2분 37초 |
| 9 | `puzzle-09-light-loop.mp3` | 아직 없음 |

`puzzle-67-bgm.mp3`는 소음 속에 말씀이 섞여 있는 트랙(= 퍼즐 그 자체)이다.
참가자는 이 소리를 들으며 말씀을 받아 적는다.

BGM을 공유하는 퍼즐(2·3, 4·5, 7·8)은 다음 퍼즐로 넘어갈 때 곡을 **다시 시작하지 않고
이어서** 재생한다. 짧은 곡도 끝나면 자동으로 반복된다.

원본(한글 파일명)은 `story/asset_0/`에 보관하고 앱은 영문명 사본만 쓴다.
아직 없는 음원은 `npm run validate`가 목록으로 알려 준다.

## 구조

```
public/assets/
  video/part{1..6}.mp4                 # 영상 1~6 (영상 7 = part7.mp4 준비 중)
  ui/{start-background,puzzle-frame}.png
  puzzles/puzzle-0{1..5}-cue.png       # 큐시트 (09 준비 중 · 7·8은 큐시트를 쓰지 않음)
  puzzles/puzzle-noise-bg.png          # 노이즈 퍼즐 7·8 입력 배경
  puzzles/puzzle-0{7,8}-cleared.png    # 노이즈 퍼즐 정답 후 성공 이미지
  audio/{common,puzzles,gimmicks}/     # 퍼즐 BGM·효과음·음성 (준비 중)
  scenes/, pending/                    # v1 컷신 이미지 (현재 미사용 · 보관)
src/
  app/App.tsx                  # 단계 전환·오디오 정리·디버그 오케스트레이션
  components/                  # StartScreen, VideoStage, PuzzleScreen, GimmickTimer,
                               # CompleteScreen, CueSheetModal, TransitionOverlay, DebugPanel
  data/sequenceManifest.ts     # 전체 진행 순서 (진짜 순서의 소스)
  data/puzzleManifest.ts       # 퍼즐 정의(정답/큐시트/입력타입/matchMode)
  data/audioManifest.ts        # 퍼즐·기믹 오디오 경로와 볼륨
  hooks/useSequenceProgress.ts # 진행 상태 단일 소스
  utils/                       # normalizeAnswer, storage(localStorage), audio
  styles/                      # global.css, stage.css, puzzle.css
  types/sequence.ts
scripts/validate-content.mjs   # 빌드 전 콘텐츠 검증
scripts/clean-dist.mjs         # 빌드 전 dist 삭제 (아래 "빌드 주의" 참고)
```

## 아직 준비 중인 것

교체만 하면 되도록 자리를 잡아 두었다.

| 항목 | 넣을 위치 | 그다음 할 일 |
|---|---|---|
| 영상 7 | `public/assets/video/part7.mp4` | `sequenceManifest.ts`의 `video-07`에서 `pending: true` 줄 삭제 |
| 큐시트 9 | `public/assets/puzzles/puzzle-09-cue.png` | `puzzleManifest.ts`에서 `puzzle-09`의 `cuePending: true` 삭제 |
| 퍼즐 9 BGM | `public/assets/audio/puzzles/puzzle-09-light-loop.mp3` | 없음 — 넣으면 바로 재생된다 |
| 공통 효과음·기믹 음원 | `public/assets/audio/{common,gimmicks}/` | 없음 — 파일만 넣으면 바로 재생된다 |

음원을 교체할 때는 **`audioManifest.ts`에 적힌 파일명 그대로** 넣어야 한다.
이름이 다르면 조용히 무시되므로, `npm run validate`가
"매니페스트가 참조하지 않는 음원입니다"로 잡아 준다.

음원 파일이 없어도 진행은 정상 동작한다. `utils/audio.ts`가 재생 실패를 조용히 무시한다.
큐시트가 없는 퍼즐은 큐시트 자리에 임시 안내 문구를 띄우고 정답 검증은 정상 동작한다.

원본 이미지(한글 파일명)는 `story/asset_0/`에 보관하고, 앱에서는 안전한 영문명 사본만 쓴다.

## 진행 상태 저장

- 저장 키: `the-road-video-flow-v2`
- 저장 시점: 단계 진입 / 영상 재생 중 2초마다 / 퍼즐 오답·정답 / 기믹 종료
- 재접속: 영상은 저장된 시간부터, 퍼즐은 해당 퍼즐부터 복구.
  기믹 6은 새로고침하면 10초부터 다시 시작한다.

## ⚠ 빌드 주의 (이 환경 한정)

이 PC(Windows + OneDrive + Node 24)에서는 **재귀 삭제가 네이티브 크래시를 일으킨다.**

```text
fs.rmSync(dist, { recursive: true })  →  0xC0000409 로 프로세스 강제 종료 (메시지 없음)
```

vite의 outDir 비우기(`vite:prepare-out-dir`)도 같은 재귀 삭제를 쓰기 때문에, dist가 이미
있으면 `vite build`가 통째로 죽었다. **첫 빌드만 성공하고 두 번째 빌드부터 항상 크래시**하는
증상이 여기서 나왔다.

그래서 이렇게 우회한다.

- `vite.config.ts` → `build.emptyOutDir: false` (vite가 dist를 지우지 않게 함)
- `scripts/clean-dist.mjs` → 재귀 삭제 API 대신 파일을 하나씩 지움 (정상 동작)
- `npm run build` → `validate → clean → tsc → vite build`

Node의 재귀 삭제 버그가 고쳐지면 위 두 가지를 함께 제거해도 된다.
