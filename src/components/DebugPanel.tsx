import { useEffect, useState } from "react";
import type { SavedProgressV2, SequenceStep } from "../types/sequence";
import { sequence } from "../data/sequenceManifest";
import { getActiveAudioSources } from "../utils/audio";

interface DebugPanelProps {
  currentStep: SequenceStep | null;
  progress: SavedProgressV2;
  onJump: (stepId: string) => void;
  onPrev: () => void;
  onNext: () => void;
  onReset: () => void;
}

// 개발용 디버그 패널 (지시서 v2 · 13장). ?debug=1 에서만 렌더된다.
// 참가자 모드에는 이 기능을 절대 표시하지 않는다.
//
// 영상 시간 이동 / 영상 종료 강제 실행은 VideoStage,
// 퍼즐 강제 성공은 PuzzleScreen, 기믹 타이머 0초는 GimmickTimer가 각각 제공한다.
export function DebugPanel({
  currentStep,
  progress,
  onJump,
  onPrev,
  onNext,
  onReset,
}: DebugPanelProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [audioInfo, setAudioInfo] = useState(getActiveAudioSources());

  // 현재 재생 중인 오디오 파일명 표시 (지시서 13장)
  useEffect(() => {
    const t = window.setInterval(() => setAudioInfo(getActiveAudioSources()), 500);
    return () => window.clearInterval(t);
  }, []);

  return (
    <div className={`debug-panel${collapsed ? " debug-panel--collapsed" : ""}`}>
      <div className="debug-header">
        <strong>DEBUG</strong>
        <button type="button" className="debug-mini" onClick={() => setCollapsed((c) => !c)}>
          {collapsed ? "▲" : "▼"}
        </button>
      </div>

      {!collapsed && (
        <div className="debug-body">
          <div className="debug-info">
            <div>
              step: <b>{currentStep?.id ?? "start (시작 화면)"}</b>
            </div>
            <div>type: {currentStep?.type ?? "—"}</div>
            <div>next: {currentStep?.nextStepId ?? "—"}</div>
            {currentStep?.type === "video" && (
              <div className="debug-src">vid: {currentStep.src}</div>
            )}
            {currentStep?.type === "puzzle" && <div>puzzle: {currentStep.puzzleId}</div>}
            {currentStep?.type === "gimmick" && <div>gimmick: {currentStep.gimmickId}</div>}
            <div className="debug-src">
              bgm: {audioInfo.bgm ?? "—"} · sfx: {audioInfo.sfxCount}
            </div>
            {/* 파일명만으로는 무음인지 알 수 없어 볼륨/페이드 상태도 함께 본다 */}
            <div className="debug-src">
              vol: {audioInfo.volume ?? "—"}
              {audioInfo.fading ? " (페이드 중)" : ""}
            </div>
            <div className="debug-src">
              solved: {progress.completedPuzzleIds.length} · t=
              {progress.videoCurrentTime.toFixed(1)}s
            </div>
          </div>

          <div className="debug-actions">
            <button type="button" onClick={onPrev}>
              ◀ 이전 단계
            </button>
            <button type="button" onClick={onNext}>
              다음 단계 ▶
            </button>
            <button type="button" className="debug-danger" onClick={onReset}>
              진행 초기화
            </button>
          </div>

          <div className="debug-jump">
            <select value={currentStep?.id ?? ""} onChange={(e) => onJump(e.target.value)}>
              {currentStep === null && <option value="">— 시작 화면 —</option>}
              {sequence.map((step, index) => (
                <option key={step.id} value={step.id}>
                  {index + 1}. {step.id} ({step.type})
                </option>
              ))}
            </select>
          </div>
        </div>
      )}
    </div>
  );
}
