class Editor {
    constructor(app) {
        this.app = app;
        this.selectedElement = null;
        this.controls = new Map();
        this.debounceTimers = new Map();
        this.allGroupsExpanded = false; // Track global expand/collapse state
        this.userSectionStates = new Map(); // Track user's preferred section states
        // Mapping: tagName -> array of control keys
        this.CONTROL_VISIBILITY = {
            'button': ['fontSize','fontWeight','textColor','backgroundColor','borderWidth','borderStyle','borderColor','padding','margin','width','height','display'],
            'a': ['fontSize','fontWeight','textColor','backgroundColor','borderWidth','borderStyle','borderColor','padding','margin','width','height','display'],
            'h1': ['fontSize','fontWeight','textColor','margin','padding','width','height','display'],
            'h2': ['fontSize','fontWeight','textColor','margin','padding','width','height','display'],
            'h3': ['fontSize','fontWeight','textColor','margin','padding','width','height','display'],
            'h4': ['fontSize','fontWeight','textColor','margin','padding','width','height','display'],
            'h5': ['fontSize','fontWeight','textColor','margin','padding','width','height','display'],
            'h6': ['fontSize','fontWeight','textColor','margin','padding','width','height','display'],
            'p': ['fontSize','fontWeight','textColor','margin','padding','width','height','display'],
            'span': ['fontSize','fontWeight','textColor','margin','padding','width','height','display'],
            'div': ['backgroundColor','borderWidth','borderStyle','borderColor','margin','padding','width','height','display'],
            'img': ['width','height','margin','display'],
            'input': ['backgroundColor','borderWidth','borderStyle','borderColor','margin','padding','width','height','display'],
            'label': ['fontSize','fontWeight','textColor','margin','padding','display'],
            'ul': ['margin','padding','backgroundColor','borderWidth','borderStyle','borderColor','width','height','display'],
            'ol': ['margin','padding','backgroundColor','borderWidth','borderStyle','borderColor','width','height','display'],
            'li': ['fontSize','fontWeight','textColor','margin','padding','backgroundColor','borderWidth','borderStyle','borderColor','width','height','display'],
            'form': ['margin','padding','backgroundColor','borderWidth','borderStyle','borderColor','width','height','display'],
            'section': ['margin','padding','backgroundColor','borderWidth','borderStyle','borderColor','width','height','display'],
            'nav': ['margin','padding','backgroundColor','borderWidth','borderStyle','borderColor','width','height','display'],
            'footer': ['margin','padding','backgroundColor','borderWidth','borderStyle','borderColor','width','height','display'],
            'header': ['margin','padding','backgroundColor','borderWidth','borderStyle','borderColor','width','height','display'],
            'default': ['fontSize','fontWeight','textColor','backgroundColor','borderWidth','borderStyle','borderColor','margin','padding','width','height','display']
        };
        // CONTROL_VISIBILITY: define controls for <body> explicitly for clarity and maintainability
        this.CONTROL_VISIBILITY = {
            ...this.CONTROL_VISIBILITY,
            'body': [
                // Typography
                'fontSize','fontWeight','textColor','fontFamily','lineHeight','letterSpacing','textAlign','textTransform',
                // Background
                'backgroundColor',
                // Spacing
                'margin','padding',
                // Layout (only safe/meaningful controls for <body>)
                // 'width', // (optional, advanced)
                // 'height', // (optional, advanced)
                'overflow', // (recommended, safe)
                // 'visibility', // (optional, advanced)
                // Border
                'borderWidth','borderStyle','borderColor','borderRadius',
                // Effects
                'boxShadow','opacity','filter',
                // Positioning and Interaction controls intentionally excluded for <body> to avoid confusion
            ]
        };
        // Effects controls
        this.controls.set('borderRadius', {
            element: document.getElementById('borderRadius'),
            property: 'borderRadius',
            unit: 'px'
        });
        this.controls.set('boxShadow', {
            element: document.getElementById('boxShadow'),
            property: 'boxShadow',
            unit: ''
        });
        this.controls.set('opacity', {
            element: document.getElementById('opacity'),
            property: 'opacity',
            unit: ''
        });
        this.controls.set('filter', {
            element: document.getElementById('filter'),
            property: 'filter',
            unit: ''
        });

        this.controls.set('willChange', {
            element: document.getElementById('willChange'),
            property: 'willChange',
            unit: ''
        });
        this.controls.set('transform', {
            element: document.getElementById('transform'),
            property: 'transform',
            unit: ''
        });
        this.controls.set('transition', {
            element: document.getElementById('transition'),
            property: 'transition',
            unit: ''
        });
        // Typography upgrades
        this.controls.set('fontFamily', {
            element: document.getElementById('fontFamily'),
            customElement: document.getElementById('fontFamilyCustom'),
            property: 'fontFamily',
            unit: ''
        });
        this.controls.set('lineHeight', {
            element: document.getElementById('lineHeight'),
            property: 'lineHeight',
            unit: ''
        });
        this.controls.set('letterSpacing', {
            element: document.getElementById('letterSpacing'),
            property: 'letterSpacing',
            unit: 'px'
        });
        this.controls.set('textAlign', {
            element: document.querySelector('.text-align-group'),
            property: 'textAlign',
            unit: ''
        });
        this.controls.set('textTransform', {
            element: document.getElementById('textTransform'),
            property: 'textTransform',
            unit: ''
        });
        // Text Content control (for text elements)
        if (!document.getElementById('textContentEdit')) {
            const group = document.createElement('div');
            group.className = 'control-group';
            group.innerHTML = `
                <label for="textContentEdit" title="Edit the text content">Text Content</label>
                <input type="text" id="textContentEdit" aria-label="Text Content" placeholder="Edit text..." />
            `;
            const typographyCard = document.querySelector('[data-group="typography"] .style-controls');
            if (typographyCard) typographyCard.insertBefore(group, typographyCard.firstChild);
        }
        this.controls.set('textContent', {
            element: document.getElementById('textContentEdit'),
            property: 'textContent',
            unit: ''
        });
        // Positioning controls
        this.controls.set('position', {
            element: document.getElementById('position'),
            property: 'position',
            unit: ''
        });
        this.controls.set('top', {
            element: document.getElementById('top'),
            property: 'top',
            unit: '' // Support px, %, auto, etc.
        });
        this.controls.set('right', {
            element: document.getElementById('right'),
            property: 'right',
            unit: '' // Support px, %, auto, etc.
        });
        this.controls.set('bottom', {
            element: document.getElementById('bottom'),
            property: 'bottom',
            unit: '' // Support px, %, auto, etc.
        });
        this.controls.set('left', {
            element: document.getElementById('left'),
            property: 'left',
            unit: '' // Support px, %, auto, etc.
        });
        this.controls.set('zIndex', {
            element: document.getElementById('zIndex'),
            property: 'zIndex',
            unit: '' // Support numbers, auto, etc.
        });
        // Interaction controls
        this.controls.set('cursor', {
            element: document.getElementById('cursor'),
            property: 'cursor',
            unit: ''
        });
        this.controls.set('pointerEvents', {
            element: document.getElementById('pointerEvents'),
            property: 'pointerEvents',
            unit: ''
        });
        this.controls.set('userSelect', {
            element: document.getElementById('userSelect'),
            property: 'userSelect',
            unit: ''
        });
        this.controls.set('touchAction', {
            element: document.getElementById('touchAction'),
            property: 'touchAction',
            unit: ''
        });
        this.controls.set('draggable', {
            element: document.getElementById('draggable'),
            property: 'draggable',
            unit: ''
        });
        this.controls.set('overflow', {
            element: document.getElementById('overflow'),
            property: 'overflow',
            unit: ''
        });
        this.controls.set('visibility', {
            element: document.getElementById('visibility'),
            property: 'visibility',
            unit: ''
        });

        this.controls.set('resize', {
            element: document.getElementById('resize'),
            property: 'resize',
            unit: ''
        });
        // Add overflow and visibility to CONTROL_VISIBILITY after width/height for all relevant tags
        const layoutKeys = ['overflow','visibility'];
        const tagsWithLayout = [
            'button','a','h1','h2','h3','h4','h5','h6','p','span','div','img','input','label','ul','ol','li','form','section','nav','footer','header','default','body'
        ];
        tagsWithLayout.forEach(tag => {
            const vis = this.CONTROL_VISIBILITY[tag] || [];
            // Find last index of height (after which to insert)
            let idx = vis.lastIndexOf('height');
            if (idx !== -1) {
                this.CONTROL_VISIBILITY[tag] = [
                    ...vis.slice(0, idx + 1),
                    ...layoutKeys,
                    ...vis.slice(idx + 1)
                ];
            } else {
                this.CONTROL_VISIBILITY[tag] = [...vis, ...layoutKeys];
            }
        });
        
        // Add resize to interaction controls (moved from layout)
        const interactionKeys = ['cursor','pointerEvents','userSelect','touchAction','draggable','resize'];
        const tagsWithInteraction = [
            'button','a','h1','h2','h3','h4','h5','h6','p','span','div','img','input','label','ul','ol','li','form','section','nav','footer','header','default'
        ];
        tagsWithInteraction.forEach(tag => {
            const vis = this.CONTROL_VISIBILITY[tag] || [];
            // Find last index of zIndex (end of Positioning)
            let idx = vis.lastIndexOf('zIndex');
            if (idx !== -1) {
                this.CONTROL_VISIBILITY[tag] = [
                    ...vis.slice(0, idx + 1),
                    ...interactionKeys,
                    ...vis.slice(idx + 1)
                ];
            } else {
                this.CONTROL_VISIBILITY[tag] = [...vis, ...interactionKeys];
            }
        });

        
        // Add missing controls to all relevant elements
        const missingControls = ['fontFamily','lineHeight','letterSpacing','textAlign','textTransform','borderRadius','boxShadow','opacity','filter','willChange','outline','transform','transition'];
        const allTags = Object.keys(this.CONTROL_VISIBILITY);
        allTags.forEach(tag => {
            if (tag === 'body') return; // body has its own special configuration
            const vis = this.CONTROL_VISIBILITY[tag] || [];
            // Add missing controls that aren't already present
            missingControls.forEach(control => {
                if (!vis.includes(control)) {
                    this.CONTROL_VISIBILITY[tag].push(control);
                }
            });
        });
        this.init();
    }

    init() {
        this.setupControls();
        this.setupEventListeners();
        this.showPlaceholder();
        this.setupCollapsibleGroups();
        this.ensureFontsLoaded();
    }

    ensureFontsLoaded() {
        // Check if fonts are loaded and ready
        if ('fonts' in document) {
            const fontFamilies = [
                // Sans Serif
                'Inter', 'Roboto', 'Open Sans', 'Lato', 'Montserrat', 'Oswald', 
                'PT Sans', 'Ubuntu', 'Varela', 'Varela Round', 'Exo', 'Droid Sans',
                'Raleway', 'Poppins', 'Quicksand',
                // Serif
                'Merriweather', 'PT Serif', 'Vollkorn', 'Bitter', 'Droid Serif', 
                'Lora', 'Abril Fatface', 'Playfair Display',
                // Display & Script
                'Bebas Neue', 'Changa One', 'Pacifico', 'Dancing Script', 
                'Great Vibes', 'Caveat',
                // Monospace
                'Fira Mono', 'Space Mono', 'Inconsolata'
            ];
            
            Promise.all(fontFamilies.map(font => 
                document.fonts.load(`400 16px "${font}"`)
            )).then(() => {
                // Removed: console.log('All Google Fonts loaded successfully');
            }).catch(err => {
                console.warn('Some fonts may not be loaded:', err);
            });
        }
        
        // Validate font selector for duplicates
        this.validateFontSelector();
        
        // Validate font weight selector for duplicates
        this.validateFontWeightSelector();
    }

    validateFontSelector() {
        const fontSelect = document.getElementById('fontFamily');
        if (!fontSelect) return;

        const allFonts = new Set();
        const duplicates = [];
        const fontNames = [];

        // Collect all font names from options
        for (let option of fontSelect.options) {
            if (option.value === 'custom') continue;
            
            // Extract the primary font name (before the first comma)
            const fontName = option.value.split(',')[0].replace(/['"]/g, '').trim();
            fontNames.push(fontName);
            
            if (allFonts.has(fontName)) {
                duplicates.push(fontName);
            } else {
                allFonts.add(fontName);
            }
        }
        // No logging in production
    }

    validateFontWeightSelector() {
        const fontWeightSelect = document.getElementById('fontWeight');
        if (!fontWeightSelect) return;

        const allWeights = new Set();
        const duplicates = [];
        const weightValues = [];

        // Collect all weight values from options
        for (let option of fontWeightSelect.options) {
            const weightValue = option.value;
            weightValues.push(weightValue);
            
            if (allWeights.has(weightValue)) {
                duplicates.push(weightValue);
            } else {
                allWeights.add(weightValue);
            }
        }
        // No logging in production
        // (weight distribution logic is kept for possible future use, but not logged)
        // const numericWeights = weightValues.filter(w => !isNaN(w)).sort((a, b) => a - b);
        // const relativeWeights = weightValues.filter(w => isNaN(w) && !['inherit', 'initial', 'unset'].includes(w));
        // const cssValues = weightValues.filter(w => ['inherit', 'initial', 'unset'].includes(w));
    }

    setupControls() {
        // Typography controls
        this.controls.set('fontSize', {
            element: document.getElementById('fontSize'),
            property: 'fontSize',
            unit: 'px',
            valueDisplay: document.querySelector('#fontSize + .value')
        });

        this.controls.set('fontWeight', {
            element: document.getElementById('fontWeight'),
            property: 'fontWeight',
            unit: ''
        });

        this.controls.set('textColor', {
            element: document.getElementById('textColor'),
            property: 'color',
            unit: ''
        });

        // Layout controls
        this.controls.set('display', {
            element: document.getElementById('display'),
            property: 'display',
            unit: ''
        });

        this.controls.set('width', {
            element: document.getElementById('width'),
            property: 'width',
            unit: ''
        });

        this.controls.set('height', {
            element: document.getElementById('height'),
            property: 'height',
            unit: ''
        });

        // Spacing controls
        this.controls.set('margin', {
            element: document.getElementById('margin'),
            property: 'margin',
            unit: ''
        });

        this.controls.set('padding', {
            element: document.getElementById('padding'),
            property: 'padding',
            unit: ''
        });

        // Background controls
        this.controls.set('backgroundColor', {
            element: document.getElementById('backgroundColor'),
            property: 'backgroundColor',
            unit: ''
        });

        // Border controls
        this.controls.set('borderWidth', {
            element: document.getElementById('borderWidth'),
            property: 'borderWidth',
            unit: 'px',
            valueDisplay: document.querySelector('#borderWidth + .value')
        });

        this.controls.set('borderStyle', {
            element: document.getElementById('borderStyle'),
            property: 'borderStyle',
            unit: ''
        });

        this.controls.set('borderColor', {
            element: document.getElementById('borderColor'),
            property: 'borderColor',
            unit: ''
        });

        this.controls.set('outline', {
            element: document.getElementById('outline'),
            property: 'outline',
            unit: ''
        });
        // Positioning controls
        this.controls.set('position', {
            element: document.getElementById('position'),
            property: 'position',
            unit: ''
        });
        this.controls.set('top', {
            element: document.getElementById('top'),
            property: 'top',
            unit: '' // Support px, %, auto, etc.
        });
        this.controls.set('right', {
            element: document.getElementById('right'),
            property: 'right',
            unit: '' // Support px, %, auto, etc.
        });
        this.controls.set('bottom', {
            element: document.getElementById('bottom'),
            property: 'bottom',
            unit: '' // Support px, %, auto, etc.
        });
        this.controls.set('left', {
            element: document.getElementById('left'),
            property: 'left',
            unit: '' // Support px, %, auto, etc.
        });
        this.controls.set('zIndex', {
            element: document.getElementById('zIndex'),
            property: 'zIndex',
            unit: '' // Support numbers, auto, etc.
        });
        // Update CONTROL_VISIBILITY to include Positioning controls after margin/padding for relevant tags
        const positioningKeys = ['position','top','right','bottom','left','zIndex'];
        const tagsWithPositioning = [
            'button','a','h1','h2','h3','h4','h5','h6','p','span','div','img','input','label','ul','ol','li','form','section','nav','footer','header','default'
        ];
        tagsWithPositioning.forEach(tag => {
            const vis = this.CONTROL_VISIBILITY[tag] || [];
            // Find last index of margin or padding
            let idx = Math.max(vis.lastIndexOf('padding'), vis.lastIndexOf('margin'));
            if (idx !== -1) {
                this.CONTROL_VISIBILITY[tag] = [
                    ...vis.slice(0, idx + 1),
                    ...positioningKeys,
                    ...vis.slice(idx + 1)
                ];
            } else {
                this.CONTROL_VISIBILITY[tag] = [...vis, ...positioningKeys];
            }
        });
        // Event listeners for interaction controls
        ['cursor','pointerEvents','userSelect','touchAction','draggable'].forEach(key => {
            const control = this.controls.get(key);
            if (!control || !control.element) return;
            control.element.addEventListener('change', (e) => {
                this.handleStyleChange(key, e.target.value);
            });
        });
    }

    setupEventListeners() {
        this.controls.forEach((control, key) => {
            if (!control.element) return;
            // Use 'input' for all controls for instant feedback
            const eventType = ['range', 'color', 'text'].includes(control.element.type) ? 'input' : 'change';
            // Skip boxShadow/filter here, handled below
            if (key === 'boxShadow' || key === 'filter') return;
            control.element.addEventListener(eventType, (e) => {
                if (control.element.type === 'text') {
                    this.debouncedStyleChange(key, e.target.value);
                } else {
                    this.handleStyleChange(key, e.target.value);
                }
            });
        });

        // Smart Unit System Event Listeners
        this.setupSmartUnitSystem();

        // Box Shadow logic
        const boxShadowSelect = document.getElementById('boxShadowSelect');
        const boxShadowCustom = document.getElementById('boxShadowCustom');
        const boxShadowPresets = [
            { value: 'none', label: 'None' },
            { value: '0 1px 3px #0002', label: 'Subtle' },
            { value: '0 2px 8px #0003', label: 'Medium' },
            { value: '0 4px 16px #0004', label: 'Strong' },
            { value: '0 0 0 2px #38bdf8', label: 'Outline' }
        ];
        if (boxShadowSelect && boxShadowCustom) {
            boxShadowSelect.addEventListener('change', (e) => {
                if (boxShadowSelect.value === 'custom') {
                    boxShadowCustom.style.display = '';
                    this.handleStyleChange('boxShadow', boxShadowCustom.value);
                    this.adaptSectionForCustomInput(boxShadowSelect);
                    boxShadowCustom.focus();
                } else {
                    boxShadowCustom.style.display = 'none';
                    this.handleStyleChange('boxShadow', boxShadowSelect.value);
                    this.removeCustomInputAdaptation(boxShadowSelect);
                }
            });
            boxShadowCustom.addEventListener('input', (e) => {
                const val = boxShadowCustom.value;
                const preset = boxShadowPresets.find(p => p.value === val);
                if (preset) {
                    boxShadowSelect.value = preset.value;
                } else {
                    boxShadowSelect.value = 'custom';
                }
                this.handleStyleChange('boxShadow', val);
            });
        }
        // Filter logic
        const filterSelect = document.getElementById('filterSelect');
        const filterCustom = document.getElementById('filterCustom');
        const filterPresets = [
            { value: 'none', label: 'None' },
            { value: 'blur(4px)', label: 'Blur' },
            { value: 'grayscale(1)', label: 'Grayscale' },
            { value: 'brightness(1.2)', label: 'Brighten' },
            { value: 'contrast(1.5)', label: 'Contrast' },
            { value: 'sepia(1)', label: 'Sepia' }
        ];
        if (filterSelect && filterCustom) {
            filterSelect.addEventListener('change', (e) => {
                let val = filterSelect.value;
                // CSS filter expects space-separated, not comma-separated, for multiple filters
                if (val && val !== 'custom') val = val.replace(/,/g, ' ');
                if (filterSelect.value === 'custom') {
                    filterCustom.style.display = '';
                    let customVal = filterCustom.value.replace(/,/g, ' ');
                    this.handleStyleChange('filter', customVal);
                    this.adaptSectionForCustomInput(filterSelect);
                    filterCustom.focus();
                } else {
                    filterCustom.style.display = 'none';
                    this.handleStyleChange('filter', val);
                    this.removeCustomInputAdaptation(filterSelect);
                }
            });
            filterCustom.addEventListener('input', (e) => {
                let val = filterCustom.value.replace(/,/g, ' ');
                const preset = filterPresets.find(p => p.value === val);
                if (preset) {
                    filterSelect.value = preset.value;
                } else {
                    filterSelect.value = 'custom';
                }
                this.handleStyleChange('filter', val);
            });
        }
        // Opacity range value display
        const opacityInput = document.getElementById('opacity');
        if (opacityInput) {
            opacityInput.addEventListener('input', (e) => {
                const valueSpan = document.getElementById('opacityValue');
                if (valueSpan) valueSpan.textContent = e.target.value;
            });
        }
        // In setupEventListeners, handle new controls
        // Font Family
        const fontFamily = this.controls.get('fontFamily');
        if (fontFamily && fontFamily.element && fontFamily.customElement) {
            fontFamily.element.addEventListener('change', (e) => {
                if (fontFamily.element.value === 'custom') {
                    fontFamily.customElement.style.display = '';
                    if (fontFamily.customElement.value) {
                    this.handleStyleChange('fontFamily', fontFamily.customElement.value);
                    }
                    this.adaptSectionForCustomInput(fontFamily.element);
                    fontFamily.customElement.focus();
                } else {
                    fontFamily.customElement.style.display = 'none';
                    this.handleStyleChange('fontFamily', fontFamily.element.value);
                    this.removeCustomInputAdaptation(fontFamily.element);
                }
            });
            fontFamily.customElement.addEventListener('input', (e) => {
                if (e.target.value.trim()) {
                    this.handleStyleChange('fontFamily', e.target.value);
                fontFamily.element.value = 'custom';
                }
            });
            fontFamily.customElement.addEventListener('blur', (e) => {
                if (!e.target.value.trim()) {
                    fontFamily.customElement.style.display = 'none';
                    fontFamily.element.value = 'Inter, sans-serif';
                    this.handleStyleChange('fontFamily', 'Inter, sans-serif');
                    this.removeCustomInputAdaptation(fontFamily.element);
                }
            });
        }
        // Line Height
        const lineHeight = this.controls.get('lineHeight');
        if (lineHeight && lineHeight.element) {
            lineHeight.element.addEventListener('input', (e) => {
                this.handleStyleChange('lineHeight', e.target.value);
            });
        }
        // Letter Spacing
        const letterSpacing = this.controls.get('letterSpacing');
        if (letterSpacing && letterSpacing.element) {
            letterSpacing.element.addEventListener('input', (e) => {
                this.handleStyleChange('letterSpacing', e.target.value);
            });
        }
        // Text Align (button group)
        const textAlign = this.controls.get('textAlign');
        if (textAlign && textAlign.element) {
            textAlign.element.querySelectorAll('.text-align-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    textAlign.element.querySelectorAll('.text-align-btn').forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');
                    this.handleStyleChange('textAlign', btn.dataset.value);
                });
            });
        }
        // Text Transform
        const textTransform = this.controls.get('textTransform');
        if (textTransform && textTransform.element) {
            textTransform.element.addEventListener('change', (e) => {
                this.handleStyleChange('textTransform', e.target.value);
            });
        }
        // Text Content (for text elements)
        const textContent = this.controls.get('textContent');
        if (textContent && textContent.element) {
            textContent.element.addEventListener('input', (e) => {
                if (!this.selectedElement) return;
                if (this.app.renderer) {
                    this.app.renderer.updateElementText(this.selectedElement.selector, e.target.value);
                }
            });
        }
        // Positioning controls event listeners
        ['position','top','right','bottom','left','zIndex'].forEach(key => {
            const control = this.controls.get(key);
            if (!control || !control.element) return;
            let eventType = 'input';
            if (key === 'position') eventType = 'change';
            control.element.addEventListener(eventType, (e) => {
                this.handleStyleChange(key, e.target.value);
            });
        });

        // Event listeners for interaction controls
        ['cursor','pointerEvents','userSelect'].forEach(key => {
            const control = this.controls.get(key);
            if (!control || !control.element) return;
            control.element.addEventListener('change', (e) => {
                this.handleStyleChange(key, e.target.value);
            });
        });
        // Event listeners for overflow and visibility controls
        ['overflow','visibility'].forEach(key => {
            const control = this.controls.get(key);
            if (!control || !control.element) return;
            control.element.addEventListener('change', (e) => {
                this.handleStyleChange(key, e.target.value);
            });
        });
        
        // Event listeners for interaction controls (including resize)
        ['cursor','pointerEvents','userSelect','touchAction','draggable','resize'].forEach(key => {
            const control = this.controls.get(key);
            if (!control || !control.element) return;
            control.element.addEventListener('change', (e) => {
                this.handleStyleChange(key, e.target.value);
            });
        });
        
        // Event listeners for effects controls
        ['borderRadius','boxShadow','opacity','filter','willChange','transform','transition'].forEach(key => {
            const control = this.controls.get(key);
            if (!control || !control.element) return;
            control.element.addEventListener('change', (e) => {
                this.handleStyleChange(key, e.target.value);
            });
        });
        
        // Setup custom input functionality for effects controls
        this.setupCustomInputs();
        
        // Handle window resize for custom input adaptation
        window.addEventListener('resize', () => {
            this.handleResizeForCustomInputs();
        });
        // Add to CONTROL_VISIBILITY for all relevant tags (add to default and common tags)
        this.CONTROL_VISIBILITY = {
            'button': [...this.CONTROL_VISIBILITY['button'], 'borderRadius', 'boxShadow', 'opacity', 'filter'],
            'a': [...this.CONTROL_VISIBILITY['a'], 'borderRadius', 'boxShadow', 'opacity', 'filter'],
            'h1': [...this.CONTROL_VISIBILITY['h1'], 'borderRadius', 'boxShadow', 'opacity', 'filter'],
            'h2': [...this.CONTROL_VISIBILITY['h2'], 'borderRadius', 'boxShadow', 'opacity', 'filter'],
            'h3': [...this.CONTROL_VISIBILITY['h3'], 'borderRadius', 'boxShadow', 'opacity', 'filter'],
            'h4': [...this.CONTROL_VISIBILITY['h4'], 'borderRadius', 'boxShadow', 'opacity', 'filter'],
            'h5': [...this.CONTROL_VISIBILITY['h5'], 'borderRadius', 'boxShadow', 'opacity', 'filter'],
            'h6': [...this.CONTROL_VISIBILITY['h6'], 'borderRadius', 'boxShadow', 'opacity', 'filter'],
            'p': [...this.CONTROL_VISIBILITY['p'], 'borderRadius', 'boxShadow', 'opacity', 'filter'],
            'span': [...this.CONTROL_VISIBILITY['span'], 'borderRadius', 'boxShadow', 'opacity', 'filter'],
            'div': [...this.CONTROL_VISIBILITY['div'], 'borderRadius', 'boxShadow', 'opacity', 'filter'],
            'img': [...this.CONTROL_VISIBILITY['img'], 'borderRadius', 'boxShadow', 'opacity', 'filter'],
            'input': [...this.CONTROL_VISIBILITY['input'], 'borderRadius', 'boxShadow', 'opacity', 'filter'],
            'label': [...this.CONTROL_VISIBILITY['label'], 'borderRadius', 'boxShadow', 'opacity', 'filter'],
            'ul': [...this.CONTROL_VISIBILITY['ul'], 'borderRadius', 'boxShadow', 'opacity', 'filter'],
            'ol': [...this.CONTROL_VISIBILITY['ol'], 'borderRadius', 'boxShadow', 'opacity', 'filter'],
            'li': [...this.CONTROL_VISIBILITY['li'], 'borderRadius', 'boxShadow', 'opacity', 'filter'],
            'form': [...this.CONTROL_VISIBILITY['form'], 'borderRadius', 'boxShadow', 'opacity', 'filter'],
            'section': [...this.CONTROL_VISIBILITY['section'], 'borderRadius', 'boxShadow', 'opacity', 'filter'],
            'nav': [...this.CONTROL_VISIBILITY['nav'], 'borderRadius', 'boxShadow', 'opacity', 'filter'],
            'footer': [...this.CONTROL_VISIBILITY['footer'], 'borderRadius', 'boxShadow', 'opacity', 'filter'],
            'header': [...this.CONTROL_VISIBILITY['header'], 'borderRadius', 'boxShadow', 'opacity', 'filter'],
            'default': [...this.CONTROL_VISIBILITY['default'], 'borderRadius', 'boxShadow', 'opacity', 'filter']
        };
    }

    setupSmartUnitSystem() {
        // Store last numeric value for each field
        const lastNumericValue = {};
        // --- Smart Unit Configs and Disable Units (declare only once) ---
        const smartUnitConfigs = {
            'fontSize': { type: 'size', defaultUnit: 'px' },
            'lineHeight': { type: 'line-height', defaultUnit: '' },
            'letterSpacing': { type: 'spacing', defaultUnit: 'px' },
            'width': { type: 'dimension', defaultUnit: '%' },
            'height': { type: 'dimension', defaultUnit: '%' },
            'margin': { type: 'spacing-multi', defaultUnit: 'px' },
            'padding': { type: 'spacing-multi', defaultUnit: 'px' },
            'top': { type: 'position', defaultUnit: 'px' },
            'right': { type: 'position', defaultUnit: 'px' },
            'bottom': { type: 'position', defaultUnit: 'px' },
            'left': { type: 'position', defaultUnit: 'px' },
            'zIndex': { type: 'z-index', defaultUnit: '' },
            'borderWidth': { type: 'border', defaultUnit: 'px' },
            'borderRadius': { type: 'radius', defaultUnit: 'px' }
        };
        const disableInputUnits = ['auto', 'fit-content', 'max-content', 'min-content', 'inherit', 'initial', 'unset'];
        // Letter Spacing special mode (normal/custom)
        const letterSpacingMode = document.getElementById('letterSpacingMode');
        const letterSpacingInput = document.getElementById('letterSpacing');
        const letterSpacingUnit = document.getElementById('letterSpacingUnit');
        if (letterSpacingMode && letterSpacingInput && letterSpacingUnit) {
            letterSpacingMode.addEventListener('change', (e) => {
                if (letterSpacingMode.value === 'normal') {
                    lastNumericValue['letterSpacing'] = letterSpacingInput.value;
                    letterSpacingInput.disabled = true;
                    letterSpacingUnit.disabled = true;
                    letterSpacingInput.value = 'normal';
                    this.handleStyleChange('letterSpacing', 'normal');
                } else {
                    letterSpacingInput.disabled = false;
                    letterSpacingUnit.disabled = false;
                    letterSpacingInput.value = '';
                    this.handleStyleChange('letterSpacing', '');
                }
            });
            // On page load, set correct state
            if (letterSpacingMode.value === 'normal') {
                letterSpacingInput.disabled = true;
                letterSpacingUnit.disabled = true;
                letterSpacingInput.value = 'normal';
            }
            // When input or unit changes, update style if in custom mode
            letterSpacingInput.addEventListener('input', () => {
                if (letterSpacingMode.value === 'custom') {
                    lastNumericValue['letterSpacing'] = letterSpacingInput.value;
                    this.handleStyleChange('letterSpacing', letterSpacingInput.value + letterSpacingUnit.value);
                }
            });
            letterSpacingUnit.addEventListener('change', () => {
                if (letterSpacingMode.value === 'custom') {
                    this.handleStyleChange('letterSpacing', letterSpacingInput.value + letterSpacingUnit.value);
                }
            });
        }
        // --- Smart Unit System for all other fields ---
        Object.keys(smartUnitConfigs).forEach(fieldName => {
            if (fieldName === 'letterSpacing') return; // handled above
            const input = document.getElementById(fieldName);
            const unitSelect = document.getElementById(fieldName + 'Unit');
            if (!input || !unitSelect) return;
            const config = smartUnitConfigs[fieldName];
            const smartUnitContainer = input.closest('.smart-unit-input');
            if (!smartUnitContainer) return;
            smartUnitContainer.setAttribute('data-unit-type', config.type);
            unitSelect.addEventListener('change', (e) => {
                const selectedUnit = e.target.value;
                if (disableInputUnits.includes(selectedUnit)) {
                    lastNumericValue[fieldName] = input.value;
                    input.disabled = true;
                    input.value = selectedUnit;
                    smartUnitContainer.classList.add('auto-selected');
                    this.handleStyleChange(fieldName, selectedUnit);
                } else {
                    input.disabled = false;
                    smartUnitContainer.classList.remove('auto-selected');
                    input.value = '';
                    this.handleStyleChange(fieldName, '');
                }
            });
            input.addEventListener('input', (e) => {
                const value = e.target.value;
                const selectedUnit = unitSelect.value;
                if (disableInputUnits.includes(selectedUnit)) return;
                lastNumericValue[fieldName] = value;
                const cleanValue = value.replace(/[^0-9.-]/g, '');
                const parts = cleanValue.split('.');
                if (parts.length > 2) {
                    input.value = parts[0] + '.' + parts.slice(1).join('');
                    return;
                }
                if (cleanValue.startsWith('-')) {
                    const withoutMinus = cleanValue.substring(1);
                    if (withoutMinus.includes('-')) {
                        input.value = '-' + withoutMinus.replace(/-/g, '');
                        return;
                    }
                } else if (cleanValue.includes('-')) {
                    input.value = cleanValue.replace(/-/g, '');
                    return;
                }
                if (value !== cleanValue) {
                    input.value = cleanValue;
                }
                if (config.type === 'z-index') {
                    if (/^-?\d+$/.test(cleanValue)) {
                        this.handleStyleChange(fieldName, cleanValue);
                    }
                } else if (config.type === 'spacing-multi') {
                    const multiValue = cleanValue.replace(/[^0-9.\- ]/g, '');
                    if (multiValue) {
                        this.handleStyleChange(fieldName, multiValue + selectedUnit);
                    }
                } else {
                    if (cleanValue && /^-?\d+(\.\d+)?$/.test(cleanValue)) {
                        this.handleStyleChange(fieldName, cleanValue + selectedUnit);
                    } else if (cleanValue === '') {
                        this.handleStyleChange(fieldName, '');
                    }
                }
            });

        });
    }

    debouncedStyleChange(key, value) {
        // Clear existing timer
        if (this.debounceTimers.has(key)) {
            clearTimeout(this.debounceTimers.get(key));
        }

        // Set new timer
        const timer = setTimeout(() => {
            this.handleStyleChange(key, value);
            this.debounceTimers.delete(key);
        }, 300);

        this.debounceTimers.set(key, timer);
    }

    handleStyleChange(key, value) {
        if (!this.selectedElement) return;
        const control = this.controls.get(key);
        if (!control) return;
        let formattedValue = value;
        // Robust normalization for px, em, rem, %
        if (control.unit && value) {
            let num = String(value).replace(/[^0-9.]/g, '');
            if (num) {
                formattedValue = num + control.unit;
            } else {
                formattedValue = '';
            }
        }
        // Special handling for margin and padding: allow multi-value and auto, but default to px for numbers
        if ((key === 'margin' || key === 'padding') && value) {
            formattedValue = value.trim().split(/\s+/).map(v => {
                if (v === 'auto') return 'auto';
                if (/^-?\d+(\.\d+)?$/.test(v)) return v + 'px';
                return v;
            }).join(' ');
        }
        // Special handling for width and height: allow keywords and default to px for numbers
        if ((key === 'width' || key === 'height') && value) {
            const allowedKeywords = ['auto', 'fit-content', 'max-content', 'min-content', 'inherit', 'initial', 'unset'];
            let v = value.trim();
            if (allowedKeywords.includes(v)) {
                formattedValue = v;
            } else if (/^-?\d+(\.\d+)?$/.test(v)) {
                formattedValue = v + 'px';
            } else {
                formattedValue = v; // Pass through if already has unit
            }
        }
        if (key === 'textContent') {
            // Trim leading spaces for text content
            formattedValue = formattedValue.replace(/^\s+/, '');
        }
        // Special handling for positioning offsets: allow units (px, %, em, rem, etc.), default to px for numbers
        if (['top','right','bottom','left'].includes(key) && value) {
            let v = value.trim();
            if (/^-?\d+(\.\d+)?$/.test(v)) {
                formattedValue = v + 'px';
            } else if (/^-?\d+(\.\d+)?(px|%|em|rem|vw|vh)$/.test(v)) {
                formattedValue = v;
            } else {
                formattedValue = v; // Pass through for custom units
            }
            // --- Auto-set position to relative if static ---
            const posCtrl = this.controls.get('position');
            if (posCtrl && posCtrl.element && (posCtrl.element.value === '' || posCtrl.element.value === 'static')) {
                posCtrl.element.value = 'relative';
                // Also update the renderer and export with the new position
                if (this.app.renderer) {
                    this.app.renderer.updateElementStyles(this.selectedElement.selector, { position: 'relative' });
                }
                if (this.app.fileHandler && this.app.activeFile) {
                    this.app.fileHandler.updateFile(this.app.activeFile, {
                        [this.selectedElement.selector]: { position: 'relative' }
                    });
                }
            }
        }
        // Special handling for zIndex: integer or keywords
        if (key === 'zIndex' && value) {
            let v = value.trim();
            const allowedKeywords = ['auto', 'inherit', 'initial', 'unset'];
            if (allowedKeywords.includes(v)) {
                formattedValue = v;
            } else if (/^-?\d+$/.test(v)) {
                formattedValue = v;
            } else {
                formattedValue = parseInt(v) || 0;
            }
        }
        // --- Normalization for interaction controls ---
        if (key === 'cursor' && value) {
            // Allow all standard and advanced cursor values
            const allowed = [
                'default','pointer','text','move','not-allowed','grab','grabbing','crosshair','help','wait','progress','cell','vertical-text','alias','copy','zoom-in','zoom-out','col-resize','row-resize','ew-resize','ns-resize','nesw-resize','nwse-resize','no-drop','all-scroll','context-menu'
            ];
            if (!allowed.includes(value)) formattedValue = 'default';
        }
        if (key === 'pointerEvents' && value) {
            const allowed = [
                'auto','none','visiblePainted','visibleFill','visibleStroke','painted','fill','stroke','all','inherit','initial','unset'
            ];
            if (!allowed.includes(value)) formattedValue = 'auto';
        }
        if (key === 'userSelect' && value) {
            const allowed = ['auto','none','text','all','contain'];
            if (!allowed.includes(value)) formattedValue = 'auto';
        }
        if (key === 'overflow' && value) {
            const allowed = ['visible','hidden','scroll','auto','clip','inherit','initial','unset'];
            if (!allowed.includes(value)) formattedValue = 'visible';
        }
        if (key === 'visibility' && value) {
            const allowed = ['visible','hidden','collapse','inherit','initial','unset'];
            if (!allowed.includes(value)) formattedValue = 'visible';
        }
        if (key === 'display' && value) {
            const allowed = [
                'block','inline','inline-block','flex','inline-flex','grid','inline-grid','table','table-row','table-cell','list-item','contents','flow-root','none','inherit','initial','unset'
            ];
            if (!allowed.includes(value)) formattedValue = 'block';
        }
        if (control.valueDisplay) {
            control.valueDisplay.textContent = formattedValue;
        }
        // --- Always update renderer and store in modifications for export ---
        // For body or html: always send all current values for all visible controls
        if (this.selectedElement.selector === 'body' || this.selectedElement.selector === 'html') {
            const tag = this.selectedElement.selector;
            const visibleKeys = this.CONTROL_VISIBILITY[tag] || this.CONTROL_VISIBILITY['default'];
            const styleUpdate = {};
            visibleKeys.forEach(ctrlKey => {
                const ctrl = this.controls.get(ctrlKey);
                if (!ctrl || !ctrl.property || !ctrl.element) return;
                let val = ctrl.element.value;
                // Normalize px for fontSize, letterSpacing, lineHeight, borderWidth, borderRadius
                if ((ctrl.property === 'fontSize' || ctrl.property === 'letterSpacing' || ctrl.property === 'borderWidth' || ctrl.property === 'borderRadius') && val && !val.endsWith('px')) {
                    val = val + 'px';
                }
                if (ctrl.property === 'lineHeight' && val && !isNaN(val) && !val.endsWith('px')) {
                    val = val + 'px';
                }
                styleUpdate[ctrl.property] = val;
            });
            // Overwrite the property being changed with the new value
            styleUpdate[control.property] = formattedValue;
            if (this.app.renderer) {
                this.app.renderer.updateElementStyles(tag, styleUpdate);
            }
            if (this.app.fileHandler && this.app.activeFile) {
                this.app.fileHandler.updateFile(this.app.activeFile, {
                    [tag]: styleUpdate
                });
            }
            return;
        } else if ([
            'position','top','right','bottom','left','zIndex'
        ].includes(key)) {
            // For Positioning fields, always send the full set of Positioning properties
            const positioningKeys = ['position','top','right','bottom','left','zIndex'];
            const styleUpdate = {};
            positioningKeys.forEach(ctrlKey => {
                const ctrl = this.controls.get(ctrlKey);
                if (!ctrl || !ctrl.property || !ctrl.element) return;
                let val = ctrl.element.value;
                // Normalize px for offsets
                if (['top','right','bottom','left'].includes(ctrl.property) && val && !val.match(/(px|%|em|rem|vw|vh)$/)) {
                    if (/^-?\d+(\.\d+)?$/.test(val)) val = val + 'px';
                }
                // Integer for zIndex
                if (ctrl.property === 'zIndex' && val && !/^\d+$/.test(val)) {
                    val = parseInt(val) || 0;
                }
                styleUpdate[ctrl.property] = val;
            });
            // Overwrite the property being changed with the new value
            styleUpdate[control.property] = formattedValue;
            if (this.app.renderer) {
                this.app.renderer.updateElementStyles(this.selectedElement.selector, styleUpdate);
            }
            if (this.app.fileHandler && this.app.activeFile) {
                this.app.fileHandler.updateFile(this.app.activeFile, {
                    [this.selectedElement.selector]: styleUpdate
                });
            }
            return;
        }
        // Default: update only the changed property
        if (this.app.renderer) {
            this.app.renderer.updateElementStyles(this.selectedElement.selector, {
                [control.property]: formattedValue
            });
        }
        // Store in modifications for export
        if (this.app.fileHandler && this.app.activeFile) {
            this.app.fileHandler.updateFile(this.app.activeFile, {
                [this.selectedElement.selector]: {
                    [control.property]: formattedValue
                }
            });
        }
        // Special handling for letterSpacing: allow 'normal' keyword
        if (key === 'letterSpacing' && value === 'normal') {
            if (this.app.renderer) {
                this.app.renderer.updateElementStyles(this.selectedElement.selector, { letterSpacing: 'normal' });
            }
            if (this.app.fileHandler && this.app.activeFile) {
                this.app.fileHandler.updateFile(this.app.activeFile, {
                    [this.selectedElement.selector]: { letterSpacing: 'normal' }
                });
            }
            return;
        }
    }

    updateSelectedElement(elementData) {
        this.selectedElement = elementData;
        this.showElementInfo(elementData);
        this.updateControlValues(elementData);
        this.updateControlVisibility(elementData);
        
        // Show style editor sections
        const styleGroups = document.getElementById('styleGroups');
        if (styleGroups) styleGroups.style.display = '';
        // Set text content for text elements
        const textContent = this.controls.get('textContent');
        if (textContent && textContent.element) {
            if ([
                'button','a','h1','h2','h3','h4','h5','h6','p','span','label','li'
            ].includes((elementData.tagName||'').toLowerCase())) {
                // Always show the current text content from the selected element, trimmed
                let rawText = elementData.textContent || (elementData.element && elementData.element.textContent) || '';
                textContent.element.value = rawText.replace(/^\s+/, '');
                textContent.element.parentElement.style.display = '';
            } else {
                textContent.element.value = '';
                textContent.element.parentElement.style.display = 'none';
            }
        }
    }

    showElementInfo(elementData) {
        const infoContainer = document.getElementById('elementInfo');
        if (!infoContainer) return;

        const { tagName, id, className, selector } = elementData;
        
        infoContainer.innerHTML = `
            <div class="element-tag">${tagName}</div>
            <div class="element-details">
                <div><strong>Selector:</strong> ${selector}</div>
                ${id ? `<div><strong>ID:</strong> ${id}</div>` : ''}
                ${className ? `<div><strong>Classes:</strong> ${className}</div>` : ''}
            </div>
        `;
    }

    updateControlValues(elementData) {
        const styles = elementData.styles;
        // Use modifications as source of truth if available
        let mod = {};
        if (this.app.fileHandler && this.app.activeFile) {
            const fileData = this.app.fileHandler.app.currentFiles.get(this.app.activeFile);
            if (fileData && fileData.modifications && typeof fileData.modifications.get === 'function' && fileData.modifications.has(elementData.selector)) {
                mod = fileData.modifications.get(elementData.selector);
            }
        }
        
        // --- Smart Unit System: Update controls with proper unit handling ---
        this.updateSmartUnitControl('fontSize', mod.fontSize !== undefined ? mod.fontSize : styles.fontSize, '16px');
        this.updateSmartUnitControl('lineHeight', mod.lineHeight !== undefined ? mod.lineHeight : styles.lineHeight, '1.5');
        this.updateSmartUnitControl('letterSpacing', mod.letterSpacing !== undefined ? mod.letterSpacing : styles.letterSpacing, '0px');
        this.updateSmartUnitControl('width', mod.width !== undefined ? mod.width : styles.width, 'auto');
        this.updateSmartUnitControl('height', mod.height !== undefined ? mod.height : styles.height, 'auto');
        this.updateSmartUnitControl('margin', mod.margin !== undefined ? mod.margin : styles.margin, '0px');
        this.updateSmartUnitControl('padding', mod.padding !== undefined ? mod.padding : styles.padding, '0px');
        this.updateSmartUnitControl('top', mod.top !== undefined ? mod.top : styles.top, 'auto');
        this.updateSmartUnitControl('right', mod.right !== undefined ? mod.right : styles.right, 'auto');
        this.updateSmartUnitControl('bottom', mod.bottom !== undefined ? mod.bottom : styles.bottom, 'auto');
        this.updateSmartUnitControl('left', mod.left !== undefined ? mod.left : styles.left, 'auto');
        this.updateSmartUnitControl('zIndex', mod.zIndex !== undefined ? mod.zIndex : styles.zIndex, '0');
        this.updateSmartUnitControl('borderWidth', mod.borderWidth !== undefined ? mod.borderWidth : styles.borderWidth, '0px');
        this.updateSmartUnitControl('borderRadius', mod.borderRadius !== undefined ? mod.borderRadius : styles.borderRadius, '0px');
        
        // --- Regular controls (non-smart unit) ---
        this.updateControl('fontWeight', mod.fontWeight !== undefined ? mod.fontWeight : (styles.fontWeight || '400'));
        this.updateControl('textColor', mod.color !== undefined ? mod.color : (this.rgbToHex(styles.color) || '#000000'));
        this.updateControl('fontFamily', mod.fontFamily !== undefined ? mod.fontFamily : (styles.fontFamily || 'Inter, sans-serif'));
        this.updateControl('textAlign', mod.textAlign !== undefined ? mod.textAlign : (styles.textAlign || 'left'));
        this.updateControl('textTransform', mod.textTransform !== undefined ? mod.textTransform : (styles.textTransform || 'none'));
        this.updateControl('display', mod.display !== undefined ? mod.display : styles.display);
        this.updateControl('backgroundColor', mod.backgroundColor !== undefined ? mod.backgroundColor : this.rgbToHex(styles.backgroundColor));
        this.updateControl('borderStyle', mod.borderStyle !== undefined ? mod.borderStyle : styles.borderStyle);
        this.updateControl('borderColor', mod.borderColor !== undefined ? mod.borderColor : this.rgbToHex(styles.borderColor));
        this.updateControl('outline', mod.outline !== undefined ? mod.outline : styles.outline);
        this.updateControl('position', mod.position !== undefined ? mod.position : styles.position);
        this.updateControl('cursor', mod.cursor !== undefined ? mod.cursor : styles.cursor);
        this.updateControl('pointerEvents', mod.pointerEvents !== undefined ? mod.pointerEvents : styles.pointerEvents);
        this.updateControl('userSelect', mod.userSelect !== undefined ? mod.userSelect : styles.userSelect);
        this.updateControl('touchAction', mod.touchAction !== undefined ? mod.touchAction : styles.touchAction);
        this.updateControl('draggable', mod.draggable !== undefined ? mod.draggable : styles.draggable);
        this.updateControl('overflow', mod.overflow !== undefined ? mod.overflow : styles.overflow);
        this.updateControl('visibility', mod.visibility !== undefined ? mod.visibility : styles.visibility);
        this.updateControl('resize', mod.resize !== undefined ? mod.resize : styles.resize);
        
        // Box Shadow
        const boxShadowSelect = document.getElementById('boxShadowSelect');
        const boxShadowCustom = document.getElementById('boxShadowCustom');
        const boxShadowPresets = ['none','0 1px 3px #0002','0 2px 8px #0003','0 4px 16px #0004','0 0 0 2px #38bdf8'];
        if (boxShadowSelect && boxShadowCustom) {
            if (boxShadowPresets.includes(mod.boxShadow !== undefined ? mod.boxShadow : styles.boxShadow)) {
                boxShadowSelect.value = mod.boxShadow !== undefined ? mod.boxShadow : styles.boxShadow;
                boxShadowCustom.style.display = 'none';
                boxShadowCustom.value = '';
            } else {
                boxShadowSelect.value = 'custom';
                boxShadowCustom.style.display = '';
                boxShadowCustom.value = mod.boxShadow !== undefined ? mod.boxShadow : (styles.boxShadow || '');
            }
        }
        
        // Filter
        const filterSelect = document.getElementById('filterSelect');
        const filterCustom = document.getElementById('filterCustom');
        // Dynamically get all filter preset values from the select (excluding 'custom')
        const filterPresets = filterSelect ? Array.from(filterSelect.options).map(opt => opt.value).filter(v => v !== 'custom') : [];
        const currentFilter = mod.filter !== undefined ? mod.filter : styles.filter;
        if (filterSelect && filterCustom) {
            if (filterPresets.includes(currentFilter)) {
                filterSelect.value = currentFilter;
                filterCustom.style.display = 'none';
                filterCustom.value = '';
            } else {
                filterSelect.value = 'custom';
                filterCustom.style.display = '';
                filterCustom.value = currentFilter || '';
            }
        }
        
        this.updateControl('boxShadow', mod.boxShadow !== undefined ? mod.boxShadow : styles.boxShadow);
        this.updateControl('opacity', mod.opacity !== undefined ? mod.opacity : styles.opacity);
        this.updateControl('filter', mod.filter !== undefined ? mod.filter : styles.filter);
        this.updateControl('willChange', mod.willChange !== undefined ? mod.willChange : styles.willChange);
        this.updateControl('transform', mod.transform !== undefined ? mod.transform : styles.transform);
        this.updateControl('transition', mod.transition !== undefined ? mod.transition : styles.transition);
        
        // Handle custom inputs for effects controls
        this.updateCustomInputs(mod, styles);
    }

    updateControl(key, value) {
        const control = this.controls.get(key);
        if (!control || !control.element) return;

        // Special handling for font family to match computed styles with select options
        if (key === 'fontFamily') {
            this.updateFontFamilyControl(value);
            return;
        }

        control.element.value = value || '';
        
        // Update value display for range inputs
        if (control.valueDisplay) {
            const displayValue = value ? value + (control.unit || '') : '0' + (control.unit || '');
            control.valueDisplay.textContent = displayValue;
        }
        // In updateControl, handle opacity range value display
        if (key === 'opacity') {
            const valueSpan = document.getElementById('opacityValue');
            if (valueSpan) valueSpan.textContent = value || '1';
        }
    }

    updateSmartUnitControl(fieldName, value, defaultValue) {
        const input = document.getElementById(fieldName);
        const unitSelect = document.getElementById(fieldName + 'Unit');
        if (!input || !unitSelect) return;
        const smartUnitContainer = input.closest('.smart-unit-input');
        if (!smartUnitContainer) return;
        const disableInputUnits = ['auto', 'fit-content', 'max-content', 'min-content', 'inherit', 'initial', 'unset'];
        // Handle empty or undefined values
        if (!value || value === 'initial' || value === 'unset') {
            value = defaultValue;
        }
        // Special handling for letterSpacing with normal/custom
        if (fieldName === 'letterSpacing') {
            const letterSpacingMode = document.getElementById('letterSpacingMode');
            if (letterSpacingMode) {
                if (value === 'normal') {
                    letterSpacingMode.value = 'normal';
                    input.disabled = true;
                    unitSelect.disabled = true;
                    input.value = 'normal';
                    smartUnitContainer.classList.add('auto-selected');
                    return;
                } else {
                    letterSpacingMode.value = 'custom';
                    input.disabled = false;
                    unitSelect.disabled = false;
                    smartUnitContainer.classList.remove('auto-selected');
                }
            }
        }
        // Parse the value and unit
        const parsed = this.parseValueAndUnit(value);
        // If the value is a keyword, set the dropdown and input accordingly
        if (disableInputUnits.includes(parsed.value) || disableInputUnits.includes(parsed.unit)) {
            unitSelect.value = parsed.value || parsed.unit;
            input.value = parsed.value || parsed.unit;
            input.disabled = true;
            smartUnitContainer.classList.add('auto-selected');
            return;
        }
        // For numeric/unit values
        input.disabled = false;
        smartUnitContainer.classList.remove('auto-selected');
        // Set the input value to the numeric part
        input.value = parsed.value || '';
        // Set the unit dropdown to the correct unit (or default)
        if (parsed.unit) {
            const option = Array.from(unitSelect.options).find(opt => opt.value === parsed.unit);
            if (option) {
                unitSelect.value = parsed.unit;
            } else {
                unitSelect.value = unitSelect.options[0].value;
            }
        } else {
            unitSelect.value = unitSelect.options[0].value;
        }
    }

    parseValueAndUnit(value) {
        if (!value) return { value: '', unit: '' };
        
        // Handle keywords
        const keywords = ['auto', 'fit-content', 'max-content', 'min-content', 'inherit', 'initial', 'unset'];
        if (keywords.includes(value)) {
            return { value: value, unit: '' };
        }

        // Handle unitless numbers (like line-height: 1.5)
        if (/^-?\d+(\.\d+)?$/.test(value)) {
            return { value: value, unit: '' };
        }

        // Handle values with units
        const match = value.match(/^(-?\d+(?:\.\d+)?)(.*)$/);
        if (match) {
            return { value: match[1], unit: match[2] };
        }

        // If no pattern matches, return as is
        return { value: value, unit: '' };
    }

    updateFontFamilyControl(computedFontFamily) {
        const fontFamilySelect = document.getElementById('fontFamily');
        const fontFamilyCustom = document.getElementById('fontFamilyCustom');
        
        if (!fontFamilySelect || !fontFamilyCustom) return;

        // Normalize the computed font family for matching
        const normalizedComputed = computedFontFamily ? computedFontFamily.toLowerCase().replace(/['"]/g, '') : '';
        
        // Try to find a matching option in the select
        let foundMatch = false;
        for (let option of fontFamilySelect.options) {
            if (option.value === 'custom') continue;
            
            const optionValue = option.value.toLowerCase().replace(/['"]/g, '');
            const optionName = option.text.toLowerCase().replace(/['"]/g, '');
            
            // Check if the computed font family matches this option
            if (normalizedComputed.includes(optionName) || optionValue.includes(normalizedComputed.split(',')[0])) {
                fontFamilySelect.value = option.value;
                fontFamilyCustom.style.display = 'none';
                foundMatch = true;
                break;
            }
        }
        
        // If no match found, use custom input
        if (!foundMatch && computedFontFamily) {
            fontFamilySelect.value = 'custom';
            fontFamilyCustom.value = computedFontFamily;
            fontFamilyCustom.style.display = '';
        } else if (!foundMatch) {
            // Default to Inter if no font family is set
            fontFamilySelect.value = 'Inter, sans-serif';
            fontFamilyCustom.style.display = 'none';
        }
    }

    parsePixelValue(value) {
        if (!value) return '';
        return parseFloat(value) || 0;
    }

    parseValue(value) {
        if (!value || value === 'auto' || value === 'none') return '';
        return value;
    }

    rgbToHex(rgb) {
        if (!rgb) return '#000000';
        
        // Handle hex colors
        if (rgb.startsWith('#')) return rgb;
        
        // Handle rgb/rgba colors
        const match = rgb.match(/rgba?\(([^)]+)\)/);
        if (!match) return '#000000';
        
        const values = match[1].split(',').map(v => parseInt(v.trim()));
        
        const toHex = (n) => {
            const hex = Math.max(0, Math.min(255, n)).toString(16);
            return hex.length === 1 ? '0' + hex : hex;
        };
        
        return `#${toHex(values[0])}${toHex(values[1])}${toHex(values[2])}`;
    }

    showPlaceholder() {
        const infoContainer = document.getElementById('elementInfo');
        if (!infoContainer) return;

        infoContainer.innerHTML = `
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

    clearSelection() {
        this.selectedElement = null;
        this.showPlaceholder();
        this.resetControls();
        // Hide style editor sections
        const styleGroups = document.getElementById('styleGroups');
        if (styleGroups) styleGroups.style.display = 'none';
    }

    resetControls() {
        this.controls.forEach((control, key) => {
            if (!control.element) return;
            
            // Reset to default values
            switch (control.element.type) {
                case 'range':
                    control.element.value = control.element.getAttribute('value') || '0';
                    break;
                case 'color':
                    control.element.value = '#000000';
                    break;
                case 'text':
                    control.element.value = '';
                    break;
                case 'select-one':
                    control.element.selectedIndex = 0;
                    break;
            }
            
            // Update value display
            if (control.valueDisplay) {
                control.valueDisplay.textContent = control.element.value + (control.unit || '');
            }
        });
    }

    deselectElement() {
        this.clearSelection();
        if (this.app.renderer) {
            this.app.renderer.deselectElement();
        }
    }

    // Reset element to original styles
    resetElement() {
        if (!this.selectedElement) return;
        
        if (this.app.renderer) {
            this.app.renderer.updateElementStyles(this.selectedElement.selector, {
                fontSize: '',
                fontWeight: '',
                color: '',
                backgroundColor: '',
                margin: '',
                padding: '',
                width: '',
                height: '',
                display: '',
                borderWidth: '',
                borderStyle: '',
                borderColor: ''
            });
        }
        
        this.resetControls();
    }

    updateControlVisibility(elementData) {
        // Always re-apply safe controls for <body> before any logic
        if ((elementData.tagName || '').toLowerCase() === 'body') {
            this.CONTROL_VISIBILITY['body'] = [
                // Typography (all except textContent)
                'fontSize','fontWeight','textColor','fontFamily','lineHeight','letterSpacing','textAlign','textTransform',
                // Background
                'backgroundColor',
                // Spacing
                'margin','padding',
                // Layout (only safe/meaningful controls for <body>)
                // 'width', // (optional, advanced)
                // 'height', // (optional, advanced)
                'overflow', // (recommended, safe)
                // 'visibility', // (optional, advanced)
                // Border
                'borderWidth','borderStyle','borderColor','borderRadius',
                // Effects
                'boxShadow','opacity','filter',
                // Positioning and Interaction controls intentionally excluded for <body> to avoid confusion
            ];
        }
        // Get tagName and controls to show
        const tag = (elementData.tagName || '').toLowerCase();
        const visibleControls = this.CONTROL_VISIBILITY[tag] || this.CONTROL_VISIBILITY['default'];
        // For each control, show/hide its .control-group parent
        this.controls.forEach((control, key) => {
            if (!control.element) return;
            // Find the closest .control-group parent
            let group = control.element.closest('.control-group');
            if (!group) return;
            // --- Always show typography controls for text elements ---
            const typographyKeys = [
                'fontFamily', 'lineHeight', 'letterSpacing', 'textAlign', 'textTransform'
            ];
            const textTags = [
                'button','a','h1','h2','h3','h4','h5','h6','p','span','label','li'
            ];
            if (typographyKeys.includes(key) && textTags.includes(tag)) {
                group.style.display = '';
            } else if (visibleControls.includes(key)) {
                group.style.display = '';
            } else {
                group.style.display = 'none';
            }
        });
        // Also hide empty style-groups if all their children are hidden
        document.querySelectorAll('.style-group').forEach(group => {
            const anyVisible = Array.from(group.querySelectorAll('.control-group')).some(cg => cg.style.display !== 'none');
            // Special case: hide Positioning section if none of its controls are visible
            if (group.dataset.group === 'positioning' && !anyVisible) {
                group.style.display = 'none';
                return;
            }
            // Special case: always hide Interaction section for <body>
            if ((elementData.tagName || '').toLowerCase() === 'body' && group.dataset.group === 'interaction') {
                group.style.display = 'none';
                return;
            }
            if (anyVisible) {
                group.style.display = '';
                // --- Apply user's preferred expand/collapse state ---
                const toggle = group.querySelector('.style-group-toggle');
                const controls = group.querySelector('.style-controls');
                if (toggle && controls) {
                    const sectionName = group.dataset.group;
                    const userPreferredState = this.userSectionStates.get(sectionName);
                    
                    // Use user's preferred state if available, otherwise use global state
                    let shouldExpand;
                    if (userPreferredState !== undefined) {
                        shouldExpand = userPreferredState;
                    } else {
                        shouldExpand = this.allGroupsExpanded;
                    }
                    
                    // Apply the state
                    toggle.setAttribute('aria-expanded', shouldExpand);
                    group.setAttribute('aria-collapsed', shouldExpand ? 'false' : 'true');
                    controls.style.maxHeight = shouldExpand ? controls.scrollHeight + 'px' : '0';
                    controls.style.opacity = shouldExpand ? '1' : '0';
                }
            } else {
                group.style.display = 'none';
            }
        });
        // Always hide Positioning section for <body>
        if ((elementData.tagName || '').toLowerCase() === 'body') {
            const positioningGroup = document.querySelector('.style-group[data-group="positioning"]');
            if (positioningGroup) positioningGroup.style.display = 'none';
        }
    }

    setupCollapsibleGroups() {
        document.querySelectorAll('.style-group').forEach(group => {
            const toggle = group.querySelector('.style-group-toggle');
            const controls = group.querySelector('.style-controls');
            if (!toggle || !controls) return;

            // Ensure proper initial state
            toggle.setAttribute('aria-expanded', 'false');
            group.setAttribute('aria-collapsed', 'true');
            controls.style.maxHeight = '0';
            controls.style.opacity = '0';

            toggle.addEventListener('click', () => {
                const expanded = toggle.getAttribute('aria-expanded') === 'true';
                const newState = !expanded;
                
                // Update the UI
                toggle.setAttribute('aria-expanded', newState);
                group.setAttribute('aria-collapsed', newState ? 'false' : 'true');
                controls.style.maxHeight = newState ? controls.scrollHeight + 'px' : '0';
                controls.style.opacity = newState ? '1' : '0';
                
                // Track user's preferred state for this section
                const sectionName = group.dataset.group;
                this.userSectionStates.set(sectionName, newState);
            });
        });
    }



    setupCustomInputs() {
        // Custom input configurations
        const customInputConfigs = [
            {
                selectId: 'transform',
                customId: 'transformCustom',
                property: 'transform'
            },
            {
                selectId: 'transition',
                customId: 'transitionCustom',
                property: 'transition'
            },
            {
                selectId: 'willChange',
                customId: 'willChangeCustom',
                property: 'willChange'
            }
        ];
        
        customInputConfigs.forEach(config => {
            const select = document.getElementById(config.selectId);
            const customInput = document.getElementById(config.customId);
            
            if (!select || !customInput) return;
            
            // Handle select change
            select.addEventListener('change', (e) => {
                if (select.value === 'custom') {
                    customInput.style.display = '';
                    this.handleStyleChange(config.property, customInput.value);
                    this.adaptSectionForCustomInput(select);
                    customInput.focus();
                } else {
                    customInput.style.display = 'none';
                    this.handleStyleChange(config.property, select.value);
                    this.removeCustomInputAdaptation(select);
                }
            });
            
            // Handle custom input changes
            customInput.addEventListener('input', (e) => {
                this.handleStyleChange(config.property, e.target.value);
            });
            
            // Handle custom input blur
            customInput.addEventListener('blur', (e) => {
                if (!e.target.value.trim()) {
                    customInput.style.display = 'none';
                    // Set appropriate default value based on property
                    let defaultValue;
                    if (config.property === 'transition') {
                        defaultValue = 'none';
                    } else if (config.property === 'transform') {
                        defaultValue = 'none';
                    } else if (config.property === 'willChange') {
                        defaultValue = 'auto';
                    } else {
                        defaultValue = select.options[0].value;
                    }
                    select.value = defaultValue;
                    this.handleStyleChange(config.property, defaultValue);
                    this.removeCustomInputAdaptation(select);
                }
            });
        });
    }
    
    adaptSectionForCustomInput(selectElement) {
        const styleGroup = selectElement.closest('.style-group');
        if (!styleGroup) return;
        
        // Ensure the section is expanded
        const toggle = styleGroup.querySelector('.style-group-toggle');
        const controls = styleGroup.querySelector('.style-controls');
        if (toggle && controls) {
            toggle.setAttribute('aria-expanded', 'true');
            styleGroup.setAttribute('aria-collapsed', 'false');
            controls.style.maxHeight = 'none'; // Allow natural expansion
            controls.style.opacity = '1';
        }
        
        // Add the custom input class to the section
        styleGroup.classList.add('has-custom-input');
        
        // Ensure the custom input is visible in the viewport
        const customInput = selectElement.parentElement.querySelector('input[type="text"]');
        if (customInput) {
            setTimeout(() => {
                this.ensureCustomInputVisible(customInput);
            }, 100);
        }
    }
    
    removeCustomInputAdaptation(selectElement) {
        const styleGroup = selectElement.closest('.style-group');
        if (!styleGroup) return;
        
        // Remove the custom input class
        styleGroup.classList.remove('has-custom-input');
        
        // Reset to natural height if section is expanded
        const toggle = styleGroup.querySelector('.style-group-toggle');
        const controls = styleGroup.querySelector('.style-controls');
        if (toggle && controls && toggle.getAttribute('aria-expanded') === 'true') {
            controls.style.maxHeight = 'none';
        }
    }
    
    ensureCustomInputVisible(customInput) {
        // Ensure the custom input is visible in the viewport
        const sidebarContent = document.querySelector('.sidebar-content');
        if (!sidebarContent) return;
        
        const inputRect = customInput.getBoundingClientRect();
        const sidebarRect = sidebarContent.getBoundingClientRect();
        
        // Check if the input is below the visible area
        if (inputRect.bottom > sidebarRect.bottom) {
            // Calculate how much to scroll
            const scrollAmount = inputRect.bottom - sidebarRect.bottom + 20; // 20px buffer
            
            // Smooth scroll to make the input visible
            sidebarContent.scrollBy({
                top: scrollAmount,
                behavior: 'smooth'
            });
        }
    }
    
    handleResizeForCustomInputs() {
        // Recalculate container heights when window is resized
        const styleGroups = document.querySelectorAll('.style-group.has-custom-input');
        styleGroups.forEach(styleGroup => {
            const controls = styleGroup.querySelector('.style-controls');
            const customInput = styleGroup.querySelector('.custom-select-wrapper input[type="text"]');
            
            if (controls && customInput && customInput.style.display !== 'none') {
                // Recalculate the height with the custom input
                const newHeight = controls.scrollHeight;
                controls.style.maxHeight = newHeight + 'px';
            }
        });
    }
    
    collapseAllSections() {
        // Collapse all sections when a new element is selected
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
    
    updateCustomInputs(mod, styles) {
        // Update transform custom input
        const transformSelect = document.getElementById('transform');
        const transformCustom = document.getElementById('transformCustom');
        if (transformSelect && transformCustom) {
            const currentTransform = mod.transform !== undefined ? mod.transform : styles.transform;
            const presetValues = Array.from(transformSelect.options).map(opt => opt.value).filter(v => v !== 'custom');
            
            if (presetValues.includes(currentTransform)) {
                transformSelect.value = currentTransform;
                transformCustom.style.display = 'none';
                transformCustom.value = '';
                this.removeCustomInputAdaptation(transformSelect);
            } else if (currentTransform && currentTransform !== 'none') {
                transformSelect.value = 'custom';
                transformCustom.style.display = '';
                transformCustom.value = currentTransform;
                this.adaptSectionForCustomInput(transformSelect);
            }
        }
        
        // Update transition custom input
        const transitionSelect = document.getElementById('transition');
        const transitionCustom = document.getElementById('transitionCustom');
        if (transitionSelect && transitionCustom) {
            const currentTransition = mod.transition !== undefined ? mod.transition : styles.transition;
            const presetValues = Array.from(transitionSelect.options).map(opt => opt.value).filter(v => v !== 'custom');
            
            // Normalize the current transition value for comparison
            const normalizedCurrent = currentTransition ? currentTransition.trim() : '';
            
            if (presetValues.includes(normalizedCurrent)) {
                transitionSelect.value = normalizedCurrent;
                transitionCustom.style.display = 'none';
                transitionCustom.value = '';
                this.removeCustomInputAdaptation(transitionSelect);
            } else if (normalizedCurrent && normalizedCurrent !== 'none') {
                transitionSelect.value = 'custom';
                transitionCustom.style.display = '';
                transitionCustom.value = normalizedCurrent;
                this.adaptSectionForCustomInput(transitionSelect);
            } else {
                // Default to 'none' if no transition or empty
                transitionSelect.value = 'none';
                transitionCustom.style.display = 'none';
                transitionCustom.value = '';
                this.removeCustomInputAdaptation(transitionSelect);
            }
        }
        
        // Update willChange custom input
        const willChangeSelect = document.getElementById('willChange');
        const willChangeCustom = document.getElementById('willChangeCustom');
        if (willChangeSelect && willChangeCustom) {
            const currentWillChange = mod.willChange !== undefined ? mod.willChange : styles.willChange;
            const presetValues = Array.from(willChangeSelect.options).map(opt => opt.value).filter(v => v !== 'custom');
            
            if (presetValues.includes(currentWillChange)) {
                willChangeSelect.value = currentWillChange;
                willChangeCustom.style.display = 'none';
                willChangeCustom.value = '';
                this.removeCustomInputAdaptation(willChangeSelect);
            } else if (currentWillChange && currentWillChange !== 'auto') {
                willChangeSelect.value = 'custom';
                willChangeCustom.style.display = '';
                willChangeCustom.value = currentWillChange;
                this.adaptSectionForCustomInput(willChangeSelect);
            }
        }
    }

    setupRangeTooltips() {
        document.querySelectorAll('input[type="range"]').forEach(range => {
            let tooltip;
            range.addEventListener('input', (e) => {
                if (!tooltip) {
                    tooltip = document.createElement('div');
                    tooltip.className = 'range-tooltip';
                    tooltip.style.position = 'absolute';
                    tooltip.style.pointerEvents = 'none';
                    tooltip.style.background = '#fff';
                    tooltip.style.border = '1px solid #e2e8f0';
                    tooltip.style.borderRadius = '0.3em';
                    tooltip.style.padding = '0.1em 0.5em';
                    tooltip.style.fontSize = '0.85em';
                    tooltip.style.color = '#1e293b';
                    tooltip.style.boxShadow = '0 1px 4px #0001';
                    tooltip.style.zIndex = '10';
                    range.parentElement.appendChild(tooltip);
                }
                tooltip.textContent = range.value + (range.id === 'fontSize' ? 'px' : range.id === 'borderWidth' ? 'px' : '');
                // Position tooltip above thumb
                const rect = range.getBoundingClientRect();
                const percent = (range.value - range.min) / (range.max - range.min);
                const left = percent * (rect.width - 32) + 16; // 16px thumb offset
                tooltip.style.left = left + 'px';
                tooltip.style.top = '-2.2em';
                tooltip.style.opacity = '1';
            });
            range.addEventListener('blur', () => {
                if (tooltip) tooltip.style.opacity = '0';
            });
        });
    }
}