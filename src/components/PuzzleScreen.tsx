import { useEffect, useRef, useState } from "react";
import type { PuzzleDefinition } from "../data/puzzleManifest";
import { isPuzzleAnswerCorrect } from "../utils/normalizeAnswer";
import { BGM_FADE_MS, VOLUME, getPuzzleAudio } from "../data/audioManifest";
import { fadeOutBgm, playSfx, startBgm } from "../utils/audio";
import { CueSheetModal } from "./CueSheetModal";

interface PuzzleScreenProps {
  puzzle: PuzzleDefinition;
  debug: boolean;
  onSolved: () => void;
  onAttempt: (puzzleId: string) => void;
}

// 공통 프레임 기준 상대 좌표.
// puzzle-frame.png(1672×941)를 픽셀 단위로 실측해 보정한 값.
// 나가기(EXIT) 영역은 v2에서 삭제되었다. 프레임 이미지에 '나가기' 문구가 남아 있어도
// 클릭 영역을 만들지 않는다. (지시서 6.1)
const CUE_RECT = { left: "15.1%", top: "26.9%", width: "66.1%", height: "49.7%" };
const INPUT_RECT = { left: "15.4%", top: "80.1%", width: "39.7%", height: "10.2%" };
const CONFIRM_RECT = { left: "57.0%", top: "80.1%", width: "12.3%", height: "10.2%" };

const SUBMIT_COOLDOWN_MS = 500;
const DEFAULT_SUCCESS_HOLD_MS = 1400;

type Status = "idle" | "wrong" | "correct";

// 퍼즐 공통 화면 (지시서 v2 · 6장)
//
// 표시 요소는 공통 프레임 / 큐시트 / 정답 입력창 / 확인 버튼 / 결과 문구뿐이다.
// 나가기, 이전, 다음, 영상으로 돌아가기, 퍼즐 건너뛰기는 모두 제공하지 않는다.
// 정답을 맞히기 전에는 어떤 방법으로도 다음 단계로 이동할 수 없다. (지시서 6.3)
export function PuzzleScreen({ puzzle, debug, onSolved, onAttempt }: PuzzleScreenProps) {
  const [value, setValue] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [shake, setShake] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [frameError, setFrameError] = useState(false);
  const [cueError, setCueError] = useState(false);

  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);
  const lastSubmitRef = useRef(0);
  const solveTimer = useRef<number | undefined>(undefined);
  // StrictMode의 이펙트 2회 실행에도 진입음이 겹치지 않게 한다.
  const openedForRef = useRef<string | null>(null);

  const locked = status === "correct";
  const audio = getPuzzleAudio(puzzle.id);
  const showCueImage = !puzzle.cuePending && !cueError;

  // 퍼즐이 바뀌면 상태를 초기화하고 진입음 + BGM을 시작한다. (지시서 11.3)
  useEffect(() => {
    setValue("");
    setStatus("idle");
    setShake(false);
    setModalOpen(false);
    setCueError(false);

    const set = getPuzzleAudio(puzzle.id);
    if (set && openedForRef.current !== puzzle.id) {
      openedForRef.current = puzzle.id;
      playSfx(set.open, VOLUME.open);
      startBgm(set.bgm, set.bgmVolume);
    }

    return () => {
      if (solveTimer.current) window.clearTimeout(solveTimer.current);
    };
  }, [puzzle.id]);

  function succeed() {
    setStatus("correct");

    // 퍼즐 BGM 400ms 페이드아웃 → 정답 효과음 → 대기 → 다음 단계 (지시서 11.3)
    fadeOutBgm(BGM_FADE_MS);
    if (audio) playSfx(audio.correct, VOLUME.correct);

    const hold = puzzle.successHoldMs ?? DEFAULT_SUCCESS_HOLD_MS;
    solveTimer.current = window.setTimeout(onSolved, hold);
  }

  function submit() {
    if (locked) return;
    if (value.trim().length === 0) return;

    const now = Date.now();
    if (now - lastSubmitRef.current < SUBMIT_COOLDOWN_MS) return; // 연속 제출 방지
    lastSubmitRef.current = now;

    if (isPuzzleAnswerCorrect(value, puzzle)) {
      succeed();
      return;
    }

    // 오답: BGM은 유지하고 오답 효과음만 겹쳐 재생한다. (지시서 11.3)
    if (audio) playSfx(audio.wrong, VOLUME.wrong);
    onAttempt(puzzle.id);
    setStatus("wrong");
    setShake(true);
    window.setTimeout(() => setShake(false), 300);
    // 오답이면 전체 선택해 재입력을 쉽게 한다. (지시서 6.2)
    window.requestAnimationFrame(() => inputRef.current?.select());
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    // Enter로 제출. 장문 입력창에서도 Enter는 제출이고 Shift+Enter가 줄바꿈이다. (지시서 6.2)
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  }

  const inputProps = {
    className: "answer-input",
    style: INPUT_RECT,
    placeholder: puzzle.placeholder ?? "정답 입력",
    value,
    disabled: locked,
    autoComplete: "off" as const,
    autoCorrect: "off",
    autoCapitalize: "off",
    spellCheck: false,
    "aria-label": `${puzzle.title} 정답 입력`,
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setValue(e.target.value),
    onKeyDown: handleKeyDown,
  };

  return (
    <div className="screen puzzle-screen">
      <div
        className={`puzzle-stage${status === "correct" ? " puzzle-stage--success" : ""}${
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
          {showCueImage ? (
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
                onError={() => setCueError(true)}
              />
            </button>
          ) : (
            // 큐시트 PNG가 준비되기 전까지의 임시 표시. 정답 검증은 정상 동작한다.
            <div className="cue-sheet-fallback">
              <p className="cue-sheet-fallback-title">{puzzle.title}</p>
              {puzzle.cueFallbackText && (
                <p className="cue-sheet-fallback-text">{puzzle.cueFallbackText}</p>
              )}
              {debug && <p className="scene-error-debug">cue: {puzzle.cueImageSrc}</p>}
            </div>
          )}
        </div>

        {/* 정답 입력창 */}
        {puzzle.longInput ? (
          <textarea
            {...inputProps}
            ref={inputRef as React.Ref<HTMLTextAreaElement>}
            className="answer-input answer-input--long"
          />
        ) : (
          <input
            {...inputProps}
            ref={inputRef as React.Ref<HTMLInputElement>}
            type="text"
            inputMode={puzzle.answerType === "number" ? "numeric" : "text"}
          />
        )}

        {/* 확인 버튼 (이미지의 '확인' 위 투명 오버레이) */}
        <button
          type="button"
          className="confirm-button"
          style={CONFIRM_RECT}
          aria-label="정답 확인"
          disabled={locked}
          onClick={submit}
        />

        {/* 결과 / 상태 메시지 */}
        <div className="puzzle-status" aria-live="polite">
          {status === "wrong" && (
            <p className="puzzle-message puzzle-message--wrong">
              정답이 아닙니다. 단서를 다시 확인하세요.
            </p>
          )}
          {status === "correct" && (
            <p className="puzzle-message puzzle-message--correct">
              {puzzle.successMessage ?? "정답이 확인되었습니다."}
            </p>
          )}
        </div>

        {/* 디버그 전용: 퍼즐 강제 성공 (지시서 13장) */}
        {debug && !locked && (
          <div className="puzzle-debug-bar">
            <span>{puzzle.id}</span>
            <button type="button" onClick={succeed}>
              퍼즐 강제 성공
            </button>
          </div>
        )}
      </div>

      {showCueImage && (
        <CueSheetModal
          src={puzzle.cueImageSrc}
          alt={puzzle.title}
          open={modalOpen}
          onClose={() => setModalOpen(false)}
        />
      )}
    </div>
  );
}
