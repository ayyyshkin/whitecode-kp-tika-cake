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
    lead: 'Покупатель сам выбирает торт, точку и время и платит через Kaspi или Forte. Заказ сразу уходит в iiko и на производство.',
    cta: 'Попробовать магазин',
  },

  sections: {
    demo: {
      nav: 'Демо',
      title: 'Закажите торт в демо',
      lead: 'Заказ, который вы оформите, появится у команды в разделе «Заказы».',
      note: 'Оплата, SMS и обмен с iiko в демо тестовые.',
      scenarios: [
        { title: 'Выбрать торт', text: 'Размер, свечи, надпись, наличие на точке', route: '/product/strawberry-cloud', time: '30 сек' },
        { title: 'Оформить доставку', text: 'Зона, интервал, промокод WELCOME10, бонусы', route: '/cart?seed=1', time: '40 сек' },
        { title: 'Найти свой заказ у команды', text: 'Он первый в списке, статус меняется одной кнопкой', route: '/admin/orders', time: '30 сек' },
        { title: 'Повторить заказ', text: 'Кабинет, бонусы, история', route: '/account', time: '20 сек' },
        { title: 'Цифры дня', text: 'Выручка, средний чек, сырьё ниже минимума', route: '/admin', time: '30 сек' },
      ],
    },

    scope: {
      nav: 'Состав',
      title: 'Что войдёт в проект',
      modules: [
        { title: 'Каталог на русском и казахском', route: '/catalog',
          text: 'Фото, состав, КБЖУ, размеры и наличие на выбранной точке.' },
        { title: 'Заказ без переписки', route: '/product/chocolate-evening',
          text: 'Свечи, открытка и надпись в карточке торта. Итог с доставкой виден до оплаты.' },
        { title: 'Доставка по 4 зонам и самовывоз', route: '/cart?seed=1',
          text: 'Свободные интервалы и лимит заказов на каждый интервал.' },
        { title: 'Бонусы и повтор заказа', route: '/account',
          text: 'До 5% бонусами, повтор прошлого заказа одной кнопкой, скидка в день рождения.' },
        { title: 'Производство и склад', route: '/admin/production',
          text: 'Оплаченный заказ резервирует сырьё и попадает в план партий.' },
        { title: 'Деньги и аналитика', route: '/admin',
          text: 'Kaspi, Forte и возвраты, выручка по точкам, средний чек.' },
      ],
      integrations: [
        { name: 'iiko', what: 'каталог, цены, остатки, бонусы' },
        { name: 'Kaspi или Forte', what: 'оплата и возвраты' },
        { name: 'Курьерика', what: 'передача заказа и статусы' },
        { name: 'SMS или WhatsApp', what: 'код входа и уведомления' },
      ],
    },

    stages: {
      nav: 'Этапы',
      title: '{weeks} до запуска',
      items: [
        { name: 'Разбор процессов', weeks: 2, result: 'Сценарии и план интеграций', fromClient: 'Ассортимент, точки, доступ к iiko', pay: 30, payWhen: 'при старте' },
        { name: 'Дизайн', weeks: 3, result: 'Готовые экраны для телефона и ноутбука', fromClient: 'Фото и тексты на двух языках' },
        { name: 'Разработка и подключения', weeks: 6, result: 'Заказ проходит от сайта до кухни на тестовом сервере', fromClient: 'Аккаунты Kaspi или Forte, курьерки и SMS', pay: 40, payWhen: 'после теста' },
        { name: 'Проверка и запуск', weeks: 3, result: 'Рабочий сайт, исходный код и инструкции', fromClient: 'Приёмка', pay: 30, payWhen: 'после запуска' },
      ],
    },

    pricing: {
      nav: 'Стоимость',
      title: 'Стоимость',
      total: 2500000,
      includesTitle: 'Ещё в цене',
      includes: [
        'Проектирование и дизайн',
        'Серверная часть и подключения',
        'Тестирование и запуск',
        'Исходный код и все доступы остаются у вас',
      ],
      outOfScope: 'Мобильное приложение и автоматические рассылки. Это следующий этап.',
      extras: ['лицензия iiko', 'комиссия Kaspi или Forte', 'SMS', 'хостинг'],
      extrasNote: 'Оплачиваются напрямую сервисам по их тарифам.',
    },

    open: {
      nav: 'До старта',
      title: 'Что уточним до старта',
      items: [
        { what: 'Методы API iiko: остатки, резервы, бонусы', who: 'WhiteCode', when: '1-я неделя' },
        { what: 'Схема оплаты Kaspi или Forte и возвраты', who: 'WhiteCode и Tika Cake', when: '1-я неделя' },
        { what: 'Канал кода входа: SMS или WhatsApp', who: 'Tika Cake', when: '2-я неделя' },
        { what: 'API Курьерики: передача заказа и статусы', who: 'WhiteCode', when: '2-я неделя' },
      ],
    },

    faq: {
      nav: 'Вопросы',
      title: 'Вопросы',
      items: [
        { q: 'Что если после запуска что-то сломается?', a: '60 дней после запуска мы поддерживаем проект. На код даём гарантию 6 месяцев.' },
        { q: 'Что нужно от Tika Cake?', a: 'Ассортимент с фото, список точек, зоны доставки, правила скидок и доступ к iiko.' },
        { q: 'Что можно добавить потом?', a: 'Мобильное приложение, рассылки и рекомендации. Они встанут на ту же серверную часть.' },
      ],
    },
  },

  final: {
    title: 'Обсудим запуск за [30 минут]',
    text: 'Нажмите «Оставить заявку»: откроется WhatsApp с готовым сообщением для Марселя.',
    steps: ['Вы отправляете заявку', 'Созваниваемся на 30 минут и проходим демо', 'Фиксируем состав, сроки и оплату в договоре'],
  },
};
