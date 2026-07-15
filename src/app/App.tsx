import { useCallback, useMemo, useRef, useState } from "react";
import { StartScreen } from "../components/StartScreen";
import { VideoScene } from "../components/VideoScene";
import { CutsceneViewer } from "../components/CutsceneViewer";
import { PuzzleScreen } from "../components/PuzzleScreen";
import { DebugPanel } from "../components/DebugPanel";
import {
  TransitionOverlay,
  type TransitionPhase,
} from "../components/TransitionOverlay";
import { useStoryProgress } from "../hooks/useStoryProgress";
import { useKeyboardControls } from "../hooks/useKeyboardControls";
import { useImagePreload } from "../hooks/useImagePreload";
import { storyManifest, storyNodeMap } from "../data/storyManifest";
import { getPuzzle } from "../data/puzzleManifest";
import type { CutsceneNode, StoryNode } from "../types/story";

const DARKEN_MS = 250;
const REVEAL_MS = 500;

// 노드에서 미리 로드할 미디어를 수집한다.
function collectMedia(node: StoryNode, images: string[], videos: string[]) {
  switch (node.type) {
    case "start":
    case "cutscene":
    case "ending":
      if ("imageSrc" in node && node.imageSrc) images.push(node.imageSrc);
      break;
    case "video":
      videos.push(node.videoSrc);
      break;
    case "puzzle": {
      const puzzle = getPuzzle(node.puzzleId);
      if (puzzle) images.push(puzzle.cueImageSrc);
      break;
    }
    default:
      break;
  }
}

export default function App() {
  const story = useStoryProgress();
  const { currentNode, currentNodeId } = story;

  const debug = useMemo(
    () => new URLSearchParams(window.location.search).get("debug") === "1",
    [],
  );
  const reducedMotion = useMemo(
    () =>
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    [],
  );

  const [phase, setPhase] = useState<TransitionPhase>("idle");
  const [jumpPanelOpen, setJumpPanelOpen] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const lockRef = useRef(false);

  // 전환을 동반한 이동 (명세 8.3 / 8.4)
  const navigate = useCallback(
    (targetId: string) => {
      if (lockRef.current) return;
      const target = storyNodeMap[targetId];
      if (!target) return;

      const instant =
        reducedMotion ||
        (target.type === "cutscene" &&
          (target as CutsceneNode).transition === "none");

      if (instant) {
        story.goToNode(targetId);
        return;
      }

      lockRef.current = true;
      setPhase("darken");
      window.setTimeout(() => {
        story.goToNode(targetId);
        setPhase("reveal");
        window.setTimeout(() => {
          setPhase("idle");
          lockRef.current = false;
        }, REVEAL_MS);
      }, DARKEN_MS);
    },
    [reducedMotion, story],
  );

  const advanceCurrent = useCallback(() => {
    if (currentNode.nextId) navigate(currentNode.nextId);
  }, [currentNode.nextId, navigate]);

  // 디버그: 현재를 가리키는 이전 노드 탐색
  const prevNode = useMemo(
    () => storyManifest.find((n) => n.nextId === currentNodeId),
    [currentNodeId],
  );

  const handlePrev = useCallback(() => {
    if (prevNode) story.goToNode(prevNode.id);
  }, [prevNode, story]);

  const handlePuzzleSolved = useCallback(() => {
    if (currentNode.type === "puzzle") story.markPuzzleSolved(currentNode.puzzleId);
    if (currentNode.nextId) navigate(currentNode.nextId);
  }, [currentNode, navigate, story]);

  const handlePuzzleExit = useCallback(() => {
    const target = story.progress.lastCutsceneNodeId;
    if (target && storyNodeMap[target]) navigate(target);
  }, [navigate, story.progress.lastCutsceneNodeId]);

  // 키보드 진행 (명세 8.2 / 16장)
  useKeyboardControls({
    debug,
    onNext: () => {
      // 디버그는 강제 스킵 허용, 일반 모드는 컷신에서만 진행
      if (debug || currentNode.type === "cutscene") advanceCurrent();
    },
    onPrev: handlePrev,
    onJump: () => setJumpPanelOpen((o) => !o),
    onReload: () => setReloadKey((k) => k + 1),
  });

  // 다음 / 다다음 미디어 사전 로드 (명세 8.5)
  const preload = useMemo(() => {
    const images: string[] = [];
    const videos: string[] = [];
    const next = currentNode.nextId ? storyNodeMap[currentNode.nextId] : undefined;
    if (next) {
      collectMedia(next, images, videos);
      const nn = next.nextId ? storyNodeMap[next.nextId] : undefined;
      if (nn) collectMedia(nn, images, videos);
    }
    return { images, videos };
  }, [currentNode.nextId]);
  useImagePreload(preload.images, preload.videos);

  const locked = phase !== "idle";

  function renderNode() {
    switch (currentNode.type) {
      case "start":
        return (
          <StartScreen
            node={currentNode}
            hasResume={story.hasResume}
            onStart={() => navigate("intro-video")}
            onContinue={story.continueGame}
            onRestart={story.restart}
          />
        );

      case "video":
        return <VideoScene node={currentNode} onEnded={advanceCurrent} />;

      case "cutscene":
        return (
          <CutsceneViewer
            node={currentNode}
            locked={locked}
            reducedMotion={reducedMotion}
            debug={debug}
            onNext={advanceCurrent}
            onForceNext={advanceCurrent}
          />
        );

      case "puzzle": {
        const puzzle = getPuzzle(currentNode.puzzleId);
        if (!puzzle) {
          return (
            <div className="screen placeholder-screen">
              <p>퍼즐 정의를 찾을 수 없습니다: {currentNode.puzzleId}</p>
            </div>
          );
        }
        return (
          <PuzzleScreen
            puzzle={puzzle}
            alreadyCompleted={story.isPuzzleCompleted(puzzle.id)}
            debug={debug}
            onSolved={handlePuzzleSolved}
            onExit={handlePuzzleExit}
            onAttempt={story.recordPuzzleAttempt}
          />
        );
      }

      case "placeholder":
        return (
          <div className="screen placeholder-screen">
            <p className="placeholder-text">{currentNode.label}</p>
            {debug && (
              <p className="scene-error-debug">node: {currentNode.id}</p>
            )}
          </div>
        );

      case "ending":
        return (
          <div className="screen placeholder-screen">
            {currentNode.imageSrc && (
              <img
                className="cutscene-image"
                src={currentNode.imageSrc}
                alt={currentNode.caption ?? "엔딩"}
                draggable={false}
              />
            )}
            {currentNode.caption && (
              <p className="placeholder-text">{currentNode.caption}</p>
            )}
          </div>
        );

      default:
        return null;
    }
  }

  return (
    <div className="app-root" key={reloadKey}>
      {renderNode()}

      <TransitionOverlay phase={phase} />

      {/* 세로 화면 안내 (명세 17장) — 기능은 막지 않고 안내만 */}
      <div className="rotate-hint" aria-hidden="true">
        더 나은 진행을 위해 화면을 가로로 돌려 주세요.
      </div>

      {debug && (
        <DebugPanel
          currentNode={currentNode}
          onPrev={handlePrev}
          onNext={advanceCurrent}
          onJump={(id) => {
            story.goToNode(id);
            setJumpPanelOpen(false);
          }}
          onForceSolve={handlePuzzleSolved}
          onReset={story.restart}
          jumpPanelOpen={jumpPanelOpen}
          onToggleJumpPanel={setJumpPanelOpen}
        />
      )}
    </div>
  );
}
