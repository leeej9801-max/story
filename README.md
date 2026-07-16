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
- 참가자 모드에는 위 기능이 **절대** 노출되지 않는다.

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

## 구조

```
public/assets/
  video/part{1..6}.mp4                 # 영상 1~6 (영상 7 = part7.mp4 준비 중)
  ui/{start-background,puzzle-frame}.png
  puzzles/puzzle-0{1..5}-cue.png       # 큐시트 (07·08·09 준비 중)
  audio/{common,puzzles,gimmicks}/     # 퍼즐 BGM·효과음 (준비 중)
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
| 큐시트 7·8·9 | `public/assets/puzzles/puzzle-0{7,8,9}-cue.png` | `puzzleManifest.ts`에서 해당 퍼즐의 `cuePending: true` 삭제 |
| 퍼즐 BGM·효과음 | `public/assets/audio/**` (경로는 `audioManifest.ts` 참고) | 없음 — 파일만 넣으면 바로 재생된다 |

음원 파일이 없어도 진행은 정상 동작한다. `utils/audio.ts`가 재생 실패를 조용히 무시한다.
큐시트가 없는 퍼즐은 큐시트 자리에 임시 안내 문구를 띄우고 정답 검증은 정상 동작한다.

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
