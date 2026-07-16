// 퍼즐 / 기믹 오디오 매니페스트 (지시서 v2 · 11장)
//
// 영상에는 대사·자막·장면 효과음이 이미 포함되어 있다.
// 퍼즐 화면은 영상이 아니므로 BGM과 효과음을 별도 파일로 재생한다.
//
// 재생 규칙:
//  - 퍼즐 BGM은 정답을 맞출 때까지 반복 재생한다.
//  - 정답을 맞히면 3초에 걸쳐 페이드아웃하고, 그 뒤에 다음 영상 또는 성공 이미지가 나온다.
//
// 준비된 음원 (원본은 story/asset_0/에 받은 그대로 보관):
//   puzzle-01-bgm.mp3            1분 00초   퍼즐 1
//   puzzle-23-bgm.mp3            2분 50초   퍼즐 2·3 공용
//   puzzle-45-bgm.mp3            2분 44초   퍼즐 4·5 공용
//   puzzle-67-bgm.mp3            2분 37초   퍼즐 7·8 공용 (소음 + 말씀이 섞인 트랙)
//   noise-layer-01-cleared.mp3     13.0초   퍼즐 7 정답 음성  ← 받은 이름: puzzle-06-cleared.mp3
//   noise-layer-02-cleared.mp3     12.5초   퍼즐 8 정답 음성  ← 받은 이름: puzzle-07-cleared.mp3
//
// ⚠ 퍼즐 번호가 두 가지로 쓰인다.
//   기획 쪽은 입력 퍼즐만 1~8로 세고(기믹 제외), 코드는 지시서대로 1~5·7~9를 쓴다.
//   그래서 받은 파일의 "06/07"은 코드의 puzzle-07/puzzle-08을 뜻한다.
//   받은 이름을 그대로 두면 이미지 puzzle-07-cleared.png(= 코드 puzzle-07용)와
//   음성 puzzle-07-cleared.mp3(= 코드 puzzle-08용)가 헷갈리므로 코드 번호 기준으로 바꿔 두었다.
//
// 아직 없는 음원(효과음·기믹·퍼즐 9 BGM)은 경로만 잡아 두었다.
// 파일이 없으면 audio 컨트롤러가 조용히 무시하므로 진행에는 영향이 없다.

const COMMON = "/assets/audio/common";
const PUZZLES = "/assets/audio/puzzles";
const GIMMICKS = "/assets/audio/gimmicks";

/** 권장 볼륨 (지시서 11.3) */
export const VOLUME = {
  bgm: 0.32, // 퍼즐 BGM 0.25~0.4
  noiseBgm: 0.35, // 노이즈 퍼즐 BGM 0.35 이하
  open: 0.55, // 진입 효과음
  wrong: 0.6, // 오답 효과음
  correct: 0.7, // 정답 효과음 / 성공 음성
} as const;

/**
 * 정답 성공 시 BGM 페이드아웃 시간.
 * 이 시간이 끝난 뒤에 다음 영상 또는 성공 이미지가 시작되므로,
 * 퍼즐 BGM과 다음 오디오가 겹치지 않는다.
 */
export const BGM_FADE_MS = 3000;

export interface PuzzleAudioSet {
  /** 퍼즐 진입음 (1회) */
  open: string;
  /** 반복 재생 BGM */
  bgm: string;
  bgmVolume: number;
  /** 정답 효과음 */
  correct: string;
  /** 오답 효과음 */
  wrong: string;
}

export const puzzleAudio: Record<string, PuzzleAudioSet> = {
  "puzzle-01": {
    open: `${COMMON}/puzzle-open.wav`,
    bgm: `${PUZZLES}/puzzle-01-bgm.mp3`,
    bgmVolume: VOLUME.bgm,
    correct: `${COMMON}/correct.wav`,
    wrong: `${COMMON}/wrong.wav`,
  },

  // 퍼즐 2·3은 같은 BGM을 쓴다. 퍼즐 2를 풀고 퍼즐 3으로 넘어갈 때
  // 같은 곡이면 audio 컨트롤러가 다시 시작하지 않고 이어서 재생한다.
  "puzzle-02": {
    open: `${COMMON}/puzzle-open.wav`,
    bgm: `${PUZZLES}/puzzle-23-bgm.mp3`,
    bgmVolume: VOLUME.bgm,
    correct: `${COMMON}/correct.wav`,
    wrong: `${COMMON}/wrong.wav`,
  },
  "puzzle-03": {
    open: `${COMMON}/puzzle-open.wav`,
    bgm: `${PUZZLES}/puzzle-23-bgm.mp3`,
    bgmVolume: VOLUME.bgm,
    correct: `${COMMON}/correct.wav`,
    wrong: `${COMMON}/wrong.wav`,
  },

  // 퍼즐 4·5 공용 BGM
  "puzzle-04": {
    open: `${COMMON}/puzzle-open.wav`,
    bgm: `${PUZZLES}/puzzle-45-bgm.mp3`,
    bgmVolume: VOLUME.bgm,
    correct: `${COMMON}/correct.wav`,
    wrong: `${COMMON}/wrong.wav`,
  },
  "puzzle-05": {
    open: `${COMMON}/puzzle-open.wav`,
    bgm: `${PUZZLES}/puzzle-45-bgm.mp3`,
    bgmVolume: VOLUME.bgm,
    correct: `${COMMON}/correct.wav`,
    wrong: `${COMMON}/wrong.wav`,
  },

  // ── 노이즈 퍼즐 7·8 ──────────────────────────────────────────────────────
  // 진입음·오답음이 일반 퍼즐과 다르고, BGM은 둘이 같은 곡을 공유한다.
  //
  // puzzle-67-bgm.mp3는 소음 속에 말씀이 섞여 있는 트랙(= 퍼즐 그 자체)이다.
  // 참가자는 이 소리를 들으며 말씀을 받아 적는다. 정답을 맞출 때까지 반복 재생된다.
  //
  // ⚠ 7·8의 correct는 짧은 효과음이 아니라 **성공 이미지와 함께 나오는 음성**이다.
  //   (puzzleManifest의 successImageSrc와 짝을 이룬다.)
  //   성공 이미지는 이 음성이 끝날 때까지 화면에 유지된다.
  //
  //   noise-layer-01-cleared.mp3 (13.0초) = "너는 사람들의 평가로 정해지는 존재가 아니다 …"
  //   noise-layer-02-cleared.mp3 (12.5초) = "너를 높이기 위해 탑을 아무리 높이 쌓아도 …"
  //
  // 성공 이미지는 이 음성 길이에 맞춰 자동으로 유지되므로
  // puzzleManifest의 successRevealMs는 음성이 없을 때만 쓰이는 예비값이다.
  "puzzle-07": {
    open: `${COMMON}/glitch-open.wav`,
    bgm: `${PUZZLES}/puzzle-67-bgm.mp3`,
    bgmVolume: VOLUME.noiseBgm,
    correct: `${PUZZLES}/noise-layer-01-cleared.mp3`,
    wrong: `${COMMON}/noise-wrong.wav`,
  },
  "puzzle-08": {
    open: `${COMMON}/glitch-open.wav`,
    bgm: `${PUZZLES}/puzzle-67-bgm.mp3`,
    bgmVolume: VOLUME.noiseBgm,
    correct: `${PUZZLES}/noise-layer-02-cleared.mp3`,
    wrong: `${COMMON}/noise-wrong.wav`,
  },

  // 빛 퍼즐: 마지막 고백. 정답 후 영상 7과 자연스럽게 이어진다.
  "puzzle-09": {
    open: `${COMMON}/light-open.wav`,
    bgm: `${PUZZLES}/puzzle-09-light-loop.mp3`,
    bgmVolume: VOLUME.bgm,
    correct: `${PUZZLES}/light-cleared.wav`,
    wrong: `${COMMON}/wrong-soft.wav`,
  },
};

export interface GimmickAudioSet {
  prompt: string;
  tick: string;
  timeout: string;
}

export const gimmickAudio: Record<string, GimmickAudioSet> = {
  "gimmick-06": {
    prompt: `${GIMMICKS}/gimmick-06-prompt.wav`,
    tick: `${GIMMICKS}/gimmick-06-tick.wav`,
    timeout: `${GIMMICKS}/gimmick-06-timeout.wav`,
  },
};

export function getPuzzleAudio(puzzleId: string): PuzzleAudioSet | undefined {
  return puzzleAudio[puzzleId];
}

export function getGimmickAudio(gimmickId: string): GimmickAudioSet | undefined {
  return gimmickAudio[gimmickId];
}
