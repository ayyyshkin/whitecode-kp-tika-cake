/*
 * WhiteCode studio data, shared by every proposal.
 * Per-client content lives in kp-data.js; this file changes only when the studio changes.
 *
 * Cases are picked automatically: each proposal lists its own `tags` (kp-data.js → project.tags),
 * the cases with the most shared tags are shown at the end of the page.
 * Sources: whitecode.kz texts used in the Instagram highlights (материалы/instagram-хайлайты/src/stories.mjs)
 * and the facts quoted in СТАТУС-ПРОЕКТА-26-10.md.
 */
window.STUDIO = {
  name: 'WhiteCode',
  site: 'https://whitecode.kz',
  siteLabel: 'whitecode.kz',
  address: 'Алматы, Сатпаева 4а, 5 этаж',

  manager: {
    name: 'Марсель',
    nameDat: 'Марселю', // «напишите Марселю»
    role: 'Ваш контакт в WhiteCode',
    whatsapp: '77003002132',
    whatsappLabel: '+7 700 300 21 32',
    telegram: 'https://t.me/whitecode_kz',
    telegramLabel: 't.me/whitecode_kz',
  },

  // Claims published on whitecode.kz
  facts: [
    { value: '8 лет', label: 'делаем сайты, сервисы и интеграции' },
    { value: '6 месяцев', label: 'гарантия на код после запуска' },
    { value: '60 дней', label: 'поддержка после запуска' },
  ],

  // Human labels for tags, used in "общее с вашим проектом"
  tagLabels: {
    ecommerce: 'онлайн-продажи',
    marketplace: 'маркетплейс',
    catalog: 'каталог товаров',
    orders: 'приём заказов',
    food: 'продукты питания',
    b2b: 'B2B-продажи',
    automation: 'автоматизация процессов',
    erp: 'учёт и операции',
    integration: 'интеграции',
    bank: 'банк',
    fintech: 'финансы',
    security: 'защита данных',
    telecom: 'телеком',
    education: 'образование',
    content: 'контент-платформа',
    uxui: 'UX/UI-дизайн',
    corporate: 'корпоративная платформа',
  },

  cases: [
    {
      id: 'hiba', name: 'Hiba', logo: 'hiba', cover: 'hiba-cover.webp', tint: '#4aa8f0',
      title: 'Маркетплейс халяльной продукции',
      text: 'UX/UI-дизайн и платформа, которая связывает производителей, поставщиков и покупателей. Каталог товаров и оформление заказов.',
      tags: ['marketplace', 'ecommerce', 'catalog', 'orders', 'food', 'uxui'],
    },
    {
      id: 'umarket', name: 'U-Market', logo: null, cover: 'u-market-cover-v1.webp', tint: '#f26a1b',
      title: 'B2B-платформа для строительной отрасли',
      text: 'Ассортимент, заказы и работа с корпоративными клиентами в одной системе. Ключевые процессы продаж автоматизированы.',
      tags: ['marketplace', 'b2b', 'ecommerce', 'catalog', 'orders', 'automation', 'erp'],
    },
    {
      id: 'telekom', name: 'Telekom Srbija', logo: 'telekom', cover: 'telekom-srbija-mockup.webp', tint: '#2a3b8f',
      title: 'Автоматизация телеком-инфраструктуры',
      text: 'Платформа для обработки заказов и управления жизненным циклом услуг. Новые сервисы выходят на рынок быстрее.',
      tags: ['telecom', 'automation', 'orders', 'erp', 'integration', 'enterprise'],
    },
    {
      id: 'raiffeisen', name: 'Raiffeisen Bank', logo: 'raiffeisen', cover: 'raiffeisen-cover-v1.webp', tint: '#f5d90a',
      title: 'Интеграционная платформа для банковских сервисов',
      text: 'IBM DataPower для безопасного доступа к внутренним системам банка, балансировки нагрузки и защиты данных.',
      tags: ['bank', 'fintech', 'integration', 'security', 'enterprise'],
    },
    {
      id: 'otp', name: 'OTP Bank', logo: 'otp', cover: 'otp-bank-mockup.webp', tint: '#4e9e3d',
      title: 'Автоматизация внутренних процессов банка',
      text: 'Решение на IBM Cloud Pak связало внутренние системы и навело порядок в документообороте.',
      tags: ['bank', 'fintech', 'automation', 'erp', 'integration', 'enterprise'],
    },
    {
      id: 'sber', name: 'Sberbank', logo: 'sber', cover: 'sberbank-mockup.webp', tint: '#21a038',
      title: 'Модернизация цифровых банковских сервисов',
      text: 'Обновили инфраструктуру и электронные сервисы банка: цифровые каналы стали стабильнее.',
      tags: ['bank', 'fintech', 'integration', 'enterprise'],
    },
    {
      id: 'inteca', name: 'Inteca', logo: 'inteca', cover: 'inteca-mockup.webp', tint: '#c0272d',
      title: 'Корпоративная платформа в сфере образования',
      text: 'Спроектировали и разработали платформу, через которую идут внутренние процессы и работа сотрудников.',
      tags: ['education', 'corporate', 'automation', 'uxui'],
    },
    {
      id: 'art', name: 'ART.KZ', logo: 'artkz', cover: 'art-kz-cover-v1.webp', tint: '#1e4a63',
      title: 'Платформа для цифрового искусства',
      text: 'Интерфейс для показа и управления арт-контентом с упором на подачу работ.',
      tags: ['content', 'uxui', 'catalog'],
    },
  ],

  logos: [
    { file: 'raiffeisen.webp', name: 'Raiffeisen Bank' },
    { file: 'sber.webp', name: 'Sberbank' },
    { file: 'otp.webp', name: 'OTP Bank' },
    { file: 'telekom.webp', name: 'Telekom Srbija' },
    { file: 'hiba.webp', name: 'Hiba' },
    { file: 'inteca.webp', name: 'Inteca' },
    { file: 'artkz.webp', name: 'ART.KZ' },
  ],
};
