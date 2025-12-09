/* 
Author: Jaden Reyes – Main JavaScript for search + cart + JSON + checkout printing
Author: Thomas Koltes – Helped wire Bootstrap UI and JSON display area, tested buttons and flow
Author: David Choe – AJAX transport stub owner (ENABLE_AJAX + sendCart), friendly comments and tiny CSS guidance for the JSON <pre> block
*/

(() => {
  // Team 3: shared base URL for our NodeJS API
  const API_BASE = 'https://130.203.136.203:3003';

  // Thomas: this flag stays false because our REST API will be built later in another assignment.
  const ENABLE_AJAX = true;

  // David: when the API exists we will POST our cart JSON here (for now it is a placeholder).
  const AJAX_ENDPOINT = API_BASE + '/api/cart';

  // David: we pad IDs so they show like 001 and 004 to match the example screenshot format.
  const PAD_IDS_TO = 3;

  // Jaden: for the search feature we just made a small list. It is enough to test add/remove and totals.
  const products = [
    { id: 1, name: "Blouse",   category: "Apparel",     price: 24.99 },
    { id: 2, name: "Belt",     category: "Accessories", price: 14.50 },
    { id: 3, name: "Sneakers", category: "Footwear",    price: 59.00 },
    { id: 4, name: "Hat",      category: "Accessories", price: 12.00 },
    { id: 5, name: "Jacket",   category: "Apparel",     price: 89.00 }
  ];

  // Jaden: we keep items in an object by productId, so updating quantity is super easy.
  // Example shape: { 1: { id:1, name:"Blouse", price:24.99, qty:2 }, 4: {...} }
  const cart = {};

  // David: shows dollars with 2 decimals so it looks like a store.
  function fmt(n) { return `$${Number(n).toFixed(2)}`; }

  // David: turns 7 into "007" if we want consistent 3-digit display like the screenshot.
  function zfillId(id) { return String(id).padStart(PAD_IDS_TO, "0"); }

  // Jaden: prints the filtered product rows (with an Add button on each row).
  function renderSearchRows(list) {
    const $tbody = $("#resultsTable tbody").empty();

    list.forEach(p => {
      const $tr = $("<tr/>");
      $tr.append(`<td>${p.name}</td>`);
      $tr.append(`<td>${p.category}</td>`);
      $tr.append(`<td class="text-end">${fmt(p.price)}</td>`);

      // Thomas: small button that calls addToCart so we can add the item in one click.
      const $btn = $("<button/>", {
        class: "btn btn-sm btn-primary",
        text: "Add",
        click: () => addToCart(p.id, 1)
      });

      $tr.append($("<td class='text-end'/>").append($btn));
      $tbody.append($tr);
    });
  }

  // Jaden: builds the cart rows (name, editable qty, price, subtotal) and updates the total at the end.
  function renderCart() {
    const $tbody = $("#cartTable tbody").empty();
    let total = 0;

    Object.values(cart).forEach(item => {
      const sub = item.price * item.qty;
      total += sub;

      const $tr = $("<tr/>");
      $tr.append(`<td>${item.name}</td>`);

      // Thomas: quantity input so users can fix typos without removing and re-adding the item.
      $tr.append(
        `<td class="text-center">
           <input type="number" min="1"
                  class="form-control form-control-sm qty-input"
                  data-id="${item.id}"
                  value="${item.qty}">
         </td>`
      );

      $tr.append(`<td class="text-end">${fmt(item.price)}</td>`);
      $tr.append(`<td class="text-end">${fmt(sub)}</td>`);

      // Thomas: remove button on the far right which deletes the item and re-renders totals.
      const $btn = $("<button/>", {
        class: "btn btn-sm btn-outline-danger",
        text: "Remove",
        click: () => removeFromCart(item.id)
      });
      $tr.append($("<td class='text-end'/>").append($btn));

      $tbody.append($tr);
    });

    // David: total at the bottom so it feels like a real checkout panel.
    $("#cartTotal").text(fmt(total));

    // Jaden: when users type a new qty, we update the item and then rebuild the whole table to refresh subtotals.
    $(".qty-input").on("input", function () {
      const id = Number($(this).data("id"));
      const val = Math.max(1, Number($(this).val()) || 1);
      if (cart[id]) {
        cart[id].qty = val;
        renderCart();
      }
    });
  }

  // Jaden: adds item by id and increases qty if it was already there (typical cart behavior).
  function addToCart(id, qty) {
    const p = products.find(x => x.id === id);
    if (!p) return; // David: safety guard so we do not crash if id is wrong

    if (!cart[id]) {
      cart[id] = { id: p.id, name: p.name, price: p.price, qty: 0 };
    }
    cart[id].qty += qty;

    renderCart();
  }

  // Jaden: removes the product entirely (like a trash can).
  function removeFromCart(id) {
    delete cart[id];
    renderCart();
  }

  // Jaden: lowercases both sides so the search is not case sensitive.
  function filterProducts(term) {
    const t = term.trim().toLowerCase();
    if (!t) return products;
    return products.filter(p =>
      p.name.toLowerCase().includes(t) || p.category.toLowerCase().includes(t)
    );
  }

  // Thomas: converts the Add/Update form to a plain object and checks for missing fields.
  function formToJSON(formEl) {
    const data = Object.fromEntries(new FormData(formEl).entries());

    // David: cast number fields so they are real numbers in the JSON (not strings).
    if (data.price !== undefined) data.price = Number(data.price);
    if (data.quantity !== undefined) data.quantity = Number(data.quantity);

    // Jaden: collect missing inputs so we can show a friendly message.
    const missing = Object.entries(data).filter(([k, v]) => !v);

    return { ok: missing.length === 0, data, missing: missing.map(x => x[0]) };
  }

  // Thomas: prints any JS object nicely into the <pre> so graders see exact key/value pairs.
  function showJSON(obj) {
    $("#jsonOut").text(JSON.stringify(obj, null, 2));
  }

  // Jaden: this builds the JSON array for checkout like the screenshot:
  // [{ "productId":"001","productName":"Mens Jeans","price":59.99,"quantity":1,"total":59.99 }, ...]
  function cartItemsArray() {
    return Object.values(cart).map(item => ({
      productId: zfillId(item.id),
      productName: item.name,
      price: Number(item.price),
      quantity: Number(item.qty),
      total: Number((item.price * item.qty).toFixed(2))
    }));
  }

  // David: AJAX transport stub owner — now we actually POST the cart in an object wrapper so MongoDB insertOne() is happy.
  async function sendCart(collection) {
    if (!ENABLE_AJAX) {
      $("#ajaxMsg").text("AJAX disabled (assignment stub). Turn ENABLE_AJAX=true when your API is ready.");
      return;
    }

    // Thomas: wrap the array of cart items in an object so the backend sees a single document, not a raw array.
    const payload = {
      createdAt: new Date().toISOString(),
      items: collection
    };

    console.log("Sending cart payload to API:", payload);

    try {
      const res = await fetch(AJAX_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const txt = await res.text();
      console.log("Cart API raw response:", res.status, txt);

      if (!res.ok) {
        $("#ajaxMsg").text(`Server error: ${res.status} ${txt}`);
        return;
      }

      $("#ajaxMsg").text(`Server responded: ${res.status} ${txt}`);
    } catch (e) {
      console.error("Cart POST failed:", e);
      $("#ajaxMsg").text(`AJAX error: ${e}`);
    }
  }

  // Jaden: hook up all the events once the DOM is ready.
  $(document).ready(function () {
    // Thomas: show all products at first so the page looks full and useful.
    renderSearchRows(products);

    // Jaden: instant search experience as the user types.
    $("#searchBox").on("input", function () {
      renderSearchRows(filterProducts($(this).val()));
    });

    // Thomas: handle Add/Update submit. We prevent the page reload, build JSON, and add to the cart.
    $("#cartForm").on("submit", function (e) {
      e.preventDefault();

      const result = formToJSON(this);
      if (!result.ok) {
        $("#cartMsg").text(`Please fill: ${result.missing.join(", ")}`);
        return;
      }

      // Thomas: tell the user things went OK and also show the exact JSON object from the form.
      $("#cartMsg").text("Looks good. JSON shown below and item added to cart.");
      showJSON(result.data);

      // Jaden: if the product name is new, we quickly add it to the catalog so it can be searched later.
      const existing = products.find(
        p => p.name.toLowerCase() === result.data.product_name.toLowerCase()
      );
      const id = existing ? existing.id : Math.floor(Math.random() * 1000000);

      if (!existing) {
        products.push({
          id,
          name: result.data.product_name,
          category: result.data.category,
          price: Number(result.data.price)
        });
        renderSearchRows(filterProducts($("#searchBox").val() || ""));
      }

      addToCart(id, Number(result.data.quantity) || 1);
    });

    // David: quick reset if we want to clear the form and the JSON panel between tests.
    $("#btnClear").on("click", function(){
      $("#cartForm").trigger("reset");
      $("#cartMsg").text("");
      $("#jsonOut").text("");
    });

    // Jaden + David: Checkout prints the cart JSON array and posts it to the API.
    $("#btnSend").on("click", function () {
      const items = cartItemsArray();
      showJSON(items);     // prints the nice array into the JSON box
      sendCart(items);     // now sends an object { createdAt, items: [...] } so MongoDB is happy
    });
  });
})();
