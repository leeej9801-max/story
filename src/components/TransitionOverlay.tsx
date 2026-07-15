export type TransitionPhase = "idle" | "darken" | "reveal";

interface TransitionOverlayProps {
  phase: TransitionPhase;
}

// 장면 전환용 검은 오버레이. (명세 8.3)
// darken: 250ms 어두워짐 → 이미지 교체 → reveal: 500ms 페이드 인
export function TransitionOverlay({ phase }: TransitionOverlayProps) {
  const opacity = phase === "darken" ? 1 : 0;
  const duration = phase === "darken" ? "250ms" : "500ms";

  return (
    <div
      className="transition-overlay"
      aria-hidden="true"
      style={{ opacity, transitionDuration: duration }}
    />
  );
}
