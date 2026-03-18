/**
 * Search & Match Module
 * Handles user search and matching functionality
 */

const db = require('./database');
const state = require('./stateManager');
const keyboard = require('./keyboard');
const config = require('../config');
const registration = require('./registration');
const fakeUserSeeder = require('./fakeUserSeeder');

/**
 * Start search for matches
 */
async function startSearch(bot, chatId, telegramId) {
  const user = registration.getUser(telegramId);
  
  if (!user) {
    bot.sendMessage(chatId, '❌ Kamu belum terdaftar. Ketik /start untuk mendaftar.');
    return;
  }
  
  if (!user.photo_id && !user.photo_url) {
    bot.sendMessage(chatId, '❌ Kamu harus punya foto profil untuk mencari!', {
      reply_markup: keyboard.backButton('main_menu')
    });
    return;
  }
  
  // Reset daily limits if needed
  db.userOps.resetDailyLimits();
  
  // Store viewed users in temp state
  state.updateTemp(telegramId, { viewedUsers: [], currentIndex: 0 });
  
  await showNextProfile(bot, chatId, telegramId);
}

/**
 * Show next profile in search
 */
async function showNextProfile(bot, chatId, telegramId) {
  const user = registration.getUser(telegramId);
  const userState = state.getState(telegramId);
  
  // Get viewed users to exclude
  const viewedUsers = userState.temp.viewedUsers || [];
  
  // Get users already liked
  const likedIds = db.getLikedUserIds(user.id);
  
  const excludeIds = [...viewedUsers, ...likedIds, user.id];
  
  // Search for potential matches
  let candidates = db.searchUsers(user.id, excludeIds, 1);
  
  if (candidates.length === 0) {
    bot.sendMessage(
      chatId,
      '😔 *Tidak ada profil lain untuk saat ini*\n\n' +
      'Coba lagi nanti atau perluas preferensi kamu!',
      {
        parse_mode: 'Markdown',
        reply_markup: keyboard.backButton('main_menu')
      }
    );
    return;
  }
  
  const candidate = candidates[0];
  
  // Add to viewed
  viewedUsers.push(candidate.id);
  state.updateTemp(telegramId, { viewedUsers });
  
  // Check if user already liked this candidate
  const existingLike = db.likeOps.getLike(user.id, candidate.id);
  
  // Display profile
  await displayProfile(bot, chatId, candidate, existingLike ? true : false);
}

/**
 * Display user profile
 */
async function displayProfile(bot, chatId, user, hasLiked = false, isLikeView = false) {
  let caption = `👤 *${user.nama}*, ${user.umur} tahun\n`;
  caption += `🏙️ ${user.kota}\n`;
  caption += `❤️ ${user.preferensi}\n\n`;
  caption += `📝 ${user.bio || '_Tidak ada bio_'}`;
  
  // Add role badge
  if (user.role === 'elite') {
    caption += '\n\n👑 *ELITE*';
  } else if (user.role === 'vip') {
    caption += '\n\n⭐ *VIP*';
  }
  
  // Add boost indicator
  if (user.boost_until && new Date(user.boost_until) > new Date()) {
    caption += ' 🚀 BOOST';
  }
  
  const keyboardType = isLikeView ? 
    keyboard.likesView(user.id) : 
    keyboard.searchResult(user.id, hasLiked);
  
  try {
    if (user.photo_id) {
      await bot.sendPhoto(chatId, user.photo_id, {
        caption,
        parse_mode: 'Markdown',
        reply_markup: keyboardType
      });
    } else if (user.photo_url) {
      await bot.sendPhoto(chatId, user.photo_url, {
        caption,
        parse_mode: 'Markdown',
        reply_markup: keyboardType
      });
    } else if (user.video_id) {
      await bot.sendVideo(chatId, user.video_id, {
        caption,
        parse_mode: 'Markdown',
        reply_markup: keyboardType
      });
    } else {
      await bot.sendMessage(chatId, caption, {
        parse_mode: 'Markdown',
        reply_markup: keyboardType
      });
    }
  } catch (error) {
    console.error('Error displaying profile:', error.message);
    await bot.sendMessage(chatId, caption, {
      parse_mode: 'Markdown',
      reply_markup: keyboardType
    });
  }
}

/**
 * Handle like action
 */
async function handleLike(bot, chatId, telegramId, targetId) {
  const user = registration.getUser(telegramId);
  const target = registration.getUserById(targetId);
  
  if (!user || !target) {
    bot.sendMessage(chatId, '❌ User tidak ditemukan.');
    return;
  }
  
  // Check cooldown
  const limits = user.role === 'elite' ? config.ELITE_LIMITS :
                 user.role === 'vip' ? config.VIP_LIMITS :
                 config.FREE_LIMITS;
  
  if (limits.cooldownSeconds > 0 && user.last_action) {
    const lastAction = new Date(user.last_action);
    const now = new Date();
    const diffSeconds = (now - lastAction) / 1000;
    
    if (diffSeconds < limits.cooldownSeconds) {
      bot.sendMessage(
        chatId,
        `⏳ Tunggu ${Math.ceil(limits.cooldownSeconds - diffSeconds)} detik lagi.`,
        { reply_markup: keyboard.backButton('search_start') }
      );
      return;
    }
  }
  
  // Check daily limit
  if (limits.dailyLikes > 0 && user.daily_likes >= limits.dailyLikes) {
    bot.sendMessage(
      chatId,
      `⚠️ Batas like harian tercapai (${limits.dailyLikes}). Upgrade ke VIP untuk unlimited!`,
      { reply_markup: keyboard.vipMenu() }
    );
    return;
  }
  
  // Check if already liked
  const existingLike = db.likeOps.getLike(user.id, targetId);
  if (existingLike) {
    bot.sendMessage(chatId, 'ℹ️ Kamu sudah menyukai user ini.');
    await showNextProfile(bot, chatId, telegramId);
    return;
  }
  
  // Check if target already liked user (MATCH!)
  const targetLike = db.likeOps.getLike(targetId, user.id);
  
  let isMatch = false;
  
  if (targetLike && !targetLike.is_match) {
    // Create match!
    db.likeOps.create(user.id, targetId, 1);
    db.likeOps.setMatch(targetId, user.id);
    isMatch = true;
    
    // Notify both users
    bot.sendMessage(
      chatId,
      `🎉 *MATCH!*\n\nKamu match dengan *${target.nama}* (${target.umur}) dari ${target.kota}!\n\nMau mulai chat?`,
      {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [{ text: '💬 Mulai Chat', callback_data: `chat_${targetId}` }],
            [{ text: '🔍 Lanjut Cari', callback_data: 'search_next' }]
          ]
        }
      }
    );
    
    // Notify target if real user
    if (!target.is_fake && target.telegram_id > 0) {
      try {
        await bot.sendMessage(
          target.telegram_id,
          `🎉 *MATCH!*\n\nKamu match dengan *${user.nama}* (${user.umur}) dari ${user.kota}!\n\nMau mulai chat?`,
          {
            parse_mode: 'Markdown',
            reply_markup: {
              inline_keyboard: [
                [{ text: '💬 Mulai Chat', callback_data: `chat_${user.id}` }],
                [{ text: '🔍 Lanjut Cari', callback_data: 'search_start' }]
              ]
            }
          }
        );
      } catch (e) {
        // Target may have blocked bot
      }
    }
  } else {
    // Just like
    db.likeOps.create(user.id, targetId, 0);
    
    bot.sendMessage(
      chatId,
      `❤️ Kamu menyukai *${target.nama}*!`,
      { parse_mode: 'Markdown' }
    );
    
    // Notify target if real user
    if (!target.is_fake && target.telegram_id > 0) {
      try {
        await bot.sendMessage(
          target.telegram_id,
          `❤️ *${user.nama}* (${user.umur}) menyukai profilmu!`,
          {
            parse_mode: 'Markdown',
            reply_markup: {
              inline_keyboard: [
                [{ text: '👀 Lihat Siapa Suka', callback_data: 'likes_view' }]
              ]
            }
          }
        );
      } catch (e) {
        // Target may have blocked bot
      }
    }
    
    // Trigger fake user behavior
    if (target.is_fake) {
      fakeUserSeeder.autoLikeBack(bot, user.id);
      fakeUserSeeder.autoSendMessage(bot, user.id, target);
    }
  }
  
  // Increment user likes
  db.userOps.incrementLikes(user.id);
  
  // Continue to next profile if not match
  if (!isMatch) {
    await showNextProfile(bot, chatId, telegramId);
  }
}

/**
 * Handle skip action
 */
async function handleSkip(bot, chatId, telegramId, targetId) {
  await showNextProfile(bot, chatId, telegramId);
}

/**
 * Handle like back (from likes view)
 */
async function handleLikeBack(bot, chatId, telegramId, targetId) {
  await handleLike(bot, chatId, telegramId, targetId);
}

/**
 * Handle reject (from likes view)
 */
async function handleReject(bot, chatId, telegramId, targetId) {
  const user = registration.getUser(telegramId);
  
  // Delete the like
  db.likeOps.delete(targetId, user.id);
  
  bot.sendMessage(chatId, '✅ Ditolak.', { parse_mode: 'Markdown' });
  
  // Show next like
  await showLikes(bot, chatId, telegramId);
}

/**
 * Show likes received
 */
async function showLikes(bot, chatId, telegramId) {
  const user = registration.getUser(telegramId);
  
  if (!user) {
    bot.sendMessage(chatId, '❌ Kamu belum terdaftar.');
    return;
  }
  
  const likes = db.likeOps.getLikedBy(user.id);
  
  if (likes.length === 0) {
    bot.sendMessage(
      chatId,
      '😔 *Belum ada yang menyukai profilmu*\n\n' +
      'Tips: Perbarui foto dan bio untuk menarik lebih banyak perhatian! 💕',
      {
        parse_mode: 'Markdown',
        reply_markup: keyboard.backButton('main_menu')
      }
    );
    return;
  }
  
  // Show first like
  const liker = likes[0];
  state.updateTemp(telegramId, { 
    likesQueue: likes,
    likesIndex: 0 
  });
  
  await displayProfile(bot, chatId, liker, false, true);
}

/**
 * Show matches
 */
async function showMatches(bot, chatId, telegramId) {
  const user = registration.getUser(telegramId);
  
  if (!user) {
    bot.sendMessage(chatId, '❌ Kamu belum terdaftar.');
    return;
  }
  
  const matches = db.likeOps.getMatches(user.id, user.id);
  
  if (matches.length === 0) {
    bot.sendMessage(
      chatId,
      '😔 *Belum ada match*\n\n' +
      'Terus cari dan like profil yang kamu suka! 💕',
      {
        parse_mode: 'Markdown',
        reply_markup: keyboard.backButton('main_menu')
      }
    );
    return;
  }
  
  // Create keyboard for matches
  const keyboardRows = matches.map(m => [
    { text: `${m.nama} (${m.umur}) - ${m.kota}`, callback_data: `match_view_${m.id}` }
  ]);
  
  keyboardRows.push([{ text: '🏠 Menu Utama', callback_data: 'main_menu' }]);
  
  bot.sendMessage(
    chatId,
    `❤️ *Match Kamu* (${matches.length})\n\nPilih untuk mulai chat:`,
    {
      parse_mode: 'Markdown',
      reply_markup: { inline_keyboard: keyboardRows }
    }
  );
}

/**
 * View specific match profile
 */
async function viewMatchProfile(bot, chatId, telegramId, matchId) {
  const match = registration.getUserById(matchId);
  
  if (!match) {
    bot.sendMessage(chatId, '❌ User tidak ditemukan.');
    return;
  }
  
  await displayProfile(bot, chatId, match, true, false);
}

module.exports = {
  startSearch,
  showNextProfile,
  displayProfile,
  handleLike,
  handleSkip,
  handleLikeBack,
  handleReject,
  showLikes,
  showMatches,
  viewMatchProfile
};
