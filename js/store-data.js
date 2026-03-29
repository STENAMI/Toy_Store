(function () {
  const KEYS = {
    products: "igrushkino_products_v2",
    favorites: "igrushkino_favorites",
    viewed: "igrushkino_viewed",
    searchHistory: "igrushkino_search_history",
    settings: "igrushkino_settings",
  };
  const PRODUCTS_UPDATED_KEY = "igrushkino_products_updated_at";

  const API_BASE = String(window.ToyStoreConfig?.apiBase || "").trim().replace(/\/$/, "");
  const API_ENABLED = API_BASE.length > 0;

  async function apiFetch(path, options) {
    if (!API_ENABLED) return null;
    const opts = options ? { ...options } : {};
    const headers = { Accept: "application/json", ...(opts.headers || {}) };
    if (opts.body && !headers["Content-Type"]) headers["Content-Type"] = "application/json";
    const response = await fetch(`${API_BASE}${path}`, {
      ...opts,
      headers,
      body: typeof opts.body === "string" ? opts.body : opts.body ? JSON.stringify(opts.body) : undefined,
    });
    if (!response.ok) return null;
    try {
      return await response.json();
    } catch {
      return null;
    }
  }

  if (!window.ToyStoreApi) {
    window.ToyStoreApi = { enabled: API_ENABLED, fetch: apiFetch, base: API_BASE };
  } else {
    window.ToyStoreApi.enabled = API_ENABLED;
    window.ToyStoreApi.fetch = apiFetch;
    window.ToyStoreApi.base = API_BASE;
  }

  function readJSON(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch {
      return fallback;
    }
  }

  function writeJSON(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function enrichProduct(product, index) {
    const titleEn =
      product.titleEn ||
      [
        "Cloud Bear",
        "City Builder Set",
        "Star Doll",
        "Park Puzzle",
        "Wooden Train",
        "Glow Robot",
        "Soft Cubes",
        "Treasure Board Game",
        "Rainbow Spinner",
        "Rocket Kit",
        "Rocking Horse",
        "Clay Studio Set",
        "Bouncy Ball",
        "Key Wind Train",
        "Plush Dragon",
        "Racing Track",
        "Breeze Kite",
        "Jump Counter Rope",
        "Gym Hoop",
        "Dream Projector",
      ][index] || product.title;

    return {
      id: product.id,
      title: product.title,
      titleEn,
      price: Number(product.price || 0),
      oldPrice: Number(product.oldPrice || 0),
      category: product.category || "toys",
      gender: product.gender || "unisex",
      age: product.age || "3+",
      material: product.material || "soft textile",
      materialEn: product.materialEn || product.material || "soft textile",
      description:
        product.description ||
        "Яркая игрушка для ежедневной игры, подарка и уютных семейных вечеров.",
      descriptionEn:
        product.descriptionEn ||
        "A cheerful toy for everyday play, gifting and cozy family moments.",
      keywords: product.keywords || "",
      images: Array.isArray(product.images) && product.images.length ? product.images : [product.image].filter(Boolean),
      image: product.image || product.images?.[0] || "",
      popularScore: Number(product.popularScore || 0),
      featured: Boolean(product.featured),
      mainHero: Boolean(product.mainHero),
    };
  }

  function buildDefaultProducts() {
    return [
      {
        id: "p1",
        title: "Мишка «Облачко»",
        price: 1490,
        oldPrice: 1790,
        image: "img/p1.svg",
        category: "plush",
        gender: "girls",
        age: "0+",
        material: "Гипоаллергенный плюш",
        materialEn: "Hypoallergenic plush",
        description: "Большой мягкий мишка для сна, обнимашек и первых подарков малышу.",
        descriptionEn: "A soft oversized bear for naps, cuddles and the sweetest first gifts.",
        keywords: "мишка медведь плюш мягкая игрушка",
        featured: true,
        popularScore: 96,
      },
      {
        id: "p2",
        title: "Конструктор «Город»",
        price: 2190,
        oldPrice: 2490,
        image: "img/p2.svg",
        category: "builder",
        gender: "boys",
        age: "5+",
        material: "Безопасный ABS-пластик",
        materialEn: "Safe ABS plastic",
        description: "Большой набор блоков с дорогами, башнями и машинками для сюжетной игры.",
        descriptionEn: "A large block set with roads, towers and mini cars for story-driven play.",
        keywords: "конструктор блоки город lego",
        featured: true,
        popularScore: 88,
      },
      {
        id: "p3",
        title: "Кукла «Звёздочка»",
        price: 1890,
        image: "img/p3.svg",
        category: "dolls",
        gender: "girls",
        age: "4+",
        material: "Текстиль и винил",
        materialEn: "Textile and vinyl",
        description: "Нежная кукла с прошитыми волосами и комплектом одежды на каждый день.",
        descriptionEn: "A gentle doll with rooted hair and an everyday wardrobe set.",
        keywords: "кукла мягкая одежда",
        popularScore: 81,
      },
      {
        id: "p4",
        title: "Пазл «Парк» 500 деталей",
        price: 890,
        image: "img/p4.svg",
        category: "board",
        gender: "unisex",
        age: "8+",
        material: "Плотный картон",
        materialEn: "Thick cardboard",
        description: "Большой яркий пазл для спокойного вечера и тренировки внимания.",
        descriptionEn: "A colorful large puzzle for calm evenings and focus training.",
        keywords: "пазл детали картина",
        popularScore: 64,
      },
      {
        id: "p5",
        title: "Деревянный поезд",
        price: 640,
        image: "img/p5.svg",
        category: "transport",
        gender: "boys",
        age: "2+",
        material: "Шлифованное дерево",
        materialEn: "Polished wood",
        description: "Классический поезд с вагонами для первых маршрутов по детской комнате.",
        descriptionEn: "A classic wooden train with wagons for first room-size adventures.",
        keywords: "поезд деревянный паровоз вагон",
        popularScore: 70,
      },
      {
        id: "p6",
        title: "Робот «Светлячок»",
        price: 1290,
        image: "img/p6.svg",
        category: "science",
        gender: "boys",
        age: "6+",
        material: "Пластик с LED-модулем",
        materialEn: "Plastic with LED module",
        description: "Игрушечный робот со световыми эффектами и подвижными руками.",
        descriptionEn: "A playful robot with lights and moving arms for little inventors.",
        keywords: "робот электроника свет",
        featured: true,
        popularScore: 84,
      },
      {
        id: "p7",
        title: "Мягкие кубики 12 шт.",
        price: 790,
        image: "img/p7.svg",
        category: "plush",
        gender: "unisex",
        age: "1+",
        material: "Текстиль и мягкий наполнитель",
        materialEn: "Textile and soft filling",
        description: "Крупные лёгкие кубики для башен, моторики и первых слов.",
        descriptionEn: "Large soft cubes for towers, motor skills and first words.",
        keywords: "кубики мягкие развивающие",
        popularScore: 73,
      },
      {
        id: "p8",
        title: "Настольная игра «Сокровища»",
        price: 1590,
        image: "img/p8.svg",
        category: "board",
        gender: "unisex",
        age: "7+",
        material: "Картон, пластик",
        materialEn: "Cardboard and plastic",
        description: "Семейная настолка с картой приключений, жетонами и простыми правилами.",
        descriptionEn: "A family board game with an adventure map, tokens and easy rules.",
        keywords: "настолка настольная игра семья",
        featured: true,
        popularScore: 90,
      },
      {
        id: "p9",
        title: "Юла «Радуга»",
        price: 450,
        image: "img/p9.svg",
        category: "outdoor",
        gender: "unisex",
        age: "3+",
        material: "Прочный пластик",
        materialEn: "Durable plastic",
        description: "Классическая юла с яркими полосами и плавным вращением.",
        descriptionEn: "A classic spinner with bright stripes and smooth spinning.",
        keywords: "юла волчок радуга",
        popularScore: 51,
      },
      {
        id: "p10",
        title: "Ракета-конструктор",
        price: 990,
        image: "img/p10.svg",
        category: "science",
        gender: "boys",
        age: "6+",
        material: "Пластик и картон",
        materialEn: "Plastic and cardboard",
        description: "Собираемая ракета для первых космических миссий и ролевых игр.",
        descriptionEn: "A buildable rocket for first space missions and role play.",
        keywords: "ракета конструктор космос",
        popularScore: 77,
      },
      {
        id: "p11",
        title: "Лошадка-качалка",
        price: 3490,
        image: "img/p11.svg",
        category: "outdoor",
        gender: "unisex",
        age: "2+",
        material: "Дерево и велюр",
        materialEn: "Wood and velour",
        description: "Устойчивая качалка с мягким сиденьем и безопасной посадкой.",
        descriptionEn: "A stable rocking horse with a soft seat and secure posture.",
        keywords: "лошадь качалка дерево",
        popularScore: 68,
      },
      {
        id: "p12",
        title: "Набор для лепки 24 цвета",
        price: 690,
        image: "img/p12.svg",
        category: "creative",
        gender: "girls",
        age: "3+",
        material: "Мягкая масса для лепки",
        materialEn: "Soft modeling dough",
        description: "Яркий творческий набор для фигурок, букв и маленьких шедевров.",
        descriptionEn: "A bright creative set for figures, letters and tiny masterpieces.",
        keywords: "лепка пластилин тесто цвета",
        popularScore: 74,
      },
      {
        id: "p13",
        title: "Мячик-попрыгун",
        price: 320,
        image: "img/p13.svg",
        category: "outdoor",
        gender: "boys",
        age: "3+",
        material: "Резина",
        materialEn: "Rubber",
        description: "Пружинистый мяч для активных игр дома и на улице.",
        descriptionEn: "A bouncy ball for energetic play indoors and outdoors.",
        keywords: "мяч попрыгун мячик",
        popularScore: 49,
      },
      {
        id: "p14",
        title: "Паровозик на ключе",
        price: 1100,
        image: "img/p14.svg",
        category: "transport",
        gender: "boys",
        age: "4+",
        material: "Металл и пластик",
        materialEn: "Metal and plastic",
        description: "Механическая игрушка с заводным ключом и плавным ходом.",
        descriptionEn: "A wind-up toy train with a charming retro movement.",
        keywords: "паровоз поезд ключ механика",
        popularScore: 60,
      },
      {
        id: "p15",
        title: "Плюшевый дракон",
        price: 1750,
        image: "img/p15.svg",
        category: "plush",
        gender: "boys",
        age: "3+",
        material: "Плюш и хлопок",
        materialEn: "Plush and cotton",
        description: "Сказочный дракон с крыльями, которого приятно брать в дорогу.",
        descriptionEn: "A fantasy dragon with wings, perfect for travel and bedtime stories.",
        keywords: "дракон плюш сказка",
        featured: true,
        mainHero: true,
        popularScore: 92,
      },
      {
        id: "p16",
        title: "Гоночный трек",
        price: 2490,
        image: "img/p16.svg",
        category: "transport",
        gender: "boys",
        age: "5+",
        material: "Пластик",
        materialEn: "Plastic",
        description: "Скоростной трек с петлёй и машинкой для домашних гонок.",
        descriptionEn: "A fast racing track with a loop and a stunt car.",
        keywords: "трек машина гонки",
        featured: true,
        popularScore: 95,
      },
      {
        id: "p17",
        title: "Воздушный змей «Ветерок»",
        price: 550,
        image: "img/p17.svg",
        category: "outdoor",
        gender: "girls",
        age: "5+",
        material: "Нейлон и стекловолокно",
        materialEn: "Nylon and fiberglass",
        description: "Лёгкий змей для прогулок в парке и первых запусков.",
        descriptionEn: "A lightweight kite for park walks and first launches.",
        keywords: "змей воздух улица",
        popularScore: 57,
      },
      {
        id: "p18",
        title: "Скакалка со счётчиком",
        price: 420,
        image: "img/p18.svg",
        category: "outdoor",
        gender: "girls",
        age: "6+",
        material: "ПВХ и мягкие ручки",
        materialEn: "PVC and soft handles",
        description: "Яркая скакалка для активности, челленджей и дворовых игр.",
        descriptionEn: "A vivid jump rope for movement, challenges and outdoor play.",
        keywords: "скакалка спорт прыжки",
        popularScore: 54,
      },
      {
        id: "p19",
        title: "Обруч гимнастический",
        price: 380,
        image: "img/p19.svg",
        category: "outdoor",
        gender: "girls",
        age: "5+",
        material: "Пластик",
        materialEn: "Plastic",
        description: "Лёгкий яркий обруч для танцев, игр и домашней зарядки.",
        descriptionEn: "A bright hula hoop for dancing, games and indoor workouts.",
        keywords: "обруч гимнастика круг",
        popularScore: 45,
      },
      {
        id: "p20",
        title: "Ночник-проектор «Звёзды»",
        price: 1290,
        image: "img/p50.svg",
        category: "science",
        gender: "unisex",
        age: "4+",
        material: "Пластик и LED-подсветка",
        materialEn: "Plastic and LED light",
        description: "Спокойный ночник, который превращает потолок в маленькое звёздное небо.",
        descriptionEn: "A calm projector lamp that turns the ceiling into a tiny starry sky.",
        keywords: "ночник проектор звезды сон",
        featured: true,
        popularScore: 86,
      },
    ].map((product, index) => enrichProduct(product, index));
  }

  function normalizeProducts(list) {
    const source = Array.isArray(list) ? list : [];
    return source.map((product, index) => enrichProduct(product, index));
  }

  async function syncProductsFromApi() {
    if (!API_ENABLED) return;
    const data = await apiFetch("/api/products");
    const products = Array.isArray(data) ? data : data?.products;
    const remoteUpdatedAt = Number(data?.updatedAt || 0) || 0;
    if (!Array.isArray(products)) return;
    const localUpdatedAt = Number(localStorage.getItem(PRODUCTS_UPDATED_KEY) || 0) || 0;
    if (remoteUpdatedAt && localUpdatedAt && localUpdatedAt > remoteUpdatedAt) return;
    if (!products.length) {
      const current = readJSON(KEYS.products, null);
      const fallback = Array.isArray(current) && current.length ? current : buildDefaultProducts();
      writeJSON(KEYS.products, normalizeProducts(fallback));
      localStorage.setItem(PRODUCTS_UPDATED_KEY, String(Date.now()));
      saveProductsToApi(fallback, Date.now());
      window.dispatchEvent(new CustomEvent("toy-products-updated"));
      return;
    }
    writeJSON(KEYS.products, normalizeProducts(products));
    if (remoteUpdatedAt) localStorage.setItem(PRODUCTS_UPDATED_KEY, String(remoteUpdatedAt));
    window.dispatchEvent(new CustomEvent("toy-products-updated"));
  }

  function saveProductsToApi(products, updatedAt) {
    if (!API_ENABLED) return;
    apiFetch("/api/products", { method: "PUT", body: { products: normalizeProducts(products), updatedAt } });
  }

  function getProducts() {
    const stored = readJSON(KEYS.products, null);
    if (!stored || !Array.isArray(stored) || !stored.length) {
      const defaults = buildDefaultProducts();
      writeJSON(KEYS.products, defaults);
      return clone(defaults);
    }
    return clone(normalizeProducts(stored));
  }

  function saveProducts(products) {
    const updatedAt = Date.now();
    writeJSON(KEYS.products, normalizeProducts(products));
    localStorage.setItem(PRODUCTS_UPDATED_KEY, String(updatedAt));
    window.dispatchEvent(new CustomEvent("toy-products-updated"));
    saveProductsToApi(products, updatedAt);
  }

  function getSettings() {
    return {
      language: "ru",
      currency: "RUB",
      theme: "dark",
      deliveryAddress: "",
      city: "",
      ...readJSON(KEYS.settings, {}),
    };
  }

  function saveSettings(settings) {
    writeJSON(KEYS.settings, { ...getSettings(), ...settings });
    window.dispatchEvent(new CustomEvent("toy-settings-updated"));
  }

  function readList(key) {
    const list = readJSON(key, []);
    return Array.isArray(list) ? list : [];
  }

  function saveList(key, value) {
    writeJSON(key, Array.isArray(value) ? value : []);
  }

  function getFavorites() {
    return readList(KEYS.favorites);
  }

  function setFavorites(ids) {
    saveList(KEYS.favorites, ids);
    window.dispatchEvent(new CustomEvent("toy-favorites-updated"));
  }

  function getViewed() {
    return readList(KEYS.viewed);
  }

  function setViewed(ids) {
    saveList(KEYS.viewed, ids.slice(0, 12));
  }

  function getSearchHistory() {
    return readList(KEYS.searchHistory);
  }

  function setSearchHistory(queries) {
    saveList(KEYS.searchHistory, queries.slice(0, 10));
  }

  const dictionary = {
    ru: {
      brand: "Игрушкино",
      navCatalog: "Направления",
      navShop: "Товары",
      navPopular: "Популярное",
      navSupport: "Поддержка",
      login: "Войти",
      register: "Регистрация",
      favorites: "Избранное",
      cart: "Корзина",
      all: "Все",
      boys: "Для мальчиков",
      girls: "Для девочек",
      unisex: "Универсальные",
      sortPopular: "Сначала популярные",
      sortCategory: "По категории",
      sortCheap: "Сначала дешевле",
      sortExpensive: "Сначала дороже",
      heroBadge: "Подарки с доставкой по всей России",
      heroTitle: "Игрушки, которые хочется не выпускать из рук",
      heroLead: "Мягкие, развивающие и яркие игрушки с избранным, удобной историей просмотров и живыми карточками товаров.",
      heroPrimary: "Смотреть каталог",
      heroSecondary: "Популярные товары",
      heroOpen: "Открыть карточку",
      heroStatCatalog: "товаров в каталоге",
      heroStatLocale: "валюты и 2 языка",
      heroStatHistory: "история и избранное",
      deliveryLabel: "Адрес доставки",
      collectionsSubtitle: "Плюшевые друзья, конструкторы, развивающие наборы и активные игрушки на каждый день.",
      collectionPlushTitle: "Мягкие игрушки",
      collectionPlushText: "Уютные подарки для сна, дороги и личного маленького ритуала перед сном.",
      collectionBuilderTitle: "Конструкторы",
      collectionBuilderText: "Наборы для фантазии, мелкой моторики и первых инженерных побед.",
      collectionCreativeTitle: "Творчество",
      collectionCreativeText: "Лепка, рисунок и наборы, которые превращают стол в мастерскую.",
      collectionOutdoorTitle: "Активные игры",
      collectionOutdoorText: "Игрушки для улицы, движения и энергичных семейных выходных.",
      popularTitle: "Популярные товары",
      popularSubtitle: "Листайте карточки стрелками и открывайте подробное описание.",
      shopTitle: "Каталог товаров",
      shopSubtitle: "Фильтруйте по полу, цене, истории и избранному. Нажмите на товар, чтобы открыть подробную карточку.",
      searchPlaceholder: "Поиск: мишка, конструктор, настолка…",
      sortLabel: "Сортировка",
      audienceLabel: "Подборка",
      onlyFav: "Только избранное",
      viewedTitle: "Недавно смотрели",
      viewedEmpty: "История просмотров появится после открытия карточек товаров.",
      historyTitle: "История поиска",
      historyEmpty: "Последние запросы будут сохраняться здесь.",
      details: "Подробнее",
      addToCart: "В корзину",
      buyNow: "Купить",
      supportTitle: "Поддержка",
      supportSubtitle: "Заказ, возврат, подарок, материалы и возрастные рекомендации. Мы ответим в чате и по email.",
      supportChannelEmail: "общие вопросы",
      supportChannelPhone: "звонок по РФ",
      supportChannelChat: "Чат на сайте — ежедневно 9:00–21:00",
      faqAgeTitle: "Можно ли выбрать игрушку по возрасту?",
      faqAgeText: "Да, в карточке каждого товара теперь есть возрастная категория и материал.",
      faqDeliveryTitle: "Как работает доставка?",
      faqDeliveryText: "Укажите город и адрес в корзине, и заказ сохранится в локальной истории заказов.",
      faqAnswersTitle: "Где посмотреть ответы поддержки?",
      faqAnswersText: "После входа откроется кнопка «Обращения» в шапке сайта.",
      footerMeta: "Магазин сохраняет избранное, корзину, историю и товары только в браузере.",
      footerBrand: "Игрушкино © 2026",
      footerAdmin: "Админ-панель",
      footerNew: "Новинки",
      footerPopular: "Популярное",
      careers: "Хочу устроиться в Игрушкино!",
      supportInstant: "Сообщение сразу увидит администратор.",
      supportReplyHere: "Ответ администратора появится здесь.",
      productAge: "Возраст",
      productMaterial: "Материал",
      productDescription: "Описание",
      productGallery: "Галерея",
      reply: "Ответ",
      searchResults: "Найдено: {count} из {total}",
      emptyShop: "Ничего не найдено. Попробуйте другой запрос или сбросьте фильтры.",
      checkout: "Оформить заказ",
      cartTitle: "Корзина",
      total: "Итого",
      cityLabel: "Город",
      orderAddress: "Адрес доставки",
      addressPlaceholder: "Улица, дом, квартира",
      languageLabel: "Язык",
      currencyLabel: "Валюта",
      themeLabel: "Тема",
      themeLight: "Светлая",
      themeDark: "Тёмная",
      productModalBuy: "Добавить в корзину",
      modalClose: "Закрыть",
      audienceAll: "Все товары",
      supportInbox: "Обращения",
      yourFavoritesEmpty: "Добавьте товары в избранное, чтобы собрать личную подборку.",
      favoritesTitle: "Ваши любимые товары",
      searchHistoryClear: "Очистить историю",
    },
    en: {
      brand: "Igrushkino",
      navCatalog: "Collections",
      navShop: "Shop",
      navPopular: "Popular",
      navSupport: "Support",
      login: "Sign in",
      register: "Register",
      favorites: "Favorites",
      cart: "Cart",
      all: "All",
      boys: "For boys",
      girls: "For girls",
      unisex: "Unisex",
      sortPopular: "Most popular first",
      sortCategory: "By category",
      sortCheap: "Price: low to high",
      sortExpensive: "Price: high to low",
      heroBadge: "Gift-ready toys with delivery",
      heroTitle: "Toys you instantly want to hold",
      heroLead: "Soft, creative and high-energy toys with favorites, dark mode and product stories.",
      heroPrimary: "Browse catalog",
      heroSecondary: "Popular picks",
      heroOpen: "Open card",
      heroStatCatalog: "products in catalog",
      heroStatLocale: "currencies and 2 languages",
      heroStatHistory: "history and favorites",
      deliveryLabel: "Delivery address",
      collectionsSubtitle: "Plush friends, building sets, creative kits and active toys for every day.",
      collectionPlushTitle: "Plush Toys",
      collectionPlushText: "Cozy gifts for sleep, travel and a tiny bedtime ritual.",
      collectionBuilderTitle: "Building Sets",
      collectionBuilderText: "Sets for imagination, fine motor skills and first engineering wins.",
      collectionCreativeTitle: "Creative Play",
      collectionCreativeText: "Modeling, drawing and kits that turn any table into a studio.",
      collectionOutdoorTitle: "Active Play",
      collectionOutdoorText: "Outdoor toys for movement and energetic family weekends.",
      popularTitle: "Popular toys",
      popularSubtitle: "Swipe the cards with arrows and open the detailed product page.",
      shopTitle: "Product catalog",
      shopSubtitle: "Filter by audience, price, favorites and history. Click a product to open full details.",
      searchPlaceholder: "Search: bear, puzzle, board game…",
      sortLabel: "Sort",
      audienceLabel: "Audience",
      onlyFav: "Favorites only",
      viewedTitle: "Recently viewed",
      viewedEmpty: "Viewed products will appear here after you open any product card.",
      historyTitle: "Search history",
      historyEmpty: "Your recent searches will be stored here.",
      details: "Details",
      addToCart: "Add to cart",
      buyNow: "Buy now",
      supportTitle: "Support",
      supportSubtitle: "Orders, returns, gifting, materials and age guidance. We reply in chat and by email.",
      supportChannelEmail: "general questions",
      supportChannelPhone: "call across Russia",
      supportChannelChat: "Website chat — daily 9:00–21:00",
      faqAgeTitle: "Can I choose a toy by age?",
      faqAgeText: "Yes, each product card now includes age guidance and material details.",
      faqDeliveryTitle: "How does delivery work?",
      faqDeliveryText: "Enter your city and address in the cart, and the order will be saved in local history.",
      faqAnswersTitle: "Where can I see support replies?",
      faqAnswersText: "After sign in, the Requests button appears in the site header.",
      footerMeta: "This store keeps favorites, cart, history and catalog edits in your browser only.",
      footerBrand: "Igrushkino © 2026",
      footerAdmin: "Admin panel",
      footerNew: "New arrivals",
      footerPopular: "Popular",
      careers: "I want to work at Igrushkino!",
      supportInstant: "The admin will see the message right away.",
      supportReplyHere: "The admin reply will appear here.",
      productAge: "Age",
      productMaterial: "Material",
      productDescription: "Description",
      productGallery: "Gallery",
      reply: "Reply",
      searchResults: "Found: {count} of {total}",
      emptyShop: "Nothing found. Try a different query or reset filters.",
      checkout: "Checkout",
      cartTitle: "Cart",
      total: "Total",
      cityLabel: "City",
      orderAddress: "Delivery address",
      addressPlaceholder: "Street, building, apartment",
      languageLabel: "Language",
      currencyLabel: "Currency",
      themeLabel: "Theme",
      themeLight: "Light",
      themeDark: "Dark",
      productModalBuy: "Add to cart",
      modalClose: "Close",
      audienceAll: "All products",
      supportInbox: "Requests",
      yourFavoritesEmpty: "Add products to favorites to build your own selection.",
      favoritesTitle: "Your favorites",
      searchHistoryClear: "Clear history",
    },
  };

  dictionary.ru.categoryLabel = "\u041a\u0430\u0442\u0435\u0433\u043e\u0440\u0438\u044f";
  dictionary.ru.categoryAll = "\u0412\u0441\u0435 \u043a\u0430\u0442\u0435\u0433\u043e\u0440\u0438\u0438";
  dictionary.en.categoryLabel = "Category";
  dictionary.en.categoryAll = "All categories";

  function t(key, replacements, language) {
    const lang = language || getSettings().language || "ru";
    const table = dictionary[lang] || dictionary.ru;
    const template = table[key] || dictionary.ru[key] || key;
    return Object.entries(replacements || {}).reduce(
      (result, [name, value]) => result.replaceAll(`{${name}}`, String(value)),
      template
    );
  }

  function applyI18n(root, language) {
    const lang = language || getSettings().language || "ru";
    (root || document).querySelectorAll("[data-i18n]").forEach((node) => {
      node.textContent = t(node.getAttribute("data-i18n"), {}, lang);
    });
    (root || document).querySelectorAll("[data-i18n-placeholder]").forEach((node) => {
      node.setAttribute("placeholder", t(node.getAttribute("data-i18n-placeholder"), {}, lang));
    });
    (root || document).querySelectorAll("[data-i18n-aria]").forEach((node) => {
      node.setAttribute("aria-label", t(node.getAttribute("data-i18n-aria"), {}, lang));
    });
  }

  if (API_ENABLED) {
    syncProductsFromApi();
  }

  window.ToyStoreData = {
    KEYS,
    getProducts,
    saveProducts,
    getSettings,
    saveSettings,
    getFavorites,
    setFavorites,
    getViewed,
    setViewed,
    getSearchHistory,
    setSearchHistory,
    readJSON,
    writeJSON,
    t,
    applyI18n,
    dictionary,
  };
})();
