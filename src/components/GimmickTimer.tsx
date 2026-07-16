import { useEffect, useRef, useState } from "react";
import { VOLUME, getGimmickAudio } from "../data/audioManifest";
import { playSfx } from "../utils/audio";

interface GimmickTimerProps {
  gimmickId: string;
  debug: boolean;
  onComplete: () => void;
}

const TOTAL_SECONDS = 10;
/** 0초 도달 후 정적 시간 → 이후 다음 영상 자동 재생 (지시서 9.3) */
const SILENCE_MS = 800;
/** 이 시점부터 타이머 색과 진동 강도가 증가한다. (지시서 9.3) */
const URGENT_AT = 3;

// 기믹 6 — 10초 음성 응답 타이머 (지시서 v2 · 9장)
//
// 참가자에게 말로 대답해야 할 것 같은 압박을 주지만 프로그램은 음성 인식을 하지 않는다.
//  - 마이크 권한을 요청하지 않는다.
//  - 음성 인식 API를 사용하지 않는다.
//  - 참가자가 클릭해서 타이머를 멈출 수 없다.
//  - 타이머는 무엇을 말하든 반드시 0초까지 진행한다.
//  - 새로고침하면 기믹 시작(10초)부터 다시 카운트한다.
export function GimmickTimer({ gimmickId, debug, onComplete }: GimmickTimerProps) {
  const [remaining, setRemaining] = useState(TOTAL_SECONDS);

  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;
  // StrictMode의 이펙트 2회 실행에도 지시 음성이 겹치지 않게 한다.
  const promptedForRef = useRef<string | null>(null);

  // 진입 시 음성 지시 재생
  useEffect(() => {
    setRemaining(TOTAL_SECONDS);

    const audio = getGimmickAudio(gimmickId);
    if (audio && promptedForRef.current !== gimmickId) {
      promptedForRef.current = gimmickId;
      playSfx(audio.prompt, VOLUME.correct);
    }
  }, [gimmickId]);

  // 1초마다 감소
  useEffect(() => {
    if (remaining <= 0) return;

    const t = window.setTimeout(() => {
      const audio = getGimmickAudio(gimmickId);
      if (audio) playSfx(audio.tick, VOLUME.bgm);
      setRemaining((r) => r - 1);
    }, 1000);

    return () => window.clearTimeout(t);
  }, [remaining, gimmickId]);

  // 0초 도달 → 무응답 판정음 → 800ms 정적 → 다음 영상
  useEffect(() => {
    if (remaining > 0) return;

    const audio = getGimmickAudio(gimmickId);
    if (audio) playSfx(audio.timeout, VOLUME.correct);

    const t = window.setTimeout(() => onCompleteRef.current(), SILENCE_MS);
    return () => window.clearTimeout(t);
  }, [remaining, gimmickId]);

  const urgent = remaining <= URGENT_AT;

  return (
    <div className="screen gimmick-screen">
      <div
        className={`gimmick-timer${urgent ? " gimmick-timer--urgent" : ""}`}
        aria-live="off"
      >
        {remaining}
      </div>

      <p className="gimmick-prompt">지금, 소리 내어 대답하십시오.</p>

      {debug && (
        <div className="gimmick-debug-bar">
          <button type="button" onClick={() => setRemaining(0)}>
            타이머 즉시 0초
          </button>
        </div>
      )}
    </div>
  );
}
