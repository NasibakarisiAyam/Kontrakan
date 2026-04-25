import express from "express";
import {
  getPenyewa,
  getPenyewaById,
  createPenyewa,
  updatePenyewa,
  deletePenyewa
} from "../controller/penyewa_controller.js";

const router = express.Router();

// GET - Ambil semua penyewa
router.get("/", getPenyewa);

// GET - Ambil penyewa by ID
router.get("/:id", getPenyewaById);

// POST - Buat penyewa baru
router.post("/", createPenyewa);

// PUT - Update penyewa
router.put("/:id", updatePenyewa);

// DELETE - Hapus penyewa
router.delete("/:id", deletePenyewa);

export default router;
