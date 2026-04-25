import Pembayaran from "../model/pembayaran.js";
import Kontrakan from "../model/kontrakan.js";
import logger from "../lib/logger.js";
import mongoose from "mongoose";

// Get semua pembayaran
export const getPembayaran = async (req, res) => {
  try {
    const data = await Pembayaran.find()
      .populate("kontrakan")
      .populate("penyewa");
    
    res.json({ 
      success: true,
      data 
    });
  } catch (error) {
    logger.error('Error in getPembayaran:', error);
    res.status(500).json({ 
      success: false,
      message: 'Terjadi kesalahan pada server',
      ...(process.env.NODE_ENV === 'development' && { error: error.message })
    });
  }
};

// Get pembayaran by ID
export const getPembayaranById = async (req, res) => {
  try {
    const data = await Pembayaran.findById(req.params.id)
      .populate("kontrakan")
      .populate("penyewa");
    
    if (!data) {
      return res.status(404).json({ 
        success: false,
        message: "Pembayaran tidak ditemukan" 
      });
    }
    
    res.json({ 
      success: true,
      data 
    });
  } catch (error) {
    logger.error('Error in getPembayaranById:', error);
    res.status(500).json({ 
      success: false,
      message: 'Terjadi kesalahan pada server',
      ...(process.env.NODE_ENV === 'development' && { error: error.message })
    });
  }
};

// Get pembayaran by kontrakan ID
export const getPembayaranByKontrakan = async (req, res) => {
  try {
    const data = await Pembayaran.find({ kontrakan: req.params.kontrakanId })
      .populate("kontrakan")
      .populate("penyewa");
    
    res.json({ 
      success: true,
      data 
    });
  } catch (error) {
    logger.error('Error in getPembayaranByKontrakan:', error);
    res.status(500).json({ 
      success: false,
      message: 'Terjadi kesalahan pada server',
      ...(process.env.NODE_ENV === 'development' && { error: error.message })
    });
  }
};

// Create pembayaran baru (dari penyewa)
export const createPembayaran = async (req, res) => {
  try {
    const { kontrakan, penyewa, jumlah, bulanPembayaran, buktiPembayaran, metodePembayaran } = req.body;

    // Validasi input
    if (!kontrakan || !penyewa || !jumlah || !bulanPembayaran || !metodePembayaran) {
      return res.status(400).json({ 
        success: false,
        message: "Data tidak lengkap" 
      });
    }

    // Validasi jumlah
    if (isNaN(jumlah) || jumlah <= 0) {
      return res.status(400).json({ 
        success: false,
        message: "Jumlah pembayaran harus berupa angka positif" 
      });
    }

    // Jika bukan Cash, bukti pembayaran harus ada
    if (metodePembayaran !== 'Cash' && !buktiPembayaran) {
      return res.status(400).json({ 
        success: false,
        message: "Bukti pembayaran diperlukan untuk Transfer/QRIS" 
      });
    }

    // Otomatis setujui pembayaran jika Cash atau ada bukti pembayaran
    const isApproved = metodePembayaran === 'Cash' || buktiPembayaran;
    const finalStatus = isApproved ? "Terbayar" : "Belum Dibayar";

    const pembayaran = new Pembayaran({
      kontrakan,
      penyewa,
      jumlah: Number(jumlah),
      bulanPembayaran,
      buktiPembayaran: buktiPembayaran || null,
      metodePembayaran,
      status: finalStatus,
      statusApproval: isApproved ? "approved" : "pending",
      dikonfirmasiOleh: isApproved ? "system" : null,
    });

    // Jika disetujui otomatis, set tanggalKonfirmasi dan update kontrakan serta history
    if (isApproved) {
      pembayaran.tanggalKonfirmasi = new Date();
      await Kontrakan.findByIdAndUpdate(kontrakan, {
        statusPembayaran: "Lunas",
        $push: {
          history: {
            type: 'payment',
            date: new Date(),
            details: {
              amount: Number(jumlah),
              month: bulanPembayaran,
              method: metodePembayaran
            }
          }
        }
      });
    }

    await pembayaran.save();
    await pembayaran.populate("kontrakan").populate("penyewa");

    logger.info(`Pembayaran created: ${pembayaran._id}`);
    res.status(201).json({ 
      success: true,
      message: "Pembayaran berhasil diupload", 
      data: pembayaran 
    });
  } catch (error) {
    logger.error('Error in createPembayaran:', error);
    res.status(400).json({ 
      success: false,
      message: error.message 
    });
  }
};

// Update pembayaran (admin konfirmasi)
export const updatePembayaran = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, keterangan, buktiPembayaran, dikonfirmasiOleh } = req.body;
    
    // Validasi status
    const validStatuses = ["Terbayar", "Belum Dibayar", "Terlambat", "Ditolak", "Menunggu Konfirmasi"];
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({ 
        success: false,
        message: "Status tidak valid" 
      });
    }
    
    const updateData = {
      status,
      keterangan: keterangan || "",
      dikonfirmasiOleh: dikonfirmasiOleh || req.user?.id || "admin",
    };
    
    // Jika ada bukti pembayaran baru dari admin
    if (buktiPembayaran) {
      updateData.buktiPembayaran = buktiPembayaran;
    }
    
    // Set tanggal konfirmasi saat status diubah menjadi Terbayar atau Ditolak
    if (status !== "Menunggu Konfirmasi") {
      updateData.tanggalKonfirmasi = new Date();
      
      // Update status pembayaran di kontrakan jika TERBAYAR
      if (status === "Terbayar") {
        const pembayaran = await Pembayaran.findById(id);
        if (pembayaran) {
          await Kontrakan.findByIdAndUpdate(pembayaran.kontrakan, {
            statusPembayaran: "Lunas",
            $push: {
              history: {
                type: 'payment',
                date: new Date(),
                details: {
                  amount: pembayaran.jumlah,
                  month: pembayaran.bulanPembayaran,
                  method: pembayaran.metodePembayaran
                }
              }
            }
          });
        }
      }
    }
    
    const updated = await Pembayaran.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).populate("kontrakan").populate("penyewa");
    
    if (!updated) {
      return res.status(404).json({ 
        success: false,
        message: "Pembayaran tidak ditemukan" 
      });
    }
    
    logger.info(`Pembayaran updated: ${id}`);
    res.json({ 
      success: true,
      message: "Pembayaran berhasil diupdate", 
      data: updated 
    });
  } catch (error) {
    logger.error('Error in updatePembayaran:', error);
    res.status(400).json({ 
      success: false,
      message: error.message 
    });
  }
};

// Delete pembayaran
export const deletePembayaran = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await Pembayaran.findByIdAndDelete(id);

    if (!deleted) {
      return res.status(404).json({ 
        success: false,
        message: "Pembayaran tidak ditemukan" 
      });
    }

    logger.info(`Pembayaran deleted: ${id}`);
    res.json({ 
      success: true,
      message: "Pembayaran berhasil dihapus", 
      data: deleted 
    });
  } catch (error) {
    logger.error('Error in deletePembayaran:', error);
    res.status(500).json({ 
      success: false,
      message: 'Terjadi kesalahan pada server',
      ...(process.env.NODE_ENV === 'development' && { error: error.message })
    });
  }
};

// Approve pembayaran request (admin only)
export const approvePembayaran = async (req, res) => {
  try {
    const { id } = req.params;
    const pembayaran = await Pembayaran.findById(id).populate("kontrakan");

    if (!pembayaran) {
      return res.status(404).json({ 
        success: false,
        message: "Pembayaran tidak ditemukan" 
      });
    }

    // Update pembayaran approval status
    const updated = await Pembayaran.findByIdAndUpdate(
      id,
      {
        statusApproval: "approved",
        status: "Terbayar",
        tanggalKonfirmasi: new Date(),
        dikonfirmasiOleh: req.user?.id || "admin"
      },
      { new: true, runValidators: true }
    ).populate("kontrakan").populate("penyewa");

    // Update kontrakan status to Lunas and add to history
    await Kontrakan.findByIdAndUpdate(pembayaran.kontrakan._id, {
      statusPembayaran: "Lunas",
      $push: {
        history: {
          type: 'payment',
          date: new Date(),
          details: {
            amount: pembayaran.jumlah,
            month: pembayaran.bulanPembayaran,
            method: pembayaran.metodePembayaran
          }
        }
      }
    });

    logger.info(`Pembayaran approved: ${id}`);
    res.json({ 
      success: true,
      message: "Pembayaran berhasil disetujui", 
      data: updated 
    });
  } catch (error) {
    logger.error('Error in approvePembayaran:', error);
    res.status(400).json({ 
      success: false,
      message: error.message 
    });
  }
};

// Reject pembayaran request (admin only)
export const rejectPembayaran = async (req, res) => {
  try {
    const { id } = req.params;
    const updated = await Pembayaran.findByIdAndUpdate(
      id,
      { 
        statusApproval: "rejected", 
        status: "Ditolak",
        tanggalKonfirmasi: new Date(),
        dikonfirmasiOleh: req.user?.id || "admin"
      },
      { new: true, runValidators: true }
    ).populate("kontrakan").populate("penyewa");

    if (!updated) {
      return res.status(404).json({ 
        success: false,
        message: "Pembayaran tidak ditemukan" 
      });
    }

    logger.info(`Pembayaran rejected: ${id}`);
    res.json({ 
      success: true,
      message: "Pembayaran berhasil ditolak", 
      data: updated 
    });
  } catch (error) {
    logger.error('Error in rejectPembayaran:', error);
    res.status(400).json({ 
      success: false,
      message: error.message 
    });
  }
};