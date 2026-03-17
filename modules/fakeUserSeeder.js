/**
 * Fake User Seeder Module
 * Generates fake users for the dating bot
 */

const { faker } = require('@faker-js/faker/locale/id_ID');
const axios = require('axios');
const path = require('path');
const fs = require('fs');
const config = require('../config');
const db = require('./database');

// Indonesian names
const indonesianMaleNames = [
  'Budi', 'Andi', 'Rudi', 'Eko', 'Agus', 'Dodi', 'Wahyu', 'Adi', 'Bayu', 'Rizki',
  'Dimas', 'Fajar', 'Gilang', 'Hendra', 'Irfan', 'Joko', 'Kevin', 'Leo', 'Mahendra', 'Nanda',
  'Oscar', 'Putra', 'Rendi', 'Satria', 'Teguh', 'Umar', 'Vino', 'Wisnu', 'Yoga', 'Zaki',
  'Arif', 'Benny', 'Chandra', 'Dewa', 'Evan', 'Farhan', 'Galih', 'Hadi', 'Ilham', 'Johan'
];

const indonesianFemaleNames = [
  'Siti', 'Dewi', 'Rina', 'Maya', 'Wati', 'Sari', 'Putri', 'Lestari', 'Wulan', 'Sri',
  'Fitri', 'Indah', 'Jasmine', 'Kartika', 'Linda', 'Mega', 'Nadia', 'Oktavia', 'Putu', 'Ratna',
  'Shinta', 'Tika', 'Umi', 'Vera', 'Winda', 'Yanti', 'Zahra', 'Anita', 'Bella', 'Citra',
  'Diana', 'Eka', 'Fani', 'Gita', 'Hana', 'Ida', 'Julia', 'Kirana', 'Lina', 'Mira'
];

// Indonesian bios
const indonesianBios = [
  'Suka traveling dan fotografi 📸',
  'Pecinta kopi dan buku ☕📚',
  'Movie addict, Netflix enthusiast 🎬',
  'Suka petualangan dan hal baru 🌍',
  'Foodie, suka kulineran bareng 🍜',
  'Musik adalah hidup saya 🎵',
  'Suka olahraga dan hidup sehat 💪',
  'Introvert yang suka kedai kopi ☕',
  'Optimis dan suka tertawa 😄',
  'Suka alam dan mendaki gunung 🏔️',
  'Hobi memasak dan mencoba resep baru 👨‍🍳',
  'Gamer yang juga suka outdoor 🎮',
  'Penikmat seni dan budaya 🎨',
  'Suka hewan peliharaan 🐱🐶',
  'Pembaca buku yang rajin 📖',
  'Suka pantai dan sunset 🌅',
  'Tech enthusiast dan kreator 💻',
  'Suka festival musik dan konser 🎸',
  'Morning person, suka jogging pagi 🏃',
  'Suka belajar hal baru 📚'
];

/**
 * Get random Indonesian name
 */
function getRandomName(gender) {
  const names = gender === 'Pria' ? indonesianMaleNames : indonesianFemaleNames;
  return names[Math.floor(Math.random() * names.length)];
}

/**
 * Get random bio
 */
function getRandomBio() {
  return indonesianBios[Math.floor(Math.random() * indonesianBios.length)];
}

/**
 * Generate random user data
 */
function generateRandomUser() {
  const gender = Math.random() > 0.5 ? 'Pria' : 'Wanita';
  const name = getRandomName(gender);
  const age = Math.floor(Math.random() * 25) + 18; // 18-42
  const preferences = ['Pria', 'Wanita', 'Semua'];
  const preference = preferences[Math.floor(Math.random() * preferences.length)];
  const city = config.CITIES[Math.floor(Math.random() * config.CITIES.length)];
  const bio = getRandomBio();
  
  return {
    nama: name,
    umur: age,
    gender,
    preferensi: preference,
    kota: city,
    bio
  };
}

/**
 * Fetch random photo from API
 */
async function fetchRandomPhoto(gender) {
  try {
    // Use randomuser.me API for more realistic photos
    const genderParam = gender === 'Pria' ? 'male' : 'female';
    const response = await axios.get(`https://randomuser.me/api/?gender=${genderParam}&inc=picture`, {
      timeout: 5000
    });
    
    if (response.data && response.data.results && response.data.results[0]) {
      return response.data.results[0].picture.large;
    }
  } catch (error) {
    console.log('randomuser.me failed, trying pravatar.cc');
  }
  
  // Fallback to pravatar.cc
  const randomId = Math.floor(Math.random() * 70) + 1;
  return `https://i.pravatar.cc/400?img=${randomId}`;
}

/**
 * Download photo to local storage
 */
async function downloadPhoto(url, filename) {
  try {
    const response = await axios({
      url,
      method: 'GET',
      responseType: 'arraybuffer',
      timeout: 10000
    });
    
    const assetsDir = path.join(__dirname, '..', 'assets', 'fake_users');
    if (!fs.existsSync(assetsDir)) {
      fs.mkdirSync(assetsDir, { recursive: true });
    }
    
    const filepath = path.join(assetsDir, filename);
    fs.writeFileSync(filepath, response.data);
    
    return filepath;
  } catch (error) {
    console.error(`Failed to download photo: ${error.message}`);
    return null;
  }
}

/**
 * Create a fake user in database
 */
async function createFakeUser(bot = null) {
  const userData = generateRandomUser();
  
  // Try to get photo URL
  let photoUrl = null;
  try {
    photoUrl = await fetchRandomPhoto(userData.gender);
  } catch (error) {
    console.log('Failed to fetch photo URL');
  }
  
  const telegramId = -Math.floor(Math.random() * 1000000000) - 1; // Negative IDs for fake users
  
  try {
    const result = db.userOps.create.run({
      telegram_id: telegramId,
      nama: userData.nama,
      umur: userData.umur,
      gender: userData.gender,
      preferensi: userData.preferensi,
      kota: userData.kota,
      bio: userData.bio,
      photo_id: null,
      video_id: null,
      photo_url: photoUrl,
      role: 'free',
      is_fake: 1,
      vip_expired: null,
      elite_expired: null
    });
    
    return {
      id: result.lastInsertRowid,
      ...userData,
      photo_url: photoUrl,
      is_fake: true
    };
  } catch (error) {
    console.error(`Failed to create fake user: ${error.message}`);
    return null;
  }
}

/**
 * Seed fake users
 */
async function seedFakeUsers(count = null, bot = null) {
  if (!count) {
    count = Math.floor(Math.random() * (config.FAKE_USER.maxCount - config.FAKE_USER.minCount + 1)) + config.FAKE_USER.minCount;
  }
  
  console.log(`🌱 Seeding ${count} fake users...`);
  
  const existingFakeCount = db.userOps.countFake.get().count;
  const neededCount = count - existingFakeCount;
  
  if (neededCount <= 0) {
    console.log(`✅ Already have ${existingFakeCount} fake users`);
    return;
  }
  
  let created = 0;
  for (let i = 0; i < neededCount; i++) {
    try {
      const user = await createFakeUser(bot);
      if (user) {
        created++;
        process.stdout.write(`\r✅ Created ${created}/${neededCount} fake users`);
      }
    } catch (error) {
      console.error(`\nError creating fake user: ${error.message}`);
    }
    
    // Small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  console.log(`\n🎉 Successfully created ${created} fake users!`);
}

/**
 * Auto-like back system
 */
async function autoLikeBack(bot, userId) {
  // Get all fake users
  const fakeUsers = db.userOps.getFakeUsers.all();
  
  for (const fakeUser of fakeUsers) {
    // Random chance to like back
    if (Math.random() > config.FAKE_USER.autoLikeChance) continue;
    
    // Check if already liked
    const existingLike = db.likeOps.getLike.get(fakeUser.id, userId);
    if (existingLike) continue;
    
    // Random delay
    const delay = Math.floor(
      Math.random() * (config.FAKE_USER.autoLikeDelayMax - config.FAKE_USER.autoLikeDelayMin + 1)
    ) + config.FAKE_USER.autoLikeDelayMin;
    
    setTimeout(async () => {
      try {
        // Check if user liked the fake user first
        const userLike = db.likeOps.getLike.get(userId, fakeUser.id);
        
        if (userLike) {
          // Create match
          db.likeOps.create.run(fakeUser.id, userId, 1);
          db.likeOps.setMatch.run(userId, fakeUser.id);
          
          // Notify user about match
          const user = db.userOps.getById.get(userId);
          if (user && bot) {
            try {
              await bot.sendMessage(
                user.telegram_id,
                `🎉 *MATCH!*\n\nKamu match dengan *${fakeUser.nama}* (${fakeUser.umur}) dari ${fakeUser.kota}!\n\nMau mulai chat?`,
                {
                  parse_mode: 'Markdown',
                  reply_markup: {
                    inline_keyboard: [
                      [{ text: '💬 Mulai Chat', callback_data: `chat_${fakeUser.id}` }],
                      [{ text: '🔍 Lanjut Cari', callback_data: 'search_start' }]
                    ]
                  }
                }
              );
            } catch (e) {
              // User may have blocked the bot
            }
          }
        }
      } catch (error) {
        console.error('Auto-like error:', error.message);
      }
    }, delay);
  }
}

/**
 * Auto-send message from fake user
 */
async function autoSendMessage(bot, userId, fakeUser = null) {
  // Select random fake user if not provided
  if (!fakeUser) {
    const fakeUsers = db.userOps.getFakeUsers.all();
    fakeUser = fakeUsers[Math.floor(Math.random() * fakeUsers.length)];
  }
  
  if (!fakeUser) return;
  
  // Random chance to send message
  if (Math.random() > config.FAKE_USER.autoMessageChance) return;
  
  // Random delay
  const delay = Math.floor(
    Math.random() * (config.FAKE_USER.autoMessageDelayMax - config.FAKE_USER.autoMessageDelayMin + 1)
  ) + config.FAKE_USER.autoMessageDelayMin;
  
  setTimeout(async () => {
    try {
      const user = db.userOps.getById.get(userId);
      if (!user || !bot) return;
      
      // Select random message
      const message = config.FAKE_MESSAGES[Math.floor(Math.random() * config.FAKE_MESSAGES.length)];
      
      // Save message to database
      db.msgOps.create.run(fakeUser.id, userId, message, null, null);
      
      // Send notification to user
      try {
        await bot.sendMessage(
          user.telegram_id,
          `💌 *Pesan Baru dari ${fakeUser.nama}!*\n\n"${message}"`,
          {
            parse_mode: 'Markdown',
            reply_markup: {
              inline_keyboard: [
                [{ text: '💬 Balas', callback_data: `chat_${fakeUser.id}` }],
                [{ text: '🏠 Menu Utama', callback_data: 'main_menu' }]
              ]
            }
          }
        );
      } catch (e) {
        // User may have blocked the bot
      }
    } catch (error) {
      console.error('Auto-message error:', error.message);
    }
  }, delay);
}

/**
 * Initialize fake user system
 */
async function initFakeUserSystem(bot = null) {
  console.log('🤖 Initializing fake user system...');
  await seedFakeUsers(null, bot);
  console.log('✅ Fake user system ready!');
}

module.exports = {
  generateRandomUser,
  fetchRandomPhoto,
  createFakeUser,
  seedFakeUsers,
  autoLikeBack,
  autoSendMessage,
  initFakeUserSystem
};
