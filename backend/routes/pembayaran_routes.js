import express from "express";
import {
  getPembayaran,
  getPembayaranById,
  getPembayaranByKontrakan,
  createPembayaran,
  updatePembayaran,
  deletePembayaran,
} from "../controller/pembayaran_controller.js";

const router = express.Router();

// Get semua pembayaran
router.get("/", getPembayaran);

// Get pembayaran by ID
router.get("/:id", getPembayaranById);

// Get pembayaran by kontrakan ID
router.get("/kontrakan/:kontrakanId", getPembayaranByKontrakan);

// Create pembayaran baru
router.post("/", createPembayaran);

// Update pembayaran (admin konfirmasi)
router.put("/:id", updatePembayaran);

// Delete pembayaran
router.delete("/:id", deletePembayaran);

export default router;
