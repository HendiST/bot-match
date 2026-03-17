/**
 * Messaging Module
 * Handles chat and messaging functionality
 */

const db = require('./database');
const state = require('./stateManager');
const keyboard = require('./keyboard');
const config = require('../config');
const registration = require('./registration');
const fakeUserSeeder = require('./fakeUserSeeder');
const search = require('./search');

/**
 * Start sending message to a user
 */
async function startSendMessage(bot, chatId, telegramId, targetId) {
  const user = registration.getUser(telegramId);
  const target = registration.getUserById(targetId);
  
  if (!user || !target) {
    bot.sendMessage(chatId, '❌ User tidak ditemukan.');
    return;
  }
  
  // Check daily limit for free users
  const limits = user.role === 'elite' ? config.ELITE_LIMITS :
                 user.role === 'vip' ? config.VIP_LIMITS :
                 config.FREE_LIMITS;
  
  if (limits.dailyMessages > 0 && user.daily_messages >= limits.dailyMessages) {
    bot.sendMessage(
      chatId,
      `⚠️ *Batas Pesan Harian Tercapai*\n\n` +
      `Kamu sudah mengirim ${user.daily_messages}/${limits.dailyMessages} pesan hari ini.\n\n` +
      `_Upgrade ke VIP untuk pesan tanpa batas!_`,
      {
        parse_mode: 'Markdown',
        reply_markup: keyboard.vipMenu()
      }
    );
    return;
  }
  
  // Check if Elite (can message anyone without match)
  const isElite = user.role === 'elite' && user.elite_expired && new Date(user.elite_expired) > new Date();
  
  // Check if there's a match
  const matchCheck = db.likeOps.checkMutual(user.id, targetId);
  const targetLikeCheck = db.likeOps.getLike(targetId, user.id);
  const hasMatch = matchCheck || (targetLikeCheck && targetLikeCheck.is_match);
  
  if (!isElite && !hasMatch) {
    // Need to match first (auto-like when sending message)
    db.likeOps.create(user.id, targetId, 0);
    
    bot.sendMessage(
      chatId,
      `❤️ *${user.nama}* telah menyukai *${target.nama}*\n\nKamu perlu match terlebih dahulu sebelum bisa kirim pesan.`,
      { parse_mode: 'Markdown' }
    );
    return;
  }
  
  // Set state to sending message
  state.setActionState(telegramId, state.ACTION_STATES.SENDING_MESSAGE);
  state.updateTemp(telegramId, { targetId });
  
  bot.sendMessage(
    chatId,
    `💌 *Kirim Pesan ke ${target.nama}*\n\n` +
    `Tulis pesan kamu di bawah ini:\n\n` +
    `_Kamu juga bisa mengirim foto atau video bersama pesan_`,
    {
      parse_mode: 'Markdown',
      reply_markup: keyboard.messageInput(targetId)
    }
  );
}

/**
 * Handle message input
 */
async function handleSendMessage(bot, msg) {
  const chatId = msg.chat.id;
  const telegramId = msg.from.id;
  const userState = state.getState(telegramId);
  
  if (userState.actionState !== state.ACTION_STATES.SENDING_MESSAGE) {
    return;
  }
  
  const targetId = userState.temp.targetId;
  const target = registration.getUserById(targetId);
  const user = registration.getUser(telegramId);
  
  if (!target) {
    bot.sendMessage(chatId, '❌ User tidak ditemukan.');
    state.resetToIdle(telegramId);
    return;
  }
  
  let messageText = msg.text || msg.caption || '';
  let mediaType = null;
  let mediaId = null;
  
  // Handle media
  if (msg.photo) {
    const photos = msg.photo;
    mediaId = photos[photos.length - 1].file_id;
    mediaType = 'photo';
  } else if (msg.video) {
    mediaId = msg.video.file_id;
    mediaType = 'video';
  }
  
  if (!messageText && !mediaId) {
    bot.sendMessage(chatId, '❌ Tulis pesan atau kirim media.');
    return;
  }
  
  // Save message to database
  db.msgOps.create(user.id, targetId, messageText || '[Media]', mediaType, mediaId);
  
  // Increment message count
  db.userOps.incrementMessages(user.id);
  
  // Reset state
  state.resetToIdle(telegramId);
  
  bot.sendMessage(
    chatId,
    `✅ Pesan terkirim ke *${target.nama}*!`,
    { parse_mode: 'Markdown' }
  );
  
  // Notify target if real user
  if (!target.is_fake && target.telegram_id > 0) {
    try {
      let notifText = `💌 *Pesan Baru dari ${user.nama}!*\n\n`;
      
      if (messageText) {
        notifText += `"${messageText}"`;
      }
      
      if (mediaType === 'photo') {
        await bot.sendPhoto(target.telegram_id, mediaId, {
          caption: notifText,
          parse_mode: 'Markdown',
          reply_markup: {
            inline_keyboard: [
              [{ text: '💬 Balas', callback_data: `chat_${user.id}` }],
              [{ text: '🏠 Menu Utama', callback_data: 'main_menu' }]
            ]
          }
        });
      } else if (mediaType === 'video') {
        await bot.sendVideo(target.telegram_id, mediaId, {
          caption: notifText,
          parse_mode: 'Markdown',
          reply_markup: {
            inline_keyboard: [
              [{ text: '💬 Balas', callback_data: `chat_${user.id}` }],
              [{ text: '🏠 Menu Utama', callback_data: 'main_menu' }]
            ]
          }
        });
      } else {
        await bot.sendMessage(target.telegram_id, notifText, {
          parse_mode: 'Markdown',
          reply_markup: {
            inline_keyboard: [
              [{ text: '💬 Balas', callback_data: `chat_${user.id}` }],
              [{ text: '🏠 Menu Utama', callback_data: 'main_menu' }]
            ]
          }
        });
      }
    } catch (e) {
      // Target may have blocked bot
    }
  }
  
  // Trigger fake user auto-reply
  if (target.is_fake) {
    setTimeout(() => {
      fakeUserSeeder.autoSendMessage(bot, user.id, target);
    }, Math.random() * 30000 + 5000);
  }
}

/**
 * Cancel message sending
 */
function cancelMessage(bot, chatId, telegramId) {
  state.resetToIdle(telegramId);
  bot.sendMessage(chatId, '❌ Pengiriman pesan dibatalkan.', {
    reply_markup: keyboard.backButton('main_menu')
  });
}

/**
 * Show inbox
 */
async function showInbox(bot, chatId, telegramId) {
  const user = registration.getUser(telegramId);
  
  if (!user) {
    bot.sendMessage(chatId, '❌ Kamu belum terdaftar.');
    return;
  }
  
  const conversations = db.msgOps.getInbox(user.id, user.id, user.id);
  
  if (conversations.length === 0) {
    bot.sendMessage(
      chatId,
      '📭 *Kotak Masuk Kosong*\n\n' +
      'Belum ada percakapan. Cari pasangan dan mulai chat! 💕',
      {
        parse_mode: 'Markdown',
        reply_markup: keyboard.backButton('main_menu')
      }
    );
    return;
  }
  
  // Create keyboard for conversations
  const keyboardRows = conversations.map(c => [
    { text: `${c.nama} (${c.umur})`, callback_data: `chat_${c.id}` }
  ]);
  
  keyboardRows.push([{ text: '🏠 Menu Utama', callback_data: 'main_menu' }]);
  
  bot.sendMessage(
    chatId,
    `📬 *Kotak Masuk*\n\nPilih percakapan:`,
    {
      parse_mode: 'Markdown',
      reply_markup: { inline_keyboard: keyboardRows }
    }
  );
}

/**
 * Show chat history with a user
 */
async function showChat(bot, chatId, telegramId, targetId) {
  const user = registration.getUser(telegramId);
  const target = registration.getUserById(targetId);
  
  if (!user || !target) {
    bot.sendMessage(chatId, '❌ User tidak ditemukan.');
    return;
  }
  
  // Get conversation
  const messages = db.msgOps.getConversation(user.id, targetId, targetId, user.id);
  
  // Mark messages as read
  db.msgOps.markRead(user.id, targetId);
  
  let chatText = `💬 *Chat dengan ${target.nama}*\n\n`;
  
  if (messages.length === 0) {
    chatText += '_Belum ada pesan. Mulai percakapan!_';
  } else {
    messages.forEach(msg => {
      const sender = msg.from_id === user.id ? 'Kamu' : msg.nama;
      const time = new Date(msg.created_at).toLocaleString('id-ID', {
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit'
      });
      
      chatText += `*${sender}* (${time})\n${msg.pesan}\n\n`;
    });
  }
  
  bot.sendMessage(
    chatId,
    chatText,
    {
      parse_mode: 'Markdown',
      reply_markup: keyboard.chatKeyboard(targetId)
    }
  );
}

/**
 * View user profile
 */
async function viewUserProfile(bot, chatId, telegramId, targetId) {
  const target = registration.getUserById(targetId);
  
  if (!target) {
    bot.sendMessage(chatId, '❌ User tidak ditemukan.');
    return;
  }
  
  await search.displayProfile(bot, chatId, target, false, false);
}

module.exports = {
  startSendMessage,
  handleSendMessage,
  cancelMessage,
  showInbox,
  showChat,
  viewUserProfile
};
