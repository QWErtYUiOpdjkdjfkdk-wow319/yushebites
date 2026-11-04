(function () {
  "use strict";

  var CURRENCY = "₱";
  // URL of your Express API: set it in config.js
  var API_URL = (window.APP_CONFIG && window.APP_CONFIG.API_URL) || "http://localhost:5000";
  var REFRESH_MS = 30000;          // re-check stock every 30 seconds
  var LOW_STOCK_NOTE = 5;          // show "Only N left" at or below this
  var DEFAULT_EMOJI = "🍽️";

  // Filled from GET /api/menu (the Inventory page in the admin dashboard)
  var categories = [];             // { id, name, icon }
  var products = [];               // { id, name, description, price, stock, emoji, categoryId }
  var menuStatus = "loading";      // loading | ready | error

  var state = {
    category: "all",
    cart: {},                      // productId -> quantity
    paymentMethod: null
  };

  // ---------- Helpers ----------
  function $(id) { return document.getElementById(id); }

  function money(n) { return CURRENCY + Number(n).toFixed(2); }

  function esc(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }

  function findProduct(id) {
    for (var i = 0; i < products.length; i++) {
      if (products[i].id === id) return products[i];
    }
    return null;
  }

  function cartItems() {
    return Object.keys(state.cart).map(function (key) {
      return { product: findProduct(key), qty: state.cart[key] };
    }).filter(function (it) { return it.product; });
  }

  function cartTotal() {
    return cartItems().reduce(function (sum, it) {
      return sum + it.product.price * it.qty;
    }, 0);
  }

  function cartCount() {
    return cartItems().reduce(function (sum, it) { return sum + it.qty; }, 0);
  }

  function isOpen(id) { return !$(id).classList.contains("hidden"); }
  function showModal(id) { $(id).classList.remove("hidden"); }
  function hideModal(id) { $(id).classList.add("hidden"); }

  var toastTimer = null;
  function toast(msg) {
    var el = $("toast");
    el.textContent = msg;
    el.classList.remove("hidden");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { el.classList.add("hidden"); }, 2600);
  }

  // ---------- Menu loading ----------
  function buildCategories(list) {
    var result = [{ id: "all", name: "All", icon: DEFAULT_EMOJI }];
    list.forEach(function (c) {
      var first = products.filter(function (p) { return p.categoryId === c.id && p.emoji; })[0];
      result.push({ id: c.id, name: c.name, icon: first ? first.emoji : DEFAULT_EMOJI });
    });
    return result;
  }

  // Keep the cart valid after stock or products change on the server.
  // Returns true if anything had to be reduced or removed.
  function syncCartWithMenu() {
    var changed = false;
    Object.keys(state.cart).forEach(function (id) {
      var p = findProduct(id);
      if (!p || p.stock <= 0) {
        delete state.cart[id];
        changed = true;
      } else if (state.cart[id] > p.stock) {
        state.cart[id] = p.stock;
        changed = true;
      }
    });
    return changed;
  }

  // silent: no "Loading" screen. quiet: don't show the "stock changed" notice (a clearer message is already showing)
  function loadMenu(silent, quiet) {
    if (!silent && products.length === 0) {
      menuStatus = "loading";
      renderProducts();
    }

    return fetch(API_URL + "/api/menu", { cache: "no-store" })
      .then(function (res) {
        if (!res.ok) throw new Error("Menu request failed");
        return res.json();
      })
      .then(function (data) {
        products = (data.products || []).map(function (p) {
          return {
            id: String(p.id),
            name: p.name,
            description: p.description || "",
            price: Number(p.price),
            stock: Number(p.stock),
            emoji: p.emoji || "",
            categoryId: String(p.categoryId)
          };
        });
        categories = buildCategories(data.categories || []);

        var stillExists = categories.some(function (c) { return c.id === state.category; });
        if (!stillExists) state.category = "all";

        menuStatus = "ready";
        var adjusted = syncCartWithMenu();

        renderCategories();
        renderProducts();
        renderCartBar();
        if (isOpen("cartModal")) renderCart();
        if (adjusted && !quiet) toast("Some items in your order changed because stock updated.");
      })
      .catch(function () {
        // A failed background refresh is ignored; keep showing the last menu
        if (products.length === 0) {
          menuStatus = "error";
          renderCategories();
          renderProducts();
        }
      });
  }

  function changeQty(id, delta) {
    var p = findProduct(id);
    if (!p) return;

    var next = (state.cart[id] || 0) + delta;
    if (next > p.stock) {
      toast(p.stock === 0 ? p.name + " is sold out." : "Only " + p.stock + " of " + p.name + " left.");
      return;
    }
    if (next <= 0) {
      delete state.cart[id];
    } else {
      state.cart[id] = next;
    }
    renderProducts();
    renderCartBar();
    if (isOpen("cartModal")) renderCart();
  }

  // ---------- Rendering ----------
  function renderCategories() {
    var list = categories.length ? categories : [{ id: "all", name: "All", icon: DEFAULT_EMOJI }];

    $("categoryList").innerHTML = list.map(function (c) {
      var active = c.id === state.category ? " is-active" : "";
      return '<button type="button" class="cat-btn' + active + '" data-category="' + esc(c.id) + '">' +
        '<span class="cat-btn__icon">' + esc(c.icon) + '</span>' +
        '<span>' + esc(c.name) + '</span></button>';
    }).join("");

    var current = list.filter(function (c) { return c.id === state.category; })[0];
    $("categoryTitle").textContent = current ? current.name : "All";
  }

  function renderProducts() {
    var grid = $("productGrid");

    if (menuStatus === "loading") {
      grid.innerHTML = '<p class="grid-message">Loading menu…</p>';
      return;
    }
    if (menuStatus === "error") {
      grid.innerHTML = '<div class="grid-message">' +
        '<p>Could not load the menu. Check your connection.</p>' +
        '<button type="button" class="btn btn--primary" data-action="retry">Try again</button></div>';
      return;
    }

    var list = products.filter(function (p) {
      return state.category === "all" || p.categoryId === state.category;
    });

    if (list.length === 0) {
      grid.innerHTML = '<p class="grid-message">No items available here yet.</p>';
      return;
    }

    grid.innerHTML = list.map(function (p) {
      var qty = state.cart[p.id] || 0;
      var soldOut = p.stock <= 0;
      var action;

      if (soldOut) {
        action = '<button type="button" class="add-btn" disabled>Sold out</button>';
      } else if (qty > 0) {
        action = '<div class="stepper">' +
            '<button type="button" data-action="dec" data-id="' + esc(p.id) + '">−</button>' +
            '<span>' + qty + '</span>' +
            '<button type="button" data-action="inc" data-id="' + esc(p.id) + '"' +
              (qty >= p.stock ? " disabled" : "") + '>+</button>' +
          '</div>';
      } else {
        action = '<button type="button" class="add-btn" data-action="inc" data-id="' + esc(p.id) + '">Add</button>';
      }

      var note = (!soldOut && p.stock <= LOW_STOCK_NOTE)
        ? '<div class="product__stock">Only ' + p.stock + ' left</div>' : "";

      return '<article class="product' + (soldOut ? " product--soldout" : "") + '" title="' + esc(p.description) + '">' +
        '<div class="product__emoji">' + esc(p.emoji || DEFAULT_EMOJI) + '</div>' +
        '<div class="product__name">' + esc(p.name) + '</div>' +
        '<div class="product__price">' + money(p.price) + '</div>' +
        note +
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
        '<span class="cart-item__emoji">' + esc(p.emoji || DEFAULT_EMOJI) + '</span>' +
        '<div class="cart-item__info">' +
          '<div class="cart-item__name">' + esc(p.name) + '</div>' +
          '<div class="cart-item__price">' + money(p.price) + ' each</div>' +
        '</div>' +
        '<div class="stepper">' +
          '<button type="button" data-action="dec" data-id="' + esc(p.id) + '">−</button>' +
          '<span>' + it.qty + '</span>' +
          '<button type="button" data-action="inc" data-id="' + esc(p.id) + '"' +
            (it.qty >= p.stock ? " disabled" : "") + '>+</button>' +
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

  // Only product ids and quantities are sent. The server looks up the real prices
  // and takes the stock off, so nothing here can be tampered with.
  function sendOrderToServer() {
    var payload = {
      paymentMethod: state.paymentMethod,
      items: cartItems().map(function (it) {
        return { productId: it.product.id, qty: it.qty };
      })
    };

    return fetch(API_URL + "/api/order", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    }).then(function (res) {
      return res.json().catch(function () { return {}; }).then(function (body) {
        if (!res.ok) {
          var err = new Error(body.message || "Order failed");
          err.code = body.code;
          err.status = res.status;
          throw err;
        }
        return body;
      });
    });
  }

  function placeOrder() {
    if (!state.paymentMethod) return;

    var btn = $("placeOrderBtn");
    btn.disabled = true;
    btn.textContent = "Sending...";

    sendOrderToServer()
      .then(function (data) {
        showReceipt(data.order);
        loadMenu(true); // pick up the new stock levels
      })
      .catch(function (err) {
        if (err.code === "OUT_OF_STOCK" || err.status === 400) {
          // Stock changed while the customer was ordering: show the reason, refresh, and go back to the cart
          toast(err.message);
          hideModal("paymentModal");
          return loadMenu(true, true).then(function () {
            if (cartCount() > 0) { renderCart(); showModal("cartModal"); }
          });
        }
        toast("Could not send order. Check your connection and try again.");
      })
      .then(function () {
        btn.disabled = !state.paymentMethod;
        btn.textContent = "Place Order";
      });
  }

  // The receipt shows exactly what the server saved (real names, prices and total)
  function showReceipt(order) {
    $("orderId").textContent = order.orderId;
    $("receiptList").innerHTML = order.items.map(function (it) {
      return '<li class="receipt-item"><span>' + it.qty + '× ' + esc(it.name) +
        '</span><span>' + money(it.price * it.qty) + '</span></li>';
    }).join("");
    $("receiptMethod").textContent = order.paymentMethod === "CASH" ? "Cash" : "E-Wallet";
    $("receiptTotal").textContent = money(order.total);
    $("receiptNote").textContent = order.paymentMethod === "CASH"
      ? "Please pay at the counter."
      : "Please complete your e-wallet payment at the counter by scanning the QR code.";

    state.cart = {};
    renderCartBar();
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
      var action = btn.dataset.action;

      if (action === "retry") { loadMenu(false); return; }

      var id = btn.dataset.id;
      if (action === "inc") {
        var wasEmpty = !state.cart[id];
        changeQty(id, 1);
        if (wasEmpty && state.cart[id]) toast(findProduct(id).name + " added");
      } else if (action === "dec") {
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

    // Keep stock fresh: when the customer returns to the tab, and every 30 seconds
    document.addEventListener("visibilitychange", function () {
      if (!document.hidden) loadMenu(true);
    });
    setInterval(function () {
      if (!document.hidden && !isOpen("paymentModal")) loadMenu(true);
    }, REFRESH_MS);
  }

  // ---------- Init ----------
  renderCategories();
  renderProducts();
  renderCartBar();
  bindEvents();
  loadMenu(false);
})();
