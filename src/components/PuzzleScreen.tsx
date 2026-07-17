import { useEffect, useRef, useState } from "react";
import type { PuzzleDefinition } from "../data/puzzleManifest";
import { isPuzzleAnswerCorrect } from "../utils/normalizeAnswer";
import { BGM_FADE_MS, VOLUME, getPuzzleAudio } from "../data/audioManifest";
import { fadeOutBgm, playSfx, playVoice, startBgm } from "../utils/audio";
import { CueSheetModal } from "./CueSheetModal";
import { CueRule } from "./CueRule";

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
/** 큐시트 로드 실패 시 대체 문구로 넘어가기 전 재시도 횟수 */
const CUE_MAX_RETRY = 3;
/** scene 레이아웃 입력줄 기본 위치 (노이즈 퍼즐 7·8) */
const DEFAULT_SCENE_INPUT_RECT = {
  left: "16%",
  top: "83%",
  width: "68%",
  height: "11.5%",
};
/**
 * 정답 후 다음 단계로 넘어가기까지의 기본 대기 시간.
 * BGM 페이드아웃(3초)이 끝난 뒤 다음 영상이 시작되도록 페이드 길이와 맞춘다.
 */
const DEFAULT_SUCCESS_HOLD_MS = BGM_FADE_MS;
const DEFAULT_REVEAL_MS = 6000;

type Status = "idle" | "wrong" | "correct";

// 퍼즐 공통 화면 (지시서 v2 · 6장)
//
// 레이아웃은 두 가지다.
//  - frame: 공통 퍼즐 프레임 + 큐시트 (퍼즐 1~5, 9)
//  - scene: 노이즈 장면 배경 + 설명 박스 + 입력줄 (퍼즐 7·8)
//
// 어느 쪽이든 나가기, 이전, 다음, 영상으로 돌아가기, 퍼즐 건너뛰기는 제공하지 않는다.
// 정답을 맞히기 전에는 어떤 방법으로도 다음 단계로 이동할 수 없다. (지시서 6.3)
export function PuzzleScreen({ puzzle, debug, onSolved, onAttempt }: PuzzleScreenProps) {
  const [value, setValue] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [shake, setShake] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [frameError, setFrameError] = useState(false);
  const [cueError, setCueError] = useState(false);
  /**
   * 큐시트 로드 재시도 횟수.
   * 3MB짜리 PNG라 회선/디스크가 순간적으로 막히면 한 번씩 로드가 실패할 수 있는데,
   * 그때 곧바로 대체 문구로 넘어가 버리면 행사 중에 큐시트가 영영 안 보인다.
   * 그래서 대체 문구로 넘어가기 전에 몇 번 다시 시도한다.
   */
  const [cueRetry, setCueRetry] = useState(0);
  // 정답 후 성공 이미지를 전체 화면으로 보여주는 연출 (퍼즐 7·8)
  const [revealing, setRevealing] = useState(false);

  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);
  const lastSubmitRef = useRef(0);
  const solveTimer = useRef<number | undefined>(undefined);
  const revealTimer = useRef<number | undefined>(undefined);
  const cancelVoice = useRef<(() => void) | undefined>(undefined);
  // StrictMode의 이펙트 2회 실행에도 진입음이 겹치지 않게 한다.
  const openedForRef = useRef<string | null>(null);

  const locked = status === "correct";
  const audio = getPuzzleAudio(puzzle.id);
  const isScene = puzzle.layout === "scene";
  const showCueImage = !isScene && !puzzle.cuePending && !cueError;

  // 퍼즐이 바뀌면 상태를 초기화하고 진입음 + BGM을 시작한다. (지시서 11.3)
  useEffect(() => {
    setValue("");
    setStatus("idle");
    setShake(false);
    setModalOpen(false);
    setCueError(false);
    setCueRetry(0);
    setRevealing(false);

    const set = getPuzzleAudio(puzzle.id);
    if (set && openedForRef.current !== puzzle.id) {
      openedForRef.current = puzzle.id;
      playSfx(set.open, VOLUME.open);
      startBgm(set.bgm, set.bgmVolume);
    }

    return () => {
      if (solveTimer.current) window.clearTimeout(solveTimer.current);
      if (revealTimer.current) window.clearTimeout(revealTimer.current);
      cancelVoice.current?.();
    };
  }, [puzzle.id]);

  function succeed() {
    setStatus("correct");

    // 정답 즉시 BGM을 3초에 걸쳐 페이드아웃한다.
    // 다음 오디오(영상 소리 / 성공 음성)는 페이드가 끝난 뒤에 시작하므로 서로 겹치지 않는다.
    fadeOutBgm(BGM_FADE_MS);

    // 노이즈 퍼즐(7·8): 페이드가 끝나면 성공 이미지 + 음성.
    // 음성이 끝날 때까지 이미지를 유지하고, 그다음 단계로 넘어간다.
    if (puzzle.successImageSrc) {
      revealTimer.current = window.setTimeout(() => {
        setRevealing(true);
        cancelVoice.current = playVoice(
          audio?.correct ?? "",
          VOLUME.correct,
          puzzle.successRevealMs ?? DEFAULT_REVEAL_MS,
          onSolved,
        );
      }, BGM_FADE_MS);
      return;
    }

    // 일반 퍼즐: 정답 효과음 → BGM 페이드가 끝나면 다음 영상
    if (audio) playSfx(audio.correct, VOLUME.correct);
    solveTimer.current = window.setTimeout(
      onSolved,
      puzzle.successHoldMs ?? DEFAULT_SUCCESS_HOLD_MS,
    );
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

  const commonInputProps = {
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

  const debugBar = debug && !locked && (
    <div className="puzzle-debug-bar">
      <span>{puzzle.id}</span>
      <button type="button" onClick={succeed}>
        퍼즐 강제 성공
      </button>
    </div>
  );

  // ── 정답 후 성공 이미지 연출 (퍼즐 7·8) ──────────────────────────────────
  // 음성이 끝나면(음원이 없으면 successRevealMs 후) 자동으로 다음 단계로 넘어간다.
  if (revealing && puzzle.successImageSrc) {
    return (
      <div className="screen puzzle-reveal">
        <img
          className="puzzle-reveal-image"
          src={puzzle.successImageSrc}
          alt={`${puzzle.title} 해독 완료`}
          draggable={false}
        />
      </div>
    );
  }

  // ── scene 레이아웃: 노이즈 퍼즐 7·8 ──────────────────────────────────────
  if (isScene) {
    return (
      <div className="screen puzzle-screen">
        <div className={`noise-stage${shake ? " puzzle-stage--shake" : ""}`}>
          <img className="noise-bg" src={puzzle.backgroundSrc} alt="" draggable={false} />

          {/* 설명 박스 — 목탄으로 쓴 양피지 쪽지 */}
          {puzzle.briefText && (
            <div className="noise-brief">
              <p className="noise-brief-text">{puzzle.briefText}</p>
            </div>
          )}

          {/* 입력줄: 입력창 + 정답 버튼.
              퍼즐 7·8은 화면 하단, 퍼즐 9는 배경에 그려진 입력칸 위에 놓인다. */}
          <div
            className="noise-input-row"
            style={puzzle.inputRect ?? DEFAULT_SCENE_INPUT_RECT}
          >
            {/* 장문(7·8)은 textarea, 짧은 답(9)은 input.
                input이어야 글자가 세로 가운데에 온다. */}
            {puzzle.longInput ? (
              <textarea
                {...commonInputProps}
                ref={inputRef as React.Ref<HTMLTextAreaElement>}
                className="noise-input"
                rows={2}
              />
            ) : (
              <input
                {...commonInputProps}
                ref={inputRef as React.Ref<HTMLInputElement>}
                className="noise-input noise-input--short"
                type="text"
                inputMode={puzzle.answerType === "number" ? "numeric" : "text"}
              />
            )}
            <button
              type="button"
              className="noise-confirm"
              aria-label="정답 확인"
              disabled={locked}
              onClick={submit}
            >
              정답
            </button>
          </div>

          {status === "wrong" && (
            <p className="noise-message">아직 소음뿐이다. 다시 귀를 기울여라.</p>
          )}

          {/* 정답 직후 BGM이 3초간 잦아드는 동안의 상태 표시 */}
          {status === "correct" && (
            <p className="noise-message noise-message--correct">소음이 잦아든다…</p>
          )}

          {debugBar}
        </div>
      </div>
    );
  }

  // ── frame 레이아웃: 퍼즐 1~5, 9 ──────────────────────────────────────────
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
              {/* 큐시트 원본 비율(1672×941) 상자.
                  이미지가 슬롯 안에서 레터박스로 들어가므로, 안내를 이미지 모서리에
                  정확히 붙이려면 이미지와 같은 크기의 상자가 필요하다. */}
              <span className="cue-sheet-frame">
                <img
                  className="cue-sheet-image"
                  // 재시도할 때만 쿼리를 붙여 실패한 캐시를 우회한다
                  key={cueRetry}
                  src={cueRetry === 0 ? puzzle.cueImageSrc : `${puzzle.cueImageSrc}?r=${cueRetry}`}
                  alt={puzzle.title}
                  draggable={false}
                  onError={() => {
                    if (cueRetry < CUE_MAX_RETRY) setCueRetry((r) => r + 1);
                    else setCueError(true);
                  }}
                />
                {puzzle.cueNote && <span className="cue-note">{puzzle.cueNote}</span>}
                {puzzle.cueRule && <CueRule text={puzzle.cueRule} />}
                {puzzle.cueAside && <span className="cue-aside">{puzzle.cueAside}</span>}
              </span>
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
            {...commonInputProps}
            ref={inputRef as React.Ref<HTMLTextAreaElement>}
            className="answer-input answer-input--long"
            style={INPUT_RECT}
          />
        ) : (
          <input
            {...commonInputProps}
            ref={inputRef as React.Ref<HTMLInputElement>}
            className="answer-input"
            style={INPUT_RECT}
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

        {debugBar}
      </div>

      {showCueImage && puzzle.cueImageSrc && (
        <CueSheetModal
          src={puzzle.cueImageSrc}
          alt={puzzle.title}
          note={puzzle.cueNote}
          rule={puzzle.cueRule}
          aside={puzzle.cueAside}
          open={modalOpen}
          onClose={() => setModalOpen(false)}
        />
      )}
    </div>
  );
}
