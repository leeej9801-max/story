import { useCallback, useMemo, useState } from "react";
import type { SavedProgressV2, SequenceStep } from "../types/sequence";
import { FIRST_STEP_ID, stepMap } from "../data/sequenceManifest";
import { clearProgress, createInitialProgress, loadProgress, saveProgress } from "../utils/storage";

// 진행 상태의 단일 소스. currentStepId 하나로 전체 흐름을 제어한다. (지시서 4장 / 12장)
//
// currentStepId === null 이면 시퀀스 밖의 시작 화면이다.
//
// @param initialStepId 디버그 모드에서 특정 단계로 바로 진입할 때만 사용한다. (지시서 13장)
export function useSequenceProgress(initialStepId?: string | null) {
  // 저장 데이터를 읽어 진행 메타를 복원하되, 화면 자체는 항상 시작 화면부터 시작한다.
  const [progress, setProgress] = useState<SavedProgressV2>(
    () => loadProgress() ?? createInitialProgress(),
  );
  const [currentStepId, setCurrentStepId] = useState<string | null>(
    initialStepId && stepMap[initialStepId] ? initialStepId : null,
  );

  const currentStep: SequenceStep | null =
    currentStepId !== null ? (stepMap[currentStepId] ?? null) : null;

  // 이어하기 대상: 저장된 진행 위치가 첫 단계가 아니고 manifest에 존재할 때.
  const resumeStepId = useMemo<string | null>(() => {
    const saved = progress.currentStepId;
    return saved !== FIRST_STEP_ID && stepMap[saved] ? saved : null;
  }, [progress.currentStepId]);

  const persist = useCallback((updater: (prev: SavedProgressV2) => SavedProgressV2) => {
    setProgress((prev) => {
      const next = updater(prev);
      saveProgress(next);
      return next;
    });
  }, []);

  /** 단계 이동 + 저장. 새 단계이므로 영상 재생 위치는 0으로 초기화한다. (지시서 12장) */
  const goToStep = useCallback(
    (stepId: string) => {
      if (!stepMap[stepId]) return;
      setCurrentStepId(stepId);
      persist((prev) => ({ ...prev, currentStepId: stepId, videoCurrentTime: 0 }));
    },
    [persist],
  );

  /** 시작하기: 처음부터 진행한다. */
  const startNew = useCallback(() => {
    clearProgress();
    const fresh = createInitialProgress();
    setProgress(fresh);
    saveProgress(fresh);
    setCurrentStepId(FIRST_STEP_ID);
  }, []);

  /**
   * 이어하기: 저장된 위치로 이동한다.
   * 영상 단계면 저장된 시간부터 재생되도록 videoCurrentTime을 초기화하지 않는다.
   */
  const continueGame = useCallback(() => {
    const target = resumeStepId ?? FIRST_STEP_ID;
    setCurrentStepId(target);
  }, [resumeStepId]);

  /** 처음으로: 저장 기록을 지우고 시작 화면으로 돌아간다. */
  const restart = useCallback(() => {
    clearProgress();
    setProgress(createInitialProgress());
    setCurrentStepId(null);
  }, []);

  /** 영상 재생 중 2초마다 호출된다. (지시서 12장) */
  const saveVideoTime = useCallback(
    (time: number) => {
      persist((prev) => ({ ...prev, videoCurrentTime: time }));
    },
    [persist],
  );

  const recordPuzzleAttempt = useCallback(
    (puzzleId: string) => {
      persist((prev) => ({
        ...prev,
        puzzleAttempts: {
          ...prev.puzzleAttempts,
          [puzzleId]: (prev.puzzleAttempts[puzzleId] ?? 0) + 1,
        },
      }));
    },
    [persist],
  );

  const markPuzzleSolved = useCallback(
    (puzzleId: string) => {
      persist((prev) => ({
        ...prev,
        completedPuzzleIds: prev.completedPuzzleIds.includes(puzzleId)
          ? prev.completedPuzzleIds
          : [...prev.completedPuzzleIds, puzzleId],
      }));
    },
    [persist],
  );

  const markGimmickCompleted = useCallback(
    (gimmickId: string) => {
      persist((prev) => ({
        ...prev,
        gimmickCompletedIds: prev.gimmickCompletedIds.includes(gimmickId)
          ? prev.gimmickCompletedIds
          : [...prev.gimmickCompletedIds, gimmickId],
      }));
    },
    [persist],
  );

  const isPuzzleCompleted = useCallback(
    (puzzleId: string) => progress.completedPuzzleIds.includes(puzzleId),
    [progress.completedPuzzleIds],
  );

  return {
    currentStep,
    currentStepId,
    progress,
    resumeStepId,
    hasResume: resumeStepId !== null,
    goToStep,
    startNew,
    continueGame,
    restart,
    saveVideoTime,
    recordPuzzleAttempt,
    markPuzzleSolved,
    markGimmickCompleted,
    isPuzzleCompleted,
  };
}

export type SequenceProgressApi = ReturnType<typeof useSequenceProgress>;
