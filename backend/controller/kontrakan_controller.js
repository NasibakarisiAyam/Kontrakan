import Kontrakan from "../model/kontrakan.js";
import logger from "../lib/logger.js";
import mongoose from "mongoose";

// Helper function untuk menghitung status pembayaran berdasarkan tanggal
const calculatePaymentStatus = (tanggalJatuhTempo, currentStatus) => {
  if (!tanggalJatuhTempo) return currentStatus;
  
  const now = new Date();
  const dueDate = new Date(tanggalJatuhTempo);
  
  // Set waktu ke 00:00:00 untuk perbandingan yang akurat
  dueDate.setHours(0, 0, 0, 0);
  now.setHours(0, 0, 0, 0);
  
  // Jika status sudah Lunas, tetap Lunas
  if (currentStatus === "Lunas") {
    return "Lunas";
  }
  
  // Jika hari ini >= tanggal jatuh tempo dan belum bayar, ubah ke "Terlambat"
  if (now >= dueDate) {
    return "Terlambat";
  }
  
  // Jika hari ini < tanggal jatuh tempo, status tetap "Belum Bayar"
  return "Belum Bayar";
};

// Helper function untuk validasi input kontrakan
const validateKontrakanInput = (data, isUpdate = false) => {
  const errors = [];
  
  if (!isUpdate || data.alamat !== undefined) {
    if (!data.alamat) errors.push("Alamat harus diisi");
  }
  
  if (!isUpdate || data.hargaPerBulan !== undefined) {
    if (!data.hargaPerBulan) errors.push("Harga perbulan harus diisi");
    else if (isNaN(data.hargaPerBulan) || data.hargaPerBulan <= 0) {
      errors.push("Harga perbulan harus berupa angka positif");
    }
  }
  
  if (!isUpdate || data.minimumDP !== undefined) {
    if (!data.minimumDP) errors.push("Minimum DP harus diisi");
    else if (isNaN(data.minimumDP) || data.minimumDP <= 0) {
      errors.push("Minimum DP harus berupa angka positif");
    }
  }
  
  return errors;
};

// Get semua kontrakan dengan data penyewa dan pagination
export const getKontrakan = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10000;
    const skip = (page - 1) * limit;

    // Get current date for status calculation
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    // Use aggregation pipeline for better performance
    const kontrakans = await Kontrakan.aggregate([
      {
        $lookup: {
          from: 'penyewas',
          localField: 'penyewa',
          foreignField: '_id',
          as: 'penyewa'
        }
      },
      {
        $unwind: {
          path: '$penyewa',
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $addFields: {
          // Store original status for comparison
          originalStatus: '$statusPembayaran',
          // Calculate new status
          statusPembayaran: {
            $cond: {
              if: {
                $and: [
                  { $ne: ['$statusPembayaran', 'Lunas'] },
                  { $ne: ['$tanggalJatuhTempo', null] },
                  { $lte: ['$tanggalJatuhTempo', now] }
                ]
              },
              then: 'Terlambat',
              else: '$statusPembayaran'
            }
          }
        }
      },
      {
        $facet: {
          // Get paginated data
          data: [
            { $skip: skip },
            { $limit: limit }
          ],
          // Get total count
          totalCount: [
            { $count: 'count' }
          ]
        }
      }
    ]);

    // Extract results
    const data = kontrakans[0].data;
    const total = kontrakans[0].totalCount[0]?.count || 0;
    const totalPages = Math.ceil(total / limit);

    // Update documents in bulk if status changed
    const bulkOps = [];
    data.forEach(kontrakan => {
      if (kontrakan.statusPembayaran !== kontrakan.originalStatus) {
        bulkOps.push({
          updateOne: {
            filter: { _id: kontrakan._id },
            update: { $set: { statusPembayaran: kontrakan.statusPembayaran } }
          }
        });
      }
    });

    if (bulkOps.length > 0) {
      await Kontrakan.bulkWrite(bulkOps);
      logger.info(`Updated ${bulkOps.length} kontrakan payment statuses`);
    }

    // Remove originalStatus field from response
    const cleanedData = data.map(({ originalStatus, ...rest }) => rest);

    res.json({
      data: cleanedData,
      pagination: {
        currentPage: page,
        totalPages,
        totalItems: total,
        itemsPerPage: limit,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    });
  } catch (error) {
    logger.error('Error in getKontrakan:', error);
    res.status(500).json({ 
      success: false,
      message: 'Terjadi kesalahan pada server',
      ...(process.env.NODE_ENV === 'development' && { error: error.message })
    });
  }
};

// Get kontrakan by ID dengan data penyewa
export const getKontrakanById = async (req, res) => {
  try {
    let data = await Kontrakan.findById(req.params.id).populate("penyewa");
    
    if (!data) {
      logger.warn(`Kontrakan not found: ${req.params.id}`);
      return res.status(404).json({ 
        success: false,
        message: "Kontrakan tidak ditemukan" 
      });
    }

    // Auto-update status berdasarkan tanggal jatuh tempo
    const newStatus = calculatePaymentStatus(data.tanggalJatuhTempo, data.statusPembayaran);
    
    if (newStatus !== data.statusPembayaran) {
      data = await Kontrakan.findByIdAndUpdate(
        req.params.id, 
        { $set: { statusPembayaran: newStatus } }, 
        { new: true }
      ).populate("penyewa");
      logger.info(`Updated payment status for kontrakan ${req.params.id} to ${newStatus}`);
    }

    res.json({
      success: true,
      data
    });
  } catch (error) {
    logger.error('Error in getKontrakanById:', error);
    res.status(500).json({ 
      success: false,
      message: 'Terjadi kesalahan pada server',
      ...(process.env.NODE_ENV === 'development' && { error: error.message })
    });
  }
};

// Create kontrakan baru
export const createKontrakan = async (req, res) => {
  try {
    const { namaKontrakan, alamat, hargaPerBulan, minimumDP, penyewa, gambar } = req.body;
    
    // Validasi input
    const errors = validateKontrakanInput(req.body);
    if (errors.length > 0) {
      return res.status(400).json({ 
        success: false,
        message: errors.join(', ') 
      });
    }
    
    // Auto-set status kontrak: jika ada penyewa, maka "Sudah Dikontrak"
    const finalStatusKontrak = penyewa ? "Sudah Dikontrak" : "Belum Dikontrak";
    const finalStatusApproval = penyewa ? "pending" : undefined;
    
    const kontrakanData = {
      alamat,
      hargaPerBulan: Number(hargaPerBulan),
      minimumDP: Number(minimumDP),
      statusKontrak: finalStatusKontrak,
      statusPembayaran: penyewa ? "Lunas" : "Belum Bayar",
    };
    
    // Add optional fields only if they have values
    if (namaKontrakan) kontrakanData.namaKontrakan = namaKontrakan;
    if (penyewa) kontrakanData.penyewa = penyewa;
    if (gambar) kontrakanData.gambar = gambar;
    if (finalStatusApproval) kontrakanData.statusApproval = finalStatusApproval;
    
    const kontrakan = new Kontrakan(kontrakanData);
    
    await kontrakan.save();
    await kontrakan.populate("penyewa");
    
    logger.info(`Kontrakan created: ${kontrakan._id}`);
    res.status(201).json({ 
      success: true,
      message: "Kontrakan berhasil dibuat", 
      data: kontrakan 
    });
  } catch (error) {
    logger.error('Error in createKontrakan:', error);
    res.status(400).json({ 
      success: false,
      message: error.message 
    });
  }
};

// Update kontrakan
export const updateKontrakan = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body };

    // Validasi input untuk update
    const errors = validateKontrakanInput(updateData, true);
    if (errors.length > 0) {
      return res.status(400).json({ 
        success: false,
        message: errors.join(', ') 
      });
    }

    // Get current kontrakan for reference
    const currentKontrakan = await Kontrakan.findById(id);
    if (!currentKontrakan) {
      return res.status(404).json({ 
        success: false,
        message: "Kontrakan tidak ditemukan" 
      });
    }

    // Auto-set status kontrak: jika ada penyewa, maka "Sudah Dikontrak"
    if (updateData.penyewa !== undefined) {
      if (updateData.penyewa && updateData.penyewa !== "") {
        updateData.statusKontrak = "Sudah Dikontrak";
        updateData.statusApproval = "pending"; // Menunggu persetujuan admin untuk booking baru
        updateData.statusPembayaran = "Lunas";

        // Set tanggal mulai dan tanggal jatuh tempo jika duration disediakan
        if (updateData.duration) {
          const today = new Date();
          const oldDueDate = currentKontrakan.tanggalJatuhTempo;
          updateData.tanggalMulai = today;
          const dueDate = new Date(today);
          dueDate.setMonth(dueDate.getMonth() + updateData.duration);
          updateData.tanggalJatuhTempo = dueDate;
          const extendedMonths = updateData.duration;
          delete updateData.duration; // Remove duration from updateData as it's not a field in the schema

          // Add to history
          updateData.$push = updateData.$push || {};
          updateData.$push.history = {
            type: 'extension',
            date: new Date(),
            details: {
              oldDueDate: oldDueDate,
              newDueDate: dueDate,
              extendedMonths: extendedMonths
            }
          };
        }
      } else {
        // Jika penyewa dihapus, ubah status kembali ke "Belum Dikontrak"
        updateData.statusKontrak = "Belum Dikontrak";
        updateData.penyewa = null;
        updateData.statusApproval = undefined; // Remove approval status
      }
    }
    
    // Auto-calculate payment status
    if (updateData.tanggalJatuhTempo !== undefined) {
      updateData.statusPembayaran = calculatePaymentStatus(
        updateData.tanggalJatuhTempo,
        updateData.statusPembayaran || currentKontrakan.statusPembayaran
      );
    }
    
    // Handle gambar upload
    if (updateData.gambar === null || updateData.gambar === "") {
      updateData.gambar = null;
    }
    
    const updated = await Kontrakan.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true }
    ).populate("penyewa");
    
    logger.info(`Kontrakan updated: ${id}`);
    res.json({ 
      success: true,
      message: "Kontrakan berhasil diupdate", 
      data: updated 
    });
  } catch (error) {
    logger.error('Error in updateKontrakan:', error);
    res.status(400).json({ 
      success: false,
      message: error.message 
    });
  }
};

// Delete kontrakan
export const deleteKontrakan = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await Kontrakan.findByIdAndDelete(id);
    
    if (!deleted) {
      return res.status(404).json({ 
        success: false,
        message: "Kontrakan tidak ditemukan" 
      });
    }
    
    logger.info(`Kontrakan deleted: ${id}`);
    res.json({ 
      success: true,
      message: "Kontrakan berhasil dihapus", 
      data: deleted 
    });
  } catch (error) {
    logger.error('Error in deleteKontrakan:', error);
    res.status(500).json({ 
      success: false,
      message: 'Terjadi kesalahan pada server',
      ...(process.env.NODE_ENV === 'development' && { error: error.message })
    });
  }
};

// Approve kontrakan request (admin only)
export const approveKontrakan = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Verify kontrakan exists and has pending status
    const kontrakan = await Kontrakan.findById(id);
    if (!kontrakan) {
      return res.status(404).json({ 
        success: false,
        message: "Kontrakan tidak ditemukan" 
      });
    }
    
    if (kontrakan.statusApproval !== "pending") {
      return res.status(400).json({ 
        success: false,
        message: "Kontrakan tidak dalam status pending" 
      });
    }
    
    const updated = await Kontrakan.findByIdAndUpdate(
      id,
      { $set: { statusApproval: "approved" } },
      { new: true }
    ).populate("penyewa");

    logger.info(`Kontrakan approved: ${id}`);
    res.json({ 
      success: true,
      message: "Kontrakan berhasil disetujui", 
      data: updated 
    });
  } catch (error) {
    logger.error('Error in approveKontrakan:', error);
    res.status(400).json({ 
      success: false,
      message: error.message 
    });
  }
};

// Reject kontrakan request (admin only)
export const rejectKontrakan = async (req, res) => {
  try {
    const { id } = req.params;

    // Verify kontrakan exists and has pending status
    const kontrakan = await Kontrakan.findById(id);
    if (!kontrakan) {
      return res.status(404).json({ 
        success: false,
        message: "Kontrakan tidak ditemukan" 
      });
    }

    if (kontrakan.statusApproval !== "pending") {
      return res.status(400).json({
        success: false,
        message: "Kontrakan tidak dalam status pending"
      });
    }

    // Revert status and remove penyewa if rejected
    const updated = await Kontrakan.findByIdAndUpdate(
      id,
      {
        $set: {
          statusApproval: "rejected",
          statusKontrak: "Belum Dikontrak"
        },
        $unset: { penyewa: "" }
      },
      { new: true }
    );

    logger.info(`Kontrakan rejected: ${id}`);
    res.json({ 
      success: true,
      message: "Kontrakan berhasil ditolak", 
      data: updated 
    });
  } catch (error) {
    logger.error('Error in rejectKontrakan:', error);
    res.status(400).json({ 
      success: false,
      message: error.message 
    });
  }
};