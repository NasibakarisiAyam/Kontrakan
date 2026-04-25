import { CheckCircle, XCircle, Clock, Eye, Trash2, Download } from "lucide-react";
import { useState, useEffect } from "react";
import axios from "axios";

export default function Pembayaran() {
  const [pembayaran, setPembayaran] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPembayaran, setSelectedPembayaran] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [adminNotes, setAdminNotes] = useState("");
  const [adminAction, setAdminAction] = useState(""); // "approve" atau "reject"
  const [filterStatus, setFilterStatus] = useState("all");

  const fetchPembayaran = async () => {
    try {
      setLoading(true);
      const res = await axios.get("http://localhost:5000/api/pembayaran");
      setPembayaran(res.data || []);
    } catch (error) {
      console.error("Error fetching pembayaran:", error);
      setPembayaran([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPembayaran();
  }, []);

  const handleViewDetail = (item) => {
    setSelectedPembayaran(item);
    setShowDetailModal(true);
  };

  const handleConfirmPayment = (item, action) => {
    setSelectedPembayaran(item);
    setAdminAction(action);
    setShowConfirmModal(true);
  };

  const submitConfirmation = async () => {
    if (!selectedPembayaran) return;

    try {
      const updateData = {
        status: adminAction === "approve" ? "Terbayar" : "Ditolak",
        keterangan: adminNotes,
        dikonfirmasiOleh: "Admin", // Bisa diganti dengan nama admin login
      };

      await axios.put(
        `http://localhost:5000/api/pembayaran/${selectedPembayaran._id}`,
        updateData
      );

      alert(`Pembayaran berhasil di${adminAction === "approve" ? "konfirmasi" : "tolak"}!`);
      setShowConfirmModal(false);
      setAdminNotes("");
      setAdminAction("");
      setSelectedPembayaran(null);
      fetchPembayaran();
    } catch (error) {
      alert("Error: " + error.response?.data?.message || error.message);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Yakin ingin menghapus pembayaran ini?")) {
      try {
        await axios.delete(`http://localhost:5000/api/pembayaran/${id}`);
        alert("Pembayaran berhasil dihapus!");
        fetchPembayaran();
      } catch (error) {
        alert("Error: " + error.response?.data?.message || error.message);
      }
    }
  };

  const downloadProof = (buktiPembayaran, nama) => {
    if (!buktiPembayaran) return;
    const link = document.createElement("a");
    link.href = buktiPembayaran;
    link.download = `bukti-pembayaran-${nama}.jpg`;
    link.click();
  };

  const filteredPembayaran = pembayaran.filter((item) => {
    if (filterStatus === "all") return true;
    return item.status === filterStatus;
  });

  const stats = {
    total: pembayaran.length,
    menunggu: pembayaran.filter((p) => p.status === "Menunggu Konfirmasi").length,
    terbayar: pembayaran.filter((p) => p.status === "Terbayar").length,
    ditolak: pembayaran.filter((p) => p.status === "Ditolak").length,
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">Manajemen Pembayaran</h1>
          <p className="text-gray-600">Kelola dan konfirmasi pembayaran penyewa</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-blue-500">
            <p className="text-gray-600 text-sm mb-2">Total Pembayaran</p>
            <p className="text-3xl font-bold text-gray-800">{stats.total}</p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-yellow-500">
            <div className="flex items-center gap-3">
              <Clock className="text-yellow-500" size={24} />
              <div>
                <p className="text-gray-600 text-sm">Menunggu Konfirmasi</p>
                <p className="text-3xl font-bold text-gray-800">{stats.menunggu}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-green-500">
            <div className="flex items-center gap-3">
              <CheckCircle className="text-green-500" size={24} />
              <div>
                <p className="text-gray-600 text-sm">Terbayar</p>
                <p className="text-3xl font-bold text-gray-800">{stats.terbayar}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-red-500">
            <div className="flex items-center gap-3">
              <XCircle className="text-red-500" size={24} />
              <div>
                <p className="text-gray-600 text-sm">Ditolak</p>
                <p className="text-3xl font-bold text-gray-800">{stats.ditolak}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filter */}
        <div className="mb-6">
          <div className="flex gap-2">
            <button
              onClick={() => setFilterStatus("all")}
              className={`px-4 py-2 rounded-lg font-semibold transition ${
                filterStatus === "all"
                  ? "bg-purple-600 text-white"
                  : "bg-white text-gray-700 border border-gray-300 hover:border-purple-500"
              }`}
            >
              Semua
            </button>
            <button
              onClick={() => setFilterStatus("Menunggu Konfirmasi")}
              className={`px-4 py-2 rounded-lg font-semibold transition ${
                filterStatus === "Menunggu Konfirmasi"
                  ? "bg-yellow-500 text-white"
                  : "bg-white text-gray-700 border border-gray-300 hover:border-yellow-500"
              }`}
            >
              Menunggu
            </button>
            <button
              onClick={() => setFilterStatus("Terbayar")}
              className={`px-4 py-2 rounded-lg font-semibold transition ${
                filterStatus === "Terbayar"
                  ? "bg-green-500 text-white"
                  : "bg-white text-gray-700 border border-gray-300 hover:border-green-500"
              }`}
            >
              Terbayar
            </button>
            <button
              onClick={() => setFilterStatus("Ditolak")}
              className={`px-4 py-2 rounded-lg font-semibold transition ${
                filterStatus === "Ditolak"
                  ? "bg-red-500 text-white"
                  : "bg-white text-gray-700 border border-gray-300 hover:border-red-500"
              }`}
            >
              Ditolak
            </button>
          </div>
        </div>

        {/* Pembayaran Table */}
        {loading ? (
          <div className="text-center py-12">
            <p className="text-gray-600">Memuat data...</p>
          </div>
        ) : filteredPembayaran.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <p className="text-gray-600">Tidak ada data pembayaran</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b-2 border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Penyewa</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Kontrakan</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Bulan</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Jumlah</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Status</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filteredPembayaran.map((item) => (
                  <tr key={item._id} className="border-b border-gray-200 hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-semibold text-gray-800">
                          {item.penyewa?.nama || "N/A"}
                        </p>
                        <p className="text-sm text-gray-600">{item.penyewa?.email}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-gray-800">
                        {item.kontrakan?.namaKontrakan || item.kontrakan?.alamat || "N/A"}
                      </p>
                    </td>
                    <td className="px-6 py-4 text-gray-800">{item.bulanPembayaran}</td>
                    <td className="px-6 py-4 font-semibold text-gray-800">
                      Rp {item.jumlah?.toLocaleString("id-ID")}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-3 py-1 rounded-full text-sm font-semibold ${
                          item.status === "Terbayar"
                            ? "bg-green-100 text-green-800"
                            : item.status === "Ditolak"
                            ? "bg-red-100 text-red-800"
                            : "bg-yellow-100 text-yellow-800"
                        }`}
                      >
                        {item.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleViewDetail(item)}
                          className="p-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition"
                          title="Lihat Detail"
                        >
                          <Eye size={18} />
                        </button>
                        {item.status === "Menunggu Konfirmasi" && (
                          <>
                            <button
                              onClick={() => handleConfirmPayment(item, "approve")}
                              className="p-2 bg-green-100 text-green-600 rounded-lg hover:bg-green-200 transition"
                              title="Konfirmasi Pembayaran"
                            >
                              <CheckCircle size={18} />
                            </button>
                            <button
                              onClick={() => handleConfirmPayment(item, "reject")}
                              className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition"
                              title="Tolak Pembayaran"
                            >
                              <XCircle size={18} />
                            </button>
                          </>
                        )}
                        <button
                          onClick={() => handleDelete(item._id)}
                          className="p-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition"
                          title="Hapus"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Detail Modal */}
        {showDetailModal && selectedPembayaran && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-8">
                <h2 className="text-2xl font-bold mb-6">Detail Pembayaran</h2>

                <div className="space-y-6">
                  {/* Info Penyewa */}
                  <div>
                    <h3 className="font-semibold text-gray-800 mb-3">Informasi Penyewa</h3>
                    <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                      <p>
                        <span className="text-gray-600">Nama:</span> {selectedPembayaran.penyewa?.nama}
                      </p>
                      <p>
                        <span className="text-gray-600">Email:</span> {selectedPembayaran.penyewa?.email}
                      </p>
                      <p>
                        <span className="text-gray-600">Telepon:</span> {selectedPembayaran.penyewa?.telepon}
                      </p>
                    </div>
                  </div>

                  {/* Info Kontrakan */}
                  <div>
                    <h3 className="font-semibold text-gray-800 mb-3">Informasi Kontrakan</h3>
                    <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                      <p>
                        <span className="text-gray-600">Nama:</span>{" "}
                        {selectedPembayaran.kontrakan?.namaKontrakan ||
                          selectedPembayaran.kontrakan?.alamat}
                      </p>
                      <p>
                        <span className="text-gray-600">Alamat:</span> {selectedPembayaran.kontrakan?.alamat}
                      </p>
                      <p>
                        <span className="text-gray-600">Harga Per Bulan:</span> Rp{" "}
                        {selectedPembayaran.kontrakan?.hargaPerBulan?.toLocaleString("id-ID")}
                      </p>
                    </div>
                  </div>

                  {/* Info Pembayaran */}
                  <div>
                    <h3 className="font-semibold text-gray-800 mb-3">Informasi Pembayaran</h3>
                    <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                      <p>
                        <span className="text-gray-600">Bulan:</span> {selectedPembayaran.bulanPembayaran}
                      </p>
                      <p>
                        <span className="text-gray-600">Jumlah:</span> Rp{" "}
                        {selectedPembayaran.jumlah?.toLocaleString("id-ID")}
                      </p>
                      <p>
                        <span className="text-gray-600">Status:</span>{" "}
                        <span
                          className={`px-3 py-1 rounded-full text-sm font-semibold ${
                            selectedPembayaran.status === "Terbayar"
                              ? "bg-green-100 text-green-800"
                              : selectedPembayaran.status === "Ditolak"
                              ? "bg-red-100 text-red-800"
                              : "bg-yellow-100 text-yellow-800"
                          }`}
                        >
                          {selectedPembayaran.status}
                        </span>
                      </p>
                      <p>
                        <span className="text-gray-600">Tanggal Upload:</span>{" "}
                        {new Date(selectedPembayaran.tanggalUpload).toLocaleDateString("id-ID")}
                      </p>
                      {selectedPembayaran.tanggalKonfirmasi && (
                        <p>
                          <span className="text-gray-600">Tanggal Konfirmasi:</span>{" "}
                          {new Date(selectedPembayaran.tanggalKonfirmasi).toLocaleDateString("id-ID")}
                        </p>
                      )}
                      {selectedPembayaran.keterangan && (
                        <p>
                          <span className="text-gray-600">Keterangan:</span> {selectedPembayaran.keterangan}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Bukti Pembayaran */}
                  {selectedPembayaran.buktiPembayaran && (
                    <div>
                      <h3 className="font-semibold text-gray-800 mb-3">Bukti Pembayaran</h3>
                      <img
                        src={selectedPembayaran.buktiPembayaran}
                        alt="Bukti Pembayaran"
                        className="w-full rounded-lg border border-gray-300 max-h-96 object-contain"
                      />
                      <button
                        onClick={() =>
                          downloadProof(
                            selectedPembayaran.buktiPembayaran,
                            selectedPembayaran.penyewa?.nama
                          )
                        }
                        className="mt-2 flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
                      >
                        <Download size={18} />
                        Download Bukti
                      </button>
                    </div>
                  )}
                </div>

                <button
                  onClick={() => setShowDetailModal(false)}
                  className="mt-8 w-full bg-gray-300 text-gray-800 px-4 py-2 rounded-lg font-semibold hover:bg-gray-400 transition"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Confirmation Modal */}
        {showConfirmModal && selectedPembayaran && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-md w-full">
              <div className="p-8">
                <h2 className="text-2xl font-bold mb-4">
                  {adminAction === "approve" ? "Konfirmasi Pembayaran" : "Tolak Pembayaran"}
                </h2>

                <div className="bg-gray-50 p-4 rounded-lg mb-6 space-y-2">
                  <p>
                    <span className="text-gray-600">Penyewa:</span> {selectedPembayaran.penyewa?.nama}
                  </p>
                  <p>
                    <span className="text-gray-600">Jumlah:</span> Rp{" "}
                    {selectedPembayaran.jumlah?.toLocaleString("id-ID")}
                  </p>
                  <p>
                    <span className="text-gray-600">Bulan:</span> {selectedPembayaran.bulanPembayaran}
                  </p>
                </div>

                <textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder={
                    adminAction === "approve"
                      ? "Catatan konfirmasi (opsional)..."
                      : "Alasan penolakan pembayaran..."
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 mb-6"
                  rows="4"
                ></textarea>

                <div className="flex gap-4">
                  <button
                    onClick={submitConfirmation}
                    className={`flex-1 text-white px-4 py-2 rounded-lg font-semibold transition ${
                      adminAction === "approve"
                        ? "bg-green-500 hover:bg-green-600"
                        : "bg-red-500 hover:bg-red-600"
                    }`}
                  >
                    {adminAction === "approve" ? "Konfirmasi" : "Tolak"}
                  </button>
                  <button
                    onClick={() => {
                      setShowConfirmModal(false);
                      setAdminNotes("");
                      setAdminAction("");
                    }}
                    className="flex-1 bg-gray-300 text-gray-800 px-4 py-2 rounded-lg font-semibold hover:bg-gray-400 transition"
                  >
                    Batal
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
