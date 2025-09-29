export class FrameGenerator {
    constructor(stateRefs, renderer, uiManager) {
        this.state = stateRefs; // { baseFrameData, talkingFrameData }
        this.renderer = renderer;
        this.uiManager = uiManager;
        this.basePromptInput = document.getElementById('basePrompt');
        this.talkingPromptInput = document.getElementById('talkingPrompt');
    }

    async _refineBasePrompt(userPrompt) {
        const systemMessage = `You are a creative prompt refinement expert for 8-bit pixel art image generation. 
        The user is providing a prompt for a character who will be used in a dialogue sequence.
        Your task is to rewrite the user's prompt to ensure the resulting image is:
        1. A clear, head-and-shoulders portrait or close-up of the character, suitable for a classic 8-bit RPG dialogue screen.
        2. Strictly adheres to a retro 8-bit pixel art aesthetic (low resolution, limited color palette, visible pixels).
        3. The composition must NOT contain the words "dialogue box", text, or any user interface elements. The background should be simple and suitable for an in-game scene.
        4. Must be a single, detailed, image generation prompt.
        5. Prioritize stylistic fidelity to classic 8-bit gaming art over photorealism or excessive detail.

        Example refinement: If the user says "a dragon in a cave", you might output "8-bit pixel art close-up portrait of a fierce red dragon's head inside a dimly lit cave. High contrast, limited color palette, low resolution 320x240, retro JRPG style."

        Respond only with the refined prompt string, following the constraints, and no other conversational text.`;
        
        try {
            const completion = await websim.chat.completions.create({
                messages: [
                    {
                        role: "system",
                        content: systemMessage,
                    },
                    {
                        role: "user",
                        content: userPrompt,
                    },
                ],
            });
            return completion.content.trim();
        } catch (error) {
            console.error("Error refining prompt:", error);
            // Fallback to manual prompt concatenation if LLM fails
            return `8-bit pixel art portrait of a character, close-up, no dialogue box. ${userPrompt}. High quality 8-bit pixel art, low resolution 320x240, limited color palette, retro video game aesthetic.`;
        }
    }

    async generateBaseFrame() {
        const prompt = this.basePromptInput.value.trim();
        if (!prompt) {
            alert('Please provide a prompt for the base frame.');
            return;
        }

        this.uiManager.showLoading('base', true);
        document.getElementById('baseStatus').textContent = 'Refining prompt (AI thinking)...';
        
        // --- State Cleanup ---
        this.uiManager.stopLoop();
        this.uiManager.clearClip();
        this.state.talkingFrameData.set(null); 
        this.renderer._initializeCanvases([this.renderer.getContexts().talking]); // Clear talking canvas
        document.getElementById('talkingStatus').textContent = '';
        // --- End State Cleanup ---

        try {
            const refinedPrompt = await this._refineBasePrompt(prompt);
            console.log("Refined Base Prompt:", refinedPrompt);
            
            document.getElementById('baseStatus').textContent = 'Generating image...';

            // 2. Generate Image using the refined prompt
            const result = await websim.imageGen({
                prompt: refinedPrompt,
                width: 320,
                height: 240,
                aspect_ratio: "4:3",
            });

            await this.renderer.loadImageToCanvas(result.url, this.renderer.getContexts().base);
            
            // Update state and preview
            const newBaseData = this.renderer.baseCanvas.toDataURL('image/png');
            this.state.baseFrameData.set(newBaseData);
            this.renderer.drawBaseToPreview();

            document.getElementById('baseStatus').textContent = 'Base Frame Ready!';
            this.talkingPromptInput.value = 'The character opens their mouth slightly to speak, maintaining the exact position and background. ONLY change the mouth.';

        } catch (error) {
            console.error('Error generating base frame:', error);
            document.getElementById('baseStatus').textContent = 'Generation Failed.';
            this.state.baseFrameData.set(null);
        } finally {
            this.uiManager.showLoading('base', false);
            this.uiManager.updateUIState();
        }
    }

    async generateTalkingFrame() {
        if (!this.state.baseFrameData.get()) return;

        const prompt = this.talkingPromptInput.value.trim();
        if (!prompt) {
            alert('Please provide a prompt for the talking frame difference.');
            return;
        }

        this.uiManager.showLoading('talking', true);
        document.getElementById('talkingStatus').textContent = 'Generating...';

        try {
            // Use the base frame as image input for consistency
            const fullPrompt = `STRICTLY modify the input 8-bit pixel art image. Generate a new image that is pixel-for-pixel perfectly aligned and identical to the input image except for a small change to the character's mouth/face: "${prompt}". The character's position, scale, background, and color palette must be rigidly preserved and unchanged. DO NOT alter the background or any part of the image outside the immediate area of the mouth opening. Strict 1:1 registration required, 320x240 resolution.`;

            const result = await websim.imageGen({
                prompt: fullPrompt,
                width: 320,
                height: 240,
                aspect_ratio: "4:3",
                image_inputs: [{
                    url: this.state.baseFrameData.get()
                }]
            });

            await this.renderer.loadImageToCanvas(result.url, this.renderer.getContexts().talking);
            
            // Update state
            const newTalkingData = this.renderer.talkingCanvas.toDataURL('image/png');
            this.state.talkingFrameData.set(newTalkingData);

            document.getElementById('talkingStatus').textContent = 'Talking Frame Ready!';
            this.renderer.startPreviewLoop(); // Auto-start preview loop after generation

        } catch (error) {
            console.error('Error generating talking frame:', error);
            document.getElementById('talkingStatus').textContent = 'Generation Failed.';
            this.state.talkingFrameData.set(null);
        } finally {
            this.uiManager.showLoading('talking', false);
            this.uiManager.updateUIState();
        }
    }

    async cleanupBaseFrame() {
        if (!this.state.baseFrameData.get()) return;

        this.uiManager.showLoading('cleanup', true);
        document.getElementById('baseStatus').textContent = 'Cleaning up base frame (AI Refine)...';
        
        try {
            this.uiManager.stopLoop();
            this.uiManager.clearClip();
            
            const userPrompt = this.basePromptInput.value.trim();
            const refinedPrompt = await this._refineBasePrompt(userPrompt);
            
            const cleanupPrompt = `Refine and clean up this 8-bit pixel art image based on the prompt: "${refinedPrompt}". Ensure the character remains in the extreme close-up view and the background and composition are preserved exactly. Focus on removing minor artifacts and improving overall pixel consistency and quality, while strictly maintaining the 8-bit pixel art aesthetic.`;

            // Use imageGen with image input
            const result = await websim.imageGen({
                prompt: cleanupPrompt,
                width: 320,
                height: 240,
                aspect_ratio: "4:3",
                image_inputs: [{
                    url: this.state.baseFrameData.get()
                }]
            });

            // Update canvas and stored data
            await this.renderer.loadImageToCanvas(result.url, this.renderer.getContexts().base);
            const newBaseData = this.renderer.baseCanvas.toDataURL('image/png');
            this.state.baseFrameData.set(newBaseData);
            this.renderer.drawBaseToPreview();

            document.getElementById('baseStatus').textContent = 'Base Frame Cleaned Up Successfully!';
            
            // Invalidate the talking frame because the base image changed
            this.state.talkingFrameData.set(null);
            this.renderer._initializeCanvases([this.renderer.getContexts().talking]);
            document.getElementById('talkingStatus').textContent = 'Talking Frame invalidated. Please regenerate.';

        } catch (error) {
            console.error('Error cleaning up base frame:', error);
            document.getElementById('baseStatus').textContent = 'Cleanup Failed.';
        } finally {
            this.uiManager.showLoading('cleanup', false);
            this.uiManager.updateUIState();
        }
    }
}