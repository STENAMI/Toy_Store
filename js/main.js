(function () {
  const SUPPORT_KEY = "igrushkino_support_tickets";

  const modalAuth = document.getElementById("modalAuth");
  const btnLogin = document.getElementById("btnLogin");
  const btnRegister = document.getElementById("btnRegister");
  const formLogin = document.getElementById("formLogin");
  const formRegister = document.getElementById("formRegister");
  const loginError = document.getElementById("loginError");
  const registerError = document.getElementById("registerError");
  const tabBtns = document.querySelectorAll(".tabs__btn");
  const supportForm = document.getElementById("supportForm");
  const supportFormNote = document.getElementById("supportFormNote");
  const burger = document.getElementById("burger");
  const nav = document.getElementById("nav");
  const btnSupportInbox = document.getElementById("btnSupportInbox");

  const supportModal = document.getElementById("modalSupportInbox");
  const supportThreads = document.getElementById("supportThreads");
  const supportThreadHeader = document.getElementById("supportThreadHeader");
  const supportMessages = document.getElementById("supportMessages");
  const supportThreadEmpty = document.getElementById("supportThreadEmpty");
  const supportThreadView = document.getElementById("supportThreadView");
  const supportReplyForm = document.getElementById("supportReplyForm");
  const supportComposer = document.getElementById("supportComposer");
  const supportNewThreadForm = document.getElementById("supportNewThreadForm");
  const supportNewThreadFormWrap = document.getElementById("supportNewThreadFormWrap");
  const supportReplyHint = document.getElementById("supportReplyHint");
  const btnNewSupportThread = document.getElementById("btnNewSupportThread");
  const supportNameInput = supportForm?.querySelector('input[name="name"]');
  const supportEmailInput = supportForm?.querySelector('input[name="email"]');
  const supportSubmitBtn = document.getElementById("supportSubmitBtn");
  const supportLoginNote = document.getElementById("supportLoginNote");

  let activeThreadId = null;
  let supportSyncTimer = null;
  let lastSupportSnapshot = localStorage.getItem(SUPPORT_KEY) || "[]";

  function openAuthModal(tab) {
    if (!modalAuth) return;
    modalAuth.classList.add("is-open");
    modalAuth.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
    if (tab === "register") {
      tabBtns.forEach((btn) => btn.classList.toggle("is-active", btn.dataset.tab === "register"));
      formLogin?.classList.add("hidden");
      formRegister?.classList.remove("hidden");
    } else {
      tabBtns.forEach((btn) => btn.classList.toggle("is-active", btn.dataset.tab === "login"));
      formRegister?.classList.add("hidden");
      formLogin?.classList.remove("hidden");
    }
  }

  function closeAuthModal() {
    if (!modalAuth) return;
    modalAuth.classList.remove("is-open");
    modalAuth.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
    if (loginError) loginError.textContent = "";
    if (registerError) registerError.textContent = "";
  }

  function getCurrentUser() {
    return window.ToyStoreAuth?.getUser?.() || null;
  }

  function createId(prefix) {
    return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
  }

  function normalizeSupportThreads() {
    let changed = false;
    let parsed;
    try {
      parsed = JSON.parse(localStorage.getItem(SUPPORT_KEY) || "[]");
    } catch {
      parsed = [];
      changed = true;
    }
    const list = Array.isArray(parsed) ? parsed : [];
    const normalized = list.map((item) => {
      if (Array.isArray(item.messages)) {
        const messages = item.messages
          .map((message) => ({
            id: message.id || createId("msg"),
            authorType: message.authorType || "user",
            authorName: message.authorName || (item.userName || item.name || "Покупатель"),
            text: String(message.text || "").trim(),
            at: message.at || item.updatedAt || item.createdAt || item.at || new Date().toISOString(),
          }))
          .filter((message) => message.text);
        const next = {
          id: item.id || createId("thread"),
          topic: item.topic || "other",
          status: item.status || "new",
          userName: item.userName || item.name || "Покупатель",
          userEmail: item.userEmail || item.email || "",
          createdAt: item.createdAt || item.at || new Date().toISOString(),
          updatedAt: item.updatedAt || messages[messages.length - 1]?.at || item.at || new Date().toISOString(),
          unreadUser: Number(item.unreadUser || 0),
          unreadAdmin: Number(item.unreadAdmin || 0),
          messages,
        };
        if (!item.id || !item.userName || !item.userEmail || !item.createdAt || !item.updatedAt) {
          changed = true;
        }
        return next;
      }

      changed = true;
      return {
        id: createId("thread"),
        topic: item.topic || "other",
        status: item.status || "new",
        userName: item.name || "Покупатель",
        userEmail: item.email || "",
        createdAt: item.at || new Date().toISOString(),
        updatedAt: item.at || new Date().toISOString(),
        unreadUser: 0,
        unreadAdmin: 1,
        messages: [
          {
            id: createId("msg"),
            authorType: "user",
            authorName: item.name || "Покупатель",
            text: String(item.message || "").trim(),
            at: item.at || new Date().toISOString(),
          },
        ],
      };
    });

    if (changed) {
      localStorage.setItem(SUPPORT_KEY, JSON.stringify(normalized));
    }
    return normalized;
  }

  function saveSupportThreads(threads) {
    localStorage.setItem(SUPPORT_KEY, JSON.stringify(threads));
  }

  function getUserThreads() {
    const user = getCurrentUser();
    if (!user?.email) return [];
    return normalizeSupportThreads()
      .filter((thread) => thread.userEmail === user.email)
      .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
  }

  function topicText(topic) {
    return (
      {
        order: "Заказ и доставка",
        return: "Возврат и обмен",
        product: "Вопрос о товаре",
        other: "Другое",
      }[topic] || "Обращение"
    );
  }

  function statusText(status) {
    return (
      {
        new: "Новый",
        processing: "В работе",
        done: "Решено",
        cancelled: "Закрыто",
      }[status] || "Новый"
    );
  }

  function formatDate(value) {
    try {
      return new Intl.DateTimeFormat("ru-RU", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
    } catch {
      return value || "";
    }
  }

  function openSupportModal() {
    const user = getCurrentUser();
    if (!user) {
      openAuthModal("login");
      return;
    }
    supportModal?.classList.add("is-open");
    supportModal?.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
    renderSupportInbox();
  }

  function syncSupportFormUser() {
    const user = getCurrentUser();
    if (!supportNameInput || !supportEmailInput) return;
    if (user) {
      supportNameInput.value = user.name || "";
      supportEmailInput.value = user.email || "";
      supportNameInput.readOnly = true;
      supportEmailInput.readOnly = true;
      supportNameInput.setAttribute("aria-readonly", "true");
      supportEmailInput.setAttribute("aria-readonly", "true");
      supportSubmitBtn?.removeAttribute("disabled");
      supportLoginNote?.classList.add("is-hidden");
    } else {
      supportNameInput.value = "";
      supportEmailInput.value = "";
      supportNameInput.readOnly = true;
      supportEmailInput.readOnly = true;
      supportNameInput.setAttribute("aria-readonly", "true");
      supportEmailInput.setAttribute("aria-readonly", "true");
      supportSubmitBtn?.setAttribute("disabled", "disabled");
      supportLoginNote?.classList.remove("is-hidden");
    }
  }

  function closeSupportModal() {
    supportModal?.classList.remove("is-open");
    supportModal?.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
    activeThreadId = null;
  }

  function setSupportViewMode(mode) {
    const isNew = mode === "new";
    supportNewThreadFormWrap?.classList.toggle("hidden", !isNew);
    supportThreadView?.classList.toggle("hidden", isNew || !activeThreadId);
    supportThreadEmpty?.classList.toggle("hidden", isNew || !!activeThreadId);
  }

  function markThreadReadForUser(threadId) {
    const threads = normalizeSupportThreads();
    let changed = false;
    const next = threads.map((thread) => {
      if (thread.id !== threadId || !thread.unreadUser) return thread;
      changed = true;
      return { ...thread, unreadUser: 0 };
    });
    if (changed) saveSupportThreads(next);
  }

  function renderSupportThreadsList() {
    const threads = getUserThreads();
    if (!threads.length) {
      supportThreads.innerHTML = '<div class="support-chat__empty">У вас пока нет обращений. Создайте первое и диалог появится здесь.</div>';
      return;
    }
    supportThreads.innerHTML = threads
      .map(
        (thread) => `
        <button type="button" class="support-thread ${thread.id === activeThreadId ? "is-active" : ""}" data-thread-id="${thread.id}">
          <span class="support-thread__top">
            <strong>${topicText(thread.topic)}</strong>
            <span class="status-pill" data-status="${thread.status}">${statusText(thread.status)}</span>
          </span>
          <span class="support-thread__meta">${formatDate(thread.updatedAt)}</span>
          <span class="support-thread__preview">${(thread.messages[thread.messages.length - 1]?.text || "").slice(0, 110)}</span>
          ${thread.unreadUser ? `<span class="support-thread__badge">${thread.unreadUser}</span>` : ""}
        </button>
      `
      )
      .join("");

    supportThreads.querySelectorAll("[data-thread-id]").forEach((button) => {
      button.addEventListener("click", () => {
        activeThreadId = button.getAttribute("data-thread-id");
        markThreadReadForUser(activeThreadId);
        setSupportViewMode("thread");
        renderSupportInbox();
      });
    });
  }

  function renderSupportThread() {
    const threads = getUserThreads();
    const thread = threads.find((item) => item.id === activeThreadId) || null;
    if (!thread) {
      activeThreadId = null;
      setSupportViewMode("empty");
      supportThreadHeader.innerHTML = "";
      supportMessages.innerHTML = "";
      supportReplyHint.textContent = "Выберите обращение слева или создайте новое.";
      return;
    }

    supportThreadHeader.innerHTML = `
      <div>
        <h3>${topicText(thread.topic)}</h3>
        <p>${thread.userEmail} · ${formatDate(thread.createdAt)}</p>
      </div>
      <span class="status-pill" data-status="${thread.status}">${statusText(thread.status)}</span>
    `;

    supportMessages.innerHTML = thread.messages
      .map(
        (message) => `
        <article class="chat-message chat-message--${message.authorType}">
          <div class="chat-message__meta">
            <strong>${message.authorType === "admin" ? "Поддержка" : "Вы"}</strong>
            <span>${formatDate(message.at)}</span>
          </div>
          <p>${escapeHtml(message.text)}</p>
        </article>
      `
      )
      .join("");

    supportReplyHint.textContent =
      thread.status === "done"
        ? "Обращение уже решено, но вы можете написать повторно и оно снова попадет в работу."
        : "Ответ администратора появится здесь.";
  }

  function renderSupportInbox() {
    const threads = getUserThreads();
    if (!activeThreadId && threads.length) {
      activeThreadId = threads[0].id;
      markThreadReadForUser(activeThreadId);
    }
    renderSupportThreadsList();
    if (activeThreadId) {
      setSupportViewMode("thread");
      renderSupportThread();
    } else {
      setSupportViewMode("empty");
      supportThreadHeader.innerHTML = "";
      supportMessages.innerHTML = "";
      supportReplyHint.textContent = "Создайте первое обращение, чтобы начать диалог.";
    }
    lastSupportSnapshot = localStorage.getItem(SUPPORT_KEY) || "[]";
  }

  function addSupportThread({ topic, message, name, email }) {
    const text = String(message || "").trim();
    if (!text) return null;
    const now = new Date().toISOString();
    const thread = {
      id: createId("thread"),
      topic: topic || "other",
      status: "new",
      userName: String(name || "Покупатель").trim(),
      userEmail: String(email || "").trim().toLowerCase(),
      createdAt: now,
      updatedAt: now,
      unreadUser: 0,
      unreadAdmin: 1,
      messages: [
        {
          id: createId("msg"),
          authorType: "user",
          authorName: String(name || "Покупатель").trim(),
          text,
          at: now,
        },
      ],
    };
    const threads = normalizeSupportThreads();
    threads.push(thread);
    saveSupportThreads(threads);
    return thread;
  }

  function appendUserReply(threadId, messageText) {
    const text = String(messageText || "").trim();
    if (!text) return;
    const now = new Date().toISOString();
    const user = getCurrentUser();
    const threads = normalizeSupportThreads().map((thread) => {
      if (thread.id !== threadId) return thread;
      return {
        ...thread,
        status: thread.status === "done" ? "processing" : thread.status || "processing",
        updatedAt: now,
        unreadAdmin: Number(thread.unreadAdmin || 0) + 1,
        messages: [
          ...thread.messages,
          {
            id: createId("msg"),
            authorType: "user",
            authorName: user?.name || thread.userName || "Покупатель",
            text,
            at: now,
          },
        ],
      };
    });
    saveSupportThreads(threads);
  }

  function syncSupportInboxIfNeeded(force) {
    const nextSnapshot = localStorage.getItem(SUPPORT_KEY) || "[]";
    if (!force && nextSnapshot === lastSupportSnapshot) return;
    lastSupportSnapshot = nextSnapshot;
    if (getCurrentUser()) {
      renderSupportInbox();
    }
  }

  function startSupportAutoRefresh() {
    if (supportSyncTimer) return;
    supportSyncTimer = window.setInterval(() => {
      if (document.hidden) return;
      syncSupportInboxIfNeeded(false);
    }, 2500);
  }

  function stopSupportAutoRefresh() {
    if (!supportSyncTimer) return;
    window.clearInterval(supportSyncTimer);
    supportSyncTimer = null;
  }

  function escapeHtml(value) {
    const node = document.createElement("div");
    node.textContent = String(value || "");
    return node.innerHTML;
  }

  btnLogin?.addEventListener("click", () => openAuthModal("login"));
  btnRegister?.addEventListener("click", () => openAuthModal("register"));
  document.querySelectorAll("[data-auth-open]").forEach((button) => {
    button.addEventListener("click", () => {
      openAuthModal(button.getAttribute("data-auth-open"));
      nav?.classList.remove("is-open");
    });
  });
  btnSupportInbox?.addEventListener("click", openSupportModal);
  btnNewSupportThread?.addEventListener("click", () => {
    activeThreadId = null;
    setSupportViewMode("new");
  });

  modalAuth?.querySelectorAll("[data-close]").forEach((element) => {
    element.addEventListener("click", closeAuthModal);
  });
  supportModal?.querySelectorAll("[data-close-support]").forEach((element) => {
    element.addEventListener("click", closeSupportModal);
  });

  document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape") return;
    if (document.getElementById("modalOrder")?.classList.contains("is-open")) return;
    if (document.getElementById("cartDrawer")?.classList.contains("is-open")) return;
    if (supportModal?.classList.contains("is-open")) {
      closeSupportModal();
      return;
    }
    if (modalAuth?.classList.contains("is-open")) closeAuthModal();
  });

  tabBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      const tab = btn.dataset.tab;
      tabBtns.forEach((item) => item.classList.toggle("is-active", item === btn));
      formLogin?.classList.toggle("hidden", tab !== "login");
      formRegister?.classList.toggle("hidden", tab === "login");
      if (loginError) loginError.textContent = "";
      if (registerError) registerError.textContent = "";
    });
  });

  formLogin?.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!loginError) return;
    loginError.textContent = "";
    const formData = new FormData(formLogin);
    const email = String(formData.get("email") || "");
    const password = String(formData.get("password") || "");
    const result = await window.ToyStoreAuth.login(email, password);
    if (result.ok) {
      window.ToyStoreAuth.updateUI();
      closeAuthModal();
      formLogin.reset();
    } else {
      loginError.textContent = result.error || "Ошибка входа.";
    }
  });

  formRegister?.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!registerError) return;
    registerError.textContent = "";
    const formData = new FormData(formRegister);
    const name = String(formData.get("name") || "");
    const email = String(formData.get("email") || "");
    const password = String(formData.get("password") || "");
    const result = await window.ToyStoreAuth.register(name, email, password);
    if (result.ok) {
      window.ToyStoreAuth.updateUI();
      closeAuthModal();
      formRegister.reset();
    } else {
      registerError.textContent = result.error || "Не удалось зарегистрироваться.";
    }
  });

  supportForm?.addEventListener("submit", (event) => {
    event.preventDefault();
    if (!supportFormNote) return;
    const user = getCurrentUser();
    if (!user) {
      supportFormNote.textContent = "Сначала войдите в аккаунт, чтобы написать в поддержку.";
      supportFormNote.classList.remove("success");
      openAuthModal("login");
      return;
    }
    const formData = new FormData(supportForm);
    const thread = addSupportThread({
      topic: String(formData.get("topic") || "other"),
      message: String(formData.get("message") || ""),
      name: user.name || String(formData.get("name") || ""),
      email: user.email || String(formData.get("email") || ""),
    });

    if (!thread) {
      supportFormNote.textContent = "Напишите сообщение, чтобы отправить обращение.";
      supportFormNote.classList.remove("success");
      return;
    }

    supportFormNote.textContent = "Обращение создано. Продолжить диалог можно через кнопку «Обращения».";
    supportFormNote.classList.add("success");
    supportForm.reset();
    syncSupportFormUser();
    activeThreadId = thread.id;
    renderSupportInbox();

    setTimeout(() => {
      supportFormNote.textContent = "";
      supportFormNote.classList.remove("success");
    }, 6000);
  });

  supportNewThreadForm?.addEventListener("submit", (event) => {
    event.preventDefault();
    const user = getCurrentUser();
    if (!user) {
      closeSupportModal();
      openAuthModal("login");
      return;
    }
    const formData = new FormData(supportNewThreadForm);
    const thread = addSupportThread({
      topic: String(formData.get("topic") || "other"),
      message: String(formData.get("message") || ""),
      name: user.name,
      email: user.email,
    });
    if (!thread) return;
    activeThreadId = thread.id;
    supportNewThreadForm.reset();
    renderSupportInbox();
  });

  supportReplyForm?.addEventListener("submit", (event) => {
    event.preventDefault();
    if (!activeThreadId) return;
    appendUserReply(activeThreadId, supportComposer?.value);
    supportReplyForm.reset();
    renderSupportInbox();
  });

  burger?.addEventListener("click", () => {
    nav?.classList.toggle("is-open");
  });

  nav?.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => nav.classList.remove("is-open"));
  });

  window.addEventListener("toy-auth-updated", () => {
    if (!getCurrentUser() && supportModal?.classList.contains("is-open")) {
      closeSupportModal();
      return;
    }
    syncSupportFormUser();
    if (getCurrentUser()) {
      renderSupportInbox();
    }
  });

  window.addEventListener("storage", (event) => {
    if (event.key === SUPPORT_KEY) {
      syncSupportInboxIfNeeded(true);
    }
  });

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) return;
    syncSupportInboxIfNeeded(true);
  });

  syncSupportFormUser();
  startSupportAutoRefresh();
  window.addEventListener("beforeunload", stopSupportAutoRefresh);
})();
