import express from "express";
import {
  getKontrakan,
  getKontrakanById,
  createKontrakan,
  updateKontrakan,
  deleteKontrakan,
  approveKontrakan,
  rejectKontrakan
} from "../controller/kontrakan_controller.js";

const router = express.Router();

// GET - Ambil semua kontrakan
router.get("/", getKontrakan);

// GET - Ambil kontrakan by ID
router.get("/:id", getKontrakanById);

// POST - Buat kontrakan baru
router.post("/", createKontrakan);

// PUT - Update kontrakan
router.put("/:id", updateKontrakan);

// DELETE - Hapus kontrakan
router.delete("/:id", deleteKontrakan);

// PATCH - Approve kontrakan (admin only)
router.patch("/:id/approve", approveKontrakan);

// PATCH - Reject kontrakan (admin only)
router.patch("/:id/reject", rejectKontrakan);

export default router;
