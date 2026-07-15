import { useState } from "react";
import type { StartNode } from "../types/story";

interface StartScreenProps {
  node: StartNode;
  hasResume: boolean;
  onStart: () => void;
  onContinue: () => void;
  onRestart: () => void;
}

// 시작 화면 (명세 6장). 배경 이미지는 contain으로 표시하고 버튼만 HTML로 오버레이한다.
export function StartScreen({
  node,
  hasResume,
  onStart,
  onContinue,
  onRestart,
}: StartScreenProps) {
  const [imageError, setImageError] = useState(false);

  function requestFullscreen() {
    // 전체 화면 요청은 사용자 클릭 이후에만 (명세 17장)
    const el = document.documentElement;
    if (!document.fullscreenElement && el.requestFullscreen) {
      el.requestFullscreen().catch(() => {
        /* 무시 */
      });
    }
  }

  return (
    <div className="screen start-screen">
      {!imageError ? (
        <img
          className="start-background"
          src={node.imageSrc}
          alt="THE ROAD 시작 화면"
          draggable={false}
          onError={() => setImageError(true)}
        />
      ) : (
        <div className="start-background start-background--fallback" aria-hidden="true" />
      )}

      <div className="start-overlay">
        <h1 className="start-title">THE ROAD</h1>

        <div className="start-buttons">
          {hasResume ? (
            <>
              <button
                type="button"
                className="road-button road-button--primary"
                aria-label="이어하기"
                onClick={onContinue}
              >
                이어하기
              </button>
              <button
                type="button"
                className="road-button"
                aria-label="처음부터 시작"
                onClick={onRestart}
              >
                처음부터
              </button>
            </>
          ) : (
            <button
              type="button"
              className="road-button road-button--primary"
              aria-label="시작하기"
              onClick={onStart}
            >
              시작하기
            </button>
          )}

          <button
            type="button"
            className="road-button road-button--ghost"
            aria-label="전체 화면"
            onClick={requestFullscreen}
          >
            전체 화면
          </button>
        </div>
      </div>
    </div>
  );
}
