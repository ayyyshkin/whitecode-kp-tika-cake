/*
 * One proposal = this file. Studio data (manager, cases, logos, facts) lives in studio.js.
 * Tokens in titles: {weeks} → total weeks, {price} → total price. [words] in final.title get the brand marker.
 * project.tags decide which WhiteCode cases are shown at the end, most important first.
 */
window.KP = {
  client: { name: 'Tika Cake', slug: 'tika-cake', accent: '#6B2F5C', accentDark: '#D9A3C8' },
  project: {
    kind: 'интернет-магазин и учёт',
    tags: ['food', 'ecommerce', 'catalog', 'orders', 'erp', 'automation'],
  },

  issued: '2026-11-23',
  validUntil: '2026-12-07',

  demo: { src: 'demo/index.html', domain: 'tika-cake.demo' },

  hero: {
    title: 'Tika Cake принимает заказы без переписки',
    lead: 'Торт выбирают и оплачивают на сайте. Заказ сразу уходит в iiko и на кухню.',
    cta: 'Попробовать магазин',
  },

  sections: {
    demo: {
      nav: 'Демо',
      title: 'Закажите торт в демо',
      note: 'Оплата и SMS в демо тестовые.',
      scenarios: [
        { title: 'Выбрать торт', route: '/product/strawberry-cloud' },
        { title: 'Оформить доставку', route: '/cart?seed=1' },
        { title: 'Найти заказ у команды', route: '/admin/orders' },
        { title: 'Повторить заказ', route: '/account' },
        { title: 'Цифры дня', route: '/admin' },
      ],
    },

    scope: {
      nav: 'Состав',
      title: 'Что войдёт',
      modules: [
        { title: 'Каталог на 2 языках', route: '/catalog', text: 'Фото, состав, наличие на точке.' },
        { title: 'Заказ без переписки', route: '/product/chocolate-evening', text: 'Свечи и надпись прямо в карточке.' },
        { title: 'Доставка', route: '/cart?seed=1', text: '4 зоны, свободные интервалы, самовывоз.' },
        { title: 'Бонусы', route: '/account', text: 'До 5% бонусами, повтор в один клик.' },
        { title: 'Производство', route: '/admin/production', text: 'Оплаченный заказ резервирует сырьё.' },
        { title: 'Аналитика', route: '/admin', text: 'Выручка по точкам и средний чек.' },
      ],
      integrations: ['iiko', 'Kaspi или Forte', 'Курьерика', 'SMS'],
    },

    stages: {
      nav: 'Этапы',
      title: '{weeks} до запуска',
      items: [
        { name: 'Разбор', weeks: 2, pay: 30, payWhen: 'при старте' },
        { name: 'Дизайн', weeks: 3 },
        { name: 'Разработка', weeks: 6, pay: 40, payWhen: 'после теста' },
        { name: 'Запуск', weeks: 3, pay: 30, payWhen: 'после запуска' },
      ],
    },

    pricing: {
      nav: 'Стоимость',
      title: 'Стоимость',
      total: 2500000,
      includes: ['Дизайн, разработка, подключения, запуск', 'Код и доступы остаются у вас'],
      extras: 'тарифы iiko, Kaspi или Forte, SMS и хостинга',
    },

    open: {
      nav: 'До старта',
      title: 'Уточним на старте',
      items: ['API iiko: остатки и бонусы', 'Оплата: Kaspi или Forte', 'Код входа: SMS или WhatsApp'],
    },

    faq: {
      nav: 'Вопросы',
      title: 'Вопросы',
      items: [
        { q: 'Что если сломается?', a: '60 дней поддерживаем проект, на код 6 месяцев гарантии.' },
        { q: 'Что нужно от вас?', a: 'Фото тортов, точки, зоны доставки и доступ к iiko.' },
      ],
    },
  },

  final: {
    title: 'Обсудим запуск за [30 минут]',
    text: 'Откроется WhatsApp с готовым сообщением Марселю.',
  },
};
