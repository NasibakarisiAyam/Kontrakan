import { Upload, Plus, Eye, Clock, CheckCircle, XCircle, User, CreditCard, Calendar, Home, MapPin } from "lucide-react";
import { useState, useEffect } from "react";
import axios from "axios";
import Alert from "../components/Alert";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export default function PesanKontrakan() {
  const [kontrakan, setKontrakan] = useState([]);
  const [pembayaran, setPembayaran] = useState([]);
  const [penyewaList, setPenyewaList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [selectedKontrakan, setSelectedKontrakan] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedPembayaran, setSelectedPembayaran] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  
  // Form States
  const [selectedPenyewaId, setSelectedPenyewaId] = useState("");
  const [duration, setDuration] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState("Cash");
  const [formData, setFormData] = useState({
    buktiPembayaran: null,
  });

  // New Tenant Form State
  const [showNewTenantForm, setShowNewTenantForm] = useState(false);
  const [newTenant, setNewTenant] = useState({
    nama: "",
    email: "",
    telepon: "",
    alamat: ""
  });

  // Alert State
  const [alert, setAlert] = useState({
    isOpen: false,
    type: 'info',
    title: '',
    message: ''
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [resKontrakan, resPembayaran, resPenyewa] = await Promise.all([
        axios.get(`${API_URL}/kontrakan`),
        axios.get(`${API_URL}/pembayaran`),
        axios.get(`${API_URL}/penyewa`),
      ]);
      setKontrakan(resKontrakan.data?.data || resKontrakan.data || []);
      setPembayaran(resPembayaran.data?.data || resPembayaran.data || []);
      setPenyewaList(resPenyewa.data?.data || resPenyewa.data || []);
    } catch (error) {
      console.error("Error fetching data:", error);
      setAlert({
        isOpen: true,
        type: 'error',
        title: 'Error',
        message: 'Gagal memuat data. Pastikan server backend berjalan di ' + API_URL
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (selectedKontrakan && selectedKontrakan.penyewa) {
      const penyewaId = typeof selectedKontrakan.penyewa === 'object' 
        ? selectedKontrakan.penyewa._id 
        : selectedKontrakan.penyewa;
      setSelectedPenyewaId(penyewaId || "");
    } else {
      setSelectedPenyewaId("");
    }
  }, [selectedKontrakan]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validasi tipe file
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
      if (!validTypes.includes(file.type)) {
        setAlert({
          isOpen: true,
          type: 'warning',
          title: 'Format File Tidak Valid',
          message: 'Hanya file gambar (JPG, PNG, GIF, WEBP) yang diperbolehkan'
        });
        e.target.value = '';
        return;
      }

      // Validasi ukuran file
      if (file.size > 5 * 1024 * 1024) {
        setAlert({
          isOpen: true,
          type: 'warning',
          title: 'File Terlalu Besar',
          message: 'Ukuran file maksimal 5MB'
        });
        e.target.value = '';
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, buktiPembayaran: reader.result });
      };
      reader.onerror = () => {
        setAlert({
          isOpen: true,
          type: 'error',
          title: 'Error',
          message: 'Gagal membaca file. Silakan coba lagi.'
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const validateEmail = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  const validatePhone = (phone) => {
    const re = /^[0-9+\-\s()]{8,}$/;
    return re.test(phone);
  };

  const handleCreateNewTenant = async () => {
    // Validasi input
    if (!newTenant.nama || !newTenant.telepon || !newTenant.email) {
      setAlert({
        isOpen: true,
        type: 'warning',
        title: 'Data Tidak Lengkap',
        message: 'Nama, email, dan telepon wajib diisi!'
      });
      return;
    }

    if (!validateEmail(newTenant.email)) {
      setAlert({
        isOpen: true,
        type: 'warning',
        title: 'Email Tidak Valid',
        message: 'Format email tidak valid. Contoh: nama@email.com'
      });
      return;
    }

    if (!validatePhone(newTenant.telepon)) {
      setAlert({
        isOpen: true,
        type: 'warning',
        title: 'Nomor Telepon Tidak Valid',
        message: 'Nomor telepon harus minimal 8 digit angka'
      });
      return;
    }

    try {
      setSubmitting(true);
      const response = await axios.post(`${API_URL}/penyewa`, newTenant);
      const newPenyewaData = response.data?.data || response.data;
      setPenyewaList([...penyewaList, newPenyewaData]);
      setSelectedPenyewaId(newPenyewaData._id);
      setNewTenant({ nama: "", email: "", telepon: "", alamat: "" });
      setShowNewTenantForm(false);
      setAlert({
        isOpen: true,
        type: 'success',
        title: 'Berhasil',
        message: 'Penyewa baru berhasil ditambahkan!'
      });
    } catch (error) {
      console.error("Error creating tenant:", error);
      setAlert({
        isOpen: true,
        type: 'error',
        title: 'Error',
        message: error.response?.data?.message || 'Gagal menambahkan penyewa. Silakan coba lagi.'
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validasi form
    if (!selectedKontrakan || !selectedPenyewaId || !duration || !paymentMethod) {
      setAlert({
        isOpen: true,
        type: 'warning',
        title: 'Data Tidak Lengkap',
        message: 'Mohon lengkapi semua data pesanan!'
      });
      return;
    }

    if (duration < 1 || duration > 24) {
      setAlert({
        isOpen: true,
        type: 'warning',
        title: 'Durasi Tidak Valid',
        message: 'Jangka waktu harus antara 1-24 bulan'
      });
      return;
    }

    if (paymentMethod !== 'Cash' && !formData.buktiPembayaran) {
      setAlert({
        isOpen: true,
        type: 'warning',
        title: 'Bukti Pembayaran Diperlukan',
        message: 'Bukti pembayaran wajib diupload untuk metode Transfer/QRIS'
      });
      return;
    }

    // Cek apakah kontrakan sudah dikontrak
    if (selectedKontrakan.statusKontrak === "Sudah Dikontrak") {
      setAlert({
        isOpen: true,
        type: 'error',
        title: 'Kontrakan Tidak Tersedia',
        message: 'Kontrakan ini sudah dikontrak oleh orang lain!'
      });
      return;
    }

    try {
      setSubmitting(true);
      const totalHarga = (selectedKontrakan.hargaPerBulan || 0) * duration;

      // 1. Update Kontrakan (Assign Penyewa & Status)
      await axios.put(`${API_URL}/kontrakan/${selectedKontrakan._id}`, {
        penyewa: selectedPenyewaId,
        statusKontrak: "Sudah Dikontrak",
        duration: duration
      });

      // 2. Create Pembayaran
      const paymentData = {
        kontrakan: selectedKontrakan._id,
        penyewa: selectedPenyewaId,
        jumlah: totalHarga,
        bulanPembayaran: duration,
        buktiPembayaran: formData.buktiPembayaran || null,
        metodePembayaran: paymentMethod,
      };

      await axios.post(`${API_URL}/pembayaran`, paymentData);
      
      setAlert({
        isOpen: true,
        type: 'success',
        title: 'Berhasil!',
        message: '🎉 Pesanan berhasil dibuat! Menunggu konfirmasi admin.'
      });

      // Reset form
      resetForm();
      await fetchData();
    } catch (error) {
      console.error("Error submitting order:", error);
      setAlert({
        isOpen: true,
        type: 'error',
        title: 'Error',
        message: error.response?.data?.message || 'Gagal membuat pesanan. Silakan coba lagi.'
      });
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({ buktiPembayaran: null });
    setDuration(1);
    setPaymentMethod("Cash");
    setSelectedPenyewaId("");
    setSelectedKontrakan(null);
    setShowPaymentForm(false);
    setShowNewTenantForm(false);
    setNewTenant({ nama: "", email: "", telepon: "", alamat: "" });
  };

  const handleViewDetail = (item) => {
    setSelectedPembayaran(item);
    setShowDetailModal(true);
  };

  const getKontrakanPembayaran = (kontrakanId) => {
    return pembayaran.filter((p) => {
      const pKontrakanId = typeof p.kontrakan === 'object' ? p.kontrakan?._id : p.kontrakan;
      return pKontrakanId === kontrakanId;
    });
  };

  const getStatusColor = (status) => {
    const statusLower = status?.toLowerCase() || '';
    switch (statusLower) {
      case "dibayar":
      case "terbayar":
        return "bg-green-100 text-green-800";
      case "belum dibayar":
      case "menunggu konfirmasi":
        return "bg-yellow-100 text-yellow-800";
      case "terlambat":
      case "ditolak":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusIcon = (status) => {
    const statusLower = status?.toLowerCase() || '';
    switch (statusLower) {
      case "dibayar":
      case "terbayar":
        return <CheckCircle size={18} className="text-green-600" />;
      case "belum dibayar":
      case "menunggu konfirmasi":
        return <Clock size={18} className="text-yellow-600" />;
      case "terlambat":
      case "ditolak":
        return <XCircle size={18} className="text-red-600" />;
      default:
        return null;
    }
  };

  const availableKontrakan = kontrakan.filter(k => k.statusKontrak === "Belum Dikontrak");

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-2">🏠 Pesan Kontrakan</h1>
            <p className="text-gray-600">Temukan dan pesan kontrakan impian Anda</p>
          </div>
          <button
            onClick={() => setShowPaymentForm(!showPaymentForm)}
            className="bg-gradient-to-r from-pink-500 to-purple-600 text-white px-6 py-3 rounded-lg font-semibold flex items-center gap-2 hover:shadow-lg transition transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={availableKontrakan.length === 0}
          >
            <Plus size={20} />
            Buat Pesanan Baru
          </button>
        </div>

        {/* Info Banner */}
        <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6 rounded-lg">
          <p className="text-blue-800">
            ℹ️ <strong>Cara Pesan:</strong> Pilih kontrakan yang tersedia → Isi data penyewa → Pilih durasi → Upload bukti pembayaran → Tunggu konfirmasi admin
          </p>
        </div>

        {availableKontrakan.length === 0 && !loading && (
          <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 mb-6 rounded-lg">
            <p className="text-yellow-800">
              ⚠️ <strong>Perhatian:</strong> Saat ini tidak ada kontrakan yang tersedia. Silakan hubungi admin untuk informasi lebih lanjut.
            </p>
          </div>
        )}

        {/* Payment Form Modal */}
        {showPaymentForm && (
          <div className="bg-white rounded-lg shadow-2xl p-6 md:p-8 mb-8 border-l-4 border-purple-500">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
              <Home className="text-purple-600" />
              Form Pemesanan & Pembayaran
            </h2>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Pilih Kontrakan */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  1️⃣ Pilih Kontrakan *
                </label>
                <select
                  value={selectedKontrakan?._id || ""}
                  onChange={(e) => {
                    const selected = kontrakan.find((k) => k._id === e.target.value);
                    setSelectedKontrakan(selected);
                  }}
                  required
                  disabled={submitting}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                >
                  <option value="">-- Pilih Kontrakan yang Tersedia --</option>
                  {availableKontrakan.length === 0 && (
                    <option disabled>Tidak ada kontrakan yang tersedia</option>
                  )}
                  {availableKontrakan.map((k) => (
                    <option key={k._id} value={k._id}>
                      {k.namaKontrakan || k.alamat} - Rp{(k.hargaPerBulan || 0).toLocaleString("id-ID")}/bulan
                    </option>
                  ))}
                </select>
              </div>

              {/* Info Kontrakan */}
              {selectedKontrakan && (
                <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-6 rounded-lg border border-purple-200">
                  <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <MapPin className="text-purple-600" size={20} />
                    Detail Kontrakan
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Nama Kontrakan</p>
                      <p className="font-semibold text-gray-800">{selectedKontrakan.namaKontrakan || "-"}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Alamat</p>
                      <p className="font-semibold text-gray-800">{selectedKontrakan.alamat}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Harga Per Bulan</p>
                      <p className="font-semibold text-purple-600 text-lg">
                        Rp {(selectedKontrakan.hargaPerBulan || 0).toLocaleString("id-ID")}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Fasilitas</p>
                      <p className="font-semibold text-gray-800">{selectedKontrakan.fasilitas || "-"}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Pilih Penyewa atau Tambah Baru */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                  <User size={16} /> 2️⃣ Data Penyewa *
                </label>
                
                {!showNewTenantForm ? (
                  <div className="space-y-3">
                    <select
                      value={selectedPenyewaId}
                      onChange={(e) => setSelectedPenyewaId(e.target.value)}
                      required={!showNewTenantForm}
                      disabled={submitting}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                    >
                      <option value="">-- Pilih Penyewa yang Sudah Terdaftar --</option>
                      {penyewaList.map((p) => (
                        <option key={p._id} value={p._id}>
                          {p.nama} — {p.telepon}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => setShowNewTenantForm(true)}
                      disabled={submitting}
                      className="w-full bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Plus size={16} />
                      Atau Daftar Sebagai Penyewa Baru
                    </button>
                  </div>
                ) : (
                  <div className="bg-gray-50 p-6 rounded-lg space-y-4 border-2 border-dashed border-gray-300">
                    <h4 className="font-semibold text-gray-800 mb-3">Pendaftaran Penyewa Baru</h4>
                    <input
                      type="text"
                      placeholder="Nama Lengkap *"
                      value={newTenant.nama}
                      onChange={(e) => setNewTenant({ ...newTenant, nama: e.target.value })}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none"
                      disabled={submitting}
                      required
                    />
                    <input
                      type="email"
                      placeholder="Email *"
                      value={newTenant.email}
                      onChange={(e) => setNewTenant({ ...newTenant, email: e.target.value })}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none"
                      disabled={submitting}
                      required
                    />
                    <input
                      type="tel"
                      placeholder="Nomor Telepon/WhatsApp *"
                      value={newTenant.telepon}
                      onChange={(e) => setNewTenant({ ...newTenant, telepon: e.target.value })}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none"
                      disabled={submitting}
                      required
                    />
                    <textarea
                      placeholder="Alamat Lengkap (Opsional)"
                      value={newTenant.alamat}
                      onChange={(e) => setNewTenant({ ...newTenant, alamat: e.target.value })}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none"
                      rows="2"
                      disabled={submitting}
                    />
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={handleCreateNewTenant}
                        disabled={submitting}
                        className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {submitting ? 'Menyimpan...' : 'Simpan & Lanjutkan'}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setShowNewTenantForm(false);
                          setNewTenant({ nama: "", email: "", telepon: "", alamat: "" });
                        }}
                        disabled={submitting}
                        className="flex-1 bg-gray-300 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-400 transition disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Batal
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Jangka Waktu */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                    <Calendar size={16} /> 3️⃣ Jangka Waktu (Bulan) *
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="24"
                    value={duration}
                    onChange={(e) => setDuration(Number(e.target.value))}
                    required
                    disabled={submitting}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                    placeholder="Minimal 1 bulan"
                  />
                  <p className="text-xs text-gray-500 mt-1">Maksimal 24 bulan</p>
                </div>

                {/* Metode Pembayaran */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                    <CreditCard size={16} /> 4️⃣ Metode Pembayaran *
                  </label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    required
                    disabled={submitting}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                  >
                    <option value="Cash">💵 Cash (Tunai)</option>
                    <option value="Transfer">🏦 Transfer Bank</option>
                    <option value="QRIS">📱 QRIS</option>
                  </select>
                </div>
              </div>

              {/* Total Kalkulasi */}
              <div className="bg-gradient-to-r from-purple-100 to-pink-100 p-6 rounded-lg border-2 border-purple-300">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-purple-700 font-medium text-sm">Total Pembayaran</p>
                    <p className="text-gray-600 text-xs">
                      ({duration} bulan × Rp {(selectedKontrakan?.hargaPerBulan || 0).toLocaleString("id-ID")})
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-3xl font-bold text-purple-700">
                      Rp {selectedKontrakan ? ((selectedKontrakan.hargaPerBulan || 0) * duration).toLocaleString("id-ID") : 0}
                    </p>
                  </div>
                </div>
              </div>

              {/* Upload Bukti Pembayaran */}
              {paymentMethod !== 'Cash' && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    5️⃣ Upload Bukti Pembayaran (Wajib untuk Transfer/QRIS) *
                  </label>
                  <div className="border-2 border-dashed border-purple-300 rounded-lg p-8 text-center hover:border-purple-500 transition bg-purple-50">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      required={paymentMethod !== 'Cash'}
                      disabled={submitting}
                      className="hidden"
                      id="buktiPembayaran"
                    />
                    <label htmlFor="buktiPembayaran" className={`cursor-pointer ${submitting ? 'opacity-50 cursor-not-allowed' : ''}`}>
                      <div className="flex flex-col items-center gap-3">
                        {formData.buktiPembayaran ? (
                          <div className="w-full">
                            <CheckCircle size={48} className="text-green-500 mx-auto mb-2" />
                            <p className="text-green-600 font-semibold mb-3">✓ File Berhasil Diupload</p>
                            <img
                              src={formData.buktiPembayaran}
                              alt="Preview"
                              className="mt-2 max-h-64 mx-auto rounded-lg object-contain border-2 border-green-300"
                            />
                            <p className="text-sm text-gray-500 mt-2">Klik untuk mengganti gambar</p>
                          </div>
                        ) : (
                          <div>
                            <Upload size={48} className="text-purple-400 mx-auto mb-3" />
                            <p className="text-gray-700 font-semibold text-lg">Klik untuk upload bukti pembayaran</p>
                            <p className="text-sm text-gray-500 mt-1">atau drag dan drop file gambar (Max 5MB)</p>
                            <p className="text-xs text-gray-400 mt-2">Format: JPG, PNG, GIF, WEBP</p>
                          </div>
                        )}
                      </div>
                    </label>
                  </div>
                </div>
              )}

              {/* Payment Info */}
              {paymentMethod === 'Transfer' && (
                <div className="bg-blue-50 p-4 rounded-lg border-l-4 border-blue-500">
                  <p className="font-semibold text-blue-800 mb-2">Informasi Transfer Bank:</p>
                  <p className="text-blue-700">Bank BCA - 1234567890</p>
                  <p className="text-blue-700">a.n. Endang Padang Property</p>
                </div>
              )}

              {paymentMethod === 'QRIS' && (
                <div className="bg-blue-50 p-4 rounded-lg border-l-4 border-blue-500">
                  <p className="font-semibold text-blue-800 mb-2">Scan QRIS:</p>
                  <p className="text-blue-700">Silakan scan kode QRIS yang tersedia atau hubungi admin</p>
                </div>
              )}

              {/* Buttons */}
              <div className="flex flex-col md:flex-row gap-4 pt-4">
                <button
                  type="submit"
                  disabled={submitting || !selectedKontrakan || !selectedPenyewaId || (paymentMethod !== 'Cash' && !formData.buktiPembayaran)}
                  className="flex-1 bg-gradient-to-r from-pink-500 to-purple-600 text-white px-6 py-4 rounded-lg font-semibold hover:shadow-xl transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105"
                >
                  {submitting ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      Memproses...
                    </>
                  ) : (
                    <>
                      <CheckCircle size={20} />
                      Konfirmasi & Kirim Pesanan
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  disabled={submitting}
                  className="flex-1 bg-gray-300 text-gray-800 px-6 py-4 rounded-lg font-semibold hover:bg-gray-400 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Batal
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Kontrakan List */}
        {loading ? (
          <div className="text-center py-16">
            <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-purple-600 mx-auto mb-4"></div>
            <p className="text-gray-600 font-semibold">Memuat data kontrakan...</p>
          </div>
        ) : kontrakan.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <Home size={64} className="text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600 text-lg">Belum ada kontrakan yang tersedia</p>
            <p className="text-gray-400 text-sm mt-2">Silakan hubungi admin untuk informasi lebih lanjut</p>
          </div>
        ) : (
          <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-6">📋 Daftar Semua Kontrakan</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {kontrakan.map((k) => (
                <div key={k._id} className="bg-white rounded-lg shadow-lg hover:shadow-xl transition-shadow p-6 border-l-4 border-purple-500">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-gray-800 mb-2">
                        {k.namaKontrakan || k.alamat}
                      </h3>
                      <p className="text-gray-600 flex items-center gap-2 mb-2">
                        <MapPin size={16} className="text-purple-500" />
                        {k.alamat}
                      </p>
                      <p className="text-2xl font-bold text-purple-600 mb-2">
                        Rp {(k.hargaPerBulan || 0).toLocaleString("id-ID")}/bulan
                      </p>
                    </div>
                    <span
                      className={`px-4 py-2 rounded-full font-semibold text-sm whitespace-nowrap ${
                        k.statusKontrak === "Belum Dikontrak"
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {k.statusKontrak}
                    </span>
                  </div>

                  {k.fasilitas && (
                    <div className="mb-4">
                      <p className="text-sm text-gray-600 mb-1">Fasilitas:</p>
                      <p className="text-gray-800">{k.fasilitas}</p>
                    </div>
                  )}

                  {/* Pembayaran untuk kontrakan ini */}
                  {getKontrakanPembayaran(k._id).length > 0 && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <h4 className="font-semibold text-gray-800 mb-3">Riwayat Pembayaran</h4>
                      <div className="space-y-2">
                        {getKontrakanPembayaran(k._id).map((p) => (
                          <div
                            key={p._id}
                            className="flex items-center justify-between bg-gray-50 p-3 rounded-lg hover:bg-gray-100 transition"
                          >
                            <div className="flex items-center gap-3 flex-1">
                              {getStatusIcon(p.status)}
                              <div>
                                <p className="font-semibold text-gray-800">{p.bulanPembayaran} Bulan</p>
                                <p className="text-sm text-gray-600">
                                  Rp {(p.jumlah || 0).toLocaleString("id-ID")}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(p.status)}`}>
                                {p.status}
                              </span>
                              <button
                                onClick={() => handleViewDetail(p)}
                                className="p-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition"
                                title="Lihat Detail"
                              >
                                <Eye size={18} />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Detail Modal */}
        {showDetailModal && selectedPembayaran && (
          <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
              <div className="p-8">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-gray-800">Detail Pembayaran</h2>
                  <button
                    onClick={() => setShowDetailModal(false)}
                    className="text-gray-400 hover:text-gray-600 text-2xl font-bold w-8 h-8 flex items-center justify-center"
                  >
                    ×
                  </button>
                </div>

                <div className="space-y-6">
                  {/* Status */}
                  <div className="bg-gray-50 p-6 rounded-lg text-center">
                    <p className="text-gray-600 mb-3 font-medium">Status Pembayaran</p>
                    <div className="flex items-center justify-center gap-2">
                      {getStatusIcon(selectedPembayaran.status)}
                      <span className={`inline-block px-6 py-3 rounded-full text-lg font-bold ${getStatusColor(selectedPembayaran.status)}`}>
                        {selectedPembayaran.status}
                      </span>
                    </div>
                  </div>

                  {/* Info Pembayaran */}
                  <div>
                    <h3 className="font-semibold text-gray-800 mb-3 text-lg">💳 Informasi Pembayaran</h3>
                    <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Durasi:</span>
                        <span className="font-semibold">{selectedPembayaran.bulanPembayaran} Bulan</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Jumlah:</span>
                        <span className="font-semibold text-lg">Rp {(selectedPembayaran.jumlah || 0).toLocaleString("id-ID")}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Metode:</span>
                        <span className="font-semibold">{selectedPembayaran.metodePembayaran || "N/A"}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Tanggal Upload:</span>
                        <span className="font-semibold">
                          {new Date(selectedPembayaran.tanggalUpload).toLocaleDateString("id-ID", {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </span>
                      </div>
                      {selectedPembayaran.tanggalKonfirmasi && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Tanggal Konfirmasi:</span>
                          <span className="font-semibold text-green-600">
                            {new Date(selectedPembayaran.tanggalKonfirmasi).toLocaleDateString("id-ID", {
                              weekday: 'long',
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Kontrakan Info */}
                  <div>
                    <h3 className="font-semibold text-gray-800 mb-3 text-lg">🏠 Informasi Kontrakan</h3>
                    <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                      <p>
                        <span className="text-gray-600">Nama:</span>{" "}
                        <span className="font-semibold">
                          {selectedPembayaran.kontrakan?.namaKontrakan || selectedPembayaran.kontrakan?.alamat || "N/A"}
                        </span>
                      </p>
                      <p>
                        <span className="text-gray-600">Alamat:</span>{" "}
                        <span className="font-semibold">{selectedPembayaran.kontrakan?.alamat || "N/A"}</span>
                      </p>
                    </div>
                  </div>

                  {/* Bukti Pembayaran */}
                  {selectedPembayaran.buktiPembayaran && (
                    <div>
                      <h3 className="font-semibold text-gray-800 mb-3 text-lg">📸 Bukti Pembayaran</h3>
                      <div className="bg-gray-100 p-4 rounded-lg">
                        <img
                          src={selectedPembayaran.buktiPembayaran}
                          alt="Bukti Pembayaran"
                          className="w-full rounded-lg border-2 border-gray-300 max-h-[400px] object-contain"
                        />
                      </div>
                    </div>
                  )}

                  {/* Keterangan dari Admin */}
                  {selectedPembayaran.keterangan && (
                    <div className="bg-blue-50 p-4 rounded-lg border-l-4 border-blue-500">
                      <p className="text-sm text-blue-600 mb-2 font-semibold">📝 Catatan Admin:</p>
                      <p className="text-gray-800">{selectedPembayaran.keterangan}</p>
                    </div>
                  )}
                </div>

                <button
                  onClick={() => setShowDetailModal(false)}
                  className="mt-8 w-full bg-gradient-to-r from-gray-600 to-gray-700 text-white px-6 py-3 rounded-lg font-semibold hover:shadow-lg transition"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Custom Alert */}
        <Alert
          isOpen={alert.isOpen}
          onClose={() => setAlert({ ...alert, isOpen: false })}
          type={alert.type}
          title={alert.title}
          message={alert.message}
        />
      </div>
    </div>
  );
}