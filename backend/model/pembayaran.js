import mongoose from "mongoose";

const pembayaranSchema = new mongoose.Schema({
  kontrakan: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Kontrakan",
    required: true,
  },
  penyewa: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Penyewa",
    required: true,
  },
  jumlah: {
    type: Number,
    required: true,
  },
  bulanPembayaran: {
    type: Number,
    required: true,
  },
  metodePembayaran: {
    type: String,
    enum: ["Cash", "Transfer", "QRIS"],
    default: "Transfer",
  },
  buktiPembayaran: {
    type: String, // Base64 atau URL gambar
  },
  status: {
    type: String,
    enum: ["Terbayar", "Belum Dibayar", "Terlambat", "Ditolak", "Menunggu Konfirmasi"],
    default: "Belum Dibayar",
  },
  keterangan: {
    type: String,
  },
  tanggalUpload: {
    type: Date,
    default: Date.now,
  },
  tanggalKonfirmasi: {
    type: Date,
  },
  dikonfirmasiOleh: {
    type: String, // Admin name/id
  },
  statusApproval: {
    type: String,
    enum: ["pending", "approved", "rejected"],
    default: "approved", // Default approved for existing, pending for new by karyawan
  },
  requestedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
}, { timestamps: true });

export default mongoose.model("Pembayaran", pembayaranSchema);
