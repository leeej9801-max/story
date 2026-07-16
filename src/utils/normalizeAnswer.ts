// 정답 정규화 및 검증 (지시서 v2 · 8장)

import type { PuzzleDefinition } from "../data/puzzleManifest";

/** 한글/영문 정답: 공백과 문장부호를 제거한 뒤 비교한다. */
export function normalizeKoreanAnswer(value: string): string {
  return value
    .normalize("NFC")
    .toLowerCase()
    .replace(/\s+/g, "")
    .replace(/[.,!?'"“”‘’()[\]{}<>:;·…~`@#$%^&*_+=|\\/-]/g, "");
}

/** 숫자 정답: 숫자 이외의 문자를 모두 제거한다. 앞자리 0은 유지된다. */
export function normalizeNumberAnswer(value: string): string {
  return value.replace(/[^0-9]/g, "");
}

/**
 * 입력값이 정답인지 검사한다.
 *  - matchMode "exact"    → 정규화 후 완전 일치
 *  - matchMode "contains" → 핵심 문장이 포함되면 정답 (앞뒤 글자 허용)
 */
export function isPuzzleAnswerCorrect(
  input: string,
  puzzle: PuzzleDefinition,
): boolean {
  const normalize =
    puzzle.answerType === "number" ? normalizeNumberAnswer : normalizeKoreanAnswer;

  const normalizedInput = normalize(input);
  if (normalizedInput.length === 0) return false;

  return puzzle.acceptedAnswers.some((answer) => {
    const normalizedAnswer = normalize(answer);
    if (normalizedAnswer.length === 0) return false;

    return puzzle.matchMode === "contains"
      ? normalizedInput.includes(normalizedAnswer)
      : normalizedInput === normalizedAnswer;
  });
}
