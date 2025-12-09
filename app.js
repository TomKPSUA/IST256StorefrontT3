var app = angular.module('storeApp', []);

// Thomas K / Team 3: Base URL of our NodeJS + Mongo API
const API_BASE = 'https://130.203.136.203:3003';

app.controller('BillingCtrl', ['$scope', function($scope){
  // Jaden R: using "vm = this" pattern because it’s the style many AngularJS examples use.
  var vm = this;

  // David C: This object holds the values from the form fields. Angular binds them live.
  vm.form = {
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zip: '',
    cardNumber: '',
    exp: '',
    cvv: ''
  };

  // Thomas K: This function runs when the form is submitted (ng-submit="vm.submitBilling()").
  vm.submitBilling = function(){
    // David C: build a small JS object (payload) that matches what a backend API might expect.
    var payload = {
      shopper: {
        firstName: vm.form.firstName,
        lastName: vm.form.lastName,
        email: vm.form.email,
        phone: vm.form.phone
      },
      billingAddress: {
        address: vm.form.address,
        city: vm.form.city,
        state: vm.form.state,
        zip: vm.form.zip
      },
      payment: {
        cardNumber: vm.form.cardNumber,
        exp: vm.form.exp,
        cvv: vm.form.cvv
      }
    };

    // Thomas K: pretty-print the JSON into the <pre> element.
    var pre = document.getElementById('billingJson');
    if (pre) {
      pre.textContent = JSON.stringify(payload, null, 2);
    }

    // Live POST to NodeJS API so our billing JSON lands in MongoDB.
    // NOTE: This expects AppPost.js to have a /api/shippingBilling route.
    fetch(API_BASE + '/api/shippingBilling', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
    .then(function(res) { return res.json(); })
    .then(function(data) {
      console.log('Billing POST ok:', data);
    })
    .catch(function(err) {
      console.error('Billing POST failed:', err);
    });

    // Jaden R: For the assignment we keep the Angular $http version in comments so TA sees it.
    /*
    $http.post('/api/billing', payload).then(function(response){
      console.log('Billing posted ok', response.data);
    }).catch(function(error){
      console.error('Billing error', error);
    });
    */

    // David C: And a jQuery example as a reference for how we might do it without Angular.
    /*
    $.ajax({
      url: '/api/billing',
      method: 'POST',
      contentType: 'application/json',
      data: JSON.stringify(payload)
    }).done(function(msg){
      console.log('posted ok', msg);
    });
    */
  };
}]);

// ======================= Returns Page Controller =======================
// Jaden R: This one powers the Handle Returns page. We keep a tiny fake product list,
// then allow the user to search it, set a quantity and reason, and add to a "returns" cart.
// When you click "Submit Returns" we show that as JSON in the <pre> just like the billing page.
app.controller('ReturnsCtrl', ['$scope', function($scope){
  var vm = this;

  // Thomas K: little pretend catalog for the demo, we only need a few items.
  vm.products = [
    { sku:'BL-100', name:'Blouse',  price:29.99 },
    { sku:'BT-110', name:'Belt',    price:19.99 },
    { sku:'TS-120', name:'T-Shirt', price:14.50 },
    { sku:'JK-130', name:'Jacket',  price:79.00 },
    { sku:'SK-140', name:'Sneakers',price:64.99 }
  ];

  // David C: This is our in-memory “cart” for returns that we print below and send to the API.
  vm.returns = [];

  // Jaden R: ng-model on the search box binds to vm.query so Angular’s filter can use it.
  vm.query = '';

  // Optional tiny status string for user feedback after submit.
  vm.status = '';

  // Thomas K: Add the selected product with the quantity and reason into the returns array.
  // We do a tiny validation so we don’t allow empty or zero quantities.
  vm.addReturn = function(p){
    if (!p.qty || p.qty < 1) {
      alert('Please set a quantity');
      return;
    }
    // David C: copy only the fields we need for the payload to keep it clean.
    var item = {
      sku:    p.sku,
      name:   p.name,
      qty:    Number(p.qty),
      reason: p.reason || ''
    };
    vm.returns.push(item);
    vm.status = ''; // clear any old status
  };

  // Jaden R: Remove by index is the simplest way to delete one row in the table for now.
  vm.removeReturn = function(idx){
    vm.returns.splice(idx, 1);
    vm.status = '';
  };

  // Thomas K: Clear everything so we can start fresh during testing without reloading the page.
  vm.clearAll = function(){
    vm.returns = [];
    vm.status = 'Return cart cleared.';
    var pre = document.getElementById('returnsJson');
    if (pre) {
      pre.textContent = '{ /* add items and click Submit to see JSON */ }';
    }
  };

  // David C: This builds a small payload and prints it out like we do on the billing page.
  // Then we POST this payload to /api/returns so MongoDB gets a document.
  vm.submitReturns = function(){
    if (!vm.returns.length) {
      alert('Add at least one item to the return cart before submitting.');
      return;
    }

    // For now we hard-code shopperId but it could be wired to a real shopper later.
    var payload = {
      shopperId: 'demo-123',
      returns: vm.returns.slice() // shallow copy for safety
    };

    var pre = document.getElementById('returnsJson');
    if (pre) {
      pre.textContent = JSON.stringify(payload, null, 2);
    }

    // Post returns JSON to our NodeJS API so it is stored in the "returns" collection.
    fetch(API_BASE + '/api/returns', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
    .then(function(res) { return res.json(); })
    .then(function(data) {
      console.log('Returns POST ok:', data);
      vm.status = 'Returns JSON sent to API successfully.';
      $scope.$applyAsync();  // let Angular refresh the status binding
    })
    .catch(function(err) {
      console.error('Returns POST failed:', err);
      vm.status = 'Error posting returns JSON: ' + err;
      $scope.$applyAsync();
    });

    // Old Angular/jQuery examples kept for reference:
    /*
    $http.post('/api/returns', payload).then(function(res){ console.log(res.data); });
    $.ajax({ url:'/api/returns', method:'POST', contentType:'application/json', data: JSON.stringify(payload) })
      .done(function(msg){ console.log('posted', msg); });
    */
  };
}]);
