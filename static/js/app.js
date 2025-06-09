/**
 * AI Video Transcriber - Core JavaScript
 * Handles UI interactions, theme switching, and other frontend functionality
 */

document.addEventListener('DOMContentLoaded', function() {
    // Initialize components
    initTheme();
    initMobileMenu();
    initDropdowns();
    initBackToTop();
    initTooltips();
    initFileUpload();
    initModals();
    
    // Add any global event listeners
    setupGlobalEventListeners();
});

/**
 * Theme Management
 */
function initTheme() {
    const themeToggle = document.getElementById('themeToggle');
    const html = document.documentElement;
    const theme = localStorage.getItem('theme');
    
    // Apply saved theme or use system preference
    if (theme === 'dark' || (!theme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
        html.classList.add('dark');
        localStorage.setItem('theme', 'dark');
    } else {
        html.classList.remove('dark');
        localStorage.setItem('theme', 'light');
    }
    
    // Toggle theme when button is clicked
    if (themeToggle) {
        themeToggle.addEventListener('click', () => {
            html.classList.toggle('dark');
            const isDark = html.classList.contains('dark');
            localStorage.setItem('theme', isDark ? 'dark' : 'light');
            
            // Dispatch event for other components to react to theme changes
            document.dispatchEvent(new CustomEvent('themeChange', { 
                detail: { theme: isDark ? 'dark' : 'light' } 
            }));
        });
    }
    
    // Watch for system theme changes
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
        if (!localStorage.getItem('theme')) {
            if (e.matches) {
                html.classList.add('dark');
            } else {
                html.classList.remove('dark');
            }
        }
    });
}

/**
 * Mobile Menu Toggle
 */
function initMobileMenu() {
    const mobileMenuButton = document.getElementById('mobile-menu-button');
    const mobileMenu = document.getElementById('mobile-menu');
    
    if (mobileMenuButton && mobileMenu) {
        const menuIcon = mobileMenuButton.querySelector('i');
        
        mobileMenuButton.addEventListener('click', function() {
            const isExpanded = mobileMenuButton.getAttribute('aria-expanded') === 'true';
            mobileMenuButton.setAttribute('aria-expanded', !isExpanded);
            mobileMenu.classList.toggle('hidden');
            
            // Toggle between hamburger and X icon
            if (isExpanded) {
                menuIcon.classList.remove('fa-times');
                menuIcon.classList.add('fa-bars');
            } else {
                menuIcon.classList.remove('fa-bars');
                menuIcon.classList.add('fa-times');
            }
        });
    }
}

/**
 * Dropdown Menus
 */
function initDropdowns() {
    const dropdowns = document.querySelectorAll('[data-dropdown]');
    
    dropdowns.forEach(dropdown => {
        const button = dropdown.querySelector('[data-dropdown-toggle]');
        const menu = dropdown.querySelector('[data-dropdown-menu]');
        
        if (button && menu) {
            button.addEventListener('click', (e) => {
                e.stopPropagation();
                const isExpanded = button.getAttribute('aria-expanded') === 'true';
                button.setAttribute('aria-expanded', !isExpanded);
                menu.classList.toggle('hidden');
            });
            
            // Close when clicking outside
            document.addEventListener('click', (e) => {
                if (!dropdown.contains(e.target)) {
                    button.setAttribute('aria-expanded', 'false');
                    menu.classList.add('hidden');
                }
            });
            
            // Close when pressing Escape
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape') {
                    button.setAttribute('aria-expanded', 'false');
                    menu.classList.add('hidden');
                }
            });
        }
    });
}

/**
 * Back to Top Button
 */
function initBackToTop() {
    const backToTopButton = document.getElementById('back-to-top');
    
    if (backToTopButton) {
        // Show/hide button based on scroll position
        const toggleBackToTop = () => {
            if (window.pageYOffset > 300) {
                backToTopButton.classList.remove('opacity-0', 'invisible');
                backToTopButton.classList.add('opacity-100', 'visible');
            } else {
                backToTopButton.classList.remove('opacity-100', 'visible');
                backToTopButton.classList.add('opacity-0', 'invisible');
            }
        };
        
        window.addEventListener('scroll', toggleBackToTop);
        toggleBackToTop(); // Initial check
        
        // Smooth scroll to top
        backToTopButton.addEventListener('click', (e) => {
            e.preventDefault();
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        });
    }
}

/**
 * Tooltips
 */
function initTooltips() {
    const tooltipTriggers = document.querySelectorAll('[data-tooltip]');
    
    tooltipTriggers.forEach(trigger => {
        // Create tooltip element
        const tooltip = document.createElement('div');
        tooltip.className = 'tooltip';
        tooltip.textContent = trigger.getAttribute('data-tooltip');
        
        // Position tooltip
        const position = trigger.getAttribute('data-tooltip-pos') || 'top';
        tooltip.classList.add(`tooltip-${position}`);
        
        // Add to DOM
        trigger.style.position = 'relative';
        trigger.appendChild(tooltip);
        
        // Show/hide on hover/focus
        trigger.addEventListener('mouseenter', showTooltip);
        trigger.addEventListener('focus', showTooltip);
        trigger.addEventListener('mouseleave', hideTooltip);
        trigger.addEventListener('blur', hideTooltip);
        
        function showTooltip() {
            tooltip.classList.add('tooltip-visible');
        }
        
        function hideTooltip() {
            tooltip.classList.remove('tooltip-visible');
        }
    });
}

/**
 * File Upload Handling
 */
function initFileUpload() {
    const dropZone = document.getElementById('dropZone');
    const fileInput = document.getElementById('fileInput');
    const browseBtn = document.getElementById('browseBtn');
    const fileNameDisplay = document.getElementById('fileName');
    const filePreview = document.getElementById('filePreview');
    const previewFileName = document.getElementById('previewFileName');
    const previewFileSize = document.getElementById('previewFileSize');
    const removeFileBtn = document.getElementById('removeFileBtn');
    const submitBtn = document.getElementById('submitBtn');
    const uploadProgress = document.getElementById('uploadProgress');
    const progressBar = document.getElementById('progressBar');
    const progressPercent = document.getElementById('progressPercent');
    const loadingIcon = document.getElementById('loadingIcon');
    const advancedOptionsBtn = document.getElementById('advancedOptionsBtn');
    const advancedOptions = document.getElementById('advancedOptions');
    const advancedOptionsIcon = document.getElementById('advancedOptionsIcon');
    const tabButtons = document.querySelectorAll('.tab-button');

    // Toggle advanced options
    if (advancedOptionsBtn && advancedOptions) {
        advancedOptionsBtn.addEventListener('click', () => {
            const isExpanded = advancedOptionsBtn.getAttribute('aria-expanded') === 'true';
            advancedOptionsBtn.setAttribute('aria-expanded', !isExpanded);
            advancedOptions.classList.toggle('hidden');
            advancedOptionsIcon.classList.toggle('rotate-180');
        });
    }

    // Tab switching
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Get the target tab ID from the button text or data attribute
            const buttonText = button.textContent.trim();
            let targetTabId;
            
            if (buttonText.includes('Upload File')) {
                targetTabId = 'tab-upload-file';
            } else if (buttonText.includes('From URL')) {
                targetTabId = 'tab-from-url';
            } else if (buttonText.includes('Google Drive')) {
                targetTabId = 'tab-google-drive';
            }
            
            if (!targetTabId) return;
            
            // Remove active class from all buttons
            tabButtons.forEach(btn => {
                btn.classList.remove('border-primary-500', 'text-primary-600', 'dark:text-primary-400');
                btn.classList.add('border-transparent', 'text-gray-500', 'hover:text-gray-700', 'hover:border-gray-300');
            });
            
            // Add active class to clicked button
            button.classList.add('border-primary-500', 'text-primary-600', 'dark:text-primary-400');
            button.classList.remove('border-transparent', 'text-gray-500', 'hover:text-gray-700', 'hover:border-gray-300');
            
            // Hide all tab content
            const tabContents = document.querySelectorAll('.tab-content');
            tabContents.forEach(tab => tab.classList.add('hidden'));
            
            // Show the target tab content
            const targetTab = document.getElementById(targetTabId);
            if (targetTab) {
                targetTab.classList.remove('hidden');
                
                // Reset form validation state when switching tabs
                if (targetTabId === 'tab-upload-file') {
                    updateSubmitButtonState();
                }
            }
            
            console.log(`Switched to tab: ${buttonText} (${targetTabId})`);
        });
    });

    // Handle drag and drop
    if (dropZone) {
        // Prevent default drag behaviors
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            dropZone.addEventListener(eventName, preventDefaults, false);
            document.body.addEventListener(eventName, preventDefaults, false);
        });

        // Highlight drop zone when item is dragged over it
        ['dragenter', 'dragover'].forEach(eventName => {
            dropZone.addEventListener(eventName, highlight, false);
        });

        ['dragleave', 'drop'].forEach(eventName => {
            dropZone.addEventListener(eventName, unhighlight, false);
        });

        // Handle dropped files
        dropZone.addEventListener('drop', handleDrop, false);
    }

    // Handle file selection via button
    if (browseBtn && fileInput) {
        browseBtn.addEventListener('click', () => fileInput.click());
    }

    // Handle file selection
    if (fileInput) {
        fileInput.addEventListener('change', handleFileSelect);
    }

    // Handle file removal
    if (removeFileBtn) {
        removeFileBtn.addEventListener('click', resetFileInput);
    }

    // Prevent form submission if no file is selected
    const form = document.getElementById('uploadForm');
    if (form) {
        form.addEventListener('submit', handleFormSubmit);
    }

    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    function highlight() {
        dropZone.classList.add('border-primary-400', 'dark:border-primary-500', 'bg-gray-100', 'dark:bg-gray-700/30');
    }

    function unhighlight() {
        dropZone.classList.remove('border-primary-400', 'dark:border-primary-500', 'bg-gray-100', 'dark:bg-gray-700/30');
    }

    function handleDrop(e) {
        const dt = e.dataTransfer;
        const files = dt.files;
        handleFiles(files);
    }

    function handleFileSelect(e) {
        handleFiles(this.files);
    }

    function handleFiles(files) {
        if (files.length > 0) {
            const file = files[0];
            
            // Update UI to show selected file
            const fileName = file.name;
            const fileSize = formatFileSize(file.size);
            
            fileNameDisplay.innerHTML = `<i class="far fa-file-alt mr-1.5"></i><span>${fileName}</span>`;
            previewFileName.textContent = fileName;
            previewFileSize.textContent = fileSize;
            
            // Show file preview and enable submit button
            filePreview.classList.remove('hidden');
            submitBtn.disabled = false;
            
            // Show success message
            showToast('File selected successfully', 'success');
        }
    }

    function resetFileInput() {
        if (fileInput) {
            fileInput.value = '';
            fileNameDisplay.innerHTML = '<i class="far fa-file-alt mr-1.5"></i><span>No file selected</span>';
            filePreview.classList.add('hidden');
            submitBtn.disabled = true;
        }
    }

    function formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    async function handleFormSubmit(e) {
        const file = fileInput.files[0];
        
        if (!file) {
            e.preventDefault();
            showToast('Please select a file first', 'error');
            return false;
        }
        
        // Check file size (100MB limit)
        const maxSize = 100 * 1024 * 1024; // 100MB in bytes
        if (file.size > maxSize) {
            e.preventDefault();
            showToast('File size exceeds the 100MB limit', 'error');
            return false;
        }
        
        // Show loading state
        submitBtn.disabled = true;
        loadingIcon.classList.remove('opacity-0');
        uploadProgress.classList.remove('hidden');
        
        // Simulate upload progress (in a real app, you'd use XMLHttpRequest with progress event)
        let progress = 0;
        const interval = setInterval(() => {
            progress += 5;
            if (progress > 90) {
                clearInterval(interval);
                // The form will submit normally after this
            } else {
                updateProgress(progress);
            }
        }, 100);
    }
    
    function updateProgress(percent) {
        progressBar.style.width = `${percent}%`;
        progressPercent.textContent = `${percent}%`;
    }
    
    // For demo purposes - in a real app, you'd handle the actual file upload
    // and update progress based on the upload progress event
    function uploadFile(file) {
        return new Promise((resolve) => {
            // Simulate file upload
            setTimeout(() => {
                resolve({ success: true });
            }, 2000);
        });
    }
    
    // Initialize any additional file inputs on the page
    const fileInputs = document.querySelectorAll('input[type="file"]:not(#fileInput)');
    fileInputs.forEach(input => {
        // Style the file input
        const wrapper = document.createElement('div');
        wrapper.className = 'file-upload-wrapper';
        input.parentNode.insertBefore(wrapper, input);
        wrapper.appendChild(input);
        
        // Create custom UI
        const customInput = document.createElement('div');
        customInput.className = 'file-upload-custom';
        
        const icon = document.createElement('i');
        icon.className = 'fas fa-cloud-upload-alt';
        
        const text = document.createElement('span');
        text.textContent = input.getAttribute('data-text') || 'Choose a file or drag & drop here';
        
        const fileName = document.createElement('span');
        fileName.className = 'file-name';
        
        customInput.appendChild(icon);
        customInput.appendChild(text);
        customInput.appendChild(fileName);
        wrapper.appendChild(customInput);
        
        // Update UI when file is selected
        input.addEventListener('change', function() {
            if (this.files && this.files.length > 0) {
                fileName.textContent = this.files[0].name;
                customInput.classList.add('has-file');
                
                // Show file size
                const fileSize = (this.files[0].size / (1024 * 1024)).toFixed(2);
                const sizeSpan = document.createElement('span');
                sizeSpan.className = 'file-size';
                sizeSpan.textContent = ` (${fileSize} MB)`;
                fileName.appendChild(sizeSpan);
            } else {
                fileName.textContent = '';
                customInput.classList.remove('has-file');
            }
        });
        
        // Handle drag and drop
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            wrapper.addEventListener(eventName, preventDefaults, false);
        });
        
        function preventDefaults(e) {
            e.preventDefault();
            e.stopPropagation();
        }
        
        ['dragenter', 'dragover'].forEach(eventName => {
            wrapper.addEventListener(eventName, highlight, false);
        });
        
        ['dragleave', 'drop'].forEach(eventName => {
            wrapper.addEventListener(eventName, unhighlight, false);
        });
        
        function highlight() {
            wrapper.classList.add('drag-over');
        }
        
        function unhighlight() {
            wrapper.classList.remove('drag-over');
        }
        
        // Handle dropped files
        wrapper.addEventListener('drop', handleDrop, false);
        
        function handleDrop(e) {
            const dt = e.dataTransfer;
            const files = dt.files;
            
            if (files.length) {
                input.files = files;
                // Trigger change event
                const event = new Event('change');
                input.dispatchEvent(event);
            }
        }
    });
}

/**
 * Modal Dialogs
 */
function initModals() {
    // Open modal
    document.querySelectorAll('[data-modal-toggle]').forEach(button => {
        const modalId = button.getAttribute('data-modal-toggle');
        const modal = document.getElementById(modalId);
        
        if (modal) {
            button.addEventListener('click', () => {
                modal.classList.remove('hidden');
                document.body.style.overflow = 'hidden'; // Prevent scrolling
                
                // Focus on first focusable element
                const focusable = modal.querySelector('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
                if (focusable) focusable.focus();
            });
        }
    });
    
    // Close modal
    document.querySelectorAll('[data-modal-hide]').forEach(button => {
        const modalId = button.getAttribute('data-modal-hide');
        const modal = document.getElementById(modalId);
        
        if (modal) {
            button.addEventListener('click', () => {
                closeModal(modal);
            });
            
            // Close when clicking outside the modal content
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    closeModal(modal);
                }
            });
            
            // Close with Escape key
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape' && !modal.classList.contains('hidden')) {
                    closeModal(modal);
                }
            });
        }
    });
    
    function closeModal(modal) {
        modal.classList.add('hidden');
        document.body.style.overflow = ''; // Re-enable scrolling
    }
}

/**
 * Global Event Listeners
 */
function setupGlobalEventListeners() {
    // Handle form submissions with loading states
    document.querySelectorAll('form').forEach(form => {
        form.addEventListener('submit', function(e) {
            const submitButton = this.querySelector('button[type="submit"]');
            
            if (submitButton) {
                // Show loading state
                const originalText = submitButton.innerHTML;
                submitButton.disabled = true;
                submitButton.innerHTML = `
                    <i class="fas fa-spinner fa-spin mr-2"></i>
                    ${submitButton.getAttribute('data-loading-text') || 'Processing...'}
                `;
                
                // Revert button state if form submission fails
                const handleError = () => {
                    submitButton.disabled = false;
                    submitButton.innerHTML = originalText;
                };
                
                // If form is submitted via AJAX, handle the response
                if (this.getAttribute('data-ajax') !== null) {
                    e.preventDefault();
                    
                    const formData = new FormData(this);
                    const url = this.getAttribute('action') || window.location.href;
                    const method = this.getAttribute('method') || 'POST';
                    
                    fetch(url, {
                        method: method,
                        body: formData,
                        headers: {
                            'X-Requested-With': 'XMLHttpRequest'
                        }
                    })
                    .then(response => response.json())
                    .then(data => {
                        if (data.redirect) {
                            window.location.href = data.redirect;
                        } else if (data.message) {
                            showToast(data.message, data.status || 'success');
                            
                            if (data.status === 'success' && this.getAttribute('data-reset-on-success') !== 'false') {
                                this.reset();
                            }
                            
                            // Trigger custom event for form success
                            const event = new CustomEvent('formSuccess', { detail: data });
                            this.dispatchEvent(event);
                        }
                        
                        submitButton.disabled = false;
                        submitButton.innerHTML = originalText;
                    })
                    .catch(error => {
                        console.error('Error:', error);
                        showToast('An error occurred. Please try again.', 'error');
                        handleError();
                    });
                }
            }
        });
    });
}

/**
 * Show a toast notification
 * @param {string} message - The message to display
 * @param {string} type - The type of notification (success, error, warning, info)
 * @param {number} duration - How long to show the notification in milliseconds
 */
function showToast(message, type = 'info', duration = 5000) {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type} animate-fadeIn`;
    
    const icons = {
        success: 'check-circle',
        error: 'exclamation-circle',
        warning: 'exclamation-triangle',
        info: 'info-circle'
    };
    
    toast.innerHTML = `
        <div class="flex items-center">
            <i class="fas fa-${icons[type] || 'info-circle'} mr-2"></i>
            <span>${message}</span>
        </div>
        <button class="toast-close" aria-label="Close">
            <i class="fas fa-times"></i>
        </button>
    `;
    
    // Add to container or body
    const container = document.getElementById('toast-container') || document.body;
    if (!document.getElementById('toast-container')) {
        const toastContainer = document.createElement('div');
        toastContainer.id = 'toast-container';
        toastContainer.className = 'fixed bottom-4 right-4 space-y-2 z-50';
        document.body.appendChild(toastContainer);
    }
    
    container.appendChild(toast);
    
    // Auto remove after duration
    setTimeout(() => {
        toast.classList.remove('animate-fadeIn');
        toast.classList.add('animate-fadeOut');
        
        setTimeout(() => {
            toast.remove();
            
            // Remove container if no more toasts
            if (container.id === 'toast-container' && container.children.length === 0) {
                container.remove();
            }
        }, 300);
    }, duration);
    
    // Close button
    const closeButton = toast.querySelector('.toast-close');
    closeButton.addEventListener('click', () => {
        toast.classList.remove('animate-fadeIn');
        toast.classList.add('animate-fadeOut');
        
        setTimeout(() => {
            toast.remove();
            
            // Remove container if no more toasts
            if (container.id === 'toast-container' && container.children.length === 0) {
                container.remove();
            }
        }, 300);
    });
}

// Make showToast available globally
window.showToast = showToast;
