import { useState, useEffect } from "react";
import axios from "axios";
import { RefreshCw, Calendar, CreditCard, Upload, CheckCircle, XCircle, Eye, MapPin, Home, User } from "lucide-react";
import Alert from "../components/Alert";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export default function PerpanjanganKontrakan() {
  const [kontrakan, setKontrakan] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showExtensionForm, setShowExtensionForm] = useState(false);
  const [selectedKontrakan, setSelectedKontrakan] = useState(null);
  const [extensionMonths, setExtensionMonths] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState("Cash");
  const [formData, setFormData] = useState({
    buktiPembayaran: null,
  });
  const [submitting, setSubmitting] = useState(false);

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
      const resKontrakan = await axios.get(`${API_URL}/kontrakan`);
      setKontrakan(resKontrakan.data?.data || resKontrakan.data || []);
    } catch (error) {
      console.error("Error fetching data:", error);
      setAlert({
        isOpen: true,
        type: 'error',
        title: 'Error',
        message: 'Gagal memuat data kontrakan. Pastikan server backend berjalan di ' + API_URL
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
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

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!selectedKontrakan || !extensionMonths || !paymentMethod) {
      setAlert({
        isOpen: true,
        type: 'warning',
        title: 'Data Tidak Lengkap',
        message: 'Mohon lengkapi semua data perpanjangan!'
      });
      return;
    }

    if (extensionMonths < 1 || extensionMonths > 24) {
      setAlert({
        isOpen: true,
        type: 'warning',
        title: 'Durasi Tidak Valid',
        message: 'Perpanjangan harus antara 1-24 bulan'
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

    try {
      setSubmitting(true);
      const totalHarga = (selectedKontrakan.hargaPerBulan || 0) * extensionMonths;

      // Update kontrakan dengan perpanjangan
      await axios.put(`${API_URL}/kontrakan/${selectedKontrakan._id}`, {
        penyewa: selectedKontrakan.penyewa._id,
        duration: extensionMonths
      });

      // Create pembayaran untuk perpanjangan
      const paymentData = {
        kontrakan: selectedKontrakan._id,
        penyewa: selectedKontrakan.penyewa._id,
        jumlah: totalHarga,
        bulanPembayaran: extensionMonths,
        buktiPembayaran: formData.buktiPembayaran || null,
        metodePembayaran: paymentMethod,
      };

      await axios.post(`${API_URL}/pembayaran`, paymentData);

      setAlert({
        isOpen: true,
        type: 'success',
        title: 'Berhasil!',
        message: '🎉 Perpanjangan kontrakan berhasil! Menunggu konfirmasi admin.'
      });

      resetForm();
      await fetchData();
    } catch (error) {
      console.error("Error submitting extension:", error);
      setAlert({
        isOpen: true,
        type: 'error',
        title: 'Error',
        message: error.response?.data?.message || 'Gagal memperpanjang kontrakan. Silakan coba lagi.'
      });
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({ buktiPembayaran: null });
    setExtensionMonths(1);
    setPaymentMethod("Cash");
    setSelectedKontrakan(null);
    setShowExtensionForm(false);
  };

  const kontrakanYangDikontrak = kontrakan.filter(k => k.statusKontrak === "Sudah Dikontrak");

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent mb-2">
              🔄 Perpanjangan Kontrakan
            </h1>
            <p className="text-gray-600">Perpanjang masa sewa kontrakan Anda</p>
          </div>
          <button
            onClick={() => setShowExtensionForm(!showExtensionForm)}
            className="bg-gradient-to-r from-pink-500 to-purple-600 text-white px-6 py-3 rounded-lg font-semibold flex items-center gap-2 hover:shadow-lg transition transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={kontrakanYangDikontrak.length === 0}
          >
            <RefreshCw size={20} />
            Perpanjang Kontrakan
          </button>
        </div>

        {/* Info Banner */}
        <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6 rounded-lg">
          <p className="text-blue-800">
            ℹ️ <strong>Cara Perpanjang:</strong> Pilih kontrakan yang sudah dikontrak → Tentukan durasi perpanjangan → Pilih metode pembayaran → Upload bukti pembayaran → Tunggu konfirmasi admin
          </p>
        </div>

        {kontrakanYangDikontrak.length === 0 && !loading && (
          <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 mb-6 rounded-lg">
            <p className="text-yellow-800">
              ⚠️ <strong>Perhatian:</strong> Tidak ada kontrakan yang sedang dikontrak. Lakukan pemesanan kontrakan terlebih dahulu.
            </p>
          </div>
        )}

        {/* Extension Form Modal */}
        {showExtensionForm && (
          <div className="bg-white rounded-lg shadow-2xl p-6 md:p-8 mb-8 border-l-4 border-purple-500">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
              <RefreshCw className="text-purple-600" />
              Form Perpanjangan Kontrakan
            </h2>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Pilih Kontrakan */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  1️⃣ Pilih Kontrakan yang Akan Diperpanjang *
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
                  <option value="">-- Pilih Kontrakan --</option>
                  {kontrakanYangDikontrak.length === 0 && (
                    <option disabled>Tidak ada kontrakan yang dikontrak</option>
                  )}
                  {kontrakanYangDikontrak.map((k) => (
                    <option key={k._id} value={k._id}>
                      {k.namaKontrakan || k.alamat} - {k.penyewa?.nama} - Jatuh Tempo: {new Date(k.tanggalJatuhTempo).toLocaleDateString("id-ID")}
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
                      <p className="text-sm text-gray-600">Penyewa</p>
                      <p className="font-semibold text-gray-800">{selectedKontrakan.penyewa?.nama}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Tanggal Jatuh Tempo</p>
                      <p className="font-semibold text-gray-800">{new Date(selectedKontrakan.tanggalJatuhTempo).toLocaleDateString("id-ID")}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Harga Per Bulan</p>
                      <p className="font-semibold text-purple-600 text-lg">
                        Rp {(selectedKontrakan.hargaPerBulan || 0).toLocaleString("id-ID")}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Durasi Perpanjangan */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                    <Calendar size={16} /> 2️⃣ Durasi Perpanjangan (Bulan) *
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="24"
                    value={extensionMonths}
                    onChange={(e) => setExtensionMonths(Number(e.target.value))}
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
                    <CreditCard size={16} /> 3️⃣ Metode Pembayaran *
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
                    <p className="text-purple-700 font-medium text-sm">Total Pembayaran Perpanjangan</p>
                    <p className="text-gray-600 text-xs">
                      ({extensionMonths} bulan × Rp {(selectedKontrakan?.hargaPerBulan || 0).toLocaleString("id-ID")})
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-3xl font-bold text-purple-700">
                      Rp {selectedKontrakan ? ((selectedKontrakan.hargaPerBulan || 0) * extensionMonths).toLocaleString("id-ID") : 0}
                    </p>
                  </div>
                </div>
              </div>

              {/* Upload Bukti Pembayaran */}
              {paymentMethod !== 'Cash' && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    4️⃣ Upload Bukti Pembayaran (Wajib untuk Transfer/QRIS) *
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
                  disabled={submitting || !selectedKontrakan || (paymentMethod !== 'Cash' && !formData.buktiPembayaran)}
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
                      Konfirmasi & Kirim Perpanjangan
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
            <h2 className="text-2xl font-bold text-gray-800 mb-6">📋 Daftar Kontrakan yang Dikontrak</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {kontrakanYangDikontrak.map((k) => (
                <div key={k._id} className="bg-white rounded-lg shadow-lg hover:shadow-xl transition-shadow p-6 border-l-4 border-green-500">
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
                        Rp {(k.hargaPerBulan || 0).toLocaleString("id-ID")}
                      </p>
                      <div className="flex items-center gap-2 mb-2">
                        <User size={16} className="text-blue-500" />
                        <p className="text-gray-700">{k.penyewa?.nama}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar size={16} className="text-orange-500" />
                        <p className="text-gray-700">
                          Jatuh Tempo: {new Date(k.tanggalJatuhTempo).toLocaleDateString("id-ID")}
                        </p>
                      </div>
                    </div>
                    <span className="px-4 py-2 rounded-full font-semibold text-sm whitespace-nowrap bg-green-100 text-green-800">
                      {k.statusKontrak}
                    </span>
                  </div>

                  {/* History Perpanjangan */}
                  {k.history && k.history.filter(h => h.type === 'extension').length > 0 && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <h4 className="font-semibold text-gray-800 mb-3">Riwayat Perpanjangan</h4>
                      <div className="space-y-2">
                        {k.history.filter(h => h.type === 'extension').map((h, index) => (
                          <div
                            key={index}
                            className="flex items-center justify-between bg-blue-50 p-3 rounded-lg"
                          >
                            <div className="flex items-center gap-3 flex-1">
                              <RefreshCw size={18} className="text-blue-600" />
                              <div>
                                <p className="font-semibold text-gray-800">+{h.details?.extendedMonths} Bulan</p>
                                <p className="text-sm text-gray-600">
                                  {new Date(h.date).toLocaleDateString("id-ID")}
                                </p>
                              </div>
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
