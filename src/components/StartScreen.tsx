import { useState } from "react";

interface StartScreenProps {
  hasResume: boolean;
  onStart: () => void;
  onContinue: () => void;
  onRestart: () => void;
}

const START_BACKGROUND_SRC = "/assets/ui/start-background.png";

// 시작 화면 (지시서 v2 · 5.2)
//
// `시작하기`를 누르면 영상 1이 재생된다. 이 클릭이 사용자 입력이므로
// 이후 영상 자동 재생이 브라우저 정책에 막히지 않는다.
export function StartScreen({ hasResume, onStart, onContinue, onRestart }: StartScreenProps) {
  const [imageError, setImageError] = useState(false);

  function requestFullscreen() {
    // 전체 화면 요청은 사용자 클릭 이후에만 가능하다.
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
          src={START_BACKGROUND_SRC}
          alt="Who Are You? 시작 화면"
          draggable={false}
          onError={() => setImageError(true)}
        />
      ) : (
        <div className="start-background start-background--fallback" aria-hidden="true" />
      )}

      <div className="start-overlay">
        <h1 className="start-title">Who Are You?</h1>

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
