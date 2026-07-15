import type { CutsceneNode, PuzzleNode, StoryNode } from "../types/story";

// ─────────────────────────────────────────────────────────────────────────────
// 스토리 진행 순서 (명세 12장)
//
// 규칙:
//  - 파일명 숫자 정렬로 순서를 정하지 않는다. 아래 배열의 순서와 nextId가 진짜 순서다.
//  - 장면 삽입/삭제/재배치는 이 파일만 수정한다.
//  - 중간 삽입은 앞 노드의 nextId만 새 노드로 바꾸면 된다.
// ─────────────────────────────────────────────────────────────────────────────

// 반복되는 컷신 노드 생성 헬퍼. order/ nextId를 명시해 최종 순서가 데이터에서 그대로 보인다.
function cut(
  id: string,
  chapter: number,
  order: number,
  file: string,
  nextId: string | null,
  transition: CutsceneNode["transition"] = "fade",
): CutsceneNode {
  return {
    id,
    type: "cutscene",
    chapter,
    order,
    imageSrc: `/assets/scenes/${file}`,
    transition,
    nextId,
  };
}

function puzzle(
  id: string,
  chapter: number,
  order: number,
  puzzleId: string,
  nextId: string | null,
): PuzzleNode {
  return { id, type: "puzzle", chapter, order, puzzleId, nextId };
}

export const storyManifest: StoryNode[] = [
  // ── 시작 & 인트로 ──────────────────────────────────────────────────────────
  {
    id: "start",
    type: "start",
    chapter: 0,
    order: 0,
    imageSrc: "/assets/ui/start-background.png",
    nextId: "intro-video",
  },
  {
    id: "intro-video",
    type: "video",
    chapter: 0,
    order: 1,
    videoSrc: "/assets/video/intro.mp4",
    allowSkip: true,
    nextId: "c0-01",
  },

  // ── Chapter 0 · 길과 관계의 문 ────────────────────────────────────────────
  cut("c0-01", 0, 2, "c0-01.png", "c0-02", "slowZoom"), // chaper0_1첫길나오는신
  cut("c0-02", 0, 3, "c0-02.png", "c0-03"), // chaper0_2오른쪽 길 나옴
  cut("c0-03", 0, 4, "c0-03.png", "c0-04"), // chaper0_3 오른쪽 갈림길 고민
  cut("c0-04", 0, 5, "c0-04.png", "c0-05"), // chaper0_4오른쪽 갈림길 나아감
  cut("c0-05", 0, 6, "c0-05.png", "c0-06"), // chaper0_5관계의 방 멀리1
  cut("c0-06", 0, 7, "c0-06.png", "c0-07"), // chaper0_6관계의 방2
  cut("c0-07", 0, 8, "c0-07.png", "c0-08"), // chaper0_7관계의 방 문 앞
  cut("c0-08", 0, 9, "c0-08.png", "c0-09"), // chaper0_8관계의 방 문을 연
  cut("c0-09", 0, 10, "c0-09.png", "c0-10"), // chaper0_9문열고 마을 보임
  cut("c0-10", 0, 11, "c0-10.png", "c0-11"), // chaper0_10 마을 앞
  cut("c0-11", 0, 12, "c0-11.png", "c1-01"), // chaper0_11 마을 촌장 소개

  // ── Chapter 1 · 관계의 방 ─────────────────────────────────────────────────
  cut("c1-01", 1, 13, "c1-01.png", "c1-02"), // 1chaper_2.0 아이엄마 잃어버림
  cut("c1-02", 1, 14, "c1-02.png", "p1-node"), // 1chaper_3 촌장 주인공 뛰어감
  puzzle("p1-node", 1, 15, "p1", "c1-03"), // 퍼즐1 · 길을 잃은 아이
  cut("c1-03", 1, 16, "c1-03.png", "c1-04"), // 1chaper_4 아이 찾고 후 대화
  cut("c1-04", 1, 17, "c1-04.png", "c1-05"), // 1chaper_5 퍼즐1 해결 붉은실
  cut("c1-05", 1, 18, "c1-05.png", "p2-node"), // 1chaper_6 붉은실 바라봄
  puzzle("p2-node", 1, 19, "p2", "p3-node"), // 퍼즐2 · 약 상자
  puzzle("p3-node", 1, 20, "p3", "c1-06"), // 퍼즐3 · 공동 창고
  cut("c1-06", 1, 21, "c1-06.png", "c1-07"), // 1chaper_8 방에서 쉬는
  cut("c1-07", 1, 22, "c1-07.png", "c1-08"), // 1chaper_9 무리한 부탁1
  cut("c1-08", 1, 23, "c1-08.png", "c1-09"), // 1chaper_10 무리한 부탁 실망
  cut("c1-09", 1, 24, "c1-09.png", "c1-10"), // 1chaper_11 무리한 부탁 2
  cut("c1-10", 1, 25, "c1-10.png", "c1-11"), // 1chaper_12 식량 문제 탓함
  cut("c1-11", 1, 26, "c1-11.png", "c1-12"), // 1chaper_12 재단에 가까이간
  cut("c1-12", 1, 27, "c1-12.png", "c1-13"), // 1chaper_13 붉은실 재단 앞
  cut("c1-13", 1, 28, "c1-13.png", "c1-14"), // 1chaper_14 심한 노이즈
  cut("c1-14", 1, 29, "c1-14.png", "c1-15"), // 1chaper_15 도망치려는
  cut("c1-15", 1, 30, "c1-15.png", "c1-16"), // 1chaper_16 관계의 문 도망
  cut("c1-16", 1, 31, "c1-16.png", "c1-17"), // 1chaper_17 관계방 앞 절망
  cut("c1-17", 1, 32, "c1-17.png", "c2-01"), // 1chaper_17 주황불 다시 띔

  // ── Chapter 2 · 황금의 문과 탑 ────────────────────────────────────────────
  cut("c2-01", 2, 33, "c2-01.png", "c2-02"), // 2chaper_1 황금 이정표 사거리
  cut("c2-02", 2, 34, "c2-02.png", "c2-03"), // 2chaper_2 이정표 신기해함
  cut("c2-03", 2, 35, "c2-03.png", "c2-04"), // 2chaper_3 이정표 길로 향함
  cut("c2-04", 2, 36, "c2-04.png", "c2-05"), // 2chaper_4 황금문 앞
  cut("c2-05", 2, 37, "c2-05.png", "c2-06"), // 2chaper_5 황금문 안으로
  cut("c2-06", 2, 38, "c2-06.png", "c2-07"), // 2chaper_6 궁전과 탑을 봄
  cut("c2-07", 2, 39, "c2-07.png", "c2-08"), // 2chaper_7 탑을 가까이 봄
  cut("c2-08", 2, 40, "c2-08.png", "p4-node"), // 2chaper_8 탑을 완성시켜라 왕
  puzzle("p4-node", 2, 41, "p4", "p5-node"), // 퍼즐4 · 종이컵 / 답 35173
  puzzle("p5-node", 2, 42, "p5", "c2-09"), // 퍼즐5 · 벽돌 암호 / 답 1227
  cut("c2-09", 2, 43, "c2-09.png", "c2-10"), // 2chaper_11 무너지는 탑
  cut("c2-10", 2, 44, "c2-10.png", "c2-11"), // 2chaper_12 무너진 탑 도망
  cut("c2-11", 2, 45, "c2-11.png", "c3-01"), // 2chaper_13 문에서 울고있는

  // ── Chapter 3 · 현재 확보된 이미지 ────────────────────────────────────────
  cut("c3-01", 3, 46, "c3-01.png", "c3-02"), // chaper3_2 노이즈 해결 아직
  cut("c3-02", 3, 47, "c3-02.png", "c3-03"), // chaper3_5 주황 빛으로 달려감
  cut("c3-03", 3, 48, "c3-03.png", "story-incomplete"), // chaper3_6 억압받는

  // Chapter 3 미완성. 이후 이미지가 준비되면 이 위에 새 노드를 추가하고
  // c3-03.nextId만 새 노드 ID로 바꾼다.
  {
    id: "story-incomplete",
    type: "placeholder",
    chapter: 3,
    order: 49,
    label: "다음 장면 준비 중",
    nextId: null,
  },
];

// 노드 빠른 조회 맵
export const storyNodeMap: Record<string, StoryNode> = Object.fromEntries(
  storyManifest.map((node) => [node.id, node]),
);

/** 최초 진입 노드 (start 버튼이 눌리기 전 화면) */
export const START_NODE_ID = "start";

/** 인트로부터 실제 스토리가 시작되는 노드 */
export const FIRST_STORY_NODE_ID = "intro-video";
