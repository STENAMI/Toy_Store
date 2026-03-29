(function () {
  const CART_KEY = "igrushkino_cart";
  const CART_UPDATED_KEY = "igrushkino_cart_updated_at";
  const FAVORITES_UPDATED_KEY = "igrushkino_favorites_updated_at";
  const VIEWED_UPDATED_KEY = "igrushkino_viewed_updated_at";
  const ORDERS_KEY = "igrushkino_orders";
  const { getProducts, getSettings, saveSettings, getFavorites, setFavorites, getViewed, setViewed, getSearchHistory, setSearchHistory, t, applyI18n } =
    window.ToyStoreData;
  const api = window.ToyStoreApi;

  const EXCHANGE = { RUB: 1, USD: 0.011, EUR: 0.01 };
  const LOCALES = { ru: "ru-RU", en: "en-US" };

  const state = {
    products: [],
    filters: {
      search: "",
      sort: "popular",
      audience: "all",
      category: "all",
      favoritesOnly: false,
    },
    popularIndex: 0,
    modalProductId: null,
    historyOpen: false,
    heroIndex: 0,
  };

  const genderLabels = {
    ru: { boys: "Для мальчиков", girls: "Для девочек", unisex: "Универсальные" },
    en: { boys: "For Boys", girls: "For Girls", unisex: "Unisex" },
  };

  const categoryLabels = {
    ru: {
      plush: "Мягкие игрушки",
      builder: "Конструкторы",
      dolls: "Куклы",
      board: "Настольные игры",
      transport: "Транспорт",
      science: "Наука",
      creative: "Творчество",
      outdoor: "Активные игры",
      toys: "Игрушки",
    },
    en: {
      plush: "Plush Toys",
      builder: "Building Sets",
      dolls: "Dolls",
      board: "Board Games",
      transport: "Transport",
      science: "Science",
      creative: "Creative",
      outdoor: "Outdoor",
      toys: "Toys",
    },
  };

  categoryLabels.ru = {
    plush: "\u041c\u044f\u0433\u043a\u0438\u0435 \u0438\u0433\u0440\u0443\u0448\u043a\u0438",
    builder: "\u041a\u043e\u043d\u0441\u0442\u0440\u0443\u043a\u0442\u043e\u0440\u044b",
    dolls: "\u041a\u0443\u043a\u043b\u044b",
    board: "\u041d\u0430\u0441\u0442\u043e\u043b\u044c\u043d\u044b\u0435 \u0438\u0433\u0440\u044b",
    transport: "\u0422\u0440\u0430\u043d\u0441\u043f\u043e\u0440\u0442",
    science: "\u041d\u0430\u0443\u043a\u0430",
    creative: "\u0422\u0432\u043e\u0440\u0447\u0435\u0441\u0442\u0432\u043e",
    outdoor: "\u0410\u043a\u0442\u0438\u0432\u043d\u044b\u0435 \u0438\u0433\u0440\u044b",
    toys: "\u0418\u0433\u0440\u0443\u0448\u043a\u0438",
  };

  function getLocale() {
    return getSettings().language || "ru";
  }

  function getCurrency() {
    return getSettings().currency || "RUB";
  }

  function getCategoryOptions() {
    const categories = Array.from(
      new Set(
        currentProducts()
          .map((product) => String(product.category || "toys").trim())
          .filter(Boolean)
      )
    );
    const labels = categoryLabels[getLocale()] || {};
    return categories.sort((a, b) => String(labels[a] || a).localeCompare(String(labels[b] || b), getLocale()));
  }

  function renderCategoryOptions() {
    const select = document.getElementById("categorySelect");
    if (!select) return;
    const current = state.filters.category || "all";
    const options = ["all", ...getCategoryOptions()];
    const labels = categoryLabels[getLocale()] || {};
    select.innerHTML = options
      .map((value) => {
        const label = value === "all" ? t("categoryAll") : labels[value] || value;
        return `<option value="${value}">${label}</option>`;
      })
      .join("");
    select.value = options.includes(current) ? current : "all";
    state.filters.category = select.value;
  }

  function currentProducts() {
    state.products = getProducts();
    return state.products;
  }

  function getCart() {
    try {
      const raw = JSON.parse(localStorage.getItem(CART_KEY) || "[]");
      return Array.isArray(raw) ? raw : [];
    } catch {
      return [];
    }
  }

  function getCurrentUser() {
    return window.ToyStoreAuth?.getUser?.() || null;
  }

  function getUpdated(key) {
    return Number(localStorage.getItem(key) || 0) || 0;
  }

  function setUpdated(key, value) {
    localStorage.setItem(key, String(value || Date.now()));
  }

  let syncStatusTimer = null;

  function ensureSyncStatus() {
    let node = document.getElementById("syncStatus");
    if (!node) {
      node = document.createElement("div");
      node.id = "syncStatus";
      node.className = "sync-status";
      document.body.appendChild(node);
    }
    return node;
  }

  function showSyncStatus(message, variant) {
    const node = ensureSyncStatus();
    node.textContent = message;
    node.classList.remove("is-warning", "is-success");
    if (variant) node.classList.add(variant);
    node.classList.add("is-visible");
    if (syncStatusTimer) window.clearTimeout(syncStatusTimer);
    syncStatusTimer = window.setTimeout(() => {
      node.classList.remove("is-visible");
    }, 4200);
  }

  async function pushUserDataToApi() {
    if (!api?.enabled) return;
    const user = getCurrentUser();
    if (!user?.email) return;
    const result = await api.fetch(`/api/user-data/${encodeURIComponent(user.email)}`, {
      method: "PUT",
      body: {
        cart: getCart(),
        favorites: getFavorites(),
        viewed: getViewed(),
        cartUpdatedAt: getUpdated(CART_UPDATED_KEY),
        favoritesUpdatedAt: getUpdated(FAVORITES_UPDATED_KEY),
        viewedUpdatedAt: getUpdated(VIEWED_UPDATED_KEY),
      },
    });
    if (!result) {
      showSyncStatus("Синхронизация временно недоступна. Данные сохранены локально.", "is-warning");
    }
  }

  async function syncUserDataFromApi() {
    if (!api?.enabled) return;
    const user = getCurrentUser();
    if (!user?.email) return;
    const data = await api.fetch(`/api/user-data/${encodeURIComponent(user.email)}`);
    if (!data) {
      showSyncStatus("Не удалось синхронизировать данные. Проверьте соединение.", "is-warning");
      return;
    }
    const payload = data?.data;
    if (!payload) {
      if (getCart().length || getFavorites().length) {
        setUpdated(CART_UPDATED_KEY, getUpdated(CART_UPDATED_KEY) || Date.now());
        setUpdated(FAVORITES_UPDATED_KEY, getUpdated(FAVORITES_UPDATED_KEY) || Date.now());
        setUpdated(VIEWED_UPDATED_KEY, getUpdated(VIEWED_UPDATED_KEY) || Date.now());
        await pushUserDataToApi();
      }
      return;
    }

    const remoteCartUpdated = Number(payload.cartUpdatedAt || 0) || 0;
    const remoteFavUpdated = Number(payload.favoritesUpdatedAt || 0) || 0;
    const remoteViewedUpdated = Number(payload.viewedUpdatedAt || 0) || 0;
    const localCartUpdated = getUpdated(CART_UPDATED_KEY);
    const localFavUpdated = getUpdated(FAVORITES_UPDATED_KEY);
    const localViewedUpdated = getUpdated(VIEWED_UPDATED_KEY);

    if (Array.isArray(payload.cart) && remoteCartUpdated >= localCartUpdated) {
      localStorage.setItem(CART_KEY, JSON.stringify(payload.cart));
      setUpdated(CART_UPDATED_KEY, remoteCartUpdated || Date.now());
    } else if (localCartUpdated > remoteCartUpdated) {
      await pushUserDataToApi();
    }

    if (Array.isArray(payload.favorites) && remoteFavUpdated >= localFavUpdated) {
      localStorage.setItem(window.ToyStoreData.KEYS.favorites, JSON.stringify(payload.favorites));
      setUpdated(FAVORITES_UPDATED_KEY, remoteFavUpdated || Date.now());
      window.dispatchEvent(new CustomEvent("toy-favorites-updated"));
    } else if (localFavUpdated > remoteFavUpdated) {
      await pushUserDataToApi();
    }

    if (Array.isArray(payload.viewed) && remoteViewedUpdated >= localViewedUpdated) {
      localStorage.setItem(window.ToyStoreData.KEYS.viewed, JSON.stringify(payload.viewed));
      setUpdated(VIEWED_UPDATED_KEY, remoteViewedUpdated || Date.now());
    } else if (localViewedUpdated > remoteViewedUpdated) {
      await pushUserDataToApi();
    }
  }

  function saveCart(items) {
    localStorage.setItem(CART_KEY, JSON.stringify(items));
    setUpdated(CART_UPDATED_KEY, Date.now());
    pushUserDataToApi();
    window.dispatchEvent(new CustomEvent("toy-cart-updated"));
  }

  function formatPrice(value) {
    const currency = getCurrency();
    const locale = LOCALES[getLocale()] || LOCALES.ru;
    const converted = Number(value || 0) * (EXCHANGE[currency] || 1);
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency,
      maximumFractionDigits: currency === "RUB" ? 0 : 2,
    }).format(converted);
  }

  function localizeProduct(product) {
    const isEn = getLocale() === "en";
    return {
      ...product,
      titleView: isEn ? product.titleEn || product.title : product.title,
      descriptionView: isEn ? product.descriptionEn || product.description : product.description,
      materialView: isEn ? product.materialEn || product.material : product.material,
      genderView: genderLabels[getLocale()]?.[product.gender] || product.gender,
      categoryView: categoryLabels[getLocale()]?.[product.category] || product.category,
    };
  }

  function findProduct(id) {
    return currentProducts().find((item) => item.id === id) || null;
  }

  function syncCartWithProducts() {
    const cart = getCart();
    let changed = false;
    const next = cart
      .map((line) => {
        const product = findProduct(line.id);
        if (!product) return null;
        const image = product.images?.[0] || product.image;
        if (line.price !== product.price || line.title !== product.title || line.image !== image) {
          changed = true;
        }
        return {
          id: product.id,
          title: product.title,
          price: product.price,
          image,
          qty: Number(line.qty || 1),
        };
      })
      .filter(Boolean);
    if (changed || next.length !== cart.length) saveCart(next);
  }

  function updateBadge() {
    const count = getCart().reduce((sum, line) => sum + Number(line.qty || 0), 0);
    const el = document.getElementById("cartCount");
    if (!el) return;
    el.textContent = String(count);
    el.classList.toggle("is-zero", count === 0);
  }

  function toggleFavorite(id) {
    const favorites = new Set(getFavorites());
    if (favorites.has(id)) favorites.delete(id);
    else favorites.add(id);
    setFavorites(Array.from(favorites));
    setUpdated(FAVORITES_UPDATED_KEY, Date.now());
    pushUserDataToApi();
  }

  function addViewed(id) {
    const list = getViewed().filter((item) => item !== id);
    list.unshift(id);
    setViewed(list);
    setUpdated(VIEWED_UPDATED_KEY, Date.now());
    pushUserDataToApi();
  }

  function rememberSearch(query) {
    const text = String(query || "").trim();
    if (!text) return;
    const list = getSearchHistory().filter((item) => item.toLowerCase() !== text.toLowerCase());
    list.unshift(text);
    setSearchHistory(list);
  }

  function getFilteredProducts() {
    const products = currentProducts();
    const favorites = new Set(getFavorites());
    const search = state.filters.search.trim().toLowerCase();
    let list = products.filter((product) => {
      const localized = localizeProduct(product);
      const haystack = [product.title, product.titleEn, product.description, product.descriptionEn, product.material, product.keywords]
        .join(" ")
        .toLowerCase();
      const matchesSearch = !search || haystack.includes(search);
      const matchesAudience =
        state.filters.audience === "all" ||
        product.gender === state.filters.audience ||
        (state.filters.audience === "unisex" && product.gender === "unisex");
      const matchesCategory = state.filters.category === "all" || product.category === state.filters.category;
      const matchesFavorite = !state.filters.favoritesOnly || favorites.has(product.id);
      return matchesSearch && matchesAudience && matchesCategory && matchesFavorite && localized;
    });

    if (state.filters.sort === "category") {
      list = list.sort((a, b) => {
        const aItem = localizeProduct(a);
        const bItem = localizeProduct(b);
        return `${aItem.categoryView} ${aItem.titleView}`.localeCompare(`${bItem.categoryView} ${bItem.titleView}`, getLocale());
      });
    } else if (state.filters.sort === "price-asc") {
      list = list.sort((a, b) => a.price - b.price);
    } else if (state.filters.sort === "price-desc") {
      list = list.sort((a, b) => b.price - a.price);
    } else {
      list = list.sort((a, b) => Number(b.popularScore || 0) - Number(a.popularScore || 0));
    }
    return list;
  }

  function productCardMarkup(product, compact) {
    const item = localizeProduct(product);
    const favorites = new Set(getFavorites());
    return `
      <article class="product ${compact ? "product--compact" : ""}" data-product-id="${item.id}">
        <button type="button" class="product__favorite ${favorites.has(item.id) ? "is-active" : ""}" data-favorite-id="${item.id}" aria-label="${t("favorites")}">
          ${favorites.has(item.id) ? "♥" : "♡"}
        </button>
        <button type="button" class="product__card-open" data-open-product="${item.id}">
          <div class="product__img-wrap">
            <img src="${item.images[0]}" alt="${escapeHtml(item.titleView)}" loading="lazy" />
          </div>
          <div class="product__copy">
            <span class="product__meta-pill">${escapeHtml(item.age)} · ${escapeHtml(item.materialView)}</span>
            <h3>${escapeHtml(item.titleView)}</h3>
            <p class="product__description">${escapeHtml(item.descriptionView)}</p>
          </div>
        </button>
        <div class="product__price-row">
          <p class="product__price">${formatPrice(item.price)}</p>
          ${item.oldPrice ? `<p class="product__old-price">${formatPrice(item.oldPrice)}</p>` : ""}
        </div>
        <div class="product__actions">
          <button type="button" class="btn btn--outline btn--sm" data-open-product="${item.id}">${t("details")}</button>
          <button type="button" class="btn btn--primary btn--sm" data-add-id="${item.id}">${t("addToCart")}</button>
        </div>
      </article>
    `;
  }

  function renderShop() {
    const grid = document.getElementById("shopGrid");
    const hint = document.getElementById("shopSearchHint");
    const empty = document.getElementById("shopEmpty");
    if (!grid || !hint || !empty) return;

    const products = getFilteredProducts();
    hint.textContent = state.filters.search
      ? t("searchResults", { count: products.length, total: currentProducts().length })
      : "";
    empty.textContent = t("emptyShop");

    if (!products.length) {
      grid.innerHTML = "";
      empty.classList.remove("hidden");
      return;
    }

    empty.classList.add("hidden");
    grid.innerHTML = products.map((product) => productCardMarkup(product, false)).join("");
    bindProductActions(grid);
  }

  function renderPopular() {
    const viewport = document.getElementById("popularTrack");
    if (!viewport) return;
    const popular = currentProducts()
      .filter((product) => product.featured || product.popularScore >= 80)
      .sort((a, b) => b.popularScore - a.popularScore);
    viewport.innerHTML = popular.map((product) => productCardMarkup(product, true)).join("");
    bindProductActions(viewport);
    bindPopularScroll(viewport);
    updatePopularPosition();
  }

  function bindPopularScroll(track) {
    if (!track || track.dataset.popularBound === "true") return;
    track.dataset.popularBound = "true";
    let raf = null;
    track.addEventListener("scroll", () => {
      if (raf) cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        state.popularIndex = getPopularIndexFromScroll(track);
      });
    });
  }

  function getPopularIndexFromScroll(track) {
    const cards = Array.from(track.querySelectorAll(".product"));
    if (!cards.length) return 0;
    const center = track.scrollLeft + track.clientWidth / 2;
    let nextIndex = 0;
    let best = Infinity;
    cards.forEach((card, index) => {
      const cardCenter = card.offsetLeft + card.offsetWidth / 2;
      const distance = Math.abs(cardCenter - center);
      if (distance < best) {
        best = distance;
        nextIndex = index;
      }
    });
    return nextIndex;
  }

  function updatePopularPosition() {
    const track = document.getElementById("popularTrack");
    if (!track) return;
    const cards = track.querySelectorAll(".product");
    const maxIndex = Math.max(0, cards.length - 1);
    state.popularIndex = Math.max(0, Math.min(state.popularIndex, maxIndex));
    const maxScroll = Math.max(0, track.scrollWidth - track.clientWidth);
    if (state.popularIndex <= 0) {
      track.scrollTo({ left: 0, behavior: "smooth" });
      return;
    }
    if (state.popularIndex >= maxIndex) {
      track.scrollTo({ left: maxScroll, behavior: "smooth" });
      return;
    }
    const active = cards[state.popularIndex];
    if (!active) return;
    active.scrollIntoView({ behavior: "smooth", inline: "start", block: "nearest" });
  }

  function renderFavoritesSection() {
    const root = document.getElementById("favoritesGrid");
    const empty = document.getElementById("favoritesEmpty");
    if (!root || !empty) return;
    const favorites = new Set(getFavorites());
    const items = currentProducts().filter((product) => favorites.has(product.id));
    if (!items.length) {
      root.innerHTML = "";
      empty.textContent = t("yourFavoritesEmpty");
      empty.classList.remove("hidden");
      return;
    }
    empty.classList.add("hidden");
    root.innerHTML = items.map((product) => productCardMarkup(product, true)).join("");
    bindProductActions(root);
  }

  function renderViewedSection() {
    const root = document.getElementById("viewedGrid");
    const empty = document.getElementById("viewedEmpty");
    if (!root || !empty) return;
    const products = getViewed()
      .map((id) => findProduct(id))
      .filter(Boolean);
    if (!products.length) {
      root.innerHTML = "";
      empty.textContent = t("viewedEmpty");
      empty.classList.remove("hidden");
      return;
    }
    empty.classList.add("hidden");
    root.innerHTML = products.map((product) => productCardMarkup(product, true)).join("");
    bindProductActions(root);
  }

  function renderSearchHistory() {
    const root = document.getElementById("searchHistoryList");
    const empty = document.getElementById("searchHistoryEmpty");
    const clearBtn = document.getElementById("btnClearSearchHistory");
    const popover = document.getElementById("searchHistoryPopover");
    if (!root || !empty || !clearBtn) return;
    const list = getSearchHistory();
    clearBtn.textContent = t("searchHistoryClear");
    popover?.classList.toggle("hidden", !state.historyOpen);
    if (!list.length) {
      root.innerHTML = "";
      empty.textContent = t("historyEmpty");
      empty.classList.remove("hidden");
      clearBtn.classList.add("hidden");
      return;
    }
    empty.classList.add("hidden");
    clearBtn.classList.remove("hidden");
    root.innerHTML = list
      .map((query) => `<button type="button" class="chip chip--history" data-history-query="${escapeHtml(query)}">${escapeHtml(query)}</button>`)
      .join("");
    root.querySelectorAll("[data-history-query]").forEach((button) => {
      button.addEventListener("click", () => {
        const value = button.getAttribute("data-history-query") || "";
        state.filters.search = value;
        const search = document.getElementById("shopSearch");
        if (search) search.value = value;
        state.historyOpen = false;
        renderAllCatalogPieces();
      });
    });
  }

  function openProductModal(id) {
    const product = findProduct(id);
    const modal = document.getElementById("productModal");
    const body = document.getElementById("productModalBody");
    if (!product || !modal || !body) return;
    const item = localizeProduct(product);
    state.modalProductId = id;
    addViewed(id);
    const favorites = new Set(getFavorites());
    const isFavorite = favorites.has(item.id);
    body.innerHTML = `
      <div class="product-modal__layout">
        <div class="product-modal__gallery">
          <img class="product-modal__hero" id="productModalHero" src="${item.images[0]}" alt="${escapeHtml(item.titleView)}" />
          <div class="product-modal__thumbs">
            ${item.images
              .map(
                (src, index) => `
                <button type="button" class="product-modal__thumb ${index === 0 ? "is-active" : ""}" data-gallery-src="${src}">
                  <img src="${src}" alt="" />
                </button>
              `
              )
              .join("")}
          </div>
        </div>
        <div class="product-modal__content">
          <span class="product__meta-pill">${escapeHtml(item.categoryView)} · ${escapeHtml(item.genderView)}</span>
          <h2>${escapeHtml(item.titleView)}</h2>
          <p class="product-modal__price">${formatPrice(item.price)}</p>
          <div class="product-modal__facts">
            <div><strong>${t("productAge")}:</strong> ${escapeHtml(item.age)}</div>
            <div><strong>${t("productMaterial")}:</strong> ${escapeHtml(item.materialView)}</div>
          </div>
          <div>
            <h3>${t("productDescription")}</h3>
            <p>${escapeHtml(item.descriptionView)}</p>
          </div>
          <div class="product-modal__actions">
            <button type="button" class="btn btn--outline ${isFavorite ? "is-active" : ""}" data-modal-favorite="${item.id}">${isFavorite ? "♥ " : "♡ "}${t("favorites")}</button>
            <button type="button" class="btn btn--primary" data-modal-add="${item.id}">${t("productModalBuy")}</button>
          </div>
        </div>
      </div>
    `;
    modal.classList.add("is-open");
    modal.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
    body.querySelectorAll("[data-gallery-src]").forEach((button) => {
      button.addEventListener("click", () => {
        body.querySelectorAll("[data-gallery-src]").forEach((node) => node.classList.remove("is-active"));
        button.classList.add("is-active");
        const hero = document.getElementById("productModalHero");
        if (hero) hero.src = button.getAttribute("data-gallery-src");
      });
    });
    body.querySelector("[data-modal-add]")?.addEventListener("click", () => {
      addToCart(item.id, 1);
      closeProductModal();
      openCart();
    });
    body.querySelector("[data-modal-favorite]")?.addEventListener("click", () => {
      toggleFavorite(item.id);
      renderAllCatalogPieces();
      openProductModal(item.id);
    });
    renderViewedSection();
  }

  function closeProductModal() {
    const modal = document.getElementById("productModal");
    if (!modal) return;
    modal.classList.remove("is-open");
    modal.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
  }

  function addToCart(productId, qty) {
    const product = findProduct(productId);
    if (!product) return;
    const cart = getCart();
    const line = cart.find((item) => item.id === productId);
    const amount = Math.max(1, Number(qty || 1));
    const image = product.images?.[0] || product.image;
    if (line) line.qty += amount;
    else cart.push({ id: product.id, title: product.title, price: product.price, image, qty: amount });
    saveCart(cart);
    renderCart();
    updateBadge();
  }

  function setQty(id, qty) {
    const cart = getCart();
    const line = cart.find((item) => item.id === id);
    if (!line) return;
    if (qty <= 0) {
      saveCart(cart.filter((item) => item.id !== id));
    } else {
      line.qty = qty;
      saveCart(cart);
    }
    renderCart();
    updateBadge();
  }

  function cartTotal() {
    return getCart().reduce((sum, line) => sum + Number(line.price || 0) * Number(line.qty || 0), 0);
  }

  function renderCart() {
    const root = document.getElementById("cartItems");
    const total = document.getElementById("cartTotal");
    if (!root || !total) return;
    const cart = getCart();
    if (!cart.length) {
      root.innerHTML = `<p class="cart-empty">${getLocale() === "en" ? "Your cart is empty. Add products from the catalog." : "Корзина пуста. Добавьте товары из каталога."}</p>`;
      total.textContent = formatPrice(0);
      return;
    }
    root.innerHTML = cart
      .map((line) => {
        const product = findProduct(line.id);
        const title = getLocale() === "en" ? product?.titleEn || line.title : product?.title || line.title;
        return `
          <div class="cart-line" data-id="${line.id}">
            <img src="${product?.images?.[0] || line.image}" alt="" />
            <div class="cart-line__info">
              <div class="cart-line__title">${escapeHtml(title)}</div>
              <div class="cart-line__price">${formatPrice(line.price)} × ${line.qty}</div>
              <div class="cart-line__controls">
                <button type="button" class="qty-btn" data-act="minus">−</button>
                <span class="qty-val">${line.qty}</span>
                <button type="button" class="qty-btn" data-act="plus">+</button>
                <button type="button" class="cart-line__remove" data-act="remove">${getLocale() === "en" ? "Remove" : "Удалить"}</button>
              </div>
            </div>
          </div>
        `;
      })
      .join("");
    total.textContent = formatPrice(cartTotal());
    root.querySelectorAll(".cart-line").forEach((row) => {
      const id = row.getAttribute("data-id");
      row.querySelectorAll("button").forEach((button) => {
        button.addEventListener("click", () => {
          const line = getCart().find((item) => item.id === id);
          if (!line) return;
          const act = button.getAttribute("data-act");
          if (act === "plus") setQty(id, line.qty + 1);
          if (act === "minus") setQty(id, line.qty - 1);
          if (act === "remove") setQty(id, 0);
        });
      });
    });
  }

  function openCart() {
    const drawer = document.getElementById("cartDrawer");
    if (!drawer) return;
    drawer.classList.add("is-open");
    drawer.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
    renderCart();
  }

  function closeCart() {
    const drawer = document.getElementById("cartDrawer");
    if (!drawer) return;
    drawer.classList.remove("is-open");
    drawer.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
  }

  async function checkout() {
    const cart = getCart();
    if (!cart.length) return openCart();
    const city = document.getElementById("deliveryCity")?.value.trim() || "";
    const address = document.getElementById("deliveryAddress")?.value.trim() || "";
    if (!address) {
      document.getElementById("deliveryAddress")?.focus();
      return;
    }
    const total = cartTotal();
    saveSettings({ city, deliveryAddress: address });
    let orders;
    try {
      orders = JSON.parse(localStorage.getItem(ORDERS_KEY) || "[]");
    } catch {
      orders = [];
    }
    const orderId = `IG-${Date.now().toString(36).toUpperCase().slice(-8)}`;
    const order = {
      id: orderId,
      items: cart.map((line) => ({ ...line })),
      total,
      city,
      deliveryAddress: address,
      at: new Date().toISOString(),
      status: "new",
    };
    orders.push(order);
    localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
    if (api?.enabled) {
      api.fetch("/api/orders", { method: "POST", body: { order } });
    }
    saveCart([]);
    renderCart();
    updateBadge();
    closeCart();
    const modal = document.getElementById("modalOrder");
    if (!modal) return;
    const number = document.getElementById("orderNumber");
    const sum = document.getElementById("orderSum");
    const addressNode = document.getElementById("orderAddressSummary");
    if (number) number.textContent = orderId;
    if (sum) sum.textContent = formatPrice(total);
    if (addressNode) addressNode.textContent = `${city ? `${city}, ` : ""}${address}`;
    modal.classList.add("is-open");
    modal.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
  }

  function closeOrderModal() {
    const modal = document.getElementById("modalOrder");
    if (!modal) return;
    modal.classList.remove("is-open");
    modal.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
  }

  function bindProductActions(root) {
    root.querySelectorAll("[data-add-id]").forEach((button) => {
      button.addEventListener("click", () => addToCart(button.getAttribute("data-add-id"), 1));
    });
    root.querySelectorAll("[data-open-product]").forEach((button) => {
      button.addEventListener("click", () => openProductModal(button.getAttribute("data-open-product")));
    });
    root.querySelectorAll("[data-favorite-id]").forEach((button) => {
      button.addEventListener("click", (event) => {
        event.stopPropagation();
        toggleFavorite(button.getAttribute("data-favorite-id"));
        renderAllCatalogPieces();
      });
    });
  }

  function applySettingsToUI() {
    const settings = getSettings();
    document.documentElement.dataset.theme = settings.theme;
    document.body.dataset.theme = settings.theme;
    document.querySelectorAll("[data-language]").forEach((button) =>
      button.classList.toggle("is-active", button.getAttribute("data-language") === settings.language)
    );
    document.getElementById("currencySelect").value = settings.currency;
    document.querySelectorAll("[data-theme-value]").forEach((button) =>
      button.classList.toggle("is-active", button.getAttribute("data-theme-value") === settings.theme)
    );
    document.getElementById("deliveryAddressHeader").value = settings.deliveryAddress || "";
    document.getElementById("deliveryAddress").value = settings.deliveryAddress || "";
    document.getElementById("deliveryCity").value = settings.city || "";
    applyI18n(document, settings.language);
    renderCategoryOptions();
    const title = document.querySelector("title");
    if (title) title.textContent = settings.language === "en" ? "Igrushkino — Toy Store" : "Игрушкино — магазин игрушек";
  }

  function renderAllCatalogPieces() {
    renderShop();
    renderPopular();
    renderViewedSection();
    renderFavoritesSection();
    renderSearchHistory();
    updateBadge();
  }

  function escapeHtml(value) {
    const div = document.createElement("div");
    div.textContent = String(value || "");
    return div.innerHTML;
  }

  function initHeroParallax() {
    const card = document.querySelector(".hero__card--interactive");
    if (!card) return;
    const move = (clientX, clientY) => {
      const rect = card.getBoundingClientRect();
      const x = (clientX - rect.left) / rect.width - 0.5;
      const y = (clientY - rect.top) / rect.height - 0.5;
      card.style.transform = `perspective(1100px) rotateY(${x * 10}deg) rotateX(${y * -8}deg) translateY(-4px)`;
      card.style.setProperty("--pointer-x", `${x * 32}px`);
      card.style.setProperty("--pointer-y", `${y * 28}px`);
    };
    card.addEventListener("pointermove", (event) => move(event.clientX, event.clientY));
    card.addEventListener("mousemove", (event) => move(event.clientX, event.clientY));
    card.addEventListener("touchmove", (event) => {
      const touch = event.touches?.[0];
      if (touch) move(touch.clientX, touch.clientY);
    });
    card.addEventListener("pointerleave", () => {
      card.style.transform = "";
      card.style.setProperty("--pointer-x", "0px");
      card.style.setProperty("--pointer-y", "0px");
    });
    card.addEventListener("mouseleave", () => {
      card.style.transform = "";
      card.style.setProperty("--pointer-x", "0px");
      card.style.setProperty("--pointer-y", "0px");
    });
  }

  function getHeroProducts() {
    return currentProducts()
      .filter((item) => item.featured || item.mainHero)
      .sort((a, b) => {
        if (a.mainHero && !b.mainHero) return -1;
        if (!a.mainHero && b.mainHero) return 1;
        return (b.popularScore || 0) - (a.popularScore || 0);
      });
  }

  function renderHeroSlide() {
    const items = getHeroProducts();
    const image = document.getElementById("heroSlideImage");
    const title = document.getElementById("heroSlideTitle");
    const badge = document.getElementById("heroBadge");
    const price = document.getElementById("heroPriceBadge");
    const openBtn = document.getElementById("btnHeroOpen");
    if (!items.length || !image || !title || !badge || !price || !openBtn) return;
    state.heroIndex = ((state.heroIndex % items.length) + items.length) % items.length;
    const product = localizeProduct(items[state.heroIndex]);
    image.src = product.images?.[0] || product.image;
    image.alt = product.titleView;
    title.innerHTML = `<span>${escapeHtml(product.titleView)}</span>`;
    badge.textContent = `${product.categoryView} • ${product.age} • ${product.genderView}`;
    price.textContent = formatPrice(product.price);
    openBtn.onclick = () => openProductModal(product.id);
    requestAnimationFrame(() => {
      const titleText = title.querySelector("span");
      if (!titleText) return;
      title.classList.remove("is-marquee");
      title.style.removeProperty("--hero-marquee-shift");
      const overflow = Math.max(0, titleText.scrollWidth - title.clientWidth);
      if (overflow > 8) {
        title.classList.add("is-marquee");
        title.style.setProperty("--hero-marquee-shift", `-${overflow + 24}px`);
      }
    });
  }

  function initControls() {
    const searchInput = document.getElementById("shopSearch");
    const searchStack = document.querySelector(".search-stack");
    searchInput?.addEventListener("input", (event) => {
      state.filters.search = event.target.value;
      state.historyOpen = true;
      renderAllCatalogPieces();
    });
    searchInput?.addEventListener("focus", () => {
      state.historyOpen = true;
      renderSearchHistory();
    });
    searchInput?.addEventListener("change", (event) => {
      rememberSearch(event.target.value);
      renderSearchHistory();
    });
    document.addEventListener("click", (event) => {
      if (searchStack?.contains(event.target)) return;
      state.historyOpen = false;
      renderSearchHistory();
    });
    document.getElementById("sortSelect")?.addEventListener("change", (event) => {
      state.filters.sort = event.target.value;
      renderShop();
    });
    document.getElementById("audienceSelect")?.addEventListener("change", (event) => {
      state.filters.audience = event.target.value;
      renderShop();
    });
    document.getElementById("categorySelect")?.addEventListener("change", (event) => {
      state.filters.category = event.target.value;
      renderShop();
    });
    document.getElementById("favOnlyToggle")?.addEventListener("change", (event) => {
      state.filters.favoritesOnly = event.target.checked;
      renderShop();
    });
    document.getElementById("btnPopularPrev")?.addEventListener("click", () => {
      const track = document.getElementById("popularTrack");
      const baseIndex = track ? getPopularIndexFromScroll(track) : state.popularIndex;
      state.popularIndex = baseIndex - 1;
      updatePopularPosition();
    });
    document.getElementById("btnPopularNext")?.addEventListener("click", () => {
      const track = document.getElementById("popularTrack");
      const baseIndex = track ? getPopularIndexFromScroll(track) : state.popularIndex;
      state.popularIndex = baseIndex + 1;
      updatePopularPosition();
    });
    document.querySelectorAll("[data-language]").forEach((button) => {
      button.addEventListener("click", () => saveSettings({ language: button.getAttribute("data-language") }));
    });
    document.getElementById("currencySelect")?.addEventListener("change", (event) => {
      saveSettings({ currency: event.target.value });
    });
    document.querySelectorAll("[data-theme-value]").forEach((button) => {
      button.addEventListener("click", () => saveSettings({ theme: button.getAttribute("data-theme-value") }));
    });
    document.getElementById("btnHeroPrev")?.addEventListener("click", () => {
      state.heroIndex -= 1;
      renderHeroSlide();
    });
    document.getElementById("btnHeroNext")?.addEventListener("click", () => {
      state.heroIndex += 1;
      renderHeroSlide();
    });
    document.getElementById("deliveryAddressHeader")?.addEventListener("change", (event) => {
      saveSettings({ deliveryAddress: event.target.value });
      document.getElementById("deliveryAddress").value = event.target.value;
    });
    document.getElementById("deliveryCity")?.addEventListener("change", (event) => {
      saveSettings({ city: event.target.value });
    });
    document.getElementById("deliveryAddress")?.addEventListener("change", (event) => {
      saveSettings({ deliveryAddress: event.target.value });
      document.getElementById("deliveryAddressHeader").value = event.target.value;
    });
    document.getElementById("btnClearSearchHistory")?.addEventListener("click", () => {
      setSearchHistory([]);
      state.historyOpen = true;
      renderSearchHistory();
    });
    document.getElementById("btnCart")?.addEventListener("click", openCart);
    document.getElementById("btnCheckout")?.addEventListener("click", checkout);
    document.querySelectorAll("[data-cart-close]").forEach((element) => element.addEventListener("click", closeCart));
    document.querySelectorAll("[data-close-order]").forEach((element) => element.addEventListener("click", closeOrderModal));
    document.querySelectorAll("[data-close-product]").forEach((element) => element.addEventListener("click", closeProductModal));
  }

  function init() {
    currentProducts();
    syncCartWithProducts();
    applySettingsToUI();
    renderAllCatalogPieces();
    renderCart();
    initControls();
    initHeroParallax();
    renderHeroSlide();
    syncUserDataFromApi();

    document.addEventListener("keydown", (event) => {
      if (event.key !== "Escape") return;
      if (document.getElementById("productModal")?.classList.contains("is-open")) closeProductModal();
      if (document.getElementById("modalOrder")?.classList.contains("is-open")) closeOrderModal();
      if (document.getElementById("cartDrawer")?.classList.contains("is-open")) closeCart();
    });

    window.addEventListener("toy-products-updated", () => {
      currentProducts();
      syncCartWithProducts();
      renderCategoryOptions();
      renderAllCatalogPieces();
      renderCart();
    });
    window.addEventListener("toy-favorites-updated", renderAllCatalogPieces);
    window.addEventListener("toy-settings-updated", () => {
      applySettingsToUI();
      renderAllCatalogPieces();
      renderCart();
      renderHeroSlide();
    });
    window.addEventListener("toy-auth-updated", () => {
      syncUserDataFromApi();
      renderAllCatalogPieces();
      renderCart();
    });
    window.addEventListener("storage", (event) => {
      if ([CART_KEY, window.ToyStoreData.KEYS.products, window.ToyStoreData.KEYS.settings].includes(event.key)) {
        currentProducts();
        applySettingsToUI();
        renderCategoryOptions();
        renderAllCatalogPieces();
        renderCart();
      }
    });
  }

  document.addEventListener("DOMContentLoaded", init);

  window.ToyStoreCart = {
    getCart,
    addToCart,
    renderShop: renderAllCatalogPieces,
    getProducts: currentProducts,
  };
})();
