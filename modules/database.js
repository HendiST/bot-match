/**
 * Database Module
 * SQLite Database Handler using sql.js (Pure JavaScript - Works on Termux/Android)
 */

const initSqlJs = require('sql.js');
const path = require('path');
const fs = require('fs');
const config = require('../config');

// Database instance
let db = null;
let SQL = null;

// Ensure data directory exists
const dataDir = path.join(__dirname, '..', 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, 'botmatch.db');

/**
 * Save database to file
 */
function saveDatabase() {
  if (db) {
    const data = db.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(dbPath, buffer);
  }
}

/**
 * Initialize Database
 */
async function initDatabase() {
  SQL = await initSqlJs();
  
  // Load existing database or create new one
  if (fs.existsSync(dbPath)) {
    const fileBuffer = fs.readFileSync(dbPath);
    db = new SQL.Database(fileBuffer);
  } else {
    db = new SQL.Database();
  }
  
  // Initialize tables
  initTables();
  
  // Auto-save every 5 seconds
  setInterval(saveDatabase, 5000);
  
  console.log('✅ Database initialized (sql.js - Pure JavaScript)');
  return db;
}

/**
 * Initialize Database Tables
 */
function initTables() {
  // Users Table
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      telegram_id INTEGER UNIQUE NOT NULL,
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
      vip_expired TEXT,
      elite_expired TEXT,
      boost_until TEXT,
      daily_likes INTEGER DEFAULT 0,
      daily_messages INTEGER DEFAULT 0,
      last_reset TEXT,
      last_action TEXT,
      is_banned INTEGER DEFAULT 0,
      is_blocked INTEGER DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Likes Table
  db.run(`
    CREATE TABLE IF NOT EXISTS likes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      target_id INTEGER NOT NULL,
      is_match INTEGER DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Messages Table
  db.run(`
    CREATE TABLE IF NOT EXISTS messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      from_id INTEGER NOT NULL,
      to_id INTEGER NOT NULL,
      pesan TEXT NOT NULL,
      media_type TEXT,
      media_id TEXT,
      is_read INTEGER DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Blocks Table
  db.run(`
    CREATE TABLE IF NOT EXISTS blocks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      blocked_id INTEGER NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Reports Table
  db.run(`
    CREATE TABLE IF NOT EXISTS reports (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      reporter_id INTEGER NOT NULL,
      reported_id INTEGER NOT NULL,
      reason TEXT,
      status TEXT DEFAULT 'pending',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // User Photos Table
  db.run(`
    CREATE TABLE IF NOT EXISTS user_photos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      photo_id TEXT NOT NULL,
      photo_url TEXT,
      position INTEGER DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // User Videos Table
  db.run(`
    CREATE TABLE IF NOT EXISTS user_videos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      video_id TEXT NOT NULL,
      position INTEGER DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  saveDatabase();
  console.log('✅ Database tables initialized');
}

// Helper function to convert values for SQLite
function toSQLiteValue(value) {
  if (value === null || value === undefined) {
    return null;
  }
  return value;
}

// Helper function to run query and get results
function queryAll(sql, params = []) {
  // Convert all params to safe values
  const safeParams = params.map(p => toSQLiteValue(p));
  
  const stmt = db.prepare(sql);
  if (safeParams.length > 0) {
    stmt.bind(safeParams);
  }
  const results = [];
  while (stmt.step()) {
    const row = stmt.getAsObject();
    results.push(row);
  }
  stmt.free();
  return results;
}

// Helper function to run query and get single result
function queryOne(sql, params = []) {
  const results = queryAll(sql, params);
  return results.length > 0 ? results[0] : null;
}

// Helper function to run insert/update/delete
function runQuery(sql, params = []) {
  // Convert all params to safe values
  const safeParams = params.map(p => toSQLiteValue(p));
  
  db.run(sql, safeParams);
  saveDatabase();
  
  // Get last insert rowid
  const result = db.exec("SELECT last_insert_rowid() as id");
  const lastId = result.length > 0 && result[0].values.length > 0 ? result[0].values[0][0] : null;
  return { lastInsertRowid: lastId };
}

// User Operations
const userOps = {
  create: (data) => {
    return runQuery(`
      INSERT INTO users (telegram_id, nama, umur, gender, preferensi, kota, bio, photo_id, video_id, photo_url, role, is_fake, vip_expired, elite_expired)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      data.telegram_id,
      data.nama || 'User',
      data.umur || 25,
      data.gender || 'Pria',
      data.preferensi || 'Semua',
      data.kota || 'Jakarta',
      data.bio || '',
      data.photo_id,
      data.video_id,
      data.photo_url,
      data.role || 'free',
      data.is_fake || 0,
      data.vip_expired,
      data.elite_expired
    ]);
  },

  getByTelegramId: (telegramId) => {
    return queryOne('SELECT * FROM users WHERE telegram_id = ?', [telegramId]);
  },

  getById: (id) => {
    return queryOne('SELECT * FROM users WHERE id = ?', [id]);
  },

  update: (data) => {
    return runQuery(`
      UPDATE users SET 
        nama = ?,
        umur = ?,
        gender = ?,
        preferensi = ?,
        kota = ?,
        bio = ?,
        photo_id = ?,
        video_id = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [
      data.nama || 'User',
      data.umur || 25,
      data.gender || 'Pria',
      data.preferensi || 'Semua',
      data.kota || 'Jakarta',
      data.bio || '',
      data.photo_id,
      data.video_id,
      data.id
    ]);
  },

  updateRole: (role, vipExpired, eliteExpired, id) => {
    return runQuery(`
      UPDATE users SET role = ?, vip_expired = ?, elite_expired = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?
    `, [role, vipExpired, eliteExpired, id]);
  },

  updateBoost: (boostUntil, id) => {
    return runQuery(`
      UPDATE users SET boost_until = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?
    `, [boostUntil, id]);
  },

  incrementLikes: (id) => {
    return runQuery(`
      UPDATE users SET daily_likes = daily_likes + 1, last_action = CURRENT_TIMESTAMP WHERE id = ?
    `, [id]);
  },

  incrementMessages: (id) => {
    return runQuery(`
      UPDATE users SET daily_messages = daily_messages + 1, last_action = CURRENT_TIMESTAMP WHERE id = ?
    `, [id]);
  },

  resetDailyLimits: () => {
    return runQuery(`
      UPDATE users SET daily_likes = 0, daily_messages = 0, last_reset = DATE('now') WHERE last_reset < DATE('now') OR last_reset IS NULL
    `);
  },

  countFake: () => {
    return queryOne('SELECT COUNT(*) as count FROM users WHERE is_fake = 1');
  },

  getFakeUsers: () => {
    return queryAll('SELECT * FROM users WHERE is_fake = 1');
  },

  banUser: (id) => {
    return runQuery('UPDATE users SET is_banned = 1 WHERE id = ?', [id]);
  },

  unbanUser: (id) => {
    return runQuery('UPDATE users SET is_banned = 0 WHERE id = ?', [id]);
  }
};

// Like Operations
const likeOps = {
  create: (userId, targetId, isMatch = 0) => {
    // Check if exists first
    const existing = queryOne('SELECT * FROM likes WHERE user_id = ? AND target_id = ?', [userId, targetId]);
    if (!existing) {
      return runQuery(`INSERT INTO likes (user_id, target_id, is_match) VALUES (?, ?, ?)`, [userId, targetId, isMatch]);
    }
    return existing;
  },

  getLike: (userId, targetId) => {
    return queryOne('SELECT * FROM likes WHERE user_id = ? AND target_id = ?', [userId, targetId]);
  },

  setMatch: (userId, targetId) => {
    return runQuery('UPDATE likes SET is_match = 1 WHERE user_id = ? AND target_id = ?', [userId, targetId]);
  },

  getLikedBy: (targetId) => {
    return queryAll(`
      SELECT l.*, u.* FROM likes l
      JOIN users u ON l.user_id = u.id
      WHERE l.target_id = ? AND l.is_match = 0 AND u.is_banned = 0
      ORDER BY l.created_at DESC
    `, [targetId]);
  },

  getMatches: (userId1, userId2) => {
    return queryAll(`
      SELECT u.* FROM likes l
      JOIN users u ON (
        (l.user_id = u.id AND l.target_id = ?) OR 
        (l.target_id = u.id AND l.user_id = ?)
      )
      WHERE l.is_match = 1 AND u.is_banned = 0
      GROUP BY u.id
      ORDER BY l.created_at DESC
    `, [userId1, userId2]);
  },

  checkMutual: (userId, targetId) => {
    return queryOne('SELECT * FROM likes WHERE user_id = ? AND target_id = ? AND is_match = 1', [userId, targetId]);
  },

  countLikesReceived: (targetId) => {
    return queryOne('SELECT COUNT(*) as count FROM likes WHERE target_id = ? AND is_match = 0', [targetId]);
  },

  delete: (userId, targetId) => {
    return runQuery('DELETE FROM likes WHERE user_id = ? AND target_id = ?', [userId, targetId]);
  }
};

// Message Operations
const msgOps = {
  create: (fromId, toId, pesan, mediaType, mediaId) => {
    return runQuery(`
      INSERT INTO messages (from_id, to_id, pesan, media_type, media_id)
      VALUES (?, ?, ?, ?, ?)
    `, [fromId, toId, pesan, mediaType, mediaId]);
  },

  getConversation: (fromId1, toId1, fromId2, toId2) => {
    return queryAll(`
      SELECT m.*, u.nama, u.photo_id, u.photo_url FROM messages m
      JOIN users u ON m.from_id = u.id
      WHERE (m.from_id = ? AND m.to_id = ?) OR (m.from_id = ? AND m.to_id = ?)
      ORDER BY m.created_at ASC
    `, [fromId1, toId1, fromId2, toId2]);
  },

  getInbox: (userId, userId2, userId3) => {
    return queryAll(`
      SELECT DISTINCT u.id, u.nama, u.umur, u.kota, u.photo_id, u.photo_url, m.pesan, m.created_at as last_message FROM messages m
      JOIN users u ON (
        CASE 
          WHEN m.from_id = ? THEN m.to_id = u.id
          ELSE m.from_id = u.id
        END
      )
      WHERE (m.from_id = ? OR m.to_id = ?) AND u.is_banned = 0
      GROUP BY u.id
      ORDER BY m.created_at DESC
    `, [userId, userId2, userId3]);
  },

  markRead: (toId, fromId) => {
    return runQuery('UPDATE messages SET is_read = 1 WHERE to_id = ? AND from_id = ?', [toId, fromId]);
  },

  countUnread: (toId) => {
    return queryOne('SELECT COUNT(*) as count FROM messages WHERE to_id = ? AND is_read = 0', [toId]);
  }
};

// Block Operations
const blockOps = {
  block: (userId, blockedId) => {
    const existing = queryOne('SELECT * FROM blocks WHERE user_id = ? AND blocked_id = ?', [userId, blockedId]);
    if (!existing) {
      return runQuery('INSERT INTO blocks (user_id, blocked_id) VALUES (?, ?)', [userId, blockedId]);
    }
    return existing;
  },

  unblock: (userId, blockedId) => {
    return runQuery('DELETE FROM blocks WHERE user_id = ? AND blocked_id = ?', [userId, blockedId]);
  },

  getBlocked: (userId) => {
    return queryAll(`
      SELECT u.* FROM blocks b
      JOIN users u ON b.blocked_id = u.id
      WHERE b.user_id = ?
    `, [userId]);
  },

  isBlocked: (userId1, userId2) => {
    return queryOne('SELECT * FROM blocks WHERE (user_id = ? AND blocked_id = ?) OR (user_id = ? AND blocked_id = ?)', [userId1, userId2, userId2, userId1]);
  }
};

// Report Operations
const reportOps = {
  create: (reporterId, reportedId, reason) => {
    return runQuery('INSERT INTO reports (reporter_id, reported_id, reason) VALUES (?, ?, ?)', [reporterId, reportedId, reason]);
  },

  getReports: () => {
    return queryAll(`
      SELECT r.*, 
        u1.nama as reporter_name, u1.telegram_id as reporter_telegram,
        u2.nama as reported_name, u2.telegram_id as reported_telegram
      FROM reports r
      JOIN users u1 ON r.reporter_id = u1.id
      JOIN users u2 ON r.reported_id = u2.id
      WHERE r.status = 'pending'
      ORDER BY r.created_at DESC
    `);
  },

  resolve: (id) => {
    return runQuery("UPDATE reports SET status = 'resolved' WHERE id = ?", [id]);
  }
};

// Photo Operations
const photoOps = {
  add: (userId, photoId, photoUrl, position) => {
    return runQuery('INSERT INTO user_photos (user_id, photo_id, photo_url, position) VALUES (?, ?, ?, ?)', [userId, photoId, photoUrl, position]);
  },

  getByUser: (userId) => {
    return queryAll('SELECT * FROM user_photos WHERE user_id = ? ORDER BY position', [userId]);
  },

  delete: (id) => {
    return runQuery('DELETE FROM user_photos WHERE id = ?', [id]);
  },

  deleteByUser: (userId) => {
    return runQuery('DELETE FROM user_photos WHERE user_id = ?', [userId]);
  }
};

// Video Operations
const videoOps = {
  add: (userId, videoId, position) => {
    return runQuery('INSERT INTO user_videos (user_id, video_id, position) VALUES (?, ?, ?)', [userId, videoId, position]);
  },

  getByUser: (userId) => {
    return queryAll('SELECT * FROM user_videos WHERE user_id = ? ORDER BY position', [userId]);
  },

  delete: (id) => {
    return runQuery('DELETE FROM user_videos WHERE id = ?', [id]);
  },

  deleteByUser: (userId) => {
    return runQuery('DELETE FROM user_videos WHERE user_id = ?', [userId]);
  }
};

// Search for potential matches
function searchUsers(userId, excludeIds = [], limit = 10) {
  const user = userOps.getById(userId);
  if (!user) return [];

  const excludeList = excludeIds.length > 0 ? excludeIds.join(',') : '0';
  
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
      AND (u.photo_id IS NOT NULL OR u.photo_url IS NOT NULL)
    ORDER BY priority ASC, RANDOM()
    LIMIT ?
  `;

  return queryAll(query, [userId, limit]);
}

// Get liked user IDs
function getLikedUserIds(userId) {
  const results = queryAll('SELECT target_id FROM likes WHERE user_id = ?', [userId]);
  return results.map(r => r.target_id);
}

module.exports = {
  initDatabase,
  saveDatabase,
  queryAll,
  queryOne,
  runQuery,
  userOps,
  likeOps,
  msgOps,
  blockOps,
  reportOps,
  photoOps,
  videoOps,
  searchUsers,
  getLikedUserIds
};
