import { useCallback, useMemo, useRef, useState } from "react";
import { StartScreen } from "../components/StartScreen";
import { VideoStage } from "../components/VideoStage";
import { PuzzleScreen } from "../components/PuzzleScreen";
import { GimmickTimer } from "../components/GimmickTimer";
import { CompleteScreen } from "../components/CompleteScreen";
import { DebugPanel } from "../components/DebugPanel";
import { TransitionOverlay, type TransitionPhase } from "../components/TransitionOverlay";
import { useSequenceProgress } from "../hooks/useSequenceProgress";
import { sequence, stepMap } from "../data/sequenceManifest";
import { getPuzzle } from "../data/puzzleManifest";
import { stopAllPuzzleAudio } from "../utils/audio";

/** 영상 종료 후 검은 화면 유지 시간 → 이후 퍼즐로 페이드 전환 (지시서 5.4) */
const BLACK_HOLD_MS = 300;
const REVEAL_MS = 400;

// THE ROAD · 영상 자동 재생 + 퍼즐/기믹 인터럽트 진행 (지시서 v2)
//
//   영상 자동 재생 → 영상 종료 → 퍼즐 또는 기믹 → 정답/기믹 종료
//   → 다음 영상 자동 재생 → 반복 → 엔딩
//
// 참가자용 `다음` 버튼, 클릭/키보드 컷신 넘김, 퍼즐 `나가기`는 존재하지 않는다.
export default function App() {
  const flow = useSequenceProgress();
  const { currentStep } = flow;

  const debug = useMemo(
    () => new URLSearchParams(window.location.search).get("debug") === "1",
    [],
  );

  const [phase, setPhase] = useState<TransitionPhase>("idle");
  const lockRef = useRef(false);

  // 단계 이동: 검은 화면 300ms 유지 후 페이드 전환 (지시서 5.4)
  const moveToStep = useCallback(
    (targetId: string | null) => {
      if (!targetId || lockRef.current) return;
      if (!stepMap[targetId]) return;

      lockRef.current = true;
      setPhase("darken");

      window.setTimeout(() => {
        flow.goToStep(targetId);
        setPhase("reveal");
        window.setTimeout(() => {
          setPhase("idle");
          lockRef.current = false;
        }, REVEAL_MS);
      }, BLACK_HOLD_MS);
    },
    [flow],
  );

  // 영상 종료 처리 (지시서 5.4)
  const handleVideoEnded = useCallback(() => {
    stopAllPuzzleAudio();
    moveToStep(currentStep?.nextStepId ?? null);
  }, [currentStep, moveToStep]);

  // 퍼즐 성공 → 다음 단계. 다음이 영상이면 퍼즐 오디오를 완전히 정지한다. (지시서 11.3)
  const handlePuzzleSolved = useCallback(() => {
    if (currentStep?.type !== "puzzle") return;
    flow.markPuzzleSolved(currentStep.puzzleId);

    const next = currentStep.nextStepId;
    if (next && stepMap[next]?.type === "video") stopAllPuzzleAudio();
    moveToStep(next);
  }, [currentStep, flow, moveToStep]);

  // 기믹 종료 → 다음 영상 자동 재생 (지시서 9.3)
  const handleGimmickComplete = useCallback(() => {
    if (currentStep?.type !== "gimmick") return;
    flow.markGimmickCompleted(currentStep.gimmickId);
    stopAllPuzzleAudio();
    moveToStep(currentStep.nextStepId);
  }, [currentStep, flow, moveToStep]);

  const handleStart = useCallback(() => {
    stopAllPuzzleAudio();
    flow.startNew();
  }, [flow]);

  const handleContinue = useCallback(() => {
    stopAllPuzzleAudio();
    flow.continueGame();
  }, [flow]);

  const handleRestart = useCallback(() => {
    stopAllPuzzleAudio();
    flow.restart();
  }, [flow]);

  // 디버그 전용: 현재를 가리키는 이전 단계로 이동 (지시서 13장)
  const handleDebugPrev = useCallback(() => {
    const prev = sequence.find((s) => s.nextStepId === currentStep?.id);
    if (!prev) return;
    stopAllPuzzleAudio();
    flow.goToStep(prev.id);
  }, [currentStep, flow]);

  function renderStep() {
    // 시퀀스 밖: 시작 화면
    if (!currentStep) {
      return (
        <StartScreen
          hasResume={flow.hasResume}
          onStart={handleStart}
          onContinue={handleContinue}
          onRestart={handleStart}
        />
      );
    }

    switch (currentStep.type) {
      case "video":
        return (
          <VideoStage
            key={currentStep.id}
            step={currentStep}
            initialTime={flow.progress.videoCurrentTime}
            debug={debug}
            onEnded={handleVideoEnded}
            onTimeSave={flow.saveVideoTime}
          />
        );

      case "puzzle": {
        const puzzle = getPuzzle(currentStep.puzzleId);
        if (!puzzle) {
          return (
            <div className="screen placeholder-screen">
              <p>퍼즐 정의를 찾을 수 없습니다: {currentStep.puzzleId}</p>
            </div>
          );
        }
        return (
          <PuzzleScreen
            key={currentStep.id}
            puzzle={puzzle}
            debug={debug}
            onSolved={handlePuzzleSolved}
            onAttempt={flow.recordPuzzleAttempt}
          />
        );
      }

      case "gimmick":
        return (
          <GimmickTimer
            key={currentStep.id}
            gimmickId={currentStep.gimmickId}
            debug={debug}
            onComplete={handleGimmickComplete}
          />
        );

      case "complete":
        return <CompleteScreen onRestart={handleRestart} />;

      default:
        return null;
    }
  }

  return (
    <div className="app-root">
      {renderStep()}

      <TransitionOverlay phase={phase} />

      {/* 세로 화면 안내 — 기능은 막지 않고 안내만 */}
      <div className="rotate-hint" aria-hidden="true">
        더 나은 진행을 위해 화면을 가로로 돌려 주세요.
      </div>

      {debug && (
        <DebugPanel
          currentStep={currentStep}
          progress={flow.progress}
          onJump={(id) => {
            stopAllPuzzleAudio();
            flow.goToStep(id);
          }}
          onPrev={handleDebugPrev}
          onNext={() => moveToStep(currentStep?.nextStepId ?? null)}
          onReset={handleRestart}
        />
      )}
    </div>
  );
}
