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
  <input type="email" id="email" required>
  <constraint-message watch="#email" data-constraint-trigger="input, blur"></constraint-message>
  
  <button type="submit">Submit</button>
</form>
```

That's it! Errors display automatically in the lightdom which are therefore easy to customize.

### Custom Cross-Field Validation

```html
<form novalidate>
  <input type="password" id="password" required minlength="8">
  <input type="password" id="confirm" required minlength="8">
  <constraint-message 
    watch="#password #confirm" 
    data-constraint-trigger="blur"
    data-validation-function="passwordMatch">
  </constraint-message>
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

```javascript
form.addEventListener('submit', (e) => {
  e.preventDefault();
  
  if (HTMLFormValidators.validateFormConstraints(form)) {
    // All valid - submit
    form.submit();
  }
});
```

## Attributes

- `data-validation-inputs` - space separated ids,
- `data-validation-events` - Events to trigger validation: `"input, blur"`, `"input delay:300"`, etc. Omit for manual control.
- `data-validation-function` - Namespaced custom validator
- `data-validation-rule` - Hyperscript syntax rule

## Styling

```css
constraint-message.error {
  color: #d32f2f;
}

input:user-invalid {
  border-color: #d32f2f;
}
```

## API

**Register validator:**
```javascript
HTMLFormValidators.register(name, validatorFn);
```

**Validate form:**
```javascript
HTMLFormValidators.validateFormConstraints(form);
```

**Manual validation:**
```javascript
document.querySelector('constraint-message').validate();
```

## License

MIT