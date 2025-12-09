/* 
  Authors:
  - Jaden Reyes — JavaScript (behaviors & field integrity checks), JSON Shopper Document
  - Thomas Koltes and David Choe — Bootstrap integration and styling
*/

/* Jaden Reyes: Wait until DOM is ready so all elements exist before we query them. */

// Team 3: Base URL for NodeJS API so shopper data can be saved.
const API_BASE = 'https://130.203.136.203:3003';

document.addEventListener("DOMContentLoaded", () => {
  /* Jaden Reyes: Cache important nodes for validation and output display. */
  const form = document.getElementById("shopperForm");
  const success = document.getElementById("shopperSuccess");
  const jsonCard = document.getElementById("jsonCard");
  const jsonOutput = document.getElementById("jsonOutput");

  /* Thomas Koltes: Group form fields to keep the validation code organized. */
  const fields = {
    email: document.getElementById("shopperEmail"),
    name: document.getElementById("shopperName"),
    phone: document.getElementById("shopperPhone"),
    age: document.getElementById("shopperAge"),
    address: document.getElementById("shopperAddress"),
  };

  /* Jaden Reyes: Simple patterns for email & phone; good enough for this class project. */
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const phoneRegex = /^\+?[\d\s().-]{7,}$/;
  const nonEmpty = (v) => String(v || "").trim().length > 0;

  /* David Choe: Helper toggles Bootstrap validity classes and updates feedback text. */
  function setInvalid(input, msg) {
    input.classList.remove("is-valid");
    input.classList.add("is-invalid");
    const fb = input.nextElementSibling;
    if (fb && fb.classList.contains("invalid-feedback") && msg) fb.textContent = msg;
  }
  /* David Choe: Mark field as valid so the green outline shows after corrections. */
  function setValid(input) {
    input.classList.remove("is-invalid");
    input.classList.add("is-valid");
  }

  /* Jaden Reyes: Individual validators keep responsibilities clear and readable. */
  function validateEmail() {
    const v = fields.email.value.trim();
    const ok = nonEmpty(v) && emailRegex.test(v);
    ok ? setValid(fields.email) : setInvalid(fields.email, "Please enter a valid email (e.g., jane@sample.com).");
    return ok;
  }
  function validateName() {
    const ok = nonEmpty(fields.name.value);
    ok ? setValid(fields.name) : setInvalid(fields.name, "Please enter the shopper's name.");
    return ok;
  }
  function validatePhone() {
    const v = fields.phone.value.trim();
    const ok = v.length === 0 || phoneRegex.test(v);
    ok ? setValid(fields.phone) : setInvalid(fields.phone, "Please enter a valid phone (or leave it blank).");
    return ok;
  }
  function validateAge() {
    const v = Number(fields.age.value);
    const ok = Number.isFinite(v) && v >= 13 && v <= 120;
    ok ? setValid(fields.age) : setInvalid(fields.age, "Please enter an age between 13 and 120.");
    return ok;
  }
  function validateAddress() {
    const ok = nonEmpty(fields.address.value) && fields.address.value.trim().length >= 5;
    ok ? setValid(fields.address) : setInvalid(fields.address, "Please enter a mailing address.");
    return ok;
  }

  /* Thomas Koltes: Live validation improves UX by showing feedback while typing. */
  fields.email.addEventListener("input", validateEmail);
  fields.name.addEventListener("input", validateName);
  fields.phone.addEventListener("input", validatePhone);
  fields.age.addEventListener("input", validateAge);
  fields.address.addEventListener("input", validateAddress);

  /* Jaden Reyes: On submit, validate everything; on success, show JSON snapshot. */
  form.addEventListener("submit", (e) => {
    const allValid = [
      validateEmail(),
      validateName(),
      validatePhone(),
      validateAge(),
      validateAddress(),
    ].every(Boolean);

    if (!allValid) {
      /* David Choe: Prevent page refresh and focus the first invalid field for clarity. */
      e.preventDefault();
      e.stopPropagation();
      success.classList.add("d-none");
      jsonCard.classList.add("d-none");
      const firstInvalid = [fields.email, fields.name, fields.phone, fields.age, fields.address]
        .find((el) => el.classList.contains("is-invalid"));
      if (firstInvalid) firstInvalid.focus();
      return;
    }

    /* Jaden Reyes: Form is valid — prevent default submit and construct the shopper JSON. */
    e.preventDefault();
    const shopper = {
      email: fields.email.value.trim(),
      name: fields.name.value.trim(),
      phone: fields.phone.value.trim() || null,
      age: Number(fields.age.value),
      address: fields.address.value.trim(),
    };

    /* Thomas Koltes: Reveal success alert and JSON card so graders can see the data. */
    success.classList.remove("d-none");
    jsonCard.classList.remove("d-none");

    /* David Choe: Print JSON for readability inside the <pre> block. */
    jsonOutput.textContent = JSON.stringify(shopper, null, 2);

// Jaden Reyes: POST shopper JSON to our NodeJS API so it lands in the "shopper" collection.
fetch(API_BASE + '/api/shopper', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(shopper)
})
.then(function(res){ return res.json(); })
.then(function(data){
  console.log('Shopper POST ok:', data);
})
.catch(function(err){
  console.error('Shopper POST failed:', err);
});
  });
});
