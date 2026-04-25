import mongoose from "mongoose";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import path from "path";
import User from "./model/user.js";

// Konfigurasi path absolut agar .env selalu terbaca
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

let MONGODB_URI = process.env.MONGO_URI;

// Fix otomatis: Tambahkan nama database 'kontrakan' jika lupa ditulis di .env
if (MONGODB_URI && MONGODB_URI.includes("mongodb.net") && !MONGODB_URI.includes("mongodb.net/")) {
  MONGODB_URI = MONGODB_URI.replace("mongodb.net/?", "mongodb.net/kontrakan?");
}

// Fallback jika tidak ada MONGO_URI
if (!MONGODB_URI) {
  MONGODB_URI = "mongodb://127.0.0.1:27017/kontrakan";
}

async function createAdmin() {
  try {
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log("✓ Database terhubung");

    // Data admin user
    const adminData = {
      nama: "Admin Kontrakan",
      email: "adminkontrakan@gmail.com",
      password: "bismillah",
      telepon: "+62812345678",
      role: "admin"
    };

    // Cek apakah email sudah ada
    const existingUser = await User.findOne({ email: adminData.email });
    if (existingUser) {
      console.log("✗ Email sudah terdaftar!");
      console.log("✓ User yang ada:");
      console.log(`  - Nama: ${existingUser.nama}`);
      console.log(`  - Email: ${existingUser.email}`);
      console.log(`  - Role: ${existingUser.role}`);
      
      // Jika password salah, saran untuk reset
      const isPasswordCorrect = await existingUser.comparePassword(adminData.password);
      if (!isPasswordCorrect) {
        console.log("\n⚠ Password yang Anda gunakan salah!");
        console.log("Opsi:");
        console.log("1. Gunakan password yang benar saat login");
        console.log("2. Hapus user ini dan buat ulang");
      } else {
        console.log("\n✓ Password sudah benar!");
      }
      
      process.exit(0);
    }

    // Buat user baru (password akan di-hash otomatis oleh pre-save hook)
    const newUser = new User(adminData);
    await newUser.save();

    console.log("✓ Admin user berhasil dibuat:");
    console.log(`  - Nama: ${newUser.nama}`);
    console.log(`  - Email: ${newUser.email}`);
    console.log(`  - Role: ${newUser.role}`);
    console.log(`  - Password: ${adminData.password} (sudah di-hash di database)`);
    console.log("\n✓ Sekarang Anda bisa login menggunakan:");
    console.log(`  Email: ${adminData.email}`);
    console.log(`  Password: ${adminData.password}`);

    process.exit(0);
  } catch (error) {
    console.error("✗ Error:", error.message);
    process.exit(1);
  }
}

createAdmin();
