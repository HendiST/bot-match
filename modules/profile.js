/**
 * Profile & Settings Module
 * Handles user profile and settings
 */

const db = require('./database');
const state = require('./stateManager');
const keyboard = require('./keyboard');
const config = require('../config');
const registration = require('./registration');
const search = require('./search');

/**
 * Show user profile
 */
async function showProfile(bot, chatId, telegramId, isOwn = true) {
  const user = registration.getUser(telegramId);
  
  if (!user) {
    bot.sendMessage(chatId, '❌ Kamu belum terdaftar. Ketik /start untuk mendaftar.');
    return;
  }
  
  let caption = `👤 *${user.nama}*, ${user.umur} tahun\n`;
  caption += `🏙️ ${user.kota}\n`;
  caption += `❤️ Mencari: ${user.preferensi}\n`;
  caption += `👤 Gender: ${user.gender}\n\n`;
  caption += `📝 *Bio:*\n${user.bio || '_Tidak ada bio_'}`;
  
  // Add role badge
  if (user.role === 'elite') {
    caption += '\n\n👑 *ELITE MEMBER*';
  } else if (user.role === 'vip') {
    caption += '\n\n⭐ *VIP MEMBER*';
  }
  
  // Add stats
  const likesReceived = db.likeOps.countLikesReceived.get(user.id).count;
  caption += `\n\n❤️ ${likesReceived} orang menyukai profil ini`;
  
  try {
    if (user.photo_id) {
      await bot.sendPhoto(chatId, user.photo_id, {
        caption,
        parse_mode: 'Markdown',
        reply_markup: keyboard.profileView(isOwn, user.id)
      });
    } else if (user.photo_url) {
      await bot.sendPhoto(chatId, user.photo_url, {
        caption,
        parse_mode: 'Markdown',
        reply_markup: keyboard.profileView(isOwn, user.id)
      });
    } else {
      await bot.sendMessage(chatId, caption, {
        parse_mode: 'Markdown',
        reply_markup: keyboard.profileView(isOwn, user.id)
      });
    }
  } catch (error) {
    await bot.sendMessage(chatId, caption, {
      parse_mode: 'Markdown',
      reply_markup: keyboard.profileView(isOwn, user.id)
    });
  }
}

/**
 * Show edit profile menu
 */
function showEditProfileMenu(bot, chatId) {
  bot.sendMessage(
    chatId,
    '✏️ *Edit Profil*\n\nPilih yang ingin diedit:',
    {
      parse_mode: 'Markdown',
      reply_markup: keyboard.editProfileMenu()
    }
  );
}

/**
 * Start editing a field
 */
function startEditField(bot, chatId, telegramId, field) {
  const user = registration.getUser(telegramId);
  
  if (!user) {
    bot.sendMessage(chatId, '❌ Kamu belum terdaftar.');
    return;
  }
  
  state.setActionState(telegramId, state.ACTION_STATES.EDITING_PROFILE);
  state.updateTemp(telegramId, { editField: field });
  
  let message = '';
  let replyMarkup = keyboard.backButton('settings_edit_profile');
  
  switch (field) {
    case 'nama':
      message = `📝 Nama saat ini: *${user.nama}*\n\nMasukkan nama baru:`;
      break;
    case 'umur':
      message = `🎂 Umur saat ini: *${user.umur} tahun*\n\nPilih umur baru:`;
      replyMarkup = keyboard.ageSelection();
      break;
    case 'gender':
      message = `👤 Gender saat ini: *${user.gender}*\n\nPilih gender baru:`;
      replyMarkup = keyboard.genderSelection();
      break;
    case 'preferensi':
      message = `❤️ Preferensi saat ini: *${user.preferensi}*\n\nPilih preferensi baru:`;
      replyMarkup = keyboard.preferenceSelection();
      break;
    case 'kota':
      message = `🏙️ Kota saat ini: *${user.kota}*\n\nPilih kota baru:`;
      replyMarkup = keyboard.citySelection();
      break;
    case 'bio':
      message = `📝 Bio saat ini:\n*${user.bio || 'Tidak ada bio'}*\n\nMasukkan bio baru:`;
      break;
    case 'photo':
      registration.requestMedia(bot, chatId);
      state.setRegState(telegramId, state.REGISTRATION_STATES.WAITING_MEDIA);
      return;
    case 'video':
      message = '🎬 Kirim video profil baru:';
      break;
    default:
      message = 'Pilih yang ingin diedit:';
  }
  
  bot.sendMessage(chatId, message, {
    parse_mode: 'Markdown',
    reply_markup: replyMarkup
  });
}

/**
 * Handle edit input
 */
async function handleEditInput(bot, msg) {
  const chatId = msg.chat.id;
  const telegramId = msg.from.id;
  const userState = state.getState(telegramId);
  
  if (userState.actionState !== state.ACTION_STATES.EDITING_PROFILE) {
    return;
  }
  
  const field = userState.temp.editField;
  const user = registration.getUser(telegramId);
  const text = msg.text;
  
  let value = text;
  let success = false;
  
  switch (field) {
    case 'nama':
      if (text && text.length >= 2 && text.length <= 50) {
        success = true;
      }
      break;
    case 'bio':
      if (text && text.length >= 10 && text.length <= 500) {
        success = true;
      }
      break;
    case 'video':
      if (msg.video) {
        value = msg.video.file_id;
        db.userOps.update.run({
          ...user,
          video_id: value
        });
        bot.sendMessage(chatId, '✅ Video berhasil diperbarui!');
        state.resetToIdle(telegramId);
        showProfile(bot, chatId, telegramId);
        return;
      }
      break;
  }
  
  if (success) {
    const updateData = { ...user };
    updateData[field] = value;
    
    db.userOps.update.run(updateData);
    
    bot.sendMessage(chatId, `✅ ${field.charAt(0).toUpperCase() + field.slice(1)} berhasil diperbarui!`);
    state.resetToIdle(telegramId);
    showProfile(bot, chatId, telegramId);
  } else {
    let errorMsg = '';
    switch (field) {
      case 'nama':
        errorMsg = 'Nama harus 2-50 karakter.';
        break;
      case 'bio':
        errorMsg = 'Bio harus 10-500 karakter.';
        break;
      default:
        errorMsg = 'Input tidak valid.';
    }
    bot.sendMessage(chatId, `❌ ${errorMsg} Coba lagi:`);
  }
}

/**
 * Handle edit selection (age, gender, preference, city)
 */
function handleEditSelection(bot, chatId, telegramId, field, value) {
  const user = registration.getUser(telegramId);
  
  if (!user) return;
  
  const updateData = { ...user };
  updateData[field] = value;
  
  db.userOps.update.run(updateData);
  
  bot.sendMessage(chatId, `✅ ${field.charAt(0).toUpperCase() + field.slice(1)} berhasil diperbarui!`);
  state.resetToIdle(telegramId);
  showProfile(bot, chatId, telegramId);
}

/**
 * Show settings menu
 */
function showSettingsMenu(bot, chatId) {
  bot.sendMessage(
    chatId,
    '⚙️ *Pengaturan*\n\nKelola akun dan preferensi kamu:',
    {
      parse_mode: 'Markdown',
      reply_markup: keyboard.settingsMenu()
    }
  );
}

/**
 * Show blocked users
 */
async function showBlockedUsers(bot, chatId, telegramId) {
  const user = registration.getUser(telegramId);
  
  if (!user) {
    bot.sendMessage(chatId, '❌ Kamu belum terdaftar.');
    return;
  }
  
  const blocked = db.blockOps.getBlocked.all(user.id);
  
  if (blocked.length === 0) {
    bot.sendMessage(
      chatId,
      '🚫 *Daftar Blokir*\n\nBelum ada user yang diblokir.',
      {
        parse_mode: 'Markdown',
        reply_markup: keyboard.backButton('settings_menu')
      }
    );
    return;
  }
  
  const keyboardRows = blocked.map(b => [
    { text: `❌ ${b.nama} (${b.umur})`, callback_data: `unblock_${b.id}` }
  ]);
  
  keyboardRows.push([{ text: '⬅️ Kembali', callback_data: 'settings_menu' }]);
  
  bot.sendMessage(
    chatId,
    `🚫 *Daftar Blokir* (${blocked.length})\n\nKlik untuk membuka blokir:`,
    {
      parse_mode: 'Markdown',
      reply_markup: { inline_keyboard: keyboardRows }
    }
  );
}

/**
 * Block a user
 */
function blockUser(bot, chatId, telegramId, targetId) {
  const user = registration.getUser(telegramId);
  const target = registration.getUserById(targetId);
  
  if (!user || !target) {
    bot.sendMessage(chatId, '❌ User tidak ditemukan.');
    return;
  }
  
  db.blockOps.block.run(user.id, targetId);
  
  bot.sendMessage(
    chatId,
    `🚫 *${target.nama}* telah diblokir.\n\nKamu tidak akan menerima pesan dari user ini.`,
    { parse_mode: 'Markdown' }
  );
}

/**
 * Unblock a user
 */
function unblockUser(bot, chatId, telegramId, targetId) {
  const user = registration.getUser(telegramId);
  
  if (!user) return;
  
  db.blockOps.unblock.run(user.id, targetId);
  
  bot.sendMessage(chatId, '✅ User berhasil dibuka blokir.');
  showBlockedUsers(bot, chatId, telegramId);
}

/**
 * Report a user
 */
function reportUser(bot, chatId, telegramId, targetId) {
  const user = registration.getUser(telegramId);
  const target = registration.getUserById(targetId);
  
  if (!user || !target) {
    bot.sendMessage(chatId, '❌ User tidak ditemukan.');
    return;
  }
  
  state.setActionState(telegramId, state.ACTION_STATES.REPORTING_USER);
  state.updateTemp(telegramId, { reportTargetId: targetId });
  
  bot.sendMessage(
    chatId,
    `⚠️ *Laporkan ${target.nama}*\n\n` +
    'Pilih alasan laporan:',
    {
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [
          [{ text: '🚫 Profil Palsu', callback_data: 'report_reason_fake' }],
          [{ text: '🔞 Konten Tidak Pantas', callback_data: 'report_reason_inappropriate' }],
          [{ text: '💰 Penipuan', callback_data: 'report_reason_scam' }],
          [{ text: '🤖 Spam/Bot', callback_data: 'report_reason_spam' }],
          [{ text: '❌ Batal', callback_data: 'report_cancel' }]
        ]
      }
    }
  );
}

/**
 * Submit report
 */
function submitReport(bot, chatId, telegramId, reason) {
  const user = registration.getUser(telegramId);
  const userState = state.getState(telegramId);
  const targetId = userState.temp.reportTargetId;
  
  if (!user || !targetId) {
    bot.sendMessage(chatId, '❌ Terjadi kesalahan.');
    state.resetToIdle(telegramId);
    return;
  }
  
  db.reportOps.create.run(user.id, targetId, reason);
  
  state.resetToIdle(telegramId);
  
  bot.sendMessage(
    chatId,
    '✅ *Laporan Terkirim*\n\n' +
    'Terima kasih atas laporan kamu. Tim kami akan segera meninjau laporan ini.',
    {
      parse_mode: 'Markdown',
      reply_markup: keyboard.backButton('main_menu')
    }
  );
}

/**
 * Delete account confirmation
 */
function confirmDeleteAccount(bot, chatId, telegramId) {
  bot.sendMessage(
    chatId,
    '⚠️ *Hapus Akun*\n\n' +
    'Apakah kamu yakin ingin menghapus akun?\n\n' +
    '_Semua data akan dihapus permanen dan tidak dapat dikembalikan._',
    {
      parse_mode: 'Markdown',
      reply_markup: keyboard.confirmKeyboard('delete_account', telegramId)
    }
  );
}

/**
 * Delete account
 */
function deleteAccount(bot, chatId, telegramId) {
  const user = registration.getUser(telegramId);
  
  if (!user) return;
  
  // Delete user data
  db.db.prepare('DELETE FROM user_photos WHERE user_id = ?').run(user.id);
  db.db.prepare('DELETE FROM user_videos WHERE user_id = ?').run(user.id);
  db.db.prepare('DELETE FROM likes WHERE user_id = ? OR target_id = ?').run(user.id, user.id);
  db.db.prepare('DELETE FROM messages WHERE from_id = ? OR to_id = ?').run(user.id, user.id);
  db.db.prepare('DELETE FROM blocks WHERE user_id = ? OR blocked_id = ?').run(user.id, user.id);
  db.db.prepare('DELETE FROM reports WHERE reporter_id = ? OR reported_id = ?').run(user.id, user.id);
  db.db.prepare('DELETE FROM users WHERE id = ?').run(user.id);
  
  state.clearState(telegramId);
  
  bot.sendMessage(
    chatId,
    '✅ Akun kamu telah dihapus.\n\nTerima kasih telah menggunakan Bot Match.',
    { reply_markup: { inline_keyboard: [[{ text: '🔄 Daftar Ulang', callback_data: 'start_register' }]] } }
  );
}

/**
 * Add photo to profile
 */
async function addPhoto(bot, msg) {
  const chatId = msg.chat.id;
  const telegramId = msg.from.id;
  const user = registration.getUser(telegramId);
  
  if (!user) {
    bot.sendMessage(chatId, '❌ Kamu belum terdaftar.');
    return;
  }
  
  if (msg.photo) {
    const photos = msg.photo;
    const photoId = photos[photos.length - 1].file_id;
    
    // Check existing photos count
    const existingPhotos = db.photoOps.getByUser.all(user.id);
    
    if (existingPhotos.length >= 5) {
      bot.sendMessage(chatId, '❌ Maksimal 5 foto per profil.');
      return;
    }
    
    // Add photo
    db.photoOps.add.run(user.id, photoId, null, existingPhotos.length);
    
    // Set as main photo if first
    if (existingPhotos.length === 0) {
      db.userOps.update.run({
        ...user,
        photo_id: photoId
      });
    }
    
    bot.sendMessage(
      chatId,
      '✅ Foto berhasil ditambahkan!',
      { reply_markup: keyboard.backButton('profile_view') }
    );
  }
}

module.exports = {
  showProfile,
  showEditProfileMenu,
  startEditField,
  handleEditInput,
  handleEditSelection,
  showSettingsMenu,
  showBlockedUsers,
  blockUser,
  unblockUser,
  reportUser,
  submitReport,
  confirmDeleteAccount,
  deleteAccount,
  addPhoto
};
