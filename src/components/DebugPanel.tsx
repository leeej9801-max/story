import { useState } from "react";
import type { StoryNode } from "../types/story";
import { storyManifest } from "../data/storyManifest";

interface DebugPanelProps {
  currentNode: StoryNode;
  onPrev: () => void;
  onNext: () => void;
  onJump: (nodeId: string) => void;
  onForceSolve: () => void;
  onReset: () => void;
  jumpPanelOpen: boolean;
  onToggleJumpPanel: (open: boolean) => void;
}

// 개발용 디버그 패널 (명세 16장). ?debug=1 에서만 렌더된다.
export function DebugPanel({
  currentNode,
  onPrev,
  onNext,
  onJump,
  onForceSolve,
  onReset,
  jumpPanelOpen,
  onToggleJumpPanel,
}: DebugPanelProps) {
  const [collapsed, setCollapsed] = useState(false);

  const imageSrc =
    "imageSrc" in currentNode ? (currentNode.imageSrc as string) : undefined;
  const videoSrc =
    "videoSrc" in currentNode ? (currentNode.videoSrc as string) : undefined;

  return (
    <div className={`debug-panel${collapsed ? " debug-panel--collapsed" : ""}`}>
      <div className="debug-header">
        <strong>DEBUG</strong>
        <button
          type="button"
          className="debug-mini"
          onClick={() => setCollapsed((c) => !c)}
        >
          {collapsed ? "▲" : "▼"}
        </button>
      </div>

      {!collapsed && (
        <div className="debug-body">
          <div className="debug-info">
            <div>
              node: <b>{currentNode.id}</b>
            </div>
            <div>
              type: {currentNode.type} · ch {currentNode.chapter} · order{" "}
              {currentNode.order}
            </div>
            <div>next: {currentNode.nextId ?? "—"}</div>
            {imageSrc && <div className="debug-src">img: {imageSrc}</div>}
            {videoSrc && <div className="debug-src">vid: {videoSrc}</div>}
            {"puzzleId" in currentNode && (
              <div>puzzle: {(currentNode as { puzzleId: string }).puzzleId}</div>
            )}
          </div>

          <div className="debug-actions">
            <button type="button" onClick={onPrev}>
              ◀ 이전
            </button>
            <button type="button" onClick={onNext}>
              다음 ▶
            </button>
            <button type="button" onClick={() => onToggleJumpPanel(!jumpPanelOpen)}>
              점프 (J)
            </button>
            {currentNode.type === "puzzle" && (
              <button type="button" onClick={onForceSolve}>
                퍼즐 성공 처리
              </button>
            )}
            <button type="button" className="debug-danger" onClick={onReset}>
              진행 초기화
            </button>
          </div>

          {jumpPanelOpen && (
            <div className="debug-jump">
              <select
                value={currentNode.id}
                onChange={(e) => onJump(e.target.value)}
              >
                {storyManifest.map((node) => (
                  <option key={node.id} value={node.id}>
                    {node.order}. {node.id} ({node.type})
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
