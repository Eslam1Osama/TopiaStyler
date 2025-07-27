class FileHandler {
    constructor(app) {
        this.app = app;
        this.supportedTypes = ['html', 'css'];
        this.maxFileSize = 10 * 1024 * 1024; // 10MB
        
        this.init();
    }

    init() {
        this.setupFileInput();
        this.setupDragAndDrop();
    }

    setupFileInput() {
        const fileInput = document.getElementById('fileInput');
        if (!fileInput) return;

        fileInput.addEventListener('change', (e) => {
            this.handleFiles(e.target.files);
        });
    }

    setupDragAndDrop() {
        const uploadArea = document.getElementById('uploadArea');
        if (!uploadArea) return;

        // Prevent default drag behaviors
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            uploadArea.addEventListener(eventName, this.preventDefaults, false);
            document.body.addEventListener(eventName, this.preventDefaults, false);
        });

        // Highlight drop area when item is dragged over it
        ['dragenter', 'dragover'].forEach(eventName => {
            uploadArea.addEventListener(eventName, () => {
                uploadArea.classList.add('dragover');
            });
        });

        ['dragleave', 'drop'].forEach(eventName => {
            uploadArea.addEventListener(eventName, () => {
                uploadArea.classList.remove('dragover');
            });
        });

        // Handle dropped files
        uploadArea.addEventListener('drop', (e) => {
            const files = e.dataTransfer.files;
            this.handleFiles(files);
        });
    }

    preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    async handleFiles(files) {
        if (!files || files.length === 0) {
            this.app.showError('No files selected');
            return;
        }

        // Filter and validate files
        const validFiles = Array.from(files).filter(file => {
            return this.validateFile(file);
        });

        if (validFiles.length === 0) {
            this.app.showError('No valid HTML or CSS files found');
            return;
        }

        // Check if both HTML and CSS files are present
        const htmlFiles = validFiles.filter(file => file.name.toLowerCase().endsWith('.html'));
        const cssFiles = validFiles.filter(file => file.name.toLowerCase().endsWith('.css'));
        
        if (htmlFiles.length === 0) {
            this.app.showError('At least one HTML file is required');
            return;
        }
        // CSS is now optional
        try {
            // Show loading state
            this.showLoadingState();
            
            // Process files
            const processedFiles = await this.processFiles(validFiles);
            
            // Update app state
            this.app.currentFiles.clear();
            processedFiles.forEach((fileData, fileName) => {
                this.app.currentFiles.set(fileName, fileData);
            });

            // Find and set active HTML file
            const htmlFiles = Array.from(this.app.currentFiles.keys())
                .filter(fileName => fileName.endsWith('.html'));
            
            if (htmlFiles.length > 0) {
                this.app.setActiveFile(htmlFiles[0]);
                this.app.showPreview();
                this.app.showSuccess(`Loaded ${htmlFiles.length} HTML file(s)${cssFiles.length > 0 ? ` and ${cssFiles.length} CSS file(s)` : ''} successfully`);
            } else {
                this.app.showError('No HTML files found in the upload');
            }
            
        } catch (error) {
            console.error('Error processing files:', error);
            this.app.showError('Failed to process files');
        } finally {
            this.hideLoadingState();
        }
    }

    validateFile(file) {
        // Check file size
        if (file.size > this.maxFileSize) {
            this.app.showError(`File ${file.name} is too large (max 10MB)`);
            return false;
        }

        // Check file type
        const extension = file.name.split('.').pop().toLowerCase();
        if (!this.supportedTypes.includes(extension)) {
            this.app.showError(`File ${file.name} is not supported (only HTML and CSS files)`);
            return false;
        }

        return true;
    }

    async processFiles(files) {
        const processedFiles = new Map();
        const promises = files.map(file => this.processFile(file));
        
        const results = await Promise.all(promises);
        
        results.forEach((result, index) => {
            if (result) {
                processedFiles.set(files[index].name, result);
            }
        });

        return processedFiles;
    }

    async processFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = (e) => {
                const content = e.target.result;
                const extension = file.name.split('.').pop().toLowerCase();
                
                try {
                    const fileData = {
                        name: file.name,
                        type: extension,
                        originalContent: content,
                        modifiedContent: content,
                        size: file.size,
                        lastModified: new Date(file.lastModified),
                        modifications: new Map() // Track style modifications
                    };

                    // Parse HTML to extract CSS references
                    if (extension === 'html') {
                        fileData.cssReferences = this.extractCSSReferences(content);
                    }

                    resolve(fileData);
                } catch (error) {
                    console.error(`Error processing file ${file.name}:`, error);
                    reject(error);
                }
            };

            reader.onerror = () => {
                reject(new Error(`Failed to read file ${file.name}`));
            };

            reader.readAsText(file);
        });
    }

    extractCSSReferences(htmlContent) {
        const cssRefs = [];
        const linkRegex = /<link[^>]*href\s*=\s*["']([^"']*\.css)["'][^>]*>/gi;
        const styleRegex = /<style[^>]*>([\s\S]*?)<\/style>/gi;
        
        let match;
        
        // Extract external CSS references
        while ((match = linkRegex.exec(htmlContent)) !== null) {
            cssRefs.push({
                type: 'external',
                href: match[1],
                tag: match[0]
            });
        }
        
        // Extract inline styles
        while ((match = styleRegex.exec(htmlContent)) !== null) {
            cssRefs.push({
                type: 'inline',
                content: match[1],
                tag: match[0]
            });
        }
        
        return cssRefs;
    }

    showLoadingState() {
        const uploadArea = document.getElementById('uploadArea');
        if (uploadArea) {
            uploadArea.classList.add('loading');
            
            const placeholder = uploadArea.querySelector('.upload-placeholder');
            if (placeholder) {
                placeholder.innerHTML = `
                    <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                        <circle cx="12" cy="12" r="10"/>
                        <path d="M12 6v6l4-2"/>
                    </svg>
                    <h3>Processing Files...</h3>
                    <p>Please wait while we process your files</p>
                `;
            }
        }
    }

    hideLoadingState() {
        const uploadArea = document.getElementById('uploadArea');
        if (uploadArea) {
            uploadArea.classList.remove('loading');
            
            const placeholder = uploadArea.querySelector('.upload-placeholder');
            if (placeholder) {
                placeholder.innerHTML = `
                    <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                        <polyline points="17,8 12,13 7,8"/>
                        <line x1="12" y1="13" x2="12" y2="3"/>
                    </svg>
                    <h3>Upload Your HTML/CSS Project</h3>
                    <p>Drag and drop your HTML and CSS files here, or click to browse</p>
                    <button class="btn btn-primary">Choose Files</button>
                `;
            }
        }
    }

    // Get file content with modifications applied
    getFileContent(fileName) {
        const fileData = this.app.currentFiles.get(fileName);
        if (!fileData) return null;

        let content = fileData.originalContent;
        
        // Apply modifications if any
        if (fileData.modifications.size > 0) {
            content = this.applyModifications(content, fileData);
        }
        
        return content;
    }

    applyModifications(content, fileData) {
        // Apply style modifications to HTML content
        if (fileData.type === 'html') {
            return this.applyHTMLModifications(content, fileData);
        }
        
        // Apply modifications to CSS content
        if (fileData.type === 'css') {
            return this.applyCSSModifications(content, fileData);
        }
        
        return content;
    }

    applyHTMLModifications(htmlContent, fileData) {
        // Create a temporary DOM to apply modifications
        const parser = new DOMParser();
        const doc = parser.parseFromString(htmlContent, 'text/html');
        
        // Apply each modification
        fileData.modifications.forEach((styles, selector) => {
            const elements = doc.querySelectorAll(selector);
            elements.forEach(element => {
                Object.entries(styles).forEach(([property, value]) => {
                    element.style[property] = value;
                });
            });
        });
        
        return doc.documentElement.outerHTML;
    }

    applyCSSModifications(cssContent, fileData) {
        // Apply CSS modifications (for future CSS editing features)
        return cssContent;
    }

    // Update file with new modifications
    updateFile(fileName, modifications) {
        const fileData = this.app.currentFiles.get(fileName);
        if (!fileData) return;

        // Merge modifications
        Object.entries(modifications).forEach(([selector, styles]) => {
            if (!fileData.modifications.has(selector)) {
                fileData.modifications.set(selector, {});
            }
            
            const existingStyles = fileData.modifications.get(selector);
            Object.assign(existingStyles, styles);
        });

        // Update modified content
        fileData.modifiedContent = this.getFileContent(fileName);
    }

    // Reset all modifications for a file
    resetFile(fileName) {
        const fileData = this.app.currentFiles.get(fileName);
        if (!fileData) return;

        fileData.modifications.clear();
        fileData.modifiedContent = fileData.originalContent;
    }
}