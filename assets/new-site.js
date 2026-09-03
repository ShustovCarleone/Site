(() => {
  const pages = ["home", "games", "gallery", "streamers", "links"];
  const supportedLanguages = ["uk", "ru", "en"];
  const addressKeys = {
    home: "address.home",
    games: "address.games",
    gallery: "address.gallery",
    streamers: "address.streamers",
    links: "address.links",
  };
  const titleKeys = {
    home: "title.home",
    games: "title.games",
    gallery: "title.gallery",
    streamers: "title.streamers",
    links: "title.links",
  };

  const translations = {
    uk: {
      "common.skip": "Перейти до вмісту",
      "nav.home": "головна",
      "nav.games": "ігри",
      "nav.gallery": "галерея",
      "nav.streamers": "стрімери",
      "nav.links": "посилання",
      "browser.back": "Попередня вкладка",
      "browser.forward": "Наступна вкладка",
      "browser.refresh": "Оновити сторінку",
      "browser.home": "Відкрити головну",
      "language.label": "Вибір мови",
      "address.home": "♡ shughost | маленькі світи ♡",
      "address.games": "shughost.dev / ігри",
      "address.gallery": "shughost.dev / галерея",
      "address.streamers": "shughost.dev / наші стрімери",
      "address.links": "shughost.dev / посилання",
      "title.home": "ShuGhost | Інді-ігри",
      "title.games": "Ігри | ShuGhost",
      "title.gallery": "Галерея | ShuGhost",
      "title.streamers": "Наші стрімери | ShuGhost",
      "title.links": "Посилання | ShuGhost",
      "home.kicker": "♡ shughost | інді-розробник ♡",
      "home.title": "про мене",
      "home.p1": "ShuGhost це соло-розробник незвичайних ігор для ПК з яскравими персонажами, живими системами та краплею хаосу.",
      "home.p2": "Мої ігри можуть жити на робочому столі, реагувати на стрім або занурювати в тиху історію, зосереджену на персонажах.",
      "home.mood": "зараз: оживляю маленькі світи ✦",
      "home.cta": "↗ подивитися ігри",
      "home.projects": "(˶ᵔ ᵕ ᵔ˶) проєкти",
      "home.desktop": "desktop gremlins",
      "home.violet": "dr. violet",
      "home.screenshots": "знімки екрана",
      "home.contact": "зв’язатися зі мною",
      "home.email": "♡ робоча пошта:",
      "games.eyebrow": "мої маленькі світи",
      "games.title": "ігри",
      "games.available": "доступні у Steam",
      "games.gremlinsLabel": "настільний компаньйон | інтеграція з Twitch",
      "games.gremlinsDescription": "Доглядайте за бешкетним компаньйоном на робочому столі, відкривайте нові форми, підключайте OBS і дозволяйте глядачам Twitch запускати ефекти за бали каналу.",
      "games.g1": "8 форм персонажа",
      "games.g2": "Інтеграція з Twitch та OBS",
      "games.g3": "Підтримка Steam Workshop",
      "games.steam": "відкрити у Steam ↗",
      "games.version": "версія 3.0",
      "games.violetLabel": "симулятор персонажа | атмосфера",
      "games.violetDescription": "Проведіть дивний тихий вечір із докторкою Вайолет. Розмовляйте з нею, спостерігайте за реакціями та створюйте настрій особистої історії.",
      "games.v1": "Інтерактивна героїня",
      "games.v2": "Атмосферні розмови",
      "games.v3": "Компактна інді-гра",
      "games.pc": "гра для ПК",
      "gallery.eyebrow": "кадри з ігор",
      "gallery.title": "галерея",
      "gallery.hint": "натисніть на зображення, щоб відкрити",
      "gallery.desktop": "Desktop Gremlins",
      "gallery.twitch": "Інструменти Twitch",
      "gallery.chaos": "Ефекти хаосу",
      "gallery.workshop": "Майстерня",
      "gallery.violet": "Докторка Вайолет",
      "gallery.controls": "Керування",
      "gallery.interaction": "Взаємодія",
      "gallery.reactions": "Реакції",
      "streamers.eyebrow": "друзі проєкту",
      "streamers.title": "наші стрімери",
      "streamers.hint": "наведіть курсор, щоб побачити більше фото",
      "streamers.creator": "автор на Twitch",
      "streamers.ours": "наш стрімер",
      "streamers.open": "відкрити канал Twitch ↗",
      "links.eyebrow": "офіційні сторінки",
      "links.title": "посилання",
      "links.hint": "контакти | спільнота | підтримка",
      "links.business": "співпраця та робочі питання",
      "links.hello": "напишіть мені",
      "links.contactNote": "Для оглядів ігор, співпраці з авторами, відгуків та робочих запитань.",
      "links.steamPage": "сторінка у Steam",
      "links.news": "новини та спільнота",
      "links.community": "сервер спільноти",
      "links.support": "підтримати розробника",
      "links.privacy": "Політика конфіденційності",
      "links.privacyNote": "приватність і дані",
      "footer.tagline": "сайт ShuGhost | незалежні ігри, створені з турботою",
      "footer.warning": "Це офіційні посилання ShuGhost. Остерігайтеся сторінок-копій.",
      "footer.privacy": "Політика конфіденційності",
      "stats.online": "зараз онлайн",
      "stats.views": "переглядів",
    },
    ru: {
      "common.skip": "Перейти к содержимому",
      "nav.home": "главная",
      "nav.games": "игры",
      "nav.gallery": "галерея",
      "nav.streamers": "стримеры",
      "nav.links": "ссылки",
      "browser.back": "Предыдущая вкладка",
      "browser.forward": "Следующая вкладка",
      "browser.refresh": "Обновить страницу",
      "browser.home": "Открыть главную",
      "language.label": "Выбор языка",
      "address.home": "♡ shughost | маленькие миры ♡",
      "address.games": "shughost.dev / игры",
      "address.gallery": "shughost.dev / галерея",
      "address.streamers": "shughost.dev / наши стримеры",
      "address.links": "shughost.dev / ссылки",
      "title.home": "ShuGhost | Инди-игры",
      "title.games": "Игры | ShuGhost",
      "title.gallery": "Галерея | ShuGhost",
      "title.streamers": "Наши стримеры | ShuGhost",
      "title.links": "Ссылки | ShuGhost",
      "home.kicker": "♡ shughost | инди-разработчик ♡",
      "home.title": "обо мне",
      "home.p1": "ShuGhost это соло-разработчик необычных игр для ПК с яркими персонажами, живыми системами и каплей хаоса.",
      "home.p2": "Мои игры могут жить на рабочем столе, реагировать на стрим или погружать в тихую историю, сосредоточенную на персонажах.",
      "home.mood": "сейчас: оживляю маленькие миры ✦",
      "home.cta": "↗ посмотреть игры",
      "home.projects": "(˶ᵔ ᵕ ᵔ˶) проекты",
      "home.desktop": "desktop gremlins",
      "home.violet": "dr. violet",
      "home.screenshots": "скриншоты",
      "home.contact": "связаться со мной",
      "home.email": "♡ рабочая почта:",
      "games.eyebrow": "мои маленькие миры",
      "games.title": "игры",
      "games.available": "доступны в Steam",
      "games.gremlinsLabel": "настольный компаньон | интеграция с Twitch",
      "games.gremlinsDescription": "Ухаживайте за озорным компаньоном на рабочем столе, открывайте новые формы, подключайте OBS и позволяйте зрителям Twitch запускать эффекты за баллы канала.",
      "games.g1": "8 форм персонажа",
      "games.g2": "Интеграция с Twitch и OBS",
      "games.g3": "Поддержка Steam Workshop",
      "games.steam": "открыть в Steam ↗",
      "games.version": "версия 3.0",
      "games.violetLabel": "симулятор персонажа | атмосфера",
      "games.violetDescription": "Проведите странный тихий вечер с доктором Вайолет. Разговаривайте с ней, наблюдайте за реакциями и создавайте настроение личной истории.",
      "games.v1": "Интерактивная героиня",
      "games.v2": "Атмосферные разговоры",
      "games.v3": "Компактная инди-игра",
      "games.pc": "игра для ПК",
      "gallery.eyebrow": "кадры из игр",
      "gallery.title": "галерея",
      "gallery.hint": "нажмите на изображение, чтобы открыть",
      "gallery.desktop": "Desktop Gremlins",
      "gallery.twitch": "Инструменты Twitch",
      "gallery.chaos": "Эффекты хаоса",
      "gallery.workshop": "Мастерская",
      "gallery.violet": "Доктор Вайолет",
      "gallery.controls": "Управление",
      "gallery.interaction": "Взаимодействие",
      "gallery.reactions": "Реакции",
      "streamers.eyebrow": "друзья проекта",
      "streamers.title": "наши стримеры",
      "streamers.hint": "наведите курсор, чтобы увидеть больше фото",
      "streamers.creator": "автор на Twitch",
      "streamers.ours": "наш стример",
      "streamers.open": "открыть канал Twitch ↗",
      "links.eyebrow": "официальные страницы",
      "links.title": "ссылки",
      "links.hint": "контакты | сообщество | поддержка",
      "links.business": "сотрудничество и рабочие вопросы",
      "links.hello": "напишите мне",
      "links.contactNote": "Для обзоров игр, сотрудничества с авторами, отзывов и рабочих вопросов.",
      "links.steamPage": "страница в Steam",
      "links.news": "новости и сообщество",
      "links.community": "сервер сообщества",
      "links.support": "поддержать разработчика",
      "links.privacy": "Политика конфиденциальности",
      "links.privacyNote": "приватность и данные",
      "footer.tagline": "сайт ShuGhost | независимые игры, созданные с заботой",
      "footer.warning": "Это официальные ссылки ShuGhost. Остерегайтесь страниц-копий.",
      "footer.privacy": "Политика конфиденциальности",
      "stats.online": "сейчас онлайн",
      "stats.views": "просмотров",
    },
    en: {
      "common.skip": "Skip to content",
      "nav.home": "home",
      "nav.games": "games",
      "nav.gallery": "gallery",
      "nav.streamers": "streamers",
      "nav.links": "links",
      "browser.back": "Previous tab",
      "browser.forward": "Next tab",
      "browser.refresh": "Refresh page",
      "browser.home": "Open home",
      "language.label": "Language",
      "address.home": "♡ shughost | little worlds ♡",
      "address.games": "shughost.dev / games",
      "address.gallery": "shughost.dev / gallery",
      "address.streamers": "shughost.dev / our streamers",
      "address.links": "shughost.dev / links",
      "title.home": "ShuGhost | Indie Games",
      "title.games": "Games | ShuGhost",
      "title.gallery": "Gallery | ShuGhost",
      "title.streamers": "Our Streamers | ShuGhost",
      "title.links": "Links | ShuGhost",
      "home.kicker": "♡ shughost | indie developer ♡",
      "home.title": "about me",
      "home.p1": "ShuGhost is a solo developer creating unusual PC games with memorable characters, living systems, and a little bit of chaos.",
      "home.p2": "My games can sit on your desktop, react to your stream, or pull you into a quiet character-focused story.",
      "home.mood": "current mood: making tiny worlds feel alive ✦",
      "home.cta": "↗ view my games",
      "home.projects": "(˶ᵔ ᵕ ᵔ˶) projects",
      "home.desktop": "desktop gremlins",
      "home.violet": "dr. violet",
      "home.screenshots": "screenshots",
      "home.contact": "contact me",
      "home.email": "♡ business email:",
      "games.eyebrow": "my little worlds",
      "games.title": "games",
      "games.available": "available on Steam",
      "games.gremlinsLabel": "desktop companion | twitch interactive",
      "games.gremlinsDescription": "Raise a mischievous desktop companion, unlock new forms, connect it to OBS, and let Twitch viewers trigger effects with Channel Points.",
      "games.g1": "8 character forms",
      "games.g2": "Twitch and OBS integration",
      "games.g3": "Steam Workshop support",
      "games.steam": "open on Steam ↗",
      "games.version": "version 3.0",
      "games.violetLabel": "character simulator | atmospheric",
      "games.violetDescription": "Spend a strange, quiet evening with Dr. Violet. Talk with her, watch her reactions, and shape the mood of a personal character-focused experience.",
      "games.v1": "Interactive character companion",
      "games.v2": "Atmospheric conversations",
      "games.v3": "A compact indie experience",
      "games.pc": "PC game",
      "gallery.eyebrow": "from the games",
      "gallery.title": "gallery",
      "gallery.hint": "click an image to open it",
      "gallery.desktop": "Desktop Gremlins",
      "gallery.twitch": "Twitch tools",
      "gallery.chaos": "Chaos effects",
      "gallery.workshop": "Workshop",
      "gallery.violet": "Dr. Violet",
      "gallery.controls": "Controls",
      "gallery.interaction": "Interaction",
      "gallery.reactions": "Reactions",
      "streamers.eyebrow": "friends of the project",
      "streamers.title": "our streamers",
      "streamers.hint": "hover to see a larger photo",
      "streamers.creator": "Twitch creator",
      "streamers.ours": "our streamer",
      "streamers.open": "open Twitch channel ↗",
      "links.eyebrow": "official places",
      "links.title": "links",
      "links.hint": "contact | community | support",
      "links.business": "business and collaboration",
      "links.hello": "say hello",
      "links.contactNote": "For game coverage, creator collaborations, feedback, and business questions.",
      "links.steamPage": "Steam page",
      "links.news": "news and community",
      "links.community": "community server",
      "links.support": "support the developer",
      "links.privacy": "Privacy Policy",
      "links.privacyNote": "privacy and data",
      "footer.tagline": "website by ShuGhost | independent games made with care",
      "footer.warning": "These are the official ShuGhost links. Please be careful with impersonators.",
      "footer.privacy": "Privacy Policy",
      "stats.online": "online now",
      "stats.views": "views",
    },
  };

  const pageElements = new Map(
    [...document.querySelectorAll("[data-page]")].map((element) => [element.dataset.page, element]),
  );
  const tabs = [...document.querySelectorAll(".page-tab[data-page-target]")];
  const languageButtons = [...document.querySelectorAll("[data-language]")];
  const address = document.querySelector("[data-address]");
  const browserCard = document.querySelector(".browser-card");
  const backButton = document.querySelector("[data-browser-back]");
  const forwardButton = document.querySelector("[data-browser-forward]");
  const refreshButton = document.querySelector("[data-browser-refresh]");
  const homeButton = document.querySelector("[data-browser-home]");
  const siteView = document.querySelector("#site-view");
  const visitorStats = document.querySelector(".visitor-stats");
  const onlineCount = document.querySelector("[data-visitor-online]");
  const totalViewCount = document.querySelector("[data-visitor-total]");

  let currentPage = "home";
  let currentLanguage = "en";
  let visitorId = "";

  const validPage = (value) => (pages.includes(value) ? value : "home");
  const pageFromHash = () => validPage(window.location.hash.slice(1).toLowerCase());
  const translate = (key) => translations[currentLanguage]?.[key] || translations.en[key] || key;

  function getVisitorId() {
    if (visitorId) return visitorId;

    const storageKey = "shughost-visitor-session-v1";
    try {
      visitorId = window.sessionStorage.getItem(storageKey) || "";
    } catch {
      visitorId = "";
    }
    if (visitorId) return visitorId;

    visitorId = globalThis.crypto?.randomUUID
      ? globalThis.crypto.randomUUID()
      : `${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 18)}`;
    try {
      window.sessionStorage.setItem(storageKey, visitorId);
    } catch {
      // Keep the generated ID in memory when session storage is unavailable.
    }
    return visitorId;
  }

  function formatVisitorNumber(value) {
    const locale = currentLanguage === "uk" ? "uk-UA" : currentLanguage === "ru" ? "ru-RU" : "en-US";
    return new Intl.NumberFormat(locale).format(value);
  }

  async function updateVisitorStats(pageView = false) {
    if (!onlineCount || !totalViewCount) return;

    try {
      const response = await fetch("/api/visitor-heartbeat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ visitorId: getVisitorId(), pageView }),
        cache: "no-store",
      });
      if (!response.ok) throw new Error(`Visitor stats request failed: ${response.status}`);

      const stats = await response.json();
      const online = Number.isSafeInteger(stats.online) && stats.online >= 0 ? stats.online : 0;
      const views = Number.isSafeInteger(stats.views) && stats.views >= 0 ? stats.views : 0;
      onlineCount.textContent = formatVisitorNumber(online);
      totalViewCount.textContent = formatVisitorNumber(views);
      visitorStats?.classList.remove("unavailable");
    } catch {
      onlineCount.textContent = "?";
      totalViewCount.textContent = "?";
      visitorStats?.classList.add("unavailable");
    }
  }

  function detectLanguage() {
    let storedLanguage = "";
    try {
      storedLanguage = window.localStorage.getItem("shughost-language") || "";
    } catch {
      storedLanguage = "";
    }
    if (supportedLanguages.includes(storedLanguage)) return storedLanguage;

    const browserLanguage = (navigator.language || "en").toLowerCase();
    if (browserLanguage.startsWith("uk")) return "uk";
    if (browserLanguage.startsWith("ru")) return "ru";
    return "en";
  }

  function renderPage(page) {
    const nextPage = validPage(page);

    pageElements.forEach((element, name) => {
      const isActive = name === nextPage;
      element.hidden = !isActive;
      element.classList.toggle("active", isActive);
    });

    tabs.forEach((tab) => {
      const isActive = tab.dataset.pageTarget === nextPage;
      tab.classList.toggle("active", isActive);
      tab.setAttribute("aria-selected", String(isActive));
      tab.tabIndex = isActive ? 0 : -1;
    });

    currentPage = nextPage;
    address.textContent = translate(addressKeys[nextPage]);
    document.title = translate(titleKeys[nextPage]);

    const nextHash = `#${nextPage}`;
    if (window.location.hash !== nextHash) {
      window.history.replaceState(null, "", nextHash);
    }

    siteView.scrollTop = 0;
  }

  function applyLanguage(language, persist = true) {
    currentLanguage = supportedLanguages.includes(language) ? language : "en";
    document.documentElement.lang = currentLanguage;

    document.querySelectorAll("[data-i18n]").forEach((element) => {
      element.textContent = translate(element.dataset.i18n);
    });
    document.querySelectorAll("[data-i18n-aria]").forEach((element) => {
      element.setAttribute("aria-label", translate(element.dataset.i18nAria));
    });

    languageButtons.forEach((button) => {
      const isActive = button.dataset.language === currentLanguage;
      button.classList.toggle("active", isActive);
      button.setAttribute("aria-pressed", String(isActive));
    });

    if (persist) {
      try {
        window.localStorage.setItem("shughost-language", currentLanguage);
      } catch {
        // The switch still works when browser storage is unavailable.
      }
    }

    renderPage(currentPage);
  }

  document.querySelectorAll("[data-page-target]").forEach((control) => {
    control.addEventListener("click", () => renderPage(control.dataset.pageTarget));
  });

  languageButtons.forEach((button) => {
    button.addEventListener("click", () => applyLanguage(button.dataset.language));
  });

  tabs.forEach((tab, index) => {
    tab.addEventListener("keydown", (event) => {
      let targetIndex = index;
      if (event.key === "ArrowRight") targetIndex = (index + 1) % tabs.length;
      if (event.key === "ArrowLeft") targetIndex = (index - 1 + tabs.length) % tabs.length;
      if (event.key === "Home") targetIndex = 0;
      if (event.key === "End") targetIndex = tabs.length - 1;
      if (targetIndex === index) return;

      event.preventDefault();
      tabs[targetIndex].focus();
      renderPage(tabs[targetIndex].dataset.pageTarget);
    });
  });

  backButton.addEventListener("click", () => {
    const currentIndex = pages.indexOf(currentPage);
    const previousIndex = (currentIndex - 1 + pages.length) % pages.length;
    renderPage(pages[previousIndex]);
  });

  forwardButton.addEventListener("click", () => {
    const currentIndex = pages.indexOf(currentPage);
    const nextIndex = (currentIndex + 1) % pages.length;
    renderPage(pages[nextIndex]);
  });

  homeButton.addEventListener("click", () => renderPage("home"));

  refreshButton.addEventListener("click", () => {
    browserCard.classList.remove("refreshing");
    void browserCard.offsetWidth;
    browserCard.classList.add("refreshing");
    window.setTimeout(() => browserCard.classList.remove("refreshing"), 380);
  });

  const imageDialog = document.querySelector("[data-image-dialog]");
  const imagePreview = document.querySelector("[data-image-preview]");
  const closeImageButton = document.querySelector("[data-image-close]");

  document.querySelectorAll("[data-image]").forEach((button) => {
    button.addEventListener("click", () => {
      const sourceImage = button.querySelector("img");
      imagePreview.src = button.dataset.image;
      imagePreview.alt = sourceImage?.alt || "Game screenshot";
      imageDialog.showModal();
    });
  });

  closeImageButton.addEventListener("click", () => imageDialog.close());
  imageDialog.addEventListener("click", (event) => {
    if (event.target === imageDialog) imageDialog.close();
  });
  imageDialog.addEventListener("close", () => {
    imagePreview.removeAttribute("src");
    imagePreview.alt = "";
  });

  const year = document.querySelector("[data-year]");
  year.textContent = new Date().getFullYear();

  currentPage = pageFromHash();
  applyLanguage(detectLanguage(), false);
  void updateVisitorStats(true);
  window.setInterval(() => void updateVisitorStats(false), 20_000);

  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") void updateVisitorStats(false);
  });

  window.addEventListener("hashchange", () => {
    const hashPage = pageFromHash();
    if (hashPage !== currentPage) renderPage(hashPage);
  });
})();
