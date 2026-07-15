// Production 빌드 전 콘텐츠 검증 (명세 20장)
//
// storyManifest.ts / puzzleManifest.ts 를 텍스트로 정적 분석해 아래를 검사한다.
//  - 노드 ID 중복 없음
//  - 모든 nextId가 실제 노드에 존재
//  - 컷신/영상/시작 노드의 asset 파일이 public/ 아래에 존재
//  - enabled 퍼즐의 큐시트 존재 + 답이 __ANSWER_REQUIRED__ 아님
//  - 퍼즐 노드의 puzzleId가 puzzleManifest에 존재
//  - 순환 참조 없음 & start → 종료 노드 도달 가능
//
// 텍스트 파싱은 이 저장소가 통제하는 manifest 서식(cut()/puzzle() 헬퍼 + 평면 객체)에
// 맞춰져 있다. 서식을 크게 바꾸면 이 스크립트도 함께 갱신한다.

import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join, resolve } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(__dirname, "..");
const publicDir = join(projectRoot, "public");
const dataDir = join(projectRoot, "src", "data");

const ANSWER_REQUIRED = "__ANSWER_REQUIRED__";
const START_ID = "start";

const errors = [];
const warnings = [];
const err = (m) => errors.push(m);
const warn = (m) => warnings.push(m);

function assetExists(publicPath) {
  // "/assets/scenes/c0-01.png" → public/assets/scenes/c0-01.png
  const rel = publicPath.replace(/^\//, "");
  return existsSync(join(publicDir, rel));
}

// ── storyManifest 파싱 ──────────────────────────────────────────────────────
const storySrc = readFileSync(join(dataDir, "storyManifest.ts"), "utf8");

/** @type {{id:string,type:string,nextId:string|null,asset?:string,puzzleId?:string}[]} */
const nodes = [];

// cut("id", ch, order, "file.png", nextId, transition?)
for (const m of storySrc.matchAll(
  /\bcut\(\s*"([^"]+)"\s*,\s*\d+\s*,\s*\d+\s*,\s*"([^"]+)"\s*,\s*(null|"[^"]+")/g,
)) {
  nodes.push({
    id: m[1],
    type: "cutscene",
    nextId: m[3] === "null" ? null : m[3].slice(1, -1),
    asset: `/assets/scenes/${m[2]}`,
  });
}

// puzzle("id", ch, order, "pid", nextId)
for (const m of storySrc.matchAll(
  /\bpuzzle\(\s*"([^"]+)"\s*,\s*\d+\s*,\s*\d+\s*,\s*"([^"]+)"\s*,\s*(null|"[^"]+")/g,
)) {
  nodes.push({
    id: m[1],
    type: "puzzle",
    nextId: m[3] === "null" ? null : m[3].slice(1, -1),
    puzzleId: m[2],
  });
}

// 평면 객체 노드 (start / video / placeholder). id가 문자열 리터럴인 것만.
for (const block of storySrc.matchAll(/\{[^{}]*?\btype:\s*"[^"]+"[^{}]*?\}/g)) {
  const text = block[0];
  const idM = text.match(/\bid:\s*"([^"]+)"/);
  if (!idM) continue; // 헬퍼 return 객체(shorthand id)는 건너뜀
  const typeM = text.match(/\btype:\s*"([^"]+)"/);
  const nextM = text.match(/\bnextId:\s*(null|"[^"]+")/);
  const imgM = text.match(/\bimageSrc:\s*"([^"]+)"/);
  const vidM = text.match(/\bvideoSrc:\s*"([^"]+)"/);
  nodes.push({
    id: idM[1],
    type: typeM ? typeM[1] : "unknown",
    nextId: nextM ? (nextM[1] === "null" ? null : nextM[1].slice(1, -1)) : null,
    asset: imgM ? imgM[1] : vidM ? vidM[1] : undefined,
  });
}

if (nodes.length === 0) {
  err("storyManifest에서 노드를 하나도 파싱하지 못했습니다. (파서/서식 확인 필요)");
}

// ── puzzleManifest 파싱 ─────────────────────────────────────────────────────
const puzzleSrc = readFileSync(join(dataDir, "puzzleManifest.ts"), "utf8");
/** @type {Record<string,{id:string,cue:string,enabled:boolean,answers:string}>} */
const puzzles = {};
for (const block of puzzleSrc.matchAll(/\{[^{}]*?\bid:\s*"[^"]+"[^{}]*?\}/g)) {
  const text = block[0];
  const idM = text.match(/\bid:\s*"([^"]+)"/);
  const cueM = text.match(/\bcueImageSrc:\s*"([^"]+)"/);
  const enM = text.match(/\benabled:\s*(true|false)/);
  const ansM = text.match(/\bacceptedAnswers:\s*\[([^\]]*)\]/);
  if (!idM || !cueM) continue;
  puzzles[idM[1]] = {
    id: idM[1],
    cue: cueM[1],
    enabled: enM ? enM[1] === "true" : false,
    answers: ansM ? ansM[1] : "",
  };
}

// ── 검사 ────────────────────────────────────────────────────────────────────
const idSet = new Set();
for (const n of nodes) {
  if (idSet.has(n.id)) err(`중복 노드 ID: ${n.id}`);
  idSet.add(n.id);
}

// nextId 유효성 & 종료 노드
for (const n of nodes) {
  if (n.nextId !== null && !idSet.has(n.nextId)) {
    err(`노드 ${n.id}의 nextId "${n.nextId}"가 존재하지 않습니다.`);
  }
  if (n.nextId === null && !["placeholder", "ending"].includes(n.type)) {
    warn(`노드 ${n.id}(${n.type})의 nextId가 null입니다. (막다른 장면일 수 있음)`);
  }
}

// asset 존재
for (const n of nodes) {
  if (n.asset && !assetExists(n.asset)) {
    err(`노드 ${n.id}의 asset 파일이 없습니다: ${n.asset}`);
  }
}

// 퍼즐 노드 → puzzleManifest 참조 & enabled 퍼즐 검증
for (const n of nodes) {
  if (n.type !== "puzzle") continue;
  const p = puzzles[n.puzzleId];
  if (!p) {
    err(`퍼즐 노드 ${n.id}의 puzzleId "${n.puzzleId}"가 puzzleManifest에 없습니다.`);
    continue;
  }
  if (!p.enabled) {
    warn(`퍼즐 ${p.id}는 enabled=false (준비 중)입니다. 참가자 모드에서 임시 통과됩니다.`);
  }
}

// enabled 퍼즐: 큐시트 존재 + 정답 확정
for (const p of Object.values(puzzles)) {
  if (!p.enabled) continue;
  if (!assetExists(p.cue)) err(`퍼즐 ${p.id}의 큐시트가 없습니다: ${p.cue}`);
  if (p.answers.includes(ANSWER_REQUIRED) || p.answers.trim() === "") {
    err(`퍼즐 ${p.id}는 enabled이지만 정답이 확정되지 않았습니다 (${ANSWER_REQUIRED}).`);
  }
}

// 순환 참조 & start → 종료 도달 가능
const nodeById = new Map(nodes.map((n) => [n.id, n]));
if (!nodeById.has(START_ID)) {
  err(`시작 노드 "${START_ID}"가 없습니다.`);
} else {
  const visited = new Set();
  let cur = START_ID;
  let reachedEnd = false;
  while (cur) {
    if (visited.has(cur)) {
      err(`순환 참조 감지: ${[...visited].join(" → ")} → ${cur}`);
      break;
    }
    visited.add(cur);
    const node = nodeById.get(cur);
    if (!node) break; // nextId 오류는 위에서 이미 보고됨
    if (node.nextId === null) {
      reachedEnd = true;
      break;
    }
    cur = node.nextId;
  }
  if (!reachedEnd && errors.length === 0) {
    err("start 노드에서 종료 노드까지 도달하지 못했습니다.");
  }
}

// ── 결과 ────────────────────────────────────────────────────────────────────
console.log(`[validate-content] 노드 ${nodes.length}개 · 퍼즐 ${Object.keys(puzzles).length}개 분석`);
for (const w of warnings) console.warn(`  ⚠ ${w}`);

if (errors.length > 0) {
  console.error(`\n✖ 검증 실패 (${errors.length}건):`);
  for (const e of errors) console.error(`  ✖ ${e}`);
  process.exit(1);
}

console.log("✔ 콘텐츠 검증 통과");
