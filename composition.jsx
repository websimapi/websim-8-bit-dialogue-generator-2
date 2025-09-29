import { jsxDEV } from "react/jsx-dev-runtime";
import React, { useMemo, useEffect, useState } from "react";
import { useCurrentFrame, useVideoConfig, AbsoluteFill, Img, Audio, delayRender, continueRender } from "remotion";
const loadImagePromise = (url) => new Promise((resolve, reject) => {
  if (!url) {
    return reject(new Error("Image URL is null/empty"));
  }
  const img = new Image();
  img.crossOrigin = "anonymous";
  img.onload = () => resolve(img);
  img.onerror = (e) => {
    console.error("Image loading failed:", e, url);
    resolve(null);
  };
  img.src = url;
});
const DialogueComposition = ({ baseFrameUrl, talkingFrameUrl, audioUrl, audioDurationSeconds }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const handle = useMemo(() => delayRender(), []);
  const [assetsLoaded, setAssetsLoaded] = useState(false);
  useEffect(() => {
    let isCancelled = false;
    const loadAssets = async () => {
      try {
        await Promise.all([
          loadImagePromise(baseFrameUrl),
          loadImagePromise(talkingFrameUrl)
        ]);
        if (!isCancelled) {
          setAssetsLoaded(true);
          continueRender(handle);
        }
      } catch (error) {
        console.error("Critical asset loading error:", error);
        if (!isCancelled) {
          setAssetsLoaded(true);
          continueRender(handle);
        }
      }
    };
    loadAssets();
    return () => {
      isCancelled = true;
    };
  }, [baseFrameUrl, talkingFrameUrl, handle]);
  if (!assetsLoaded) {
    return /* @__PURE__ */ jsxDEV(AbsoluteFill, { style: { backgroundColor: "#1a1a2e", justifyContent: "center", alignItems: "center", color: "#00ff00", fontSize: 20 }, children: "Loading Assets..." }, void 0, false, {
      fileName: "<stdin>",
      lineNumber: 66,
      columnNumber: 16
    });
  }
  const frameSwitchRate = 4;
  const isTalkingFrame = Math.floor(frame / frameSwitchRate) % 2 === 1;
  const currentFrameUrl = isTalkingFrame ? talkingFrameUrl : baseFrameUrl;
  return /* @__PURE__ */ jsxDEV(AbsoluteFill, { children: [
    currentFrameUrl && /* @__PURE__ */ jsxDEV(
      Img,
      {
        src: currentFrameUrl,
        style: {
          width: "100%",
          height: "100%",
          imageRendering: "pixelated",
          position: "absolute",
          // Explicitly position to ensure no layout bounce
          top: 0,
          left: 0
        }
      },
      void 0,
      false,
      {
        fileName: "<stdin>",
        lineNumber: 84,
        columnNumber: 17
      }
    ),
    audioUrl && /* @__PURE__ */ jsxDEV(Audio, { src: audioUrl }, void 0, false, {
      fileName: "<stdin>",
      lineNumber: 98,
      columnNumber: 26
    })
  ] }, void 0, true, {
    fileName: "<stdin>",
    lineNumber: 81,
    columnNumber: 9
  });
};
export {
  DialogueComposition
};
