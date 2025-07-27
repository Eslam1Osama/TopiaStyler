class TopiaStylerApp {
    constructor() {
        this.fileHandler = null;
        this.renderer = null;
        this.editor = null;
        this.exporter = null;
        this.currentFiles = new Map();
        this.activeFile = null;
        this.selectedElement = null;
        this.isInitialized = false;
        this.deviceMode = 'full'; // Track current device mode
        
        this.init();
    }

    async init() {
        const preloaderMinTime = 1200; // ms
        const preloaderStart = Date.now();
        try {
            // Initialize all modules
            this.fileHandler = new FileHandler(this);
            this.renderer = new Renderer(this);
            this.editor = new Editor(this);
            this.exporter = new Exporter(this);

            // Initialize platform navigation
            this.initializePlatformNavigation();

            // Setup event listeners
            this.setupEventListeners();
            
            // Initialize UI
            this.initializeUI();
            // Initialize theme toggle (fix for dark/light mode button)
            this.initializeThemeToggle();
            this.isInitialized = true;
            console.log('TopiaStyler initialized successfully');
            // Hide the preloader when app is ready, but ensure minimum display time
            if (window.hidePlatformPreloader) {
                const elapsed = Date.now() - preloaderStart;
                const delay = Math.max(0, preloaderMinTime - elapsed);
                setTimeout(() => window.hidePlatformPreloader(), delay);
            }
        } catch (error) {
            console.error('Failed to initialize TopiaStyler:', error);
            this.showError('Failed to initialize application');
        }
    }

    setupEventListeners() {
        // Upload button
        const uploadBtn = document.getElementById('uploadBtn');
        // Remove old file input logic
        // const fileInput = document.getElementById('fileInput');
        // uploadBtn?.addEventListener('click', () => { fileInput?.click(); });
        uploadBtn?.addEventListener('click', () => {
            this.openUploadModal();
        });
        // Also trigger modal from 'Choose Files' button in upload placeholder
        const chooseFilesBtn = document.querySelector('.upload-placeholder .btn');
        chooseFilesBtn?.addEventListener('click', (e) => {
            e.preventDefault();
            this.openUploadModal();
        });

        // Download button
        const downloadBtn = document.getElementById('downloadBtn');
        downloadBtn?.addEventListener('click', () => {
            this.exportProject();
        });

        // Sidebar toggle
        const sidebarToggle = document.getElementById('sidebarToggle');
        const showSidebarBtn = document.getElementById('showSidebarBtn');
        const sidebar = document.getElementById('sidebar');
        let userToggledSidebar = false;

        // Toggle all style groups logic
        const toggleAllGroupsBtn = document.getElementById('toggleAllGroupsBtn');
        const toggleAllGroupsIcon = document.getElementById('toggleAllGroupsIcon');
        this._allGroupsExpandedRef = false;
        if (toggleAllGroupsBtn) {
            toggleAllGroupsBtn.addEventListener('click', () => {
                const groups = document.querySelectorAll('.style-group');
                this._allGroupsExpandedRef = !this._allGroupsExpandedRef;
                if (this.editor) this.editor.allGroupsExpanded = this._allGroupsExpandedRef;
                groups.forEach(group => {
                    const toggle = group.querySelector('.style-group-toggle');
                    const controls = group.querySelector('.style-controls');
                    if (toggle && controls) {
                        const sectionName = group.dataset.group;
                        
                        if (this._allGroupsExpandedRef) {
                            toggle.setAttribute('aria-expanded', 'true');
                            group.setAttribute('aria-collapsed', 'false');
                            controls.style.maxHeight = controls.scrollHeight + 'px';
                            controls.style.opacity = '1';
                            // Update user's preferred state
                            if (this.editor) {
                                this.editor.userSectionStates.set(sectionName, true);
                            }
                        } else {
                            toggle.setAttribute('aria-expanded', 'false');
                            group.setAttribute('aria-collapsed', 'true');
                            controls.style.maxHeight = '0';
                            controls.style.opacity = '0';
                            // Update user's preferred state
                            if (this.editor) {
                                this.editor.userSectionStates.set(sectionName, false);
                            }
                        }
                    }
                });
                // Update button text and icon
                toggleAllGroupsBtn.setAttribute('aria-expanded', this._allGroupsExpandedRef ? 'true' : 'false');
                toggleAllGroupsBtn.querySelector('span').textContent = this._allGroupsExpandedRef ? 'Collapse All' : 'Expand All';
            });
        }

        // Centralized function for toggle button visibility
        function updateSidebarBtnVisibility() {
            if (sidebar?.classList.contains('collapsed')) {
                showSidebarBtn.style.display = 'flex';
                showSidebarBtn.style.zIndex = '3000';
            } else {
                showSidebarBtn.style.display = 'none';
            }
        }
        // Expose for use in other methods
        this.updateSidebarBtnVisibility = updateSidebarBtnVisibility;

        sidebarToggle?.addEventListener('click', () => {
            this.toggleSidebar();
            userToggledSidebar = true;
            updateSidebarBtnVisibility();
            setTimeout(() => sidebar.focus(), 350);
        });
        
        showSidebarBtn?.addEventListener('click', () => {
            sidebar?.classList.remove('collapsed');
            userToggledSidebar = true;
            updateSidebarBtnVisibility();
            setTimeout(() => sidebarToggle.focus(), 350);
        });

        // Refresh button
        const refreshBtn = document.getElementById('refreshBtn');
        refreshBtn?.addEventListener('click', () => {
            if (this.activeFile && this.fileHandler) {
                this.fileHandler.resetFile(this.activeFile);
                if (this.renderer) {
                    this.renderer.renderFile(this.activeFile);
                }
                this.showSuccess('Preview reset to original uploaded state.');
            }
        });

        // Upload area click
        const uploadArea = document.getElementById('uploadArea');
        uploadArea?.addEventListener('click', () => {
            // fileInput?.click(); // This line is removed as per the new_code
        });

        // Window resize (for other layout logic)
        window.addEventListener('resize', () => {
            this.handleResize();
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                if (sidebar && !sidebar.classList.contains('collapsed')) {
                    sidebar.classList.add('collapsed');
                    updateSidebarBtnVisibility();
                }
            }
            this.handleKeyboard(e);
        });

        // Modal logic
        this.setupUploadModal();
    }

    setupUploadModal() {
        const modal = document.getElementById('uploadModal');
        const closeBtn = document.getElementById('closeUploadModal');
        const form = document.getElementById('modalUploadForm');
        const htmlInput = document.getElementById('modalHtmlInput');
        const cssInput = document.getElementById('modalCssInput');
        const htmlDropzone = document.getElementById('modalHtmlDropzone');
        const cssDropzone = document.getElementById('modalCssDropzone');
        const uploadBtn = form.querySelector('.modal-upload-btn');
        // Error message element
        let errorMsg = form.querySelector('.modal-upload-error');
        if (!errorMsg) {
            errorMsg = document.createElement('div');
            errorMsg.className = 'modal-upload-error';
            errorMsg.style.color = '#ef4444';
            errorMsg.style.fontSize = '0.97rem';
            errorMsg.style.margin = '0.5rem 0 0.2rem 0';
            errorMsg.style.minHeight = '1.2em';
            form.insertBefore(errorMsg, form.firstChild.nextSibling); // after h2
        }
        // Validation logic
        function validateFiles(showError = false) {
            let valid = true;
            let message = '';
            // HTML file validation
            if (!htmlInput.files.length) {
                valid = false;
                message = 'Please select an HTML file.';
            } else {
                const htmlFile = htmlInput.files[0];
                if (!/\.html?$/i.test(htmlFile.name)) {
                    valid = false;
                    message = 'Selected file for HTML must have .html extension.';
                }
            }
            // CSS file validation (if present)
            if (cssInput.files.length) {
                const cssFile = cssInput.files[0];
                if (!/\.css$/i.test(cssFile.name)) {
                    valid = false;
                    message = 'Selected file for CSS must have .css extension.';
                }
            }
            // Show/hide error
            if (showError && !valid) {
                errorMsg.textContent = message;
            } else {
                errorMsg.textContent = '';
            }
            // Button state
            uploadBtn.disabled = !valid;
            return valid;
        }
        // Real-time validation
        htmlInput.addEventListener('change', () => validateFiles(true));
        cssInput.addEventListener('change', () => validateFiles(true));
        // Drag & drop validation
        htmlDropzone.addEventListener('drop', () => setTimeout(() => validateFiles(true), 10));
        cssDropzone.addEventListener('drop', () => setTimeout(() => validateFiles(true), 10));
        // Initial state
        uploadBtn.disabled = true;
        // Open/close helpers
        this.openUploadModal = () => {
            modal.style.display = 'flex';
            setTimeout(() => htmlInput.focus(), 100);
            document.body.style.overflow = 'hidden';
            htmlInput.value = '';
            cssInput.value = '';
            errorMsg.textContent = '';
            uploadBtn.disabled = true;
        };
        this.closeUploadModal = () => {
            modal.style.display = 'none';
            document.body.style.overflow = '';
        };
        closeBtn?.addEventListener('click', this.closeUploadModal);
        modal?.addEventListener('mousedown', (e) => {
            if (e.target === modal) this.closeUploadModal();
        });
        document.addEventListener('keydown', (e) => {
            if (modal.style.display === 'flex' && e.key === 'Escape') this.closeUploadModal();
        });
        // Drag & drop for HTML
        htmlDropzone.addEventListener('dragover', (e) => {
            e.preventDefault(); htmlDropzone.classList.add('dragover');
        });
        htmlDropzone.addEventListener('dragleave', () => htmlDropzone.classList.remove('dragover'));
        htmlDropzone.addEventListener('drop', (e) => {
            e.preventDefault(); htmlDropzone.classList.remove('dragover');
            if (e.dataTransfer.files.length) htmlInput.files = e.dataTransfer.files;
            validateFiles(true);
        });
        // Drag & drop for CSS
        cssDropzone.addEventListener('dragover', (e) => {
            e.preventDefault(); cssDropzone.classList.add('dragover');
        });
        cssDropzone.addEventListener('dragleave', () => cssDropzone.classList.remove('dragover'));
        cssDropzone.addEventListener('drop', (e) => {
            e.preventDefault(); cssDropzone.classList.remove('dragover');
            if (e.dataTransfer.files.length) cssInput.files = e.dataTransfer.files;
            validateFiles(true);
        });
        // Form submit
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            if (!validateFiles(true)) return;
            
            // Reset style editor to initial state before processing new files
            this.resetStyleEditor();
            
            // Compose FileList for handler
            const files = [htmlInput.files[0]];
            if (cssInput.files.length) files.push(cssInput.files[0]);
            this.fileHandler.handleFiles(files);
            this.closeUploadModal();
        });

        // --- Enhanced file upload display logic for modal ---
        // Declare all upload modal variables only once
        const htmlFileName = document.getElementById('modalHtmlFileName');
        const htmlChangeBtn = document.getElementById('modalHtmlChangeBtn');
        const htmlClearBtn = document.getElementById('modalHtmlClearBtn');
        const htmlFileDisplay = document.getElementById('modalHtmlFileDisplay');
        const cssFileName = document.getElementById('modalCssFileName');
        const cssChangeBtn = document.getElementById('modalCssChangeBtn');
        const cssClearBtn = document.getElementById('modalCssClearBtn');
        const cssFileDisplay = document.getElementById('modalCssFileDisplay');
        const modalUploadBtn = document.querySelector('.modal-upload-btn');
        function updateFileDisplay(input, fileNameSpan, clearBtn) {
          if (input.files && input.files.length > 0) {
            fileNameSpan.textContent = input.files[0].name;
            clearBtn.style.display = '';
          } else {
            fileNameSpan.textContent = 'No file selected';
            clearBtn.style.display = 'none';
          }
        }
        function updateModalUploadBtnState() {
          // Enable modal upload button only if HTML file is selected
          if (htmlInput.files && htmlInput.files.length > 0) {
            modalUploadBtn.disabled = false;
          } else {
            modalUploadBtn.disabled = true;
          }
        }
        htmlInput.addEventListener('change', () => {
          updateFileDisplay(htmlInput, htmlFileName, htmlClearBtn);
          updateModalUploadBtnState();
        });
        htmlChangeBtn.addEventListener('click', () => {
          htmlInput.click();
        });
        htmlClearBtn.addEventListener('click', () => {
          htmlInput.value = '';
          updateFileDisplay(htmlInput, htmlFileName, htmlClearBtn);
          updateModalUploadBtnState();
        });
        htmlFileDisplay.addEventListener('click', (e) => {
          if (e.target === htmlFileDisplay) htmlInput.click();
        });
        cssInput.addEventListener('change', () => {
          updateFileDisplay(cssInput, cssFileName, cssClearBtn);
        });
        cssChangeBtn.addEventListener('click', () => {
          cssInput.click();
        });
        cssClearBtn.addEventListener('click', () => {
          cssInput.value = '';
          updateFileDisplay(cssInput, cssFileName, cssClearBtn);
        });
        cssFileDisplay.addEventListener('click', (e) => {
          if (e.target === cssFileDisplay) cssInput.click();
        });
        // --- Sync uploadBtn state after upload ---
        function enableUploadBtn() {
          if (uploadBtn) uploadBtn.disabled = false;
        }
        function disableUploadBtn() {
          if (uploadBtn) uploadBtn.disabled = true;
        }
        // Enable upload button after successful upload
        this.app && this.app.showPreview && (this.app.showPreview = ((orig => function() {
          enableUploadBtn();
          return orig.apply(this, arguments);
        })(this.app.showPreview)));
        // When modal opens, always clear file fields and reset display
        document.getElementById('uploadBtn').addEventListener('click', () => {
          htmlInput.value = '';
          cssInput.value = '';
          updateFileDisplay(htmlInput, htmlFileName, htmlClearBtn);
          updateFileDisplay(cssInput, cssFileName, cssClearBtn);
          updateModalUploadBtnState();
        });
        // Also, when the modal is shown (e.g., after a previous upload), check the HTML field and enable the button if needed
        const uploadModal = document.getElementById('uploadModal');
        const observer = new MutationObserver(() => {
          if (uploadModal.style.display !== 'none') {
            updateModalUploadBtnState();
          }
        });
        observer.observe(uploadModal, { attributes: true, attributeFilter: ['style'] });
        // When modal closes, reset modal upload button and file fields
        document.getElementById('closeUploadModal').addEventListener('click', () => {
          htmlInput.value = '';
          cssInput.value = '';
          updateFileDisplay(htmlInput, htmlFileName, htmlClearBtn);
          updateFileDisplay(cssInput, cssFileName, cssClearBtn);
          updateModalUploadBtnState();
        });
        // Disable uploadBtn while modal is open (user is picking new files)
        document.getElementById('uploadBtn').addEventListener('click', () => {
          disableUploadBtn();
        });
        // Enable uploadBtn after upload completes (in modalUploadForm submit handler)
        document.getElementById('modalUploadForm').addEventListener('submit', () => {
          setTimeout(enableUploadBtn, 500); // allow for async processing
        });
        // Initial state
        disableUploadBtn();
        updateModalUploadBtnState();
    }

    initializeUI() {
        // Ensure sidebar toggle is visible on initial load
        const sidebarToggle = document.getElementById('sidebarToggle');
        if (sidebarToggle) {
            sidebarToggle.style.display = '';
            // Ensure its container is also visible and properly styled
            const container = sidebarToggle.parentElement;
            if (container) {
                container.style.display = 'flex';
            }
        }
        // Set initial sidebar state based on screen size
        this.handleResize();
        // Ensure sidebar button visibility matches initial sidebar state
        if (this.updateSidebarBtnVisibility) this.updateSidebarBtnVisibility();
        // Initialize tooltips or other UI elements
        this.initializeTooltips();
        // --- Device preview logic ---
        const deviceGroup = document.getElementById('previewDeviceGroup');
        const deviceBtns = deviceGroup.querySelectorAll('.device-btn');
        const iframe = document.getElementById('previewFrame');
        deviceGroup.addEventListener('click', (e) => {
            const btn = e.target.closest('.device-btn');
            if (!btn) return;
            deviceBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            const device = btn.getAttribute('data-device');
            if (device === 'full' || device === 'reset') {
                iframe.classList.remove('device-tablet', 'device-mobile');
                iframe.classList.add('device-full');
            } else if (device === 'tablet') {
                iframe.classList.remove('device-full', 'device-mobile');
                iframe.classList.add('device-tablet');
            } else if (device === 'mobile') {
                iframe.classList.remove('device-full', 'device-tablet');
                iframe.classList.add('device-mobile');
            }
        });
        // Set default
        iframe.classList.add('device-full');
        // --- Preview toggle logic ---
        const livePreviewBtn = document.getElementById('livePreviewBtn');
        const codePreviewBtn = document.getElementById('codePreviewBtn');
        const livePreviewArea = document.getElementById('livePreviewArea');
        const codePreviewArea = document.getElementById('codePreviewArea');
        const codeBlock = document.getElementById('codeBlock');
        const codeTabs = document.getElementById('codeTabs');
        const copyCodeBtn = document.getElementById('copyCodeBtn');
        let currentCodeType = 'html';
        let lastCodeLines = { html: [], css: [] };
        let animTimeouts = [];
        function escapeHTML(str) {
            return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        }
        function renderCode(type) {
            const htmlFiles = Array.from(this.currentFiles.keys()).filter(f => f.endsWith('.html'));
            const cssFiles = Array.from(this.currentFiles.keys()).filter(f => f.endsWith('.css'));
            let code = '';
            if (type === 'html' && htmlFiles.length > 0) {
                code = this.fileHandler ? this.fileHandler.getFileContent(htmlFiles[0]) : this.currentFiles.get(htmlFiles[0]).originalContent;
            } else if (type === 'css' && cssFiles.length > 0) {
                code = this.fileHandler ? this.fileHandler.getFileContent(cssFiles[0]) : this.currentFiles.get(cssFiles[0]).originalContent;
            }
            const lines = code.split('\n');
            let html = '';
            for (let i = 0; i < lines.length; i++) {
                html += `<span>${escapeHTML(lines[i])}</span>\n`;
            }
            codeBlock.innerHTML = `<code>${html}</code>`;
            lastCodeLines[type] = lines;
        }
        // --- Copy code logic ---
        if (copyCodeBtn) {
            copyCodeBtn.addEventListener('click', () => {
                // Get plain text of current code
                const code = lastCodeLines[currentCodeType].join('\n');
                navigator.clipboard.writeText(code).then(() => {
                    // Show feedback (tooltip or text change)
                    copyCodeBtn.classList.add('copied');
                    const oldText = copyCodeBtn.querySelector('span').textContent;
                    copyCodeBtn.querySelector('span').textContent = 'Copied!';
                    setTimeout(() => {
                        copyCodeBtn.classList.remove('copied');
                        copyCodeBtn.querySelector('span').textContent = oldText;
                    }, 1200);
                });
            });
        }
        function updateCodeTabs() {
            const htmlFiles = Array.from(this.currentFiles.keys()).filter(f => f.endsWith('.html'));
            const cssFiles = Array.from(this.currentFiles.keys()).filter(f => f.endsWith('.css'));
            codeTabs.innerHTML = '';
            let tabs = [];
            if (htmlFiles.length > 0) {
                tabs.push({ type: 'html', label: 'HTML' });
            }
            if (cssFiles.length > 0) {
                tabs.push({ type: 'css', label: 'CSS' });
            }
            if (tabs.length > 1) {
                codeTabs.style.display = '';
                tabs.forEach(tab => {
                    const btn = document.createElement('button');
                    btn.className = 'code-tab' + (tab.type === currentCodeType ? ' active' : '');
                    btn.textContent = tab.label;
                    btn.onclick = () => {
                        currentCodeType = tab.type;
                        renderCode.call(this, currentCodeType);
                        updateCodeTabs.call(this);
                    };
                    codeTabs.appendChild(btn);
                });
            } else {
                codeTabs.style.display = 'none';
            }
        }
        livePreviewBtn.addEventListener('click', () => {
            livePreviewBtn.classList.add('active');
            codePreviewBtn.classList.remove('active');
            livePreviewArea.style.display = '';
            codePreviewArea.style.display = 'none';
        });
        codePreviewBtn.addEventListener('click', () => {
            codePreviewBtn.classList.add('active');
            livePreviewBtn.classList.remove('active');
            livePreviewArea.style.display = 'none';
            codePreviewArea.style.display = '';
            updateCodeTabs.call(this);
            renderCode.call(this, currentCodeType);
        });
        // Show code preview if user clicks code tab after upload
        this.showCodePreview = () => {
            codePreviewBtn.click();
        };
        // Update code preview after upload
        this.updateCodePreview = () => {
            if (codePreviewArea.style.display !== 'none') {
                updateCodeTabs.call(this);
                renderCode.call(this, currentCodeType);
            }
        };
        // Call updateCodePreview after upload
        const origShowPreview = this.showPreview;
        this.showPreview = function() {
            origShowPreview.apply(this, arguments);
            this.updateCodePreview();
        };
        // --- Sync code preview with live updates ---
        // Listen for style/text changes and update code preview in real time
        const origUpdateElementStyles = this.renderer.updateElementStyles.bind(this.renderer);
        this.renderer.updateElementStyles = function(selector, styles) {
            origUpdateElementStyles(selector, styles);
            this.app.updateCodePreview();
        }.bind({ app: this });
        const origUpdateElementText = this.renderer.updateElementText.bind(this.renderer);
        this.renderer.updateElementText = function(selector, text) {
            origUpdateElementText(selector, text);
            this.app.updateCodePreview();
        }.bind({ app: this });
        // Show/hide expand/collapse all button with style editor visibility
        const toggleAllGroupsBtnContainer = document.getElementById('toggleAllGroupsBtnContainer');
        const styleGroups = document.getElementById('styleGroups');
        // Utility to show/hide the button based on styleGroups visibility
        function updateToggleAllGroupsBtnVisibility() {
            if (styleGroups && toggleAllGroupsBtnContainer) {
                if (styleGroups.style.display !== 'none') {
                    toggleAllGroupsBtnContainer.style.display = 'flex';
                } else {
                    toggleAllGroupsBtnContainer.style.display = 'none';
                }
            }
        }
        // Patch updateSelectedElement to show the button when a selection is made
        if (window.Editor && Editor.prototype.updateSelectedElement) {
            const origUpdateSelectedElement = Editor.prototype.updateSelectedElement;
            Editor.prototype.updateSelectedElement = function(...args) {
                origUpdateSelectedElement.apply(this, args);
                updateToggleAllGroupsBtnVisibility();
            };
        } else {
            // Fallback: observe styleGroups display changes
            const observer = new MutationObserver(updateToggleAllGroupsBtnVisibility);
            if (styleGroups) {
                observer.observe(styleGroups, { attributes: true, attributeFilter: ['style'] });
            }
        }
        // Hide button on load
        updateToggleAllGroupsBtnVisibility();
    }

    initializePlatformNavigation() {
        // Initialize platform navigation manager
        if (window.PlatformNavigationManager) {
            this.platformNavigation = new PlatformNavigationManager();
            this.platformNavigation.init({
                insertAfter: '.nav-right',
                showCurrentApp: true,
                enableDropdown: true
            });
            
            console.log('Platform navigation initialized');
        } else {
            console.warn('PlatformNavigationManager not available');
        }
    }

    initializeThemeToggle() {
        const btn = document.getElementById('themeToggleBtn');
        const sunIcon = btn?.querySelector('.theme-icon-sun');
        const moonIcon = btn?.querySelector('.theme-icon-moon');
        const root = document.body;
        // Load saved theme
        const saved = localStorage.getItem('easoftopia-theme');
        if (saved === 'dark') {
            root.classList.add('dark-mode');
            sunIcon.style.display = '';
            moonIcon.style.display = 'none';
        } else {
            root.classList.remove('dark-mode');
            sunIcon.style.display = 'none';
            moonIcon.style.display = '';
        }
        btn?.addEventListener('click', () => {
            const isDark = root.classList.toggle('dark-mode');
            // Animate icons
            if (isDark) {
                moonIcon.style.opacity = 0;
                setTimeout(() => {
                    moonIcon.style.display = 'none';
                    sunIcon.style.display = '';
                    setTimeout(() => { sunIcon.style.opacity = 1; }, 10);
                }, 200);
            } else {
                sunIcon.style.opacity = 0;
                setTimeout(() => {
                    sunIcon.style.display = 'none';
                    moonIcon.style.display = '';
                    setTimeout(() => { moonIcon.style.opacity = 1; }, 10);
                }, 200);
            }
            localStorage.setItem('easoftopia-theme', isDark ? 'dark' : 'light');
        });
    }

    handleResize() {
        const sidebar = document.getElementById('sidebar');
        if (window.innerWidth <= 1024) {
            sidebar?.classList.add('collapsed');
        } else {
            sidebar?.classList.remove('collapsed');
        }
        // Always update button visibility after resize
        if (this.updateSidebarBtnVisibility) this.updateSidebarBtnVisibility();
    }

    handleKeyboard(e) {
        // Ctrl/Cmd + O: Open files
        if ((e.ctrlKey || e.metaKey) && e.key === 'o') {
            e.preventDefault();
            // document.getElementById('fileInput')?.click(); // This line is removed as per the new_code
        }
        
        // Ctrl/Cmd + S: Save/Export
        if ((e.ctrlKey || e.metaKey) && e.key === 's') {
            e.preventDefault();
            this.exportProject();
        }
        
        // Escape: Deselect element
        if (e.key === 'Escape') {
            this.editor?.deselectElement();
        }
    }

    toggleSidebar() {
        const sidebar = document.getElementById('sidebar');
        sidebar?.classList.toggle('collapsed');
        // Always update button visibility after toggle
        if (this.updateSidebarBtnVisibility) this.updateSidebarBtnVisibility();
        
        // Update toggle button icon
        const toggle = document.getElementById('sidebarToggle');
        const icon = toggle?.querySelector('svg path');
        if (icon) {
            const isCollapsed = sidebar?.classList.contains('collapsed');
            icon.setAttribute('d', isCollapsed ? 
                'M5 12h14M12 5l7 7-7 7' : 
                'M19 12H5M12 19l-7-7 7-7'
            );
        }
    }

    refreshPreview() {
        if (this.activeFile && this.renderer) {
            this.renderer.renderFile(this.activeFile);
        }
    }

    async exportProject() {
        if (!this.exporter || this.currentFiles.size === 0) {
            this.showError('No files to export');
            return;
        }

        try {
            const button = document.getElementById('downloadBtn');
            const originalText = button?.innerHTML;
            
            if (button) {
                button.innerHTML = `
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="12" cy="12" r="10"/>
                        <path d="M12 6v6l4-2"/>
                    </svg>
                    Processing...
                `;
                button.disabled = true;
            }

            await this.exporter.exportProject();
            
            if (button && originalText) {
                button.innerHTML = originalText;
                button.disabled = false;
            }
        } catch (error) {
            console.error('Export failed:', error);
            this.showError('Failed to export project');
            
            const button = document.getElementById('downloadBtn');
            if (button) {
                button.innerHTML = `
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                        <polyline points="17,8 12,13 7,8"/>
                        <line x1="12" y1="13" x2="12" y2="3"/>
                    </svg>
                    Download Project
                `;
                button.disabled = false;
            }
        }
    }

    setActiveFile(fileName) {
        this.activeFile = fileName;
        this.updateFileTabs();
        // Update active file name in header
        const nameSpan = document.getElementById('activeFileName');
        if (nameSpan) nameSpan.textContent = fileName || '';
        if (this.renderer) {
            this.renderer.renderFile(fileName);
        }
        // Re-apply device mode to iframe after file switch
        // This logic is now handled by initializeUI's deviceGroup click listener
    }

    updateFileTabs() {
        const container = document.getElementById('fileTabs');
        if (!container) return;

        container.innerHTML = '';
        
        for (const [fileName, fileData] of this.currentFiles) {
            if (fileData.type === 'html') {
                const tab = document.createElement('div');
                tab.className = `file-tab ${fileName === this.activeFile ? 'active' : ''}`;
                tab.textContent = fileName;
                tab.addEventListener('click', () => {
                    this.setActiveFile(fileName);
                });
                container.appendChild(tab);
            }
        }
        // Update active file name in header
        const nameSpan = document.getElementById('activeFileName');
        if (nameSpan) nameSpan.textContent = this.activeFile || '';
    }

    showPreview() {
        const uploadArea = document.getElementById('uploadArea');
        const previewContainer = document.getElementById('previewContainer');
        
        if (uploadArea && previewContainer) {
            uploadArea.style.display = 'none';
            previewContainer.style.display = 'flex';
        }
        
        // Enable download button
        const downloadBtn = document.getElementById('downloadBtn');
        if (downloadBtn) {
            downloadBtn.disabled = false;
        }
    }

    hidePreview() {
        const uploadArea = document.getElementById('uploadArea');
        const previewContainer = document.getElementById('previewContainer');
        
        if (uploadArea && previewContainer) {
            uploadArea.style.display = 'flex';
            previewContainer.style.display = 'none';
        }
        
        // Disable download button
        const downloadBtn = document.getElementById('downloadBtn');
        if (downloadBtn) {
            downloadBtn.disabled = true;
        }
    }

    showError(message) {
        // Create a toast notification
        const toast = document.createElement('div');
        toast.className = 'toast error';
        toast.innerHTML = `
            <div class="toast-content">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="10"/>
                    <line x1="15" y1="9" x2="9" y2="15"/>
                    <line x1="9" y1="9" x2="15" y2="15"/>
                </svg>
                <span>${message}</span>
            </div>
        `;
        
        // Add toast styles if not already present
        if (!document.querySelector('.toast-styles')) {
            const style = document.createElement('style');
            style.className = 'toast-styles';
            style.textContent = `
                .toast {
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    background: #ffffff;
                    border: 1px solid #e2e8f0;
                    border-radius: 0.5rem;
                    padding: 1rem;
                    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
                    z-index: 10000;
                    animation: slideIn 0.3s ease;
                }
                
                .toast.error {
                    border-color: #ef4444;
                    background: #fef2f2;
                }
                
                .toast-content {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    color: #dc2626;
                }
                
                @keyframes slideIn {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
            `;
            document.head.appendChild(style);
        }
        
        document.body.appendChild(toast);
        
        // Remove toast after 5 seconds
        setTimeout(() => {
            toast.remove();
        }, 5000);
    }

    showSuccess(message) {
        // Similar to showError but for success messages
        const toast = document.createElement('div');
        toast.className = 'toast success';
        toast.innerHTML = `
            <div class="toast-content">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                    <polyline points="22,4 12,14.01 9,11.01"/>
                </svg>
                <span>${message}</span>
            </div>
        `;
        
        // Add success styles
        if (!document.querySelector('.toast-success-styles')) {
            const style = document.createElement('style');
            style.className = 'toast-success-styles';
            style.textContent = `
                .toast.success {
                    border-color: #10b981;
                    background: #f0fdf4;
                }
                
                .toast.success .toast-content {
                    color: #059669;
                }
            `;
            document.head.appendChild(style);
        }
        
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.remove();
        }, 3000);
    }

    initializeTooltips() {
        // Add tooltip functionality if needed
        const tooltipElements = document.querySelectorAll('[data-tooltip]');
        tooltipElements.forEach(element => {
            element.addEventListener('mouseenter', (e) => {
                this.showTooltip(e.target, e.target.dataset.tooltip);
            });
            
            element.addEventListener('mouseleave', (e) => {
                this.hideTooltip();
            });
        });
    }

    showTooltip(element, text) {
        const tooltip = document.createElement('div');
        tooltip.className = 'tooltip';
        tooltip.textContent = text;
        tooltip.style.cssText = `
            position: absolute;
            background: #1e293b;
            color: #ffffff;
            padding: 0.25rem 0.5rem;
            border-radius: 0.25rem;
            font-size: 0.75rem;
            z-index: 10000;
            pointer-events: none;
            white-space: nowrap;
        `;
        
        document.body.appendChild(tooltip);
        
        const rect = element.getBoundingClientRect();
        tooltip.style.left = `${rect.left + rect.width / 2 - tooltip.offsetWidth / 2}px`;
        tooltip.style.top = `${rect.top - tooltip.offsetHeight - 5}px`;
        
        this.currentTooltip = tooltip;
    }

    hideTooltip() {
        if (this.currentTooltip) {
            this.currentTooltip.remove();
            this.currentTooltip = null;
        }
    }

    handleUpload(htmlFile, cssFile) {
        try {
            // Reset style editor to initial state
            this.resetStyleEditor();

            // Continue with existing upload logic
            if (htmlFile) {
                const htmlReader = new FileReader();
                htmlReader.onload = (e) => {
                    const content = e.target.result;
                    this.currentFiles.set(htmlFile.name, {
                        type: 'html',
                        originalContent: content,
                        content: content
                    });
                    this.setActiveFile(htmlFile.name);
                    if (!cssFile) {
                        this.closeUploadModal();
                        this.showPreview();
                    }
                };
                htmlReader.readAsText(htmlFile);
            }
            
            if (cssFile) {
                const cssReader = new FileReader();
                cssReader.onload = (e) => {
                    const content = e.target.result;
                    this.currentFiles.set(cssFile.name, {
                        type: 'css',
                        originalContent: content,
                        content: content
                    });
                    this.closeUploadModal();
                    this.showPreview();
                };
                cssReader.readAsText(cssFile);
            }
        } catch (error) {
            console.error('Error handling upload:', error);
            this.showError('Failed to process uploaded files');
        }
        // After upload, reset expand/collapse state
        if (this.editor) {
            this.editor.allGroupsExpanded = false;
            // Also force all style groups to collapsed state
            document.querySelectorAll('.style-group').forEach(group => {
                const toggle = group.querySelector('.style-group-toggle');
                const controls = group.querySelector('.style-controls');
                if (toggle && controls) {
                    toggle.setAttribute('aria-expanded', 'false');
                    group.setAttribute('aria-collapsed', 'true');
                    controls.style.maxHeight = '0';
                    controls.style.opacity = '0';
                }
            });
        }
        // --- Reset expand/collapse button state ---
        const toggleAllGroupsBtn = document.getElementById('toggleAllGroupsBtn');
        if (toggleAllGroupsBtn) {
            if (typeof this._allGroupsExpandedRef === 'undefined') this._allGroupsExpandedRef = false;
            this._allGroupsExpandedRef = false;
            toggleAllGroupsBtn.setAttribute('aria-expanded', 'false');
            const span = toggleAllGroupsBtn.querySelector('span');
            if (span) span.textContent = 'Expand All';
        }
    }

    resetStyleEditor() {
        // Hide all style sections completely
        const styleGroups = document.getElementById('styleGroups');
        if (styleGroups) {
            // Hide the entire style groups container
            styleGroups.style.display = 'none';
            
            // Reset and hide all individual sections
            document.querySelectorAll('.style-group').forEach(group => {
                group.style.display = 'none';
            });
        }

        // Hide expand/collapse all button container
        const toggleAllGroupsBtnContainer = document.getElementById('toggleAllGroupsBtnContainer');
        if (toggleAllGroupsBtnContainer) {
            toggleAllGroupsBtnContainer.style.display = 'none';
        }

        // Reset element info to initial placeholder state
        const elementInfo = document.getElementById('elementInfo');
        if (elementInfo) {
            elementInfo.innerHTML = `
                <div class="info-placeholder">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                        <rect x="3" y="3" width="7" height="7"/>
                        <rect x="14" y="3" width="7" height="7"/>
                        <rect x="14" y="14" width="7" height="7"/>
                        <rect x="3" y="14" width="7" height="7"/>
                    </svg>
                    <p>Select an element to edit its styles</p>
                </div>
            `;
        }

        // Reset any active element selection
        if (this.renderer) {
            this.renderer.deselectElement();
        }
        if (this.editor) {
            this.editor.clearSelection();
        }
        // After reset, also reset expand/collapse state
        if (this.editor) {
            this.editor.allGroupsExpanded = false;
            // Also force all style groups to collapsed state
            document.querySelectorAll('.style-group').forEach(group => {
                const toggle = group.querySelector('.style-group-toggle');
                const controls = group.querySelector('.style-controls');
                if (toggle && controls) {
                    toggle.setAttribute('aria-expanded', 'false');
                    group.setAttribute('aria-collapsed', 'true');
                    controls.style.maxHeight = '0';
                    controls.style.opacity = '0';
                }
            });
        }
        // --- Reset expand/collapse button state ---
        const toggleAllGroupsBtn = document.getElementById('toggleAllGroupsBtn');
        if (toggleAllGroupsBtn) {
            if (typeof this._allGroupsExpandedRef === 'undefined') this._allGroupsExpandedRef = false;
            this._allGroupsExpandedRef = false;
            toggleAllGroupsBtn.setAttribute('aria-expanded', 'false');
            const span = toggleAllGroupsBtn.querySelector('span');
            if (span) span.textContent = 'Expand All';
        }
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.TopiaStyler = new TopiaStylerApp();
});