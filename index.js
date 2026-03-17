/**
 * Bot Match - Ultimate Telegram Dating Bot
 * Main Entry Point
 * 
 * Features:
 * - Like & Match System
 * - Direct Messaging
 * - VIP & Elite Membership
 * - Fake User System
 * - Auto Seed Database
 * - Full Button UI
 */

require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');
const config = require('./config');
const db = require('./modules/database');
const state = require('./modules/stateManager');
const keyboard = require('./modules/keyboard');
const registration = require('./modules/registration');
const search = require('./modules/search');
const messaging = require('./modules/messaging');
const premium = require('./modules/premium');
const profile = require('./modules/profile');
const fakeUserSeeder = require('./modules/fakeUserSeeder');

// Initialize bot
const bot = new TelegramBot(config.BOT_TOKEN, { polling: true });

console.log('🤖 Bot Match starting...');

// Initialize database
db.initTables();

// Initialize fake users after a short delay
setTimeout(() => {
  fakeUserSeeder.initFakeUserSystem(bot);
}, 2000);

// ============== COMMAND HANDLERS ==============

// Start command
bot.onText(/\/start/, async (msg) => {
  const chatId = msg.chat.id;
  const telegramId = msg.from.id;
  
  // Check if user is registered
  const user = registration.getUser(telegramId);
  
  if (user && user.photo_id) {
    // User is registered, show main menu
    registration.showMainMenu(bot, chatId);
  } else {
    // Start registration
    registration.startRegistration(bot, msg);
  }
});

// Help command
bot.onText(/\/help/, (msg) => {
  const chatId = msg.chat.id;
  
  const helpText = `
🤖 *Bot Match - Panduan Penggunaan*

*Cara Kerja:*
1. Daftar dengan profil lengkap
2. Upload foto/video profil
3. Cari dan like profil yang menarik
4. Match jika saling menyukai
5. Mulai chat dengan match kamu!

*Menu Utama:*
💘 Cari Pasangan - Temukan profil menarik
👤 Profil Saya - Lihat dan edit profil
❤️ Match Saya - Daftar match kamu
👀 Siapa Suka - Lihat siapa yang like kamu
💌 Pesan - Kotak masuk percakapan
⭐ VIP - Fitur premium
👑 Elite - Level tertinggi
⚙️ Pengaturan - Kelola akun

*Tips Sukses:*
✅ Gunakan foto yang jelas dan menarik
✅ Tulis bio yang menarik
✅ Aktif mencari dan like profil
✅ Upgrade ke VIP/Elite untuk hasil lebih baik

_Butuh bantuan lebih? Hubungi admin._
  `;
  
  bot.sendMessage(chatId, helpText, {
    parse_mode: 'Markdown',
    reply_markup: keyboard.mainMenu()
  });
});

// ============== MESSAGE HANDLERS ==============

// Handle all messages
bot.on('message', async (msg) => {
  const chatId = msg.chat.id;
  const telegramId = msg.from.id;
  const userState = state.getState(telegramId);
  
  // Skip commands
  if (msg.text && msg.text.startsWith('/')) return;
  
  // Handle registration flow
  if (state.isInRegistration(telegramId)) {
    // Handle media upload during registration
    if (msg.photo || msg.video) {
      await registration.handleMediaInput(bot, msg);
      return;
    }
    
    // Handle text input during registration
    if (msg.text) {
      await registration.handleRegistrationInput(bot, msg);
    }
    return;
  }
  
  // Handle action states
  if (state.isInAction(telegramId)) {
    switch (userState.actionState) {
      case state.ACTION_STATES.SENDING_MESSAGE:
        if (msg.photo || msg.video || msg.text) {
          await messaging.handleSendMessage(bot, msg);
        }
        break;
      
      case state.ACTION_STATES.EDITING_PROFILE:
        if (msg.text) {
          await profile.handleEditInput(bot, msg);
        } else if (msg.photo) {
          await profile.addPhoto(bot, msg);
        } else if (msg.video) {
          await profile.handleEditInput(bot, msg);
        }
        break;
    }
    return;
  }
  
  // No specific state, show main menu for unregistered
  const user = registration.getUser(telegramId);
  if (!user || !user.photo_id) {
    registration.startRegistration(bot, msg);
  }
});

// ============== CALLBACK QUERY HANDLERS ==============

bot.on('callback_query', async (query) => {
  const chatId = query.message.chat.id;
  const telegramId = query.from.id;
  const data = query.data;
  
  // Answer callback to remove loading state
  bot.answerCallbackQuery(query.id);
  
  try {
    // ============== MAIN MENU ==============
    if (data === 'main_menu') {
      const user = registration.getUser(telegramId);
      if (user && user.photo_id) {
        registration.showMainMenu(bot, chatId);
      } else {
        registration.startRegistration(bot, query.message);
      }
    }
    
    // ============== REGISTRATION ==============
    else if (data === 'start_register') {
      registration.startRegistration(bot, query.message);
    }
    
    // Age selection during registration
    else if (data.startsWith('reg_age_')) {
      const age = parseInt(data.split('_')[2]);
      registration.handleAgeSelection(bot, chatId, telegramId, age);
    }
    
    // Gender selection
    else if (data.startsWith('reg_gender_')) {
      const gender = data.split('_')[2];
      gender = gender.charAt(0).toUpperCase() + gender.slice(1);
      registration.handleGenderSelection(bot, chatId, telegramId, gender);
    }
    
    // Preference selection
    else if (data.startsWith('reg_pref_')) {
      const pref = data.split('_')[2];
      registration.handlePreferenceSelection(bot, chatId, telegramId, pref.charAt(0).toUpperCase() + pref.slice(1));
    }
    
    // City selection
    else if (data.startsWith('reg_city_')) {
      const cityIndex = parseInt(data.split('_')[2]);
      registration.handleCitySelection(bot, chatId, telegramId, cityIndex);
    }
    
    // Media upload
    else if (data === 'reg_upload_photo' || data === 'reg_upload_video') {
      const mediaType = data === 'reg_upload_photo' ? 'foto' : 'video';
      bot.sendMessage(chatId, `📸 Kirim ${mediaType} profil kamu:`);
    }
    
    // Complete registration
    else if (data === 'reg_media_done') {
      await registration.completeRegistration(bot, chatId, telegramId);
    }
    
    // ============== SEARCH ==============
    else if (data === 'search_start') {
      await search.startSearch(bot, chatId, telegramId);
    }
    
    else if (data === 'search_next') {
      await search.showNextProfile(bot, chatId, telegramId);
    }
    
    // Like action
    else if (data.startsWith('like_')) {
      const targetId = parseInt(data.split('_')[1]);
      await search.handleLike(bot, chatId, telegramId, targetId);
    }
    
    // Skip action
    else if (data.startsWith('skip_')) {
      const targetId = parseInt(data.split('_')[1]);
      await search.handleSkip(bot, chatId, telegramId, targetId);
    }
    
    // View profile
    else if (data.startsWith('view_')) {
      const targetId = parseInt(data.split('_')[1]);
      const target = registration.getUserById(targetId);
      if (target) {
        await search.displayProfile(bot, chatId, target, false, false);
      }
    }
    
    // ============== MATCHES ==============
    else if (data === 'matches_view') {
      await search.showMatches(bot, chatId, telegramId);
    }
    
    else if (data.startsWith('match_view_')) {
      const matchId = parseInt(data.split('_')[2]);
      await search.viewMatchProfile(bot, chatId, telegramId, matchId);
    }
    
    // ============== LIKES ==============
    else if (data === 'likes_view') {
      await search.showLikes(bot, chatId, telegramId);
    }
    
    else if (data.startsWith('like_back_')) {
      const targetId = parseInt(data.split('_')[2]);
      await search.handleLikeBack(bot, chatId, telegramId, targetId);
    }
    
    else if (data.startsWith('reject_')) {
      const targetId = parseInt(data.split('_')[1]);
      await search.handleReject(bot, chatId, telegramId, targetId);
    }
    
    // ============== PROFILE ==============
    else if (data === 'profile_view') {
      await profile.showProfile(bot, chatId, telegramId);
    }
    
    else if (data === 'profile_edit') {
      profile.showEditProfileMenu(bot, chatId);
    }
    
    else if (data === 'profile_add_photo') {
      state.setRegState(telegramId, state.REGISTRATION_STATES.WAITING_MEDIA);
      bot.sendMessage(chatId, '📸 Kirim foto profil baru:');
    }
    
    else if (data === 'profile_add_video') {
      state.setActionState(telegramId, state.ACTION_STATES.EDITING_PROFILE);
      state.updateTemp(telegramId, { editField: 'video' });
      bot.sendMessage(chatId, '🎬 Kirim video profil baru:');
    }
    
    // ============== EDIT PROFILE ==============
    else if (data.startsWith('edit_')) {
      const field = data.split('_')[1];
      profile.startEditField(bot, chatId, telegramId, field);
    }
    
    // ============== MESSAGES ==============
    else if (data === 'messages_inbox') {
      await messaging.showInbox(bot, chatId, telegramId);
    }
    
    else if (data.startsWith('msg_send_')) {
      const targetId = parseInt(data.split('_')[2]);
      await messaging.startSendMessage(bot, chatId, telegramId, targetId);
    }
    
    else if (data.startsWith('msg_cancel_')) {
      messaging.cancelMessage(bot, chatId, telegramId);
    }
    
    else if (data.startsWith('chat_')) {
      const targetId = parseInt(data.split('_')[1]);
      await messaging.showChat(bot, chatId, telegramId, targetId);
    }
    
    else if (data.startsWith('chat_send_')) {
      const targetId = parseInt(data.split('_')[2]);
      await messaging.startSendMessage(bot, chatId, telegramId, targetId);
    }
    
    // ============== VIP ==============
    else if (data === 'vip_menu') {
      premium.showVipMenu(bot, chatId, telegramId);
    }
    
    else if (data === 'vip_info') {
      premium.showVipInfo(bot, chatId);
    }
    
    else if (data === 'vip_buy') {
      premium.activateVip(bot, chatId, telegramId);
    }
    
    else if (data === 'demo_vip_activate') {
      premium.demoActivateVip(bot, chatId, telegramId);
    }
    
    else if (data === 'boost_activate') {
      premium.activateBoost(bot, chatId, telegramId);
    }
    
    // ============== ELITE ==============
    else if (data === 'elite_menu') {
      premium.showEliteMenu(bot, chatId, telegramId);
    }
    
    else if (data === 'elite_info') {
      premium.showEliteInfo(bot, chatId);
    }
    
    else if (data === 'elite_buy') {
      premium.activateElite(bot, chatId, telegramId);
    }
    
    else if (data === 'demo_elite_activate') {
      premium.demoActivateElite(bot, chatId, telegramId);
    }
    
    // ============== SETTINGS ==============
    else if (data === 'settings_menu') {
      profile.showSettingsMenu(bot, chatId);
    }
    
    else if (data === 'settings_edit_profile') {
      profile.showEditProfileMenu(bot, chatId);
    }
    
    else if (data === 'settings_edit_pref') {
      profile.showEditProfileMenu(bot, chatId);
    }
    
    else if (data === 'settings_blocked') {
      await profile.showBlockedUsers(bot, chatId, telegramId);
    }
    
    else if (data.startsWith('block_')) {
      const targetId = parseInt(data.split('_')[1]);
      profile.blockUser(bot, chatId, telegramId, targetId);
    }
    
    else if (data.startsWith('unblock_')) {
      const targetId = parseInt(data.split('_')[1]);
      profile.unblockUser(bot, chatId, telegramId, targetId);
    }
    
    else if (data.startsWith('report_')) {
      const parts = data.split('_');
      if (parts[1] === 'reason') {
        const reason = parts.slice(2).join('_');
        profile.submitReport(bot, chatId, telegramId, reason);
      } else if (parts[1] === 'cancel') {
        state.resetToIdle(telegramId);
        registration.showMainMenu(bot, chatId);
      } else {
        const targetId = parseInt(parts[1]);
        profile.reportUser(bot, chatId, telegramId, targetId);
      }
    }
    
    else if (data === 'settings_delete') {
      profile.confirmDeleteAccount(bot, chatId, telegramId);
    }
    
    // Confirm delete account
    else if (data.startsWith('confirm_delete_account_')) {
      profile.deleteAccount(bot, chatId, telegramId);
    }
    
    // Cancel delete account
    else if (data.startsWith('cancel_delete_account_')) {
      profile.showSettingsMenu(bot, chatId);
    }
    
    // ============== NOOP ==============
    else if (data === 'noop') {
      // Do nothing
    }
    
  } catch (error) {
    console.error('Callback error:', error);
    bot.sendMessage(chatId, '❌ Terjadi kesalahan. Coba lagi nanti.');
  }
});

// ============== ERROR HANDLING ==============

bot.on('polling_error', (error) => {
  console.error('Polling error:', error.message);
});

bot.on('webhook_error', (error) => {
  console.error('Webhook error:', error.message);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down...');
  bot.stopPolling();
  db.db.close();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Shutting down...');
  bot.stopPolling();
  db.db.close();
  process.exit(0);
});

console.log('✅ Bot Match is running!');
console.log('📱 Send /start to begin');
