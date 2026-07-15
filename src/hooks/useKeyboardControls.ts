import { useEffect, useRef } from "react";

export interface KeyboardControlsOptions {
  onNext?: () => void;
  onPrev?: () => void;
  onJump?: () => void;
  onReload?: () => void;
  /** false면 리스너를 붙이지 않는다. */
  enabled?: boolean;
  /** debug 모드에서만 ArrowLeft/J/R를 활성화한다. (명세 16장) */
  debug?: boolean;
}

// 키보드 진행 (명세 8.2 / 16장). 입력창 포커스 중에는 진행 키를 무시한다.
export function useKeyboardControls(options: KeyboardControlsOptions): void {
  const optsRef = useRef(options);
  optsRef.current = options;

  useEffect(() => {
    function handler(event: KeyboardEvent) {
      const o = optsRef.current;
      if (o.enabled === false) return;

      const target = event.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable)
      ) {
        return;
      }

      switch (event.key) {
        case "Enter":
        case " ":
        case "ArrowRight":
          o.onNext?.();
          event.preventDefault();
          break;
        case "ArrowLeft":
          if (o.debug) {
            o.onPrev?.();
            event.preventDefault();
          }
          break;
        case "j":
        case "J":
          if (o.debug) {
            o.onJump?.();
            event.preventDefault();
          }
          break;
        case "r":
        case "R":
          if (o.debug) {
            o.onReload?.();
            event.preventDefault();
          }
          break;
        default:
          break;
      }
    }

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);
}
