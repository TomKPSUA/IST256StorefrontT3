(function () {
  'use strict';

  // shippingApp is a tiny AngularJS module used only to satisfy the ng-app / ng-controller
  // attributes in shipping-selection.html. The actual JSON building is done with plain JS.
  var app = angular.module('shippingApp', []);

  app.controller('ShipCtrl', ['$scope', function($scope) {
    var vm = this;
    vm.data = {};
    return vm;
  }]);

  // Base URL for NodeJS + Mongo API (same as used in other scripts)
  const API_BASE = 'https://130.203.136.203:3003';

  // Helper to pull and trim a value by id
  function val(id) {
    var el = document.getElementById(id);
    return (el && el.value ? el.value : '').trim();
  }

  // Build payload and perform simple "all required" validation
  function buildPayload() {
    var payload = {
      name: val('shipName'),
      address: val('shipAddress'),
      city: val('shipCity'),
      state: val('shipState'),
      zip: val('shipZip'),
      carrier: val('shipCarrier'),
      method: val('shipMethod')
    };

    // Any required field missing?
    var missing = [];
    Object.keys(payload).forEach(function(key) {
      if (!payload[key]) missing.push(key);
    });

    if (missing.length > 0) {
      alert('Please fill all required shipping fields: ' + missing.join(', '));
      return null;
    }
    return payload;
  }

  document.addEventListener('DOMContentLoaded', function () {
    var form = document.getElementById('shippingForm');
    var ajaxBtn = document.getElementById('ajaxSendBtn');
    var jsonPre = document.getElementById('jsonOutput');
    var ajaxPre = document.getElementById('ajaxResult');

    if (!form) return;

    // Show JSON on submit
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var payload = buildPayload();
      if (!payload) return;

      // Show pretty JSON in the preview box (assignment requirement)
      if (jsonPre) {
        jsonPre.textContent = JSON.stringify(payload, null, 2);
      }
    });

    // Send JSON to /api/shippingBilling when "Send via AJAX" button is clicked
    if (ajaxBtn) {
      ajaxBtn.addEventListener('click', function () {
        var payload = buildPayload();
        if (!payload) return;

        if (ajaxPre) {
          ajaxPre.textContent = 'Sending to API...';
        }

        fetch(API_BASE + '/api/shippingBilling', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        })
        .then(function (res) { return res.json(); })
        .then(function (data) {
          if (ajaxPre) {
            ajaxPre.textContent = JSON.stringify(data, null, 2);
          }
          console.log('Shipping POST ok:', data);
        })
        .catch(function (err) {
          if (ajaxPre) {
            ajaxPre.textContent = 'Error posting to API: ' + err;
          }
          console.error('Shipping POST failed:', err);
        });
      });
    }
  });
})();
