/**
 * Keyboard Builder Module
 * Creates inline keyboards for all interactions
 */

const config = require('../config');

/**
 * Main Menu Keyboard
 */
function mainMenu() {
  return {
    inline_keyboard: [
      [
        { text: '💘 Cari Pasangan', callback_data: 'search_start' }
      ],
      [
        { text: '👤 Profil Saya', callback_data: 'profile_view' },
        { text: '❤️ Match Saya', callback_data: 'matches_view' }
      ],
      [
        { text: '👀 Siapa Suka Saya', callback_data: 'likes_view' },
        { text: '💌 Pesan', callback_data: 'messages_inbox' }
      ],
      [
        { text: '⭐ VIP', callback_data: 'vip_menu' },
        { text: '👑 Elite', callback_data: 'elite_menu' }
      ],
      [
        { text: '⚙️ Pengaturan', callback_data: 'settings_menu' }
      ]
    ]
  };
}

/**
 * Age Selection Keyboard
 */
function ageSelection() {
  const keyboard = [];
  const row1 = [];
  const row2 = [];
  const row3 = [];
  
  for (let age = 18; age <= 35; age += 1) {
    if (row1.length < 6) {
      row1.push({ text: `${age}`, callback_data: `reg_age_${age}` });
    } else if (row2.length < 6) {
      row2.push({ text: `${age}`, callback_data: `reg_age_${age}` });
    } else if (row3.length < 6) {
      row3.push({ text: `${age}`, callback_data: `reg_age_${age}` });
    }
  }
  
  keyboard.push(row1, row2, row3);
  
  // Add older ages
  const row4 = [];
  [36, 40, 45, 50, 55, 60].forEach(age => {
    row4.push({ text: `${age}`, callback_data: `reg_age_${age}` });
  });
  keyboard.push(row4);
  
  return { inline_keyboard: keyboard };
}

/**
 * Gender Selection Keyboard
 */
function genderSelection() {
  return {
    inline_keyboard: [
      [
        { text: '👨 Pria', callback_data: 'reg_gender_pria' },
        { text: '👩 Wanita', callback_data: 'reg_gender_wanita' }
      ]
    ]
  };
}

/**
 * Preference Selection Keyboard
 */
function preferenceSelection() {
  return {
    inline_keyboard: [
      [
        { text: '👨 Pria', callback_data: 'reg_pref_pria' },
        { text: '👩 Wanita', callback_data: 'reg_pref_wanita' }
      ],
      [
        { text: '👫 Semua', callback_data: 'reg_pref_semua' }
      ]
    ]
  };
}

/**
 * City Selection Keyboard
 */
function citySelection(cities = config.CITIES) {
  const keyboard = [];
  
  for (let i = 0; i < cities.length; i += 2) {
    const row = [];
    row.push({ text: cities[i], callback_data: `reg_city_${i}` });
    if (cities[i + 1]) {
      row.push({ text: cities[i + 1], callback_data: `reg_city_${i + 1}` });
    }
    keyboard.push(row);
  }
  
  return { inline_keyboard: keyboard };
}

/**
 * Profile View Keyboard
 */
function profileView(isOwn = true, userId = null) {
  if (isOwn) {
    return {
      inline_keyboard: [
        [
          { text: '✏️ Edit Profil', callback_data: 'profile_edit' },
          { text: '📸 Tambah Foto', callback_data: 'profile_add_photo' }
        ],
        [
          { text: '🎬 Tambah Video', callback_data: 'profile_add_video' }
        ],
        [
          { text: '🏠 Menu Utama', callback_data: 'main_menu' }
        ]
      ]
    };
  }
  
  return {
    inline_keyboard: [
      [
        { text: '👍 Like', callback_data: `like_${userId}` },
        { text: '❌ Skip', callback_data: `skip_${userId}` }
      ],
      [
        { text: '💌 Kirim Pesan', callback_data: `msg_send_${userId}` },
        { text: '⚠️ Laporkan', callback_data: `report_${userId}` }
      ],
      [
        { text: '🏠 Menu Utama', callback_data: 'main_menu' }
      ]
    ]
  };
}

/**
 * Search Result Keyboard
 */
function searchResult(userId, hasLiked = false) {
  if (hasLiked) {
    return {
      inline_keyboard: [
        [
          { text: '✅ Sudah Disukai', callback_data: 'noop' },
          { text: '❌ Lewati', callback_data: `skip_${userId}` }
        ],
        [
          { text: '💌 Kirim Pesan', callback_data: `msg_send_${userId}` }
        ],
        [
          { text: '🔍 Lanjut Cari', callback_data: 'search_next' },
          { text: '🏠 Menu Utama', callback_data: 'main_menu' }
        ]
      ]
    };
  }
  
  return {
    inline_keyboard: [
      [
        { text: '👍 Like', callback_data: `like_${userId}` },
        { text: '❌ Skip', callback_data: `skip_${userId}` }
      ],
      [
        { text: '💌 Kirim Pesan', callback_data: `msg_send_${userId}` }
      ],
      [
        { text: '🔍 Lanjut Cari', callback_data: 'search_next' },
        { text: '🏠 Menu Utama', callback_data: 'main_menu' }
      ]
    ]
  };
}

/**
 * Match View Keyboard
 */
function matchView(userId) {
  return {
    inline_keyboard: [
      [
        { text: '💬 Chat', callback_data: `chat_${userId}` }
      ],
      [
        { text: '👤 Lihat Profil', callback_data: `view_${userId}` }
      ],
      [
        { text: '⬅️ Kembali', callback_data: 'matches_view' }
      ]
    ]
  };
}

/**
 * Likes View Keyboard
 */
function likesView(userId) {
  return {
    inline_keyboard: [
      [
        { text: '❤️ Like Balik', callback_data: `like_back_${userId}` },
        { text: '❌ Tolak', callback_data: `reject_${userId}` }
      ],
      [
        { text: '👤 Lihat Profil', callback_data: `view_${userId}` }
      ],
      [
        { text: '⬅️ Kembali', callback_data: 'main_menu' }
      ]
    ]
  };
}

/**
 * VIP Menu Keyboard
 */
function vipMenu(isVip = false, hasBoost = false) {
  if (isVip) {
    const keyboard = [
      [{ text: '🚀 Boost Profil', callback_data: 'boost_activate' }],
      [{ text: '⬅️ Kembali', callback_data: 'main_menu' }]
    ];
    
    if (hasBoost) {
      keyboard[0] = [{ text: '🔥 Boost Aktif', callback_data: 'noop' }];
    }
    
    return { inline_keyboard: keyboard };
  }
  
  return {
    inline_keyboard: [
      [
        { text: '💎 Beli VIP (Rp 50.000)', callback_data: 'vip_buy' }
      ],
      [
        { text: 'ℹ️ Keuntungan VIP', callback_data: 'vip_info' }
      ],
      [
        { text: '⬅️ Kembali', callback_data: 'main_menu' }
      ]
    ]
  };
}

/**
 * Elite Menu Keyboard
 */
function eliteMenu(isElite = false) {
  if (isElite) {
    return {
      inline_keyboard: [
        [
          { text: '👑 Status Elite Aktif', callback_data: 'noop' }
        ],
        [
          { text: '⬅️ Kembali', callback_data: 'main_menu' }
        ]
      ]
    };
  }
  
  return {
    inline_keyboard: [
      [
        { text: '💎 BeliElite (Rp 150.000)', callback_data: 'elite_buy' }
      ],
      [
        { text: 'ℹ️ Keuntungan Elite', callback_data: 'elite_info' }
      ],
      [
        { text: '⬅️ Kembali', callback_data: 'main_menu' }
      ]
    ]
  };
}

/**
 * Settings Menu Keyboard
 */
function settingsMenu() {
  return {
    inline_keyboard: [
      [
        { text: '✏️ Edit Profil', callback_data: 'settings_edit_profile' }
      ],
      [
        { text: '🔒 Edit Preferensi', callback_data: 'settings_edit_pref' }
      ],
      [
        { text: '🚫 Daftar Blokir', callback_data: 'settings_blocked' }
      ],
      [
        { text: '🗑️ Hapus Akun', callback_data: 'settings_delete' }
      ],
      [
        { text: '⬅️ Kembali', callback_data: 'main_menu' }
      ]
    ]
  };
}

/**
 * Edit Profile Keyboard
 */
function editProfileMenu() {
  return {
    inline_keyboard: [
      [
        { text: '📝 Nama', callback_data: 'edit_nama' },
        { text: '🎂 Umur', callback_data: 'edit_umur' }
      ],
      [
        { text: '👤 Gender', callback_data: 'edit_gender' },
        { text: '❤️ Preferensi', callback_data: 'edit_preferensi' }
      ],
      [
        { text: '🏙️ Kota', callback_data: 'edit_kota' },
        { text: '📝 Bio', callback_data: 'edit_bio' }
      ],
      [
        { text: '📸 Foto', callback_data: 'edit_photo' },
        { text: '🎬 Video', callback_data: 'edit_video' }
      ],
      [
        { text: '⬅️ Kembali', callback_data: 'settings_menu' }
      ]
    ]
  };
}

/**
 * Message Input Keyboard
 */
function messageInput(targetId) {
  return {
    inline_keyboard: [
      [
        { text: '❌ Batal', callback_data: `msg_cancel_${targetId}` }
      ]
    ]
  };
}

/**
 * Chat Keyboard
 */
function chatKeyboard(userId) {
  return {
    inline_keyboard: [
      [
        { text: '💬 Kirim Pesan', callback_data: `chat_send_${userId}` }
      ],
      [
        { text: '🚫 Blokir', callback_data: `block_${userId}` },
        { text: '⚠️ Laporkan', callback_data: `report_${userId}` }
      ],
      [
        { text: '⬅️ Kembali', callback_data: 'messages_inbox' }
      ]
    ]
  };
}

/**
 * Confirm Keyboard
 */
function confirmKeyboard(action, id) {
  return {
    inline_keyboard: [
      [
        { text: '✅ Ya', callback_data: `confirm_${action}_${id}` },
        { text: '❌ Tidak', callback_data: `cancel_${action}_${id}` }
      ]
    ]
  };
}

/**
 * Back Button
 */
function backButton(callbackData = 'main_menu') {
  return {
    inline_keyboard: [
      [
        { text: '⬅️ Kembali', callback_data: callbackData }
      ]
    ]
  };
}

/**
 * Pagination Keyboard
 */
function paginationKeyboard(currentPage, totalPages, callbackPrefix) {
  const keyboard = [];
  const row = [];
  
  if (currentPage > 1) {
    row.push({ text: '⬅️', callback_data: `${callbackPrefix}_${currentPage - 1}` });
  }
  
  row.push({ text: `${currentPage}/${totalPages}`, callback_data: 'noop' });
  
  if (currentPage < totalPages) {
    row.push({ text: '➡️', callback_data: `${callbackPrefix}_${currentPage + 1}` });
  }
  
  keyboard.push(row);
  keyboard.push([{ text: '🏠 Menu Utama', callback_data: 'main_menu' }]);
  
  return { inline_keyboard: keyboard };
}

/**
 * Inbox Keyboard
 */
function inboxKeyboard(users) {
  const keyboard = [];
  
  users.forEach(user => {
    keyboard.push([
      { text: `${user.nama} (${user.umur}) - ${user.kota}`, callback_data: `chat_${user.id}` }
    ]);
  });
  
  keyboard.push([
    { text: '🏠 Menu Utama', callback_data: 'main_menu' }
  ]);
  
  return { inline_keyboard: keyboard };
}

/**
 * Media Request Keyboard
 */
function mediaRequest() {
  return {
    inline_keyboard: [
      [
        { text: '📸 Upload Foto', callback_data: 'reg_upload_photo' }
      ],
      [
        { text: '🎬 Upload Video', callback_data: 'reg_upload_video' }
      ],
      [
        { text: '✅ Selesai', callback_data: 'reg_media_done' }
      ]
    ]
  };
}

module.exports = {
  mainMenu,
  ageSelection,
  genderSelection,
  preferenceSelection,
  citySelection,
  profileView,
  searchResult,
  matchView,
  likesView,
  vipMenu,
  eliteMenu,
  settingsMenu,
  editProfileMenu,
  messageInput,
  chatKeyboard,
  confirmKeyboard,
  backButton,
  paginationKeyboard,
  inboxKeyboard,
  mediaRequest
};
