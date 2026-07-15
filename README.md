# THE ROAD — 컷신 · 퍼즐 MVP

`THE_ROAD_컷신_퍼즐_MVP_구현명세.md`에 따라 만든 데이터 중심 컷신/퍼즐 웹 앱.
React + Vite + TypeScript. 전역 상태 라이브러리 없이 `localStorage`로 진행을 저장한다.

## 실행

```bash
npm install
npm run dev        # 개발 서버
npm run validate   # 콘텐츠(manifest·에셋) 검증
npm run build      # validate → tsc → vite build
npm run preview    # 빌드 결과 미리보기
```

- 참가자 모드: `http://localhost:5173/`
- 디버그 모드: `http://localhost:5173/?debug=1`
  - 좌상단 패널: 현재 노드 정보, 이전/다음, 노드 점프, 퍼즐 성공 처리, 진행 초기화
  - 키보드: `→` 다음(강제) · `←` 이전 · `J` 점프 패널 · `R` 장면 다시 로드

## 핵심 원칙

스토리 순서는 컴포넌트가 아니라 **데이터**로만 제어된다. 컴포넌트는 파일명 숫자를
분석하지 않고 현재 노드의 `nextId`로만 이동한다.

## 구조

```
public/assets/
  video/intro.mp4
  ui/{start-background,puzzle-frame}.png
  scenes/{c0-*,c1-*,c2-*,c3-*}.png     # 컷신 (원본 → 안전한 영문명으로 복사)
  puzzles/p{1..5}-cue.png              # 퍼즐 큐시트
  pending/relationship-square.png      # 삽입 위치 미정 보관본
src/
  app/App.tsx                # 전환·라우팅·디버그·프리로드 오케스트레이션
  components/                # StartScreen, VideoScene, CutsceneViewer,
                             # PuzzleScreen, CueSheetModal, TransitionOverlay, DebugPanel
  data/storyManifest.ts      # 전체 장면 순서 (진짜 순서의 소스)
  data/puzzleManifest.ts     # 퍼즐 정의(정답/큐시트/입력타입)
  hooks/                     # useStoryProgress, useImagePreload, useKeyboardControls
  utils/                     # normalizeAnswer, storage(localStorage)
  styles/                    # global.css, story.css, puzzle.css
  types/story.ts
scripts/validate-content.mjs # 빌드 전 콘텐츠 검증
```

## 새 장면 추가

1. 이미지를 `public/assets/scenes/`에 복사한다.
2. `src/data/storyManifest.ts`에 `cut("새id", chapter, order, "파일.png", "다음id")` 한 줄 추가.
3. 앞 노드의 `nextId`를 새 노드 id로 바꾼다.

## 새 퍼즐 추가 / 정답 확정

- 큐시트를 `public/assets/puzzles/`에 넣고 `puzzleManifest.ts`에 항목 추가.
- 정답이 정해지면 해당 퍼즐의 `acceptedAnswers`와 `enabled: true`만 수정한다.
- `enabled` 퍼즐의 정답이 `__ANSWER_REQUIRED__`로 남아 있으면 `npm run build`가 실패한다.

## 현재 상태 메모

- P4=`35173`, P5=`1227`만 정답이 확정되어 동작한다.
- P1~P3은 정답 미정(`enabled: false`)이라 참가자 모드에서 **"준비 중" 임시 통과 패널**로
  표시된다. 임의 정답은 넣지 않았다. 정답이 확정되면 위 절차대로 활성화하면 된다.
- Chapter 3은 마지막에 `story-incomplete`(“다음 장면 준비 중”) 자리표시자로 끝난다.
  이후 이미지가 준비되면 노드를 추가하고 `c3-03.nextId`만 바꾼다.
