document.addEventListener('DOMContentLoaded', async function() {
    // === Configuration ===
    // API Configuration - Updated for production
    const API_URL = 'https://aiapi.nikhilmishra.live';
    
    // Previous configuration
    // const API_URL = 'http://localhost:8007';
    // const API_URL = 'https://aushadhi-backend.azurewebsites.net';
    
    // Create a global variable to track the current file
    let currentFile = null;
    let backendReady = false;

    // === Test backend connection with a known image ===
    async function testBackendWithSampleImage() {
        try {
            console.log('Testing backend connection...');
            const response = await fetch(`${API_URL}/api/health`);
            if (!response.ok) {
                console.error('Backend health check failed');
                showMessage("Backend connection issues detected. Retry might be needed.", "warning");
                return false;
            }
            
            console.log('Backend health check passed');
            const data = await response.json();
            console.log('Backend health data:', data);
            
            if (data.status === 'healthy') {
                console.log('Backend is healthy and ready');
                backendReady = true;
                return true;
            } else {
                console.error('Backend is not healthy:', data);
                return false;
            }
        } catch (error) {
            console.error('Error testing backend:', error);
            showMessage("Backend connection failed. Retry might be needed.", "warning");
            return false;
        }
    }
    
    // Run the test on startup
    testBackendWithSampleImage();

    // === Style adjustments ===
    // Fix reset button styling
    const styleResetButton = document.getElementById('resetButton');
    if (styleResetButton) {
        styleResetButton.classList.add('btn', 'btn-secondary');
        styleResetButton.innerHTML = '<i class="fas fa-undo"></i> Analyze Another Prescription';
    }

    // === Validate DOM elements ===
    function validateDOMElements() {
        const requiredElements = {
            'fileInput': document.getElementById('fileInput'),
            'uploadArea': document.getElementById('uploadArea'),
            'uploadPrompt': document.getElementById('uploadPrompt'),
            'previewContainer': document.getElementById('previewContainer'),
            'previewImage': document.getElementById('previewImage'),
            'removeImageBtn': document.getElementById('removeImageBtn'),
            'uploadButton': document.getElementById('uploadButton'),
            'loader': document.getElementById('loader'),
            'resultsContainer': document.getElementById('resultsContainer'),
            'medicationsContainer': document.getElementById('medications-container'),
            'resetButton': document.getElementById('resetButton')
        };
        
        let allValid = true;
        for (const [name, element] of Object.entries(requiredElements)) {
            if (!element) {
                console.error(`Required DOM element not found: ${name}`);
                allValid = false;
            }
        }
        
        if (!allValid) {
            console.error('Some required DOM elements are missing. Check HTML structure.');
        } else {
            console.log('All required DOM elements found.');
        }
        
        return allValid;
    }
    
    // Validate DOM elements on startup
    validateDOMElements();

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
        console.log('Upload area clicked, triggering file input');
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
        console.log('File dropped into upload area');
        
        if (e.dataTransfer.files.length) {
            handleFile(e.dataTransfer.files[0]);
        }
    });

    // Handle file selection
    fileInput.addEventListener('change', () => {
        console.log('File selected via input element');
        if (fileInput.files.length) {
            handleFile(fileInput.files[0]);
        }
    });

    // Remove selected image
    removeImageBtn.addEventListener('click', (e) => {
        e.stopPropagation(); // Prevent triggering uploadArea click
        console.log('Remove button clicked, resetting upload');
        resetUpload();
    });

    // Upload and analyze prescription
    const analyzeButton = document.getElementById('analyzeButton');
    if (analyzeButton) {
        analyzeButton.addEventListener('click', async function() {
            console.log('Analyze button clicked');
            
            // Check if we have a file to analyze
            if (!currentFile) {
                console.error('No file selected for analysis');
                showError('Please upload a prescription image first.');
                return;
            }
            
            // If backend connection was not established, try to establish it now
            if (!backendReady) {
                console.log('Backend not ready, attempting to establish connection...');
                showMessage("Establishing connection to AI service...", "info");
                
                // Try to connect to the backend
                const connected = await testBackendWithSampleImage();
                
                if (!connected) {
                    console.log('First connection attempt failed, trying again...');
                    // This explains why it works on second click - the first attempt establishes the connection
                    setTimeout(async () => {
                        const retryConnection = await testBackendWithSampleImage();
                        if (retryConnection) {
                            console.log('Connection established on retry, proceeding with analysis');
                            analyzeImage(currentFile);
                        } else {
                            showError('Could not connect to the analysis service. Please try again.');
                        }
                    }, 500);
                    return;
                }
            }
            
            // Analyze the current file
            analyzeImage(currentFile);
        });
    } else {
        console.error('Analyze button not found');
    }

    // Reset to upload another prescription
    resetButton.addEventListener('click', () => {
        console.log('Reset button clicked');
        resetUpload();
        // Hide the results container when resetting
        resultsContainer.style.display = 'none';
    });

    // Handle the selected file
    function handleFile(file) {
        console.log('Handling file:', file.name, file.type, file.size);
        
        // Check if the file is from an iPhone (HEIC format)
        if (file.name.toLowerCase().endsWith('.heic') || file.name.toLowerCase().endsWith('.heif')) {
            // Our backend now handles HEIC, but let's still show a helpful message
            showMessage('iPhone image detected. Processing HEIC format...', 'info');
            
            // Save the file for analysis
            currentFile = file;
            console.log('HEIC/HEIF file saved as currentFile for analysis');
            
            // Create file preview
            const reader = new FileReader();
            reader.onload = function(e) {
                previewImage.src = e.target.result;
                uploadPrompt.style.display = 'none';
                previewContainer.style.display = 'block';
                uploadButton.disabled = false;
                
                // Show helpful iPhone guidance
                const infoBox = document.createElement('div');
                infoBox.className = 'info-message';
                infoBox.innerHTML = '<i class="fas fa-info-circle"></i> Tip: For best results with iPhone images, use the "Most Compatible" option when taking photos.';
                infoBox.style.marginTop = '10px';
                infoBox.style.padding = '8px';
                infoBox.style.backgroundColor = '#e8f4f8';
                infoBox.style.borderRadius = '4px';
                infoBox.style.fontSize = '0.9em';
                previewContainer.appendChild(infoBox);
                
                console.log('iPhone image preview created successfully');
            };
            reader.onerror = function(e) {
                console.error('Error reading iPhone image file:', e);
                showError('Error reading iPhone image. Please try converting to JPEG or PNG.');
            };
            reader.readAsDataURL(file);
            return;
        }
        
        // Check if file is an accepted image type
        if (!file.type.match('image/jpeg') && !file.type.match('image/png') && !file.type.match('image/jpg')) {
            console.error('Invalid file type:', file.type);
            showError('Please upload a valid image file (JPG, PNG, or HEIC from iPhone).');
            return;
        }
        
        // Check file size (max 10MB)
        if (file.size > 10 * 1024 * 1024) {
            console.error('File too large:', file.size);
            showError('File is too large. Maximum size is 10MB.');
            return;
        }
        
        // Save the file reference - use the original uncompressed file for best quality
        currentFile = file;
        console.log('File saved as currentFile for analysis');
        
        // Create file preview
        const reader = new FileReader();
        reader.onload = function(e) {
            previewImage.src = e.target.result;
            uploadPrompt.style.display = 'none';
            previewContainer.style.display = 'block';
            uploadButton.disabled = false;
            
            // Remove any error message
            const errorMessage = uploadArea.querySelector('.error-message');
            if (errorMessage) {
                errorMessage.remove();
            }
            console.log('File preview created successfully');
        };
        reader.onerror = function(e) {
            console.error('Error reading file:', e);
            showError('Error reading file. Please try again.');
        };
        reader.readAsDataURL(file);
    }

    // Upload and analyze image
    async function analyzeImage(file) {
        console.log('Starting prescription analysis');
        
        // If this is an iPhone HEIC/HEIF image and we know the backend might struggle,
        // offer a client-side pre-conversion option
        if (file.name.toLowerCase().endsWith('.heic') || file.name.toLowerCase().endsWith('.heif')) {
            showMessage("Converting iPhone image format for better compatibility...", "info");
        }
        
        // Show loading state
        const resultArea = document.getElementById('resultArea');
        resultArea.innerHTML = `
            <div class="loading-container">
                <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">Loading...</span>
                </div>
                <p class="mt-3">Analyzing your prescription...</p>
            </div>
        `;
        resultArea.style.display = 'block';
        
        // Create form data for file upload
        const formData = new FormData();
        formData.append('file', file);
        
        try {
            console.log('Sending API request to analyze prescription');
            // Use fetch API to send the file to the backend
            const response = await fetch(`${API_URL}/api/analyze`, {
                method: 'POST',
                body: formData,
            });
            
            console.log('API response received, status:', response.status);
            const data = await response.json();
            
            // Special handling for debug information from our enhanced backend
            if (data.debug_info) {
                console.error('Debug info from server:', data.debug_info);
            }
            
            // Check for errors in the response
            if (data.error) {
                console.error('Error in API response:', data.error);
                
                // Special handling for HEIC format errors
                if (data.error.includes('HEIC') || data.error.includes('iPhone')) {
                    resultArea.innerHTML = `
                        <div class="error-container">
                            <div class="alert alert-warning">
                                <h4><i class="fas fa-exclamation-circle"></i> iPhone Image Format Issue</h4>
                                <p>${data.error}</p>
                                <hr>
                                <p class="mb-0">Please try one of these options:</p>
                                <ol>
                                    <li>On your iPhone, go to Settings > Camera > Formats and select "Most Compatible"</li>
                                    <li>Email the image to yourself and download it on this device</li>
                                    <li>Use a different image in JPG or PNG format</li>
                                </ol>
                            </div>
                        </div>
                    `;
                } else {
                    // Generic error
                    resultArea.innerHTML = `
                        <div class="error-container">
                            <div class="alert alert-danger">
                                <h4><i class="fas fa-exclamation-triangle"></i> Analysis Failed</h4>
                                <p>${data.error}</p>
                                <p>Please try uploading a clearer image or check your connection.</p>
                            </div>
                        </div>
                    `;
                }
                return;
            }
            
            // Handle successful API response
            console.log('Analysis complete, rendering results');
            displayResults(data);
        } catch (error) {
            console.error('Error during API request:', error);
            resultArea.innerHTML = `
                <div class="error-container">
                    <div class="alert alert-danger">
                        <h4><i class="fas fa-exclamation-triangle"></i> Connection Error</h4>
                        <p>Failed to connect to the analysis service. Please check your internet connection and try again.</p>
                        <p class="text-muted small">Technical details: ${error.message}</p>
                    </div>
                </div>
            `;
        }
    }

    // Display medication details
    function displayResults(data) {
        console.log('Displaying medication details:', data);
        const medicationsContainer = document.getElementById('medications-container');
        
        if (!medicationsContainer) {
            console.error('Medications container not found in DOM');
            return;
        }
        
        medicationsContainer.innerHTML = '';

        if (!data.medications || data.medications.length === 0) {
            console.log('No medications to display');
            medicationsContainer.innerHTML = `
                <div class="no-medications">
                    <div class="warning-icon">⚠️</div>
                    <h3>No Medications Detected</h3>
                    <p>We couldn't identify any medications in this image. This could be due to:</p>
                    <ul>
                        <li>The image quality is too low for text recognition</li>
                        <li>The handwriting is difficult to interpret</li>
                        <li>The prescription format is not standard</li>
                    </ul>
                    <p>Try uploading a clearer image or one with better lighting.</p>
                </div>`;

            // Add some style for the no-medications message
            const style = document.createElement('style');
            style.textContent = `
                .no-medications {
                    background-color: #fff8e1;
                    border-left: 4px solid #ffc107;
                    padding: 20px;
                    border-radius: 8px;
                    margin-bottom: 20px;
                    text-align: left;
                }
                .warning-icon {
                    font-size: 28px;
                    margin-bottom: 10px;
                }
                .no-medications h3 {
                    color: #e65100;
                    margin-top: 0;
                    margin-bottom: 15px;
                }
                .no-medications ul {
                    margin-bottom: 15px;
                    padding-left: 20px;
                }
                .no-medications li {
                    margin-bottom: 5px;
                }
            `;
            document.head.appendChild(style);

            // Always show results container, even if no medications found
            if (resultsContainer) {
                resultsContainer.style.display = 'block';
            }
            return;
        }

        console.log(`Displaying ${data.medications.length} medications`);
        data.medications.forEach((medication, index) => {
            console.log(`Processing medication ${index + 1}:`, medication.name);
            // Apply defensive programming to avoid undefined values
            const name = medication.name || 'Unknown Medication';
            const confidence = medication.confidence 
                ? (typeof medication.confidence === 'number' && medication.confidence <= 1) 
                    ? `${(medication.confidence * 100).toFixed(1)}%` // Handle decimal confidence (0-1 range)
                    : `${parseFloat(medication.confidence).toFixed(1)}%` // Handle percentage confidence
                : 'N/A';
            const matchedText = medication.matched_text || medication.extracted_text || 'Text not extracted';
            const description = medication.description || 'Information not available';
            
            // Handle array properties safely with fallbacks
            const drugClass = Array.isArray(medication.drug_class) && medication.drug_class.length > 0 
                ? medication.drug_class.join(', ') 
                : typeof medication.drug_class === 'string' 
                    ? medication.drug_class 
                    : Array.isArray(medication.category) && medication.category.length > 0 
                        ? medication.category.join(', ') 
                        : typeof medication.category === 'string' 
                            ? medication.category 
                            : 'Information not available';
                
            // Handle side effects with more robust checking
            let sideEffectsHtml = '<li>Information not available</li>';
            if (medication.side_effects) {
                if (Array.isArray(medication.side_effects) && medication.side_effects.length > 0) {
                    sideEffectsHtml = medication.side_effects.map(effect => `<li>${effect}</li>`).join('');
                } else if (typeof medication.side_effects === 'string' && medication.side_effects.trim() !== '') {
                    sideEffectsHtml = `<li>${medication.side_effects}</li>`;
                }
            }
                
            // Handle interactions with more robust checking
            let interactionsHtml = '<li>Information not available</li>';
            if (medication.interactions) {
                if (Array.isArray(medication.interactions) && medication.interactions.length > 0) {
                    interactionsHtml = medication.interactions.map(interaction => `<li>${interaction}</li>`).join('');
                } else if (typeof medication.interactions === 'string' && medication.interactions.trim() !== '') {
                    interactionsHtml = `<li>${medication.interactions}</li>`;
                }
            }
                
            // Handle warnings with more robust checking
            let warningsHtml = '<li>Information not available</li>';
            if (medication.warnings) {
                if (Array.isArray(medication.warnings) && medication.warnings.length > 0) {
                    warningsHtml = medication.warnings.map(warning => `<li>${warning}</li>`).join('');
                } else if (typeof medication.warnings === 'string' && medication.warnings.trim() !== '') {
                    warningsHtml = `<li>${medication.warnings}</li>`;
                }
            }
                
            // Handle indications with more robust checking
            let indicationsHtml = '<li>Information not available</li>';
            if (medication.indications) {
                if (Array.isArray(medication.indications) && medication.indications.length > 0) {
                    indicationsHtml = medication.indications.map(indication => `<li>${indication}</li>`).join('');
                } else if (typeof medication.indications === 'string' && medication.indications.trim() !== '') {
                    indicationsHtml = `<li>${medication.indications}</li>`;
                }
            }
            
            // Handle new RxNorm fields and any dosage information
            const strength = medication.strength || 'Not specified';
            const form = medication.form || 'Not specified';
            const detectedDosage = medication.detected_dosage || medication.dosage_info || 'Not detected';

            console.log(`Creating medication card for: ${name}`);
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
                        <ul>${indicationsHtml}</ul>
                    </div>
                    
                    <div class="medication-section">
                        <h4>Side Effects</h4>
                        <ul>${sideEffectsHtml}</ul>
                    </div>
                    
                    <div class="medication-section">
                        <h4>Interactions</h4>
                        <ul>${interactionsHtml}</ul>
                    </div>
                    
                    <div class="medication-section warnings">
                        <h4>Warnings</h4>
                        <ul>${warningsHtml}</ul>
                    </div>
                </div>
            `;
            
            medicationsContainer.appendChild(medicationCard);
            console.log(`Added medication card ${index + 1} to container`);
        });
        
        console.log('Finished displaying all medications');
        resultsContainer.style.display = 'block';
    }

    // Reset upload area
    function resetUpload() {
        console.log('Resetting upload area');
        
        // Clear file references
        currentFile = null;
        fileInput.value = '';
        
        // Reset UI elements
        previewImage.src = '';
        uploadPrompt.style.display = 'block';
        previewContainer.style.display = 'none';
        uploadButton.disabled = true;
        uploadButton.style.display = 'block';
        loader.style.display = 'none';
        
        // Hide results if they're showing
        if (resultsContainer) {
            resultsContainer.style.display = 'none';
        }
        
        // Clear any error messages
        const existingError = uploadArea.querySelector('.error-message');
        if (existingError) {
            existingError.remove();
        }
        
        console.log('Upload area reset complete');
    }

    // Show error message
    function showError(message) {
        // Remove any existing error message
        const oldError = uploadArea.querySelector('.error-message');
        if (oldError) {
            oldError.remove();
        }
        
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.innerHTML = `<i class="fas fa-exclamation-circle"></i> ${message}`;
        errorDiv.style.marginTop = '15px';
        errorDiv.style.color = '#e74c3c';
        errorDiv.style.fontWeight = 'bold';
        uploadArea.appendChild(errorDiv);
        console.error('Error displayed:', message);
    }
    
    // Show information message
    function showMessage(message, type = 'info') {
        // Remove any existing message
        const oldMessage = uploadArea.querySelector(`.${type}-message`);
        if (oldMessage) {
            oldMessage.remove();
        }
        
        const messageDiv = document.createElement('div');
        messageDiv.className = `${type}-message`;
        messageDiv.innerHTML = `<i class="fas fa-info-circle"></i> ${message}`;
        messageDiv.style.marginTop = '15px';
        messageDiv.style.padding = '8px';
        
        if (type === 'info') {
            messageDiv.style.color = '#3498db';
            messageDiv.style.backgroundColor = '#e8f4f8';
        } else if (type === 'success') {
            messageDiv.style.color = '#27ae60';
            messageDiv.style.backgroundColor = '#e8f8ef';
        }
        
        messageDiv.style.borderRadius = '4px';
        uploadArea.appendChild(messageDiv);
        console.log(`${type} message displayed:`, message);
    }
});