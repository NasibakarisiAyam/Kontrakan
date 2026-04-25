import mongoose from "mongoose";

const penyewaSchema = new mongoose.Schema({
  nama: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  telepon: {
    type: String,
    required: true,
  },
  alamatAsal: {
    type: String,
  },
  nomorIdentitas: {
    type: String,
    unique: true,
    sparse: true,
  },
  tanggalLahir: {
    type: Date,
  },
  pekerjaan: {
    type: String,
  },
  noKontakEmergency: {
    type: String,
  },
}, { timestamps: true });

export default mongoose.model("Penyewa", penyewaSchema);
