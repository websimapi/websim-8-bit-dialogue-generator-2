import React from 'react';
import { createRoot } from 'react-dom/client';
import { Player } from '@websim/remotion/player';
import { DialogueComposition } from './composition.jsx';
import { Input, ALL_FORMATS, BlobSource } from 'mediabunny';

const FPS = 30;
const DURATION_SAFETY_FRAMES = 30;

export class VideoClipManager {
    constructor(stateRefs, uiManager) {
        this.state = stateRefs; // { baseFrameData, talkingFrameData, audioUrl, audioDurationSeconds }
        this.uiManager = uiManager;
        this.dialogueTextInput = document.getElementById('dialogueText');
        this.audioPlayer = document.getElementById('audioPlayer');
        this.ttsDurationDisplay = document.getElementById('ttsDuration');
        this.reactRoot = null;

        this.dialogueTextInput.addEventListener('input', () => this.handleDialogueChange());
    }

    handleDialogueChange() {
        // Reset audio state and clip player when dialogue changes
        this.state.audioUrl.set(null);
        this.state.audioDurationSeconds.set(0);
        this.audioPlayer.style.display = 'none';
        this.ttsDurationDisplay.textContent = '';
        this.clearClipPlayer();
        this.uiManager.updateUIState();
    }

    async generateClip() {
        if (!this.state.baseFrameData.get() || !this.state.talkingFrameData.get()) return alert('Please generate both character frames first.');
        const dialogueText = this.dialogueTextInput.value.trim();
        if (!dialogueText) return alert('Please enter dialogue text.');

        this.uiManager.stopLoop();
        this.clearClipPlayer();
        this.uiManager.showLoading('clip', true);

        try {
            // 1. Generate TTS Audio
            document.getElementById('clipStatus').textContent = 'Generating TTS audio...';
            const ttsResult = await websim.textToSpeech({
                text: dialogueText,
                voice: "en-male",
            });
            this.state.audioUrl.set(ttsResult.url);
            this.audioPlayer.src = this.state.audioUrl.get();
            this.audioPlayer.style.display = 'block';

            // 2. Determine Audio Duration
            document.getElementById('clipStatus').textContent = 'Calculating audio duration...';

            const audioBlob = await (await fetch(this.state.audioUrl.get())).blob();
            const input = new Input({ source: new BlobSource(audioBlob), formats: ALL_FORMATS });
            let durationSeconds = await input.computeDuration();

            if (isNaN(durationSeconds) || durationSeconds === 0) {
                // Estimate duration if computation fails
                durationSeconds = Math.max(dialogueText.length * 0.08, 1.5);
            }
            this.state.audioDurationSeconds.set(durationSeconds);

            this.ttsDurationDisplay.textContent = `Audio Duration: ${this.state.audioDurationSeconds.get().toFixed(2)} seconds`;

            const durationInFrames = Math.ceil(this.state.audioDurationSeconds.get() * FPS) + DURATION_SAFETY_FRAMES;

            // 3. Mount Remotion Player
            document.getElementById('clipStatus').textContent = 'Rendering video clip...';

            const clipContainer = document.getElementById('clipContainer');
            clipContainer.style.display = 'block';
            document.getElementById('previewCanvas').classList.add('hidden');

            // Clean up previous root if exists
            if (this.reactRoot) {
                this.reactRoot.unmount();
            }
            this.reactRoot = createRoot(clipContainer);

            this.reactRoot.render(
                <div style={{ width: "100%", height: "100%" }}>
                    <Player
                        component={DialogueComposition}
                        durationInFrames={durationInFrames}
                        fps={FPS}
                        compositionWidth={320}
                        compositionHeight={240}
                        loop={false}
                        controls
                        inputProps={{
                            baseFrameUrl: this.state.baseFrameData.get(),
                            talkingFrameUrl: this.state.talkingFrameData.get(),
                            audioUrl: this.state.audioUrl.get(),
                            audioDurationSeconds: this.state.audioDurationSeconds.get()
                        }}
                        autoplay={false}
                        style={{ maxWidth: "100%", maxHeight: "100%" }}
                    />
                </div>
            );

            document.getElementById('clipStatus').textContent = 'Clip Ready! Press Play on the video player.';

        } catch (error) {
            console.error('Error generating clip:', error);
            document.getElementById('clipStatus').textContent = 'Clip Generation Failed.';
            this.state.audioUrl.set(null);
            this.state.audioDurationSeconds.set(0);
        } finally {
            this.uiManager.showLoading('clip', false);
            this.uiManager.updateUIState();
        }
    }

    clearClipPlayer() {
        const clipContainer = document.getElementById('clipContainer');
        clipContainer.style.display = 'none';
        document.getElementById('previewCanvas').classList.remove('hidden');
        if (this.reactRoot) {
            this.reactRoot.unmount();
            this.reactRoot = null;
        }
    }
}