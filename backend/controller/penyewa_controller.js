import Penyewa from "../model/penyewa.js";
import logger from "../lib/logger.js";
import mongoose from "mongoose";

// Get semua penyewa
export const getPenyewa = async (req, res) => {
  try {
    const data = await Penyewa.find();
    res.json({ 
      success: true,
      data 
    });
  } catch (error) {
    logger.error('Error in getPenyewa:', error);
    res.status(500).json({ 
      success: false,
      message: 'Terjadi kesalahan pada server',
      ...(process.env.NODE_ENV === 'development' && { error: error.message })
    });
  }
};

// Get penyewa by ID
export const getPenyewaById = async (req, res) => {
  try {
    const data = await Penyewa.findById(req.params.id);
    if (!data) {
      return res.status(404).json({ 
        success: false,
        message: "Penyewa tidak ditemukan" 
      });
    }
    
    res.json({ 
      success: true,
      data 
    });
  } catch (error) {
    logger.error('Error in getPenyewaById:', error);
    res.status(500).json({ 
      success: false,
      message: 'Terjadi kesalahan pada server',
      ...(process.env.NODE_ENV === 'development' && { error: error.message })
    });
  }
};

// Create penyewa baru
export const createPenyewa = async (req, res) => {
  try {
    const { nama, email, telepon, alamatAsal, nomorIdentitas, tanggalLahir, pekerjaan, noKontakEmergency } = req.body;

    // Validasi input
    if (!nama || !email || !telepon) {
      return res.status(400).json({ 
        success: false,
        message: "Nama, email, dan telepon harus diisi" 
      });
    }

    const penyewa = new Penyewa({
      nama,
      email: email.toLowerCase().trim(),
      telepon,
      alamatAsal,
      nomorIdentitas,
      tanggalLahir,
      pekerjaan,
      noKontakEmergency,
    });

    await penyewa.save();
    
    logger.info(`Penyewa created: ${penyewa._id}`);
    res.status(201).json({ 
      success: true,
      message: "Penyewa berhasil ditambahkan", 
      data: penyewa 
    });
  } catch (error) {
    logger.error('Error in createPenyewa:', error);
    
    // Handle duplicate key error
    if (error.code === 11000) {
      return res.status(400).json({ 
        success: false,
        message: 'Email sudah terdaftar' 
      });
    }
    
    res.status(400).json({ 
      success: false,
      message: error.message 
    });
  }
};

// Update penyewa
export const updatePenyewa = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body };
    
    // Normalize email if provided
    if (updateData.email) {
      updateData.email = updateData.email.toLowerCase().trim();
    }
    
    const updated = await Penyewa.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!updated) {
      return res.status(404).json({ 
        success: false,
        message: "Penyewa tidak ditemukan" 
      });
    }

    logger.info(`Penyewa updated: ${id}`);
    res.json({ 
      success: true,
      message: "Penyewa berhasil diupdate", 
      data: updated 
    });
  } catch (error) {
    logger.error('Error in updatePenyewa:', error);
    
    // Handle duplicate key error
    if (error.code === 11000) {
      return res.status(400).json({ 
        success: false,
        message: 'Email sudah terdaftar' 
      });
    }
    
    res.status(400).json({ 
      success: false,
      message: error.message 
    });
  }
};

// Delete penyewa
export const deletePenyewa = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await Penyewa.findByIdAndDelete(id);
    
    if (!deleted) {
      return res.status(404).json({ 
        success: false,
        message: "Penyewa tidak ditemukan" 
      });
    }
    
    logger.info(`Penyewa deleted: ${id}`);
    res.json({ 
      success: true,
      message: "Penyewa berhasil dihapus", 
      data: deleted 
    });
  } catch (error) {
    logger.error('Error in deletePenyewa:', error);
    res.status(500).json({ 
      success: false,
      message: 'Terjadi kesalahan pada server',
      ...(process.env.NODE_ENV === 'development' && { error: error.message })
    });
  }
};