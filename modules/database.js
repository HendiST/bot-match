/**
 * Database Module
 * SQLite Database Handler using better-sqlite3
 */

const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');
const config = require('../config');

// Ensure data directory exists
const dataDir = path.join(__dirname, '..', 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, 'botmatch.db');
const db = new Database(dbPath);

// Enable foreign keys
db.pragma('foreign_keys = ON');

/**
 * Initialize Database Tables
 */
function initTables() {
  // Users Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      telegram_id BIGINT UNIQUE NOT NULL,
      nama TEXT NOT NULL,
      umur INTEGER NOT NULL,
      gender TEXT NOT NULL,
      preferensi TEXT NOT NULL,
      kota TEXT NOT NULL,
      bio TEXT,
      photo_id TEXT,
      video_id TEXT,
      photo_url TEXT,
      role TEXT DEFAULT 'free',
      is_fake INTEGER DEFAULT 0,
      vip_expired DATETIME,
      elite_expired DATETIME,
      boost_until DATETIME,
      daily_likes INTEGER DEFAULT 0,
      daily_messages INTEGER DEFAULT 0,
      last_reset DATE,
      last_action DATETIME,
      is_banned INTEGER DEFAULT 0,
      is_blocked INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Likes Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS likes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      target_id INTEGER NOT NULL,
      is_match INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (target_id) REFERENCES users(id),
      UNIQUE(user_id, target_id)
    )
  `);

  // Messages Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      from_id INTEGER NOT NULL,
      to_id INTEGER NOT NULL,
      pesan TEXT NOT NULL,
      media_type TEXT,
      media_id TEXT,
      is_read INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (from_id) REFERENCES users(id),
      FOREIGN KEY (to_id) REFERENCES users(id)
    )
  `);

  // Blocks Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS blocks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      blocked_id INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (blocked_id) REFERENCES users(id),
      UNIQUE(user_id, blocked_id)
    )
  `);

  // Reports Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS reports (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      reporter_id INTEGER NOT NULL,
      reported_id INTEGER NOT NULL,
      reason TEXT,
      status TEXT DEFAULT 'pending',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (reporter_id) REFERENCES users(id),
      FOREIGN KEY (reported_id) REFERENCES users(id)
    )
  `);

  // User Photos Table (for multiple photos)
  db.exec(`
    CREATE TABLE IF NOT EXISTS user_photos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      photo_id TEXT NOT NULL,
      photo_url TEXT,
      position INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);

  // User Videos Table (for multiple videos)
  db.exec(`
    CREATE TABLE IF NOT EXISTS user_videos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      video_id TEXT NOT NULL,
      position INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);

  // Create indexes for better performance
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_users_telegram_id ON users(telegram_id);
    CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
    CREATE INDEX IF NOT EXISTS idx_users_is_fake ON users(is_fake);
    CREATE INDEX IF NOT EXISTS idx_users_kota ON users(kota);
    CREATE INDEX IF NOT EXISTS idx_likes_user_id ON likes(user_id);
    CREATE INDEX IF NOT EXISTS idx_likes_target_id ON likes(target_id);
    CREATE INDEX IF NOT EXISTS idx_likes_match ON likes(is_match);
    CREATE INDEX IF NOT EXISTS idx_messages_from ON messages(from_id);
    CREATE INDEX IF NOT EXISTS idx_messages_to ON messages(to_id);
  `);

  console.log('✅ Database tables initialized');
}

// User Operations
const userOps = {
  // Create new user
  create: db.prepare(`
    INSERT INTO users (telegram_id, nama, umur, gender, preferensi, kota, bio, photo_id, video_id, photo_url, role, is_fake, vip_expired, elite_expired)
    VALUES (@telegram_id, @nama, @umur, @gender, @preferensi, @kota, @bio, @photo_id, @video_id, @photo_url, @role, @is_fake, @vip_expired, @elite_expired)
  `),

  // Get user by telegram_id
  getByTelegramId: db.prepare(`
    SELECT * FROM users WHERE telegram_id = ?
  `),

  // Get user by id
  getById: db.prepare(`
    SELECT * FROM users WHERE id = ?
  `),

  // Update user
  update: db.prepare(`
    UPDATE users SET 
      nama = @nama,
      umur = @umur,
      gender = @gender,
      preferensi = @preferensi,
      kota = @kota,
      bio = @bio,
      photo_id = @photo_id,
      video_id = @video_id,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = @id
  `),

  // Update role
  updateRole: db.prepare(`
    UPDATE users SET role = ?, vip_expired = ?, elite_expired = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?
  `),

  // Update boost
  updateBoost: db.prepare(`
    UPDATE users SET boost_until = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?
  `),

  // Increment daily likes
  incrementLikes: db.prepare(`
    UPDATE users SET daily_likes = daily_likes + 1, last_action = CURRENT_TIMESTAMP WHERE id = ?
  `),

  // Increment daily messages
  incrementMessages: db.prepare(`
    UPDATE users SET daily_messages = daily_messages + 1, last_action = CURRENT_TIMESTAMP WHERE id = ?
  `),

  // Reset daily limits
  resetDailyLimits: db.prepare(`
    UPDATE users SET daily_likes = 0, daily_messages = 0, last_reset = DATE('now') WHERE last_reset < DATE('now') OR last_reset IS NULL
  `),

  // Count fake users
  countFake: db.prepare(`
    SELECT COUNT(*) as count FROM users WHERE is_fake = 1
  `),

  // Get all fake users
  getFakeUsers: db.prepare(`
    SELECT * FROM users WHERE is_fake = 1
  `),

  // Ban user
  banUser: db.prepare(`
    UPDATE users SET is_banned = 1 WHERE id = ?
  `),

  // Unban user
  unbanUser: db.prepare(`
    UPDATE users SET is_banned = 0 WHERE id = ?
  `)
};

// Like Operations
const likeOps = {
  // Create like
  create: db.prepare(`
    INSERT OR IGNORE INTO likes (user_id, target_id, is_match)
    VALUES (?, ?, ?)
  `),

  // Get like
  getLike: db.prepare(`
    SELECT * FROM likes WHERE user_id = ? AND target_id = ?
  `),

  // Update to match
  setMatch: db.prepare(`
    UPDATE likes SET is_match = 1 WHERE user_id = ? AND target_id = ?
  `),

  // Get users who liked current user
  getLikedBy: db.prepare(`
    SELECT l.*, u.* FROM likes l
    JOIN users u ON l.user_id = u.id
    WHERE l.target_id = ? AND l.is_match = 0 AND u.is_banned = 0
    ORDER BY l.created_at DESC
  `),

  // Get matches
  getMatches: db.prepare(`
    SELECT u.* FROM likes l
    JOIN users u ON (
      (l.user_id = u.id AND l.target_id = ?) OR 
      (l.target_id = u.id AND l.user_id = ?)
    )
    WHERE l.is_match = 1 AND u.is_banned = 0
    GROUP BY u.id
    ORDER BY l.created_at DESC
  `),

  // Check mutual like
  checkMutual: db.prepare(`
    SELECT * FROM likes WHERE user_id = ? AND target_id = ? AND is_match = 1
  `),

  // Count likes received
  countLikesReceived: db.prepare(`
    SELECT COUNT(*) as count FROM likes WHERE target_id = ? AND is_match = 0
  `),

  // Delete like
  delete: db.prepare(`
    DELETE FROM likes WHERE user_id = ? AND target_id = ?
  `)
};

// Message Operations
const msgOps = {
  // Create message
  create: db.prepare(`
    INSERT INTO messages (from_id, to_id, pesan, media_type, media_id)
    VALUES (?, ?, ?, ?, ?)
  `),

  // Get conversation
  getConversation: db.prepare(`
    SELECT m.*, u.nama, u.photo_id, u.photo_url FROM messages m
    JOIN users u ON m.from_id = u.id
    WHERE (m.from_id = ? AND m.to_id = ?) OR (m.from_id = ? AND m.to_id = ?)
    ORDER BY m.created_at ASC
  `),

  // Get inbox
  getInbox: db.prepare(`
    SELECT DISTINCT u.*, m.pesan, m.created_at as last_message FROM messages m
    JOIN users u ON (
      CASE 
        WHEN m.from_id = ? THEN m.to_id = u.id
        ELSE m.from_id = u.id
      END
    )
    WHERE (m.from_id = ? OR m.to_id = ?) AND u.is_banned = 0
    GROUP BY u.id
    ORDER BY m.created_at DESC
  `),

  // Mark as read
  markRead: db.prepare(`
    UPDATE messages SET is_read = 1 WHERE to_id = ? AND from_id = ?
  `),

  // Count unread
  countUnread: db.prepare(`
    SELECT COUNT(*) as count FROM messages WHERE to_id = ? AND is_read = 0
  `)
};

// Block Operations
const blockOps = {
  // Block user
  block: db.prepare(`
    INSERT OR IGNORE INTO blocks (user_id, blocked_id) VALUES (?, ?)
  `),

  // Unblock user
  unblock: db.prepare(`
    DELETE FROM blocks WHERE user_id = ? AND blocked_id = ?
  `),

  // Get blocked users
  getBlocked: db.prepare(`
    SELECT u.* FROM blocks b
    JOIN users u ON b.blocked_id = u.id
    WHERE b.user_id = ?
  `),

  // Check if blocked
  isBlocked: db.prepare(`
    SELECT * FROM blocks WHERE (user_id = ? AND blocked_id = ?) OR (user_id = ? AND blocked_id = ?)
  `)
};

// Report Operations
const reportOps = {
  // Create report
  create: db.prepare(`
    INSERT INTO reports (reporter_id, reported_id, reason) VALUES (?, ?, ?)
  `),

  // Get reports
  getReports: db.prepare(`
    SELECT r.*, 
      u1.nama as reporter_name, u1.telegram_id as reporter_telegram,
      u2.nama as reported_name, u2.telegram_id as reported_telegram
    FROM reports r
    JOIN users u1 ON r.reporter_id = u1.id
    JOIN users u2 ON r.reported_id = u2.id
    WHERE r.status = 'pending'
    ORDER BY r.created_at DESC
  `),

  // Resolve report
  resolve: db.prepare(`
    UPDATE reports SET status = 'resolved' WHERE id = ?
  `)
};

// Photo Operations
const photoOps = {
  // Add photo
  add: db.prepare(`
    INSERT INTO user_photos (user_id, photo_id, photo_url, position) VALUES (?, ?, ?, ?)
  `),

  // Get photos
  getByUser: db.prepare(`
    SELECT * FROM user_photos WHERE user_id = ? ORDER BY position
  `),

  // Delete photo
  delete: db.prepare(`
    DELETE FROM user_photos WHERE id = ?
  `),

  // Delete all user photos
  deleteByUser: db.prepare(`
    DELETE FROM user_photos WHERE user_id = ?
  `)
};

// Video Operations
const videoOps = {
  // Add video
  add: db.prepare(`
    INSERT INTO user_videos (user_id, video_id, position) VALUES (?, ?, ?)
  `),

  // Get videos
  getByUser: db.prepare(`
    SELECT * FROM user_videos WHERE user_id = ? ORDER BY position
  `),

  // Delete video
  delete: db.prepare(`
    DELETE FROM user_videos WHERE id = ?
  `),

  // Delete all user videos
  deleteByUser: db.prepare(`
    DELETE FROM user_videos WHERE user_id = ?
  `)
};

// Search for potential matches
function searchUsers(userId, excludeIds = [], limit = 10) {
  const user = userOps.getById.get(userId);
  if (!user) return [];

  const excludeList = excludeIds.length > 0 ? excludeIds.join(',') : '0';
  
  // Build priority query
  const query = `
    SELECT u.*,
      CASE 
        WHEN u.role = 'elite' AND u.elite_expired > datetime('now') THEN 1
        WHEN u.role = 'vip' AND u.boost_until > datetime('now') THEN 2
        WHEN u.role = 'vip' AND u.vip_expired > datetime('now') THEN 3
        WHEN u.is_fake = 1 THEN 4
        ELSE 5
      END as priority
    FROM users u
    WHERE u.id != ?
      AND u.is_banned = 0
      AND u.id NOT IN (${excludeList})
      AND u.photo_id IS NOT NULL
      AND (
        -- Gender preference match
        (u.preferensi = ? OR u.preferensi = 'Semua')
        OR ? = 'elite'
      )
      AND (
        -- City match (optional, can be relaxed)
        u.kota = ?
        OR ? = 'elite'
      )
    ORDER BY priority ASC, RANDOM()
    LIMIT ?
  `;

  return db.prepare(query).all(
    userId,
    user.gender,
    user.role,
    user.kota,
    user.role,
    limit
  );
}

module.exports = {
  db,
  initTables,
  userOps,
  likeOps,
  msgOps,
  blockOps,
  reportOps,
  photoOps,
  videoOps,
  searchUsers
};
