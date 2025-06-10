/**
 * Onboarding Module for VideoTranscriber application.
 * 
 * This module provides interactive and animated onboarding guidance
 * to help users understand how to interact with the system.
 */

// Global function to show onboarding overlay
function showOnboardingOverlay() {
    // Remove any existing overlays first
    const existingOverlays = document.querySelectorAll('.onboarding-overlay');
    existingOverlays.forEach(overlay => {
        if (overlay && overlay.parentNode) {
            overlay.parentNode.removeChild(overlay);
        }
    });
    
    // Create a new overlay
    const overlay = document.createElement('div');
    overlay.className = 'onboarding-overlay';
    overlay.style.position = 'fixed';
    overlay.style.top = '0';
    overlay.style.left = '0';
    overlay.style.width = '100%';
    overlay.style.height = '100%';
    overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
    overlay.style.zIndex = '9998';
    overlay.style.pointerEvents = 'auto';
    
    document.body.appendChild(overlay);
    return overlay;
}

document.addEventListener('DOMContentLoaded', function() {
  // Floating Help Button triggers onboarding or alert
  const helpBtn = document.getElementById('floatingHelpBtn');
  if (helpBtn) {
    helpBtn.addEventListener('click', function() {
      if (typeof window.startOnboardingTour === 'function') {
        window.startOnboardingTour();
      } else {
        alert('Onboarding or help coming soon!');
      }
    });
  }

  // Toast notification global function
  window.showToast = function(message, type = 'info', duration = 3000) {
    const toast = document.getElementById('toast');
    if (!toast) return;
    toast.textContent = message;
    toast.className = 'toast ' + type;
    toast.style.display = 'block';
    clearTimeout(toast._timeout);
    toast._timeout = setTimeout(() => {
      toast.style.display = 'none';
    }, duration);
  };
});

class OnboardingTour {
    constructor(options = {}) {
        // Default options
        this.options = Object.assign({
            steps: [],
            onComplete: () => {},
            onSkip: () => {},
            showProgress: true,
            animationDuration: 500,
            overlayOpacity: 0.7
        }, options);
        
        // Initialize properties
        this.currentStep = 0;
        this.isActive = false;
        this.overlay = null;
        this.tooltip = null;
        this._escListener = null;
        
        // State
        this.isActive = false;
        this.currentStepIndex = 0;
        this.overlay = null;
        this.tooltip = null;
        
        // Define methods before binding
        this.start = function() {
            document.body.style.overflow = '';
            if (this.options.steps.length === 0) {
                console.warn('No steps provided for onboarding tour');
                return;
            }
            if (localStorage.getItem('onboarding_seen')) {
                return;
            }
            this.isActive = true;
            this.currentStepIndex = 0;
            this.createOverlay();
            this.showStep(this.currentStepIndex);
            document.dispatchEvent(new CustomEvent('onboarding:start'));
            localStorage.setItem('onboarding_seen', 'true');
        };

        // Next, prev, and skip methods are defined as prototype methods outside the constructor
        // to avoid duplication and ensure proper functionality

        // Skip method is defined as a prototype method outside the constructor

        this.complete = function() {
            this.cleanup();
            this.options.onComplete();
            document.dispatchEvent(new CustomEvent('onboarding:complete'));
            localStorage.setItem('onboardingComplete', 'true');
            this.isActive = false;
        };

        this.cleanup = function() {
            console.log('Onboarding cleanup() called');
            document.body.style.overflow = '';
            if (this.overlay) {
                this.overlay.remove();
                this.overlay = null;
            }
            if (this.tooltip) {
                this.tooltip.remove();
                this.tooltip = null;
            }
            const highlight = document.querySelector('.onboarding-highlight');
            if (highlight) {
                highlight.classList.remove('onboarding-highlight');
                highlight.style.boxShadow = '';
            }
            if (this._escListener) {
                document.removeEventListener('keydown', this._escListener);
                this._escListener = null;
            }
        };

        this.createOverlay = function() {
            const overlay = document.createElement('div');
            overlay.className = 'onboarding-overlay';
            document.body.appendChild(overlay);
            this.overlay = overlay;
        };

        this.createTooltip = function() {
            const tooltip = document.createElement('div');
            tooltip.className = 'onboarding-tooltip';
            document.body.appendChild(tooltip);
            this.tooltip = tooltip;
            return tooltip;
        };

        this.positionTooltip = function(step) {
            // Position logic will be implemented here
        };

        this.highlightElement = function(selector) {
            // Highlight logic will be implemented here
        };

        this.showStep = function(step) {
            console.log(`Showing onboarding step ${this.currentStepIndex + 1} of ${this.options.steps.length}`);
            
            // Clear any existing tooltips and highlights
            if (this.tooltip) {
                this.tooltip.remove();
                this.tooltip = null;
            }
            
            // Remove all highlights that might exist
            const allHighlights = document.querySelectorAll('.onboarding-highlight');
            allHighlights.forEach(highlight => {
                highlight.classList.remove('onboarding-highlight');
                highlight.style.boxShadow = '';
            });
            
            // Get current step data
            const currentStep = this.options.steps[this.currentStepIndex];
            if (!currentStep) {
                console.error('Invalid step data:', this.currentStepIndex);
                this.complete();
                return;
            }
            
            // If step has a target element, highlight it
            let targetElement = null;
            if (currentStep.element) {
                targetElement = document.querySelector(currentStep.element);
                if (targetElement) {
                    this.highlightElement(targetElement);
                    console.log('Highlighted element:', currentStep.element);
                } else {
                    console.warn(`Target element ${currentStep.element} not found`);
                }
            }
            
            // Create tooltip
            this.tooltip = this.createTooltip();
            if (!this.tooltip) {
                console.error('Failed to create tooltip');
                return;
            }
            
            // Append tooltip to body
            document.body.appendChild(this.tooltip);
            
            // Position tooltip
            if (targetElement) {
                this.positionTooltip(this.tooltip, targetElement, currentStep.position || 'bottom');
            } else {
                // Center tooltip if no target element
                this.tooltip.style.top = '50%';
                this.tooltip.style.left = '50%';
                this.tooltip.style.transform = 'translate(-50%, -50%)';
            }
            
            // Ensure tooltip is visible
            this.tooltip.style.display = 'block';
            
            // Ensure buttons work properly
            this.setupTooltipButtons();
        }
        
        this.setupTooltipButtons = function() {
            // Find buttons in the current tooltip
            const nextBtn = this.tooltip.querySelector('.onboarding-next-btn');
            const backBtn = this.tooltip.querySelector('.onboarding-back-btn');
            const skipBtn = this.tooltip.querySelector('.onboarding-skip-btn');
            
            // Clear any existing event listeners
            if (nextBtn) {
                const newNextBtn = nextBtn.cloneNode(true);
                nextBtn.parentNode.replaceChild(newNextBtn, nextBtn);
                newNextBtn.addEventListener('click', () => {
                    console.log('Next button clicked');
                    this.next();
                });
            }
            
            if (backBtn) {
                const newBackBtn = backBtn.cloneNode(true);
                backBtn.parentNode.replaceChild(newBackBtn, backBtn);
                newBackBtn.addEventListener('click', () => {
                    console.log('Back button clicked');
                    this.prev();
                });
            }
            
            if (skipBtn) {
                const newSkipBtn = skipBtn.cloneNode(true);
                skipBtn.parentNode.replaceChild(newSkipBtn, skipBtn);
                newSkipBtn.addEventListener('click', () => {
                    console.log('Skip button clicked');
                    this.skip();
                });
            }
        }

        // Now bind the methods to this
        this.start = this.start.bind(this);
        this.next = this.next.bind(this);
        this.skip = this.skip.bind(this);
        this.complete = this.complete.bind(this);
        this.createOverlay = this.createOverlay.bind(this);
        this.createTooltip = this.createTooltip.bind(this);
        this.positionTooltip = this.positionTooltip.bind(this);
        this.highlightElement = this.highlightElement.bind(this);
        this.cleanup = this.cleanup.bind(this);
        this.showStep = this.showStep.bind(this);
        
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
        console.log('Next button clicked, moving to next step');
        
        // Remove any existing overlays first to prevent stacking
        const existingOverlays = document.querySelectorAll('.onboarding-overlay:not(:first-child)');
        existingOverlays.forEach(overlay => {
            if (overlay && overlay.parentNode) {
                overlay.parentNode.removeChild(overlay);
            }
        });
        
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
        console.log('Skip button clicked, ending tour');
        this.cleanup();
        this.isActive = false;
        
        // Call onSkip callback
        if (typeof this.options.onSkip === 'function') {
            this.options.onSkip();
        }
        
        // Dispatch event
        document.dispatchEvent(new CustomEvent('onboarding:skip'));
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
        console.log('Onboarding cleanup() called - removing all overlays');
        document.body.style.overflow = '';
        
        // Remove all onboarding overlays (including any that might have been orphaned)
        const allOverlays = document.querySelectorAll('.onboarding-overlay');
        allOverlays.forEach(overlay => {
            overlay.remove();
        });
        this.overlay = null;
        
        // Remove all tooltips (including any that might have been orphaned)
        const allTooltips = document.querySelectorAll('.onboarding-tooltip');
        allTooltips.forEach(tooltip => {
            tooltip.remove();
        });
        this.tooltip = null;
        
        // Remove all highlights
        const allHighlights = document.querySelectorAll('.onboarding-highlight');
        allHighlights.forEach(highlight => {
            highlight.classList.remove('onboarding-highlight');
            highlight.style.boxShadow = '';
        });
        
        // Remove Escape key listener if present
        if (this._escListener) {
            document.removeEventListener('keydown', this._escListener);
            this._escListener = null;
        }
        
        // Also remove any guaranteed welcome modals that might be showing
        const welcomeModal = document.getElementById('guaranteed-welcome-modal');
        if (welcomeModal) {
            welcomeModal.style.display = 'none';
        }
    }

} // END OF OnboardingTour CLASS

// -- Onboarding Step Definitions --
// Ensure no illegal return statements exist in this file
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
            position: "bottom"
        }
    ]
};

// Add Escape key handler to onboarding
const origStart = OnboardingTour.prototype.start;
OnboardingTour.prototype.start = function() {
    // Add escape key listener if not already added
    if (!this._escListener) {
        this._escListener = (e) => {
            if (e.key === 'Escape') {
                this.skip();
            }
        };
        document.addEventListener('keydown', this._escListener);
    }
    
    // Only call showOnboardingOverlay if it exists as a function
    if (typeof showOnboardingOverlay === 'function') {
        showOnboardingOverlay();
    }
    
    // Call original start method
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
    
        // Debug log - onboarding system initialization
    console.log('Onboarding tours initialized, ready to be triggered');
    
    // Add global function to start appropriate onboarding tour
    window.startAppropriateOnboardingTour = function() {
        console.log('Attempting to start appropriate onboarding tour');
        // Determine current page
        const path = window.location.pathname;
        
        if (path.includes('/videos') && window.onboarding.videoLibrary) {
            console.log('Starting video library onboarding');
            window.onboarding.videoLibrary.start();
            return true;
        } else if ((path.includes('/chat') || path.includes('/chat_new')) && window.onboarding.chat) {
            console.log('Starting chat onboarding');
            window.onboarding.chat.start();
            return true;
        } else if (window.onboarding.home) {
            console.log('Starting home onboarding');
            window.onboarding.home.start();
            return true;
        }
        return false;
    };
    
    // Check if we should start tours directly (for testing or when welcome modal is disabled)
    if (isFirstVisit) {
        // If we're bypassing welcome modal OR we've already seen it this session
        if (window.location.search.includes('skip_welcome=true') || sessionStorage.getItem('welcomeModalSeen')) {
            console.log('Auto-starting onboarding tour (welcome modal bypassed)');
            // Small delay to ensure DOM is fully ready
            setTimeout(() => {
                window.startAppropriateOnboardingTour();
            }, 1000);
        } else {
            console.log('Deferring onboarding to welcome modal');
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

