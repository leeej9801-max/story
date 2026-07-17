import { useEffect } from "react";
import { CueRule } from "./CueRule";

interface CueSheetModalProps {
  src: string;
  alt: string;
  open: boolean;
  onClose: () => void;
  /** 큐시트 위에 얹는 짧은 운영 안내(도장). 확대해도 그대로 보이도록 함께 표시한다. */
  note?: string;
  /** 큐시트 삽화 아래 손글씨 메모. 확대해도 그대로 보이도록 함께 표시한다. */
  aside?: string;
  /** 큐시트 오른쪽 위 규칙. 확대해도 그대로 보이도록 함께 표시한다. */
  rule?: string;
}

// 큐시트 확대 모달. 배경 90% 검정, 최대 92vw × 88vh, 클릭/Esc로 닫기.
export function CueSheetModal({ src, alt, open, onClose, note, aside, rule }: CueSheetModalProps) {
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
      {/* 축소 화면과 같은 비율 상자 → 안내가 이미지 모서리에 똑같이 붙는다 */}
      <div className="cue-modal-frame">
        <img className="cue-modal-image" src={src} alt={alt} draggable={false} />
        {note && <span className="cue-note">{note}</span>}
        {rule && <CueRule text={rule} />}
        {aside && <span className="cue-aside">{aside}</span>}
      </div>

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
