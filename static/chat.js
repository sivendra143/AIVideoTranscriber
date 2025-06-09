/**
 * Enhanced Chat Functionality for Video Transcriber
 * 
 * This script provides interactive functionality for the chat interface,
 * including animations, response formatting, and accessibility improvements.
 */

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    // Focus the input field on page load
    const questionInput = document.getElementById('question');
    const charCountElement = document.getElementById('char-count');
    const maxLength = questionInput ? questionInput.getAttribute('maxlength') : 200;
    
    if (questionInput) {
        questionInput.focus();
        
        // Initialize character counter
        function updateCharCount() {
            const currentLength = questionInput.value.length;
            charCountElement.textContent = `${currentLength}/${maxLength}`;
            
            // Change color when approaching limit
            if (currentLength > maxLength * 0.9) {
                charCountElement.style.color = '#e74c3c';
            } else if (currentLength > maxLength * 0.75) {
                charCountElement.style.color = '#f39c12';
            } else {
                charCountElement.style.color = '';
            }
        }
        
        // Initial update
        updateCharCount();
        
        // Character counter
        questionInput.addEventListener('input', updateCharCount);
        
        // Handle Enter key to submit
        questionInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendQuestion();
            }
        });
    }
    
    // Add animation to steps
    document.querySelectorAll('.step').forEach((el, i) => {
        setTimeout(() => {
            el.style.opacity = '1';
            el.style.transform = 'translateY(0)';
        }, i * 200);
    });
    
    // Initialize tooltips
    document.querySelectorAll('[title]').forEach(tooltip => {
        tooltip.setAttribute('data-tooltip', tooltip.getAttribute('title'));
        tooltip.addEventListener('mouseenter', showTooltip);
        tooltip.addEventListener('mouseleave', hideTooltip);
    });
    
    // Add transcript scroll shadow effect
    const transcript = document.getElementById('transcript');
    if (transcript) {
        transcript.addEventListener('scroll', function() {
            const isAtBottom = this.scrollHeight - this.scrollTop - this.clientHeight < 50;
            this.classList.toggle('at-bottom', isAtBottom);
        });
        
        // Trigger initial check
        transcript.dispatchEvent(new Event('scroll'));
    }
});

// Tooltip functions
function showTooltip(e) {
    const tooltip = document.createElement('div');
    tooltip.className = 'tooltip';
    tooltip.textContent = this.getAttribute('title');
    document.body.appendChild(tooltip);
    
    const rect = this.getBoundingClientRect();
    tooltip.style.top = `${rect.top - tooltip.offsetHeight - 10}px`;
    tooltip.style.left = `${rect.left + (this.offsetWidth / 2) - (tooltip.offsetWidth / 2)}px`;
    
    this.tooltip = tooltip;
}

function hideTooltip() {
    if (this.tooltip) {
        this.tooltip.remove();
        this.tooltip = null;
    }
}

// Set suggestion in the input field
function setSuggestion(text) {
    const questionInput = document.getElementById('question');
    questionInput.value = text;
    questionInput.focus();
    // Update character counter
    document.getElementById('char-count').textContent = text.length;
    // Add a subtle animation to the input
    questionInput.classList.add('pulse');
    setTimeout(() => questionInput.classList.remove('pulse'), 300);
}

// Send question to the server
function sendQuestion() {
    const questionInput = document.getElementById('question');
    const question = questionInput.value.trim();
    
    if (!question) {
        showToast('Please enter a question', 'error');
        questionInput.focus();
        return;
    }
    
    const loading = document.getElementById('loading');
    const responseCard = document.getElementById('response-card');
    const responseQuestion = document.getElementById('response-question');
    const responseAnswer = document.getElementById('response-answer');
    const emptyState = document.getElementById('empty-state');
    const sendBtn = document.getElementById('send-btn');
    
    // Show loading state with animation
    loading.style.display = 'flex';
    loading.classList.add('fade-in');
    responseCard.style.display = 'none';
    emptyState.style.display = 'none';
    
    // Disable input and button during request
    questionInput.disabled = true;
    sendBtn.disabled = true;
    sendBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i><span class="sr-only">Sending...</span>';
    sendBtn.setAttribute('aria-busy', 'true');
    
    // Start timing the response
    const startTime = Date.now();
    
    console.log('Sending question to server:', question);
    
    // Send request to server
    fetch('/ask', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-Requested-With': 'XMLHttpRequest'
        },
        body: JSON.stringify({ question: question })
    })
    .then(async response => {
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || `Server returned ${response.status}`);
        }
        return response.json();
    })
    .then(data => {
        console.log('Received response from server:', data);
        if (data.error) {
            throw new Error(data.error);
        }
        
        // Calculate response time
        const responseTime = ((Date.now() - startTime) / 1000).toFixed(1);
        
        // Update UI with response
        responseQuestion.textContent = question;
        responseAnswer.innerHTML = formatResponse(data.response || 'No response received');
        document.getElementById('response-time').textContent = `Generated in ${responseTime}s`;
        
        // Show the response card with animation
        responseCard.style.display = 'block';
        responseCard.classList.add('visible');
        
        // Hide empty state
        emptyState.style.display = 'none';
        
        // Clear input but keep focus
        questionInput.value = '';
        questionInput.focus();
        document.getElementById('char-count').textContent = '0';
        
        // Scroll to response with smooth animation
        setTimeout(() => {
            responseCard.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
        
        // Add highlight animation to new content
        responseAnswer.classList.add('highlight-new');
        setTimeout(() => responseAnswer.classList.remove('highlight-new'), 1500);
        
        // Log the response for debugging
        console.log('Response displayed successfully');
    })
    .catch(error => {
        console.error('Error:', error);
        console.error('Error stack:', error.stack);
        showToast(error.message || 'An error occurred while processing your question.', 'error');
        emptyState.style.display = 'flex';
    })
    .finally(() => {
        loading.style.display = 'none';
        questionInput.disabled = false;
        sendBtn.disabled = false;
        sendBtn.innerHTML = '<span class="btn-text">Send</span><i class="fas fa-paper-plane"></i>';
        sendBtn.setAttribute('aria-busy', 'false');
        
        // Re-focus the input field
        questionInput.focus();
    });
}

// Format response with markdown-like formatting
function formatResponse(text) {
    if (!text) return '';
    
    // Handle bullet points
    text = text.replace(/^\s*[-*]\s+/gm, '• ');
    
    // Handle bold text
    text = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    
    // Handle italic text
    text = text.replace(/\*(.*?)\*/g, '<em>$1</em>');
    
    // Handle line breaks
    text = text.replace(/\n/g, '<br>');
    
    // Handle code blocks
    text = text.replace(/```(\w*)\n([\s\S]*?)\n```/g, 
        '<pre><code class="language-$1">$2</code></pre>');
    
    // Handle inline code
    text = text.replace(/`([^`]+)`/g, '<code>$1</code>');
    
    return text;
}

// Copy response to clipboard
async function copyResponse() {
    const responseText = document.getElementById('response-answer').textContent;
    try {
        await navigator.clipboard.writeText(responseText);
        showToast('Response copied to clipboard!', 'success');
    } catch (err) {
        console.error('Failed to copy text: ', err);
        showToast('Failed to copy response', 'error');
    }
}

// PDF Generation
function generatePDF() {
    const modal = document.getElementById('pdf-title-modal');
    const titleInput = document.getElementById('pdf-title');
    
    // Reset and show modal with animation
    const defaultTitle = document.querySelector('.transcript-info span:first-child')?.textContent || 'Meeting Transcript';
    titleInput.value = defaultTitle;
    modal.style.display = 'flex';
    
    // Focus the input
    setTimeout(() => titleInput.focus(), 100);
    
    // Close modal when clicking outside
    modal.onclick = function(e) {
        if (e.target === modal) {
            closeModal();
        }
    };
    
    // Handle Escape key
    document.addEventListener('keydown', function onEsc(e) {
        if (e.key === 'Escape') {
            closeModal();
            document.removeEventListener('keydown', onEsc);
        }
    });
    
    // Handle Enter key
    titleInput.addEventListener('keydown', function onEnter(e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            confirmPDF();
            titleInput.removeEventListener('keydown', onEnter);
        }
    });
    
    function closeModal() {
        modal.classList.add('fade-out');
        setTimeout(() => {
            modal.style.display = 'none';
            modal.classList.remove('fade-out');
        }, 300);
    }
}

function confirmPDF() {
    const title = document.getElementById('pdf-title').value.trim() || 'Transcript';
    const modal = document.getElementById('pdf-title-modal');
    
    // Hide modal with animation
    modal.classList.add('fade-out');
    setTimeout(() => {
        modal.style.display = 'none';
        modal.classList.remove('fade-out');
    }, 300);
    
    // Show loading toast
    showToast('Generating PDF...', 'info');
    
    // Create form and submit
    const form = document.createElement('form');
    form.method = 'POST';
    form.action = '/generate_pdf';
    
    const titleInput = document.createElement('input');
    titleInput.type = 'hidden';
    titleInput.name = 'title';
    titleInput.value = title;
    
    form.appendChild(titleInput);
    document.body.appendChild(form);
    form.submit();
    
    // Remove form after submission
    setTimeout(() => {
        document.body.removeChild(form);
    }, 100);
}

// Show toast notification (using the global function from base.html)
function showToast(message, type = 'error', duration = 5000) {
    // Check if the global function exists, otherwise create a local implementation
    if (typeof window.showToast === 'function') {
        window.showToast(message, type, duration);
    } else {
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        
        // Add icon based on type
        const icon = document.createElement('i');
        icon.className = `fas ${type === 'error' ? 'fa-exclamation-circle' : 
                              type === 'success' ? 'fa-check-circle' : 
                              type === 'info' ? 'fa-info-circle' : 'fa-bell'}`;
        toast.appendChild(icon);
        
        // Add message text
        const textNode = document.createTextNode(' ' + message);
        toast.appendChild(textNode);
        
        document.body.appendChild(toast);
        
        // Show with animation
        setTimeout(() => toast.classList.add('show'), 10);
        
        // Hide after duration
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, duration);
    }
}
