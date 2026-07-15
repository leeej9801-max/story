import { useEffect } from "react";

interface CueSheetModalProps {
  src: string;
  alt: string;
  open: boolean;
  onClose: () => void;
}

// 큐시트 확대 모달 (명세 9.4). 배경 90% 검정, 최대 92vw × 88vh, 클릭/Esc로 닫기.
export function CueSheetModal({ src, alt, open, onClose }: CueSheetModalProps) {
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="cue-modal-backdrop"
      role="dialog"
      aria-modal="true"
      aria-label="큐시트 확대 보기"
      onClick={onClose}
    >
      <img
        className="cue-modal-image"
        src={src}
        alt={alt}
        draggable={false}
        onClick={onClose}
      />
      <button
        type="button"
        className="cue-modal-close"
        aria-label="확대 닫기"
        onClick={onClose}
      >
        닫기 ✕
      </button>
    </div>
  );
}
