/**
 * @jest-environment jsdom
 */

require('./validation-message.js');

describe('validation-message', () => {
  beforeEach(() => {
    // Clear the DOM
    document.body.innerHTML = '';
  });

  test('Test 1: Native validation with required field', () => {
    // Setup HTML
    document.body.innerHTML = `
      <form novalidate>
        <input type="email" name="email" id="email" required>
        <validation-message 
          data-validation-inputs="email"
          data-target-name="email">
        </validation-message>
      </form>
    `;

    const input = document.querySelector('#email');
    const validationMsg = document.querySelector('validation-message');

    // Trigger validation on empty required field
    const verdict = validationMsg.validate();

    expect(verdict.valid).toBe(false);
    expect(verdict.reason).toBeTruthy();

    // Fill the field with valid email
    input.value = 'test@example.com';
    const verdict2 = validationMsg.validate();

    expect(verdict2.valid).toBe(true);
    expect(verdict2.reason).toBeFalsy();
  });

  test('Test 2: Custom validation function', () => {
    // Register validator
    window.TestValidators = {
      passwordMatch: (inputs) => {
        const password = inputs.password;
        const confirm = inputs.confirm;

        if (!password.validity.valid) {
          return password.validationMessage;
        }
        if (!confirm.validity.valid) {
          return confirm.validationMessage;
        }

        if (password.value !== confirm.value) {
          return 'Passwords must match';
        }

        return '';
      }
    };

    // Setup HTML
    document.body.innerHTML = `
      <form novalidate>
        <input type="password" name="password" id="password" required pattern="[A-Za-z0-9]{8,}">
        <input type="password" name="confirm" id="confirm" required pattern="[A-Za-z0-9]{8,}">
        <validation-message 
          data-validation-inputs="password confirm"
          data-validation-function="TestValidators.passwordMatch">
        </validation-message>
      </form>
    `;

    const password = document.querySelector('#password');
    const confirm = document.querySelector('#confirm');
    const validationMsg = document.querySelector('validation-message');

    // Test 1: Empty fields (native validation fails)
    let verdict = validationMsg.validate();
    expect(verdict.valid).toBe(false);

    // Test 2: Invalid pattern (native validation fails)
    password.value = 'short';
    confirm.value = 'short';
    verdict = validationMsg.validate();
    expect(verdict.valid).toBe(false);

    // Test 3: Valid pattern but don't match (custom validation fails)
    password.value = 'password123';
    confirm.value = 'different123';
    verdict = validationMsg.validate();
    expect(verdict.valid).toBe(false);
    expect(verdict.reason).toBe('Passwords must match');

    // Test 4: Valid and matching
    password.value = 'password123';
    confirm.value = 'password123';
    verdict = validationMsg.validate();
    expect(verdict.valid).toBe(true);
  });

  test('Test 3: Form-level validation with validateForm', () => {
    // Register validator
    window.FormValidators = {
      passwordMatch: (inputs) => {
        if (inputs.password.value !== inputs.confirm.value) {
          return 'Passwords must match';
        }
        return '';
      }
    };

    // Setup HTML with multiple validation-messages
    document.body.innerHTML = `
      <form id="testForm" novalidate>
        <input type="text" name="name" id="name" required>
        <validation-message 
          data-validation-inputs="name"
          data-target-name="name">
        </validation-message>
        
        <input type="email" name="email" id="email" required>
        <validation-message 
          data-validation-inputs="email"
          data-target-name="email">
        </validation-message>
        
        <input type="password" name="password" id="password" required>
        <input type="password" name="confirm" id="confirm" required>
        <validation-message 
          data-validation-inputs="password confirm"
          data-validation-function="FormValidators.passwordMatch"
          data-target-name="confirm">
        </validation-message>
      </form>
    `;

    const form = document.getElementById('testForm');
    const name = document.querySelector('#name');
    const email = document.querySelector("#email");
    const password = document.querySelector('#password');
    const confirm = document.querySelector('#confirm');

    // Test 1: Empty form should fail
    let error = HTMLValidationMessageAPI.validate(form);
    expect(error).toBeTruthy()

    // Test 2: Fill name but leave rest empty - should still fail
    name.value = 'John Doe';
    error = HTMLValidationMessageAPI.validate(form);
    expect(error).toBeTruthy();

    // Test 3: Fill all but passwords don't match
    name.value = 'John Doe';
    email.value = 'john@example.com';
    password.value = 'password123';
    confirm.value = 'different123';
    error = HTMLValidationMessageAPI.validate(form);
    expect(error).toBeTruthy()
    // Test 4: All valid
    name.value = 'John Doe';
    email.value = 'john@example.com';
    password.value = 'password123';
    confirm.value = 'password123';
    error = HTMLValidationMessageAPI.validate(form);
    expect(error).toBe(undefined)
  });
  // _hyperscript test
  test('emitHyperscriptRule: generates valid hyperscript function string', () => {
    const ruleName = 'MyValidators.checkPassword';
    const inputNames = ['password', 'confirm'];
    const statements = '  if password.value is not confirm.value return "Must match" end';
    const result = HTMLValidationMessageAPI.emitHyperscriptRule(ruleName, inputNames, statements);
    expect(result).toBe(
      `def MyValidators.checkPassword(inputs)
  set password to inputs['password']
  set confirm to inputs['confirm']
  if password.value is not confirm.value return "Must match" end
end`
    );
  });
  test('parseEventTriggers: parses event configuration correctly', () => {
    // Test single event without modifiers
    expect(HTMLValidationMessageAPI.parseEventTriggers('blur')).toEqual([
      { eventName: 'blur', modifiers: {} }
    ]);
    // Test single event with delay modifier
    expect(HTMLValidationMessageAPI.parseEventTriggers('input delay:300')).toEqual([
      { eventName: 'input', modifiers: { delay: '300' } }
    ]);

    // Test multiple events with mixed modifiers
    expect(HTMLValidationMessageAPI.parseEventTriggers('input delay:50, blur, change')).toEqual([
      { eventName: 'input', modifiers: { delay: '50' } },
      { eventName: 'blur', modifiers: {} },
      { eventName: 'change', modifiers: {} }
    ]);

    // Test empty/null input
    expect(HTMLValidationMessageAPI.parseEventTriggers('')).toEqual([]);
    expect(HTMLValidationMessageAPI.parseEventTriggers('   ')).toEqual([]);
    expect(HTMLValidationMessageAPI.parseEventTriggers(null)).toEqual([]);
  });
});