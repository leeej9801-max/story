// 진행 상태 저장 (지시서 v2 · 12장)

import type { SavedProgressV2 } from "../types/sequence";
import { FIRST_STEP_ID, stepMap } from "../data/sequenceManifest";

export const PROGRESS_KEY = "the-road-video-flow-v2";

/** v1(정지 컷신 구조) 저장 키. v2에서는 사용하지 않으므로 정리 대상이다. */
const LEGACY_KEY = "the-road-progress-v1";

export function createInitialProgress(): SavedProgressV2 {
  return {
    currentStepId: FIRST_STEP_ID,
    videoCurrentTime: 0,
    completedPuzzleIds: [],
    puzzleAttempts: {},
    gimmickCompletedIds: [],
    updatedAt: new Date().toISOString(),
  };
}

function toStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((v): v is string => typeof v === "string") : [];
}

export function loadProgress(): SavedProgressV2 | null {
  try {
    const raw = localStorage.getItem(PROGRESS_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as Partial<SavedProgressV2>;
    if (!parsed || typeof parsed.currentStepId !== "string") return null;

    // 저장된 단계 ID가 manifest에 없으면(구조 변경 등) 처음부터 안전 복구한다.
    if (!stepMap[parsed.currentStepId]) return null;

    const time = Number(parsed.videoCurrentTime);

    return {
      currentStepId: parsed.currentStepId,
      videoCurrentTime: Number.isFinite(time) && time > 0 ? time : 0,
      completedPuzzleIds: toStringArray(parsed.completedPuzzleIds),
      puzzleAttempts:
        parsed.puzzleAttempts && typeof parsed.puzzleAttempts === "object"
          ? (parsed.puzzleAttempts as Record<string, number>)
          : {},
      gimmickCompletedIds: toStringArray(parsed.gimmickCompletedIds),
      updatedAt: new Date().toISOString(),
    };
  } catch {
    // 파싱 실패 시에도 흰 화면이 되지 않도록 null 반환 → 앱은 새 진행으로 시작
    return null;
  }
}

export function saveProgress(progress: SavedProgressV2): void {
  try {
    const next: SavedProgressV2 = { ...progress, updatedAt: new Date().toISOString() };
    localStorage.setItem(PROGRESS_KEY, JSON.stringify(next));
  } catch {
    // 저장 실패는 무시 (사생활 모드 등). 진행 자체는 계속 가능해야 한다.
  }
}

export function clearProgress(): void {
  try {
    localStorage.removeItem(PROGRESS_KEY);
    localStorage.removeItem(LEGACY_KEY);
  } catch {
    /* noop */
  }
}
