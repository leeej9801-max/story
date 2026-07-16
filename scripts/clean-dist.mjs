// 빌드 전 dist/ 삭제
//
// ⚠ 이 환경(Windows + OneDrive + Node 24)에서는 재귀 삭제가 네이티브 크래시를 일으킨다.
//
//   fs.rmSync(dist, { recursive: true })
//     → 0xC0000409 (STATUS_STACK_BUFFER_OVERRUN)로 프로세스 강제 종료. 메시지 없음.
//
// vite의 outDir 비우기(vite:prepare-out-dir)도 내부적으로 같은 재귀 삭제를 쓰므로
// dist가 이미 있으면 `vite build`가 통째로 죽었다. (첫 빌드만 성공하고 두 번째부터 크래시)
//
// 해결: 재귀 삭제 API를 쓰지 않고 파일을 하나씩 unlink한 뒤 아래에서 위로 rmdir한다.
// 이 방식은 정상 동작한다. vite.config.ts의 build.emptyOutDir: false와 짝을 이룬다.
//
// Node의 재귀 삭제 버그가 고쳐지면 이 스크립트와 emptyOutDir 설정을 함께 제거해도 된다.

import { existsSync, readdirSync, rmdirSync, unlinkSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join, resolve } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const distDir = join(resolve(__dirname, ".."), "dist");

let files = 0;
let dirs = 0;

/** 재귀 삭제 API를 쓰지 않고 아래에서 위로 직접 지운다. */
function removeTree(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, entry.name);
    if (entry.isDirectory()) {
      removeTree(p);
    } else {
      unlinkSync(p);
      files += 1;
    }
  }
  rmdirSync(dir);
  dirs += 1;
}

if (!existsSync(distDir)) {
  console.log("[clean-dist] dist/ 없음 · 건너뜀");
  process.exit(0);
}

removeTree(distDir);

if (existsSync(distDir)) {
  console.error("[clean-dist] dist/를 지우지 못했습니다. 파일이 열려 있는지 확인하세요.");
  process.exit(1);
}

console.log(`[clean-dist] dist/ 삭제 완료 · 파일 ${files}개 · 폴더 ${dirs}개`);
