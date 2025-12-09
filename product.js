/* Team Roles 
   Author: Jaden Reyes – JavaScript (validation + small utilities)
   Author: Jaden Reyes – JSON Product Document (build + render)
   Author: Thomas Koltes – HTML structure references used here
   Author: David Choe – CSS/Bootstrap visual feedback expectations
*/

/* Jaden Reyes: Helpers to flip Bootstrap valid/invalid classes + aria flags. */
function setInvalid($input, msg) {
  $input.removeClass("is-valid").addClass("is-invalid").attr("aria-invalid", "true");
  const el = $input[0];
  const fb = el && el.nextElementSibling;
  if (fb && fb.classList.contains("invalid-feedback") && msg) fb.textContent = msg;
}
function setValid($input) {
  $input.removeClass("is-invalid").addClass("is-valid").attr("aria-invalid", "false");
}

/* Jaden Reyes: Simple patterns we use to check values. */
const priceRegex = /^\d+(?:\.\d{1,2})?$/;      // numbers with optional .00
const weightRegex = /^(?:\s*|[\w\d\.\-\s]+)$/; // blank OR letters/numbers/spaces

// Team 3: base URL for NodeJS API used when sending product JSON.
// NOTE: update the port if your team uses something other than 3003.
const API_BASE = 'https://130.203.136.203:3003';

$(function () {
  // Thomas Koltes: Grab the main nodes we work with.
  const $form = $("#productForm");
  const $success = $("#productSuccess");
  const $jsonCard = $("#jsonCard");
  const $jsonOutput = $("#jsonOutput");

  const $id = $("#productId");
  const $desc = $("#productDescription");
  const $cat = $("#productCategory");
  const $uom = $("#productUom");
  const $price = $("#productPrice");
  const $weight = $("#productWeight");

  // Jaden Reyes: Tiny in-memory store keyed by Product Id (goes away on refresh).
  const productStore = new Map();

  // ---- validators (each returns true/false) ----
  function validateId() {
    const ok = $id.val().trim().length > 0;                // Thomas Koltes: just non-empty
    ok ? setValid($id) : setInvalid($id, "Please enter a Product Id.");
    return ok;
  }
  function validateDescription() {
    const ok = $desc.val().trim().length > 0;              // David Choe: free text is fine
    ok ? setValid($desc) : setInvalid($desc, "Please enter a Product Description.");
    return ok;
  }
  function validateCategory() {
    const ok = $cat.val().trim().length > 0;               // Jaden Reyes: must choose something
    ok ? setValid($cat) : setInvalid($cat, "Please choose a Product Category.");
    return ok;
  }
  function validateUom() {
    const ok = $uom.val().trim().length > 0;               // Jaden Reyes: same idea as category
    ok ? setValid($uom) : setInvalid($uom, "Please choose a Unit of Measure.");
    return ok;
  }
  function validatePrice() {
    const v = $price.val().trim();                         // Thomas Koltes: trim spaces first
    const ok = v.length > 0 && priceRegex.test(v);         // must match money-ish pattern
    ok ? setValid($price) : setInvalid($price, "Please enter a valid price (e.g., 19.99).");
    return ok;
  }
  function validateWeight() {
    const v = $weight.val().trim();                        // David Choe: optional, so blank is fine
    const ok = v === "" || weightRegex.test(v);
    ok ? setValid($weight) : setInvalid($weight, "Please enter a valid weight or leave blank.");
    return ok;
  }

  // ---- live validation on input/change so user sees feedback quickly ----
  $id.on("input", validateId);
  $desc.on("input", validateDescription);
  $cat.on("change", validateCategory);
  $uom.on("change", validateUom);
  $price.on("input", validatePrice);
  $weight.on("input", validateWeight);

  // ---- helper to normalize money to two decimals (e.g., 9 -> 9.00) ----
  function toMoney(n) {
    const num = Number(n);
    if (Number.isNaN(num)) return n; // Jaden Reyes: if bad, validation handles it elsewhere
    return num.toFixed(2);
  }

  // ---- build a plain object we can JSON.stringify nicely ----
  function buildProductJSON() {
    return {
      productId: $id.val().trim(),
      productDescription: $desc.val().trim(),
      productCategory: $cat.val().trim(),
      productUom: $uom.val().trim(),
      productPrice: toMoney($price.val().trim()),
      productWeight: $weight.val().trim() || null
    };
  }

  // ---- show JSON in the <pre> area and unhide the card ----
  function showJSON(obj) {
    $jsonOutput.text(JSON.stringify(obj, null, 2));  // Thomas Koltes: pretty printing
    $jsonCard.removeClass("d-none");
  }

  // ---- submit handler: validate, store in memory, then show JSON + POST to API ----
  $form.on("submit", function (e) {
    e.preventDefault(); // Jaden Reyes: stop real submit so we can control UI

    const allValid = [
      validateId(),
      validateDescription(),
      validateCategory(),
      validateUom(),
      validatePrice(),
      validateWeight(),
    ].every(Boolean);

    if (!allValid) {
      $success.addClass("d-none"); // David Choe: hide success if errors exist
      return;
    }

    const doc = buildProductJSON();
    productStore.set(doc.productId, doc); // Jaden Reyes: overwrite same Id on purpose
    $success.removeClass("d-none");
    showJSON(doc);

    // Thomas Koltes: Live POST to our NodeJS API so the product JSON lands in the "products" collection.
    fetch(API_BASE + '/api/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(doc)
    })
    .then(function(res){ return res.json(); })
    .then(function(data){
      console.log('Product POST ok:', data);
    })
    .catch(function(err){
      console.error('Product POST failed:', err);
    });
  });

  // ---- small Search/Update utilities on the right panel ----
  const $searchId = $("#searchId");
  const $btnSearch = $("#btnSearch");
  const $btnUpdateFromForm = $("#btnUpdateFromForm");
  const $btnClearAll = $("#btnClearAll");
  const $searchFeedback = $("#searchFeedback");

  // search by Product Id
  $btnSearch.on("click", function () {
    const key = $searchId.val().trim();           // Thomas Koltes: trim spaces
    if (!key) { $searchFeedback.text("Enter a Product Id to search."); return; }

    const found = productStore.get(key);          // Jaden Reyes: lookup in Map
    if (!found) { $searchFeedback.text("No product found with that Id."); return; }

    // load values into form
    $id.val(found.productId);
    $desc.val(found.productDescription);
    $cat.val(found.productCategory);
    $uom.val(found.productUom);
    $price.val(found.productPrice);
    $weight.val(found.productWeight ?? "");

    // make the fields look valid so the form doesn’t look scary
    [$id,$desc,$cat,$uom,$price,$weight].forEach(($el)=>$el.removeClass("is-invalid").addClass("is-valid"));

    $searchFeedback.text("Product loaded. Edit fields and click Update to save changes.");
  });

  // update stored product using current form values
  $btnUpdateFromForm.on("click", function () {
    const key = $id.val().trim();                 // David Choe: need an Id to know which one
    if (!key) { $searchFeedback.text("Enter or load a Product Id first."); return; }
    if (!productStore.has(key)) { $searchFeedback.text("That Product Id does not exist yet. Submit the form to create it."); return; }

    const allValid = [
      validateId(), validateDescription(), validateCategory(),
      validateUom(), validatePrice(), validateWeight()
    ].every(Boolean);
    if (!allValid) { $searchFeedback.text("Please fix validation errors before updating."); return; }

    const updated = buildProductJSON();           // Jaden Reyes: overwrite with new values
    productStore.set(key, updated);
    showJSON(updated);
    $success.removeClass("d-none");
    $searchFeedback.text("Stored product updated from current form values.");
  });

  // clear everything in memory
  $btnClearAll.on("click", function () {
    productStore.clear();                         // Thomas Koltes: fresh start for testing
    $searchFeedback.text("All stored products cleared from memory.");
  });

  console.log("product.js loaded.");              // simple sanity check in console
});
