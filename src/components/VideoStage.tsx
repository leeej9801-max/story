import { useEffect, useRef, useState } from "react";
import type { VideoStep } from "../types/sequence";

interface VideoStageProps {
  step: VideoStep;
  /** 재접속 시 이어서 재생할 위치(초). (지시서 12장) */
  initialTime: number;
  debug: boolean;
  onEnded: () => void;
  /** 2초마다 재생 위치를 저장한다. */
  onTimeSave: (time: number) => void;
}

const SAVE_INTERVAL_MS = 2000;

// 참가자용 영상 재생 화면 (지시서 v2 · 5장)
//
// 참가자는 영상을 건너뛸 수 없다. 다음/이전 버튼, 화면 클릭 이동,
// Enter/Space 이동, 기본 video 컨트롤, seek bar를 모두 제공하지 않는다.
export function VideoStage({ step, initialTime, debug, onEnded, onTimeSave }: VideoStageProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [needsManualPlay, setNeedsManualPlay] = useState(false);
  const [error, setError] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const [debugTime, setDebugTime] = useState(0);
  const [duration, setDuration] = useState(0);

  // 마운트 시점의 재개 위치만 사용한다. 이후 저장값 변화로 되감기지 않도록 ref에 고정.
  const startAtRef = useRef(initialTime);
  const lastSaveRef = useRef(0);

  useEffect(() => {
    setNeedsManualPlay(false);
    setError(false);

    const video = videoRef.current;
    if (!video) return;

    // 저장된 위치에서 이어 재생 (지시서 12장)
    if (startAtRef.current > 0) {
      try {
        video.currentTime = startAtRef.current;
      } catch {
        /* 메타데이터 로드 전이면 onLoadedMetadata에서 다시 시도한다. */
      }
    }

    // 퍼즐 확인 버튼 클릭은 사용자 입력이므로 대부분 자동 재생된다.
    // 기믹 6 종료처럼 사용자 입력 없이 진입하는 경우에만 차단될 수 있다. (지시서 5.3)
    const p = video.play();
    if (p && typeof p.catch === "function") {
      p.catch(() => setNeedsManualPlay(true));
    }
  }, [step.id, reloadKey]);

  function handleLoadedMetadata() {
    const video = videoRef.current;
    if (!video) return;
    setDuration(video.duration || 0);
    if (startAtRef.current > 0 && video.currentTime < startAtRef.current) {
      try {
        video.currentTime = startAtRef.current;
      } catch {
        /* 무시 */
      }
    }
  }

  function handleTimeUpdate() {
    const video = videoRef.current;
    if (!video) return;

    if (debug) setDebugTime(video.currentTime);

    const now = Date.now();
    if (now - lastSaveRef.current >= SAVE_INTERVAL_MS) {
      lastSaveRef.current = now;
      onTimeSave(video.currentTime);
    }
  }

  function manualPlay() {
    const video = videoRef.current;
    if (!video) return;
    video
      .play()
      .then(() => setNeedsManualPlay(false))
      .catch(() => setNeedsManualPlay(true));
  }

  // 영상 파일이 아직 준비되지 않은 단계 (예: 영상 7 제작 중)
  if (step.pending) {
    return (
      <div className="screen video-stage">
        <div className="video-pending">
          <p className="placeholder-text">{step.title}</p>
          <p className="video-pending-note">영상 준비 중입니다.</p>
          {debug && (
            <div className="scene-error-actions">
              <p className="scene-error-debug">expected: {step.src}</p>
              <button type="button" className="road-button" onClick={onEnded}>
                다음 단계로 (debug)
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="screen video-stage">
        <div className="scene-error">
          <p>영상을 불러오지 못했습니다.</p>
          <p className="scene-error-debug">{step.src}</p>
          <div className="scene-error-actions">
            <button
              type="button"
              className="road-button road-button--primary"
              onClick={() => setReloadKey((k) => k + 1)}
            >
              다시 시도
            </button>
            {debug && (
              <button type="button" className="road-button" onClick={onEnded}>
                다음 단계로 (debug)
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="screen video-stage">
      <video
        key={`${step.id}-${reloadKey}`}
        ref={videoRef}
        src={step.src}
        playsInline
        autoPlay
        // controls를 지정하지 않는다 → 기본 컨트롤과 seek bar가 보이지 않는다. (지시서 5.1)
        controlsList="nodownload noplaybackrate"
        disablePictureInPicture
        onEnded={onEnded}
        onError={() => setError(true)}
        onLoadedMetadata={handleLoadedMetadata}
        onTimeUpdate={handleTimeUpdate}
        onContextMenu={(e) => e.preventDefault()}
      />

      {/* 자동 재생 실패 시에만 노출되는 오류 대응 오버레이 (지시서 5.3) */}
      {needsManualPlay && (
        <button
          type="button"
          className="video-manual-play"
          aria-label="영상 재생"
          onClick={manualPlay}
        >
          <span className="video-manual-play-text">
            다음 이야기를 재생하려면 화면을 눌러 주세요.
          </span>
        </button>
      )}

      {/* 디버그 전용: 영상 시간 이동 / 강제 종료 (지시서 13장) */}
      {debug && (
        <div className="video-debug-bar">
          <span>
            {debugTime.toFixed(1)} / {duration.toFixed(1)}s
          </span>
          <input
            type="range"
            min={0}
            max={duration || 0}
            step={0.5}
            value={debugTime}
            onChange={(e) => {
              const t = Number(e.target.value);
              setDebugTime(t);
              if (videoRef.current) videoRef.current.currentTime = t;
            }}
          />
          <button type="button" onClick={onEnded}>
            영상 종료 강제 실행
          </button>
        </div>
      )}
    </div>
  );
}
