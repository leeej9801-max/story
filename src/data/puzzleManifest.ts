// 퍼즐 정의 (명세 10장)
// 새 퍼즐은 cue 이미지 + 이 파일 항목 추가만으로 구현할 수 있어야 한다.

export type PuzzleInputType = "text" | "number";

export interface PuzzleDefinition {
  id: string;
  title: string;
  cueImageSrc: string;
  inputType: PuzzleInputType;
  acceptedAnswers: string[];
  placeholder?: string;
  successMessage?: string;
  enabled: boolean;
}

/** 정답이 확정되지 않은 퍼즐의 자리표시자. build 검증 스크립트가 이 값을 감지한다. */
export const ANSWER_REQUIRED = "__ANSWER_REQUIRED__";

export const puzzles: Record<string, PuzzleDefinition> = {
  p1: {
    id: "p1",
    title: "첫 번째 부탁 - 길을 잃은 아이",
    cueImageSrc: "/assets/puzzles/p1-cue.png",
    inputType: "text",
    acceptedAnswers: [ANSWER_REQUIRED],
    placeholder: "장소 이름 입력",
    successMessage: "아이의 위치를 확인했습니다.",
    enabled: false,
  },

  p2: {
    id: "p2",
    title: "두 번째 부탁 - 닫힌 약 상자",
    cueImageSrc: "/assets/puzzles/p2-cue.png",
    inputType: "number",
    acceptedAnswers: [ANSWER_REQUIRED],
    placeholder: "비밀번호 입력",
    successMessage: "약 상자가 열렸습니다.",
    enabled: false,
  },

  p3: {
    id: "p3",
    title: "세 번째 부탁 - 공동 창고의 동선",
    cueImageSrc: "/assets/puzzles/p3-cue.png",
    inputType: "text",
    acceptedAnswers: [ANSWER_REQUIRED],
    placeholder: "확인한 정답 입력",
    successMessage: "창고의 안전한 동선을 확인했습니다.",
    enabled: false,
  },

  p4: {
    id: "p4",
    title: "첫 번째 탑의 관문",
    cueImageSrc: "/assets/puzzles/p4-cue.png",
    inputType: "number",
    acceptedAnswers: ["35173"],
    placeholder: "5자리 비밀번호 입력",
    successMessage: "첫 번째 탑의 관문이 열렸습니다.",
    enabled: true,
  },

  p5: {
    id: "p5",
    title: "벽돌 모양 암호",
    cueImageSrc: "/assets/puzzles/p5-cue.png",
    inputType: "number",
    acceptedAnswers: ["1227"],
    placeholder: "4자리 비밀번호 입력",
    successMessage: "두 번째 탑의 관문이 열렸습니다.",
    enabled: true,
  },

  p6: {
    id: "p6",
    title: "마지막 길의 모양",
    cueImageSrc: "/assets/puzzles/p6-cue.png",
    inputType: "text",
    acceptedAnswers: ["CROSS", "십자가"],
    placeholder: "정답 입력",
    successMessage: "빛을 가리던 장막이 걷힙니다.",
    enabled: false,
  },
};

export function getPuzzle(puzzleId: string): PuzzleDefinition | undefined {
  return puzzles[puzzleId];
}
