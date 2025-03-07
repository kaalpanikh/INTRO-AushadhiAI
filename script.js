document.addEventListener('DOMContentLoaded', function() {
    // Add fade-in animations for sections
    const sections = document.querySelectorAll('section, header');
    
    const fadeInOptions = {
        threshold: 0.1,
        rootMargin: "0px 0px -100px 0px"
    };
    
    const fadeInObserver = new IntersectionObserver(function(entries, observer) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                fadeInObserver.unobserve(entry.target);
            }
        });
    }, fadeInOptions);
    
    sections.forEach(section => {
        section.classList.add('fade-in');
        fadeInObserver.observe(section);
    });
    
    // Add hover animations for feature cards
    const featureCards = document.querySelectorAll('.feature-card');
    
    featureCards.forEach(card => {
        card.addEventListener('mouseenter', function() {
            const icon = this.querySelector('.feature-icon i');
            icon.classList.add('pulse');
        });
        
        card.addEventListener('mouseleave', function() {
            const icon = this.querySelector('.feature-icon i');
            icon.classList.remove('pulse');
        });
    });
    
    // Smooth scroll for CTA buttons
    const ctaButtons = document.querySelectorAll('.cta-button');
    
    ctaButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            
            // This would be replaced with actual functionality
            // For now, let's just add a visual effect
            this.classList.add('clicked');
            
            setTimeout(() => {
                this.classList.remove('clicked');
                alert('This would take you to the AushadhiAI application!');
            }, 300);
        });
    });
    
    // Add a CSS class to the body when page is loaded
    setTimeout(() => {
        document.body.classList.add('loaded');
    }, 300);
}); 