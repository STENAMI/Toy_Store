(function () {
  const STORAGE_KEY = "igrushkino_user";
  const api = window.ToyStoreApi;

  async function hashPassword(password) {
    const value = String(password || "");
    if (window.crypto?.subtle && window.TextEncoder) {
      const bytes = new TextEncoder().encode(value);
      const digest = await window.crypto.subtle.digest("SHA-256", bytes);
      return Array.from(new Uint8Array(digest))
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");
    }

    let hash = 2166136261;
    for (let i = 0; i < value.length; i += 1) {
      hash ^= value.charCodeAt(i);
      hash = Math.imul(hash, 16777619);
    }
    return `fnv1a-${(hash >>> 0).toString(16)}`;
  }

  function getStored() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  function saveUser(user) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
  }

  function clearUser() {
    localStorage.removeItem(STORAGE_KEY);
  }

  function getUsers() {
    try {
      const raw = localStorage.getItem("igrushkino_users");
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  }

  function saveUsers(users) {
    localStorage.setItem("igrushkino_users", JSON.stringify(users));
  }

  function notifyAuthChanged(user) {
    window.dispatchEvent(
      new CustomEvent("toy-auth-updated", {
        detail: { user: user || null },
      })
    );
  }

  window.ToyStoreAuth = {
    getUser: getStored,
    logout() {
      clearUser();
      updateUI();
    },
    async register(name, email, password) {
      const users = getUsers();
      const key = email.trim().toLowerCase();
      if (api?.enabled) {
        const data = await api.fetch("/api/users/login", {
          method: "POST",
          body: { email: key, passwordHash },
        });
        if (data?.user) {
          users[key] = { ...data.user, passwordHash };
          saveUsers(users);
          saveUser({ name: data.user.name, email: data.user.email });
          return { ok: true };
        }
      }
      const passwordHash = await hashPassword(password);
      if (api?.enabled) {
        const data = await api.fetch("/api/users/register", {
          method: "POST",
          body: { name: name.trim(), email: key, passwordHash },
        });
        if (data?.user) {
          users[key] = { ...data.user, passwordHash };
          saveUsers(users);
          saveUser({ name: data.user.name, email: data.user.email });
          return { ok: true };
        }
      }
      if (users[key]) {
        return { ok: false, error: "Этот email уже зарегистрирован." };
      }

      users[key] = {
        name: name.trim(),
        email: key,
        passwordHash,
        createdAt: Date.now(),
      };
      saveUsers(users);
      saveUser({ name: users[key].name, email: users[key].email });
      return { ok: true };
    },
    async login(email, password) {
      const users = getUsers();
      const key = email.trim().toLowerCase();
      const user = users[key];
      if (!user) {
        return { ok: false, error: "Неверный email или пароль." };
      }

      const passwordHash = await hashPassword(password);
      if (user.passwordHash) {
        if (user.passwordHash !== passwordHash) {
          return { ok: false, error: "Неверный email или пароль." };
        }
      } else if (user.password === password) {
        user.passwordHash = passwordHash;
        delete user.password;
        saveUsers(users);
      } else {
        return { ok: false, error: "Неверный email или пароль." };
      }

      saveUser({ name: user.name, email: user.email });
      return { ok: true };
    },
  };

  const userArea = document.getElementById("userArea");
  const userBadge = document.getElementById("userBadge");
  const userNameDisplay = document.getElementById("userNameDisplay");
  const btnLogout = document.getElementById("btnLogout");
  const btnSupportInbox = document.getElementById("btnSupportInbox");

  function updateUI() {
    const user = getStored();
    if (user && userArea && userBadge && userNameDisplay) {
      userArea.classList.add("hidden");
      userBadge.classList.remove("hidden");
      userNameDisplay.textContent = user.name || user.email;
      btnSupportInbox?.classList.remove("hidden");
    } else if (userArea && userBadge) {
      userArea.classList.remove("hidden");
      userBadge.classList.add("hidden");
      btnSupportInbox?.classList.add("hidden");
    }

    notifyAuthChanged(user);
  }

  if (btnLogout) {
    btnLogout.addEventListener("click", () => {
      window.ToyStoreAuth.logout();
    });
  }

  updateUI();
  window.ToyStoreAuth.updateUI = updateUI;
})();
