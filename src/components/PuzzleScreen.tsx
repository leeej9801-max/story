import { useEffect, useRef, useState } from "react";
import type { PuzzleDefinition } from "../data/puzzleManifest";
import { ANSWER_REQUIRED } from "../data/puzzleManifest";
import { checkAnswer } from "../utils/normalizeAnswer";
import { CueSheetModal } from "./CueSheetModal";

interface PuzzleScreenProps {
  puzzle: PuzzleDefinition;
  alreadyCompleted: boolean;
  debug: boolean;
  onSolved: () => void;
  onExit: () => void;
  onAttempt: (puzzleId: string) => void;
}

// 공통 프레임 기준 상대 좌표.
// puzzle-frame.png(1672×941)를 픽셀 단위로 실측해 보정한 값 (명세 9.2의 초기값을 미세조정).
const CUE_RECT = { left: "15.1%", top: "26.9%", width: "66.1%", height: "49.7%" };
const INPUT_RECT = { left: "15.4%", top: "80.1%", width: "39.7%", height: "10.2%" };
const CONFIRM_RECT = { left: "57.0%", top: "80.1%", width: "12.3%", height: "10.2%" };
const EXIT_RECT = { left: "71.2%", top: "80.1%", width: "10.1%", height: "10.2%" };

const SUCCESS_HOLD_MS = 700;
const SUBMIT_COOLDOWN_MS = 500;

type Status = "idle" | "wrong" | "correct";

export function PuzzleScreen({
  puzzle,
  alreadyCompleted,
  debug,
  onSolved,
  onExit,
  onAttempt,
}: PuzzleScreenProps) {
  const [value, setValue] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [shake, setShake] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [frameError, setFrameError] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const lastSubmitRef = useRef(0);
  const solveTimer = useRef<number | undefined>(undefined);

  const isPending = !puzzle.enabled || puzzle.acceptedAnswers.includes(ANSWER_REQUIRED);
  const locked = status === "correct" || alreadyCompleted;

  useEffect(() => {
    // 퍼즐이 바뀌면 상태 초기화
    setValue("");
    setStatus("idle");
    setShake(false);
    setModalOpen(false);
    return () => {
      if (solveTimer.current) window.clearTimeout(solveTimer.current);
    };
  }, [puzzle.id]);

  function succeed() {
    setStatus("correct");
    solveTimer.current = window.setTimeout(onSolved, SUCCESS_HOLD_MS);
  }

  function submit() {
    if (locked || isPending) return;
    if (value.trim().length === 0) return;

    const now = Date.now();
    if (now - lastSubmitRef.current < SUBMIT_COOLDOWN_MS) return; // 연속 제출 방지
    lastSubmitRef.current = now;

    if (checkAnswer(value, puzzle.acceptedAnswers, puzzle.inputType)) {
      succeed();
    } else {
      onAttempt(puzzle.id);
      setStatus("wrong");
      setShake(true);
      window.setTimeout(() => setShake(false), 300);
      // 오답이면 전체 선택해 재입력을 쉽게 한다. (명세 9.5)
      window.requestAnimationFrame(() => inputRef.current?.select());
    }
  }

  const showExit = !locked && !alreadyCompleted;

  return (
    <div className="screen puzzle-screen">
      <div
        className={`puzzle-stage${status === "correct" || alreadyCompleted ? " puzzle-stage--success" : ""}${
          shake ? " puzzle-stage--shake" : ""
        }`}
      >
        {/* 공통 프레임 배경 */}
        {!frameError ? (
          <img
            className="puzzle-frame"
            src="/assets/ui/puzzle-frame.png"
            alt=""
            draggable={false}
            onError={() => setFrameError(true)}
          />
        ) : (
          <div className="puzzle-frame puzzle-frame--fallback" aria-hidden="true" />
        )}

        {/* 큐시트 표시 영역 */}
        <div className="cue-sheet-slot" style={CUE_RECT}>
          <button
            type="button"
            className="cue-sheet-button"
            aria-label={`${puzzle.title} 큐시트 확대`}
            onClick={() => setModalOpen(true)}
          >
            <img
              className="cue-sheet-image"
              src={puzzle.cueImageSrc}
              alt={puzzle.title}
              draggable={false}
            />
          </button>
        </div>

        {/* 정답 입력창 (준비 중 퍼즐이나 완료 퍼즐에서는 감춤) */}
        {!isPending && !alreadyCompleted && (
          <input
            ref={inputRef}
            className="answer-input"
            style={INPUT_RECT}
            type="text"
            inputMode={puzzle.inputType === "number" ? "numeric" : "text"}
            placeholder={puzzle.placeholder ?? "정답 입력"}
            value={value}
            disabled={locked}
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck={false}
            aria-label={`${puzzle.title} 정답 입력`}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                submit();
              }
            }}
          />
        )}

        {/* 확인 버튼 (이미지의 '확인' 위 투명 오버레이) */}
        {!isPending && !alreadyCompleted && (
          <button
            type="button"
            className="confirm-button"
            style={CONFIRM_RECT}
            aria-label="정답 확인"
            disabled={locked}
            onClick={submit}
          />
        )}

        {/* 나가기 버튼 (직전 컷신으로 복귀) */}
        {showExit && (
          <button
            type="button"
            className="exit-button"
            style={EXIT_RECT}
            aria-label="나가기 (직전 장면으로)"
            onClick={onExit}
          />
        )}

        {/* 결과 / 상태 메시지 */}
        <div className="puzzle-status" aria-live="polite">
          {status === "wrong" && (
            <p className="puzzle-message puzzle-message--wrong">
              정답이 아닙니다. 현실 단서를 다시 확인하세요.
            </p>
          )}
          {status === "correct" && (
            <p className="puzzle-message puzzle-message--correct">
              {puzzle.successMessage ?? "정답이 확인되었습니다."}
            </p>
          )}
          {alreadyCompleted && status !== "correct" && (
            <div className="puzzle-completed-panel">
              <p className="puzzle-message puzzle-message--correct">
                이미 해결한 퍼즐입니다.
              </p>
              <button type="button" className="road-button road-button--primary" onClick={onSolved}>
                다음으로 진행 »
              </button>
            </div>
          )}
          {isPending && !alreadyCompleted && (
            <div className="puzzle-pending-panel">
              <p className="puzzle-message puzzle-message--pending">
                이 퍼즐의 정답은 아직 확정되지 않았습니다. (준비 중)
              </p>
              <div className="puzzle-pending-actions">
                <button type="button" className="road-button" onClick={onExit}>
                  나가기
                </button>
                <button type="button" className="road-button road-button--primary" onClick={onSolved}>
                  다음 장면으로 진행 (임시)
                </button>
              </div>
              {debug && (
                <p className="scene-error-debug">
                  puzzle: {puzzle.id} · enabled={String(puzzle.enabled)}
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      <CueSheetModal
        src={puzzle.cueImageSrc}
        alt={puzzle.title}
        open={modalOpen}
        onClose={() => setModalOpen(false)}
      />
    </div>
  );
}
