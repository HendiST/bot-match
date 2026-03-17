/**
 * Registration Module
 * Handles user registration flow
 */

const db = require('./database');
const state = require('./stateManager');
const keyboard = require('./keyboard');
const config = require('../config');
const fakeUserSeeder = require('./fakeUserSeeder');

/**
 * Start registration process
 */
function startRegistration(bot, msg) {
  const chatId = msg.chat.id;
  const telegramId = msg.from.id;
  
  // Check if user already exists
  const existingUser = db.userOps.getByTelegramId.get(telegramId);
  if (existingUser && existingUser.photo_id) {
    // User is already registered
    showMainMenu(bot, chatId);
    return;
  }
  
  // Set state to waiting for name
  state.setRegState(telegramId, state.REGISTRATION_STATES.WAITING_NAME);
  
  // If user data exists but no photo
  if (existingUser) {
    state.updateData(telegramId, {
      id: existingUser.id,
      nama: existingUser.nama,
      umur: existingUser.umur,
      gender: existingUser.gender,
      preferensi: existingUser.preferensi,
      kota: existingUser.kota,
      bio: existingUser.bio
    });
    
    // Jump to media upload
    state.setRegState(telegramId, state.REGISTRATION_STATES.WAITING_MEDIA);
    requestMedia(bot, chatId);
    return;
  }
  
  // Start new registration
  bot.sendMessage(
    chatId,
    '👋 *Selamat Datang di Bot Match!*\n\n' +
    'Mari buat profil kencan kamu! 💌\n\n' +
    '📝 *Langkah 1/6*\n' +
    'Masukkan *nama* kamu:',
    { parse_mode: 'Markdown' }
  );
}

/**
 * Handle text input during registration
 */
async function handleRegistrationInput(bot, msg) {
  const chatId = msg.chat.id;
  const telegramId = msg.from.id;
  const text = msg.text;
  
  const userState = state.getState(telegramId);
  
  switch (userState.regState) {
    case state.REGISTRATION_STATES.WAITING_NAME:
      await handleNameInput(bot, chatId, telegramId, text);
      break;
    
    case state.REGISTRATION_STATES.WAITING_BIO:
      await handleBioInput(bot, chatId, telegramId, text);
      break;
    
    case state.REGISTRATION_STATES.WAITING_MEDIA:
      await handleMediaInput(bot, msg);
      break;
    
    default:
      // Not in registration, ignore
      break;
  }
}

/**
 * Handle name input
 */
async function handleNameInput(bot, chatId, telegramId, name) {
  if (name.length < 2 || name.length > 50) {
    bot.sendMessage(chatId, '❌ Nama harus 2-50 karakter. Coba lagi:');
    return;
  }
  
  state.updateData(telegramId, { nama: name });
  state.setRegState(telegramId, state.REGISTRATION_STATES.WAITING_AGE);
  
  bot.sendMessage(
    chatId,
    `✅ Nama: *${name}*\n\n📝 *Langkah 2/6*\nPilih *umur* kamu:`,
    {
      parse_mode: 'Markdown',
      reply_markup: keyboard.ageSelection()
    }
  );
}

/**
 * Handle age selection
 */
function handleAgeSelection(bot, chatId, telegramId, age) {
  if (age < config.AGE_RANGE.min || age > config.AGE_RANGE.max) {
    bot.sendMessage(chatId, `❌ Umur harus ${config.AGE_RANGE.min}-${config.AGE_RANGE.max} tahun.`);
    return;
  }
  
  state.updateData(telegramId, { umur: age });
  state.setRegState(telegramId, state.REGISTRATION_STATES.WAITING_GENDER);
  
  bot.sendMessage(
    chatId,
    `✅ Umur: *${age} tahun*\n\n📝 *Langkah 3/6*\nPilih *gender* kamu:`,
    {
      parse_mode: 'Markdown',
      reply_markup: keyboard.genderSelection()
    }
  );
}

/**
 * Handle gender selection
 */
function handleGenderSelection(bot, chatId, telegramId, gender) {
  state.updateData(telegramId, { gender });
  state.setRegState(telegramId, state.REGISTRATION_STATES.WAITING_PREFERENCE);
  
  bot.sendMessage(
    chatId,
    `✅ Gender: *${gender}*\n\n📝 *Langkah 4/6*\nKamu tertarik dengan siapa?`,
    {
      parse_mode: 'Markdown',
      reply_markup: keyboard.preferenceSelection()
    }
  );
}

/**
 * Handle preference selection
 */
function handlePreferenceSelection(bot, chatId, telegramId, preference) {
  state.updateData(telegramId, { preferensi: preference });
  state.setRegState(telegramId, state.REGISTRATION_STATES.WAITING_CITY);
  
  bot.sendMessage(
    chatId,
    `✅ Tertarik dengan: *${preference}*\n\n📝 *Langkah 5/6*\nPilih *kota* kamu:`,
    {
      parse_mode: 'Markdown',
      reply_markup: keyboard.citySelection()
    }
  );
}

/**
 * Handle city selection
 */
function handleCitySelection(bot, chatId, telegramId, cityIndex) {
  const city = config.CITIES[cityIndex];
  
  state.updateData(telegramId, { kota: city });
  state.setRegState(telegramId, state.REGISTRATION_STATES.WAITING_BIO);
  
  bot.sendMessage(
    chatId,
    `✅ Kota: *${city}*\n\n📝 *Langkah 6/6*\nTulis *bio* kamu (deskripsi singkat tentang dirimu):\n\n` +
    '_Contoh: Suka traveling dan kopi, cari teman untuk jalan-jalan_',
    {
      parse_mode: 'Markdown'
    }
  );
}

/**
 * Handle bio input
 */
async function handleBioInput(bot, chatId, telegramId, bio) {
  if (bio.length < 10) {
    bot.sendMessage(chatId, '❌ Bio minimal 10 karakter. Ceritakan lebih tentang dirimu:');
    return;
  }
  
  if (bio.length > 500) {
    bot.sendMessage(chatId, '❌ Bio maksimal 500 karakter. Perpendek sedikit:');
    return;
  }
  
  state.updateData(telegramId, { bio });
  state.setRegState(telegramId, state.REGISTRATION_STATES.WAITING_MEDIA);
  
  requestMedia(bot, chatId);
}

/**
 * Request media upload
 */
function requestMedia(bot, chatId) {
  bot.sendMessage(
    chatId,
    '📸 *Upload Foto/Video Profil*\n\n' +
    'Kamu *WAJIB* upload minimal 1 foto atau video untuk melanjutkan.\n\n' +
    'Foto yang bagus akan meningkatkan peluang match kamu! 💕',
    {
      parse_mode: 'Markdown',
      reply_markup: keyboard.mediaRequest()
    }
  );
}

/**
 * Handle media input (photo/video)
 */
async function handleMediaInput(bot, msg) {
  const chatId = msg.chat.id;
  const telegramId = msg.from.id;
  
  let fileId = null;
  let mediaType = null;
  
  if (msg.photo) {
    // Get the largest photo
    const photos = msg.photo;
    fileId = photos[photos.length - 1].file_id;
    mediaType = 'photo';
  } else if (msg.video) {
    fileId = msg.video.file_id;
    mediaType = 'video';
  } else if (msg.document && msg.document.mime_type && msg.document.mime_type.startsWith('video/')) {
    fileId = msg.document.file_id;
    mediaType = 'video';
  } else {
    bot.sendMessage(chatId, '❌ Kirim foto atau video, bukan file lain.');
    return;
  }
  
  const userState = state.getState(telegramId);
  const userData = userState.data;
  
  // Update user data with media
  if (mediaType === 'photo') {
    state.updateData(telegramId, { photo_id: fileId });
  } else {
    state.updateData(telegramId, { video_id: fileId });
  }
  
  bot.sendMessage(
    chatId,
    `✅ ${mediaType === 'photo' ? 'Foto' : 'Video'} berhasil diupload!\n\nMau upload lagi?`,
    { reply_markup: keyboard.mediaRequest() }
  );
}

/**
 * Complete registration
 */
async function completeRegistration(bot, chatId, telegramId) {
  const userState = state.getState(telegramId);
  const userData = userState.data;
  
  // Check if user has at least one media
  if (!userData.photo_id && !userData.video_id) {
    bot.sendMessage(chatId, '❌ Kamu harus upload minimal 1 foto atau video!', {
      reply_markup: keyboard.mediaRequest()
    });
    return;
  }
  
  try {
    // Check if user already exists in DB
    let existingUser = db.userOps.getByTelegramId.get(telegramId);
    
    if (existingUser) {
      // Update existing user
      db.userOps.update.run({
        id: existingUser.id,
        nama: userData.nama || existingUser.nama,
        umur: userData.umur || existingUser.umur,
        gender: userData.gender || existingUser.gender,
        preferensi: userData.preferensi || existingUser.preferensi,
        kota: userData.kota || existingUser.kota,
        bio: userData.bio || existingUser.bio,
        photo_id: userData.photo_id || existingUser.photo_id,
        video_id: userData.video_id || existingUser.video_id
      });
    } else {
      // Create new user
      db.userOps.create.run({
        telegram_id: telegramId,
        nama: userData.nama,
        umur: userData.umur,
        gender: userData.gender,
        preferensi: userData.preferensi,
        kota: userData.kota,
        bio: userData.bio,
        photo_id: userData.photo_id,
        video_id: userData.video_id,
        photo_url: null,
        role: 'free',
        is_fake: 0,
        vip_expired: null,
        elite_expired: null
      });
    }
    
    state.clearState(telegramId);
    
    bot.sendMessage(
      chatId,
      '🎉 *Registrasi Berhasil!*\n\n' +
      'Profil kamu sudah siap. Sekarang kamu bisa mulai mencari pasangan! 💕\n\n' +
      '_Tips: Profil yang lengkap punya peluang match lebih tinggi_',
      {
        parse_mode: 'Markdown',
        reply_markup: keyboard.mainMenu()
      }
    );
    
    // Trigger fake user auto-like after some activity
    setTimeout(() => {
      fakeUserSeeder.autoLikeBack(bot, existingUser ? existingUser.id : db.userOps.getByTelegramId.get(telegramId).id);
    }, 5000);
    
  } catch (error) {
    console.error('Registration error:', error);
    bot.sendMessage(chatId, '❌ Terjadi kesalahan. Coba lagi nanti.');
  }
}

/**
 * Show main menu
 */
function showMainMenu(bot, chatId) {
  bot.sendMessage(
    chatId,
    '🏠 *Menu Utama*\n\nPilih menu di bawah ini:',
    {
      parse_mode: 'Markdown',
      reply_markup: keyboard.mainMenu()
    }
  );
}

/**
 * Check if user is registered
 */
function isUserRegistered(telegramId) {
  const user = db.userOps.getByTelegramId.get(telegramId);
  return user && user.photo_id;
}

/**
 * Get user by telegram ID
 */
function getUser(telegramId) {
  return db.userOps.getByTelegramId.get(telegramId);
}

/**
 * Get user by ID
 */
function getUserById(id) {
  return db.userOps.getById.get(id);
}

module.exports = {
  startRegistration,
  handleRegistrationInput,
  handleAgeSelection,
  handleGenderSelection,
  handlePreferenceSelection,
  handleCitySelection,
  handleBioInput,
  handleMediaInput,
  completeRegistration,
  showMainMenu,
  isUserRegistered,
  getUser,
  getUserById,
  requestMedia
};
