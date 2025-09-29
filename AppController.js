import { CanvasRenderer } from './CanvasRenderer.js';
import { FrameGenerator } from './FrameGenerator.js';
import { VideoClipManager } from './VideoClipManager.jsx';
import { StorageManager } from './StorageManager.js';

export class AppController {
    constructor() {
        // Elements
        this.baseCanvas = document.getElementById('baseFrameCanvas');
        this.talkingCanvas = document.getElementById('talkingFrameCanvas');
        this.previewCanvas = document.getElementById('previewCanvas');
        this.basePromptInput = document.getElementById('basePrompt');
        this.talkingPromptInput = document.getElementById('talkingPrompt');
        this.dialogueTextInput = document.getElementById('dialogueText');

        // State (using simple setter/getter wrappers for shared state management)
        this._state = {
            baseFrameData: null,
            talkingFrameData: null,
            audioUrl: null,
            audioDurationSeconds: 0,
            isGenerating: false,
        };

        // State references passed to sub-managers for read/write access
        this.stateRefs = {
            baseFrameData: { get: () => this._state.baseFrameData, set: (v) => this._state.baseFrameData = v },
            talkingFrameData: { get: () => this._state.talkingFrameData, set: (v) => this._state.talkingFrameData = v },
            audioUrl: { get: () => this._state.audioUrl, set: (v) => this._state.audioUrl = v },
            audioDurationSeconds: { get: () => this._state.audioDurationSeconds, set: (v) => this._state.audioDurationSeconds = v },
            isGenerating: { get: () => this._state.isGenerating, set: (v) => this._state.isGenerating = v }
        };

        // Sub-Managers Initialization
        this.renderer = new CanvasRenderer(
            this.baseCanvas, 
            this.talkingCanvas, 
            this.previewCanvas, 
            this.stateRefs.baseFrameData, 
            this.stateRefs.talkingFrameData, 
            () => this.updateUIState()
        );

        // AppController provides itself as UI Manager interface for loading states, loops, and clip management
        this.frameGenerator = new FrameGenerator(this.stateRefs, this.renderer, this);
        this.clipManager = new VideoClipManager(this.stateRefs, this);

        this.storageManager = new StorageManager(
            this.stateRefs, 
            { base: this.basePromptInput, talking: this.talkingPromptInput },
            () => this._resetCharacterState()
        );

        this.bindEvents();
        this.updateUIState();
        this.loadCharacterFromStorage(false);
    }

    // --- Public Utility Methods for Sub-managers ---
    // These methods provide controlled access to state/manager functionality

    stopLoop() {
        this.renderer.stopPreviewLoop();
    }

    startLoop() {
        this.renderer.startPreviewLoop();
    }

    clearClip() {
        this.clipManager.clearClipPlayer();
    }

    loadCharacterFromStorage(userInitiated) {
        this.storageManager.loadAndRenderFrames(
            this.renderer,
            (type, message) => document.getElementById(type + 'Status').textContent = message
        ).then(loaded => {
             if (userInitiated) {
                if (loaded) {
                    alert('Character loaded successfully!');
                } else {
                    alert('No saved character found.');
                }
            }
            this.updateUIState();
        });
    }

    // --- UI/Event Binding ---

    bindEvents() {
        document.getElementById('generateBaseFrame').addEventListener('click', () => this.frameGenerator.generateBaseFrame());
        document.getElementById('generateTalkingFrame').addEventListener('click', () => this.frameGenerator.generateTalkingFrame());
        document.getElementById('cleanupBaseFrame').addEventListener('click', () => this.frameGenerator.cleanupBaseFrame());
        document.getElementById('previewLoop').addEventListener('click', () => this.startLoop());
        document.getElementById('stopLoop').addEventListener('click', () => this.stopLoop());
        document.getElementById('generateClip').addEventListener('click', () => this.clipManager.generateClip());
        document.getElementById('saveCharacter').addEventListener('click', () => this.storageManager.saveCharacter());
        document.getElementById('loadCharacter').addEventListener('click', () => this.loadCharacterFromStorage(true));
        document.getElementById('newCharacter').addEventListener('click', () => this.storageManager.newCharacter(!!this._state.baseFrameData));
    }

    updateUIState() {
        const hasBase = !!this._state.baseFrameData;
        const hasTalking = !!this._state.talkingFrameData;
        const hasDialogue = this.dialogueTextInput.value.trim().length > 0;
        const isGenerating = this._state.isGenerating;

        // Base frame controls
        this.basePromptInput.disabled = isGenerating || hasBase;
        document.getElementById('generateBaseFrame').disabled = isGenerating;

        // Cleanup button state
        document.getElementById('cleanupBaseFrame').disabled = isGenerating || !hasBase;

        // Talking frame controls
        this.talkingCanvas.classList.toggle('hidden', !hasBase);
        this.talkingPromptInput.disabled = isGenerating || !hasBase;
        document.getElementById('generateTalkingFrame').disabled = isGenerating || !hasBase;

        // Loop controls
        document.getElementById('previewLoop').disabled = isGenerating || !hasTalking || this.renderer.loopIntervalId !== null;
        document.getElementById('stopLoop').disabled = this.renderer.loopIntervalId === null;

        // Clip generation
        document.getElementById('generateClip').disabled = isGenerating || !hasTalking || !hasDialogue;

        // Storage controls
        document.getElementById('saveCharacter').disabled = !hasTalking;
    }

    showLoading(target, show) {
        let loadingIconId;
        let btnTextClass;
        let btn;

        if (target === 'clip') {
            loadingIconId = 'clipLoadingIcon';
            btnTextClass = 'clip-text';
            btn = document.getElementById('generateClip');
        } else if (target === 'cleanup') {
            loadingIconId = 'cleanupLoadingIcon';
            btnTextClass = 'cleanup-text';
            btn = document.getElementById('cleanupBaseFrame');
        } else {
            loadingIconId = target + 'LoadingIcon';
            btnTextClass = target + '-text';
            // Assuming button ID convention 'generate[Target]Frame'
            btn = document.getElementById('generate' + target.charAt(0).toUpperCase() + target.slice(1) + 'Frame');
        }

        const loadingIcon = document.getElementById(loadingIconId);
        const btnText = btn.querySelector('.' + btnTextClass);

        this._state.isGenerating = show;

        if (show) {
            loadingIcon.style.display = 'block';
            btnText.style.opacity = '0';
        } else {
            loadingIcon.style.display = 'none';
            btnText.style.opacity = '1';
        }

        this.updateUIState();
    }

    _resetCharacterState() {
        // Stop loops and clear players
        this.stopLoop();
        this.clearClip();

        // Reset state variables
        this._state.baseFrameData = null;
        this._state.talkingFrameData = null;
        this._state.audioUrl = null;
        this._state.audioDurationSeconds = 0;

        // Reset inputs
        this.basePromptInput.value = '';
        this.talkingPromptInput.value = '';
        this.dialogueTextInput.value = '';

        // Reset audio UI
        document.getElementById('audioPlayer').style.display = 'none';
        document.getElementById('audioPlayer').src = '';
        document.getElementById('ttsDuration').textContent = '';

        // Reset canvases
        this.renderer._initializeCanvases([this.renderer.getContexts().base, this.renderer.getContexts().talking, this.renderer.getContexts().preview]);

        // Reset status messages
        document.getElementById('baseStatus').textContent = '';
        document.getElementById('talkingStatus').textContent = '';
        document.getElementById('clipStatus').textContent = '';

        this.updateUIState();
    }
}