import { useEffect, useState } from "react";

interface CompleteScreenProps {
  onRestart: () => void;
}

/** `처음으로` 버튼 노출까지의 대기 시간 (지시서 3장 · 영상 7) */
const RESTART_BUTTON_DELAY_MS = 5000;

// 엔딩 정지 화면 (지시서 v2 · 2장 / 3장)
//
//  - 검은 화면을 유지한다.
//  - 참가자용 다음 버튼을 표시하지 않는다.
//  - `처음으로` 버튼만 5초 후 표시한다.
//  - 행사 운영 중 자동으로 시작 화면으로 돌아가지 않는다.
export function CompleteScreen({ onRestart }: CompleteScreenProps) {
  const [showRestart, setShowRestart] = useState(false);

  useEffect(() => {
    const t = window.setTimeout(() => setShowRestart(true), RESTART_BUTTON_DELAY_MS);
    return () => window.clearTimeout(t);
  }, []);

  return (
    <div className="screen complete-screen">
      {showRestart && (
        <button
          type="button"
          className="road-button road-button--ghost complete-restart"
          aria-label="처음으로"
          onClick={onRestart}
        >
          처음으로
        </button>
      )}
    </div>
  );
}
