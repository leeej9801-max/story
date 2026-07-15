import { useCallback, useEffect, useRef, useState } from "react";
import type { CutsceneNode } from "../types/story";

interface CutsceneViewerProps {
  node: CutsceneNode;
  locked: boolean;
  reducedMotion: boolean;
  debug: boolean;
  onNext: () => void;
  onForceNext?: () => void;
}

// 컷신 뷰어 (명세 8장).
export function CutsceneViewer({
  node,
  locked,
  reducedMotion,
  debug,
  onNext,
  onForceNext,
}: CutsceneViewerProps) {
  const [controlsVisible, setControlsVisible] = useState(true);
  const [imageError, setImageError] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const hideTimer = useRef<number | undefined>(undefined);

  // 장면이 바뀌면 에러 상태를 초기화한다.
  useEffect(() => {
    setImageError(false);
  }, [node.id]);

  const revealControls = useCallback(() => {
    setControlsVisible(true);
    if (hideTimer.current) window.clearTimeout(hideTimer.current);
    // 3초 동안 조작이 없으면 컨트롤을 흐린다. (명세 8.1)
    hideTimer.current = window.setTimeout(() => setControlsVisible(false), 3000);
  }, []);

  useEffect(() => {
    revealControls();
    return () => {
      if (hideTimer.current) window.clearTimeout(hideTimer.current);
    };
  }, [revealControls, node.id]);

  const handleNext = useCallback(() => {
    if (locked) return; // 전환 중 입력 잠금 (명세 8.4)
    onNext();
  }, [locked, onNext]);

  const slowZoom = node.transition === "slowZoom" && !reducedMotion;

  if (imageError) {
    return (
      <div className="screen cutscene-screen">
        <div className="scene-error">
          <p>장면을 불러오지 못했습니다.</p>
          <div className="scene-error-actions">
            <button
              type="button"
              className="road-button"
              onClick={() => {
                setImageError(false);
                setReloadKey((k) => k + 1);
              }}
            >
              다시 시도
            </button>
            {debug && (
              <button type="button" className="road-button road-button--primary" onClick={onForceNext}>
                다음 장면 강제 이동
              </button>
            )}
          </div>
          {debug && (
            <p className="scene-error-debug">
              node: {node.id} · {node.imageSrc}
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      className="screen cutscene-screen"
      onMouseMove={revealControls}
      onTouchStart={revealControls}
    >
      <img
        key={reloadKey}
        className={`cutscene-image${slowZoom ? " cutscene-image--slow-zoom" : ""}`}
        src={node.imageSrc}
        alt={node.caption ?? `장면 ${node.id}`}
        draggable={false}
        onError={() => setImageError(true)}
      />

      {(node.speaker || node.caption) && controlsVisible && (
        <div className="cutscene-caption">
          {node.speaker && <span className="cutscene-speaker">{node.speaker}</span>}
          {node.caption && <span className="cutscene-caption-text">{node.caption}</span>}
        </div>
      )}

      {/* 화면 우측 35% 클릭 영역으로 진행 (명세 8.2) */}
      <button
        type="button"
        className="cutscene-advance-zone"
        aria-label="다음 장면"
        tabIndex={-1}
        onClick={handleNext}
      />

      <div className={`cutscene-controls${controlsVisible ? "" : " cutscene-controls--dim"}`}>
        <button
          type="button"
          className="road-button road-button--primary cutscene-next"
          aria-label="다음 장면"
          onClick={(e) => {
            e.stopPropagation();
            handleNext();
          }}
        >
          다음 »
        </button>
      </div>
    </div>
  );
}
