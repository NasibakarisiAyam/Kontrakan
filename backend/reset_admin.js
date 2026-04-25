import mongoose from "mongoose";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import path from "path";
import User from "./model/user.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

let MONGODB_URI = process.env.MONGO_URI;
if (!MONGODB_URI) {
  MONGODB_URI = "mongodb://127.0.0.1:27017/kontrakan";
}

async function resetAdmin() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log("✓ Database terhubung");

    // Hapus user lama
    const result = await User.deleteOne({ email: "adminkontrakan@gmail.com" });
    if (result.deletedCount > 0) {
      console.log("✓ User lama dihapus");
    }

    // Buat user baru dengan password yang benar
    const newUser = new User({
      nama: "Admin Kontrakan",
      email: "adminkontrakan@gmail.com",
      password: "bismillah",
      telepon: "+62812345678",
      role: "admin"
    });

    await newUser.save();

    console.log("\n✓ Admin user baru berhasil dibuat:");
    console.log("  Email: adminkontrakan@gmail.com");
    console.log("  Password: bismillah");
    console.log("  Role: admin");
    console.log("\n✓ Silakan login kembali dengan credentials yang sudah benar!");

    process.exit(0);
  } catch (error) {
    console.error("✗ Error:", error.message);
    process.exit(1);
  }
}

resetAdmin();
