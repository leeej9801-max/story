import { useEffect } from "react";

// 다음/다다음 장면을 미리 로드해 검은 깜빡임을 줄인다. (명세 8.5)
export function useImagePreload(
  imageSrcs: Array<string | null | undefined>,
  videoSrcs: Array<string | null | undefined> = [],
): void {
  const imgKey = imageSrcs.filter(Boolean).join("|");
  const vidKey = videoSrcs.filter(Boolean).join("|");

  useEffect(() => {
    const images = imgKey ? imgKey.split("|") : [];
    images.forEach((src) => {
      const img = new Image();
      img.src = src;
    });

    // 영상은 metadata만 미리 받는다.
    const videos = vidKey ? vidKey.split("|") : [];
    const els = videos.map((src) => {
      const v = document.createElement("video");
      v.preload = "metadata";
      v.src = src;
      return v;
    });

    return () => {
      els.forEach((v) => {
        v.src = "";
      });
    };
  }, [imgKey, vidKey]);
}
