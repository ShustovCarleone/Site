(() => {
  const supportedLanguages = ["uk", "ru", "en"];
  const translations = {
    uk: {
      "language.label": "Вибір мови",
      back: "← Повернутися на сайт",
      kicker: "♡ офіційна інформація ♡",
      title: "Політика конфіденційності",
      updated: "Оновлено 3 вересня 2026 року",
      overviewTitle: "Загальна інформація",
      overviewText: "ShuGhost поважає вашу приватність. На цій сторінці пояснено, що зберігає сайт і що відбувається під час переходу до зовнішніх сервісів.",
      storageTitle: "Інформація на вашому пристрої",
      storageText: "Сайт зберігає в локальному сховищі браузера лише вибрану мову. Це налаштування залишається на вашому пристрої та не надсилається ShuGhost.",
      collectionTitle: "Особисті дані",
      collectionText: "Цей сайт не створює облікових записів, не обробляє платежі, не збирає форми та не зберігає особисті профілі.",
      externalTitle: "Зовнішні сервіси",
      externalText: "Посилання на Steam, Twitch, Telegram, Discord, Ko-fi, DonationAlerts і поштові сервіси відкривають сторонні сайти. Після переходу діють їхні власні політики конфіденційності.",
      contactTitle: "Контакти",
      contactText: "Із запитаннями про конфіденційність пишіть на",
    },
    ru: {
      "language.label": "Выбор языка",
      back: "← Вернуться на сайт",
      kicker: "♡ официальная информация ♡",
      title: "Политика конфиденциальности",
      updated: "Обновлено 3 сентября 2026 года",
      overviewTitle: "Общая информация",
      overviewText: "ShuGhost уважает вашу конфиденциальность. На этой странице объясняется, что хранит сайт и что происходит при переходе к внешним сервисам.",
      storageTitle: "Информация на вашем устройстве",
      storageText: "Сайт хранит в локальном хранилище браузера только выбранный язык. Эта настройка остается на вашем устройстве и не отправляется ShuGhost.",
      collectionTitle: "Личные данные",
      collectionText: "Этот сайт не создает учетные записи, не обрабатывает платежи, не собирает формы и не хранит личные профили.",
      externalTitle: "Внешние сервисы",
      externalText: "Ссылки на Steam, Twitch, Telegram, Discord, Ko-fi, DonationAlerts и почтовые сервисы открывают сторонние сайты. После перехода действуют их собственные политики конфиденциальности.",
      contactTitle: "Контакты",
      contactText: "По вопросам конфиденциальности пишите на",
    },
    en: {
      "language.label": "Language",
      back: "← Back to website",
      kicker: "♡ official information ♡",
      title: "Privacy Policy",
      updated: "Last updated: September 3, 2026",
      overviewTitle: "Overview",
      overviewText: "ShuGhost respects your privacy. This page explains what the website stores and what happens when you open external services.",
      storageTitle: "Information stored on your device",
      storageText: "The website stores only your selected language in local browser storage. This setting remains on your device and is not sent to ShuGhost.",
      collectionTitle: "Personal data",
      collectionText: "This website does not create user accounts, process payments, collect form submissions, or store personal profiles.",
      externalTitle: "External services",
      externalText: "Links to Steam, Twitch, Telegram, Discord, Ko-fi, DonationAlerts, and email services open third-party websites. Their own privacy policies apply after you leave this website.",
      contactTitle: "Contact",
      contactText: "For privacy questions, contact",
    },
  };

  const buttons = [...document.querySelectorAll("[data-privacy-language]")];

  function detectLanguage() {
    let stored = "";
    try {
      stored = window.localStorage.getItem("shughost-language") || "";
    } catch {
      stored = "";
    }
    if (supportedLanguages.includes(stored)) return stored;
    const browserLanguage = (navigator.language || "en").toLowerCase();
    if (browserLanguage.startsWith("uk")) return "uk";
    if (browserLanguage.startsWith("ru")) return "ru";
    return "en";
  }

  function applyLanguage(language) {
    const nextLanguage = supportedLanguages.includes(language) ? language : "en";
    const dictionary = translations[nextLanguage];
    document.documentElement.lang = nextLanguage;
    document.querySelectorAll("[data-privacy-i18n]").forEach((element) => {
      element.textContent = dictionary[element.dataset.privacyI18n];
    });
    document.querySelectorAll("[data-privacy-aria]").forEach((element) => {
      element.setAttribute("aria-label", dictionary[element.dataset.privacyAria]);
    });
    buttons.forEach((button) => {
      const active = button.dataset.privacyLanguage === nextLanguage;
      button.classList.toggle("active", active);
      button.setAttribute("aria-pressed", String(active));
    });
    document.title = `${dictionary.title} | ShuGhost`;
    try {
      window.localStorage.setItem("shughost-language", nextLanguage);
    } catch {
      // Language switching still works without browser storage.
    }
  }

  buttons.forEach((button) => {
    button.addEventListener("click", () => applyLanguage(button.dataset.privacyLanguage));
  });

  document.querySelector("[data-year]").textContent = new Date().getFullYear();
  applyLanguage(detectLanguage());
})();
