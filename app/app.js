(function () {
  "use strict";

  var CURRENCY = "₱";
  // URL of your Express API (change this when you deploy)
  var API_URL = (window.APP_CONFIG && window.APP_CONFIG.API_URL) || "http://localhost:5000";

  var categories = [
    { id: "all", name: "All", icon: "🍽️" },
    { id: "burgers", name: "Burgers", icon: "🍔" },
    { id: "pizza", name: "Pizza", icon: "🍕" },
    { id: "chicken", name: "Chicken", icon: "🍗" },
    { id: "drinks", name: "Drinks", icon: "🥤" },
    { id: "desserts", name: "Desserts", icon: "🍰" }
  ];

  var products = [
    { id: 1, name: "Classic Burger", price: 120, category: "burgers", emoji: "🍔" },
    { id: 2, name: "Cheese Burger", price: 140, category: "burgers", emoji: "🧀" },
    { id: 3, name: "Double Patty", price: 190, category: "burgers", emoji: "🍔" },
    { id: 4, name: "Pepperoni Pizza", price: 250, category: "pizza", emoji: "🍕" },
    { id: 5, name: "Hawaiian Pizza", price: 240, category: "pizza", emoji: "🍍" },
    { id: 6, name: "Fried Chicken", price: 130, category: "chicken", emoji: "🍗" },
    { id: 7, name: "Chicken Wings", price: 160, category: "chicken", emoji: "🍖" },
    { id: 8, name: "French Fries", price: 70, category: "chicken", emoji: "🍟" },
    { id: 9, name: "Iced Tea", price: 50, category: "drinks", emoji: "🧋" },
    { id: 10, name: "Cola", price: 45, category: "drinks", emoji: "🥤" },
    { id: 11, name: "Orange Juice", price: 60, category: "drinks", emoji: "🍊" },
    { id: 12, name: "Chocolate Cake", price: 95, category: "desserts", emoji: "🍰" },
    { id: 13, name: "Ice Cream", price: 55, category: "desserts", emoji: "🍨" },
    { id: 14, name: "Donut", price: 40, category: "desserts", emoji: "🍩" }
  ];

  var state = {
    category: "all",
    cart: {},          // productId -> quantity
    paymentMethod: null
  };

  // ---------- Helpers ----------
  function $(id) { return document.getElementById(id); }

  function money(n) { return CURRENCY + n.toFixed(2); }

  function findProduct(id) {
    for (var i = 0; i < products.length; i++) {
      if (products[i].id === id) return products[i];
    }
    return null;
  }

  function cartItems() {
    return Object.keys(state.cart).map(function (key) {
      var p = findProduct(Number(key));
      return { product: p, qty: state.cart[key] };
    });
  }

  function cartTotal() {
    return cartItems().reduce(function (sum, it) {
      return sum + it.product.price * it.qty;
    }, 0);
  }

  function cartCount() {
    return cartItems().reduce(function (sum, it) { return sum + it.qty; }, 0);
  }

  function showModal(id) { $(id).classList.remove("hidden"); }
  function hideModal(id) { $(id).classList.add("hidden"); }

  var toastTimer = null;
  function toast(msg) {
    var el = $("toast");
    el.textContent = msg;
    el.classList.remove("hidden");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { el.classList.add("hidden"); }, 1800);
  }

  function changeQty(id, delta) {
    var next = (state.cart[id] || 0) + delta;
    if (next <= 0) {
      delete state.cart[id];
    } else {
      state.cart[id] = next;
    }
    renderProducts();
    renderCartBar();
    if (!$("cartModal").classList.contains("hidden")) renderCart();
  }

  // ---------- Rendering ----------
  function renderCategories() {
    var html = categories.map(function (c) {
      var active = c.id === state.category ? " is-active" : "";
      return '<button type="button" class="cat-btn' + active + '" data-category="' + c.id + '">' +
        '<span class="cat-btn__icon">' + c.icon + '</span>' +
        '<span>' + c.name + '</span></button>';
    }).join("");
    $("categoryList").innerHTML = html;

    var current = categories.filter(function (c) { return c.id === state.category; })[0];
    $("categoryTitle").textContent = current ? current.name : "All";
  }

  function renderProducts() {
    var list = products.filter(function (p) {
      return state.category === "all" || p.category === state.category;
    });

    $("productGrid").innerHTML = list.map(function (p) {
      var qty = state.cart[p.id] || 0;
      var action = qty > 0
        ? '<div class="stepper">' +
            '<button type="button" data-action="dec" data-id="' + p.id + '">−</button>' +
            '<span>' + qty + '</span>' +
            '<button type="button" data-action="inc" data-id="' + p.id + '">+</button>' +
          '</div>'
        : '<button type="button" class="add-btn" data-action="inc" data-id="' + p.id + '">Add</button>';

      return '<article class="product">' +
        '<div class="product__emoji">' + p.emoji + '</div>' +
        '<div class="product__name">' + p.name + '</div>' +
        '<div class="product__price">' + money(p.price) + '</div>' +
        action +
      '</article>';
    }).join("");
  }

  function renderCartBar() {
    var count = cartCount();
    $("cartBar").classList.toggle("hidden", count === 0);
    $("cartCount").textContent = count;
    $("cartBarTotal").textContent = money(cartTotal());
  }

  function renderCart() {
    var items = cartItems();
    if (items.length === 0) {
      hideModal("cartModal");
      return;
    }
    $("cartList").innerHTML = items.map(function (it) {
      var p = it.product;
      return '<li class="cart-item">' +
        '<span class="cart-item__emoji">' + p.emoji + '</span>' +
        '<div class="cart-item__info">' +
          '<div class="cart-item__name">' + p.name + '</div>' +
          '<div class="cart-item__price">' + money(p.price) + ' each</div>' +
        '</div>' +
        '<div class="stepper">' +
          '<button type="button" data-action="dec" data-id="' + p.id + '">−</button>' +
          '<span>' + it.qty + '</span>' +
          '<button type="button" data-action="inc" data-id="' + p.id + '">+</button>' +
        '</div>' +
      '</li>';
    }).join("");
    $("cartTotal").textContent = money(cartTotal());
  }

  // ---------- Payment & order ----------
  function openPayment() {
    state.paymentMethod = null;
    $("placeOrderBtn").disabled = true;
    var opts = document.querySelectorAll(".pay-option");
    for (var i = 0; i < opts.length; i++) opts[i].classList.remove("is-selected");
    $("payTotal").textContent = money(cartTotal());
    hideModal("cartModal");
    showModal("paymentModal");
  }

  function sendOrderToServer() {
    var payload = {
      paymentMethod: state.paymentMethod,
      items: cartItems().map(function (it) {
        return {
          productId: it.product.id,
          name: it.product.name,
          price: it.product.price,
          qty: it.qty
        };
      })
    };

    return fetch(API_URL + "/api/order", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    }).then(function (res) {
      if (!res.ok) throw new Error("Order failed");
      return res.json();
    });
  }

  function placeOrder() {
    if (!state.paymentMethod) return;

    var btn = $("placeOrderBtn");
    btn.disabled = true;
    btn.textContent = "Sending...";

    sendOrderToServer()
      .then(function (data) {
        showReceipt(data.order.orderId);
      })
      .catch(function () {
        toast("Could not send order. Check your connection and try again.");
      })
      .then(function () {
        btn.disabled = false;
        btn.textContent = "Place Order";
      });
  }

  function showReceipt(orderId) {
    var items = cartItems();
    $("orderId").textContent = orderId;
    $("receiptList").innerHTML = items.map(function (it) {
      return '<li class="receipt-item"><span>' + it.qty + '× ' + it.product.name +
        '</span><span>' + money(it.product.price * it.qty) + '</span></li>';
    }).join("");
    $("receiptMethod").textContent = state.paymentMethod === "CASH" ? "Cash" : "E-Wallet";
    $("receiptTotal").textContent = money(cartTotal());
    $("receiptNote").textContent = state.paymentMethod === "CASH"
      ? "Please pay at the counter."
      : "Please complete your e-wallet payment at the counter by scanning the QR code.";

    hideModal("paymentModal");
    showModal("receiptModal");
  }

  function resetOrder() {
    state.cart = {};
    state.paymentMethod = null;
    hideModal("receiptModal");
    renderProducts();
    renderCartBar();
  }

  // ---------- Events ----------
  function bindEvents() {
    $("categoryList").addEventListener("click", function (e) {
      var btn = e.target.closest("[data-category]");
      if (!btn) return;
      state.category = btn.dataset.category;
      renderCategories();
      renderProducts();
      document.querySelector(".content").scrollTop = 0;
    });

    function qtyHandler(e) {
      var btn = e.target.closest("[data-action]");
      if (!btn) return;
      var id = Number(btn.dataset.id);
      if (btn.dataset.action === "inc") {
        changeQty(id, 1);
        if (!state.cart[id] || state.cart[id] === 1) toast(findProduct(id).name + " added");
      } else {
        changeQty(id, -1);
      }
    }
    $("productGrid").addEventListener("click", qtyHandler);
    $("cartList").addEventListener("click", qtyHandler);

    $("cartBar").addEventListener("click", function () {
      renderCart();
      showModal("cartModal");
    });

    $("checkoutBtn").addEventListener("click", openPayment);

    $("payOptions").addEventListener("click", function (e) {
      var btn = e.target.closest("[data-method]");
      if (!btn) return;
      state.paymentMethod = btn.dataset.method;
      var opts = document.querySelectorAll(".pay-option");
      for (var i = 0; i < opts.length; i++) opts[i].classList.remove("is-selected");
      btn.classList.add("is-selected");
      $("placeOrderBtn").disabled = false;
    });

    $("placeOrderBtn").addEventListener("click", placeOrder);
    $("newOrderBtn").addEventListener("click", resetOrder);

    // Close buttons and backdrop taps
    document.addEventListener("click", function (e) {
      var closeBtn = e.target.closest("[data-close]");
      if (closeBtn) hideModal(closeBtn.dataset.close);
      if (e.target.classList.contains("modal") && e.target.id !== "receiptModal") {
        hideModal(e.target.id);
      }
    });
  }

  // ---------- Init ----------
  renderCategories();
  renderProducts();
  renderCartBar();
  bindEvents();
})();
