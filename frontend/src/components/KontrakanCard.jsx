import api from "../utils/api"; // Ganti axios dengan instance api terpusat
import { useState } from "react";
import { Edit3, Trash2, MapPin, DollarSign, Home, CheckCircle, Clock } from "lucide-react";
import Alert from "./Alert";

export default function KontrakanCard({ data, refresh }) {
  const [showModal, setShowModal] = useState(false);
  const [penyewaList, setPenyewaList] = useState([]);
  const [paymentMonths, setPaymentMonths] = useState(1);
  const [paymentFile, setPaymentFile] = useState(null);
  const [isSubmittingPayment, setIsSubmittingPayment] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('Transfer');
  const [kontrakanImageFile, setKontrakanImageFile] = useState(null);
  const [editForm, setEditForm] = useState({
    hargaPerBulan: data.hargaPerBulan || 0,
    penyewa: data.penyewa?._id || '',
    tanggalMulai: data.tanggalMulai ? new Date(data.tanggalMulai).toISOString().slice(0,10) : '',
    tanggalJatuhTempo: data.tanggalJatuhTempo ? new Date(data.tanggalJatuhTempo).toISOString().slice(0,10) : '',
  });

  // Alert State
  const [alert, setAlert] = useState({
    isOpen: false,
    type: 'info',
    title: '',
    message: ''
  });

  const statusKontrakColor = {
    "Sudah Dikontrak": { bg: "bg-green-50", text: "text-green-700", dot: "bg-green-500", icon: CheckCircle },
    "Belum Dikontrak": { bg: "bg-yellow-50", text: "text-yellow-700", dot: "bg-yellow-500", icon: Clock },
  };

  const colorClass = statusKontrakColor[data.statusKontrak] || statusKontrakColor["Belum Dikontrak"];
  const StatusIcon = colorClass.icon;

  const hapus = async () => {
    if (confirm("Yakin hapus kontrakan ini?")) {
      try {
        await api.delete(`/kontrakan/${data._id}`);
        refresh();
        setAlert({
          isOpen: true,
          type: 'success',
          title: 'Berhasil',
          message: 'Kontrakan berhasil dihapus'
        });
      } catch {
        setAlert({
          isOpen: true,
          type: 'error',
          title: 'Error',
          message: 'Gagal menghapus kontrakan'
        });
      }
    }
  };

  const togglePayment = async () => {
    try {
      const newStatus = data.statusPembayaran === 'Lunas' ? 'Belum Bayar' : 'Lunas';

      if (newStatus === 'Lunas' && data.penyewa) {
        // Jika mark sebagai Lunas dan ada penyewa, buat record pembayaran
        const jumlah = Number(data.hargaPerBulan);
        const payload = {
          kontrakan: data._id,
          penyewa: data.penyewa._id || data.penyewa,
          jumlah,
          bulanPembayaran: 1, // Default 1 bulan
          metodePembayaran: 'Cash', // Default Cash untuk mark lunas manual
          status: 'Terbayar',
          statusApproval: 'approved',
          dikonfirmasiOleh: 'Admin', // Manual confirmation
        };

        await api.post('/pembayaran', payload);
        setAlert({
          isOpen: true,
          type: 'success',
          title: 'Berhasil',
          message: 'Pembayaran berhasil dicatat dan status diperbarui ke Lunas'
        });
      } else {
        // Jika mark sebagai Belum Bayar atau tidak ada penyewa, hanya update status
        await api.put(`/kontrakan/${data._id}`, { statusPembayaran: newStatus });
        setAlert({
          isOpen: true,
          type: 'success',
          title: 'Berhasil',
          message: `Status pembayaran diperbarui ke ${newStatus}`
        });
      }

      refresh();
    } catch (err) {
      console.error(err);
      setAlert({
        isOpen: true,
        type: 'error',
        title: 'Error',
        message: 'Gagal memperbarui status pembayaran'
      });
    }
  };

  const openModal = async () => {
    setShowModal(true);
    try {
      const res = await api.get('/penyewa');
      setPenyewaList(res.data || []);
      // Auto-calc default payment months based on tanggalMulai & tanggalJatuhTempo
      try {
        const months = calcMonthsBetweenDates(data.tanggalMulai, data.tanggalJatuhTempo);
        setPaymentMonths(months);
      } catch (e) {
        setPaymentMonths(1);
      }
    } catch (err) {
      console.warn('Gagal mengambil penyewa', err.message);
    }
  };

  const handleTanggalMulaiChange = (newDate) => {
    setEditForm({...editForm, tanggalMulai: newDate});
    // Recalc months when date changes
    const months = calcMonthsBetweenDates(newDate, editForm.tanggalJatuhTempo);
    setPaymentMonths(months);
  };

  const handleTanggalJatuhTempoChange = (newDate) => {
    setEditForm({...editForm, tanggalJatuhTempo: newDate});
    // Recalc months when date changes
    const months = calcMonthsBetweenDates(editForm.tanggalMulai, newDate);
    setPaymentMonths(months);
  };



  const calcMonthsBetweenDates = (startDate, endDate) => {
    if (!startDate || !endDate) return 1;
    try {
      const start = new Date(startDate);
      const end = new Date(endDate);
      if (end <= start) return 1; // end harus lebih besar dari start
      let months = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
      // Count partial month as well
      if (end.getDate() >= start.getDate()) months += 1;
      if (months < 1) months = 1;
      return months;
    } catch {
      return 1;
    }
  };

  

  // Refactored updater: allows not closing modal when close=false
  const saveDetails = async (close = true) => {
    try {
      const payload = {
        hargaPerBulan: Number(editForm.hargaPerBulan),
        penyewa: editForm.penyewa || null,
        tanggalMulai: editForm.tanggalMulai || null,
        tanggalJatuhTempo: editForm.tanggalJatuhTempo || null,
      };
      if (payload.penyewa) payload.statusKontrak = 'Sudah Dikontrak';
      else payload.statusKontrak = 'Belum Dikontrak';

      // Handle kontrakan image upload
      if (kontrakanImageFile) {
        const base64 = await fileToBase64(kontrakanImageFile);
        payload.gambar = base64;
      }

      await api.put(`/kontrakan/${data._id}`, payload);
      if (close) {
        setShowModal(false);
        setKontrakanImageFile(null);
        refresh();
        alert('Detail kontrakan diperbarui');
      }
      return true;
    } catch (err) {
      console.error(err);
      alert('Gagal menyimpan detail kontrakan');
      return false;
    }
  };

  const handleSaveAndPayment = async () => {
    try {
      setIsSubmittingPayment(true);

      // First save kontrakan details but keep modal open
      const saved = await saveDetails(false);
      if (!saved) {
        setIsSubmittingPayment(false);
        return;
      }

      // If kontrakan belum Lunas, submit pembayaran when applicable
      if (data.statusPembayaran !== 'Lunas') {
        const penyewaId = editForm.penyewa || (data.penyewa?._id) || data.penyewa;
        if (!penyewaId) {
          setAlert({
            isOpen: true,
            type: 'warning',
            title: 'Penyewa Diperlukan',
            message: 'Tentukan penyewa terlebih dulu untuk melakukan pembayaran'
          });
          setIsSubmittingPayment(false);
          return;
        }

        if (paymentMethod !== 'Cash' && !paymentFile) {
          setAlert({
            isOpen: true,
            type: 'warning',
            title: 'Bukti Pembayaran Diperlukan',
            message: 'Unggah bukti pembayaran terlebih dulu (untuk Transfer/QRIS)'
          });
          setIsSubmittingPayment(false);
          return;
        }

        const base64 = paymentFile ? await fileToBase64(paymentFile) : null;
        const jumlah = Number(editForm.hargaPerBulan || data.hargaPerBulan) * Number(paymentMonths);

        const payload = {
          kontrakan: data._id,
          penyewa: penyewaId,
          jumlah,
          bulanPembayaran: Number(paymentMonths),
          buktiPembayaran: base64,
          metodePembayaran: paymentMethod,
        };

        await api.post('/pembayaran', payload);
      }

      setPaymentFile(null);
      setPaymentMonths(1);
      setShowModal(false);
      refresh();
      setAlert({
        isOpen: true,
        type: 'success',
        title: 'Berhasil',
        message: 'Perubahan disimpan dan pembayaran (jika ada) dikirim.'
      });
    } catch (err) {
      console.error(err);
      setAlert({
        isOpen: true,
        type: 'error',
        title: 'Error',
        message: 'Gagal menyimpan/unggah pembayaran'
      });
    } finally {
      setIsSubmittingPayment(false);
    }
  };

  const fileToBase64 = (file) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });

  const handlePaymentSubmit = async () => {
    try {
      if (!data.penyewa) {
        setAlert({
          isOpen: true,
          type: 'warning',
          title: 'Penyewa Diperlukan',
          message: 'Tentukan penyewa terlebih dulu untuk melakukan pembayaran'
        });
        return;
      }
      if (paymentMethod !== 'Cash' && !paymentFile) {
        setAlert({
          isOpen: true,
          type: 'warning',
          title: 'Bukti Pembayaran Diperlukan',
          message: 'Unggah bukti pembayaran terlebih dulu (untuk Transfer/QRIS)'
        });
        return;
      }

      setIsSubmittingPayment(true);
      const base64 = paymentFile ? await fileToBase64(paymentFile) : null;
      const jumlah = Number(data.hargaPerBulan) * Number(paymentMonths);

      const payload = {
        kontrakan: data._id,
        penyewa: data.penyewa._id || data.penyewa,
        jumlah,
        bulanPembayaran: Number(paymentMonths),
        buktiPembayaran: base64,
        metodePembayaran: paymentMethod,
      };

      await api.post('/pembayaran', payload);
      setAlert({
        isOpen: true,
        type: 'success',
        title: 'Berhasil',
        message: 'Pembayaran berhasil diunggah. Menunggu konfirmasi.'
      });
      setPaymentFile(null);
      setPaymentMonths(1);
      setShowModal(false);
      refresh();
    } catch (err) {
      console.error(err);
      setAlert({
        isOpen: true,
        type: 'error',
        title: 'Error',
        message: 'Gagal mengunggah pembayaran'
      });
    } finally {
      setIsSubmittingPayment(false);
    }
  };

  return (
    <div className={`rounded-2xl shadow-sm hover:shadow-lg transition p-6 ${
      data.statusPembayaran === 'Belum Bayar' || data.statusPembayaran === 'Terlambat'
        ? 'bg-red-50 border-2 border-red-300'
        : 'bg-white'
    }`}>
      {/* Gambar Kontrakan */}
      {data.gambar && (
        <div className="mb-4 rounded-lg overflow-hidden">
          <img src={data.gambar} alt={data.namaKontrakan || 'Kontrakan'} className="w-full h-40 object-cover" />
        </div>
      )}

      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-start gap-3 flex-1">
          <div className="w-12 h-12 bg-gradient-to-br from-pink-400 to-purple-500 rounded-xl flex items-center justify-center">
            <Home className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 onClick={openModal} className="font-bold text-gray-900 text-lg cursor-pointer">{data.namaKontrakan || 'Tanpa Nama'}</h3>
            <p className="text-sm text-gray-600 flex items-center gap-1">
              <MapPin className="w-4 h-4" />
              {data.alamat}
            </p>
          </div>
        </div>

        <div className={`px-3 py-1 text-xs rounded-full font-semibold flex items-center gap-2 ${colorClass.bg} ${colorClass.text} whitespace-nowrap`}>
          <StatusIcon className="w-3 h-3" />
          {data.statusKontrak}
        </div>
      </div>

      {/* Details */}
      <div className="space-y-3 mb-4 border-t border-gray-200 pt-4">
        <div className="flex items-center justify-between">
          <span className="text-gray-600 text-sm">Harga per Bulan</span>
          <span className="font-bold text-pink-600 text-lg">Rp {data.hargaPerBulan.toLocaleString('id-ID')}</span>
        </div>

        {data.tanggalMulai && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Tanggal Mulai</span>
            <span className="font-medium text-gray-900">
              {new Date(data.tanggalMulai).toLocaleDateString('id-ID')}
            </span>
          </div>
        )}

        {data.tanggalJatuhTempo && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Jatuh Tempo</span>
            <span className="font-medium text-gray-900">
              {new Date(data.tanggalJatuhTempo).toLocaleDateString('id-ID')}
            </span>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-4 border-t border-gray-200">
        <button onClick={openModal} className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition font-medium text-sm">
          <Edit3 className="w-4 h-4" />
          Details
        </button>
        <button onClick={togglePayment} className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition font-medium text-sm">
          <DollarSign className="w-4 h-4" />
          {data.statusPembayaran === 'Lunas' ? 'Mark Belum Bayar' : 'Mark Lunas'}
        </button>
        <button 
          onClick={hapus}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition font-medium text-sm"
        >
          <Trash2 className="w-4 h-4" />
          Hapus
        </button>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold mb-4">Edit Detail Kontrakan</h3>

            <div className="grid grid-cols-1 gap-3">
              <label className="flex flex-col">
                <span className="text-sm font-semibold">Gambar Kontrakan</span>
                <input type="file" accept="image/*" onChange={(e) => setKontrakanImageFile(e.target.files[0] || null)} className="mt-2" />
                {kontrakanImageFile && (
                  <div className="mt-2">
                    <img src={URL.createObjectURL(kontrakanImageFile)} alt="Preview" className="max-h-40 rounded" />
                  </div>
                )}
                {!kontrakanImageFile && data.gambar && (
                  <div className="mt-2">
                    <img src={data.gambar} alt="Current" className="max-h-40 rounded" />
                    <p className="text-xs text-gray-500 mt-1">Gambar saat ini</p>
                  </div>
                )}
              </label>

              <label className="flex flex-col">
                <span className="text-sm font-semibold">Harga per Bulan</span>
                <input type="number" value={editForm.hargaPerBulan} onChange={(e) => setEditForm({...editForm, hargaPerBulan: e.target.value})} className="mt-2 px-3 py-2 border rounded" />
              </label>

              <label className="flex flex-col">
                <span className="text-sm font-semibold">Penyewa</span>
                <select value={editForm.penyewa} onChange={(e) => setEditForm({...editForm, penyewa: e.target.value})} className="mt-2 px-3 py-2 border rounded">
                  <option value="">-- Tidak ada --</option>
                  {penyewaList.map(p => (
                    <option key={p._id} value={p._id}>{p.nama} — {p.telepon}</option>
                  ))}
                </select>
              </label>

              <div className="grid grid-cols-2 gap-3">
                <label className="flex flex-col">
                  <span className="text-sm font-semibold">Tanggal Mulai</span>
                  <input type="date" value={editForm.tanggalMulai} onChange={(e) => handleTanggalMulaiChange(e.target.value)} className="mt-2 px-3 py-2 border rounded" />
                </label>
                <label className="flex flex-col">
                  <span className="text-sm font-semibold">Tanggal Jatuh Tempo</span>
                  <input type="date" value={editForm.tanggalJatuhTempo} onChange={(e) => handleTanggalJatuhTempoChange(e.target.value)} className="mt-2 px-3 py-2 border rounded" />
                </label>
              </div>

              {/* Payment section (responsive: column on small, side-by-side on md+) */}
              <div className="border-t pt-4">
                <h4 className="font-semibold">Pembayaran</h4>
                <div className="mt-2 text-sm text-gray-700 space-y-2">
                  <div>
                    <span className="font-medium">Penyewa: </span>
                    {data.penyewa ? `${data.penyewa.nama} — ${data.penyewa.telepon}` : 'Belum ada penyewa'}
                  </div>
                  <div>
                    <span className="font-medium">Harga / bulan: </span>
                    Rp {data.hargaPerBulan.toLocaleString('id-ID')}
                  </div>
                  <div>
                    <span className="font-medium">Status Pembayaran: </span>
                    {data.statusPembayaran}
                    {data.statusPembayaran === 'Terlambat' && data.tanggalJatuhTempo && (
                      <span className="text-red-600 font-semibold ml-2">
                        ({Math.max(0, Math.floor((new Date() - new Date(data.tanggalJatuhTempo)) / (1000 * 60 * 60 * 24)))} hari terlambat)
                      </span>
                    )}
                  </div>
                </div>

                {data.statusPembayaran !== 'Lunas' && (
                  <div className="mt-3 flex flex-col md:flex-row gap-4 items-start">
                    <div className="flex-1 min-w-0">
                      <label className="flex flex-col">
                        <span className="text-sm font-semibold">Metode Pembayaran</span>
                        <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} className="mt-2 px-3 py-2 border rounded w-full max-w-xs">
                          <option value="Cash">Cash</option>
                          <option value="Transfer">Transfer</option>
                          <option value="QRIS">QRIS</option>
                        </select>
                      </label>
                    </div>

                    <div className="flex-1 min-w-0">
                      {paymentMethod !== 'Cash' && (
                        <label className="flex flex-col">
                          <span className="text-sm font-semibold">Bukti Pembayaran (gambar)</span>
                          <input type="file" accept="image/*" onChange={(e) => setPaymentFile(e.target.files[0] || null)} className="mt-2" />
                        </label>
                      )}

                        <div className="mt-4">
                          <div className="mb-2 text-sm">
                            <span className="font-medium">Jumlah yang harus dibayar ({paymentMonths} bulan): </span>
                            <span className="text-lg font-semibold text-pink-600">Rp {(Number(editForm.hargaPerBulan || data.hargaPerBulan) * Number(paymentMonths)).toLocaleString('id-ID')}</span>
                          </div>
                          <p className="text-xs text-gray-500">Tekan tombol "Simpan" di bawah untuk menyimpan perubahan dan mengirim pembayaran jika ada.</p>
                        </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex gap-3 mt-3">
                <button onClick={handleSaveAndPayment} disabled={isSubmittingPayment} className="bg-gradient-to-r from-pink-500 to-purple-600 text-white px-4 py-2 rounded">
                  {isSubmittingPayment ? 'Menyimpan...' : 'Simpan'}
                </button>
                <button onClick={() => setShowModal(false)} className="px-4 py-2 border rounded">Batal</button>
              </div>
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
  );
}
