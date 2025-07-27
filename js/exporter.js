class Exporter {
    constructor(app) {
        this.app = app;
        this.zip = null;
    }

    async exportProject() {
        if (!window.JSZip) {
            throw new Error('JSZip library not loaded');
        }

        if (this.app.currentFiles.size === 0) {
            throw new Error('No files to export');
        }

        try {
            this.zip = new JSZip();
            
            // Add all files to zip
            for (const [fileName, fileData] of this.app.currentFiles) {
                const content = this.getProcessedContent(fileName, fileData);
                this.zip.file(fileName, content);
            }

            // Generate and download zip
            const content = await this.zip.generateAsync({
                type: 'blob',
                compression: 'DEFLATE',
                compressionOptions: {
                    level: 6
                }
            });

            this.downloadFile(content, 'TopiaStyler-project.zip');
            
            this.app.showSuccess('Project exported successfully!');
            
        } catch (error) {
            console.error('Export error:', error);
            throw error;
        }
    }

    getProcessedContent(fileName, fileData) {
        // Get content with all modifications applied
        let content = fileData.originalContent;
        
        // Apply modifications based on file type
        if (fileData.type === 'html') {
            content = this.processHTMLContent(content, fileData);
            // Add Google Fonts to HTML files
            content = this.addGoogleFontsToHTML(content);
        } else if (fileData.type === 'css') {
            content = this.processCSSContent(content, fileData);
        }
        
        return content;
    }

    processHTMLContent(htmlContent, fileData) {
        // Apply inline style modifications
        let doc;
        let injectedCSS = '';
        if (fileData.modifications.size > 0) {
            const parser = new DOMParser();
            doc = parser.parseFromString(htmlContent, 'text/html');
            // Build CSS for !important overrides
            let importantRules = [];
            fileData.modifications.forEach((styles, selector) => {
                let elements;
                // Special handling for body selector
                if (selector === 'body') {
                    elements = [doc.body];
                } else {
                    elements = doc.querySelectorAll(selector);
                }
                elements.forEach(element => {
                    if (!element) return;
                    // Apply styles as inline styles
                    Object.entries(styles).forEach(([property, value]) => {
                        if (property === 'textContent' && value !== undefined) {
                            // Do not set textContent for body
                            if (selector !== 'body') element.textContent = value;
                        } else if (value && property !== 'textContent') {
                            try {
                            element.style[property] = value;
                            } catch (e) {
                                /* skip invalid property */
                            }
                        }
                    });
                });
                // Build !important CSS rule for this selector
                const styleDeclarations = Object.entries(styles)
                    .filter(([property, value]) => value && property !== 'textContent')
                    .map(([property, value]) => `  ${this.camelToKebab(property)}: ${value} !important;`)
                    .join('\n');
                if (styleDeclarations) {
                    importantRules.push(`${selector} {\n${styleDeclarations}\n}`);
                }
            });
            if (importantRules.length > 0) {
                injectedCSS = `\n<!-- TopiaStyler Modifications -->\n<style id="topiastyler-mods">\n${importantRules.join('\n\n')}\n</style>`;
            }
            // Inject the style block before </head>
            let html = '<!DOCTYPE html>\n' + doc.documentElement.outerHTML;
            if (injectedCSS) {
                const headCloseIndex = html.indexOf('</head>');
                if (headCloseIndex !== -1) {
                    html = html.slice(0, headCloseIndex) + injectedCSS + '\n' + html.slice(headCloseIndex);
                } else {
                    html = injectedCSS + '\n' + html;
                }
            }
            return html;
        }
        return htmlContent;
    }

    // Add Google Fonts to exported HTML
    addGoogleFontsToHTML(htmlContent) {
        const googleFontsLinks = `
    <!-- Google Fonts - Organized by Category -->
    <!-- Sans Serif Fonts -->
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@100;200;300;400;500;600;700;800;900&family=Roboto:wght@400;700&family=Open+Sans:wght@400;700&family=Lato:wght@400;700&family=Montserrat:wght@400;700&family=Oswald:wght@400;700&family=PT+Sans:wght@400;700&family=Ubuntu:wght@400;700&family=Varela&family=Varela+Round&family=Exo:wght@400;700&family=Droid+Sans:wght@400;700&family=Raleway:wght@400;700&family=Poppins:wght@400;700&family=Quicksand:wght@400;700&display=swap" rel="stylesheet">
    <!-- Serif Fonts -->
    <link href="https://fonts.googleapis.com/css2?family=Merriweather:wght@400;700&family=PT+Serif:wght@400;700&family=Vollkorn:wght@400;700&family=Bitter:wght@400;700&family=Droid+Serif:wght@400;700&family=Lora:wght@400;700&family=Abril+Fatface&display=swap" rel="stylesheet">
    <!-- Display & Script Fonts -->
    <link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Changa+One&family=Pacifico&family=Dancing+Script:wght@400;700&family=Great+Vibes&family=Caveat:wght@400;700&family=Playfair+Display:wght@400;700&display=swap" rel="stylesheet">
    <!-- Monospace Fonts -->
    <link href="https://fonts.googleapis.com/css2?family=Fira+Mono:wght@400;700&family=Space+Mono:wght@400;700&family=Inconsolata:wght@400;700&display=swap" rel="stylesheet">`;

        // Check if Google Fonts are already present
        if (htmlContent.includes('fonts.googleapis.com')) {
            return htmlContent; // Already has Google Fonts
        }

        // Add Google Fonts before </head>
        const headCloseIndex = htmlContent.indexOf('</head>');
        if (headCloseIndex !== -1) {
            return htmlContent.slice(0, headCloseIndex) + googleFontsLinks + '\n' + htmlContent.slice(headCloseIndex);
        } else {
            // If no head tag, add before </html>
            const htmlCloseIndex = htmlContent.indexOf('</html>');
            if (htmlCloseIndex !== -1) {
                return htmlContent.slice(0, htmlCloseIndex) + '\n<head>' + googleFontsLinks + '\n</head>\n' + htmlContent.slice(htmlCloseIndex);
            }
        }
        
        return htmlContent;
    }

    processCSSContent(cssContent, fileData) {
        // Apply CSS modifications if any
        if (fileData.modifications.size > 0) {
            let modifiedCSS = cssContent;
            
            // Add modified rules at the end
            const additionalRules = [];
            fileData.modifications.forEach((styles, selector) => {
                const styleDeclarations = Object.entries(styles)
                    .filter(([property, value]) => value)
                    .map(([property, value]) => `  ${this.camelToKebab(property)}: ${value};`)
                    .join('\n');
                
                if (styleDeclarations) {
                    additionalRules.push(`${selector} {\n${styleDeclarations}\n}`);
                }
            });
            
            if (additionalRules.length > 0) {
                modifiedCSS += '\n\n/* TopiaStyler Modifications */\n' + additionalRules.join('\n\n');
            }
            
            return modifiedCSS;
        }
        
        return cssContent;
    }

    camelToKebab(str) {
        return str.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
    }

    downloadFile(content, filename) {
        const url = URL.createObjectURL(content);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.style.display = 'none';
        
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        
        // Clean up
        setTimeout(() => {
            URL.revokeObjectURL(url);
        }, 1000);
    }

    // Export individual file
    async exportFile(fileName) {
        const fileData = this.app.currentFiles.get(fileName);
        if (!fileData) {
            throw new Error(`File not found: ${fileName}`);
        }

        const content = this.getProcessedContent(fileName, fileData);
        const blob = new Blob([content], { type: 'text/plain' });
        
        this.downloadFile(blob, fileName);
    }

    // Export as HTML with embedded CSS
    async exportAsHTML() {
        const htmlFiles = Array.from(this.app.currentFiles.keys())
            .filter(fileName => fileName.endsWith('.html'));
        
        if (htmlFiles.length === 0) {
            throw new Error('No HTML files to export');
        }

        const htmlFile = htmlFiles[0];
        const htmlData = this.app.currentFiles.get(htmlFile);
        
        if (!htmlData) {
            throw new Error('HTML file data not found');
        }

        // Get processed HTML content
        let htmlContent = this.processHTMLContent(htmlData.originalContent, htmlData);
        
        // Embed CSS files
        const cssFiles = Array.from(this.app.currentFiles.keys())
            .filter(fileName => fileName.endsWith('.css'));
        
        if (cssFiles.length > 0) {
            let embeddedCSS = '';
            
            cssFiles.forEach(fileName => {
                const cssData = this.app.currentFiles.get(fileName);
                if (cssData) {
                    const cssContent = this.processCSSContent(cssData.originalContent, cssData);
                    embeddedCSS += `\n/* ${fileName} */\n${cssContent}\n`;
                }
            });
            
            // Remove existing CSS links
            htmlContent = htmlContent.replace(/<link[^>]*rel\s*=\s*["']stylesheet["'][^>]*>/gi, '');
            
            // Add embedded CSS
            if (embeddedCSS) {
                const styleTag = `<style>\n${embeddedCSS}\n</style>`;
                const headCloseIndex = htmlContent.indexOf('</head>');
                if (headCloseIndex !== -1) {
                    htmlContent = htmlContent.substring(0, headCloseIndex) + 
                                styleTag + '\n' + 
                                htmlContent.substring(headCloseIndex);
                }
            }
        }

        const blob = new Blob([htmlContent], { type: 'text/html' });
        const fileName = htmlFile.replace('.html', '_embedded.html');
        
        this.downloadFile(blob, fileName);
        this.app.showSuccess('HTML with embedded CSS exported successfully!');
    }

    // Export CSS modifications only
    async exportModifications() {
        const modifications = new Map();
        
        // Collect all modifications
        for (const [fileName, fileData] of this.app.currentFiles) {
            if (fileData.modifications.size > 0) {
                modifications.set(fileName, fileData.modifications);
            }
        }
        
        if (modifications.size === 0) {
            this.app.showError('No modifications to export');
            return;
        }

        // Create CSS content with modifications
        let cssContent = '/* TopiaStyler Modifications */\n\n';
        
        modifications.forEach((fileModifications, fileName) => {
            cssContent += `/* Modifications for ${fileName} */\n`;
            
            fileModifications.forEach((styles, selector) => {
                const styleDeclarations = Object.entries(styles)
                    .filter(([property, value]) => value)
                    .map(([property, value]) => `  ${this.camelToKebab(property)}: ${value};`)
                    .join('\n');
                
                if (styleDeclarations) {
                    cssContent += `${selector} {\n${styleDeclarations}\n}\n\n`;
                }
            });
        });

        const blob = new Blob([cssContent], { type: 'text/css' });
                    this.downloadFile(blob, 'TopiaStyler-modifications.css');
        
        this.app.showSuccess('Modifications exported successfully!');
    }

    // Generate project report
    async exportReport() {
        const report = {
            projectName: 'TopiaStyler Project',
            exportDate: new Date().toISOString(),
            files: {},
            modifications: {},
            summary: {
                totalFiles: this.app.currentFiles.size,
                htmlFiles: 0,
                cssFiles: 0,
                totalModifications: 0
            }
        };

        // Collect file information
        for (const [fileName, fileData] of this.app.currentFiles) {
            report.files[fileName] = {
                type: fileData.type,
                size: fileData.size,
                lastModified: fileData.lastModified,
                hasModifications: fileData.modifications.size > 0
            };

            if (fileData.type === 'html') {
                report.summary.htmlFiles++;
            } else if (fileData.type === 'css') {
                report.summary.cssFiles++;
            }

            if (fileData.modifications.size > 0) {
                report.modifications[fileName] = {};
                fileData.modifications.forEach((styles, selector) => {
                    report.modifications[fileName][selector] = styles;
                    report.summary.totalModifications++;
                });
            }
        }

        const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
                    this.downloadFile(blob, 'TopiaStyler-report.json');
        
        this.app.showSuccess('Project report exported successfully!');
    }
}