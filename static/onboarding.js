/**
 * Onboarding Module for VideoTranscriber application.
 * 
 * This module provides interactive and animated onboarding guidance
 * to help users understand how to interact with the system.
 */

class OnboardingTour {
    constructor(options = {}) {
        // Default options
        this.options = {
            steps: [],
            onComplete: () => {},
            onSkip: () => {},
            showProgress: true,
            animationDuration: 500,
            overlayOpacity: 0.7,
            ...options
        };
        
        // State
        this.currentStepIndex = 0;
        this.isActive = false;
        
        // DOM elements
        this.overlay = null;
        this.tooltip = null;
        this.progressBar = null;
        
        // Bind methods
        this.start = this.start.bind(this);
        this.next = this.next.bind(this);
        this.prev = this.prev.bind(this);
        this.skip = this.skip.bind(this);
        this.complete = this.complete.bind(this);
        this.createOverlay = this.createOverlay.bind(this);
        this.createTooltip = this.createTooltip.bind(this);
        this.positionTooltip = this.positionTooltip.bind(this);
        this.highlightElement = this.highlightElement.bind(this);
        this.cleanup = this.cleanup.bind(this);
        
        // Initialize
        this.init();
    }
    
    init() {
        // Create stylesheet
        this.createStyles();
    }
    
    createStyles() {
        // Check if styles already exist
        if (document.getElementById('onboarding-styles')) {
            return;
        }
        
        // Create stylesheet
        const style = document.createElement('style');
        style.id = 'onboarding-styles';
        style.textContent = `
            .onboarding-overlay {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background-color: rgba(0, 0, 0, ${this.options.overlayOpacity});
                z-index: 9998;
                pointer-events: auto;
            }
            
            .onboarding-tooltip-content {
                max-height: 300px;
                overflow-y: auto;
            }
            .onboarding-tooltip-content::-webkit-scrollbar {
                width: 8px;
            }
            .onboarding-tooltip-content::-webkit-scrollbar-thumb {
                background: #ccc;
                border-radius: 4px;
            }
            
            .onboarding-highlight {
                position: absolute;
                box-shadow: 0 0 0 9999px rgba(0, 0, 0, ${this.options.overlayOpacity});
                border-radius: 4px;
                z-index: 9999;
                pointer-events: none;
            }
            
            .onboarding-tooltip {
                position: absolute;
                background-color: white;
                color: #333;
                padding: 15px;
                border-radius: 8px;
                box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
                z-index: 10000;
                max-width: 300px;
                animation: tooltip-fade-in ${this.options.animationDuration}ms ease;
            }
            
            .onboarding-tooltip.dark-mode {
                background-color: #222;
                color: #eee;
            }
            
            .onboarding-tooltip-arrow {
                position: absolute;
                width: 12px;
                height: 12px;
                background-color: inherit;
                transform: rotate(45deg);
            }
            
            .onboarding-tooltip-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 10px;
            }
            
            .onboarding-tooltip-title {
                font-weight: bold;
                font-size: 16px;
                margin: 0;
            }
            
            .onboarding-tooltip-close {
                background: none;
                border: none;
                cursor: pointer;
                font-size: 18px;
                color: #999;
                padding: 0;
                display: flex;
                align-items: center;
                justify-content: center;
                width: 24px;
                height: 24px;
                border-radius: 50%;
                transition: background-color 0.2s;
            }
            
            .onboarding-tooltip-close:hover {
                background-color: rgba(0, 0, 0, 0.1);
            }
            
            .dark-mode .onboarding-tooltip-close:hover {
                background-color: rgba(255, 255, 255, 0.1);
            }
            
            .onboarding-tooltip-content {
                margin-bottom: 15px;
                line-height: 1.5;
            }
            
            .onboarding-tooltip-footer {
                display: flex;
                justify-content: space-between;
                align-items: center;
            }
            
            .onboarding-tooltip-progress {
                display: flex;
                align-items: center;
            }
            
            .onboarding-tooltip-progress-text {
                font-size: 12px;
                color: #666;
                margin-right: 10px;
            }
            
            .dark-mode .onboarding-tooltip-progress-text {
                color: #aaa;
            }
            
            .onboarding-tooltip-progress-bar {
                height: 4px;
                width: 50px;
                background-color: #eee;
                border-radius: 2px;
                overflow: hidden;
            }
            
            .dark-mode .onboarding-tooltip-progress-bar {
                background-color: #444;
            }
            
            .onboarding-tooltip-progress-bar-inner {
                height: 100%;
                background-color: var(--primary-color, #4a6cf7);
                transition: width ${this.options.animationDuration}ms ease;
            }
            
            .onboarding-tooltip-buttons {
                display: flex;
                gap: 10px;
            }
            
            .onboarding-tooltip-button {
                padding: 8px 12px;
                border: none;
                border-radius: 4px;
                cursor: pointer;
                font-size: 14px;
                transition: background-color 0.2s;
            }
            
            .onboarding-tooltip-button.primary {
                background-color: var(--primary-color, #4a6cf7);
                color: white;
            }
            
            .onboarding-tooltip-button.primary:hover {
                background-color: var(--primary-hover, #3a5ce7);
            }
            
            .onboarding-tooltip-button.secondary {
                background-color: transparent;
                color: #666;
            }
            
            .dark-mode .onboarding-tooltip-button.secondary {
                color: #aaa;
            }
            
            .onboarding-tooltip-button.secondary:hover {
                background-color: rgba(0, 0, 0, 0.1);
            }
            
            .dark-mode .onboarding-tooltip-button.secondary:hover {
                background-color: rgba(255, 255, 255, 0.1);
            }
            
            @keyframes tooltip-fade-in {
                from { opacity: 0; transform: translateY(-10px); }
                to { opacity: 1; transform: translateY(0); }
            }
            
            @keyframes highlight-pulse {
                0% { box-shadow: 0 0 0 0 rgba(74, 108, 247, 0.7); }
                70% { box-shadow: 0 0 0 10px rgba(74, 108, 247, 0); }
                100% { box-shadow: 0 0 0 0 rgba(74, 108, 247, 0); }
            }
        `;
        
        document.head.appendChild(style);
    }
    
    start() {
        // Always re-enable body scroll when onboarding starts
        document.body.style.overflow = '';

        if (this.options.steps.length === 0) {
            console.warn('No steps provided for onboarding tour');
            return;
        }
        
        // Check if the user has already seen the tour
        if (localStorage.getItem('onboarding_seen')) {
            return;
        }

        this.isActive = true;
        this.currentStepIndex = 0;
        this.createOverlay();
        this.showStep(this.currentStepIndex);
        
        // Dispatch event
        document.dispatchEvent(new CustomEvent('onboarding:start'));

        // Mark onboarding as seen
        localStorage.setItem('onboarding_seen', 'true');
    }
    
    next() {
        if (this.currentStepIndex < this.options.steps.length - 1) {
            this.currentStepIndex++;
            this.showStep(this.currentStepIndex);
            
            // Dispatch event
            document.dispatchEvent(new CustomEvent('onboarding:next', {
                detail: { stepIndex: this.currentStepIndex }
            }));
        } else {
            this.complete();
        }
    }
    
    prev() {
        if (this.currentStepIndex > 0) {
            this.currentStepIndex--;
            this.showStep(this.currentStepIndex);
            
            // Dispatch event
            document.dispatchEvent(new CustomEvent('onboarding:prev', {
                detail: { stepIndex: this.currentStepIndex }
            }));
        }
    }
    
    skip() {
        this.cleanup();
        this.isActive = false;
        
        // Call onSkip callback
        if (typeof this.options.onSkip === 'function') {
            this.options.onSkip();
        }
        
}

complete() {
    console.log('Onboarding complete() called');
    this.cleanup();
    this.isActive = false;
    // Call onComplete callback
    if (typeof this.options.onComplete === 'function') {
        this.options.onComplete();
    }
    // Dispatch event
    document.dispatchEvent(new CustomEvent('onboarding:complete'));
}

cleanup() {
    console.log('Onboarding cleanup() called');
    // Always re-enable body scroll after onboarding ends
    document.body.style.overflow = '';
    // Remove overlay
    if (this.overlay) {
        this.overlay.remove();
        this.overlay = null;
    }
    // Remove tooltip
    if (this.tooltip) {
        this.tooltip.remove();
        this.tooltip = null;
    }
    // Remove highlight
    const highlight = document.querySelector('.onboarding-highlight');
    if (highlight) {
        highlight.remove();
    }
    // Remove Escape key listener if present
    if (this._escListener) {
        document.removeEventListener('keydown', this._escListener);
        this._escListener = null;
    }
}

} // END OF OnboardingTour CLASS

// -- Onboarding Step Definitions --
const onboardingTours = {
    home: [
        {
            title: "Welcome to VideoTranscriber!",
            content: "This tool helps you transcribe videos, analyze content, and interact with your transcripts. Let's take a quick tour to get you started.",
            position: "center"
        },
        {
            element: ".upload-container",
            title: "Upload Your Video",
            content: "Start by uploading a video file. We support most common video formats including MP4, AVI, MOV, and more.",
            position: "bottom",
            pulse: true
        },
        {
            element: ".language-selector",
            title: "Language Support",
            content: "We automatically detect the language in your video, but you can also manually select your preferred language.",
            position: "bottom"
        },
        {
            element: ".main-nav",
            title: "Navigation",
            content: "Use the navigation menu to access different features like the Video Library and Chat interface.",
            position: "bottom"
        },
        {
            title: "Let's Get Started!",
            content: "You're all set to start transcribing your videos. Upload a file to begin or explore the Video Library to see examples.",
            position: "center"
        }
    ],
    videoLibrary: [
        {
            title: "Video Library",
            content: "This is your Video Library where all your transcribed videos are stored and organized.",
            position: "center"
        },
        {
            element: ".search-container",
            title: "Search Videos",
            content: "Quickly find specific videos by searching for keywords in titles or content.",
            position: "bottom"
        },
        {
            element: ".filter-container",
            title: "Filter by Language",
            content: "Filter videos by language to easily find content in your preferred language.",
            position: "bottom"
        },
        {
            element: "#analyze-all-btn",
            title: "Analyze All Videos",
            content: "Click here to analyze all videos in your library and extract key points, action items, and topics.",
            position: "left",
            pulse: true
        },
        {
            element: ".video-card:first-child",
            title: "Video Details",
            content: "Click on any video card to view its transcript, analysis, and interact with the content through Q&A.",
            position: "right"
        }
    ],
    chat: [
        {
            title: "Chat Interface",
            content: "This is the Chat interface where you can ask questions about your transcript and get intelligent answers.",
            position: "center"
        },
        {
            element: ".transcript-container",
            title: "Transcript View",
            content: "Here you can see the full transcript of your video. Scroll through to read the content.",
            position: "right"
        },
        {
            element: ".action-points-container",
            title: "Action Points",
            content: "We automatically extract action points from your transcript to highlight important tasks or decisions.",
            position: "left"
        },
        {
            element: ".chat-container",
            title: "Ask Questions",
            content: "Type your questions here to get answers based on the transcript content.",
            position: "top"
        },
        {
            element: ".suggestions-container",
            title: "Smart Suggestions",
            content: "We provide context-aware suggestions to help you ask relevant questions about your content.",
            position: "bottom",
            pulse: true
        }
    ]
};

// Add Escape key handler to onboarding
const origStart = OnboardingTour.prototype.start;
OnboardingTour.prototype.start = function() {
    if (!this._escListener) {
        this._escListener = (e) => {
            if (e.key === 'Escape') {
                this.skip();
            }
        };
        document.addEventListener('keydown', this._escListener);
    }
    origStart.apply(this, arguments);
};

// Initialize onboarding
document.addEventListener('DOMContentLoaded', function() {
    // Check if this is the user's first visit
    const isFirstVisit = !localStorage.getItem('onboardingComplete');
    
    // Create onboarding instance
    window.onboarding = {};
    
    // Initialize tours
    Object.keys(onboardingTours).forEach(tourName => {
        window.onboarding[tourName] = new OnboardingTour({
            steps: onboardingTours[tourName],
            onComplete: () => {
                localStorage.setItem('onboardingComplete', 'true');
                localStorage.setItem(`onboarding_${tourName}_complete`, 'true');
            }
        });
    });
    
    // Start appropriate tour based on current page
    if (isFirstVisit) {
        // Determine current page
        const path = window.location.pathname;
        
        if (path.includes('/videos')) {
            window.onboarding.videoLibrary.start();
        } else if (path.includes('/chat')) {
            window.onboarding.chat.start();
        } else {
            // Default to home tour
            window.onboarding.home.start();
        }
    }
    
    // Add tour trigger buttons
    const addTourButtons = () => {
        // Check if buttons already exist
        if (document.querySelector('.tour-button')) return;
        
        // Create help button in header
        const header = document.querySelector('.app-header');
        if (header) {
            const helpButton = document.createElement('button');
            helpButton.className = 'help-button';
            helpButton.innerHTML = '<i class="fas fa-question-circle"></i>';
            helpButton.setAttribute('aria-label', 'Help');
            helpButton.setAttribute('title', 'Help & Tours');
            
            helpButton.addEventListener('click', function() {
                // Determine current page
                const path = window.location.pathname;
                
                if (path.includes('/videos')) {
                    window.onboarding.videoLibrary.start();
                } else if (path.includes('/chat')) {
                    window.onboarding.chat.start();
                } else {
                    // Default to home tour
                    window.onboarding.home.start();
                }
            });
            
            header.appendChild(helpButton);
        }
    };
    
    // Add tour buttons after a short delay
    setTimeout(addTourButtons, 1000);
});

// Add help button styles
document.addEventListener('DOMContentLoaded', function() {
    const style = document.createElement('style');
    style.textContent = `
        .help-button {
            background: none;
            border: none;
            color: var(--primary-color, #4a6cf7);
            font-size: 1.5rem;
            cursor: pointer;
            padding: 5px;
            margin-left: 10px;
            transition: transform 0.2s, color 0.2s;
        }
        
        .help-button:hover {
            transform: scale(1.1);
            color: var(--primary-hover, #3a5ce7);
        }
        
        @media (prefers-color-scheme: dark) {
            .help-button {
                color: var(--primary-light, #6a8cf7);
            }
        }
    `;
    
    document.head.appendChild(style);
});

