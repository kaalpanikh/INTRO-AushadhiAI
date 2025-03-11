document.addEventListener('DOMContentLoaded', async function() {
    // === Configuration ===
    // Hardcoded API URL - always use the remote endpoint
    const API_URL = 'https://aiapi.nikhilmishra.live'; 
    let backendReady = false;
    let currentFile = null;

    // === Initialize the app ===
    console.log('AushadhiAI initializing...');
    
    // Show loading indicator while app initializes
    const appLoading = document.getElementById('app-loading');
    const appContent = document.getElementById('app-content');
    
    // Function to complete app initialization
    function completeInitialization() {
        if (appLoading) appLoading.style.display = 'none';
        if (appContent) appContent.style.display = 'block';
        console.log('AushadhiAI initialization complete');
    }
    
    // Set up DOM elements first
    const elements = validateDOMElements();
    
    if (!elements) {
        showGlobalError('Critical app components missing. Please refresh the page or contact support.');
        completeInitialization();
        return;
    }
    
    // Then try to connect to backend
    await testBackendConnection();
    
    // Set up event listeners
    setupEventListeners(elements);
    
    // Complete initialization
    completeInitialization();
    
    // === Test backend connection ===
    async function testBackendConnection() {
        console.log('Testing backend connection...');
        try {
            // Simple ping test first
            const pingResponse = await fetch(`${API_URL}/api/ping`, {
                method: 'GET',
                mode: 'cors'
            });
            
            if (pingResponse.ok) {
                console.log('Backend is responsive via ping!');
                backendReady = true;
                return true;
            }
            
            console.log('Ping endpoint not available, trying /api/analyze with empty request');
            
            // If ping fails, make a simple HEAD request to analyze endpoint
            const testResponse = await fetch(`${API_URL}/api/analyze`, {
                method: 'HEAD',
                mode: 'cors'
            });
            
            if (testResponse.ok || testResponse.status === 405) { // 405 = Method Not Allowed is fine
                console.log('Backend API is available');
                backendReady = true;
                return true;
            } else {
                console.warn('Backend API test failed with status:', testResponse.status);
                showGlobalMessage('⚠️ Backend server may be unavailable. Analysis functionality may be limited.', 'warning');
                return false;
            }
        } catch (err) {
            console.error('Error connecting to backend:', err);
            showGlobalMessage('❌ Could not connect to analysis server. Please try again later.', 'error');
            return false;
        }
    }
    
    // Show global error message (for critical issues)
    function showGlobalError(message) {
        console.error('CRITICAL ERROR:', message);
        // Create an error notification at the top of the page
        const errorNotification = document.createElement('div');
        errorNotification.className = 'global-error';
        errorNotification.style.position = 'fixed';
        errorNotification.style.top = '0';
        errorNotification.style.left = '0';
        errorNotification.style.right = '0';
        errorNotification.style.padding = '15px';
        errorNotification.style.backgroundColor = '#f8d7da';
        errorNotification.style.color = '#721c24';
        errorNotification.style.textAlign = 'center';
        errorNotification.style.zIndex = '9999';
        errorNotification.style.boxShadow = '0 2px 10px rgba(0,0,0,0.2)';
        errorNotification.innerHTML = `<strong>Error:</strong> ${message}`;
        document.body.appendChild(errorNotification);
    }
    
    // Show global message (for warnings and info)
    function showGlobalMessage(message, type = 'info') {
        // Create a notification at the top of the page
        const notification = document.createElement('div');
        notification.className = `global-message ${type}`;
        notification.style.position = 'fixed';
        notification.style.top = '0';
        notification.style.left = '0';
        notification.style.right = '0';
        notification.style.padding = '10px';
        notification.style.textAlign = 'center';
        notification.style.zIndex = '9999';
        
        // Set colors based on type
        if (type === 'warning') {
            notification.style.backgroundColor = '#fff3cd';
            notification.style.color = '#856404';
        } else if (type === 'error') {
            notification.style.backgroundColor = '#f8d7da';
            notification.style.color = '#721c24';
        } else {
            notification.style.backgroundColor = '#d1ecf1';
            notification.style.color = '#0c5460';
        }
        
        notification.innerHTML = message;
        document.body.appendChild(notification);
        
        // Auto-hide after 5 seconds
        setTimeout(() => {
            notification.style.opacity = '0';
            notification.style.transition = 'opacity 0.5s ease';
            setTimeout(() => notification.remove(), 500);
        }, 5000);
    }

    // === Style adjustments ===
    // Fix reset button styling
    const styleResetButton = document.getElementById('resetButton');
    if (styleResetButton) {
        styleResetButton.classList.add('btn', 'btn-secondary');
        styleResetButton.innerHTML = '<i class="fas fa-undo"></i> Analyze Another Prescription';
    }

    // === Validate DOM elements ===
    function validateDOMElements() {
        // Create a mapping of expected elements with a more detailed error message for each
        const elementMap = {
            'fileInput': { id: 'fileInput', element: null, critical: true, description: 'File upload input field' },
            'uploadArea': { id: 'uploadArea', element: null, critical: true, description: 'Upload drop area' },
            'uploadPrompt': { id: 'uploadPrompt', element: null, critical: true, description: 'Upload instructions' },
            'previewContainer': { id: 'previewContainer', element: null, critical: true, description: 'Image preview container' },
            'previewImage': { id: 'previewImage', element: null, critical: true, description: 'Image preview element' },
            'removeImageBtn': { id: 'removeImageBtn', element: null, critical: true, description: 'Remove image button' },
            'analyzeButton': { id: 'analyzeButton', element: null, critical: true, description: 'Analyze prescription button' },
            'loader': { id: 'loader', element: null, critical: true, description: 'Loading indicator' },
            'resultsContainer': { id: 'resultsContainer', element: null, critical: false, description: 'Results display container' },
            'medications-container': { id: 'medications-container', element: null, critical: false, description: 'Medications list container' },
            'resetButton': { id: 'resetButton', element: null, critical: false, description: 'Reset button' }
        };
        
        // Retrieve all elements
        let missingElements = [];
        let missingCriticalElements = false;
        
        // Try to get each element and log results
        for (const [key, config] of Object.entries(elementMap)) {
            config.element = document.getElementById(config.id);
            
            if (!config.element) {
                console.error(`Required DOM element not found: ${config.id} (${config.description})`);
                missingElements.push(config.id);
                
                if (config.critical) {
                    missingCriticalElements = true;
                }
            } else {
                console.log(`Found element: ${config.id}`);
            }
        }
        
        // Handle missing elements
        if (missingElements.length > 0) {
            console.error(`Some required DOM elements are missing: ${missingElements.join(', ')}`);
            
            if (missingCriticalElements) {
                // Show user-friendly error for critical missing elements
                showGlobalError(
                    `Application initialization failed: Some critical components could not be found. 
                    Please refresh the page or contact support if the issue persists.`, 
                    'error'
                );
                return false;
            }
        }
        
        // Return the element map for use in application
        return elementMap;
    }
    
    // Validate DOM elements on startup
    const elementMap = validateDOMElements();

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
    const fileInput = elementMap['fileInput'].element;
    const uploadArea = elementMap['uploadArea'].element;
    const uploadPrompt = elementMap['uploadPrompt'].element;
    const previewContainer = elementMap['previewContainer'].element;
    const previewImage = elementMap['previewImage'].element;
    const removeImageBtn = elementMap['removeImageBtn'].element;
    const analyzeButton = elementMap['analyzeButton'].element;
    const loader = elementMap['loader'].element;
    const resultsContainer = elementMap['resultsContainer'].element;
    const medicationsContainer = elementMap['medications-container'].element;
    const resetButton = elementMap['resetButton'].element;

    // Track current file

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

    // Make sure analysis functionality works with no file selected initially
    if (analyzeButton) {
        // Initially disable until user selects a file
        analyzeButton.disabled = currentFile ? false : true;
        
        analyzeButton.addEventListener('click', async function() {
            console.log('Analyze button clicked');
            
            // Check if we have a file to analyze
            if (!currentFile) {
                console.error('No file selected for analysis');
                showGlobalError('Please upload a prescription image first.');
                return;
            }
            
            // Show the loader while processing
            if (loader) {
                loader.style.display = 'block';
            }
            
            // Disable the button during processing
            analyzeButton.disabled = true;
            
            // Analyze the current file
            analyzeImage(currentFile);
        });
    } else {
        console.error('Analyze button not found - check HTML ID');
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
        const isHeicFormat = file.name.toLowerCase().endsWith('.heic') || 
                            file.name.toLowerCase().endsWith('.heif');
        
        if (isHeicFormat) {
            // Display warning about potential HEIC format issues
            showGlobalMessage('iPhone HEIC image detected. Our system will attempt to process it.', 'info');
            
            // Still allow the file to be analyzed (server will try to handle it with special code)
            currentFile = file;
            console.log('HEIC/HEIF file saved as currentFile for analysis');
            
            // Create file preview
            const reader = new FileReader();
            reader.onload = function(e) {
                previewImage.src = e.target.result;
                uploadPrompt.style.display = 'none';
                previewContainer.style.display = 'block';
                
                // Enable the analyze button
                const analyzeBtn = document.getElementById('analyzeButton');
                if (analyzeBtn) {
                    analyzeBtn.disabled = false;
                    console.log('Analyze button enabled for HEIC image');
                } else {
                    console.error('Analyze button not found when trying to enable it for HEIC image');
                }
                
                // Add helpful guidance for iPhone users
                const infoBox = document.createElement('div');
                infoBox.className = 'info-message';
                infoBox.innerHTML = `
                    <i class="fas fa-info-circle"></i> 
                    <strong>iPhone Image Tips:</strong> 
                    <ul style="margin-top: 5px; padding-left: 20px;">
                        <li>If analysis fails, try changing iPhone camera settings to "Most Compatible"</li>
                        <li>Alternatively, email this image to yourself and download as JPG</li>
                    </ul>
                `;
                infoBox.style.marginTop = '10px';
                infoBox.style.padding = '10px';
                infoBox.style.backgroundColor = '#e8f4f8';
                infoBox.style.borderRadius = '4px';
                infoBox.style.fontSize = '0.9em';
                infoBox.style.color = '#0c5460';
                previewContainer.appendChild(infoBox);
                
                console.log('iPhone image preview created with specific guidance');
            };
            reader.onerror = function(e) {
                console.error('Error reading iPhone image file:', e);
                showGlobalError('Error reading iPhone image. Please try converting to JPEG or PNG.');
            };
            reader.readAsDataURL(file);
            return;
        }
        
        // Check if file is an accepted image type
        if (!file.type.match('image/jpeg') && !file.type.match('image/png') && !file.type.match('image/jpg')) {
            console.error('Invalid file type:', file.type);
            showGlobalError('Please upload a valid image file (JPG, PNG, or HEIC/HEIF from iPhone).');
            return;
        }
        
        // Check file size (max 10MB)
        if (file.size > 10 * 1024 * 1024) {
            console.error('File too large:', file.size);
            showGlobalError('File is too large. Maximum size is 10MB.');
            return;
        }
        
        // Save the file reference for analysis
        currentFile = file;
        console.log('File saved as currentFile for analysis');
        
        // Create file preview
        const reader = new FileReader();
        reader.onload = function(e) {
            previewImage.src = e.target.result;
            uploadPrompt.style.display = 'none';
            previewContainer.style.display = 'block';
            
            // Enable the analyze button
            const analyzeBtn = document.getElementById('analyzeButton');
            if (analyzeBtn) {
                analyzeBtn.disabled = false;
                console.log('Analyze button enabled for standard image');
            } else {
                console.error('Analyze button not found when trying to enable it');
            }
            
            // Remove any error message
            const errorMessage = uploadArea.querySelector('.error-message');
            if (errorMessage) {
                errorMessage.remove();
            }
            console.log('File preview created successfully');
        };
        reader.onerror = function(e) {
            console.error('Error reading file:', e);
            showGlobalError('Error reading file. Please try again.');
        };
        reader.readAsDataURL(file);
    }

    // Reset the upload process
    function resetUpload() {
        console.log('Resetting upload process');
        currentFile = null;
        
        // Reset file input
        const fileInput = document.getElementById('fileInput');
        if (fileInput) {
            fileInput.value = '';
        }
        
        // Hide preview, show upload prompt
        const uploadPrompt = document.getElementById('uploadPrompt');
        const previewContainer = document.getElementById('previewContainer');
        if (uploadPrompt) uploadPrompt.style.display = 'block';
        if (previewContainer) previewContainer.style.display = 'none';
        
        // Disable the analyze button
        const analyzeButton = document.getElementById('analyzeButton');
        if (analyzeButton) {
            analyzeButton.disabled = true;
            console.log('Analyze button disabled during reset');
        }
        
        // Hide any existing messages
        const messageElements = document.querySelectorAll('.info-message, .error-message, .warning-message');
        messageElements.forEach(el => el.remove());
        
        console.log('Upload reset complete');
    }

    // Submit the file for analysis
    async function analyzeImage(file) {
        console.log('Starting analysis of file:', file.name, file.type, file.size);
        const resultsContainer = document.getElementById('resultsContainer');
        const medicationsContainer = document.getElementById('medications-container');
        const loader = document.getElementById('loader');
        const analyzeBtn = document.getElementById('analyzeButton');
        
        // Check for critical DOM elements
        if (!resultsContainer) {
            console.error('Results container not found');
            showGlobalError('Application error: Results container missing. Please refresh the page.');
            if (loader) loader.style.display = 'none';
            if (analyzeBtn) analyzeBtn.disabled = false;
            return;
        }
        
        if (!medicationsContainer) {
            console.error('Medications container not found');
            // Create the container if it doesn't exist
            const newContainer = document.createElement('div');
            newContainer.id = 'medications-container';
            newContainer.className = 'medications-container';
            resultsContainer.appendChild(newContainer);
            console.log('Created missing medications container');
        }
        
        try {
            // Show loading state
            if (loader) loader.style.display = 'block';
            if (analyzeBtn) analyzeBtn.disabled = true;
            
            // Create form data
            const formData = new FormData();
            formData.append('file', file);
            
            // Detect iPhone HEIC/HEIF format and warn user about potential issues
            const isHeicFormat = file.name.toLowerCase().endsWith('.heic') || 
                                file.name.toLowerCase().endsWith('.heif');
            
            if (isHeicFormat) {
                console.log('HEIC/HEIF format detected. This may require special handling on the server.');
                showGlobalMessage('iPhone HEIC format detected. Processing may take longer...', 'info');
            }
            
            console.log(`Sending analysis request to ${API_URL}/api/analyze`);
            
            // Make API request with explicit CORS and timeout handling
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
            
            const response = await fetch(`${API_URL}/api/analyze`, {
                method: 'POST',
                body: formData,
                mode: 'cors',
                credentials: 'omit',
                headers: {
                    'Accept': 'application/json'
                },
                signal: controller.signal
            });
            
            clearTimeout(timeoutId); // Clear the timeout
            
            // Hide loading state
            if (loader) loader.style.display = 'none';
            if (analyzeBtn) analyzeBtn.disabled = false;
            
            if (!response.ok) {
                throw new Error(`Server responded with status ${response.status}: ${response.statusText}`);
            }
            
            // Parse and handle the response
            const data = await response.json();
            console.log('Analysis complete, got data:', data);
            
            // Handle API error responses
            if (data.error) {
                console.error('API returned error:', data.error);
                
                // Format-specific error handling for iPhone images
                if ((data.error.toLowerCase().includes('format') || 
                    data.error.toLowerCase().includes('decode') ||
                    data.error.toLowerCase().includes('heic')) && isHeicFormat) {
                    
                    medicationsContainer.innerHTML = `
                        <div class="error-container">
                            <div class="alert alert-warning">
                                <h4><i class="fas fa-exclamation-triangle"></i> iPhone Image Format Issue</h4>
                                <p>Your iPhone photo uses the HEIC format which our system had trouble processing.</p>
                                <p>Please try one of these options:</p>
                                <ol>
                                    <li>Change your iPhone camera settings to "Most Compatible" instead of "High Efficiency"</li>
                                    <li>Convert the image to JPG format before uploading</li>
                                    <li>Email the image to yourself and download it on this device</li>
                                    <li>Use a different image in JPG or PNG format</li>
                                </ol>
                            </div>
                        </div>
                    `;
                } else {
                    // General error handling
                    medicationsContainer.innerHTML = `
                        <div class="error-container">
                            <div class="alert alert-danger">
                                <h4><i class="fas fa-exclamation-triangle"></i> Analysis Failed</h4>
                                <p>${data.error}</p>
                                <p>Please try uploading a clearer image or use a different prescription.</p>
                            </div>
                        </div>
                    `;
                }
                
                // Always show results container even for errors
                resultsContainer.style.display = 'block';
                return;
            }
            
            // Success - display the results
            console.log('Analysis successful, displaying results');
            displayResults(data);
            
        } catch (error) {
            console.error('Error during analysis:', error);
            
            // Reset UI state
            if (loader) loader.style.display = 'none';
            if (analyzeBtn) analyzeBtn.disabled = false;
            
            // Handle specific error types
            let errorMessage = 'Failed to connect to the analysis service.';
            let errorDetails = error.message;
            
            if (error.name === 'AbortError') {
                errorMessage = 'Analysis request timed out after 30 seconds.';
                errorDetails = 'The server took too long to respond. This could be due to a large image or busy server.';
            } else if (error.message.includes('NetworkError')) {
                errorMessage = 'Network error occurred during analysis.';
                errorDetails = 'Please check your internet connection and try again.';
            } else if (error.message.includes('CORS')) {
                errorMessage = 'Cross-origin request blocked.';
                errorDetails = 'Server security settings prevented the analysis. Try a different browser or connection.';
            }
            
            // Display the error message
            medicationsContainer.innerHTML = `
                <div class="error-container">
                    <div class="alert alert-danger">
                        <h4><i class="fas fa-exclamation-triangle"></i> ${errorMessage}</h4>
                        <p>${errorDetails}</p>
                        <p>Please try again or use a different image.</p>
                    </div>
                </div>
            `;
            
            // Show results container
            resultsContainer.style.display = 'block';
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

    // Set up event listeners
    function setupEventListeners(elements) {
        console.log('Setting up event listeners...');
        
        // Get DOM elements
        const uploadArea = elements['uploadArea'].element;
        const fileInput = elements['fileInput'].element;
        const uploadPrompt = elements['uploadPrompt'].element;
        const previewContainer = elements['previewContainer'].element;
        const previewImage = elements['previewImage'].element;
        const removeImageBtn = elements['removeImageBtn'].element;
        const analyzeButton = elements['analyzeButton'].element;
        const loader = elements['loader'].element;
        
        // Validate required elements
        if (!uploadArea || !fileInput || !uploadPrompt || !previewContainer || !previewImage || !removeImageBtn) {
            console.error('Critical DOM elements missing. Application may not function correctly.');
            return;
        }
        
        // Log found element status
        console.log('Upload area found:', !!uploadArea);
        console.log('File input found:', !!fileInput);
        console.log('Analyze button found:', !!analyzeButton);
        
        // Handle upload area click
        uploadArea.addEventListener('click', () => {
            console.log('Upload area clicked');
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
            console.log('File dropped');
            
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
        
        // Analyze button setup
        if (analyzeButton) {
            console.log('Setting up analyze button click handler');
            // Initially disable until user selects a file
            analyzeButton.disabled = currentFile ? false : true;
            
            analyzeButton.addEventListener('click', async function() {
                console.log('Analyze button clicked');
                
                // Check if we have a file to analyze
                if (!currentFile) {
                    console.error('No file selected for analysis');
                    showError('Please upload a prescription image first.');
                    return;
                }
                
                // Show the loader while processing
                if (loader) {
                    loader.style.display = 'block';
                }
                
                // Disable the button during processing
                analyzeButton.disabled = true;
                
                // Check for iPhone HEIC/HEIF format
                const isHeicFormat = currentFile.name.toLowerCase().endsWith('.heic') || 
                                   currentFile.name.toLowerCase().endsWith('.heif');
                
                if (isHeicFormat) {
                    showMessage("Processing iPhone HEIC format image...", "info");
                }
                
                // Analyze the current file
                analyzeImage(currentFile);
            });
            
            console.log('Analyze button handler configured successfully');
        } else {
            console.error('Analyze button not found - check HTML ID');
        }
    }
});