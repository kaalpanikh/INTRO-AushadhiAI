document.addEventListener('DOMContentLoaded', function() {
    // === Configuration ===
    const API_URL = 'http://localhost:8001/api'; // Backend API endpoint
    
    // Create a global variable to track the current file
    let currentFile = null;

    // === Animation and UI code ===
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

    // Scroll to app section for all CTA buttons
    const ctaButtons = document.querySelectorAll('.cta-button');
    ctaButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            document.getElementById('app-section').scrollIntoView({ behavior: 'smooth' });
        });
    });
    
    // Add a CSS class to the body when page is loaded
    setTimeout(() => {
        document.body.classList.add('loaded');
    }, 300);

    // === Prescription Upload and Analysis Functionality ===
    // Get DOM elements
    const fileInput = document.getElementById('fileInput');
    const uploadArea = document.getElementById('uploadArea');
    const uploadPrompt = document.getElementById('uploadPrompt');
    const previewContainer = document.getElementById('previewContainer');
    const previewImage = document.getElementById('previewImage');
    const removeImageBtn = document.getElementById('removeImageBtn');
    const uploadButton = document.getElementById('uploadButton');
    const loader = document.getElementById('loader');
    const resultsContainer = document.getElementById('resultsContainer');
    const medicationsContainer = document.getElementById('medications-container');
    const resetButton = document.getElementById('resetButton');

    // Track current file
    // let currentFile = null; // Removed this line

    // Click on upload area to trigger file input
    uploadArea.addEventListener('click', () => {
        fileInput.click();
    });

    // Handle drag and drop
    uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadArea.classList.add('dragover');
    });

    uploadArea.addEventListener('dragleave', () => {
        uploadArea.classList.remove('dragover');
    });

    uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadArea.classList.remove('dragover');
        
        if (e.dataTransfer.files.length) {
            handleFile(e.dataTransfer.files[0]);
        }
    });

    // Handle file selection
    fileInput.addEventListener('change', () => {
        if (fileInput.files.length) {
            handleFile(fileInput.files[0]);
        }
    });

    // Remove selected image
    removeImageBtn.addEventListener('click', (e) => {
        e.stopPropagation(); // Prevent triggering uploadArea click
        resetUpload();
    });

    // Upload and analyze prescription
    uploadButton.addEventListener('click', () => {
        if (currentFile) {
            analyzeImage(currentFile);
        }
    });

    // Reset to upload another prescription
    resetButton.addEventListener('click', () => {
        resetUpload();
        resultsContainer.style.display = 'none';
    });

    // Handle the selected file
    function handleFile(file) {
        // Check if file is an image
        if (!file.type.match('image/jpeg') && !file.type.match('image/png') && !file.type.match('image/jpg')) {
            showError('Please select a JPEG or PNG image.');
            return;
        }

        // Check file size (max 10MB)
        if (file.size > 10 * 1024 * 1024) {
            showError('File is too large. Maximum size is 10MB.');
            return;
        }

        // Store the current file
        currentFile = file;

        // Display preview
        const reader = new FileReader();
        reader.onload = (e) => {
            previewImage.src = e.target.result;
            uploadPrompt.style.display = 'none';
            previewContainer.style.display = 'flex';
            uploadButton.disabled = false;
            
            // Remove any error message
            const errorMessage = uploadArea.querySelector('.error-message');
            if (errorMessage) {
                errorMessage.remove();
            }
        };
        reader.readAsDataURL(file);
    }

    // Upload and analyze image
    function analyzeImage(file) {
        // Show loader
        uploadButton.style.display = 'none';
        loader.style.display = 'flex';

        // Create form data
        const formData = new FormData();
        formData.append('file', file);

        // Send request to backend
        console.log("Sending image to backend for analysis...");
        fetch(`${API_URL}/analyze`, {
            method: 'POST',
            body: formData
        })
        .then(response => {
            if (!response.ok) {
                return response.json().then(err => {
                    throw new Error(err.detail || 'An error occurred during analysis.');
                });
            }
            return response.json();
        })
        .then(data => {
            console.log("Received response from backend:", data);
            
            // Hide loader
            loader.style.display = 'none';
            
            // Display results
            displayMedicationDetails(data.medications);
        })
        .catch(error => {
            // Hide loader
            loader.style.display = 'none';
            uploadButton.style.display = 'block';
            
            // Show error
            console.error("Analysis error:", error);
            showError(error.message || 'Failed to analyze prescription. Please try again.');
        });
    }

    // Display medication details
    function displayMedicationDetails(medications) {
        const medicationsContainer = document.getElementById('medications-container');
        medicationsContainer.innerHTML = '';

        if (!medications || medications.length === 0) {
            medicationsContainer.innerHTML = `
                <div class="no-medications">
                    <p>No medications detected in the prescription.</p>
                    <p>Please try another image or ensure the prescription is clearly visible.</p>
                </div>`;
            return;
        }

        medications.forEach(medication => {
            // Apply defensive programming to avoid undefined values
            const name = medication.name || 'Unknown Medication';
            const confidence = medication.confidence ? `${(medication.confidence * 100).toFixed(1)}%` : 'N/A';
            const matchedText = medication.matched_text || medication.extracted_text || 'Text not extracted';
            const description = medication.description || 'Information not available';
            
            // Handle array properties safely with fallbacks
            const drugClass = Array.isArray(medication.drug_class) && medication.drug_class.length > 0 
                ? medication.drug_class.join(', ') 
                : 'Information not available';
                
            const sideEffects = Array.isArray(medication.side_effects) && medication.side_effects.length > 0 
                ? medication.side_effects.map(effect => `<li>${effect}</li>`).join('') 
                : '<li>Information not available</li>';
                
            const interactions = Array.isArray(medication.interactions) && medication.interactions.length > 0 
                ? medication.interactions.map(interaction => `<li>${interaction}</li>`).join('') 
                : '<li>Information not available</li>';
                
            const warnings = Array.isArray(medication.warnings) && medication.warnings.length > 0 
                ? medication.warnings.map(warning => `<li>${warning}</li>`).join('') 
                : '<li>Information not available</li>';
                
            const indications = Array.isArray(medication.indications) && medication.indications.length > 0 
                ? medication.indications.map(indication => `<li>${indication}</li>`).join('') 
                : '<li>Information not available</li>';
            
            // Handle new RxNorm fields
            const strength = medication.strength || 'Not specified';
            const form = medication.form || 'Not specified';
            const detectedDosage = medication.detected_dosage || medication.dosage_info || 'Not detected';

            const medicationCard = document.createElement('div');
            medicationCard.className = 'medication-card';
            medicationCard.innerHTML = `
                <div class="medication-header">
                    <h3>${name}</h3>
                    <span class="confidence">Match confidence: ${confidence}</span>
                </div>
                <div class="medication-body">
                    <div class="medication-section">
                        <h4>Medication Details</h4>
                        <p><strong>Description:</strong> ${description}</p>
                        <p><strong>Drug Class:</strong> ${drugClass}</p>
                        <p><strong>Strength:</strong> ${strength}</p>
                        <p><strong>Form:</strong> ${form}</p>
                        <p><strong>Detected From:</strong> ${matchedText}</p>
                        <p><strong>Detected Dosage:</strong> ${detectedDosage}</p>
                    </div>
                    
                    <div class="medication-section">
                        <h4>Indications</h4>
                        <ul>${indications}</ul>
                    </div>
                    
                    <div class="medication-section">
                        <h4>Side Effects</h4>
                        <ul>${sideEffects}</ul>
                    </div>
                    
                    <div class="medication-section">
                        <h4>Interactions</h4>
                        <ul>${interactions}</ul>
                    </div>
                    
                    <div class="medication-section warnings">
                        <h4>Warnings</h4>
                        <ul>${warnings}</ul>
                    </div>
                </div>
            `;
            
            medicationsContainer.appendChild(medicationCard);
        });
    }

    // Show error message
    function showError(message) {
        // Remove any existing error message
        const errorMessage = uploadArea.querySelector('.error-message');
        if (errorMessage) {
            errorMessage.remove();
        }
        
        // Create new error message
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.innerHTML = `<i class="fas fa-exclamation-circle"></i> ${message}`;
        
        // Add to upload actions
        const uploadActions = document.querySelector('.upload-actions');
        uploadActions.appendChild(errorDiv);
    }

    // Reset upload form
    function resetUpload() {
        // Reset file input
        fileInput.value = '';
        currentFile = null;
        
        // Reset UI
        previewContainer.style.display = 'none';
        uploadPrompt.style.display = 'flex';
        uploadButton.disabled = true;
        uploadButton.style.display = 'block';
        loader.style.display = 'none';
        
        // Remove any error message
        const errorMessage = uploadArea.querySelector('.error-message');
        if (errorMessage) {
            errorMessage.remove();
        }
    }
});