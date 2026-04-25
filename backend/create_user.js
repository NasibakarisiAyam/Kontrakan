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

async function createUser() {
  try {
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log("✓ Database terhubung");

    // Data user baru
    const userData = {
      nama: "a",
      email: "abc@gmail.com",
      password: "123456",
      role: "penyewa" // default role
    };

    // Cek apakah email sudah ada
    const existingUser = await User.findOne({ email: userData.email });
    if (existingUser) {
      console.log("✗ Email sudah terdaftar!");
      process.exit(1);
    }

    // Buat user baru (password akan di-hash otomatis oleh pre-save hook)
    const newUser = new User(userData);
    await newUser.save();

    console.log("✓ User berhasil dibuat:");
    console.log(`  - Nama: ${newUser.nama}`);
    console.log(`  - Email: ${newUser.email}`);
    console.log(`  - Role: ${newUser.role}`);
    console.log(`  - Password: ${userData.password} ( sudah di-hash )`);

    process.exit(0);
  } catch (error) {
    console.error("✗ Error:", error.message);
    process.exit(1);
  }
}

createUser();
