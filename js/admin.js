(function () {
  const ORDERS_KEY = "igrushkino_orders";
  const USERS_KEY = "igrushkino_users";
  const SUPPORT_KEY = "igrushkino_support_tickets";
  const CART_KEY = "igrushkino_cart";
  const ADMIN_SESSION_KEY = "igrushkino_admin_session";
  const ADMIN_HASH = "3eb3fe66b31e3b4d10fa70b5cad49c7112294af6ae4e476a1c405155d45aa121";
  const ADMIN_EMAIL = "admin@igrushkino.ru";
  const { getProducts, saveProducts, getSettings, saveSettings, t, applyI18n } = window.ToyStoreData;
  const api = window.ToyStoreApi;

  const loginSection = document.getElementById("adminLoginSection");
  const dashboard = document.getElementById("adminDashboard");
  const loginForm = document.getElementById("adminLoginForm");
  const loginError = document.getElementById("adminLoginError");
  const logoutBtn = document.getElementById("btnAdminLogout");
  const homeLink = document.querySelector('a.logo[href="index.html"]');

  const statsGrid = document.getElementById("statsGrid");
  const ordersList = document.getElementById("ordersList");
  const usersList = document.getElementById("usersList");
  const topProducts = document.getElementById("topProducts");
  const supportThreadsList = document.getElementById("supportThreadsList");
  const adminSupportEmpty = document.getElementById("adminSupportEmpty");
  const adminSupportThreadView = document.getElementById("adminSupportThreadView");
  const adminSupportThreadHeader = document.getElementById("adminSupportThreadHeader");
  const adminSupportMessages = document.getElementById("adminSupportMessages");
  const adminSupportReplyForm = document.getElementById("adminSupportReplyForm");
  const adminSupportComposer = document.getElementById("adminSupportComposer");
  const adminSupportHint = document.getElementById("adminSupportHint");
  const productCatalogList = document.getElementById("adminProductList");
  const productEditor = document.getElementById("adminProductEditor");

  const ordersSearch = document.getElementById("ordersSearch");
  const supportSearch = document.getElementById("supportSearch");
  const usersSearch = document.getElementById("usersSearch");
  const productsSearch = document.getElementById("productsSearch");

  let activeSupportThreadId = null;
  let activeProductId = null;

  function resolveBasePath() {
    const path = window.location.pathname || "/";
    if (path.endsWith("/")) return path;
    if (path.endsWith(".html")) return path.replace(/[^/]*$/, "");
    return `${path}/`;
  }

  function syncHomeLink() {
    if (!homeLink) return;
    homeLink.setAttribute("href", `${resolveBasePath()}index.html`);
  }

  const statusLabels = {
    ru: { new: "Новый", processing: "В работе", done: "Завершён", cancelled: "Отменён" },
    en: { new: "New", processing: "Processing", done: "Done", cancelled: "Cancelled" },
  };

  const topicLabels = {
    ru: { order: "Заказ", product: "Товар", return: "Возврат", other: "Другое" },
    en: { order: "Order", product: "Product", return: "Return", other: "Other" },
  };

  const genderLabels = {
    ru: { boys: "Для мальчиков", girls: "Для девочек", unisex: "Универсальные" },
    en: { boys: "For Boys", girls: "For Girls", unisex: "Unisex" },
  };

  const adminI18n = {
    ru: {
      brand: "Игрушкино",
      navOverview: "Обзор",
      navOrders: "Заказы",
      navSupport: "Поддержка",
      navProducts: "Товары",
      navUsers: "Клиенты",
      languageLabel: "Язык",
      currencyLabel: "Валюта",
      themeLabel: "Тема",
      themeDark: "Тёмная",
      themeLight: "Светлая",
      logout: "Выйти",
      heroEyebrow: "Редактор магазина",
      heroTitle: "Управление каталогом, заказами и чатами поддержки",
      heroLead: "Теперь из админки можно менять цены, описания, аудиторию, материал, популярность и набор изображений товара. Список картинок хранится в каталоге и сразу появляется на витрине.",
      heroLogin: "Вход администратора:",
      heroSync: "Изменения товаров сохраняются в браузере и сразу синхронизируются с витриной магазина, корзиной и карточкой товара.",
      loginTitle: "Вход для администратора",
      loginLead: "Панель работает локально и использует данные только этого браузера.",
      password: "Пароль",
      openPanel: "Открыть панель",
      refresh: "Обновить",
      exportJson: "Экспорт JSON",
      seedData: "Добавить данные",
      clearData: "Очистить данные",
      section1: "Раздел 1",
      section2: "Раздел 2",
      section3: "Раздел 3",
      section4: "Раздел 4",
      section5: "Раздел 5",
      ordersTitle: "Заказы",
      ordersLead: "Адрес доставки, товары заказа, статусы и локальная история покупок.",
      supportTitle: "Поддержка",
      supportLead: "Чаты пользователей, статусы и ответы из одной рабочей области.",
      catalogTitle: "Каталог товаров",
      catalogLead: "Меняйте цену, описания, возраст, материал и изображения. Картинки можно добавлять, удалять и менять их последовательность через список URL.",
      usersTitle: "Клиенты",
      usersLead: "Зарегистрированные пользователи и быстрый поиск по базе.",
      topProductsTitle: "Популярные товары",
      topProductsLead: "Что чаще всего попадает в оформленные заказы.",
      ordersSearch: "Поиск по номеру, адресу или товару",
      supportSearch: "Поиск по теме, email или тексту",
      productsSearch: "Поиск по названию, описанию или материалу",
      usersSearch: "Поиск по имени или email",
      selectRequest: "Выберите обращение",
      selectRequestLead: "Откройте чат слева, чтобы увидеть историю сообщений и ответить пользователю.",
      replyToUser: "Ответ пользователю",
      supportReply: "Напишите ответ в чат",
      supportHintDefault: "После ответа диалог станет доступен пользователю в его разделе обращений.",
      sendReply: "Отправить ответ",
      footerBrand: "Игрушкино Admin",
      footerMeta: "Админ-панель работает локально и синхронизирует изменения с витриной этого браузера.",
      statsOrders: "Заказы",
      statsRevenue: "Выручка",
      statsUsers: "Клиенты",
      statsChats: "Чаты",
      avgCheck: "Средний чек",
      revenueMeta: "Сумма по локальным заказам",
      usersMeta: "Зарегистрированные пользователи",
      activeChats: "Активных",
      noOrders: "Подходящих заказов нет.",
      noAddress: "не указан",
      noCity: "Без города",
      address: "Адрес",
      deleteOrder: "Удалить заказ",
      adminName: "Администратор",
      supportDoneHint: "Диалог завершён. Новый ответ снова вернёт его в работу.",
      supportOpenHint: "После ответа пользователь увидит сообщение в разделе обращений.",
      noThreads: "Обращений по этому фильтру нет.",
      noUsers: "Пользователей не найдено.",
      clientBadge: "Клиент",
      delete: "Удалить",
      noTopProducts: "Оформленных заказов пока нет.",
      pieces: "шт.",
      noProducts: "Товары не найдены.",
      chooseProduct: "Выберите товар слева.",
      titleRu: "Название RU",
      titleEn: "Название EN",
      price: "Цена",
      oldPrice: "Старая цена",
      age: "Возраст",
      material: "Материал",
      materialEn: "Material EN",
      category: "Категория",
      audience: "Аудитория",
      popularity: "Популярность",
      featured: "Показывать в популярном",
      mainHero: "Главный товар",
      editorHint: "Популярность: число от 0 до 100 для сортировки. Показывать в популярном: товар попадёт в карусель популярных. Главный товар: этот товар станет первым в интерактивной картинке на главной.",
      descriptionRu: "Описание RU",
      descriptionEn: "Описание EN",
      keywords: "Ключевые слова",
      images: "Изображения (каждое с новой строки)",
      uploadImages: "Добавить картинки с компьютера",
      moveUp: "Первую картинку вверх",
      moveDown: "Первую картинку вниз",
      saveProduct: "Сохранить товар",
      invalidLogin: "Неверный логин или пароль.",
      titleAdmin: "Игрушкино — админ-панель",
    },
    en: {
      brand: "Igrushkino",
      navOverview: "Overview",
      navOrders: "Orders",
      navSupport: "Support",
      navProducts: "Products",
      navUsers: "Customers",
      languageLabel: "Language",
      currencyLabel: "Currency",
      themeLabel: "Theme",
      themeDark: "Dark",
      themeLight: "Light",
      logout: "Log out",
      heroEyebrow: "Store editor",
      heroTitle: "Manage catalog, orders and support chats",
      heroLead: "From the admin panel you can now update prices, descriptions, audience, material, popularity and the product image set. The image list is stored in the catalog and appears on the storefront right away.",
      heroLogin: "Admin login:",
      heroSync: "Product changes are stored in the browser and synced right away with the storefront, cart and product card.",
      loginTitle: "Admin sign in",
      loginLead: "The panel works locally and uses only the data stored in this browser.",
      password: "Password",
      openPanel: "Open panel",
      refresh: "Refresh",
      exportJson: "Export JSON",
      seedData: "Add sample data",
      clearData: "Clear data",
      section1: "Section 1",
      section2: "Section 2",
      section3: "Section 3",
      section4: "Section 4",
      section5: "Section 5",
      ordersTitle: "Orders",
      ordersLead: "Delivery address, order items, statuses and local purchase history.",
      supportTitle: "Support",
      supportLead: "User chats, statuses and replies from one workspace.",
      catalogTitle: "Product catalog",
      catalogLead: "Update price, descriptions, age, material and images. Images can be added, removed and reordered through the URL list.",
      usersTitle: "Customers",
      usersLead: "Registered users and quick search through the database.",
      topProductsTitle: "Popular products",
      topProductsLead: "Items that appear most often in completed orders.",
      ordersSearch: "Search by order number, address or product",
      supportSearch: "Search by topic, email or text",
      productsSearch: "Search by title, description or material",
      usersSearch: "Search by name or email",
      selectRequest: "Select a request",
      selectRequestLead: "Open a chat on the left to see the message history and reply to the customer.",
      replyToUser: "Reply to customer",
      supportReply: "Type a reply to the chat",
      supportHintDefault: "After you reply, the dialog will become available to the customer in their requests section.",
      sendReply: "Send reply",
      footerBrand: "Igrushkino Admin",
      footerMeta: "The admin panel works locally and syncs changes with this browser storefront.",
      statsOrders: "Orders",
      statsRevenue: "Revenue",
      statsUsers: "Customers",
      statsChats: "Chats",
      avgCheck: "Average order",
      revenueMeta: "Total from local orders",
      usersMeta: "Registered users",
      activeChats: "Active",
      noOrders: "No matching orders found.",
      noAddress: "not specified",
      noCity: "No city",
      address: "Address",
      deleteOrder: "Delete order",
      adminName: "Administrator",
      supportDoneHint: "The dialog is closed. A new reply will move it back into progress.",
      supportOpenHint: "After your reply, the customer will see the message in the requests section.",
      noThreads: "No requests match this filter.",
      noUsers: "No users found.",
      clientBadge: "Customer",
      delete: "Delete",
      noTopProducts: "There are no completed orders yet.",
      pieces: "pcs.",
      noProducts: "No products found.",
      chooseProduct: "Select a product on the left.",
      titleRu: "Title RU",
      titleEn: "Title EN",
      price: "Price",
      oldPrice: "Old price",
      age: "Age",
      material: "Material",
      materialEn: "Material EN",
      category: "Category",
      audience: "Audience",
      popularity: "Popularity",
      featured: "Show in popular",
      mainHero: "Main product",
      editorHint: "Popularity: a value from 0 to 100 for sorting. Show in popular: the product will appear in the popular carousel. Main product: this item becomes the first one in the interactive hero on the home page.",
      descriptionRu: "Description RU",
      descriptionEn: "Description EN",
      keywords: "Keywords",
      images: "Images (one per line)",
      uploadImages: "Add images from computer",
      moveUp: "Move first image up",
      moveDown: "Move first image down",
      saveProduct: "Save product",
      invalidLogin: "Invalid login or password.",
      titleAdmin: "Igrushkino — admin panel",
    },
  };

  function adminT(key) {
    const lang = getSettings().language || "ru";
    return adminI18n[lang]?.[key] || adminI18n.ru[key] || key;
  }

  function trStatus(value) {
    return statusLabels[getSettings().language || "ru"]?.[value] || value;
  }

  function trTopic(value) {
    return topicLabels[getSettings().language || "ru"]?.[value] || value;
  }

  function trGender(value) {
    return genderLabels[getSettings().language || "ru"]?.[value] || value;
  }

  function readArray(key) {
    try {
      const value = JSON.parse(localStorage.getItem(key) || "[]");
      return Array.isArray(value) ? value : [];
    } catch {
      return [];
    }
  }

  function writeArray(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }

  function readUsers() {
    try {
      const value = JSON.parse(localStorage.getItem(USERS_KEY) || "{}");
      return value && typeof value === "object" ? value : {};
    } catch {
      return {};
    }
  }

  function writeUsers(value) {
    localStorage.setItem(USERS_KEY, JSON.stringify(value));
  }

  async function sha256(value) {
    const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(String(value || "")));
    return Array.from(new Uint8Array(digest))
      .map((byte) => byte.toString(16).padStart(2, "0"))
      .join("");
  }

  function escapeHtml(value) {
    const div = document.createElement("div");
    div.textContent = String(value || "");
    return div.innerHTML;
  }

  function formatDate(value) {
    if (!value) return "—";
    try {
      return new Intl.DateTimeFormat(getSettings().language === "en" ? "en-US" : "ru-RU", { dateStyle: "medium", timeStyle: "short" }).format(
        new Date(value)
      );
    } catch {
      return value;
    }
  }

  function formatPrice(value) {
    return new Intl.NumberFormat(getSettings().language === "en" ? "en-US" : "ru-RU", {
      style: "currency",
      currency: getSettings().currency || "RUB",
      maximumFractionDigits: getSettings().currency === "RUB" ? 0 : 2,
    }).format(Number(value || 0) * ({ RUB: 1, USD: 0.011, EUR: 0.01 }[getSettings().currency || "RUB"] || 1));
  }

  function isAdminLoggedIn() {
    return localStorage.getItem(ADMIN_SESSION_KEY) === "true";
  }

  function setAdminSession(enabled) {
    if (enabled) localStorage.setItem(ADMIN_SESSION_KEY, "true");
    else localStorage.removeItem(ADMIN_SESSION_KEY);
  }

  function setAuthState(loggedIn) {
    loginSection.classList.toggle("hidden", loggedIn);
    dashboard.classList.toggle("hidden", !loggedIn);
    logoutBtn.classList.toggle("hidden", !loggedIn);
  }

  function normalizeSupportThreads() {
    const list = readArray(SUPPORT_KEY);
    return list
      .map((item) => ({
        id: item.id || `thread-${Date.now()}`,
        topic: item.topic || "other",
        status: item.status || "new",
        userName: item.userName || item.name || "Покупатель",
        userEmail: item.userEmail || item.email || "",
        createdAt: item.createdAt || item.at || new Date().toISOString(),
        updatedAt: item.updatedAt || item.at || new Date().toISOString(),
        unreadUser: Number(item.unreadUser || 0),
        unreadAdmin: Number(item.unreadAdmin || 0),
        messages: Array.isArray(item.messages)
          ? item.messages
          : [
              {
                id: `msg-${Date.now()}`,
                authorType: "user",
                authorName: item.userName || item.name || "Покупатель",
                text: item.message || "",
                at: item.at || new Date().toISOString(),
              },
            ],
      }))
      .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
  }

  function saveSupportThreads(threads) {
    localStorage.setItem(SUPPORT_KEY, JSON.stringify(threads));
  }

  async function fetchSupportThreadsFromApi() {
    if (!api?.enabled) return null;
    const data = await api.fetch("/api/support/threads");
    const threads = Array.isArray(data) ? data : data?.threads;
    if (!Array.isArray(threads)) return null;
    saveSupportThreads(threads);
    return threads;
  }

  function upsertThreadLocal(thread) {
    const threads = normalizeSupportThreads();
    const index = threads.findIndex((item) => item.id === thread.id);
    if (index >= 0) threads[index] = thread;
    else threads.push(thread);
    saveSupportThreads(threads);
  }

  function patchThreadApi(threadId, payload) {
    if (!api?.enabled) return;
    api.fetch(`/api/support/threads/${threadId}`, { method: "PATCH", body: payload });
  }

  function getOrders() {
    return readArray(ORDERS_KEY).sort((a, b) => new Date(b.at || 0) - new Date(a.at || 0));
  }

  function saveOrders(orders) {
    writeArray(ORDERS_KEY, orders);
  }

  function getUsersList() {
    return Object.values(readUsers()).sort((a, b) => Number(b.createdAt || 0) - Number(a.createdAt || 0));
  }

  function getTopProducts(orders) {
    const counters = new Map();
    orders.forEach((order) => {
      (order.items || []).forEach((item) => {
        const prev = counters.get(item.id) || { ...item, qty: 0, sum: 0 };
        prev.qty += Number(item.qty || 0);
        prev.sum += Number(item.qty || 0) * Number(item.price || 0);
        counters.set(item.id, prev);
      });
    });
    return Array.from(counters.values())
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 8);
  }

  function renderStats(orders, threads, users) {
    const revenue = orders.reduce((sum, order) => sum + Number(order.total || 0), 0);
    const cards = [
      { label: adminT("statsOrders"), value: orders.length, meta: `${adminT("avgCheck")}: ${formatPrice(orders.length ? revenue / orders.length : 0)}` },
      { label: adminT("statsRevenue"), value: formatPrice(revenue), meta: adminT("revenueMeta") },
      { label: adminT("statsUsers"), value: users.length, meta: adminT("usersMeta") },
      { label: adminT("statsChats"), value: threads.length, meta: `${adminT("activeChats")}: ${threads.filter((thread) => thread.status !== "done").length}` },
    ];
    statsGrid.innerHTML = cards
      .map(
        (card) => `
        <article class="admin-stat">
          <p class="admin-stat__label">${escapeHtml(card.label)}</p>
          <p class="admin-stat__value">${escapeHtml(card.value)}</p>
          <p class="admin-stat__meta">${escapeHtml(card.meta)}</p>
        </article>
      `
      )
      .join("");
  }

  function renderOrders(orders) {
    const query = (ordersSearch.value || "").trim().toLowerCase();
    const filtered = orders.filter((order) =>
      [order.id, order.city, order.deliveryAddress, ...(order.items || []).map((item) => item.title)].join(" ").toLowerCase().includes(query)
    );
    if (!filtered.length) {
      ordersList.innerHTML = `<div class="admin-empty">${escapeHtml(adminT("noOrders"))}</div>`;
      return;
    }
    ordersList.innerHTML = filtered
      .map(
        (order) => `
        <article class="admin-order" data-order-id="${escapeHtml(order.id)}">
          <div class="admin-order__top">
            <div>
              <p class="admin-order__id">${escapeHtml(order.id)}</p>
              <p class="admin-order__meta">${formatDate(order.at)} · ${formatPrice(order.total)} · ${
                escapeHtml(order.city || adminT("noCity"))
              }</p>
            </div>
            <span class="status-pill" data-status="${escapeHtml(order.status || "new")}">${escapeHtml(trStatus(order.status || "new"))}</span>
          </div>
          <p class="admin-order__meta">${escapeHtml(adminT("address"))}: ${escapeHtml(order.deliveryAddress || adminT("noAddress"))}</p>
          <div class="admin-order__items">
            ${(order.items || [])
              .map(
                (item) => `
                <div class="admin-line-item">
                  <img src="${escapeHtml(item.image || "")}" alt="" />
                  <div>
                    <p class="admin-line-item__title">${escapeHtml(item.title)}</p>
                    <p class="admin-line-item__meta">${item.qty} × ${formatPrice(item.price)}</p>
                  </div>
                </div>
              `
              )
              .join("")}
          </div>
          <div class="admin-order__actions">
            <select class="admin-select" data-order-status>
              ${["new", "processing", "done", "cancelled"]
                .map((status) => `<option value="${status}" ${status === (order.status || "new") ? "selected" : ""}>${trStatus(status)}</option>`)
                .join("")}
            </select>
            <button type="button" class="btn btn--ghost" data-delete-order>${escapeHtml(adminT("deleteOrder"))}</button>
          </div>
        </article>
      `
      )
      .join("");

    ordersList.querySelectorAll("[data-order-status]").forEach((select) => {
      select.addEventListener("change", () => {
        const orderId = select.closest("[data-order-id]")?.getAttribute("data-order-id");
        if (!orderId) return;
        saveOrders(getOrders().map((order) => (order.id === orderId ? { ...order, status: select.value } : order)));
        renderAll();
      });
    });
    ordersList.querySelectorAll("[data-delete-order]").forEach((button) => {
      button.addEventListener("click", () => {
        const orderId = button.closest("[data-order-id]")?.getAttribute("data-order-id");
        if (!orderId) return;
        saveOrders(getOrders().filter((order) => order.id !== orderId));
        renderAll();
      });
    });
  }

  function markThreadReadForAdmin(threadId) {
    const next = normalizeSupportThreads().map((thread) => (thread.id === threadId ? { ...thread, unreadAdmin: 0 } : thread));
    saveSupportThreads(next);
    patchThreadApi(threadId, { unreadAdmin: 0 });
  }

  function renderSupportThread(thread) {
    if (!thread) {
      adminSupportThreadView.classList.add("hidden");
      adminSupportEmpty.classList.remove("hidden");
      adminSupportThreadHeader.innerHTML = "";
      adminSupportMessages.innerHTML = "";
      return;
    }
    adminSupportThreadView.classList.remove("hidden");
    adminSupportEmpty.classList.add("hidden");
    adminSupportThreadHeader.innerHTML = `
      <div>
        <h3>${escapeHtml(thread.userName)}</h3>
        <p>${escapeHtml(thread.userEmail || "—")} · ${escapeHtml(trTopic(thread.topic))} · ${formatDate(thread.createdAt)}</p>
      </div>
      <select class="admin-select" id="adminThreadStatus">
        ${["new", "processing", "done", "cancelled"]
          .map((status) => `<option value="${status}" ${status === thread.status ? "selected" : ""}>${trStatus(status)}</option>`)
          .join("")}
      </select>
    `;
    adminSupportMessages.innerHTML = thread.messages
      .map(
        (message) => `
        <article class="admin-chat-message admin-chat-message--${message.authorType}">
          <div class="admin-chat-message__meta">
            <strong>${escapeHtml(message.authorType === "admin" ? adminT("adminName") : thread.userName)}</strong>
            <span>${formatDate(message.at)}</span>
          </div>
          <p>${escapeHtml(message.text)}</p>
        </article>
      `
      )
      .join("");
    adminSupportHint.textContent =
      thread.status === "done"
        ? adminT("supportDoneHint")
        : adminT("supportOpenHint");
    document.getElementById("adminThreadStatus")?.addEventListener("change", (event) => {
      const nextStatus = event.target.value;
      saveSupportThreads(
        normalizeSupportThreads().map((item) =>
          item.id === thread.id ? { ...item, status: nextStatus, updatedAt: new Date().toISOString() } : item
        )
      );
      patchThreadApi(thread.id, { status: nextStatus });
      renderAll();
    });
  }

  function renderSupportList(threads) {
    const query = (supportSearch.value || "").trim().toLowerCase();
    const filtered = threads.filter((thread) =>
      [thread.userName, thread.userEmail, thread.topic, thread.status, ...thread.messages.map((message) => message.text)]
        .join(" ")
        .toLowerCase()
        .includes(query)
    );
    if (!filtered.length) {
      supportThreadsList.innerHTML = `<div class="admin-empty">${escapeHtml(adminT("noThreads"))}</div>`;
      renderSupportThread(null);
      return;
    }
    if (!activeSupportThreadId || !filtered.some((thread) => thread.id === activeSupportThreadId)) activeSupportThreadId = filtered[0].id;
    supportThreadsList.innerHTML = filtered
      .map(
        (thread) => `
        <button type="button" class="admin-support-item ${thread.id === activeSupportThreadId ? "is-active" : ""}" data-thread-id="${thread.id}">
          <div class="admin-support-item__top">
            <div>
              <p class="admin-support-item__title">${escapeHtml(thread.userName)}</p>
              <p class="admin-support-item__meta">${escapeHtml(thread.userEmail)} · ${escapeHtml(trTopic(thread.topic))}</p>
            </div>
            ${thread.unreadAdmin ? `<span class="admin-support-item__badge">${thread.unreadAdmin}</span>` : ""}
          </div>
          <p class="admin-support-item__preview">${escapeHtml((thread.messages.at(-1)?.text || "").slice(0, 110))}</p>
        </button>
      `
      )
      .join("");
    supportThreadsList.querySelectorAll("[data-thread-id]").forEach((button) => {
      button.addEventListener("click", () => {
        activeSupportThreadId = button.getAttribute("data-thread-id");
        markThreadReadForAdmin(activeSupportThreadId);
        renderAll();
      });
    });
    renderSupportThread(filtered.find((thread) => thread.id === activeSupportThreadId) || null);
  }

  async function appendAdminReply(threadId, text) {
    const message = String(text || "").trim();
    if (!message) return;
    const now = new Date().toISOString();
    if (api?.enabled) {
      const data = await api.fetch(`/api/support/threads/${threadId}/replies`, {
        method: "POST",
        body: { authorType: "admin", authorName: adminT("adminName"), text: message },
      });
      if (data?.thread) {
        upsertThreadLocal(data.thread);
        return;
      }
    }
    saveSupportThreads(
      normalizeSupportThreads().map((thread) =>
        thread.id === threadId
          ? {
              ...thread,
              status: "processing",
              updatedAt: now,
              unreadUser: Number(thread.unreadUser || 0) + 1,
              messages: [...thread.messages, { id: `msg-${Date.now()}`, authorType: "admin", authorName: adminT("adminName"), text: message, at: now }],
            }
          : thread
      )
    );
  }

  function renderUsers(users) {
    const query = (usersSearch.value || "").trim().toLowerCase();
    const filtered = users.filter((user) => [user.name, user.email].join(" ").toLowerCase().includes(query));
    if (!filtered.length) {
      usersList.innerHTML = `<div class="admin-empty">${escapeHtml(adminT("noUsers"))}</div>`;
      return;
    }
    usersList.innerHTML = filtered
      .map(
        (user) => `
        <article class="admin-user" data-user-email="${escapeHtml(user.email)}">
          <div class="admin-user__top">
            <div>
              <p class="admin-user__name">${escapeHtml(user.name || "—")}</p>
              <p class="admin-user__meta">${escapeHtml(user.email)} · ${formatDate(user.createdAt)}</p>
            </div>
            <span class="admin-badge">${escapeHtml(adminT("clientBadge"))}</span>
          </div>
          <div class="admin-user__actions">
            <button type="button" class="btn btn--ghost" data-delete-user>${escapeHtml(adminT("delete"))}</button>
          </div>
        </article>
      `
      )
      .join("");
    usersList.querySelectorAll("[data-delete-user]").forEach((button) => {
      button.addEventListener("click", () => {
        const email = button.closest("[data-user-email]")?.getAttribute("data-user-email");
        if (!email) return;
        const usersMap = readUsers();
        delete usersMap[email];
        writeUsers(usersMap);
        renderAll();
      });
    });
  }

  function renderTopProducts(items) {
    if (!items.length) {
      topProducts.innerHTML = `<div class="admin-empty">${escapeHtml(adminT("noTopProducts"))}</div>`;
      return;
    }
    topProducts.innerHTML = items
      .map(
        (item) => `
        <article class="admin-product">
          <div class="admin-product__top">
            <div>
              <p class="admin-product__name">${escapeHtml(item.title)}</p>
              <p class="admin-product__meta">${item.qty} ${escapeHtml(adminT("pieces"))} · ${formatPrice(item.sum)}</p>
            </div>
            <img class="admin-product__thumb" src="${escapeHtml(item.image || "")}" alt="" />
          </div>
        </article>
      `
      )
      .join("");
  }

  function renderProductList() {
    const products = getProducts();
    const query = (productsSearch.value || "").trim().toLowerCase();
    const filtered = products.filter((product) =>
      [product.title, product.titleEn, product.description, product.descriptionEn, product.material, product.materialEn, product.gender]
        .join(" ")
        .toLowerCase()
        .includes(query)
    );
    if (!filtered.length) {
      productCatalogList.innerHTML = `<div class="admin-empty">${escapeHtml(adminT("noProducts"))}</div>`;
      activeProductId = null;
      renderProductEditor(null);
      return;
    }
    if (!activeProductId || !filtered.some((product) => product.id === activeProductId)) activeProductId = filtered[0].id;
    productCatalogList.innerHTML = filtered
      .map(
        (product) => `
        <button type="button" class="admin-product-item ${product.id === activeProductId ? "is-active" : ""}" data-product-id="${product.id}">
          <img src="${escapeHtml(product.images?.[0] || product.image)}" alt="" />
          <div>
            <strong>${escapeHtml(product.title)}</strong>
            <p>${formatPrice(product.price)} · ${escapeHtml(product.age)} · ${escapeHtml(product.material)}</p>
          </div>
        </button>
      `
      )
      .join("");
    productCatalogList.querySelectorAll("[data-product-id]").forEach((button) => {
      button.addEventListener("click", () => {
        activeProductId = button.getAttribute("data-product-id");
        renderProductList();
      });
    });
    renderProductEditor(filtered.find((product) => product.id === activeProductId) || null);
  }

  function renderProductEditor(product) {
    if (!product) {
      productEditor.innerHTML = `<div class="admin-empty admin-empty--thread">${escapeHtml(adminT("chooseProduct"))}</div>`;
      return;
    }
    productEditor.innerHTML = `
      <form class="admin-product-form" id="adminProductForm">
        <div class="admin-product-form__hero">
          <img src="${escapeHtml(product.images?.[0] || product.image)}" alt="" />
          <div>
            <h3>${escapeHtml(product.title)}</h3>
            <p>${escapeHtml(product.id)} · ${escapeHtml(trGender(product.gender))} · ${escapeHtml(product.category)}</p>
          </div>
        </div>
        <div class="admin-product-form__grid">
          <label class="field"><span>${escapeHtml(adminT("titleRu"))}</span><input name="title" value="${escapeHtml(product.title)}" /></label>
          <label class="field"><span>${escapeHtml(adminT("titleEn"))}</span><input name="titleEn" value="${escapeHtml(product.titleEn || "")}" /></label>
          <label class="field"><span>${escapeHtml(adminT("price"))}</span><input name="price" type="number" min="0" value="${product.price}" /></label>
          <label class="field"><span>${escapeHtml(adminT("oldPrice"))}</span><input name="oldPrice" type="number" min="0" value="${product.oldPrice || 0}" /></label>
          <label class="field"><span>${escapeHtml(adminT("age"))}</span><input name="age" value="${escapeHtml(product.age)}" /></label>
          <label class="field"><span>${escapeHtml(adminT("material"))}</span><input name="material" value="${escapeHtml(product.material)}" /></label>
          <label class="field"><span>${escapeHtml(adminT("materialEn"))}</span><input name="materialEn" value="${escapeHtml(product.materialEn || "")}" /></label>
          <label class="field"><span>${escapeHtml(adminT("category"))}</span><input name="category" value="${escapeHtml(product.category)}" /></label>
          <label class="field"><span>${escapeHtml(adminT("audience"))}</span>
            <select name="gender">
              ${["boys", "girls", "unisex"].map((value) => `<option value="${value}" ${value === product.gender ? "selected" : ""}>${escapeHtml(trGender(value))}</option>`).join("")}
            </select>
          </label>
          <label class="field"><span>${escapeHtml(adminT("popularity"))}</span><input name="popularScore" type="number" min="0" max="100" value="${product.popularScore || 0}" /></label>
          <label class="field checkbox"><input name="featured" type="checkbox" ${product.featured ? "checked" : ""} /><span>${escapeHtml(adminT("featured"))}</span></label>
          <label class="field checkbox"><input name="mainHero" type="checkbox" ${product.mainHero ? "checked" : ""} /><span>${escapeHtml(adminT("mainHero"))}</span></label>
        </div>
        <p class="admin-note">${escapeHtml(adminT("editorHint"))}</p>
        <label class="field"><span>${escapeHtml(adminT("descriptionRu"))}</span><textarea name="description" rows="4">${escapeHtml(product.description)}</textarea></label>
        <label class="field"><span>${escapeHtml(adminT("descriptionEn"))}</span><textarea name="descriptionEn" rows="4">${escapeHtml(product.descriptionEn || "")}</textarea></label>
        <label class="field"><span>${escapeHtml(adminT("keywords"))}</span><textarea name="keywords" rows="3">${escapeHtml(product.keywords || "")}</textarea></label>
          <label class="field"><span>${escapeHtml(adminT("images"))}</span><textarea name="images" rows="6">${escapeHtml(
          (product.images || []).join("\n")
        )}</textarea></label>
        <label class="field">
          <span>${escapeHtml(adminT("uploadImages"))}</span>
          <input type="file" id="adminImageUpload" accept="image/*" multiple />
        </label>
        <div class="admin-product-form__actions">
          <button type="button" class="btn btn--ghost" id="btnMoveImageUp">${escapeHtml(adminT("moveUp"))}</button>
          <button type="button" class="btn btn--ghost" id="btnMoveImageDown">${escapeHtml(adminT("moveDown"))}</button>
          <button type="submit" class="btn btn--primary">${escapeHtml(adminT("saveProduct"))}</button>
        </div>
      </form>
    `;
    const form = document.getElementById("adminProductForm");
    const imagesField = form.querySelector('textarea[name="images"]');
    const uploadField = document.getElementById("adminImageUpload");
    document.getElementById("btnMoveImageUp")?.addEventListener("click", () => reorderImages(imagesField, -1));
    document.getElementById("btnMoveImageDown")?.addEventListener("click", () => reorderImages(imagesField, 1));
    uploadField?.addEventListener("change", async () => {
      const files = Array.from(uploadField.files || []);
      if (!files.length) return;
      const urls = await Promise.all(
        files.map(
          (file) =>
            new Promise((resolve, reject) => {
              const reader = new FileReader();
              reader.onload = () => resolve(String(reader.result || ""));
              reader.onerror = reject;
              reader.readAsDataURL(file);
            })
        )
      );
      const current = String(imagesField.value || "").trim();
      imagesField.value = [current, ...urls].filter(Boolean).join("\n");
      uploadField.value = "";
    });
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      const data = new FormData(form);
      const images = String(data.get("images") || "")
        .split(/\r?\n/)
        .map((item) => item.trim())
        .filter(Boolean);
      const isMainHero = Boolean(data.get("mainHero"));
      const next = getProducts().map((item) => {
        if (item.id === product.id) {
          return {
            ...item,
            title: String(data.get("title") || "").trim(),
            titleEn: String(data.get("titleEn") || "").trim(),
            price: Number(data.get("price") || 0),
            oldPrice: Number(data.get("oldPrice") || 0),
            age: String(data.get("age") || "").trim(),
            material: String(data.get("material") || "").trim(),
            materialEn: String(data.get("materialEn") || "").trim(),
            category: String(data.get("category") || "").trim(),
            gender: String(data.get("gender") || "unisex"),
            description: String(data.get("description") || "").trim(),
            descriptionEn: String(data.get("descriptionEn") || "").trim(),
            keywords: String(data.get("keywords") || "").trim(),
            images: images.length ? images : item.images,
            image: images[0] || item.images[0] || item.image,
            popularScore: Number(data.get("popularScore") || 0),
            featured: Boolean(data.get("featured")),
            mainHero: isMainHero,
          };
        }
        return isMainHero ? { ...item, mainHero: false } : item;
      });
      saveProducts(next);
      renderProductList();
    });
  }

  function reorderImages(field, direction) {
    const list = String(field.value || "")
      .split(/\r?\n/)
      .map((item) => item.trim())
      .filter(Boolean);
    if (list.length < 2) return;
    if (direction > 0) {
      list.push(list.shift());
    } else {
      list.unshift(list.pop());
    }
    field.value = list.join("\n");
  }

  function exportData() {
    const payload = {
      exportedAt: new Date().toISOString(),
      orders: getOrders(),
      users: getUsersList(),
      supportTickets: normalizeSupportThreads(),
      products: getProducts(),
      settings: getSettings(),
      cart: readArray(CART_KEY),
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "igrushkino-export.json";
    link.click();
    URL.revokeObjectURL(link.href);
  }

  function seedDemoData() {
    if (!getOrders().length) {
      saveOrders([
        {
          id: "IG-DEMO01",
          status: "new",
          total: 3680,
          city: "Красноярск",
          deliveryAddress: "ул. Весенняя, 8, кв. 12",
          at: new Date().toISOString(),
          items: [
            { id: "p1", title: "Мишка «Облачко»", price: 1490, qty: 1, image: "img/p1.svg" },
            { id: "p8", title: "Настольная игра «Сокровища»", price: 1590, qty: 1, image: "img/p8.svg" },
            { id: "p18", title: "Скакалка со счётчиком", price: 420, qty: 1, image: "img/p18.svg" },
          ],
        },
      ]);
    }
    const users = readUsers();
    if (!users["mama@example.com"]) {
      users["mama@example.com"] = { name: "Анна Смирнова", email: "mama@example.com", passwordHash: "demo", createdAt: Date.now() };
      writeUsers(users);
    }
    if (!normalizeSupportThreads().length) {
      saveSupportThreads([
        {
          id: "thread-demo",
          topic: "order",
          status: "new",
          userName: "Анна Смирнова",
          userEmail: "mama@example.com",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          unreadAdmin: 1,
          unreadUser: 0,
          messages: [{ id: "msg-demo", authorType: "user", authorName: "Анна Смирнова", text: "Можно объединить два заказа?", at: new Date().toISOString() }],
        },
      ]);
    }
    renderAll();
  }

  function clearDemoData() {
    [ORDERS_KEY, USERS_KEY, SUPPORT_KEY, CART_KEY].forEach((key) => localStorage.removeItem(key));
    saveSettings({ deliveryAddress: "", city: "" });
    renderAll();
  }

  async function renderAll() {
    if (api?.enabled) {
      await fetchSupportThreadsFromApi();
    }
    const orders = getOrders();
    const users = getUsersList();
    const threads = normalizeSupportThreads();
    renderStats(orders, threads, users);
    renderOrders(orders);
    renderUsers(users);
    renderSupportList(threads);
    renderTopProducts(getTopProducts(orders));
    renderProductList();
  }

  function applyAdminSettingsToUI() {
    applyI18n(document, getSettings().language);
    document.documentElement.dataset.theme = getSettings().theme;
    document.documentElement.lang = getSettings().language || "ru";
    document.querySelectorAll("[data-admin-i18n]").forEach((node) => {
      const key = node.getAttribute("data-admin-i18n");
      if (key) node.textContent = adminT(key);
    });
    document.querySelectorAll("[data-admin-placeholder]").forEach((node) => {
      const key = node.getAttribute("data-admin-placeholder");
      if (key) node.setAttribute("placeholder", adminT(key));
    });
    document.title = adminT("titleAdmin");
    document.querySelectorAll("[data-admin-language]").forEach((button) =>
      button.classList.toggle("is-active", button.getAttribute("data-admin-language") === getSettings().language)
    );
    document.getElementById("adminCurrencySelect").value = getSettings().currency;
    document.querySelectorAll("[data-admin-theme]").forEach((button) =>
      button.classList.toggle("is-active", button.getAttribute("data-admin-theme") === getSettings().theme)
    );
  }

  function bindAdminSettings() {
    applyAdminSettingsToUI();
    document.querySelectorAll("[data-admin-language]").forEach((button) =>
      button.addEventListener("click", () => saveSettings({ language: button.getAttribute("data-admin-language") }))
    );
    document.getElementById("adminCurrencySelect").addEventListener("change", (event) => saveSettings({ currency: event.target.value }));
    document.querySelectorAll("[data-admin-theme]").forEach((button) =>
      button.addEventListener("click", () => saveSettings({ theme: button.getAttribute("data-admin-theme") }))
    );
  }

  function init() {
    syncHomeLink();
    setAuthState(isAdminLoggedIn());
    bindAdminSettings();
    if (isAdminLoggedIn()) renderAll();
    if (api?.enabled) {
      window.setInterval(() => {
        if (document.hidden) return;
        renderAll();
      }, 3000);
    }

    loginForm?.addEventListener("submit", async (event) => {
      event.preventDefault();
      loginError.textContent = "";
      const formData = new FormData(loginForm);
      const email = String(formData.get("email") || "").trim().toLowerCase();
      const password = String(formData.get("password") || "");
      if (email !== ADMIN_EMAIL || (await sha256(password)) !== ADMIN_HASH) {
        loginError.textContent = adminT("invalidLogin");
        return;
      }
      setAdminSession(true);
      setAuthState(true);
      renderAll();
      loginForm.reset();
    });

    logoutBtn?.addEventListener("click", () => {
      setAdminSession(false);
      setAuthState(false);
    });

    adminSupportReplyForm?.addEventListener("submit", async (event) => {
      event.preventDefault();
      if (!activeSupportThreadId) return;
      await appendAdminReply(activeSupportThreadId, adminSupportComposer.value);
      adminSupportReplyForm.reset();
      renderAll();
    });

    ordersSearch?.addEventListener("input", renderAll);
    supportSearch?.addEventListener("input", renderAll);
    usersSearch?.addEventListener("input", renderAll);
    productsSearch?.addEventListener("input", renderProductList);

    document.getElementById("btnRefreshAdmin")?.addEventListener("click", renderAll);
    document.getElementById("btnExportData")?.addEventListener("click", exportData);
    document.getElementById("btnSeedDemo")?.addEventListener("click", seedDemoData);
    document.getElementById("btnClearDemo")?.addEventListener("click", clearDemoData);

    window.addEventListener("toy-products-updated", renderAll);
    window.addEventListener("toy-settings-updated", () => {
      document.documentElement.dataset.theme = getSettings().theme;
      applyAdminSettingsToUI();
      renderAll();
    });
  }

  document.addEventListener("DOMContentLoaded", init);
})();
