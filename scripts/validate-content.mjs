// Production 빌드 전 콘텐츠 검증 (지시서 v2)
//
// sequenceManifest.ts / puzzleManifest.ts 를 텍스트로 정적 분석해 아래를 검사한다.
//  - 단계 ID 중복 없음
//  - 모든 nextStepId가 실제 단계에 존재
//  - 영상 파일이 public/ 아래에 존재 (pending 단계는 경고)
//  - 퍼즐 단계의 puzzleId가 puzzleManifest에 존재
//  - 큐시트 존재 (cuePending 퍼즐은 경고)
//  - 퍼즐 정답이 비어있지 않음
//  - 순환 참조 없음 & 첫 단계 → complete 도달 가능
//  - 6번은 퍼즐이 아니라 기믹 (puzzle-06이 있으면 오류)
//
// 텍스트 파싱은 이 저장소가 통제하는 manifest 서식(평면 객체 리터럴)에 맞춰져 있다.
// 서식을 크게 바꾸면 이 스크립트도 함께 갱신한다.

import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join, resolve } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(__dirname, "..");
const publicDir = join(projectRoot, "public");
const dataDir = join(projectRoot, "src", "data");

const errors = [];
const warnings = [];
const err = (m) => errors.push(m);
const warn = (m) => warnings.push(m);

function assetExists(publicPath) {
  // "/assets/video/part1.mp4" → public/assets/video/part1.mp4
  return existsSync(join(publicDir, publicPath.replace(/^\//, "")));
}

// ── sequenceManifest 파싱 ───────────────────────────────────────────────────
const seqSrc = readFileSync(join(dataDir, "sequenceManifest.ts"), "utf8");

/** @type {{id:string,type:string,nextStepId:string|null,src?:string,puzzleId?:string,gimmickId?:string,pending:boolean}[]} */
const steps = [];

for (const block of seqSrc.matchAll(/\{[^{}]*?\bid:\s*"[^"]+"[^{}]*?\}/g)) {
  const text = block[0];
  const idM = text.match(/\bid:\s*"([^"]+)"/);
  const typeM = text.match(/\btype:\s*"([^"]+)"/);
  if (!idM || !typeM) continue;

  const nextM = text.match(/\bnextStepId:\s*(null|"[^"]+")/);
  const srcM = text.match(/\bsrc:\s*"([^"]+)"/);
  const puzM = text.match(/\bpuzzleId:\s*"([^"]+)"/);
  const gimM = text.match(/\bgimmickId:\s*"([^"]+)"/);

  steps.push({
    id: idM[1],
    type: typeM[1],
    nextStepId: nextM ? (nextM[1] === "null" ? null : nextM[1].slice(1, -1)) : null,
    src: srcM ? srcM[1] : undefined,
    puzzleId: puzM ? puzM[1] : undefined,
    gimmickId: gimM ? gimM[1] : undefined,
    pending: /\bpending:\s*true/.test(text),
  });
}

const firstStepM = seqSrc.match(/FIRST_STEP_ID\s*=\s*"([^"]+)"/);
const FIRST_STEP_ID = firstStepM ? firstStepM[1] : "video-01";

if (steps.length === 0) {
  err("sequenceManifest에서 단계를 하나도 파싱하지 못했습니다. (파서/서식 확인 필요)");
}

// ── puzzleManifest 파싱 ─────────────────────────────────────────────────────
const puzzleSrc = readFileSync(join(dataDir, "puzzleManifest.ts"), "utf8");
/** @type {Record<string,{id:string,cue:string,answers:string,cuePending:boolean}>} */
const puzzles = {};

// 퍼즐 정의는 acceptedAnswers 배열을 포함하므로 중첩 [] 를 허용해 블록을 잡는다.
for (const block of puzzleSrc.matchAll(/\{\s*\bid:\s*"puzzle-\d+"[\s\S]*?\n  \},/g)) {
  const text = block[0];
  const idM = text.match(/\bid:\s*"([^"]+)"/);
  const cueM = text.match(/\bcueImageSrc:\s*"([^"]+)"/);
  const ansM = text.match(/\bacceptedAnswers:\s*\[([\s\S]*?)\]/);
  if (!idM || !cueM) continue;

  puzzles[idM[1]] = {
    id: idM[1],
    cue: cueM[1],
    answers: ansM ? ansM[1] : "",
    cuePending: /\bcuePending:\s*true/.test(text),
  };
}

if (Object.keys(puzzles).length === 0) {
  err("puzzleManifest에서 퍼즐을 하나도 파싱하지 못했습니다. (파서/서식 확인 필요)");
}

// ── 검사 ────────────────────────────────────────────────────────────────────
const idSet = new Set();
for (const s of steps) {
  if (idSet.has(s.id)) err(`중복 단계 ID: ${s.id}`);
  idSet.add(s.id);
}

// nextStepId 유효성
for (const s of steps) {
  if (s.nextStepId !== null && !idSet.has(s.nextStepId)) {
    err(`단계 ${s.id}의 nextStepId "${s.nextStepId}"가 존재하지 않습니다.`);
  }
  if (s.nextStepId === null && s.type !== "complete") {
    err(`단계 ${s.id}(${s.type})의 nextStepId가 null입니다. complete 단계만 null일 수 있습니다.`);
  }
}

// 영상 파일 존재
for (const s of steps) {
  if (s.type !== "video" || !s.src) continue;
  if (assetExists(s.src)) {
    if (s.pending) {
      warn(`단계 ${s.id}는 pending인데 영상 파일이 이미 있습니다: ${s.src} → pending을 지우세요.`);
    }
  } else if (s.pending) {
    warn(`단계 ${s.id}의 영상이 아직 없습니다(제작 중): ${s.src}`);
  } else {
    err(`단계 ${s.id}의 영상 파일이 없습니다: ${s.src}`);
  }
}

// 퍼즐 단계 → puzzleManifest 참조
for (const s of steps) {
  if (s.type !== "puzzle") continue;
  if (!puzzles[s.puzzleId]) {
    err(`퍼즐 단계 ${s.id}의 puzzleId "${s.puzzleId}"가 puzzleManifest에 없습니다.`);
  }
}

// 6번은 정답 입력 퍼즐이 아니라 타이머 기믹이다. (지시서 1장)
if (puzzles["puzzle-06"]) {
  err("puzzle-06이 정의되어 있습니다. 6번은 정답 입력 퍼즐이 아니라 10초 타이머 기믹입니다.");
}
if (!steps.some((s) => s.type === "gimmick" && s.gimmickId === "gimmick-06")) {
  err("기믹 6(gimmick-06) 단계가 시퀀스에 없습니다.");
}

// 퍼즐: 큐시트 존재 + 정답 확정
for (const p of Object.values(puzzles)) {
  if (assetExists(p.cue)) {
    if (p.cuePending) {
      warn(`퍼즐 ${p.id}는 cuePending인데 큐시트가 이미 있습니다: ${p.cue} → cuePending을 지우세요.`);
    }
  } else if (p.cuePending) {
    warn(`퍼즐 ${p.id}의 큐시트가 아직 없습니다(제작 중): ${p.cue}`);
  } else {
    err(`퍼즐 ${p.id}의 큐시트가 없습니다: ${p.cue}`);
  }

  if (p.answers.trim() === "") {
    err(`퍼즐 ${p.id}의 정답(acceptedAnswers)이 비어 있습니다.`);
  }
}

// 퍼즐 2의 앞자리 0 유지 검증 (지시서 16장 완료 조건)
if (puzzles["puzzle-02"] && !/"0912"/.test(puzzles["puzzle-02"].answers)) {
  err('퍼즐 2의 정답이 문자열 "0912"가 아닙니다. 숫자 타입이면 앞자리 0이 사라집니다.');
}

// 공통 퍼즐 프레임
if (!assetExists("/assets/ui/puzzle-frame.png")) {
  err("공통 퍼즐 프레임이 없습니다: /assets/ui/puzzle-frame.png");
}

// 순환 참조 & 첫 단계 → complete 도달 가능
const stepById = new Map(steps.map((s) => [s.id, s]));
if (!stepById.has(FIRST_STEP_ID)) {
  err(`첫 단계 "${FIRST_STEP_ID}"가 없습니다.`);
} else {
  const visited = new Set();
  let cur = FIRST_STEP_ID;
  let reachedEnd = false;
  while (cur) {
    if (visited.has(cur)) {
      err(`순환 참조 감지: ${[...visited].join(" → ")} → ${cur}`);
      break;
    }
    visited.add(cur);
    const step = stepById.get(cur);
    if (!step) break; // nextStepId 오류는 위에서 이미 보고됨
    if (step.type === "complete") {
      reachedEnd = true;
      break;
    }
    cur = step.nextStepId;
  }
  if (!reachedEnd && errors.length === 0) {
    err("첫 단계에서 complete 단계까지 도달하지 못했습니다.");
  }

  // 도달 불가능한 단계 경고
  for (const s of steps) {
    if (!visited.has(s.id)) warn(`단계 ${s.id}는 진행 경로에서 도달할 수 없습니다.`);
  }
}

// ── 결과 ────────────────────────────────────────────────────────────────────
const videoCount = steps.filter((s) => s.type === "video").length;
const puzzleStepCount = steps.filter((s) => s.type === "puzzle").length;
console.log(
  `[validate-content] 단계 ${steps.length}개 (영상 ${videoCount} · 퍼즐 ${puzzleStepCount} · 기믹 ${
    steps.filter((s) => s.type === "gimmick").length
  }) · 퍼즐 정의 ${Object.keys(puzzles).length}개 분석`,
);
for (const w of warnings) console.warn(`  ⚠ ${w}`);

if (errors.length > 0) {
  console.error(`\n✖ 검증 실패 (${errors.length}건):`);
  for (const e of errors) console.error(`  ✖ ${e}`);
  process.exit(1);
}

console.log("✔ 콘텐츠 검증 통과");
