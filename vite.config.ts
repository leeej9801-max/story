import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],

  // ⚠ dist를 비우는 일은 vite에 맡기지 않고 scripts/clean-dist.mjs가 먼저 처리한다.
  //
  // 이 환경의 vite/rolldown은 이미 존재하는 outDir을 비울 때(vite:prepare-out-dir)
  // 0xC0000409(STATUS_STACK_BUFFER_OVERRUN)로 강제 종료된다. 그래서 첫 빌드는 되지만
  // 두 번째 빌드부터 항상 죽는다. build 스크립트가 dist를 먼저 지우면 vite가 비울
  // 대상이 없으므로 문제가 발생하지 않는다.
  //
  // emptyOutDir: false는 "vite가 dist를 비우지 않는다"는 뜻이며, 삭제는 clean 단계가 담당한다.
  // 위 버그가 고쳐지면 이 옵션과 clean 단계를 함께 제거해도 된다.
  build: {
    emptyOutDir: false,
  },
});
