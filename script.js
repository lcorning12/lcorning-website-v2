// Lee Corning AI Website JavaScript

// DOM Content Loaded
document.addEventListener('DOMContentLoaded', function() {
    initializeWebsite();
});

function initializeWebsite() {
    setupNavigation();
    setupROICalculator();
    setupContactForm();
    setupAnimations();
    setupVideoPlaceholder();
    setupFAQAccordion();
    setupScrollEffects();
}

// Navigation Setup
function setupNavigation() {
    const navbar = document.querySelector('nav');
    const mobileMenuButton = document.getElementById('mobile-menu-button');
    const mobileMenu = document.getElementById('mobile-menu');
    
    // Navbar scroll effect
    window.addEventListener('scroll', function() {
        if (window.scrollY > 50) {
            navbar.classList.add('bg-white/95', 'shadow-lg');
        } else {
            navbar.classList.remove('bg-white/95', 'shadow-lg');
        }
    });

    // Smooth scrolling for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });

    // Mobile menu toggle (if implemented)
    if (mobileMenuButton && mobileMenu) {
        mobileMenuButton.addEventListener('click', function() {
            mobileMenu.classList.toggle('open');
        });
    }
}

// ROI Calculator Setup
function setupROICalculator() {
    const inputs = {
        support: document.getElementById('support-cost'),
        content: document.getElementById('content-cost'),
        data: document.getElementById('data-cost'),
        dev: document.getElementById('dev-cost')
    };

    const outputs = {
        support: document.getElementById('support-after'),
        content: document.getElementById('content-after'),
        data: document.getElementById('data-after'),
        dev: document.getElementById('dev-after'),
        total: document.getElementById('total-savings')
    };

    // Reduction percentages
    const reductions = {
        support: 0.75,  // 75% reduction
        content: 0.75,  // 75% reduction
        data: 0.70,     // 70% reduction
        dev: 0.60       // 60% reduction
    };

    function calculateROI() {
        let totalBefore = 0;
        let totalAfter = 0;

        for (const [key, input] of Object.entries(inputs)) {
            if (input) {
                const before = parseFloat(input.value) || 0;
                const after = before * (1 - reductions[key]);
                
                totalBefore += before;
                totalAfter += after;

                // Update display
                if (outputs[key]) {
                    outputs[key].textContent = `$${after.toLocaleString('en-US')}`;
                }
            }
        }

        const totalSavings = totalBefore - totalAfter;
        if (outputs.total) {
            outputs.total.textContent = `$${totalSavings.toLocaleString('en-US')}`;
            
            // Animate the number
            animateNumber(outputs.total, totalSavings);
        }
    }

    // Add event listeners to inputs
    for (const input of Object.values(inputs)) {
        if (input) {
            input.addEventListener('input', calculateROI);
        }
    }

    // Initial calculation
    calculateROI();
}

// Animate number counting
function animateNumber(element, targetValue) {
    const startValue = 0;
    const duration = 1000;
    const startTime = performance.now();

    function updateNumber(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // Ease-out animation
        const easedProgress = 1 - Math.pow(1 - progress, 3);
        const currentValue = startValue + (targetValue - startValue) * easedProgress;
        
        element.textContent = `$${Math.floor(currentValue).toLocaleString('en-US')}`;
        
        if (progress < 1) {
            requestAnimationFrame(updateNumber);
        }
    }
    
    requestAnimationFrame(updateNumber);
}

// Contact Form Setup
function setupContactForm() {
    const form = document.getElementById('contact-form');
    if (!form) return;

    form.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());
        
        // Validate form
        if (!validateForm(data)) {
            return;
        }
        
        // Show loading state
        const submitButton = form.querySelector('button[type="submit"]');
        const originalText = submitButton.textContent;
        submitButton.innerHTML = '<div class="spinner"></div> Sending...';
        submitButton.disabled = true;
        
        // Submit to Formspree and create calendar invite
        submitFormData(formData, form, submitButton, originalText);
    });
}

// Submit form data to Formspree and create calendar event
async function submitFormData(formData, form, submitButton, originalText) {
    try {
        // Submit to Formspree
        const response = await fetch(form.action, {
            method: 'POST',
            body: formData,
            headers: {
                'Accept': 'application/json'
            }
        });
        
        if (response.ok) {
            // Show success message
            showMessage('Thank you! We\'ll be in touch within 4 hours to schedule your consultation.', 'success');
            
            // Create calendar booking link
            const name = formData.get('name');
            const email = formData.get('email');
            const company = formData.get('company');
            const goals = formData.get('goals') || 'AI transformation consultation';
            
            // Generate calendar invite URL (Google Calendar)
            const calendarUrl = createCalendarInvite(name, email, company, goals);
            
            // Show calendar booking option
            setTimeout(() => {
                showCalendarBookingModal(calendarUrl, name);
            }, 1000);
            
            // Reset form
            form.reset();
            
            // Track conversion
            if (typeof gtag !== 'undefined') {
                gtag('event', 'form_submit', {
                    'event_category': 'Contact',
                    'event_label': 'Consultation Request'
                });
            }
        } else {
            throw new Error('Form submission failed');
        }
    } catch (error) {
        console.error('Form submission error:', error);
        showMessage('Sorry, there was an error sending your message. Please try again or email lc@lcorning.com directly.', 'error');
    } finally {
        // Reset button
        submitButton.textContent = originalText;
        submitButton.disabled = false;
    }
}

// Create Google Calendar invite URL
function createCalendarInvite(name, email, company, goals) {
    const title = encodeURIComponent(`AI Consultation - ${name} (${company})`);
    const details = encodeURIComponent(`
AI Transformation Consultation

Client: ${name}
Company: ${company}
Email: ${email}

Goals: ${goals}

Meeting Link: https://meet.google.com/new
    `);
    
    // Set for next business day at 2 PM EST
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(14, 0, 0, 0); // 2 PM
    
    const startTime = tomorrow.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    const endTime = new Date(tomorrow.getTime() + 60 * 60 * 1000).toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    
    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${startTime}/${endTime}&details=${details}&guests=${encodeURIComponent('lc@lcorning.com,' + email)}`;
}

// Show calendar booking modal
function showCalendarBookingModal(calendarUrl, name) {
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
    modal.innerHTML = `
        <div class="bg-white rounded-lg p-8 max-w-md mx-4">
            <h3 class="text-2xl font-bold mb-4 text-gray-900">Almost Done, ${name}!</h3>
            <p class="text-gray-600 mb-6">Click below to schedule your free consultation on my calendar:</p>
            <div class="flex gap-4">
                <a href="${calendarUrl}" target="_blank" class="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg text-center hover:bg-blue-700">
                    📅 Schedule Meeting
                </a>
                <button onclick="this.closest('.fixed').remove()" class="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50">
                    Later
                </button>
            </div>
            <p class="text-sm text-gray-500 mt-4 text-center">
                Or email me directly at <a href="mailto:lc@lcorning.com" class="text-blue-600">lc@lcorning.com</a>
            </p>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Auto-remove after 30 seconds
    setTimeout(() => {
        if (modal.parentNode) {
            modal.remove();
        }
    }, 30000);
}

// Form validation
function validateForm(data) {
    const required = ['name', 'email', 'company'];
    let isValid = true;
    
    for (const field of required) {
        if (!data[field] || data[field].trim() === '') {
            showFieldError(field, 'This field is required');
            isValid = false;
        } else {
            clearFieldError(field);
        }
    }
    
    // Email validation
    if (data.email && !isValidEmail(data.email)) {
        showFieldError('email', 'Please enter a valid email address');
        isValid = false;
    }
    
    return isValid;
}

function showFieldError(fieldName, message) {
    const field = document.querySelector(`[name="${fieldName}"]`);
    if (field) {
        const wrapper = field.parentElement;
        wrapper.classList.add('error');
        
        let errorElement = wrapper.querySelector('.field-error');
        if (!errorElement) {
            errorElement = document.createElement('div');
            errorElement.className = 'field-error';
            wrapper.appendChild(errorElement);
        }
        errorElement.textContent = message;
    }
}

function clearFieldError(fieldName) {
    const field = document.querySelector(`[name="${fieldName}"]`);
    if (field) {
        const wrapper = field.parentElement;
        wrapper.classList.remove('error');
        wrapper.classList.add('success');
        
        const errorElement = wrapper.querySelector('.field-error');
        if (errorElement) {
            errorElement.remove();
        }
    }
}

function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

function showMessage(message, type = 'success') {
    // Remove existing messages
    const existingMessages = document.querySelectorAll('.success-message, .error-message');
    existingMessages.forEach(msg => msg.remove());
    
    // Create new message
    const messageElement = document.createElement('div');
    messageElement.className = `${type}-message show`;
    messageElement.textContent = message;
    
    // Add to form
    const form = document.getElementById('contact-form');
    if (form) {
        form.appendChild(messageElement);
        
        // Auto-hide after 5 seconds
        setTimeout(() => {
            messageElement.classList.remove('show');
            setTimeout(() => messageElement.remove(), 300);
        }, 5000);
    }
}

// Animation Setup
function setupAnimations() {
    // Intersection Observer for scroll animations
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animated');
            }
        });
    }, {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    });

    // Observe elements that should animate on scroll
    document.querySelectorAll('.animate-on-scroll').forEach(el => {
        observer.observe(el);
    });

    // Add animation classes to elements
    const animatedElements = document.querySelectorAll('.testimonial-card, .pricing-card, .stat-number');
    animatedElements.forEach(el => {
        el.classList.add('animate-on-scroll');
    });
}

// Video Placeholder Setup
function setupVideoPlaceholder() {
    const videoPlaceholder = document.querySelector('.aspect-video');
    if (videoPlaceholder) {
        videoPlaceholder.addEventListener('click', function() {
            // Replace with actual video embed or modal
            showMessage('Demo video coming soon!', 'info');
        });
    }
}

// FAQ Accordion Setup
function setupFAQAccordion() {
    const faqItems = document.querySelectorAll('.faq-item');
    
    faqItems.forEach(item => {
        const header = item.querySelector('h3');
        if (header) {
            header.style.cursor = 'pointer';
            header.addEventListener('click', function() {
                // Toggle active state
                const isActive = item.classList.contains('active');
                
                // Close all items
                faqItems.forEach(otherItem => {
                    otherItem.classList.remove('active');
                });
                
                // Open clicked item if it wasn't active
                if (!isActive) {
                    item.classList.add('active');
                }
            });
        }
    });
}

// Scroll Effects Setup
function setupScrollEffects() {
    let ticking = false;
    
    function updateScrollEffects() {
        const scrollPercent = window.scrollY / (document.body.scrollHeight - window.innerHeight);
        
        // Update any scroll-based animations here
        ticking = false;
    }
    
    window.addEventListener('scroll', function() {
        if (!ticking) {
            requestAnimationFrame(updateScrollEffects);
            ticking = true;
        }
    });
}

// Utility Functions
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

function throttle(func, limit) {
    let inThrottle;
    return function() {
        const args = arguments;
        const context = this;
        if (!inThrottle) {
            func.apply(context, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    }
}

// Track page interactions (if analytics is set up)
function trackInteraction(category, action, label) {
    if (typeof gtag !== 'undefined') {
        gtag('event', action, {
            'event_category': category,
            'event_label': label
        });
    }
}

// Add event listeners for tracking
document.addEventListener('click', function(e) {
    // Track button clicks
    if (e.target.matches('a[href="#contact"]')) {
        trackInteraction('CTA', 'click', 'Contact Button');
    }
    
    if (e.target.matches('a[href="#roi-calculator"]')) {
        trackInteraction('CTA', 'click', 'ROI Calculator');
    }
});

// Error handling
window.addEventListener('error', function(e) {
    console.error('Website error:', e.error);
    // Could send to error tracking service
});

// Performance monitoring
window.addEventListener('load', function() {
    // Log page load time
    const loadTime = performance.timing.loadEventEnd - performance.timing.navigationStart;
    console.log(`Page loaded in ${loadTime}ms`);
    
    if (typeof gtag !== 'undefined') {
        gtag('event', 'timing_complete', {
            'name': 'load',
            'value': loadTime
        });
    }
});