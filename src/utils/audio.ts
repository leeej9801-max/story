// 퍼즐 / 기믹 오디오 컨트롤러 (지시서 v2 · 11.3)
//
// 재생 규칙:
//  - 영상 재생 중에는 퍼즐 BGM과 효과음을 모두 정지한다. (영상 자체 오디오만 재생)
//  - 퍼즐 진입 시 진입음 1회 → BGM 반복 재생
//  - 정답 성공 시 BGM 페이드아웃 → 정답 효과음
//  - 오답 시 BGM은 유지하고 오답 효과음만 겹쳐 재생
//
// 음원 파일이 아직 없어도 진행이 멈추면 안 되므로, 로드/재생 실패는 모두 조용히 무시한다.

const FADE_STEP_MS = 25;

let bgmEl: HTMLAudioElement | null = null;
let bgmSrc: string | null = null;
let fadeTimer: number | null = null;
const sfxEls = new Set<HTMLAudioElement>();

function noop() {
  /* 음원 없음 / 자동재생 차단 등은 무시한다. */
}

function clearFade() {
  if (fadeTimer !== null) {
    window.clearInterval(fadeTimer);
    fadeTimer = null;
  }
}

function disposeBgm() {
  clearFade();
  if (bgmEl) {
    bgmEl.pause();
    bgmEl.src = "";
    bgmEl = null;
  }
  bgmSrc = null;
}

/**
 * 퍼즐 BGM을 반복 재생한다.
 *
 * 같은 BGM이 "정상 재생 중"일 때만 다시 시작하지 않는다.
 *
 * ⚠ 페이드아웃 중(fadeTimer !== null)이면 같은 곡이어도 반드시 다시 시작해야 한다.
 *   퍼즐 2·3, 4·5, 7·8은 BGM을 공유하는데, 앞 퍼즐 정답의 3초 페이드가 아직 끝나지
 *   않은 채 다음 퍼즐이 시작되면(무거운 큐시트 이미지 디코딩 등으로 타이머가 밀리면
 *   충분히 생긴다) 여기서 그냥 return 해버려 페이드가 계속 돌고, 결국 볼륨이 0이 되어
 *   다음 퍼즐이 무음으로 시작됐다.
 */
export function startBgm(src: string, volume: number): void {
  const sameTrackAlreadyPlaying = bgmSrc === src && bgmEl !== null && !bgmEl.paused;
  if (sameTrackAlreadyPlaying && fadeTimer === null) return;

  // disposeBgm()이 clearFade()도 함께 호출하므로 진행 중이던 페이드가 취소된다.
  disposeBgm();

  try {
    const el = new Audio(src);
    el.loop = true;
    el.volume = volume;
    el.addEventListener("error", noop);
    bgmEl = el;
    bgmSrc = src;

    const p = el.play();
    if (p && typeof p.catch === "function") p.catch(noop);
  } catch {
    disposeBgm();
  }
}

/** BGM을 지정 시간에 걸쳐 페이드아웃한 뒤 정지한다. */
export function fadeOutBgm(durationMs: number): void {
  const el = bgmEl;
  if (!el) return;

  clearFade();

  const startVolume = el.volume;
  const steps = Math.max(1, Math.round(durationMs / FADE_STEP_MS));
  let step = 0;

  fadeTimer = window.setInterval(() => {
    step += 1;
    const next = startVolume * (1 - step / steps);

    if (step >= steps || next <= 0) {
      disposeBgm();
      return;
    }

    try {
      el.volume = Math.max(0, next);
    } catch {
      disposeBgm();
    }
  }, FADE_STEP_MS);
}

/** 효과음 1회 재생. 겹쳐 재생할 수 있다. */
export function playSfx(src: string, volume: number): void {
  try {
    const el = new Audio(src);
    el.volume = volume;
    el.addEventListener("error", () => {
      sfxEls.delete(el);
    });
    el.addEventListener("ended", () => {
      sfxEls.delete(el);
    });
    sfxEls.add(el);

    const p = el.play();
    if (p && typeof p.catch === "function") {
      p.catch(() => {
        sfxEls.delete(el);
      });
    }
  } catch {
    /* 무시 */
  }
}

/**
 * 성공 연출용 음성 재생 (노이즈 퍼즐 7·8).
 *
 * 성공 이미지는 음성이 끝날 때까지 유지되어야 한다. 그래서
 *  - 음성이 정상 재생되면 실제 길이에 맞춰 onDone을 호출하고,
 *  - 음원 파일이 아직 없으면 minHoldMs 후에 onDone을 호출한다.
 * 어느 쪽이든 onDone은 정확히 한 번만 불린다.
 *
 * @returns 타이머를 정리하는 cleanup 함수
 */
export function playVoice(
  src: string,
  volume: number,
  minHoldMs: number,
  onDone: () => void,
): () => void {
  let done = false;
  let timer = 0;

  const finish = () => {
    if (done) return;
    done = true;
    window.clearTimeout(timer);
    onDone();
  };

  // 음원이 없거나 재생이 막혀도 진행이 멈추면 안 되므로 항상 예비 타이머를 건다.
  timer = window.setTimeout(finish, minHoldMs);

  try {
    const el = new Audio(src);
    el.volume = volume;
    sfxEls.add(el);

    // 음성이 예비 타이머보다 길면 실제 길이에 맞춰 연장한다.
    el.addEventListener("loadedmetadata", () => {
      if (done) return;
      const durationMs = el.duration * 1000;
      if (Number.isFinite(durationMs) && durationMs > minHoldMs) {
        window.clearTimeout(timer);
        timer = window.setTimeout(finish, durationMs + 600);
      }
    });

    el.addEventListener("ended", () => {
      sfxEls.delete(el);
      finish();
    });

    el.addEventListener("error", () => {
      // 음원 없음 → 예비 타이머가 그대로 진행을 책임진다.
      sfxEls.delete(el);
    });

    const p = el.play();
    if (p && typeof p.catch === "function") p.catch(noop);
  } catch {
    /* 예비 타이머가 진행을 책임진다. */
  }

  return () => window.clearTimeout(timer);
}

/**
 * 퍼즐 BGM과 효과음을 즉시 모두 정지한다.
 * 영상 재생 직전에 호출해 영상 오디오와 겹치지 않게 한다. (지시서 5.4 / 11.3)
 */
export function stopAllPuzzleAudio(): void {
  disposeBgm();
  for (const el of sfxEls) {
    try {
      el.pause();
      el.src = "";
    } catch {
      /* 무시 */
    }
  }
  sfxEls.clear();
}

/**
 * 디버그 패널용: 현재 재생 중인 오디오 상태 (지시서 13장)
 *
 * volume까지 내보내는 이유: 파일명만 보면 "BGM 정상"으로 보이지만
 * 실제로는 페이드가 돌아 볼륨이 0에 가까운 무음일 수 있다.
 */
export function getActiveAudioSources(): {
  bgm: string | null;
  volume: number | null;
  fading: boolean;
  sfxCount: number;
} {
  return {
    bgm: bgmSrc,
    volume: bgmEl ? Math.round(bgmEl.volume * 100) / 100 : null,
    fading: fadeTimer !== null,
    sfxCount: sfxEls.size,
  };
}
