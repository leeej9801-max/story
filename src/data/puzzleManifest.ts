// 퍼즐 정의 (지시서 v2 · 7장 / 8장)
//
// 퍼즐 번호는 진행 순서와 사용자가 전달한 정답 번호(1,2,3,4,5,7,8,9)에 맞춘다.
// 6번은 정답 입력 퍼즐이 아니라 10초 타이머 기믹이므로 여기에 없다.

export type PuzzleAnswerType = "text" | "number";
export type MatchMode = "exact" | "contains";

export interface PuzzleDefinition {
  id: string;
  title: string;
  cueImageSrc: string;
  answerType: PuzzleAnswerType;
  matchMode: MatchMode;
  acceptedAnswers: string[];
  /** 장문 입력이 필요한 퍼즐(7·8)은 textarea를 사용한다. (지시서 10.2) */
  longInput?: boolean;
  placeholder?: string;
  successMessage?: string;
  /** 정답 효과음이 끝날 때까지 유지할 시간. (지시서 11.3 · 1.2~2.5초) */
  successHoldMs?: number;
  /**
   * 큐시트 이미지가 아직 준비되지 않은 퍼즐. 정답 검증은 정상 동작한다.
   * 큐시트 PNG를 public/assets/puzzles/에 넣으면 이 필드만 지우면 된다.
   */
  cuePending?: boolean;
  /** 큐시트가 준비되기 전까지 큐시트 자리에 표시할 임시 문구. */
  cueFallbackText?: string;
}

export const puzzles: Record<string, PuzzleDefinition> = {
  "puzzle-01": {
    id: "puzzle-01",
    title: "길을 잃은 아이",
    cueImageSrc: "/assets/puzzles/puzzle-01-cue.png",
    answerType: "text",
    matchMode: "exact",
    acceptedAnswers: ["식량 창고 구석"],
    placeholder: "장소 이름 입력",
    successMessage: "아이의 위치를 확인했습니다.",
    successHoldMs: 1400,
  },

  "puzzle-02": {
    id: "puzzle-02",
    title: "닫힌 약 상자",
    cueImageSrc: "/assets/puzzles/puzzle-02-cue.png",
    answerType: "number",
    // 문자열로 저장한다. 숫자 타입이면 앞자리 0이 사라진다. (지시서 7장 · 퍼즐 2 주의)
    matchMode: "exact",
    acceptedAnswers: ["0912"],
    placeholder: "4자리 비밀번호 입력",
    successMessage: "약 상자가 열렸습니다.",
    successHoldMs: 1400,
  },

  "puzzle-03": {
    id: "puzzle-03",
    title: "공동 식량 창고의 마법 지도",
    cueImageSrc: "/assets/puzzles/puzzle-03-cue.png",
    answerType: "text",
    matchMode: "exact",
    acceptedAnswers: ["마법의 지도"],
    placeholder: "확인 문구 입력",
    successMessage: "창고의 지도가 완성되었습니다.",
    successHoldMs: 1400,
  },

  "puzzle-04": {
    id: "puzzle-04",
    title: "종이컵 암호",
    cueImageSrc: "/assets/puzzles/puzzle-04-cue.png",
    answerType: "number",
    matchMode: "exact",
    acceptedAnswers: ["35173"],
    placeholder: "5자리 숫자 입력",
    successMessage: "첫 번째 탑의 관문이 열렸습니다.",
    successHoldMs: 1400,
  },

  "puzzle-05": {
    id: "puzzle-05",
    title: "벽돌 모양 암호",
    cueImageSrc: "/assets/puzzles/puzzle-05-cue.png",
    answerType: "number",
    matchMode: "exact",
    acceptedAnswers: ["1227"],
    placeholder: "4자리 숫자 입력",
    successMessage: "두 번째 탑의 관문이 열렸습니다.",
    successHoldMs: 1400,
  },

  // 퍼즐 6은 없다. 6번은 기믹(10초 타이머)이다.

  "puzzle-07": {
    id: "puzzle-07",
    title: "노이즈 제거 1",
    cueImageSrc: "/assets/puzzles/puzzle-07-cue.png",
    answerType: "text",
    // 핵심 문장이 포함되면 앞뒤에 다른 글자가 있어도 정답. (지시서 7장)
    matchMode: "contains",
    acceptedAnswers: [
      "사람을 두려워하면 올무에 걸리게 되거니와",
      // 사용자 원문 표기가 `울무`이므로 오입력 방지를 위해 함께 허용한다.
      "사람을 두려워하면 울무에 걸리게 되거니와",
    ],
    longInput: true,
    placeholder: "복원한 문장 입력",
    successMessage: "첫 번째 노이즈가 걷혔습니다.",
    successHoldMs: 1800,
    cuePending: true,
    cueFallbackText:
      "소음 속에 감춰진 첫 번째 문장을 복원해 주세요.\n들리는 대로 문장 전체를 입력하세요.",
  },

  "puzzle-08": {
    id: "puzzle-08",
    title: "노이즈 제거 2",
    cueImageSrc: "/assets/puzzles/puzzle-08-cue.png",
    answerType: "text",
    matchMode: "contains",
    acceptedAnswers: ["그런즉 너희는 먼저 그의 나라와 그의 의를 구하라"],
    longInput: true,
    placeholder: "복원한 문장 입력",
    successMessage: "음성이 또렷하게 들립니다.",
    successHoldMs: 1800,
    cuePending: true,
    cueFallbackText:
      "노이즈가 약해졌습니다.\n두 번째 문장을 복원해 주세요.",
  },

  "puzzle-09": {
    id: "puzzle-09",
    title: "걸어온 길의 모양",
    cueImageSrc: "/assets/puzzles/puzzle-09-cue.png",
    answerType: "text",
    matchMode: "exact",
    // `CROSS`는 현재 정답으로 등록하지 않는다. (지시서 7장 · 퍼즐 9)
    acceptedAnswers: ["십자가"],
    placeholder: "정답 입력",
    successMessage: "빛을 가리던 장막이 걷힙니다.",
    successHoldMs: 2200,
    cuePending: true,
    // 지시서 10.2의 퍼즐 9 권장 표시 문구
    cueFallbackText:
      "여행자가 빛 너머로 건너갈 수 있게 도와주세요!\n\n지금까지 걸어왔던 길을 생각하며\n다음 고백을 완성하여 정답을 입력해 주세요.\n\n[나의 모든 여정은 ______ 위에 놓여 있었다]",
  },
};

export function getPuzzle(puzzleId: string): PuzzleDefinition | undefined {
  return puzzles[puzzleId];
}
