export class CanvasRenderer {
    constructor(baseCanvas, talkingCanvas, previewCanvas, baseFrameData, talkingFrameData, updateUIStateCallback) {
        this.baseCanvas = baseCanvas;
        this.talkingCanvas = talkingCanvas;
        this.previewCanvas = previewCanvas;
        this.baseCtx = baseCanvas.getContext('2d');
        this.talkingCtx = talkingCanvas.getContext('2d');
        this.previewCtx = previewCanvas.getContext('2d');
        
        // References to state in AppController
        this.baseFrameData = baseFrameData; 
        this.talkingFrameData = talkingFrameData; 
        this.updateUIState = updateUIStateCallback;
        
        this.loopIntervalId = null;

        this._initializeCanvases([this.baseCtx, this.talkingCtx, this.previewCtx]);
    }

    _initializeCanvases(contexts) {
        contexts.forEach(ctx => {
            // Set up canvas with pixelated rendering
            ctx.imageSmoothingEnabled = false;
            ctx.webkitImageSmoothingEnabled = false;
            ctx.mozImageSmoothingEnabled = false;
            ctx.msImageSmoothingEnabled = false;

            // Fill with default background
            ctx.fillStyle = '#1a1a2e';
            ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        });
    }

    async loadImageToCanvas(imageUrl, canvasContext) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            img.onload = () => {
                canvasContext.clearRect(0, 0, canvasContext.canvas.width, canvasContext.canvas.height);
                // Draw image, forcing it to the canvas dimensions (320x240)
                canvasContext.drawImage(img, 0, 0, canvasContext.canvas.width, canvasContext.canvas.height);
                resolve();
            };
            img.onerror = reject;
            img.src = imageUrl;
        });
    }

    startPreviewLoop() {
        if (!this.baseFrameData.get() || !this.talkingFrameData.get() || this.loopIntervalId !== null) return;

        const baseImg = new Image();
        baseImg.src = this.baseFrameData.get();

        const talkingImg = new Image();
        talkingImg.src = this.talkingFrameData.get();

        let frameToggle = true; // true for base, false for talking

        const drawFrame = () => {
            this.previewCtx.clearRect(0, 0, this.previewCanvas.width, this.previewCanvas.height);
            
            if (baseImg.complete && talkingImg.complete) {
                const img = frameToggle ? baseImg : talkingImg;
                this.previewCtx.drawImage(img, 0, 0, this.previewCanvas.width, this.previewCanvas.height);
                frameToggle = !frameToggle;
            } else {
                // Draw default background if images aren't ready 
                this._initializeCanvases([this.previewCtx]); 
            }
        };

        // 125ms interval = 8 frames per second (classic 8-bit speed)
        this.loopIntervalId = setInterval(drawFrame, 125);
        this.updateUIState();
    }

    stopPreviewLoop() {
        if (this.loopIntervalId) {
            clearInterval(this.loopIntervalId);
            this.loopIntervalId = null;

            // Draw the base frame when stopped
            this.drawBaseToPreview();
            this.updateUIState();
        }
    }
    
    // Helper to get contexts
    getContexts() {
        return {
            base: this.baseCtx,
            talking: this.talkingCtx,
            preview: this.previewCtx
        };
    }
    
    // Helper to draw base frame to preview immediately after loading/stopping
    drawBaseToPreview() {
        if (this.baseFrameData.get()) {
             this.loadImageToCanvas(this.baseFrameData.get(), this.previewCtx);
        }
    }
}