// localStorage 진행 상태 저장 (명세 15장)

import type { SavedProgress } from "../types/story";
import { START_NODE_ID, storyNodeMap } from "../data/storyManifest";

export const PROGRESS_KEY = "the-road-progress-v1";

export function createInitialProgress(startNodeId: string): SavedProgress {
  const now = new Date().toISOString();
  return {
    currentNodeId: startNodeId,
    lastCutsceneNodeId: null,
    completedPuzzleIds: [],
    puzzleAttempts: {},
    startedAt: now,
    updatedAt: now,
  };
}

export function loadProgress(): SavedProgress | null {
  try {
    const raw = localStorage.getItem(PROGRESS_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as Partial<SavedProgress>;
    if (!parsed || typeof parsed.currentNodeId !== "string") return null;

    // 저장된 노드 ID가 manifest에 없으면 start로 안전 복구한다.
    const safeNodeId = storyNodeMap[parsed.currentNodeId]
      ? parsed.currentNodeId
      : START_NODE_ID;

    return {
      currentNodeId: safeNodeId,
      lastCutsceneNodeId:
        typeof parsed.lastCutsceneNodeId === "string" &&
        storyNodeMap[parsed.lastCutsceneNodeId]
          ? parsed.lastCutsceneNodeId
          : null,
      completedPuzzleIds: Array.isArray(parsed.completedPuzzleIds)
        ? parsed.completedPuzzleIds.filter((v): v is string => typeof v === "string")
        : [],
      puzzleAttempts:
        parsed.puzzleAttempts && typeof parsed.puzzleAttempts === "object"
          ? (parsed.puzzleAttempts as Record<string, number>)
          : {},
      startedAt:
        typeof parsed.startedAt === "string"
          ? parsed.startedAt
          : new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  } catch {
    // 파싱 실패 시에도 흰 화면이 되지 않도록 null 반환 → 앱은 새 진행으로 시작
    return null;
  }
}

export function saveProgress(progress: SavedProgress): void {
  try {
    const next: SavedProgress = { ...progress, updatedAt: new Date().toISOString() };
    localStorage.setItem(PROGRESS_KEY, JSON.stringify(next));
  } catch {
    // 저장 실패는 무시 (사생활 모드 등). 진행 자체는 계속 가능해야 한다.
  }
}

export function clearProgress(): void {
  try {
    localStorage.removeItem(PROGRESS_KEY);
  } catch {
    /* noop */
  }
}

export function hasSavedProgress(): boolean {
  return loadProgress() !== null;
}
