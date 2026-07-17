// 퍼즐 정의 (지시서 v2 · 7장 / 8장)
//
// 퍼즐 번호는 진행 순서와 사용자가 전달한 정답 번호(1,2,3,4,5,7,8,9)에 맞춘다.
// 6번은 정답 입력 퍼즐이 아니라 10초 타이머 기믹이므로 여기에 없다.

export type PuzzleAnswerType = "text" | "number";
export type MatchMode = "exact" | "contains";

/**
 * 퍼즐 화면 레이아웃.
 *  - "frame": 공통 퍼즐 프레임(puzzle-frame.png) + 큐시트. 기본값.
 *  - "scene": 장면 이미지를 배경으로 깔고 그 위에 설명 박스 + 입력줄. 노이즈 퍼즐(7·8)용.
 */
export type PuzzleLayout = "frame" | "scene";

export interface PuzzleDefinition {
  id: string;
  title: string;
  answerType: PuzzleAnswerType;
  matchMode: MatchMode;
  acceptedAnswers: string[];
  /** 장문 입력이 필요한 퍼즐(7·8)은 textarea를 사용한다. (지시서 10.2) */
  longInput?: boolean;
  placeholder?: string;
  successMessage?: string;
  /**
   * 정답 후 다음 단계로 넘어가기까지의 대기 시간.
   * 지정하지 않으면 BGM 페이드아웃(3초)이 끝나는 시점에 맞춰 넘어간다.
   */
  successHoldMs?: number;

  // ── frame 레이아웃 (퍼즐 1~5, 9) ──────────────────────────────────────────
  /** 공통 프레임 안에 표시할 큐시트. layout이 "frame"일 때만 사용한다. */
  cueImageSrc?: string;
  /**
   * 큐시트 이미지가 아직 준비되지 않은 퍼즐. 정답 검증은 정상 동작한다.
   * 큐시트 PNG를 public/assets/puzzles/에 넣으면 이 필드만 지우면 된다.
   */
  cuePending?: boolean;
  /** 큐시트가 준비되기 전까지 큐시트 자리에 표시할 임시 문구. */
  cueFallbackText?: string;
  /**
   * 큐시트 오른쪽 위에 얹는 짧은 운영 안내. 잉크 도장처럼 표시된다.
   * 예: "정답은 카톡에!"
   */
  cueNote?: string;
  /**
   * 큐시트 삽화 아래(왼쪽 여백)에 얹는 몰입용 메모. 손으로 적어둔 글씨처럼 표시된다.
   * 도장(cueNote)이 운영 안내라면 이쪽은 주인공의 혼잣말·현실 행동 지시에 가깝다.
   * 예: "이 방 어딘가에 단서가 흩어져 있다 찾아보자"
   */
  cueAside?: string;
  /**
   * 큐시트 오른쪽 위 빈 여백에 얹는 퍼즐 규칙. 도장(cueNote) 아래에 놓인다.
   * 큐시트 이미지에 빠진 규칙을 덧붙일 때 쓴다.
   * 줄바꿈(\n)을 그대로 살린다.
   */
  cueRule?: string;

  // ── scene 레이아웃 (퍼즐 7·8·9) ───────────────────────────────────────────
  layout?: PuzzleLayout;
  /** 화면 전체에 깔 배경 장면. layout이 "scene"일 때 사용한다. */
  backgroundSrc?: string;
  /** 배경 위 설명 박스에 들어갈 글. 목탄·양피지 질감으로 표시된다. (없으면 표시 안 함) */
  briefText?: string;
  /**
   * 입력줄(입력창 + 정답 버튼) 위치. 배경 이미지 기준 % 좌표.
   * 배경에 입력칸이 이미 그려져 있으면(퍼즐 9) 그 위에 맞춘다.
   * 지정하지 않으면 노이즈 퍼즐용 하단 기본값을 쓴다.
   */
  inputRect?: { left: string; top: string; width: string; height: string };

  // ── 정답 후 연출 (퍼즐 7·8) ───────────────────────────────────────────────
  /**
   * 정답 직후 전체 화면으로 보여줄 이미지. 지정하면 이 이미지를 띄우고
   * successVoice(= audioManifest의 correct)를 재생한 뒤 다음 단계로 넘어간다.
   */
  successImageSrc?: string;
  /**
   * 성공 이미지를 유지할 최소 시간(ms).
   * 음성 파일이 있으면 음성이 끝날 때까지 자동으로 늘어난다.
   * 음성 파일이 아직 없으면 이 시간만큼만 보여 준다.
   */
  successRevealMs?: number;
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
    cueNote: "정답은 카톡에!",
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
    // 삽화 속 방(약 상자가 있는 방)을 가리키는 위치에 놓인다.
    cueAside: "이 방 어딘가에 단서가 흩어져 있다 찾아보자",
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
    cueNote: "정답은 카톡에!",
    // 큐시트 이미지에 빠진 규칙. 화살표는 → 로 표시한다.
    // 줄바꿈은 그대로 표시되므로, 도장 아래 ~ "상황" 구분선 위 여백에 들어가도록
    // 3줄로 끊어 둔다. 문구를 고칠 때는 줄 길이도 함께 확인할 것.
    cueRule: "규칙!\n반드시 빨간→파란 혹은 파란→빨간\n문을 교차해서 지도를 완성할 것!",
  },

  "puzzle-04": {
    id: "puzzle-04",
    title: "종이컵 암호",
    cueImageSrc: "/assets/puzzles/puzzle-04-cue.png",
    answerType: "number",
    matchMode: "exact",
    // 종이컵의 E.L.I.S.E를 뒤집으면 숫자가 된다. E=3 L=7 I=1 S=5 E=3
    // (지시서 v2 7장에는 35173으로 적혀 있으나 자릿수가 바뀐 오타다. 큐시트 기준 37153이 정답.)
    acceptedAnswers: ["37153"],
    placeholder: "5자리 숫자 입력",
    successMessage: "첫 번째 탑의 관문이 열렸습니다.",
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
  },

  // 퍼즐 6은 없다. 6번은 기믹(10초 타이머)이다.

  // ── 노이즈 퍼즐 7·8 ────────────────────────────────────────────────────────
  // 다른 퍼즐과 달리 공통 프레임/큐시트를 쓰지 않는다.
  // 노이즈 장면을 배경으로 깔고 그 위에 설명 박스 + 입력줄만 얹는다.
  // 정답을 맞히면 성공 이미지를 전체 화면으로 띄우고 음성을 재생한 뒤 다음 단계로 넘어간다.

  "puzzle-07": {
    id: "puzzle-07",
    title: "노이즈 제거 1",
    layout: "scene",
    backgroundSrc: "/assets/puzzles/puzzle-noise-bg.png",
    briefText:
      "나를 계속 따라 오는 알 수 없는 소음.\n하지만 무언가... 나에게 다르게 들릴지도 모른다.\n이 소음을 해석 하기 위해 알맞는 말씀을 입력하라!",
    answerType: "text",
    // 핵심 문장이 포함되면 앞뒤에 다른 글자가 있어도 정답. (지시서 7장)
    matchMode: "contains",
    acceptedAnswers: [
      "사람을 두려워하면 올무에 걸리게 되거니와",
      // 사용자 원문 표기가 `울무`이므로 오입력 방지를 위해 함께 허용한다.
      "사람을 두려워하면 울무에 걸리게 되거니와",
    ],
    longInput: true,
    placeholder: "말씀을 입력하라",
    successImageSrc: "/assets/puzzles/puzzle-07-cleared.png",
    // 음성(audioManifest의 correct)이 준비되면 음성 길이에 맞춰 자동으로 늘어난다.
    successRevealMs: 6000,
  },

  "puzzle-08": {
    id: "puzzle-08",
    title: "노이즈 제거 2",
    layout: "scene",
    backgroundSrc: "/assets/puzzles/puzzle-noise-bg.png",
    briefText:
      "나를 계속 따라 오는 알 수 없는 소음.\n하지만 무언가... 나에게 다르게 들릴지도 모른다.\n이 소음을 해석 하기 위해 알맞는 말씀을 입력하라!",
    answerType: "text",
    matchMode: "contains",
    acceptedAnswers: ["그런즉 너희는 먼저 그의 나라와 그의 의를 구하라"],
    longInput: true,
    placeholder: "말씀을 입력하라",
    successImageSrc: "/assets/puzzles/puzzle-08-cleared.png",
    // 성공 이미지 2는 문장이 더 많으므로 음성이 없을 때의 기본 노출 시간도 길게 잡는다.
    successRevealMs: 9000,
  },

  // 퍼즐 9도 공통 프레임을 쓰지 않는다.
  // 큐시트 이미지 자체가 전체 화면 장면이고 안내 문구와 입력칸까지 그려져 있어서,
  // 그려진 입력칸 위에 진짜 입력창을 겹치고 옆에 정답 버튼만 얹는다.
  "puzzle-09": {
    id: "puzzle-09",
    title: "걸어온 길의 모양",
    layout: "scene",
    backgroundSrc: "/assets/puzzles/puzzle9_cue.png",
    // briefText 없음 — 설명이 배경 이미지에 이미 인쇄되어 있다.
    answerType: "text",
    matchMode: "exact",
    // `CROSS`는 현재 정답으로 등록하지 않는다. (지시서 7장 · 퍼즐 9)
    acceptedAnswers: ["십자가"],
    placeholder: "정답 입력",
    successMessage: "빛을 가리던 장막이 걷힙니다.",
    // 배경에 그려진 입력칸에 맞춘 좌표
    inputRect: { left: "26%", top: "53.4%", width: "48.4%", height: "8.2%" },
    // 정답 후 빛이 걷히는 여운. (기존 3초 + 2초)
    successHoldMs: 5000,
  },
};

export function getPuzzle(puzzleId: string): PuzzleDefinition | undefined {
  return puzzles[puzzleId];
}
