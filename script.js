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
    
    // === Style adjustments ===
    function applyStyleAdjustments() {
        // Fix reset button styling
        const styleResetButton = document.getElementById('resetButton');
        if (styleResetButton) {
            styleResetButton.classList.add('btn', 'btn-secondary');
            styleResetButton.innerHTML = '<i class="fas fa-undo"></i> Analyze Another Prescription';
        }
    }

    // This function runs once the DOM is fully loaded
    // Prevent any other initialization code from running
    // Set up DOM elements first
    const elementMap = validateDOMElements();
    
    if (!elementMap) {
        showGlobalError('Critical app components missing. Please refresh the page or contact support.');
        completeInitialization();
        return;
    }
    
    // Apply any style adjustments needed
    applyStyleAdjustments();
    
    // Then try to connect to backend
    await testBackendConnection();
    
    // Set up event listeners only once with validated elements
    setupEventListeners(elementMap);
    
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

    // Set up event listeners
    function setupEventListeners(elementMap) {
        console.log('Setting up event listeners...');
        
        // Get DOM elements
        const uploadArea = elementMap['uploadArea'].element;
        const fileInput = elementMap['fileInput'].element;
        const uploadPrompt = elementMap['uploadPrompt'].element;
        const previewContainer = elementMap['previewContainer'].element;
        const previewImage = elementMap['previewImage'].element;
        const removeImageBtn = elementMap['removeImageBtn'].element;
        const analyzeButton = elementMap['analyzeButton'].element;
        const loader = elementMap['loader'].element;
        
        // Validate required elements
        if (!uploadArea || !fileInput || !uploadPrompt || !previewContainer || !previewImage || !removeImageBtn) {
            console.error('Some required DOM elements are missing. Check HTML structure.');
            showGlobalError('Application initialization failed: Upload area components missing.');
            return false;
        }
        
        console.log('Analyze button found:', !!analyzeButton);
                
        // Upload area click to trigger file input
        if (uploadArea) {
            uploadArea.addEventListener('click', function() {
                fileInput.click();
            });
            
            // Prevent default behavior for drag events
            ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
                uploadArea.addEventListener(eventName, preventDefaults, false);
            });
            
            // Handle file drop
            uploadArea.addEventListener('drop', handleDrop, false);
            
            function preventDefaults(e) {
                e.preventDefault();
                e.stopPropagation();
            }
            
            function handleDrop(e) {
                const dt = e.dataTransfer;
                const files = dt.files;
                if (files.length) {
                    fileInput.files = files;
                    // Trigger the file input change event
                    const event = new Event('change');
                    fileInput.dispatchEvent(event);
                }
            }
        }
        
        // File input change
        if (fileInput) {
            // IMPORTANT: Only add the event listener once
            fileInput.addEventListener('change', function() {
                if (fileInput.files.length) {
                    handleFile(fileInput.files[0]);
                }
            });
        }
        
        // Remove image button
        if (removeImageBtn) {
            removeImageBtn.addEventListener('click', function(e) {
                e.stopPropagation(); // Prevent triggering the upload area click
                resetUpload();
            });
        }
        
        // Analyze button
        if (analyzeButton) {
            console.log('Adding click event to analyze button');
            
            // Initial button state
            analyzeButton.disabled = !currentFile;
            
            // Clear any existing event listeners first to prevent duplication
            analyzeButton.replaceWith(analyzeButton.cloneNode(true));
            
            // Get fresh reference after replacing
            const freshAnalyzeButton = document.getElementById('analyzeButton');
            
            // Add event listener to fresh button
            freshAnalyzeButton.addEventListener('click', async function(e) {
                // Prevent default behavior and stop propagation
                e.preventDefault();
                e.stopPropagation();
                
                console.log('Analyze button clicked - starting analysis process');
                
                if (!currentFile) {
                    console.error('No file selected for analysis');
                    showGlobalError('Please upload a prescription image first.');
                    return;
                }
                
                // Show the loader while processing
                const loader = document.getElementById('loader');
                if (loader) {
                    loader.style.display = 'block';
                }
                
                // Disable the button to prevent multiple clicks
                freshAnalyzeButton.disabled = true;
                
                // Proceed with analysis
                analyzeImage(currentFile);
            });
            
            console.log('Analyze button event listener attached successfully');
        }
        
        console.log('Event listeners setup complete');
        return true;
    }

    // === DO NOT ADD ANY EVENT LISTENERS HERE ===
    // ALL EVENT LISTENERS ARE NOW SET UP IN setupEventListeners()
    // Track current file

    // Handle file upload process
    function handleFile(file) {
        console.log('Handling file:', file.name, file.type, file.size);
        
        // Get references to required DOM elements
        const fileInput = document.getElementById('fileInput');
        const uploadPrompt = document.getElementById('uploadPrompt');
        const previewContainer = document.getElementById('previewContainer');
        const previewImage = document.getElementById('previewImage');
        const analyzeButton = document.getElementById('analyzeButton');
        
        // Check if we have the necessary DOM elements
        if (!uploadPrompt || !previewContainer || !previewImage || !analyzeButton) {
            console.error('Missing critical DOM elements for file handling');
            showGlobalError('Application error: Missing UI components. Please refresh the page.');
            return;
        }
        
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
        console.log('Resetting upload form');
        
        // Get necessary elements
        const fileInput = document.getElementById('fileInput');
        const uploadPrompt = document.getElementById('uploadPrompt');
        const previewContainer = document.getElementById('previewContainer');
        const previewImage = document.getElementById('previewImage');
        const analyzeButton = document.getElementById('analyzeButton');
        
        // Reset variables
        currentFile = null;
        
        // Reset file input
        if (fileInput) {
            fileInput.value = '';
        }
        
        // Reset UI elements
        if (uploadPrompt) {
            uploadPrompt.style.display = 'block';
        }
        
        if (previewContainer) {
            previewContainer.style.display = 'none';
        }
        
        if (previewImage) {
            previewImage.src = '';
        }
        
        if (analyzeButton) {
            analyzeButton.disabled = true;
        }
        
        // Hide the results container if it exists
        const resultsContainer = document.getElementById('resultsContainer');
        if (resultsContainer) {
            resultsContainer.style.display = 'none';
        }
    }

    // Submit the file for analysis
    async function analyzeImage(file) {
        console.log('Analyzing image:', file.name);
        
        // Get necessary elements - CONSISTENT NAMING CRITICAL HERE
        const loader = document.getElementById('loader');
        const resultsContainer = document.getElementById('resultsContainer');
        const analyzeButton = document.getElementById('analyzeButton'); // Changed from analyzeBtn for consistency
        
        // Check for critical DOM elements
        if (!resultsContainer) {
            console.error('Results container not found');
            showGlobalError('Application error: Results container missing. Please refresh the page.');
            if (loader) loader.style.display = 'none';
            if (analyzeButton) analyzeButton.disabled = false;
            return;
        }
        
        try {
            // Show loading state
            if (loader) {
                loader.style.display = 'block';
            }
            
            // Disable the button during processing
            if (analyzeButton) {
                analyzeButton.disabled = true;
                console.log('Analyze button disabled during processing');
            }
            
            // Create form data
            const formData = new FormData();
            formData.append('file', file);
            
            // Set a timeout to prevent infinite loading
            const timeoutDuration = 30000; // 30 seconds
            let timeoutId = setTimeout(() => {
                console.error('Analysis request timed out');
                if (loader) loader.style.display = 'none';
                if (analyzeButton) analyzeButton.disabled = false;
                showGlobalError('Analysis request timed out. Please try again.');
            }, timeoutDuration);
            
            // Check if the file is a HEIC format (iPhone)
            const isHeicFormat = file.name.toLowerCase().endsWith('.heic') || 
                               file.name.toLowerCase().endsWith('.heif');
            
            if (isHeicFormat) {
                console.log('HEIC/HEIF format detected. This may require special handling on the server.');
                showGlobalMessage('iPhone HEIC format detected. Processing may take longer...', 'info');
            }
            
            console.log(`Sending analysis request to ${API_URL}/api/analyze`);
            
            // Send the request to the backend
            const response = await fetch(`${API_URL}/api/analyze`, {
                method: 'POST',
                body: formData,
            });
            
            // Clear the timeout since we got a response
            clearTimeout(timeoutId); // Clear the timeout
            
            // Hide loading state
            if (loader) {
                loader.style.display = 'none';
            }
            
            // Re-enable the button
            if (analyzeButton) {
                analyzeButton.disabled = false;
                console.log('Analyze button re-enabled after processing');
            }
            
            if (!response.ok) {
                throw new Error(`Server responded with status ${response.status}: ${response.statusText}`);
            }
            
            const data = await response.json();
            console.log('Response data:', data);
            
            // Check if the response contains an error
            if (data.error) {
                console.error('Error from backend:', data.error);
                
                // If it's likely a HEIC format issue, show a specialized message
                if ((data.error.toLowerCase().includes('format') || 
                    data.error.toLowerCase().includes('decode') ||
                    data.error.toLowerCase().includes('heic')) && isHeicFormat) {
                    
                    const medicationsContainer = document.getElementById('medications-container');
                    if (medicationsContainer) {
                        medicationsContainer.innerHTML = `
                            <div class="error-container">
                                <div class="alert alert-warning">
                                    <h4>iPhone Image Format Issue</h4>
                                    <p>We detected a HEIC/HEIF image format from your iPhone. 
                                    While we try to support this format, sometimes conversion fails.</p>
                                    <p>Please try one of these options:</p>
                                    <ol>
                                        <li>Use your iPhone to convert the image to JPEG before uploading</li>
                                        <li>Take a screenshot of your prescription and upload that instead</li>
                                        <li>Use a different device to take and upload the photo</li>
                                    </ol>
                                </div>
                            </div>
                        `;
                    }
                } else {
                    // General error handling
                    const medicationsContainer = document.getElementById('medications-container');
                    if (medicationsContainer) {
                        medicationsContainer.innerHTML = `
                            <div class="error-container">
                                <div class="alert alert-danger">
                                    <h4>Analysis Failed</h4>
                                    <p>${data.error || 'Unable to analyze the prescription image.'}</p>
                                    <p>Please try again with a clearer image or contact support if the issue persists.</p>
                                </div>
                            </div>
                        `;
                    }
                }
                
                // Still show the results container
                resultsContainer.style.display = 'block';
                return;
            }
            
            // If successful, display the results
            displayResults(data);
            
        } catch (error) {
            console.error('Error during analysis:', error);
            
            // Reset UI state
            if (loader) {
                loader.style.display = 'none';
            }
            
            // Re-enable the button
            if (analyzeButton) {
                analyzeButton.disabled = false;
                console.log('Analyze button re-enabled after error');
            }
            
            // Handle specific error types
            let errorMessage = 'Failed to connect to the analysis service.';
            
            if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
                errorMessage = 'Network error: Please check your internet connection and try again.';
            } else if (error.message.includes('timeout')) {
                errorMessage = 'The request took too long to complete. Please try again.';
            } else if (error.message.includes('413')) {
                errorMessage = 'The image file is too large. Please use a smaller image (less than 10MB).';
            } else {
                errorMessage = `Error: ${error.message}`;
            }
            
            // Display the error message
            const medicationsContainer = document.getElementById('medications-container');
            if (medicationsContainer) {
                medicationsContainer.innerHTML = `
                    <div class="error-container">
                        <div class="alert alert-danger">
                            <h4>Analysis Failed</h4>
                            <p>${errorMessage}</p>
                            <p>Please try again or contact support if the issue persists.</p>
                        </div>
                    </div>
                `;
            }
            
            if (resultsContainer) {
                resultsContainer.style.display = 'block';
            }
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
            const resultsContainer = document.getElementById('resultsContainer');
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
        const resultsContainer = document.getElementById('resultsContainer');
        if (resultsContainer) {
            resultsContainer.style.display = 'block';
        }
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