import { useCallback, useMemo, useState } from "react";
import type { SavedProgress, StoryNode } from "../types/story";
import {
  FIRST_STORY_NODE_ID,
  START_NODE_ID,
  storyNodeMap,
} from "../data/storyManifest";
import {
  clearProgress,
  createInitialProgress,
  loadProgress,
  saveProgress,
} from "../utils/storage";

// 스토리 진행 상태의 단일 소스. currentNodeId 하나로 전체 흐름을 제어한다. (명세 5.2)
export function useStoryProgress() {
  // 저장 데이터를 읽어 진행 메타(완료 퍼즐/시도 횟수/이어하기 위치)를 복원한다.
  // 단, 화면 자체는 항상 시작 화면(start)부터 시작한다. (명세 6장)
  const [progress, setProgress] = useState<SavedProgress>(
    () => loadProgress() ?? createInitialProgress(START_NODE_ID),
  );
  const [currentNodeId, setCurrentNodeId] = useState<string>(START_NODE_ID);

  const currentNode: StoryNode =
    storyNodeMap[currentNodeId] ?? storyNodeMap[START_NODE_ID];

  // 이어하기 대상: 저장된 진행 위치가 start가 아니고 manifest에 존재할 때.
  const resumeNodeId = useMemo<string | null>(() => {
    const saved = progress.currentNodeId;
    return saved !== START_NODE_ID && storyNodeMap[saved] ? saved : null;
  }, [progress.currentNodeId]);

  const persist = useCallback(
    (updater: (prev: SavedProgress) => SavedProgress) => {
      setProgress((prev) => {
        const next = updater(prev);
        saveProgress(next);
        return next;
      });
    },
    [],
  );

  const goToNode = useCallback(
    (nodeId: string) => {
      const node = storyNodeMap[nodeId];
      if (!node) return;
      setCurrentNodeId(nodeId);
      // start 노드는 진행 위치로 저장하지 않는다 → 이어하기 지점을 보존한다.
      if (nodeId !== START_NODE_ID) {
        persist((prev) => ({
          ...prev,
          currentNodeId: nodeId,
          lastCutsceneNodeId:
            node.type === "cutscene" ? nodeId : prev.lastCutsceneNodeId,
        }));
      }
    },
    [persist],
  );

  const advance = useCallback(() => {
    const node = storyNodeMap[currentNodeId];
    if (node?.nextId) goToNode(node.nextId);
  }, [currentNodeId, goToNode]);

  // 시작하기: 최초 실행(저장 기록 없음) 시 인트로부터 시작한다.
  const startGame = useCallback(() => goToNode(FIRST_STORY_NODE_ID), [goToNode]);

  // 이어하기: 저장된 위치로 즉시 이동한다. (명세 6.3)
  const continueGame = useCallback(() => {
    goToNode(resumeNodeId ?? FIRST_STORY_NODE_ID);
  }, [goToNode, resumeNodeId]);

  // 처음부터: localStorage 초기화 후 인트로부터 다시 시작한다.
  const restart = useCallback(() => {
    clearProgress();
    setProgress(createInitialProgress(START_NODE_ID));
    goToNode(FIRST_STORY_NODE_ID);
  }, [goToNode]);

  const returnToStart = useCallback(() => {
    setCurrentNodeId(START_NODE_ID);
  }, []);

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

  const isPuzzleCompleted = useCallback(
    (puzzleId: string) => progress.completedPuzzleIds.includes(puzzleId),
    [progress.completedPuzzleIds],
  );

  return {
    currentNode,
    currentNodeId,
    progress,
    resumeNodeId,
    hasResume: resumeNodeId !== null,
    goToNode,
    advance,
    startGame,
    continueGame,
    restart,
    returnToStart,
    recordPuzzleAttempt,
    markPuzzleSolved,
    isPuzzleCompleted,
  };
}

export type StoryProgressApi = ReturnType<typeof useStoryProgress>;
