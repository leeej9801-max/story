import { useEffect, useRef, useState } from "react";
import type { VideoNode } from "../types/story";

interface VideoSceneProps {
  node: VideoNode;
  onEnded: () => void;
}

// 인트로 영상 (명세 7장).
export function VideoScene({ node, onEnded }: VideoSceneProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [showSkip, setShowSkip] = useState(false);
  const [error, setError] = useState(false);
  const [needsManualPlay, setNeedsManualPlay] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    setShowSkip(false);
    setError(false);
    setNeedsManualPlay(false);

    // 사용자 클릭 직후 재생 시도. 음소거를 강제하지 않는다.
    const video = videoRef.current;
    if (video) {
      const p = video.play();
      if (p && typeof p.catch === "function") {
        p.catch(() => setNeedsManualPlay(true));
      }
    }

    // 3초 후 건너뛰기 버튼 노출
    const t = window.setTimeout(() => setShowSkip(true), 3000);
    return () => window.clearTimeout(t);
  }, [reloadKey]);

  function manualPlay() {
    const video = videoRef.current;
    if (!video) return;
    video
      .play()
      .then(() => setNeedsManualPlay(false))
      .catch(() => setNeedsManualPlay(true));
  }

  function retry() {
    setReloadKey((k) => k + 1);
  }

  if (error) {
    return (
      <div className="screen video-screen video-screen--error">
        <div className="scene-error">
          <p>인트로 영상을 불러오지 못했습니다.</p>
          <div className="scene-error-actions">
            <button type="button" className="road-button" onClick={retry}>
              다시 시도
            </button>
            <button type="button" className="road-button road-button--primary" onClick={onEnded}>
              장면으로 이동
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="screen video-screen">
      <video
        key={reloadKey}
        ref={videoRef}
        className="intro-video"
        src={node.videoSrc}
        playsInline
        autoPlay
        onEnded={onEnded}
        onError={() => setError(true)}
      />

      {needsManualPlay && (
        <button
          type="button"
          className="road-button road-button--primary video-play-button"
          aria-label="영상 재생"
          onClick={manualPlay}
        >
          ▶ 재생
        </button>
      )}

      {showSkip && node.allowSkip !== false && (
        <button
          type="button"
          className="road-button video-skip-button"
          aria-label="인트로 건너뛰기"
          onClick={onEnded}
        >
          건너뛰기 »
        </button>
      )}
    </div>
  );
}
