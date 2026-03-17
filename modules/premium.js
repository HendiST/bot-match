/**
 * VIP & Elite Module
 * Handles premium features and subscriptions
 */

const db = require('./database');
const keyboard = require('./keyboard');
const config = require('../config');
const registration = require('./registration');

/**
 * Show VIP menu
 */
function showVipMenu(bot, chatId, telegramId) {
  const user = registration.getUser(telegramId);
  
  if (!user) {
    bot.sendMessage(chatId, '❌ Kamu belum terdaftar.');
    return;
  }
  
  const isVip = user.role === 'vip' && user.vip_expired && new Date(user.vip_expired) > new Date();
  const hasBoost = user.boost_until && new Date(user.boost_until) > new Date();
  
  if (isVip) {
    const expiryDate = new Date(user.vip_expired).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
    
    let message = `⭐ *Status VIP Aktif*\n\n`;
    message += `📅 Berlaku hingga: ${expiryDate}\n\n`;
    message += `*Keuntungan yang kamu dapatkan:*\n`;
    message += `✅ Unlimited like\n`;
    message += `✅ Unlimited pesan\n`;
    message += `✅ Prioritas tampil\n`;
    message += `✅ Fitur Boost\n`;
    
    if (hasBoost) {
      const boostExpiry = new Date(user.boost_until).toLocaleString('id-ID', {
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit'
      });
      message += `\n🚀 *Boost aktif hingga: ${boostExpiry}*`;
    }
    
    bot.sendMessage(chatId, message, {
      parse_mode: 'Markdown',
      reply_markup: keyboard.vipMenu(true, hasBoost)
    });
  } else {
    showVipInfo(bot, chatId);
  }
}

/**
 * Show VIP info
 */
function showVipInfo(bot, chatId) {
  let message = `⭐ *VIP Membership*\n\n`;
  message += `*Keuntungan VIP:*\n\n`;
  message += `✅ *Unlimited Like*\n`;
  message += `Like sebanyak yang kamu mau tanpa batas harian!\n\n`;
  message += `✅ *Unlimited Pesan*\n`;
  message += `Kirim pesan tanpa batas ke match kamu!\n\n`;
  message += `✅ *Prioritas Tampil*\n`;
  message += `Profil kamu muncul lebih awal di pencarian!\n\n`;
  message += `✅ *Fitur Boost*\n`;
  message += `Tingkatkan visibilitas profil hingga 30 menit!\n\n`;
  message += `💎 *Harga: Rp 50.000/bulan*`;
  
  bot.sendMessage(chatId, message, {
    parse_mode: 'Markdown',
    reply_markup: keyboard.vipMenu(false)
  });
}

/**
 * Show Elite menu
 */
function showEliteMenu(bot, chatId, telegramId) {
  const user = registration.getUser(telegramId);
  
  if (!user) {
    bot.sendMessage(chatId, '❌ Kamu belum terdaftar.');
    return;
  }
  
  const isElite = user.role === 'elite' && user.elite_expired && new Date(user.elite_expired) > new Date();
  
  if (isElite) {
    const expiryDate = new Date(user.elite_expired).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
    
    let message = `👑 *Status ELITE Aktif*\n\n`;
    message += `📅 Berlaku hingga: ${expiryDate}\n\n`;
    message += `*Keuntungan ELITE:*\n`;
    message += `👑 Semua fitur VIP\n`;
    message += `👑 Chat tanpa perlu match\n`;
    message += `👑 Lihat ID Telegram user\n`;
    message += `👑 Prioritas tertinggi\n`;
    message += `👑 Badge ELITE eksklusif`;
    
    bot.sendMessage(chatId, message, {
      parse_mode: 'Markdown',
      reply_markup: keyboard.eliteMenu(true)
    });
  } else {
    showEliteInfo(bot, chatId);
  }
}

/**
 * Show Elite info
 */
function showEliteInfo(bot, chatId) {
  let message = `👑 *ELITE Membership*\n\n`;
  message += `*Level tertinggi di Bot Match!*\n\n`;
  message += `*Keuntungan ELITE:*\n\n`;
  message += `👑 *Semua Fitur VIP*\n`;
  message += `Unlimited like, pesan, dan boost!\n\n`;
  message += `👑 *Chat Tanpa Match*\n`;
  message += `Langsung chat siapa saja tanpa perlu match!\n\n`;
  message += `👑 *Lihat ID Telegram*\n`;
  message += `Bisa lihat dan contact langsung via Telegram!\n\n`;
  message += `👑 *Prioritas Tertinggi*\n`;
  message += `Profil kamu selalu di atas!\n\n`;
  message += `👑 *Badge Eksklusif*\n`;
  message += `Tampil beda dengan badge ELITE!\n\n`;
  message += `💎 *Harga: Rp 150.000/bulan*`;
  
  bot.sendMessage(chatId, message, {
    parse_mode: 'Markdown',
    reply_markup: keyboard.eliteMenu(false)
  });
}

/**
 * Activate VIP (simulated payment)
 */
function activateVip(bot, chatId, telegramId) {
  const user = registration.getUser(telegramId);
  
  if (!user) {
    bot.sendMessage(chatId, '❌ Kamu belum terdaftar.');
    return;
  }
  
  // Simulate payment process
  bot.sendMessage(
    chatId,
    '💳 *Pembayaran VIP*\n\n' +
    'Untuk mengaktifkan VIP, silakan transfer:\n\n' +
    'Bank: BCA\n' +
    'Rekening: 1234567890\n' +
    'Atas Nama: Bot Match\n' +
    'Jumlah: Rp 50.000\n\n' +
    'Setelah transfer, kirim bukti pembayaran ke admin.\n\n' +
    '_Untuk demo, klik tombol di bawah untuk aktivasi otomatis_',
    {
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [
          [{ text: '✅ Demo: Aktivasi VIP', callback_data: 'demo_vip_activate' }],
          [{ text: '⬅️ Kembali', callback_data: 'vip_menu' }]
        ]
      }
    }
  );
}

/**
 * Activate Elite (simulated payment)
 */
function activateElite(bot, chatId, telegramId) {
  const user = registration.getUser(telegramId);
  
  if (!user) {
    bot.sendMessage(chatId, '❌ Kamu belum terdaftar.');
    return;
  }
  
  // Simulate payment process
  bot.sendMessage(
    chatId,
    '💳 *Pembayaran ELITE*\n\n' +
    'Untuk mengaktifkan ELITE, silakan transfer:\n\n' +
    'Bank: BCA\n' +
    'Rekening: 1234567890\n' +
    'Atas Nama: Bot Match\n' +
    'Jumlah: Rp 150.000\n\n' +
    'Setelah transfer, kirim bukti pembayaran ke admin.\n\n' +
    '_Untuk demo, klik tombol di bawah untuk aktivasi otomatis_',
    {
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [
          [{ text: '✅ Demo: Aktivasi ELITE', callback_data: 'demo_elite_activate' }],
          [{ text: '⬅️ Kembali', callback_data: 'elite_menu' }]
        ]
      }
    }
  );
}

/**
 * Demo VIP activation
 */
function demoActivateVip(bot, chatId, telegramId) {
  const user = registration.getUser(telegramId);
  
  if (!user) {
    bot.sendMessage(chatId, '❌ Kamu belum terdaftar.');
    return;
  }
  
  // Calculate expiry date
  const expiryDate = new Date();
  expiryDate.setDate(expiryDate.getDate() + config.VIP_DURATION);
  
  // Update user role
  db.userOps.updateRole('vip', expiryDate.toISOString(), null, user.id);
  
  bot.sendMessage(
    chatId,
    '🎉 *VIP Berhasil Diaktifkan!*\n\n' +
    `Selamat! Status VIP kamu aktif hingga ${expiryDate.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    })}\n\n` +
    'Nikmati semua keuntungan VIP! ⭐',
    {
      parse_mode: 'Markdown',
      reply_markup: keyboard.vipMenu(true)
    }
  );
}

/**
 * Demo Elite activation
 */
function demoActivateElite(bot, chatId, telegramId) {
  const user = registration.getUser(telegramId);
  
  if (!user) {
    bot.sendMessage(chatId, '❌ Kamu belum terdaftar.');
    return;
  }
  
  // Calculate expiry date
  const expiryDate = new Date();
  expiryDate.setDate(expiryDate.getDate() + config.ELITE_DURATION);
  
  // Update user role
  db.userOps.updateRole('elite', null, expiryDate.toISOString(), user.id);
  
  bot.sendMessage(
    chatId,
    '🎉 *ELITE Berhasil Diaktifkan!*\n\n' +
    `Selamat! Status ELITE kamu aktif hingga ${expiryDate.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    })}\n\n` +
    'Nikmati semua keuntungan ELITE! 👑',
    {
      parse_mode: 'Markdown',
      reply_markup: keyboard.eliteMenu(true)
    }
  );
}

/**
 * Activate boost
 */
function activateBoost(bot, chatId, telegramId) {
  const user = registration.getUser(telegramId);
  
  if (!user) {
    bot.sendMessage(chatId, '❌ Kamu belum terdaftar.');
    return;
  }
  
  const isVip = user.role === 'vip' && user.vip_expired && new Date(user.vip_expired) > new Date();
  const isElite = user.role === 'elite' && user.elite_expired && new Date(user.elite_expired) > new Date();
  
  if (!isVip && !isElite) {
    bot.sendMessage(
      chatId,
      '❌ Fitur Boost hanya untuk member VIP dan Elite.\n\nUpgrade sekarang untuk mendapatkan fitur ini!',
      { reply_markup: keyboard.vipMenu() }
    );
    return;
  }
  
  // Check if already boosted
  if (user.boost_until && new Date(user.boost_until) > new Date()) {
    bot.sendMessage(
      chatId,
      `🚀 *Boost Sudah Aktif!*\n\n` +
      `Boost kamu akan berakhir pada ${new Date(user.boost_until).toLocaleString('id-ID')}`,
      { parse_mode: 'Markdown' }
    );
    return;
  }
  
  // Activate boost
  const boostUntil = new Date();
  boostUntil.setMinutes(boostUntil.getMinutes() + config.BOOST_DURATION);
  
  db.userOps.updateBoost(boostUntil.toISOString(), user.id);
  
  bot.sendMessage(
    chatId,
    `🚀 *Boost Diaktifkan!*\n\n` +
    `Profil kamu akan ditampilkan dengan prioritas tinggi selama ${config.BOOST_DURATION} menit!\n\n` +
    `Berakhir pada: ${boostUntil.toLocaleString('id-ID')}`,
    {
      parse_mode: 'Markdown',
      reply_markup: keyboard.vipMenu(true, true)
    }
  );
}

module.exports = {
  showVipMenu,
  showVipInfo,
  showEliteMenu,
  showEliteInfo,
  activateVip,
  activateElite,
  demoActivateVip,
  demoActivateElite,
  activateBoost
};
