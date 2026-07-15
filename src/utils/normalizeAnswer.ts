// 정답 정규화 (명세 11장)
// 대소문자, 공백, 하이픈/언더스코어 차이를 흡수해 관대하게 비교한다.

import type { PuzzleInputType } from "../data/puzzleManifest";

export function normalizeAnswer(value: string, inputType: PuzzleInputType): string {
  const normalized = value
    .normalize("NFC")
    .trim()
    .replace(/\s+/g, "")
    .toUpperCase();

  if (inputType === "number") {
    return normalized.replace(/[^0-9]/g, "");
  }

  return normalized.replace(/[-_]/g, "");
}

/** 입력값이 수용 가능한 정답 중 하나와 일치하는지 검사한다. */
export function checkAnswer(
  inputValue: string,
  acceptedAnswers: string[],
  inputType: PuzzleInputType,
): boolean {
  const submitted = normalizeAnswer(inputValue, inputType);
  if (submitted.length === 0) return false;

  return acceptedAnswers.some(
    (answer) => normalizeAnswer(answer, inputType) === submitted,
  );
}
