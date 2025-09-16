class Renderer {
    constructor(app) {
        this.app = app;
        this.iframe = null;
        this.iframeDoc = null;
        this.currentHighlight = null;
        this.messageHandlers = new Map();
        
        this.init();
    }

    init() {
        this.iframe = document.getElementById('previewFrame');
        if (!this.iframe) {
            console.error('Preview iframe not found');
            return;
        }

        this.setupIframe();
        this.setupMessageHandlers();
    }

    setupIframe() {
        // Set up iframe load event
        this.iframe.addEventListener('load', () => {
            this.onIframeLoad();
        });

        // Set up iframe security
        this.iframe.setAttribute('sandbox', 'allow-scripts allow-modals allow-same-origin');
    }

    setupMessageHandlers() {
        // Listen for messages from iframe
        window.addEventListener('message', (event) => {
            if (event.source !== this.iframe.contentWindow) return;
            
            this.handleIframeMessage(event.data);
        });
    }

    renderFile(fileName) {
        const fileData = this.app.currentFiles.get(fileName);
        if (!fileData || fileData.type !== 'html') {
            console.error('Cannot render non-HTML file:', fileName);
            return;
        }

        try {
            let htmlContent = this.app.fileHandler.getFileContent(fileName);
            
            // Inject CSS files
            htmlContent = this.injectCSSFiles(htmlContent);
            
            // Inject interaction scripts
            htmlContent = this.injectInteractionScripts(htmlContent);
            
            // Create blob URL for iframe
            const blob = new Blob([htmlContent], { type: 'text/html' });
            const url = URL.createObjectURL(blob);
            
            // Load content in iframe
            this.iframe.src = url;
            
            // Clean up previous blob URL
            if (this.currentBlobUrl) {
                URL.revokeObjectURL(this.currentBlobUrl);
            }
            this.currentBlobUrl = url;
            
        } catch (error) {
            console.error('Error rendering file:', error);
            this.app.showError('Failed to render file');
        }
    }

    injectCSSFiles(htmlContent) {
        // Find CSS files in current project
        const cssFiles = Array.from(this.app.currentFiles.keys())
            .filter(fileName => fileName.endsWith('.css'));
        
        if (cssFiles.length === 0) return htmlContent;
        
        // Create CSS injection
        let cssInjection = '';
        cssFiles.forEach(fileName => {
            const cssContent = this.app.fileHandler.getFileContent(fileName);
            if (cssContent) {
                cssInjection += `<style data-file="${fileName}">\n${cssContent}\n</style>\n`;
            }
        });
        
        // Inject CSS before closing head tag
        if (cssInjection) {
            const headCloseIndex = htmlContent.indexOf('</head>');
            if (headCloseIndex !== -1) {
                htmlContent = htmlContent.substring(0, headCloseIndex) + 
                            cssInjection + 
                            htmlContent.substring(headCloseIndex);
            } else {
                // If no head tag, inject at beginning of body
                const bodyOpenIndex = htmlContent.indexOf('<body');
                if (bodyOpenIndex !== -1) {
                    const bodyCloseIndex = htmlContent.indexOf('>', bodyOpenIndex);
                    htmlContent = htmlContent.substring(0, bodyCloseIndex + 1) + 
                                '\n' + cssInjection + 
                                htmlContent.substring(bodyCloseIndex + 1);
                }
            }
        }
        
        return htmlContent;
    }

    injectInteractionScripts(htmlContent) {
        const interactionScript = `
            <script>
                (function() {
                    let selectedElement = null;
                    let highlight = null;
                    let lastCtrlClick = { x: null, y: null, index: 0, elements: [] };
                    
                    // Load Google Fonts in iframe
                    function loadGoogleFonts() {
                        const fontLinks = [
                            'https://fonts.googleapis.com/css2?family=Inter:wght@100;200;300;400;500;600;700;800;900&family=Roboto:wght@400;700&family=Open+Sans:wght@400;700&family=Lato:wght@400;700&family=Montserrat:wght@400;700&family=Oswald:wght@400;700&family=PT+Sans:wght@400;700&family=Ubuntu:wght@400;700&family=Varela&family=Varela+Round&family=Exo:wght@400;700&family=Droid+Sans:wght@400;700&family=Raleway:wght@400;700&family=Poppins:wght@400;700&family=Quicksand:wght@400;700&display=swap',
                            'https://fonts.googleapis.com/css2?family=Merriweather:wght@400;700&family=PT+Serif:wght@400;700&family=Vollkorn:wght@400;700&family=Bitter:wght@400;700&family=Droid+Serif:wght@400;700&family=Lora:wght@400;700&family=Abril+Fatface&display=swap',
                            'https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Changa+One&family=Pacifico&family=Dancing+Script:wght@400;700&family=Great+Vibes&family=Caveat:wght@400;700&family=Playfair+Display:wght@400;700&display=swap',
                            'https://fonts.googleapis.com/css2?family=Fira+Mono:wght@400;700&family=Space+Mono:wght@400;700&family=Inconsolata:wght@400;700&display=swap'
                        ];
                        
                        fontLinks.forEach(link => {
                            const linkElement = document.createElement('link');
                            linkElement.rel = 'stylesheet';
                            linkElement.href = link;
                            document.head.appendChild(linkElement);
                        });
                    }
                    
                    // Load fonts when iframe is ready
                    loadGoogleFonts();
                    
                    // Remove any old body-live-style tag on load
                    document.addEventListener('DOMContentLoaded', function() {
                        var oldStyle = document.getElementById('body-live-style');
                        if (oldStyle) oldStyle.remove();
                    });
                    
                    function createHighlight() {
                        // Remove any existing highlight overlays to avoid duplicates
                        if (highlight) {
                            highlight.remove();
                            highlight = null;
                        }
                        highlight = document.createElement('div');
                        highlight.style.cssText = \`
                            position: absolute;
                            pointer-events: none;
                            border: 2px dashed #38bdf8;
                            background: rgba(56, 189, 248, 0.1);
                            z-index: 10000;
                            transition: all 0.1s ease;
                        \`;
                        document.body.appendChild(highlight);
                        return highlight;
                    }
                    
                    function removeHighlight() {
                        if (highlight) {
                            highlight.remove();
                            highlight = null;
                        }
                    }
                    
                    function highlightElement(element) {
                        if (!element || element === document.documentElement) {
                            removeHighlight();
                            return;
                        }
                        const rect = element.getBoundingClientRect();
                        const highlight = createHighlight();
                        // Account for scroll position
                        const scrollX = window.scrollX || document.documentElement.scrollLeft;
                        const scrollY = window.scrollY || document.documentElement.scrollTop;
                        highlight.style.left = (rect.left + scrollX) + 'px';
                        highlight.style.top = (rect.top + scrollY) + 'px';
                        highlight.style.width = rect.width + 'px';
                        highlight.style.height = rect.height + 'px';
                    }
                    
                    function getElementSelector(element) {
                        if (element === document.body) return 'body';
                        if (element === document.documentElement) return 'html';
                        if (element.id) {
                            return '#' + CSS.escape(element.id);
                        }
                        // Build a unique selector path
                        let path = [];
                        let el = element;
                        while (el && el.nodeType === 1 && el !== document.body && el !== document.documentElement) {
                            let selector = el.tagName.toLowerCase();
                            // If this element has siblings of the same tag, use nth-of-type
                            if (el.parentNode) {
                                const siblings = Array.from(el.parentNode.children).filter(e => e.tagName === el.tagName);
                                if (siblings.length > 1) {
                                    const idx = siblings.indexOf(el) + 1;
                                    selector += ':nth-of-type(' + idx + ')';
                                }
                            }
                            path.unshift(selector);
                            el = el.parentNode;
                        }
                        // Always start from body for stability
                        return 'body > ' + path.join(' > ');
                    }
                    
                    function selectElement(element) {
                        selectedElement = element;
                        highlightElement(element);
                        
                        const selector = getElementSelector(element);
                        const computedStyle = window.getComputedStyle(element);
                        
                        // Send element info to parent
                        parent.postMessage({
                            type: 'element-selected',
                            data: {
                                tagName: element.tagName.toLowerCase(),
                                id: element.id,
                                className: element.className,
                                selector: selector,
                                textContent: element.textContent,
                                styles: {
                                    fontSize: computedStyle.fontSize,
                                    fontWeight: computedStyle.fontWeight,
                                    fontFamily: computedStyle.fontFamily,
                                    lineHeight: computedStyle.lineHeight,
                                    letterSpacing: computedStyle.letterSpacing,
                                    textAlign: computedStyle.textAlign,
                                    textTransform: computedStyle.textTransform,
                                    color: computedStyle.color,
                                    backgroundColor: computedStyle.backgroundColor,
                                    margin: computedStyle.margin,
                                    padding: computedStyle.padding,
                                    width: computedStyle.width,
                                    height: computedStyle.height,
                                    display: computedStyle.display,
                                    border: computedStyle.border,
                                    borderWidth: computedStyle.borderWidth,
                                    borderStyle: computedStyle.borderStyle,
                                    borderColor: computedStyle.borderColor,
                                    borderRadius: computedStyle.borderRadius,
                                    boxShadow: computedStyle.boxShadow,
                                    opacity: computedStyle.opacity,
                                    filter: computedStyle.filter
                                }
                            }
                        }, '*');
                    }
                    
                    // Mouse event handlers
                    document.addEventListener('mouseover', (e) => {
                        e.preventDefault();
                        highlightElement(e.target);
                    });
                    
                    document.addEventListener('mouseout', (e) => {
                        if (e.target !== selectedElement) {
                            removeHighlight();
                        }
                    });
                    
                    document.addEventListener('click', (e) => {
                        // Ctrl+Click (or Cmd+Click) cycles through elements under cursor
                        if (e.ctrlKey || e.metaKey) {
                            e.preventDefault();
                            const x = e.clientX, y = e.clientY;
                            // If position changed, reset cycling
                            if (lastCtrlClick.x !== x || lastCtrlClick.y !== y) {
                                lastCtrlClick.x = x;
                                lastCtrlClick.y = y;
                                lastCtrlClick.index = 0;
                                lastCtrlClick.elements = document.elementsFromPoint(x, y).filter(el => el !== document.documentElement);
                            }
                            if (lastCtrlClick.elements.length > 0) {
                                const el = lastCtrlClick.elements[lastCtrlClick.index % lastCtrlClick.elements.length];
                                lastCtrlClick.index++;
                                selectElement(el);
                            }
                        } else {
                            e.preventDefault();
                            selectElement(e.target);
                            // Reset ctrl-click cycling
                            lastCtrlClick.x = null;
                            lastCtrlClick.y = null;
                            lastCtrlClick.index = 0;
                            lastCtrlClick.elements = [];
                        }
                    });
                    
                    // Listen for style updates from parent
                    window.addEventListener('message', (event) => {
                        if (event.data.type === 'update-styles') {
                            const { selector, styles } = event.data.data;
                            let elements;
                            if (selector === 'body') {
                                elements = [document.body];
                                // Remove previous inline styles for inherited properties
                                ['color','fontFamily','fontSize','fontWeight','lineHeight','letterSpacing'].forEach(function(prop) {
                                    document.body.style[prop] = '';
                                    document.documentElement.style[prop] = '';
                                });
                                // Build CSS rule for inherited properties
                                let css = 'body {';
                                let hasInherited = false;
                                ['color','fontFamily','fontSize','fontWeight','lineHeight','letterSpacing'].forEach(function(prop) {
                                    if (styles[prop]) {
                                        // Convert camelCase to kebab-case for CSS properties
                                        const cssProperty = prop.replace(/([A-Z])/g, '-$1').toLowerCase();
                                        css += cssProperty + ': ' + styles[prop] + ' !important;';
                                        hasInherited = true;
                                    }
                                });
                                css += '}';
                                // Remove any old style tag
                                let styleTag = document.getElementById('body-live-style');
                                if (styleTag) styleTag.remove();
                                if (hasInherited) {
                                    styleTag = document.createElement('style');
                                    styleTag.id = 'body-live-style';
                                    styleTag.textContent = css;
                                    document.head.appendChild(styleTag);
                                }
                                // Only set non-inherited properties as inline styles
                                const inheritedProps = ['color','fontFamily','fontSize','fontWeight','lineHeight','letterSpacing'];
                                const filtered = Object.assign({}, styles);
                                inheritedProps.forEach(function(prop) {
                                    delete filtered[prop];
                                });
                                Object.entries(filtered).forEach(function(entry) {
                                    var property = entry[0], value = entry[1];
                                    if (property === 'filter') {
                                        document.body.style.filter = value || '';
                                        // Also apply to .main-content and .canvas-area for full-page effects
                                        var mainContent = document.querySelector('.main-content');
                                        if (mainContent) {
                                            mainContent.style.filter = value || '';
                                        }
                                        var canvasArea = document.querySelector('.canvas-area');
                                        if (canvasArea) {
                                            canvasArea.style.filter = value || '';
                                        }
                                        // Show warning if drop-shadow and no background
                                        var warn = false;
                                        var msg = "Note: Drop-shadow filter only affects visible pixels. For best results, apply to elements with a background or visible content. For containers, consider using box-shadow instead.";
                                        if (value && value.includes('drop-shadow')) {
                                            var bg = getComputedStyle(document.body).backgroundColor;
                                            if (!bg || bg === 'rgba(0, 0, 0, 0)' || bg === 'transparent') warn = true;
                                            if (!warn && mainContent) {
                                                var bg2 = getComputedStyle(mainContent).backgroundColor;
                                                if (!bg2 || bg2 === 'rgba(0, 0, 0, 0)' || bg2 === 'transparent') warn = true;
                                            }
                                            if (!warn && canvasArea) {
                                                var bg3 = getComputedStyle(canvasArea).backgroundColor;
                                                if (!bg3 || bg3 === 'rgba(0, 0, 0, 0)' || bg3 === 'transparent') warn = true;
                                            }
                                        }
                                        var filterWarning = document.getElementById('filterWarning');
                                        if (filterWarning) {
                                            if (warn) {
                                                filterWarning.textContent = msg;
                                                filterWarning.style.display = '';
                                            } else {
                                                filterWarning.textContent = '';
                                                filterWarning.style.display = 'none';
                                            }
                                        }
                                    } else {
                                        document.body.style[property] = value;
                                    }
                                });
                            } else {
                                elements = document.querySelectorAll(selector);
                                elements.forEach(function(el) {
                                    Object.entries(styles).forEach(function(entry) {
                                        var property = entry[0], value = entry[1];
                                        if (property === 'fontFamily' && value) {
                                            el.style.fontFamily = value;
                                        } else if (property === 'filter') {
                                            // Always set filter, log for debugging
                                            el.style.filter = value || '';
                                        } else {
                                            el.style[property] = value;
                                        }
                                });
                            });
                            }
                            
                            // Update highlight if selected element was modified
                            if (selectedElement && selectedElement.matches(selector)) {
                                highlightElement(selectedElement);
                            }
                        }
                        
                        if (event.data.type === 'deselect-element') {
                            selectedElement = null;
                            removeHighlight();
                        }
                        if (event.data.type === 'update-text') {
                            const { selector, text } = event.data.data;
                            const elements = document.querySelectorAll(selector);
                            elements.forEach(element => {
                                element.textContent = text;
                            });
                        }
                    });
                    
                    // Ensure highlight updates on scroll/resize
                    window.addEventListener('scroll', () => {
                        if (selectedElement) highlightElement(selectedElement);
                    }, true);
                    window.addEventListener('resize', () => {
                        if (selectedElement) highlightElement(selectedElement);
                    });
                    
                    // Notify parent that iframe is ready
                    parent.postMessage({ type: 'iframe-ready' }, '*');
                })();
            </script>
        `;
        
        // Inject script before closing body tag
        const bodyCloseIndex = htmlContent.lastIndexOf('</body>');
        if (bodyCloseIndex !== -1) {
            htmlContent = htmlContent.substring(0, bodyCloseIndex) + 
                        interactionScript + 
                        htmlContent.substring(bodyCloseIndex);
        } else {
            // If no body tag, append to end
            htmlContent += interactionScript;
        }
        
        return htmlContent;
    }

    onIframeLoad() {
        try {
            this.iframeDoc = this.iframe.contentDocument || this.iframe.contentWindow.document;
            
            // Setup additional iframe interactions if needed
            this.setupIframeInteractions();
            
        } catch (error) {
            console.error('Error accessing iframe document:', error);
        }
    }

    setupIframeInteractions() {
        // Additional iframe setup can be done here
        // For example, disable right-click context menu
        if (this.iframeDoc) {
            this.iframeDoc.addEventListener('contextmenu', (e) => {
                e.preventDefault();
            });
        }
    }

    handleIframeMessage(data) {
        if (!data || !data.type) return;
        
        switch (data.type) {
            case 'iframe-ready':
                this.onIframeReady();
                break;
                
            case 'element-selected':
                this.onElementSelected(data.data);
                break;
                
            case 'element-hover':
                this.onElementHover(data.data);
                break;
                
            default:
                console.warn('Unknown iframe message type:', data.type);
        }
    }

    onIframeReady() {
        // Iframe is ready, can now send messages to it
    }

    onElementSelected(elementData) {
        this.app.selectedElement = elementData;
        
        // Update editor with selected element
        if (this.app.editor) {
            this.app.editor.updateSelectedElement(elementData);
        }
    }

    onElementHover(elementData) {
        // Handle element hover if needed
    }

    // Send message to iframe
    sendMessageToIframe(type, data) {
        if (this.iframe && this.iframe.contentWindow) {
            this.iframe.contentWindow.postMessage({
                type: type,
                data: data
            }, '*');
        }
    }

    // Update styles in iframe
    updateElementStyles(selector, styles) {
        this.sendMessageToIframe('update-styles', {
            selector: selector,
            styles: styles
        });
        
        // Update file modifications
        if (this.app.activeFile) {
            this.app.fileHandler.updateFile(this.app.activeFile, {
                [selector]: styles
            });
        }
    }

    // Deselect current element
    deselectElement() {
        this.app.selectedElement = null;
        this.sendMessageToIframe('deselect-element', {});
        
        if (this.app.editor) {
            this.app.editor.clearSelection();
        }
    }

    // Refresh iframe content
    refresh() {
        if (this.app.activeFile) {
            this.renderFile(this.app.activeFile);
        }
    }

    // Clean up
    destroy() {
        if (this.currentBlobUrl) {
            URL.revokeObjectURL(this.currentBlobUrl);
        }
        
        window.removeEventListener('message', this.handleIframeMessage);
    }

    // Add this method to Renderer
    updateElementText(selector, text) {
        this.sendMessageToIframe('update-text', { selector, text });
        // Optionally update file modifications for export
        if (this.app.activeFile) {
            this.app.fileHandler.updateFile(this.app.activeFile, {
                [selector]: { textContent: text }
            });
        }
    }
}