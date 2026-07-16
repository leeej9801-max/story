// 퍼즐 / 기믹 오디오 매니페스트 (지시서 v2 · 11장)
//
// 영상에는 대사·자막·장면 효과음이 이미 포함되어 있다.
// 퍼즐 화면은 영상이 아니므로 BGM과 효과음을 별도 파일로 재생한다.
//
// ⚠ 음원 파일은 아직 준비 중이다.
//   파일이 없으면 audio 컨트롤러가 조용히 무시하므로 진행에는 영향이 없다.
//   아래 경로에 파일을 넣으면 그 즉시 재생된다.

const COMMON = "/assets/audio/common";
const PUZZLES = "/assets/audio/puzzles";
const GIMMICKS = "/assets/audio/gimmicks";

/** 권장 볼륨 (지시서 11.3) */
export const VOLUME = {
  bgm: 0.32, // 퍼즐 BGM 0.25~0.4
  noiseBgm: 0.35, // 노이즈 퍼즐 BGM 0.35 이하
  open: 0.55, // 진입 효과음
  wrong: 0.6, // 오답 효과음
  correct: 0.7, // 정답 효과음
} as const;

/** 정답 성공 시 BGM 페이드아웃 시간 (지시서 11.3) */
export const BGM_FADE_MS = 400;

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
  "puzzle-02": {
    open: `${COMMON}/puzzle-open.wav`,
    bgm: `${PUZZLES}/puzzle-02-bgm.mp3`,
    bgmVolume: VOLUME.bgm,
    correct: `${COMMON}/correct.wav`,
    wrong: `${COMMON}/wrong.wav`,
  },
  "puzzle-03": {
    open: `${COMMON}/puzzle-open.wav`,
    bgm: `${PUZZLES}/puzzle-03-bgm.mp3`,
    bgmVolume: VOLUME.bgm,
    correct: `${COMMON}/correct.wav`,
    wrong: `${COMMON}/wrong.wav`,
  },
  "puzzle-04": {
    open: `${COMMON}/puzzle-open.wav`,
    bgm: `${PUZZLES}/puzzle-04-bgm.mp3`,
    bgmVolume: VOLUME.bgm,
    correct: `${COMMON}/correct.wav`,
    wrong: `${COMMON}/wrong.wav`,
  },
  "puzzle-05": {
    open: `${COMMON}/puzzle-open.wav`,
    bgm: `${PUZZLES}/puzzle-05-bgm.mp3`,
    bgmVolume: VOLUME.bgm,
    correct: `${COMMON}/correct.wav`,
    wrong: `${COMMON}/wrong.wav`,
  },

  // 노이즈 퍼즐: 진입음·오답음·정답음이 일반 퍼즐과 다르다. (지시서 11.1 / 11.2)
  "puzzle-07": {
    open: `${COMMON}/glitch-open.wav`,
    bgm: `${PUZZLES}/puzzle-07-noise-loop.mp3`,
    bgmVolume: VOLUME.noiseBgm,
    correct: `${PUZZLES}/noise-layer-01-cleared.wav`,
    wrong: `${COMMON}/noise-wrong.wav`,
  },
  "puzzle-08": {
    open: `${COMMON}/glitch-open.wav`,
    bgm: `${PUZZLES}/puzzle-08-noise-loop.mp3`,
    bgmVolume: VOLUME.noiseBgm,
    correct: `${PUZZLES}/noise-layer-02-cleared.wav`,
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
