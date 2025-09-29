import { jsxDEV } from "react/jsx-dev-runtime";
import React from "react";
import * as Remotion from "remotion";
const DialogueComposition = ({ baseFrameUrl, talkingFrameUrl, audioUrl, audioDurationSeconds }) => {
  const frame = Remotion.useCurrentFrame();
  const { fps } = Remotion.useVideoConfig();
  const renderHandle = React.useRef(Remotion.delayRender());
  const [assetsLoaded, setAssetsLoaded] = React.useState(false);
  React.useEffect(() => {
    let loadedCount = 0;
    const totalAssets = 2;
    const checkLoad = () => {
      loadedCount++;
      if (loadedCount === totalAssets) {
        setAssetsLoaded(true);
        Remotion.continueRender(renderHandle.current);
      }
    };
    const img1 = new Image();
    img1.onload = checkLoad;
    img1.onerror = () => {
      console.error("Error loading base frame");
      checkLoad();
    };
    img1.src = baseFrameUrl;
    const img2 = new Image();
    img2.onload = checkLoad;
    img2.onerror = () => {
      console.error("Error loading talking frame");
      checkLoad();
    };
    img2.src = talkingFrameUrl;
  }, [baseFrameUrl, talkingFrameUrl]);
  if (!assetsLoaded) {
    return /* @__PURE__ */ jsxDEV(Remotion.AbsoluteFill, { style: { backgroundColor: "#1a1a2e", justifyContent: "center", alignItems: "center", color: "#00ff00", fontSize: 20 }, children: "Loading Assets..." }, void 0, false, {
      fileName: "<stdin>",
      lineNumber: 37,
      columnNumber: 16
    });
  }
  const frameSwitchRate = 4;
  const isTalkingFrame = Math.floor(frame / frameSwitchRate) % 2 === 1;
  const currentFrameUrl = isTalkingFrame ? talkingFrameUrl : baseFrameUrl;
  return /* @__PURE__ */ jsxDEV(Remotion.AbsoluteFill, { children: [
    /* @__PURE__ */ jsxDEV(
      Remotion.Img,
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
        lineNumber: 54,
        columnNumber: 13
      }
    ),
    /* @__PURE__ */ jsxDEV(Remotion.Audio, { src: audioUrl }, void 0, false, {
      fileName: "<stdin>",
      lineNumber: 67,
      columnNumber: 13
    })
  ] }, void 0, true, {
    fileName: "<stdin>",
    lineNumber: 52,
    columnNumber: 9
  });
};
export {
  DialogueComposition
};
