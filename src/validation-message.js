/**
 * validation-message - Declarative form validation web component
 * @version 1.0.0
 * @license MIT
 */
(function () {
    'use strict';
    /**
     * Walks an object path to retrieve a nested value
     */
    function walkObject(obj, path, level = 0) {
        const pathArr = Array.isArray(path) ? path : path.split('.');
        const key = pathArr[level];
        return key
            ? pathArr[level + 1]
                ? walkObject(obj?.[key], pathArr, level + 1)
                : obj?.[key] ?? null
            : null;
    }
    /**
     * Emit _hyperscript function as string
     * @param {string} name Rule name;
     * @param {Array<{string}>} name Input names;
     * @param {Array<string>} statements _hyperscript validation statements;
     * @returns {String} Rule function string.
     */
    function emitHyperscriptRule(name, inputs, statements) {
        const methodName = name;
        let definition = `def ${methodName}(inputs)\n`;
        inputs.forEach(i => {
            definition += `  set ${i} to inputs['${i}']\n`
        })
        definition += `${statements}\n`;
        definition = definition.trim() + "\nend";
        return definition;
    }
    /**
     * Define _hyperscript function from rule statements
     * @param {string} name Rule name;
     * @param {Array<{string}>} name Input names;
     * @param {Array<string>} statements _hyperscript validation statements;
     * @returns {Function} Rule function.
     */
    function defrule(name, names, statements) {
        if (!_hyperscript) throw new Error('Cannot define rules without _hyperscript, window._hyperscript not found.')
        const vFnString = emitHyperscriptRule(name, names, statements);
        try {
            _hyperscript.evaluate(vFnString);
        } catch (e) {
            console.warn('Failed to evaluate emitted rule:\n----\n' + vFnString + '\n----\n');
            throw e;
        }
        const defined = walkObject(window, name);
        if (!defined) throw new Error('Cannot find defined rule: ' + name + '\n----\n' + vFnString + '\n----\n');
        return defined;
    }
    /**
     * Parses event trigger configuration
     * @param {string} triggerAttr - e.g., "input delay:50, blur"
     * @returns {Array<{eventName: string, modifiers: Object}>}
     * @private
     */
    function parseEventTriggers(triggerAttr) {
        if (!triggerAttr || !triggerAttr.trim()) {
            return [];
        }
        const triggers = triggerAttr.split(',').map(t => t.trim());
        const parsed = [];
        for (const trigger of triggers) {
            const parts = trigger.split(/\s+/);
            const eventName = parts[0];
            const modifiers = {};
            for (let i = 1; i < parts.length; i++) {
                const modifier = parts[i];
                if (modifier.includes(':')) {
                    const [name, value] = modifier.split(':');
                    modifiers[name] = value;
                }
            }
            parsed.push({ eventName, modifiers });
        }
        return parsed;
    }
    /**
     * Registers event listeners with optional debouncing
     */
    function registerEventTriggers(inputs, triggers, validateFn) {
        inputs.forEach(input => {
            triggers.forEach(({ eventName, modifiers }) => {
                if (modifiers.delay) {
                    const delay = parseInt(modifiers.delay, 10);
                    let timeoutId;
                    input.addEventListener(eventName, () => {
                        clearTimeout(timeoutId);
                        timeoutId = setTimeout(() => {
                            validateFn();
                        }, delay);
                    });
                } else {
                    input.addEventListener(eventName, () => validateFn());
                }
            });
        });
    }
    function loadNamedInputs(parent = document, inputs) {
        if (!inputs) throw new Error('Missing inputs @loadFormNamedInputs');
        return Object.fromEntries(
            inputs
                .map(name => [name, parent.querySelector(`#${name}`)])
                .filter(([, input]) => input !== null)
        );
    }
    function validate(form) {
        const validationMessages = form.querySelectorAll('validation-message');
        for (const validationMsg of validationMessages) {
            const verdict = validationMsg.validate();
            if (!verdict.valid) {
                return validationMsg
            }
        }
    }
    /**
     * Custom element for displaying validation messages
     * @class ValidationMessage
     * @extends HTMLElement
     * @example
     * <validation-message 
     *   data-validation-inputs="password confirm"
     *   data-validation-events="blur">
     * </validation-message>
     */
    class ValidationMessage extends HTMLElement {
        constructor() {
            super();
            this.__names = [];
            this.__implementation = null;
            this.__inputs = {};
        }
        get inputs() { return this.__inputs; }
        set inputs(inputs) { this.__inputs = inputs; }
        get names() { return this.__names; }
        set names(names) { this.__names = names; }
        get implementation() {
            if (this.__implementation) {
                return this.__implementation;
            } else {
                this.load();
                return this.__implementation;
            }
        }
        set implementation(vFn) { this.__implementation = vFn; }
        focusTarget() {
            const targetSelector = this.dataset.validationFocusTarget
            const form = this.querySelector('form') || document
            const targetElement = form.querySelector(targetSelector)
            if (targetElement) {
                targetElement.focus();
            }
        }
        connectedCallback() {
            if (!this.dataset.validationInputs) {
                throw new Error('Missing data-validation-inputs @ValidationMessage.connectedCallback');
            }
            this.names = this.dataset.validationInputs.trim().split(/\s+/);
            this.inputs = loadNamedInputs(this.closest('form'), this.names);
            if (this.hasAttribute('data-validation-events')) {
                const triggers = parseEventTriggers(this.getAttribute('data-validation-events'));
                registerEventTriggers(Object.values(
                    this.inputs),
                    triggers,
                    () => this.validate());
            }
        }
        /**
         * Validates inputs and displays result
         * @returns {{valid: boolean, reason: string}}
         */
        validate() {
            const verdict = this.implementation(this.inputs);
            const valid = !verdict;
            this.display(valid, verdict);
            return { valid: valid, reason: verdict };
        }
        display(valid, reason) {
            if (!valid) {
                this.innerHTML = reason;
            } else {
                this.innerHTML = '';
            };
        }
        /**
         * Loads validation function from attributes
         * Priority: data-validation-function > data-validation-rule > native
         */
        load() {
            if (this.dataset.validationFunction) {
                const theFunction = walkObject(window, this.dataset.validationFunction);
                this.implementation = theFunction;
                return this;
            }
            if (this.dataset.validationRule) {
                const vFn = defrule(this.getAttribute('data-validation-name'), this.names, this.dataset.validationRule)
                this.implementation = vFn;
                return this;
            }
            const nativeValidation = function (inputs) {
                const input = Object.values(inputs)[0];
                if (!input.validity.valid) return input.validationMessage;
            };
            this.implementation = nativeValidation;
            return this;
        }
    }
    // export rematches globally
    window.rematches = function rematches(regexpString, testString) {
        const regex = new RegExp(regexpString);
        return regex.test(testString);
    }
    const HTMLValidationMessageAPI = {
        defrule,
        emitHyperscriptRule,
        loadNamedInputs,
        parseEventTriggers,
        registerEventTriggers,
        validate,
        walkObject
    }
    if (typeof window !== 'undefined') {
        window.HTMLValidationMessageAPI = HTMLValidationMessageAPI;
    }
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = HTMLValidationMessageAPI;
    }
    customElements.define('validation-message', ValidationMessage);
})();