export class StorageManager {
    constructor(stateRefs, promptInputs, characterResetCallback) {
        this.state = stateRefs; // { baseFrameData, talkingFrameData }
        this.basePromptInput = promptInputs.base;
        this.talkingPromptInput = promptInputs.talking;
        this.characterReset = characterResetCallback;
        this.CHARACTER_STORAGE_KEY = '8bit_dialogue_character';
    }

    // Requires a CanvasRenderer instance to draw loaded images
    async loadAndRenderFrames(renderer, updateStatusCallback) {
        try {
            const storedData = localStorage.getItem(this.CHARACTER_STORAGE_KEY);
            if (storedData) {
                const data = JSON.parse(storedData);

                // Update internal state
                this.state.baseFrameData.set(data.baseFrameData || null);
                this.state.talkingFrameData.set(data.talkingFrameData || null);

                // Update UI prompts
                this.basePromptInput.value = data.basePrompt || '';
                this.talkingPromptInput.value = data.talkingPrompt || '';

                if (this.state.baseFrameData.get()) {
                    await renderer.loadImageToCanvas(this.state.baseFrameData.get(), renderer.getContexts().base);
                    renderer.drawBaseToPreview();
                    updateStatusCallback('base', 'Base Frame Loaded!');
                } else {
                    updateStatusCallback('base', '');
                }

                if (this.state.talkingFrameData.get()) {
                    await renderer.loadImageToCanvas(this.state.talkingFrameData.get(), renderer.getContexts().talking);
                    updateStatusCallback('talking', 'Talking Frame Loaded!');
                } else {
                     updateStatusCallback('talking', '');
                }

                return true;
            }
            return false;
        } catch (e) {
            console.error('Failed to load character:', e);
            return false;
        }
    }

    saveCharacter() {
        if (!this.state.baseFrameData.get() || !this.state.talkingFrameData.get()) {
            alert('Please generate both frames before saving.');
            return;
        }

        try {
            const characterData = {
                basePrompt: this.basePromptInput.value,
                talkingPrompt: this.talkingPromptInput.value,
                baseFrameData: this.state.baseFrameData.get(),
                talkingFrameData: this.state.talkingFrameData.get()
            };
            localStorage.setItem(this.CHARACTER_STORAGE_KEY, JSON.stringify(characterData));
            alert('Character saved successfully!');
        } catch (e) {
            console.error('Failed to save character:', e);
            alert('Failed to save character. Local storage might be full.');
        }
    }

    newCharacter(hasBaseFrameData) {
        // hasBaseFrameData is checked here to determine if confirmation is needed
        if (hasBaseFrameData && !confirm('Are you sure you want to start a new character? Unsaved changes will be lost.')) {
            return;
        }
        // Call the reset function provided by AppController
        this.characterReset();
    }
}