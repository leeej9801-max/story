import type { SequenceStep } from "../types/sequence";

// ─────────────────────────────────────────────────────────────────────────────
// 전체 진행 순서 (지시서 v2 · 2장 / 18장)
//
//   [영상 1] → [퍼즐 1]
//   [영상 2] → [퍼즐 2] → [퍼즐 3]
//   [영상 3] → [기믹 6]
//   [영상 4] → [퍼즐 4] → [퍼즐 5]
//   [영상 5] → [퍼즐 7] → [퍼즐 8]
//   [영상 6] → [퍼즐 9]
//   [영상 7] → 종료
//
// 규칙:
//  - 파일명 숫자 정렬로 순서를 정하지 않는다. 아래 배열의 순서와 nextStepId가 진짜 순서다.
//  - 단계 삽입/삭제/재배치는 이 파일만 수정한다.
//  - 6번은 정답 입력 퍼즐이 아니라 10초 타이머 기믹이다. 그래서 puzzle-06은 없다.
//
// 영상 파일 경로:
//  현재 영상 원본 파일명이 part1~part6이므로 그대로 참조한다.
//  지시서 15장의 권장 파일명(video-01-awakening-on-the-road.mp4 등)으로 바꾸려면
//  파일을 옮긴 뒤 아래 src 문자열만 수정하면 된다.
// ─────────────────────────────────────────────────────────────────────────────

export const sequence: SequenceStep[] = [
  {
    id: "video-01",
    type: "video",
    title: "길 위에서 깨어나다",
    src: "/assets/video/part1.mp4",
    nextStepId: "puzzle-01",
    allowSkip: false,
  },
  {
    id: "puzzle-01",
    type: "puzzle",
    puzzleId: "puzzle-01",
    nextStepId: "video-02",
  },

  {
    id: "video-02",
    type: "video",
    title: "붉은 실의 시작",
    src: "/assets/video/part2.mp4",
    nextStepId: "puzzle-02",
    allowSkip: false,
  },
  {
    id: "puzzle-02",
    type: "puzzle",
    puzzleId: "puzzle-02",
    nextStepId: "puzzle-03",
  },
  // 퍼즐 2와 퍼즐 3 사이에는 별도 영상이 없다. (지시서 3장)
  {
    id: "puzzle-03",
    type: "puzzle",
    puzzleId: "puzzle-03",
    nextStepId: "video-03",
  },

  {
    id: "video-03",
    type: "video",
    title: "필요한 존재",
    src: "/assets/video/part3.mp4",
    nextStepId: "gimmick-06",
    allowSkip: false,
  },
  {
    id: "gimmick-06",
    type: "gimmick",
    gimmickId: "gimmick-06",
    nextStepId: "video-04",
  },

  {
    id: "video-04",
    type: "video",
    title: "무너진 관계, 황금의 유혹",
    src: "/assets/video/part4.mp4",
    nextStepId: "puzzle-04",
    allowSkip: false,
  },
  {
    id: "puzzle-04",
    type: "puzzle",
    puzzleId: "puzzle-04",
    nextStepId: "puzzle-05",
  },
  // 퍼즐 4와 퍼즐 5 사이에는 별도 영상이 없다. (지시서 3장)
  {
    id: "puzzle-05",
    type: "puzzle",
    puzzleId: "puzzle-05",
    nextStepId: "video-05",
  },

  {
    id: "video-05",
    type: "video",
    title: "소음 속에 감춰진 음성",
    src: "/assets/video/part5.mp4",
    nextStepId: "puzzle-07",
    allowSkip: false,
  },
  {
    id: "puzzle-07",
    type: "puzzle",
    puzzleId: "puzzle-07",
    nextStepId: "puzzle-08",
  },
  // 퍼즐 7과 퍼즐 8 사이에는 별도 영상이 없다. (지시서 3장)
  {
    id: "puzzle-08",
    type: "puzzle",
    puzzleId: "puzzle-08",
    nextStepId: "video-06",
  },

  {
    id: "video-06",
    type: "video",
    title: "빛을 향하여",
    src: "/assets/video/part6.mp4",
    nextStepId: "puzzle-09",
    allowSkip: false,
  },
  {
    id: "puzzle-09",
    type: "puzzle",
    puzzleId: "puzzle-09",
    nextStepId: "video-07",
  },

  // 퍼즐 9(십자가) 정답 후 재생되는 마지막 영상.
  {
    id: "video-07",
    type: "video",
    title: "기다리고 계신 분",
    src: "/assets/video/part7.mp4",
    nextStepId: "complete",
    allowSkip: false,
  },

  {
    id: "complete",
    type: "complete",
    nextStepId: null,
  },
];

// 단계 빠른 조회 맵
export const stepMap: Record<string, SequenceStep> = Object.fromEntries(
  sequence.map((step) => [step.id, step]),
);

/** 시작 화면에서 `시작하기`를 눌렀을 때 진입하는 첫 단계 */
export const FIRST_STEP_ID = "video-01";

/** 시작 화면은 시퀀스 밖의 별도 화면이다. */
export const START_SCREEN_ID = "start";
