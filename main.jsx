import React from "react";
import { createRoot } from "react-dom/client";
import { Player } from "@websim/remotion/player";
import { DialogueComposition } from "./composition.jsx";
import { Input, ALL_FORMATS, BlobSource } from "mediabunny";
import { AppController } from "./AppController.js";
const FPS = 30;
const DURATION_SAFETY_FRAMES = 30;
document.addEventListener("DOMContentLoaded", () => {
  window.dialogueGenerator = new AppController();
});
