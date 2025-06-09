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
                pointer-events: none;
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
        
        // Dispatch event
        document.dispatchEvent(new CustomEvent('onboarding:skip'));
    }
    
    complete() {
        this.cleanup();
        this.isActive = false;
        
        // Call onComplete callback
        if (typeof this.options.onComplete === 'function') {
            this.options.onComplete();
        }
        
        // Dispatch event
        document.dispatchEvent(new CustomEvent('onboarding:complete'));
    }
    
    showStep(index) {
        const step = this.options.steps[index];
        if (!step) return;
        
        // Clean up previous step
        if (this.tooltip) {
            this.tooltip.remove();
            this.tooltip = null;
        }
        
        // Get target element
        let targetElement = null;
        if (step.element) {
            if (typeof step.element === 'string') {
                targetElement = document.querySelector(step.element);
            } else {
                targetElement = step.element;
            }
        }
        
        // Highlight element if it exists
        if (targetElement) {
            this.highlightElement(targetElement);
            
            // Scroll element into view if needed
            const rect = targetElement.getBoundingClientRect();
            const isInViewport = (
                rect.top >= 0 &&
                rect.left >= 0 &&
                rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
                rect.right <= (window.innerWidth || document.documentElement.clientWidth)
            );
            
            if (!isInViewport) {
                targetElement.scrollIntoView({
                    behavior: 'smooth',
                    block: 'center'
                });
                
                // Wait for scroll to complete before positioning tooltip
                setTimeout(() => {
                    this.createTooltip(step, targetElement);
                }, 500);
            } else {
                this.createTooltip(step, targetElement);
            }
        } else {
            // No target element, center tooltip
            this.createTooltip(step);
        }
    }
    
    createOverlay() {
        // Remove existing overlay if any
        if (this.overlay) {
            this.overlay.remove();
        }
        
        // Create overlay
        this.overlay = document.createElement('div');
        this.overlay.className = 'onboarding-overlay';
        document.body.appendChild(this.overlay);
    }
    
    highlightElement(element) {
        // Remove existing highlight if any
        const existingHighlight = document.querySelector('.onboarding-highlight');
        if (existingHighlight) {
            existingHighlight.remove();
        }
        
        // Get element position and dimensions
        const rect = element.getBoundingClientRect();
        
        // Create highlight element
        const highlight = document.createElement('div');
        highlight.className = 'onboarding-highlight';
        highlight.style.top = `${rect.top}px`;
        highlight.style.left = `${rect.left}px`;
        highlight.style.width = `${rect.width}px`;
        highlight.style.height = `${rect.height}px`;
        
        // Add pulse animation if specified in step
        const currentStep = this.options.steps[this.currentStepIndex];
        if (currentStep && currentStep.pulse) {
            highlight.style.animation = 'highlight-pulse 1.5s infinite';
        }
        
        document.body.appendChild(highlight);
    }
    
    createTooltip(step, targetElement = null) {
        // Create tooltip
        this.tooltip = document.createElement('div');
        this.tooltip.className = 'onboarding-tooltip';
        
        // Check for dark mode
        const prefersDarkMode = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
        if (prefersDarkMode) {
            this.tooltip.classList.add('dark-mode');
        }
        
        // Create tooltip content
        this.tooltip.innerHTML = `
            <div class="onboarding-tooltip-header">
                <h3 class="onboarding-tooltip-title">${step.title || 'Tip'}</h3>
                <button class="onboarding-tooltip-close" aria-label="Close">&times;</button>
            </div>
            <div class="onboarding-tooltip-content">
                ${step.content || ''}
            </div>
            <div class="onboarding-tooltip-footer">
                ${this.options.showProgress ? `
                    <div class="onboarding-tooltip-progress">
                        <span class="onboarding-tooltip-progress-text">
                            ${this.currentStepIndex + 1}/${this.options.steps.length}
                        </span>
                        <div class="onboarding-tooltip-progress-bar">
                            <div class="onboarding-tooltip-progress-bar-inner" style="width: ${(this.currentStepIndex + 1) / this.options.steps.length * 100}%"></div>
                        </div>
                    </div>
                ` : ''}
                <div class="onboarding-tooltip-buttons">
                    ${this.currentStepIndex > 0 ? `
                        <button class="onboarding-tooltip-button secondary prev-button">Back</button>
                    ` : ''}
                    <button class="onboarding-tooltip-button secondary skip-button">Skip</button>
                    <button class="onboarding-tooltip-button primary next-button">
                        ${this.currentStepIndex < this.options.steps.length - 1 ? 'Next' : 'Finish'}
                    </button>
                </div>
            </div>
        `;
        
        // Add tooltip to DOM
        document.body.appendChild(this.tooltip);
        
        // Position tooltip
        this.positionTooltip(step, targetElement);
        
        // Add event listeners
        this.tooltip.querySelector('.onboarding-tooltip-close').addEventListener('click', this.skip);
        this.tooltip.querySelector('.skip-button').addEventListener('click', this.skip);
        this.tooltip.querySelector('.next-button').addEventListener('click', this.next);
        
        const prevButton = this.tooltip.querySelector('.prev-button');
        if (prevButton) {
            prevButton.addEventListener('click', this.prev);
        }
    }
    
    positionTooltip(step, targetElement = null) {
        if (!this.tooltip) return;
        
        // Default position (center of screen)
        let top = window.innerHeight / 2 - this.tooltip.offsetHeight / 2;
        let left = window.innerWidth / 2 - this.tooltip.offsetWidth / 2;
        let arrowPosition = null;
        
        // Position relative to target element if provided
        if (targetElement) {
            const targetRect = targetElement.getBoundingClientRect();
            const tooltipRect = this.tooltip.getBoundingClientRect();
            
            // Determine position based on step.position or auto-position
            const position = step.position || this.determinePosition(targetRect, tooltipRect);
            
            switch (position) {
                case 'top':
                    top = targetRect.top - tooltipRect.height - 20;
                    left = targetRect.left + (targetRect.width / 2) - (tooltipRect.width / 2);
                    arrowPosition = { bottom: '-6px', left: '50%', transform: 'translateX(-50%) rotate(45deg)' };
                    break;
                case 'bottom':
                    top = targetRect.bottom + 20;
                    left = targetRect.left + (targetRect.width / 2) - (tooltipRect.width / 2);
                    arrowPosition = { top: '-6px', left: '50%', transform: 'translateX(-50%) rotate(45deg)' };
                    break;
                case 'left':
                    top = targetRect.top + (targetRect.height / 2) - (tooltipRect.height / 2);
                    left = targetRect.left - tooltipRect.width - 20;
                    arrowPosition = { right: '-6px', top: '50%', transform: 'translateY(-50%) rotate(45deg)' };
                    break;
                case 'right':
                    top = targetRect.top + (targetRect.height / 2) - (tooltipRect.height / 2);
                    left = targetRect.right + 20;
                    arrowPosition = { left: '-6px', top: '50%', transform: 'translateY(-50%) rotate(45deg)' };
                    break;
            }
            
            // Ensure tooltip stays within viewport
            if (left < 20) left = 20;
            if (left + tooltipRect.width > window.innerWidth - 20) left = window.innerWidth - tooltipRect.width - 20;
            if (top < 20) top = 20;
            if (top + tooltipRect.height > window.innerHeight - 20) top = window.innerHeight - tooltipRect.height - 20;
        }
        
        // Set tooltip position
        this.tooltip.style.top = `${top}px`;
        this.tooltip.style.left = `${left}px`;
        
        // Add arrow if needed
        if (arrowPosition) {
            const arrow = document.createElement('div');
            arrow.className = 'onboarding-tooltip-arrow';
            
            // Set arrow position
            Object.keys(arrowPosition).forEach(key => {
                arrow.style[key] = arrowPosition[key];
            });
            
            this.tooltip.appendChild(arrow);
        }
    }
    
    determinePosition(targetRect, tooltipRect) {
        // Available space in each direction
        const spaceTop = targetRect.top;
        const spaceBottom = window.innerHeight - targetRect.bottom;
        const spaceLeft = targetRect.left;
        const spaceRight = window.innerWidth - targetRect.right;
        
        // Find the direction with the most space
        const spaces = [
            { position: 'bottom', space: spaceBottom },
            { position: 'top', space: spaceTop },
            { position: 'right', space: spaceRight },
            { position: 'left', space: spaceLeft }
        ];
        
        // Sort by available space
        spaces.sort((a, b) => b.space - a.space);
        
        // Return the position with the most space
        return spaces[0].position;
    }
    
    cleanup() {
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
    }
}

// Define onboarding tours
const onboardingTours = {
    // Home page tour
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
    
    // Video library tour
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
    
    // Chat interface tour
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

