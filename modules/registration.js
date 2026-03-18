/**
 * Registration Module
 * Handles user registration flow
 */

const db = require('./database');
const state = require('./stateManager');
const keyboard = require('./keyboard');
const config = require('../config');
const fakeUserSeeder = require('./fakeUserSeeder');

// Store message IDs to delete
const messageStore = new Map();

/**
 * Delete previous message
 */
async function deletePreviousMessage(bot, chatId, telegramId) {
  const lastMsgId = messageStore.get(telegramId);
  if (lastMsgId) {
    try {
      await bot.deleteMessage(chatId, lastMsgId);
    } catch (e) {
      // Message might be too old or already deleted
    }
  }
}

/**
 * Store message ID for deletion
 */
function storeMessage(telegramId, msgId) {
  messageStore.set(telegramId, msgId);
}

/**
 * Start registration process
 */
async function startRegistration(bot, msg) {
  const chatId = msg.chat.id;
  const telegramId = msg.from.id;
  
  // Check if user already exists
  const existingUser = db.userOps.getByTelegramId(telegramId);
  if (existingUser && existingUser.photo_id) {
    // User is already registered
    showMainMenu(bot, chatId);
    return;
  }
  
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
    requestMedia(bot, chatId, telegramId);
    return;
  }
  
  // Set state to waiting for name
  state.setRegState(telegramId, state.REGISTRATION_STATES.WAITING_NAME);
  state.updateData(telegramId, {}); // Initialize empty data
  
  // Start new registration
  const sentMsg = await bot.sendMessage(
    chatId,
    '👋 *Selamat Datang di Bot Match!*\n\n' +
    'Mari buat profil kencan kamu! 💌\n\n' +
    '📝 *Langkah 1/5*\n' +
    'Masukkan *nama* kamu:',
    { parse_mode: 'Markdown' }
  );
  storeMessage(telegramId, sentMsg.message_id);
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
    
    case state.REGISTRATION_STATES.WAITING_AGE:
      await handleAgeInput(bot, chatId, telegramId, text);
      break;
    
    case state.REGISTRATION_STATES.WAITING_CITY:
      await handleCityInput(bot, chatId, telegramId, text);
      break;
    
    case state.REGISTRATION_STATES.WAITING_MEDIA:
      // Media handled separately
      break;
    
    default:
      break;
  }
}

/**
 * Handle name input
 */
async function handleNameInput(bot, chatId, telegramId, name) {
  if (!name || name.length < 2 || name.length > 50) {
    const sentMsg = await bot.sendMessage(chatId, '❌ Nama harus 2-50 karakter. Coba lagi:');
    storeMessage(telegramId, sentMsg.message_id);
    return;
  }
  
  // Delete previous bot message
  await deletePreviousMessage(bot, chatId, telegramId);
  
  state.updateData(telegramId, { nama: name });
  state.setRegState(telegramId, state.REGISTRATION_STATES.WAITING_AGE);
  
  const sentMsg = await bot.sendMessage(
    chatId,
    `✅ Nama: *${name}*\n\n📝 *Langkah 2/5*\nMasukkan *umur* kamu (contoh: 25):`,
    { parse_mode: 'Markdown' }
  );
  storeMessage(telegramId, sentMsg.message_id);
}

/**
 * Handle age input (text)
 */
async function handleAgeInput(bot, chatId, telegramId, ageText) {
  const age = parseInt(ageText);
  
  if (isNaN(age) || age < 18 || age > 60) {
    const sentMsg = await bot.sendMessage(chatId, '❌ Umur harus angka 18-60. Coba lagi:');
    storeMessage(telegramId, sentMsg.message_id);
    return;
  }
  
  // Delete previous bot message
  await deletePreviousMessage(bot, chatId, telegramId);
  
  state.updateData(telegramId, { umur: age });
  state.setRegState(telegramId, state.REGISTRATION_STATES.WAITING_GENDER);
  
  const sentMsg = await bot.sendMessage(
    chatId,
    `✅ Umur: *${age} tahun*\n\n📝 *Langkah 3/5*\nPilih *gender* kamu:`,
    {
      parse_mode: 'Markdown',
      reply_markup: keyboard.genderSelection()
    }
  );
  storeMessage(telegramId, sentMsg.message_id);
}

/**
 * Handle gender selection
 */
async function handleGenderSelection(bot, chatId, telegramId, gender) {
  await deletePreviousMessage(bot, chatId, telegramId);
  
  state.updateData(telegramId, { gender });
  state.setRegState(telegramId, state.REGISTRATION_STATES.WAITING_PREFERENCE);
  
  const sentMsg = await bot.sendMessage(
    chatId,
    `✅ Gender: *${gender}*\n\n📝 *Langkah 4/5*\nKamu tertarik dengan siapa?`,
    {
      parse_mode: 'Markdown',
      reply_markup: keyboard.preferenceSelection()
    }
  );
  storeMessage(telegramId, sentMsg.message_id);
}

/**
 * Handle preference selection
 */
async function handlePreferenceSelection(bot, chatId, telegramId, preference) {
  await deletePreviousMessage(bot, chatId, telegramId);
  
  state.updateData(telegramId, { preferensi: preference });
  state.setRegState(telegramId, state.REGISTRATION_STATES.WAITING_CITY);
  
  const sentMsg = await bot.sendMessage(
    chatId,
    `✅ Tertarik dengan: *${preference}*\n\n📝 *Langkah 5/5*\nMasukkan *kota* kamu (contoh: Jakarta):`,
    { parse_mode: 'Markdown' }
  );
  storeMessage(telegramId, sentMsg.message_id);
}

/**
 * Handle city input (text)
 */
async function handleCityInput(bot, chatId, telegramId, city) {
  if (!city || city.length < 2 || city.length > 50) {
    const sentMsg = await bot.sendMessage(chatId, '❌ Nama kota tidak valid. Coba lagi:');
    storeMessage(telegramId, sentMsg.message_id);
    return;
  }
  
  // Capitalize first letter
  city = city.charAt(0).toUpperCase() + city.slice(1).toLowerCase();
  
  // Delete previous bot message
  await deletePreviousMessage(bot, chatId, telegramId);
  
  state.updateData(telegramId, { kota: city });
  state.setRegState(telegramId, state.REGISTRATION_STATES.WAITING_MEDIA);
  
  requestMedia(bot, chatId, telegramId);
}

/**
 * Request media upload
 */
async function requestMedia(bot, chatId, telegramId) {
  const sentMsg = await bot.sendMessage(
    chatId,
    '📸 *Upload Foto/Video Profil*\n\n' +
    'Kamu *WAJIB* upload minimal 1 foto atau video untuk melanjutkan.\n\n' +
    'Foto yang bagus akan meningkatkan peluang match kamu! 💕',
    {
      parse_mode: 'Markdown',
      reply_markup: keyboard.mediaRequest()
    }
  );
  storeMessage(telegramId, sentMsg.message_id);
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
    const sentMsg = await bot.sendMessage(chatId, '❌ Kirim foto atau video, bukan file lain.');
    storeMessage(telegramId, sentMsg.message_id);
    return;
  }
  
  // Delete previous bot message
  await deletePreviousMessage(bot, chatId, telegramId);
  
  // Update user data with media
  if (mediaType === 'photo') {
    state.updateData(telegramId, { photo_id: fileId });
  } else {
    state.updateData(telegramId, { video_id: fileId });
  }
  
  const sentMsg = await bot.sendMessage(
    chatId,
    `✅ ${mediaType === 'photo' ? 'Foto' : 'Video'} berhasil diupload!\n\nMau upload lagi atau selesai?`,
    { reply_markup: keyboard.mediaRequest() }
  );
  storeMessage(telegramId, sentMsg.message_id);
}

/**
 * Complete registration
 */
async function completeRegistration(bot, chatId, telegramId) {
  const userState = state.getState(telegramId);
  const userData = userState.data;
  
  // Check if user has at least one media
  if (!userData.photo_id && !userData.video_id) {
    const sentMsg = await bot.sendMessage(chatId, '❌ Kamu harus upload minimal 1 foto atau video!', {
      reply_markup: keyboard.mediaRequest()
    });
    storeMessage(telegramId, sentMsg.message_id);
    return;
  }
  
  // Delete previous bot message
  await deletePreviousMessage(bot, chatId, telegramId);
  
  // Clear message store
  messageStore.delete(telegramId);
  
  try {
    // Check if user already exists in DB
    let existingUser = db.userOps.getByTelegramId(telegramId);
    
    // Prepare data - ensure no undefined values
    const name = userData.nama || 'User';
    const age = userData.umur || 25;
    const gender = userData.gender || 'Pria';
    const pref = userData.preferensi || 'Semua';
    const city = userData.kota || 'Jakarta';
    const bio = userData.bio || '';
    const photoId = userData.photo_id || null;
    const videoId = userData.video_id || null;
    
    if (existingUser) {
      // Update existing user
      db.userOps.update({
        id: existingUser.id,
        nama: name,
        umur: age,
        gender: gender,
        preferensi: pref,
        kota: city,
        bio: bio,
        photo_id: photoId,
        video_id: videoId
      });
    } else {
      // Create new user
      db.userOps.create({
        telegram_id: telegramId,
        nama: name,
        umur: age,
        gender: gender,
        preferensi: pref,
        kota: city,
        bio: bio,
        photo_id: photoId,
        video_id: videoId,
        photo_url: null,
        role: 'free',
        is_fake: 0,
        vip_expired: null,
        elite_expired: null
      });
    }
    
    state.clearState(telegramId);
    
    await bot.sendMessage(
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
    const newUserId = existingUser ? existingUser.id : db.userOps.getByTelegramId(telegramId)?.id;
    if (newUserId) {
      setTimeout(() => {
        fakeUserSeeder.autoLikeBack(bot, newUserId);
      }, 5000);
    }
    
  } catch (error) {
    console.error('Registration error:', error);
    await bot.sendMessage(chatId, '❌ Terjadi kesalahan. Coba lagi nanti.');
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
  const user = db.userOps.getByTelegramId(telegramId);
  return user && user.photo_id;
}

/**
 * Get user by telegram ID
 */
function getUser(telegramId) {
  return db.userOps.getByTelegramId(telegramId);
}

/**
 * Get user by ID
 */
function getUserById(id) {
  return db.userOps.getById(id);
}

module.exports = {
  startRegistration,
  handleRegistrationInput,
  handleNameInput,
  handleAgeInput,
  handleGenderSelection,
  handlePreferenceSelection,
  handleCityInput,
  handleMediaInput,
  completeRegistration,
  showMainMenu,
  isUserRegistered,
  getUser,
  getUserById,
  requestMedia
};
