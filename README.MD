# Validation Message

Declarative form validation web component. Works with native HTML5 validation and custom validators.

## Install

```html
<script src="validation-message.js"></script>
```

## Quick Start

### Native Validation (Zero Config)

```html
<form novalidate>
  <input type="email" name="email" id="email" required>
  <validation-message 
    data-validation-inputs="email"
    data-target-name="email">
  </validation-message>
</form>
```
That's it! Errors display automatically in the lightdom which are therefore easy to customize.

### Custom Cross-Field Validation

```html
<form novalidate>
  <input type="password" name="password" id="password" required pattern="[A-Za-z0-9]{8,}">
  <input type="password" name="confirm" id="confirm" required pattern="[A-Za-z0-9]{8,}">
  <validation-message 
    data-validation-inputs="password confirm"
    data-validation-function="passwordMatch">
  </validation-message>
</form>

 <script>
    function passwordMatch(fields, inputs) {
        // Check native validation first
        if (!inputs.password.validity.valid) {
            return { valid: false, reason: inputs.password.validationMessage };
        }
        if (!inputs.confirm.validity.valid) {
            return { valid: false, reason: inputs.confirm.validationMessage };
        }

        // Custom logic
        if (fields.password !== fields.confirm) {
            return { valid: false, reason: 'Passwords must match' };
        }

        return { valid: true, reason: '' };
    };
    </script>
```

### Form Submission

```html
<script>
    document.addEventListener('submit', (e) => {
        const form = e.target;
        if (form.hasAttribute('validatemessage')) {
            e.preventDefault();
            const error = HTMLValidationMessageAPI.validate(form)
            if (error) {
                console.log('❌ Form validation failed', 'calling focusTarget');
                error.focusTarget()
            } else {
                alert('✅ Form is valid! Submitting...');
                const formData = new FormData(form);
                for (const [key, value] of formData.entries()) {
                    console.log(`${key}: ${value}`);
                }
            }
        }
    });
</script>
```

## Attributes

- `data-validation-inputs` - space separated ids,
- `data-validation-events` - Events to trigger validation: `"input, blur"`, `"input delay:300"`, etc. Omit for manual control.
- `data-validation-function` - Namespaced custom validator
- `data-validation-rule` - Hyperscript syntax rule

## Styling

```css
validation-message.error {
  color: #d32f2f;
}

input:user-invalid {
  border-color: #d32f2f;
}
```
## To do:
- [ ] improve docs
- [ ] make tests more robust 
- [ ] what about form reset? perhaps worth considering the `<output/>` element

## License

MIT