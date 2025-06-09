/**
 * VideoTranscriber - Modern UI/UX Animations and Interactions
 * Version: 2.0
 * Description: Adds modern animations, transitions, and interactive elements
 */

// Always restore scroll on page load (safety patch)
window.addEventListener('DOMContentLoaded', function() {
  document.body.style.overflow = '';
});

// Initialize when DOM is fully loaded
document.addEventListener('DOMContentLoaded', function() {
  // Initialize all components
  // initParticleBackground(); // Temporarily disabled for scroll testing
  initFileUpload();
  initAnimations();
  initStepIndicator();
  initModals();
  initTooltips();
  initNavigation();
  initThemeToggle();
});

/**
 * Particle Background Animation
 * Creates a subtle animated background with floating particles
 */
function initParticleBackground() {
  const container = document.createElement('div');
  container.className = 'particles-container';
  document.body.appendChild(container);
  
  // Create particles
  const particleCount = window.innerWidth < 768 ? 15 : 30;
  const colors = [
    'rgba(var(--primary-hue), 85%, 55%, 0.3)',
    'rgba(var(--secondary-hue), 75%, 60%, 0.3)',
    'rgba(var(--accent-hue), 70%, 50%, 0.3)'
  ];
  
  for (let i = 0; i < particleCount; i++) {
    const particle = document.createElement('div');
    particle.className = 'particle';
    
    // Random properties
    const size = Math.random() * 50 + 10;
    const posX = Math.random() * 100;
    const posY = Math.random() * 100;
    const color = colors[Math.floor(Math.random() * colors.length)];
    const delay = Math.random() * 5;
    const duration = Math.random() * 10 + 10;
    
    // Apply styles
    particle.style.width = `${size}px`;
    particle.style.height = `${size}px`;
    particle.style.left = `${posX}%`;
    particle.style.top = `${posY}%`;
    particle.style.backgroundColor = color;
    particle.style.animationDelay = `${delay}s`;
    particle.style.animationDuration = `${duration}s`;
    
    container.appendChild(particle);
  }
}

/**
 * File Upload Enhancement
 * Adds drag and drop functionality and visual feedback
 */
function initFileUpload() {
  const fileUpload = document.querySelector('.file-upload');
  const fileInput = document.querySelector('.file-upload-input');
  
  if (!fileUpload || !fileInput) return;
  
  // Handle drag and drop events
  ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
    fileUpload.addEventListener(eventName, preventDefaults, false);
  });
  
  function preventDefaults(e) {
    e.preventDefault();
    e.stopPropagation();
  }
  
  // Highlight drop area when item is dragged over it
  ['dragenter', 'dragover'].forEach(eventName => {
    fileUpload.addEventListener(eventName, highlight, false);
  });
  
  ['dragleave', 'drop'].forEach(eventName => {
    fileUpload.addEventListener(eventName, unhighlight, false);
  });
  
  function highlight() {
    fileUpload.classList.add('drag-over');
  }
  
  function unhighlight() {
    fileUpload.classList.remove('drag-over');
  }
  
  // Handle dropped files
  fileUpload.addEventListener('drop', handleDrop, false);
  
  function handleDrop(e) {
    const dt = e.dataTransfer;
    const files = dt.files;
    fileInput.files = files;
    
    // Trigger change event
    const event = new Event('change');
    fileInput.dispatchEvent(event);
  }
  
  // Display file name when selected
  fileInput.addEventListener('change', function() {
    const fileNameDisplay = document.querySelector('.file-upload-text');
    if (!fileNameDisplay) return;
    
    if (this.files && this.files[0]) {
      const fileName = this.files[0].name;
      fileNameDisplay.textContent = fileName;
      fileNameDisplay.classList.add('file-selected');
      
      // Add pulse animation to submit button
      const submitBtn = document.querySelector('.send-btn');
      if (submitBtn) {
        submitBtn.classList.add('pulse');
        submitBtn.disabled = false;
      }
    }
  });
}

/**
 * Animations
 * Adds entrance animations to elements as they scroll into view
 */
function initAnimations() {
  // Animate elements when they enter the viewport
  const animatedElements = document.querySelectorAll('.animate-on-scroll');
  
  if (animatedElements.length === 0) return;
  
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, {
    threshold: 0.1
  });
  
  animatedElements.forEach(element => {
    observer.observe(element);
  });
  
  // Add animation classes to elements
  document.querySelectorAll('.card, .glass-card').forEach((element, index) => {
    element.classList.add('animate-on-scroll');
    element.style.animationDelay = `${index * 0.1}s`;
  });
  
  document.querySelectorAll('h1, h2').forEach(element => {
    element.classList.add('animate-on-scroll');
  });
}

/**
 * Step Indicator
 * Manages the step indicator for multi-step processes
 */
function initStepIndicator() {
  const stepItems = document.querySelectorAll('.step-item');
  
  if (stepItems.length === 0) return;
  
  // Function to update steps
  window.updateSteps = function(currentStep) {
    stepItems.forEach((item, index) => {
      if (index < currentStep) {
        item.classList.add('completed');
        item.classList.remove('active');
      } else if (index === currentStep) {
        item.classList.add('active');
        item.classList.remove('completed');
      } else {
        item.classList.remove('active', 'completed');
      }
    });
  };
  
  // Initialize with first step active
  updateSteps(0);
}

/**
 * Modal Dialogs
 * Handles opening and closing of modal dialogs
 */
function initModals() {
  // Open modal
  document.querySelectorAll('[data-modal-target]').forEach(button => {
    button.addEventListener('click', () => {
      const modalId = button.getAttribute('data-modal-target');
      const modal = document.getElementById(modalId);
      
      if (modal) {
        modal.classList.add('show');
        document.body.style.overflow = 'hidden';
      }
    });
  });
  
  // Close modal
  document.querySelectorAll('.modal-close, [data-modal-close]').forEach(button => {
    button.addEventListener('click', () => {
      const modal = button.closest('.modal-backdrop');
      
      if (modal) {
        modal.classList.remove('show');
        document.body.style.overflow = '';
      }
    });
  });
  
  // Close modal when clicking outside
  document.querySelectorAll('.modal-backdrop').forEach(modal => {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.classList.remove('show');
        document.body.style.overflow = '';
      }
    });
  });
  
  // Close modal with Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      document.querySelectorAll('.modal-backdrop.show').forEach(modal => {
        modal.classList.remove('show');
        document.body.style.overflow = '';
      });
    }
  });
}

/**
 * Tooltips
 * Initializes tooltip functionality
 */
function initTooltips() {
  document.querySelectorAll('[data-tooltip]').forEach(element => {
    const tooltipText = element.getAttribute('data-tooltip');
    
    // Create tooltip element
    const tooltip = document.createElement('span');
    tooltip.className = 'tooltip-text';
    tooltip.textContent = tooltipText;
    
    // Add tooltip to element
    element.classList.add('tooltip');
    element.appendChild(tooltip);
  });
}

/**
 * Navigation
 * Handles active state for navigation links
 */
function initNavigation() {
  const navLinks = document.querySelectorAll('.nav-link');
  
  if (navLinks.length === 0) return;
  
  // Set active link based on current page
  const currentPath = window.location.pathname;
  
  navLinks.forEach(link => {
    const linkPath = link.getAttribute('href');
    
    if (currentPath === linkPath || 
        (linkPath !== '/' && currentPath.startsWith(linkPath))) {
      link.classList.add('active');
    } else {
      link.classList.remove('active');
    }
  });
  
  // Smooth page transitions
  navLinks.forEach(link => {
    link.addEventListener('click', function(e) {
      const href = this.getAttribute('href');
      
      // Only handle internal links
      if (href.startsWith('/') || href.startsWith('#')) {
        e.preventDefault();
        
        // Add exit animation
        document.querySelector('main').classList.add('page-transition-exit-active');
        
        // Navigate after animation completes
        setTimeout(() => {
          window.location.href = href;
        }, 300);
      }
    });
  });
}

/**
 * Theme Toggle
 * Adds dark/light mode toggle functionality
 */
function initThemeToggle() {
  const themeToggle = document.querySelector('.theme-toggle');
  
  if (!themeToggle) return;
  
  // Check for saved theme preference or respect OS preference
  const savedTheme = localStorage.getItem('theme');
  
  if (savedTheme) {
    document.documentElement.setAttribute('data-theme', savedTheme);
    if (savedTheme === 'dark') {
      themeToggle.classList.add('active');
    }
  } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    document.documentElement.setAttribute('data-theme', 'dark');
    themeToggle.classList.add('active');
  }
  
  // Toggle theme when button is clicked
  themeToggle.addEventListener('click', () => {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    
    themeToggle.classList.toggle('active');
  });
}

/**
 * Form Validation
 * Adds client-side validation to forms
 */
function initFormValidation() {
  const forms = document.querySelectorAll('form');
  
  forms.forEach(form => {
    form.addEventListener('submit', function(e) {
      if (!this.checkValidity()) {
        e.preventDefault();
        e.stopPropagation();
      }
      
      form.classList.add('was-validated');
    }, false);
  });
}

/**
 * Progress Bar Animation
 * Animates progress bars when they come into view
 */
function initProgressBars() {
  const progressBars = document.querySelectorAll('.progress-bar');
  
  if (progressBars.length === 0) return;
  
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const targetWidth = entry.target.getAttribute('data-width') || '0';
        entry.target.style.width = targetWidth;
        observer.unobserve(entry.target);
      }
    });
  }, {
    threshold: 0.1
  });
  
  progressBars.forEach(progressBar => {
    // Store the target width and set initial width to 0
    const targetWidth = progressBar.style.width || '100%';
    progressBar.setAttribute('data-width', targetWidth);
    progressBar.style.width = '0';
    
    observer.observe(progressBar);
  });
}

/**
 * Smooth Scrolling
 * Adds smooth scrolling to anchor links
 */
function initSmoothScrolling() {
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
      e.preventDefault();
      
      const targetId = this.getAttribute('href');
      if (targetId === '#') return;
      
      const targetElement = document.querySelector(targetId);
      
      if (targetElement) {
        targetElement.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
      }
    });
  });
}

/**
 * Countdown Timer
 * Creates a countdown timer for time-sensitive actions
 */
function createCountdownTimer(targetElement, durationInSeconds, onComplete) {
  if (!targetElement) return;
  
  let timeLeft = durationInSeconds;
  
  const timer = setInterval(() => {
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    
    targetElement.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
    
    if (timeLeft <= 0) {
      clearInterval(timer);
      if (typeof onComplete === 'function') {
        onComplete();
      }
    }
    
    timeLeft--;
  }, 1000);
  
  return {
    stop: () => clearInterval(timer)
  };
}

/**
 * Typing Animation
 * Creates a typing animation effect for text
 */
function createTypingAnimation(targetElement, text, speed = 50) {
  if (!targetElement) return;
  
  let i = 0;
  targetElement.textContent = '';
  
  const typing = setInterval(() => {
    if (i < text.length) {
      targetElement.textContent += text.charAt(i);
      i++;
    } else {
      clearInterval(typing);
    }
  }, speed);
  
  return {
    stop: () => clearInterval(typing),
    complete: () => {
      clearInterval(typing);
      targetElement.textContent = text;
    }
  };
}

/**
 * Notification System
 * Creates toast notifications
 */
function showNotification(message, type = 'info', duration = 3000) {
  // Create notification container if it doesn't exist
  let container = document.querySelector('.notification-container');
  
  if (!container) {
    container = document.createElement('div');
    container.className = 'notification-container';
    document.body.appendChild(container);
  }
  
  // Create notification element
  const notification = document.createElement('div');
  notification.className = `notification notification-${type} animate-slideInRight`;
  notification.textContent = message;
  
  // Add close button
  const closeButton = document.createElement('button');
  closeButton.className = 'notification-close';
  closeButton.innerHTML = '&times;';
  closeButton.addEventListener('click', () => {
    notification.classList.add('animate-slideOutRight');
    setTimeout(() => {
      notification.remove();
    }, 300);
  });
  
  notification.appendChild(closeButton);
  container.appendChild(notification);
  
  // Auto-remove after duration
  setTimeout(() => {
    notification.classList.add('animate-slideOutRight');
    setTimeout(() => {
      notification.remove();
    }, 300);
  }, duration);
  
  return notification;
}

/**
 * Drag to Reorder
 * Adds drag and drop functionality to reorder items
 */
function initDragToReorder(containerSelector, itemSelector, onReorder) {
  const container = document.querySelector(containerSelector);
  if (!container) return;
  
  const items = container.querySelectorAll(itemSelector);
  
  items.forEach(item => {
    item.setAttribute('draggable', 'true');
    
    item.addEventListener('dragstart', () => {
      setTimeout(() => item.classList.add('dragging'), 0);
    });
    
    item.addEventListener('dragend', () => {
      item.classList.remove('dragging');
      
      // Call callback with new order
      if (typeof onReorder === 'function') {
        const newOrder = Array.from(container.querySelectorAll(itemSelector)).map(el => el.getAttribute('data-id'));
        onReorder(newOrder);
      }
    });
  });
  
  container.addEventListener('dragover', e => {
    e.preventDefault();
    
    const draggingItem = container.querySelector('.dragging');
    if (!draggingItem) return;
    
    const siblings = Array.from(container.querySelectorAll(`${itemSelector}:not(.dragging)`));
    
    const nextSibling = siblings.find(sibling => {
      const box = sibling.getBoundingClientRect();
      const offset = e.clientY - box.top - box.height / 2;
      return offset < 0;
    });
    
    container.insertBefore(draggingItem, nextSibling);
  });
}

/**
 * Lazy Loading Images
 * Loads images only when they come into view
 */
function initLazyLoading() {
  if ('IntersectionObserver' in window) {
    const lazyImages = document.querySelectorAll('img[data-src]');
    
    const imageObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target;
          img.src = img.getAttribute('data-src');
          img.removeAttribute('data-src');
          imageObserver.unobserve(img);
        }
      });
    });
    
    lazyImages.forEach(img => {
      imageObserver.observe(img);
    });
  } else {
    // Fallback for browsers that don't support IntersectionObserver
    const lazyImages = document.querySelectorAll('img[data-src]');
    
    lazyImages.forEach(img => {
      img.src = img.getAttribute('data-src');
      img.removeAttribute('data-src');
    });
  }
}

/**
 * Infinite Scroll
 * Loads more content when user scrolls to the bottom
 */
function initInfiniteScroll(containerSelector, loadMoreCallback, options = {}) {
  const container = document.querySelector(containerSelector);
  if (!container) return;
  
  const defaultOptions = {
    threshold: 100, // px from bottom
    loadingIndicator: true
  };
  
  const settings = { ...defaultOptions, ...options };
  let isLoading = false;
  let loadingIndicator;
  
  if (settings.loadingIndicator) {
    loadingIndicator = document.createElement('div');
    loadingIndicator.className = 'loader';
    loadingIndicator.style.display = 'none';
    container.appendChild(loadingIndicator);
  }
  
  window.addEventListener('scroll', () => {
    if (isLoading) return;
    
    const scrollPosition = window.innerHeight + window.scrollY;
    const containerBottom = container.offsetTop + container.offsetHeight;
    
    if (scrollPosition >= containerBottom - settings.threshold) {
      isLoading = true;
      
      if (loadingIndicator) {
        loadingIndicator.style.display = 'block';
      }
      
      // Call the load more callback
      if (typeof loadMoreCallback === 'function') {
        loadMoreCallback(() => {
          isLoading = false;
          
          if (loadingIndicator) {
            loadingIndicator.style.display = 'none';
          }
        });
      }
    }
  });
}

/**
 * Scroll to Top Button
 * Adds a button to scroll back to the top of the page
 */
function initScrollToTopButton() {
  // Create the button
  const button = document.createElement('button');
  button.className = 'scroll-to-top';
  button.innerHTML = '&uarr;';
  button.setAttribute('aria-label', 'Scroll to top');
  button.style.display = 'none';
  
  document.body.appendChild(button);
  
  // Show/hide button based on scroll position
  window.addEventListener('scroll', () => {
    if (window.scrollY > 300) {
      button.style.display = 'block';
    } else {
      button.style.display = 'none';
    }
  });
  
  // Scroll to top when clicked
  button.addEventListener('click', () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  });
}

/**
 * Utility Functions
 */

// Debounce function to limit how often a function can be called
function debounce(func, wait) {
  let timeout;
  
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// Throttle function to limit how often a function can be called
function throttle(func, limit) {
  let inThrottle;
  
  return function executedFunction(...args) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      
      setTimeout(() => {
        inThrottle = false;
      }, limit);
    }
  };
}

// Get computed CSS variable value
function getCSSVariable(variable) {
  return getComputedStyle(document.documentElement).getPropertyValue(variable).trim();
}

// Set CSS variable value
function setCSSVariable(variable, value) {
  document.documentElement.style.setProperty(variable, value);
}

// Generate random ID
function generateRandomId(length = 8) {
  return Math.random().toString(36).substring(2, 2 + length);
}

// Format date
function formatDate(date, format = 'YYYY-MM-DD') {
  const d = new Date(date);
  
  const formatMap = {
    YYYY: d.getFullYear(),
    MM: String(d.getMonth() + 1).padStart(2, '0'),
    DD: String(d.getDate()).padStart(2, '0'),
    HH: String(d.getHours()).padStart(2, '0'),
    mm: String(d.getMinutes()).padStart(2, '0'),
    ss: String(d.getSeconds()).padStart(2, '0')
  };
  
  return format.replace(/YYYY|MM|DD|HH|mm|ss/g, match => formatMap[match]);
}

// Copy text to clipboard
function copyToClipboard(text) {
  return new Promise((resolve, reject) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text)
        .then(() => resolve(true))
        .catch(err => reject(err));
    } else {
      // Fallback for older browsers
      try {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.style.position = 'fixed';
        document.body.appendChild(textarea);
        textarea.focus();
        textarea.select();
        
        const successful = document.execCommand('copy');
        document.body.removeChild(textarea);
        
        if (successful) {
          resolve(true);
        } else {
          reject(new Error('Unable to copy'));
        }
      } catch (err) {
        reject(err);
      }
    }
  });
}

