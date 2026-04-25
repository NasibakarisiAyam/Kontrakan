  import { useState, useEffect } from "react";
import axios from "axios";
import { Plus, Edit2, Trash2, AlertCircle } from "lucide-react";

export default function DaftarKontrakan() {
  const [kontrakan, setKontrakan] = useState([]);
  const [penyewa, setPenyewa] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [formData, setFormData] = useState({
    namaKontrakan: "",
    alamat: "",
    hargaPerBulan: "",
    minimumDP: "",
    statusKontrak: "Belum Dikontrak",
    statusPembayaran: "Belum Bayar",
  });

  const fetchKontrakan = async () => {
    try {
      setLoading(true);
      const res = await axios.get("http://localhost:5000/api/kontrakan");
      setKontrakan(res.data?.data || []);
    } catch (error) {
      console.error("Error fetching kontrakan:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPenyewa = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/penyewa");
      setPenyewa(res.data?.data || []);
    } catch (error) {
      console.error("Error fetching penyewa:", error);
    }
  };

  useEffect(() => {
    fetchKontrakan();
    fetchPenyewa();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const dataToSend = {
        namaKontrakan: formData.namaKontrakan || undefined,
        alamat: formData.alamat,
        hargaPerBulan: parseInt(formData.hargaPerBulan),
        minimumDP: parseInt(formData.minimumDP),
        statusKontrak: formData.statusKontrak,
        statusPembayaran: formData.statusPembayaran,
        gambar: formData.gambar || undefined,
      };

      if (editId) {
        await axios.put(`http://localhost:5000/api/kontrakan/${editId}`, dataToSend);
        alert("Kontrakan berhasil diupdate!");
      } else {
        await axios.post("http://localhost:5000/api/kontrakan", dataToSend);
        alert("Kontrakan berhasil ditambahkan!");
      }
      setFormData({
        namaKontrakan: "",
        alamat: "",
        hargaPerBulan: "",
        minimumDP: "",
        statusKontrak: "Belum Dikontrak",
        statusPembayaran: "Belum Bayar",
        gambar: "",
      });
      setEditId(null);
      setShowForm(false);
      fetchKontrakan();
    } catch (error) {
      alert("Error: " + error.response?.data?.message || error.message);
    }
  };

  const handleEdit = (item) => {
    setFormData({
      namaKontrakan: item.namaKontrakan || "",
      alamat: item.alamat || "",
      hargaPerBulan: item.hargaPerBulan || "",
      minimumDP: item.minimumDP || "",
      statusKontrak: item.statusKontrak || "Belum Dikontrak",
      statusPembayaran: item.statusPembayaran || "Belum Bayar",
      gambar: item.gambar || "",
    });
    setEditId(item._id);
    setShowForm(true);
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setFormData({ ...formData, gambar: e.target.result });
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setFormData({ ...formData, gambar: "" });
  };

  const handleDelete = async (id) => {
    if (window.confirm("Yakin ingin menghapus kontrakan ini?")) {
      try {
        await axios.delete(`http://localhost:5000/api/kontrakan/${id}`);
        alert("Kontrakan berhasil dihapus!");
        fetchKontrakan();
      } catch (error) {
        alert("Error: " + error.response?.data?.message || error.message);
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-800 mb-2">Daftar Kontrakan</h1>
            <p className="text-gray-600">Kelola semua kontrakan Anda dan hubungkan dengan penyewa</p>
          </div>
          <button
            onClick={() => {
              setFormData({
                namaKontrakan: "",
                alamat: "",
                hargaPerBulan: "",
                minimumDP: "",
                statusKontrak: "Belum Dikontrak",
                statusPembayaran: "Belum Bayar",
                gambar: "",
              });
              setEditId(null);
              setShowForm(!showForm);
            }}
            className="bg-gradient-to-r from-pink-500 to-purple-600 text-white px-6 py-3 rounded-lg font-semibold flex items-center gap-2 hover:shadow-lg transition"
          >
            <Plus size={20} />
            Tambah Kontrakan
          </button>
        </div>

        {/* Form Modal */}
        {showForm && (
          <div className="bg-white rounded-lg shadow-lg p-8 mb-8 border-l-4 border-purple-500">
            <h2 className="text-2xl font-bold mb-6">
              {editId ? "Edit Kontrakan" : "Tambah Kontrakan Baru"}
            </h2>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Nama Kontrakan - Optional */}
              <input
                type="text"
                placeholder="Nama Kontrakan (opsional)"
                value={formData.namaKontrakan}
                onChange={(e) => setFormData({ ...formData, namaKontrakan: e.target.value })}
                className="col-span-2 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              />

              {/* Alamat - Required */}
              <input
                type="text"
                placeholder="Alamat *"
                value={formData.alamat}
                onChange={(e) => setFormData({ ...formData, alamat: e.target.value })}
                required
                className="col-span-2 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              />

              {/* Harga Per Bulan - Required */}
              <input
                type="number"
                placeholder="Harga Per Bulan *"
                value={formData.hargaPerBulan}
                onChange={(e) => setFormData({ ...formData, hargaPerBulan: e.target.value })}
                required
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              />

              {/* Minimum DP Per Bulan - Required */}
              <input
                type="number"
                placeholder="Minimum DP Per Bulan *"
                value={formData.minimumDP}
                onChange={(e) => setFormData({ ...formData, minimumDP: e.target.value })}
                required
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              />

              {/* Status Kontrak Selection */}
              <select
                value={formData.statusKontrak}
                onChange={(e) => setFormData({ ...formData, statusKontrak: e.target.value })}
                className="col-span-2 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="Belum Dikontrak">Belum Dikontrak</option>
                <option value="Sudah Dikontrak">Sudah Dikontrak</option>
              </select>

              {/* Auto Status Display */}
              <div className="col-span-2 bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-700 font-semibold mb-2">📌 Status Kontrak:</p>
                <p className="text-lg font-bold text-blue-900">
                  {formData.statusKontrak}
                </p>
                <p className="text-xs text-blue-600 mt-1">Pilih status kontrak unit ini</p>
              </div>

              {/* Status Pembayaran */}
              <select
                value={formData.statusPembayaran}
                onChange={(e) => setFormData({ ...formData, statusPembayaran: e.target.value })}
                className="col-span-2 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="Belum Bayar">Belum Bayar</option>
                <option value="Lunas">Lunas</option>
                <option value="Terlambat">Terlambat</option>
              </select>

              {/* Gambar Kontrakan */}
              <div className="col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Gambar Kontrakan (opsional)
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
                {formData.gambar && (
                  <div className="mt-4 relative">
                    <img
                      src={formData.gambar}
                      alt="Preview"
                      className="max-w-full h-48 object-cover rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={removeImage}
                      className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600 transition"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                )}
              </div>

              <div className="col-span-2 flex gap-4">
                <button
                  type="submit"
                  className="flex-1 bg-gradient-to-r from-pink-500 to-purple-600 text-white px-6 py-2 rounded-lg font-semibold hover:shadow-lg transition"
                >
                  {editId ? "Update" : "Tambah"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="flex-1 bg-gray-300 text-gray-800 px-6 py-2 rounded-lg font-semibold hover:bg-gray-400 transition"
                >
                  Batal
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="text-center py-12">
            <div className="inline-block animate-spin">⏳</div>
            <p className="text-gray-600 mt-4">Memuat kontrakan...</p>
          </div>
        )}

        {/* Empty State */}
        {!loading && kontrakan.length === 0 && (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <AlertCircle size={48} className="mx-auto text-gray-400 mb-4" />
            <p className="text-gray-600 text-lg">Belum ada kontrakan</p>
            <p className="text-gray-400 mb-6">Klik tombol "Tambah Kontrakan" untuk memulai</p>
          </div>
        )}

        {/* Table */}
        {!loading && kontrakan.length > 0 && (
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-100 border-b">
                <tr>
                  <th className="px-6 py-4 text-left font-semibold text-gray-700">Nama Kontrakan</th>
                  <th className="px-6 py-4 text-left font-semibold text-gray-700">Alamat</th>
                  <th className="px-6 py-4 text-left font-semibold text-gray-700">Penyewa</th>
                  <th className="px-6 py-4 text-left font-semibold text-gray-700">Harga</th>
                  <th className="px-6 py-4 text-left font-semibold text-gray-700">Status Kontrak</th>
                  <th className="px-6 py-4 text-left font-semibold text-gray-700">Status Bayar</th>
                  <th className="px-6 py-4 text-center font-semibold text-gray-700">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {kontrakan.map((item) => (
                  <tr key={item._id} className="border-b hover:bg-gray-50 transition">
                    <td className="px-6 py-4 font-medium text-gray-800">{item.namaKontrakan}</td>
                    <td className="px-6 py-4 text-gray-600">{item.alamat}</td>
                    <td className="px-6 py-4 text-gray-600">
                      {item.penyewa ? (
                        <div className="bg-blue-100 px-3 py-1 rounded-full inline-block">
                          <p className="font-semibold text-blue-800 text-sm">{item.penyewa.nama}</p>
                          <p className="text-blue-700 text-xs">{item.penyewa.telepon}</p>
                        </div>
                      ) : (
                        <span className="text-gray-400 italic">Belum ada penyewa</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-gray-600">Rp {item.hargaPerBulan.toLocaleString('id-ID')}</td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-3 py-1 rounded-full text-sm font-semibold ${
                          item.statusKontrak === "Sudah Dikontrak"
                            ? "bg-green-100 text-green-800"
                            : "bg-yellow-100 text-yellow-800"
                        }`}
                      >
                        {item.statusKontrak}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-3 py-1 rounded-full text-sm font-semibold ${
                          item.statusPembayaran === "Lunas"
                            ? "bg-green-100 text-green-800"
                            : item.statusPembayaran === "Terlambat"
                            ? "bg-red-100 text-red-800"
                            : "bg-yellow-100 text-yellow-800"
                        }`}
                      >
                        {item.statusPembayaran}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex gap-2 justify-center">
                        <button
                          onClick={() => handleEdit(item)}
                          className="bg-blue-500 hover:bg-blue-600 text-white p-2 rounded-lg transition"
                        >
                          <Edit2 size={18} />
                        </button>
                        <button
                          onClick={() => handleDelete(item._id)}
                          className="bg-red-500 hover:bg-red-600 text-white p-2 rounded-lg transition"
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
      </div>
    </div>
  );
}
