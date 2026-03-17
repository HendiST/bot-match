/**
 * Bot Match Configuration
 * Ultimate Telegram Dating Bot
 */

module.exports = {
  // Bot Token - Ganti dengan token bot Anda
  BOT_TOKEN: process.env.BOT_TOKEN || 'YOUR_BOT_TOKEN_HERE',
  
  // Database
  DATABASE: {
    type: 'sqlite',
    path: './data/botmatch.db'
  },
  
  // Roles & Pricing
  ROLES: {
    FREE: 'free',
    VIP: 'vip',
    ELITE: 'elite'
  },
  
  // VIP Duration (days)
  VIP_DURATION: 30,
  
  // Elite Duration (days)
  ELITE_DURATION: 30,
  
  // Boost Duration (minutes)
  BOOST_DURATION: 30,
  
  // Limits for Free Users
  FREE_LIMITS: {
    dailyLikes: 20,
    dailyMessages: 10,
    cooldownSeconds: 30
  },
  
  // Limits for VIP Users
  VIP_LIMITS: {
    dailyLikes: -1, // Unlimited
    dailyMessages: -1, // Unlimited
    cooldownSeconds: 5
  },
  
  // Elite Users (no limits)
  ELITE_LIMITS: {
    dailyLikes: -1,
    dailyMessages: -1,
    cooldownSeconds: 0
  },
  
  // Age Range
  AGE_RANGE: {
    min: 18,
    max: 60
  },
  
  // Gender Options
  GENDERS: ['Pria', 'Wanita'],
  
  // Preferences
  PREFERENCES: ['Pria', 'Wanita', 'Semua'],
  
  // Cities in Indonesia
  CITIES: [
    'Jakarta', 'Surabaya', 'Bandung', 'Medan', 'Semarang',
    'Makassar', 'Palembang', 'Tangerang', 'Depok', 'Bekasi',
    'Bogor', 'Malang', 'Yogyakarta', 'Solo', 'Denpasar',
    'Balikpapan', 'Pekanbaru', 'Padang', 'Banjarmasin', 'Manado'
  ],
  
  // Fake User Settings
  FAKE_USER: {
    minCount: 50,
    maxCount: 200,
    autoLikeChance: 0.3, // 30% chance to like back
    autoLikeDelayMin: 5000, // 5 seconds
    autoLikeDelayMax: 30000, // 30 seconds
    autoMessageChance: 0.2, // 20% chance to send message
    autoMessageDelayMin: 10000,
    autoMessageDelayMax: 60000
  },
  
  // Random Messages for Fake Users
  FAKE_MESSAGES: [
    'Hai 😊',
    'Kamu menarik!',
    'Hi, salam kenal ya!',
    'Wah profil kamu keren!',
    'Senang bisa kenal kamu 😊',
    'Aku suka foto profilmu!',
    'Hai, bagaimana kabarmu?',
    'Kamu terlihat asyik!',
    'Hi! Aku tertarik sama kamu',
    'Salam kenal! 😊',
    'Kamu cantik/tampan sekali!',
    'Aku ingin kenal kamu lebih dekat',
    'Foto kamu bagus banget!',
    'Hai, kita bisa kenalan?',
    'Aku suka vibe dari profilmu!'
  ],
  
  // Display Priority
  PRIORITY: {
    ELITE: 1,
    VIP_BOOST: 2,
    VIP: 3,
    FAKE: 4,
    FREE: 5
  }
};
