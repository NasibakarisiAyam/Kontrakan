import mongoose from "mongoose";

const kontrakanSchema = new mongoose.Schema({
  namaKontrakan: {
    type: String,
  },
  alamat: {
    type: String,
    required: true,
  },
  hargaPerBulan: {
    type: Number,
    required: true,
  },
  minimumDP: {
    type: Number,
    required: true,
  },
  statusKontrak: {
    type: String,
    enum: ["Sudah Dikontrak", "Belum Dikontrak"],
    default: "Belum Dikontrak",
  },
  statusPembayaran: {
    type: String,
    enum: ["Lunas", "Belum Bayar", "Terlambat"],
    default: "Belum Bayar",
  },
  penyewa: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Penyewa",
    default: null,
  },
  tanggalMulai: {
    type: Date,
  },
  tanggalJatuhTempo: {
    type: Date,
  },
  gambar: {
    type: String, // Base64 atau URL gambar
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
  history: [{
    type: {
      type: String,
      enum: ['extension', 'payment'],
      required: true
    },
    date: {
      type: Date,
      default: Date.now
    },
    details: {
      type: Object
    }
  }],
}, { timestamps: true });

// Ensure optional namaKontrakan doesn't block inserts when empty/null
// Create a sparse unique index so documents without namaKontrakan are ignored by the unique constraint
kontrakanSchema.index({ namaKontrakan: 1 }, { unique: true, sparse: true, name: 'namaKontrakan_unique_sparse' });

export default mongoose.model("Kontrakan", kontrakanSchema);
