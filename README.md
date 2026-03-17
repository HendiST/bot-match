# Bot Match - Ultimate Telegram Dating Bot 🤖💕

Bot Telegram dating seperti Tinder dengan fitur lengkap: Like & Match, Pesan Langsung, Sistem VIP & Elite, Fake User System, dan Auto Seed Database.

## ✨ Fitur Utama

### 🔐 Registrasi User
- Input nama, umur, gender, preferensi, kota, bio
- **WAJIB** upload foto/video profil
- Flow registrasi interaktif dengan tombol

### 💘 Sistem Cari & Match
- Tampilkan profil dengan foto/video, nama, umur, bio, kota
- Tombol Like/Skip
- Match otomatis jika saling like
- Notifikasi real-time saat match

### 👀 Lihat Like
- Gratis melihat siapa yang menyukai profil
- Opsi like balik atau tolak

### 💌 Pesan (Surat)
- Kirim pesan teks + media
- Auto-like saat kirim pesan
- Inbox percakapan

### ⭐ VIP Membership
- Unlimited like & pesan
- Fitur Boost (prioritas 30 menit)
- Prioritas tampil di pencarian

### 👑 Elite Membership
- Semua fitur VIP
- Chat tanpa perlu match
- Lihat ID Telegram user
- Prioritas tertinggi

### 🤖 Fake User System
- Auto generate 50-200 fake user
- Foto dari randomuser.me / pravatar.cc
- Auto-like back dengan delay random
- Auto-send pesan random

### 🚀 Boost
- Aktif 30 menit
- Prioritas tampil tinggi

### 🔐 Anti Spam
- Limit harian untuk free user
- Cooldown antar aksi

## 🛠️ Teknologi

- **Node.js** - Runtime
- **node-telegram-bot-api** - Telegram Bot API
- **better-sqlite3** - SQLite Database
- **@faker-js/faker** - Fake data generator
- **axios** - HTTP client untuk fetch foto

## 📦 Instalasi

### 1. Clone Repository
```bash
git clone https://github.com/username/bot-match.git
cd bot-match
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Konfigurasi
```bash
# Copy .env.example ke .env
cp .env.example .env

# Edit .env dan masukkan token bot
nano .env
```

### 4. Jalankan Bot
```bash
npm start
```

## ⚙️ Konfigurasi

Edit `config.js` untuk menyesuaikan:

```javascript
// Bot Token
BOT_TOKEN: 'YOUR_BOT_TOKEN_HERE',

// VIP/Elite Duration (days)
VIP_DURATION: 30,
ELITE_DURATION: 30,

// Boost Duration (minutes)
BOOST_DURATION: 30,

// Free User Limits
FREE_LIMITS: {
  dailyLikes: 20,
  dailyMessages: 10,
  cooldownSeconds: 30
},

// Fake User Settings
FAKE_USER: {
  minCount: 50,
  maxCount: 200,
  autoLikeChance: 0.3,
  // ...
}
```

## 📁 Struktur Project

```
bot-match/
├── index.js              # Entry point
├── config.js             # Konfigurasi
├── package.json          # Dependencies
├── modules/
│   ├── database.js       # Database handler
│   ├── stateManager.js   # State management
│   ├── keyboard.js       # Keyboard builder
│   ├── registration.js   # Registrasi user
│   ├── search.js         # Pencarian & match
│   ├── messaging.js      # Pesan & chat
│   ├── premium.js        # VIP & Elite
│   ├── profile.js        # Profil & settings
│   └── fakeUserSeeder.js # Fake user system
├── data/
│   └── botmatch.db       # SQLite database
├── assets/
│   └── fake_users/       # Foto fake users
└── README.md
```

## 🗄️ Database Schema

### Users Table
| Field | Type | Description |
|-------|------|-------------|
| id | INTEGER | Primary key |
| telegram_id | BIGINT | Telegram user ID |
| nama | TEXT | Nama user |
| umur | INTEGER | Umur |
| gender | TEXT | Pria/Wanita |
| preferensi | TEXT | Pria/Wanita/Semua |
| kota | TEXT | Kota |
| bio | TEXT | Bio/deskripsi |
| photo_id | TEXT | Telegram file_id foto |
| video_id | TEXT | Telegram file_id video |
| photo_url | TEXT | URL foto (fake user) |
| role | TEXT | free/vip/elite |
| is_fake | INTEGER | 0=real, 1=fake |
| vip_expired | DATETIME | Tanggal expired VIP |
| elite_expired | DATETIME | Tanggal expired Elite |
| boost_until | DATETIME | Boost aktif hingga |

### Likes Table
| Field | Type | Description |
|-------|------|-------------|
| id | INTEGER | Primary key |
| user_id | INTEGER | ID user yang like |
| target_id | INTEGER | ID user yang di-like |
| is_match | INTEGER | 0=pending, 1=match |

### Messages Table
| Field | Type | Description |
|-------|------|-------------|
| id | INTEGER | Primary key |
| from_id | INTEGER | ID pengirim |
| to_id | INTEGER | ID penerima |
| pesan | TEXT | Isi pesan |
| media_type | TEXT | photo/video |
| media_id | TEXT | Telegram file_id |

## 🎮 Cara Penggunaan

### Untuk User

1. **Mulai**: Ketik `/start` atau tekan tombol
2. **Registrasi**: Isi data profil dan upload foto/video
3. **Cari Pasangan**: Tekan "💘 Cari Pasangan"
4. **Like/Skip**: Pilih profil yang menarik
5. **Match**: Jika saling like, match!
6. **Chat**: Mulai percakapan dengan match

### Untuk Admin

Bot akan otomatis:
- Generate fake user saat pertama kali jalan
- Reset limit harian
- Notifikasi user saat ada match/pesan

## 🔧 Development

### Menjalankan dengan Nodemon
```bash
npm run dev
```

### Reset Database
```bash
rm data/botmatch.db
npm start
```

## 📝 License

MIT License - Bebas digunakan dan dimodifikasi

## 🤝 Kontribusi

Pull request welcome! Untuk perubahan besar, buka issue dulu ya.

## 📞 Support

- Buat issue di GitHub
- Hubungi admin bot

---

**Bot Match** - Temukan pasangan impianmu! 💕
