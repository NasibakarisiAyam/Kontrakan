import { Plus, Edit2, Trash2, AlertCircle } from "lucide-react";
import { useState, useEffect } from "react";
import axios from "axios";
import Alert from "../components/Alert";

export default function Penyewa() {
  const [penyewa, setPenyewa] = useState([]);
  const [kontrakanData, setKontrakanData] = useState({});
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [formData, setFormData] = useState({
    nama: "",
    email: "",
    telepon: "",
    alamatAsal: "",
    nomorIdentitas: "",
    tanggalLahir: "",
    pekerjaan: "",
    noKontakEmergency: "",
  });

  // Alert State
  const [alert, setAlert] = useState({
    isOpen: false,
    type: 'info',
    title: '',
    message: ''
  });

  const fetchPenyewa = async () => {
    try {
      setLoading(true);
      const res = await axios.get("/api/penyewa");
      setPenyewa(Array.isArray(res.data) ? res.data : res.data.data || []);
    } catch (error) {
      console.error("Error fetching penyewa:", error);
      setPenyewa([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchKontrakanStatus = async () => {
    try {
      const res = await axios.get("/api/kontrakan");
      const kontraktanByPenyewa = {};

      // Access the 'data' array from the response
      const kontrakans = res.data.data || [];
      kontrakans.forEach(k => {
        if (k.penyewa) {
          const penyewaId = k.penyewa._id || k.penyewa;
          if (!kontraktanByPenyewa[penyewaId]) {
            kontraktanByPenyewa[penyewaId] = [];
          }
          kontraktanByPenyewa[penyewaId].push(k);
        }
      });

      setKontrakanData(kontraktanByPenyewa);
    } catch (error) {
      console.error("Error fetching kontrakan:", error);
    }
  };

  useEffect(() => {
    fetchPenyewa();
    fetchKontrakanStatus();
  }, []);

  const hasUnpaidContract = (penyewaId) => {
    const contracts = kontrakanData[penyewaId] || [];
    return contracts.some(k => k.statusPembayaran === 'Belum Bayar' || k.statusPembayaran === 'Terlambat');
  };

  const getLateDaysInfo = (penyewaId) => {
    const contracts = kontrakanData[penyewaId] || [];
    const lateContracts = contracts.filter(k => k.statusPembayaran === 'Terlambat');
    
    if (lateContracts.length === 0) return null;
    
    // Calculate days late for the first late contract
    const contract = lateContracts[0];
    const dueDate = new Date(contract.tanggalJatuhTempo);
    const today = new Date();
    
    // Set times to 00:00:00 for accurate day calculation
    dueDate.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);
    
    const daysLate = Math.floor((today - dueDate) / (1000 * 60 * 60 * 24));
    
    return daysLate > 0 ? daysLate : null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editId) {
        await axios.put(`/api/penyewa/${editId}`, formData);
        setAlert({
          isOpen: true,
          type: 'success',
          title: 'Berhasil',
          message: 'Data penyewa berhasil diupdate!'
        });
      } else {
        await axios.post("/api/penyewa", formData);
        setAlert({
          isOpen: true,
          type: 'success',
          title: 'Berhasil',
          message: 'Data penyewa berhasil ditambahkan!'
        });
      }
      setFormData({
        nama: "",
        email: "",
        telepon: "",
        alamatAsal: "",
        nomorIdentitas: "",
        tanggalLahir: "",
        pekerjaan: "",
        noKontakEmergency: "",
      });
      setEditId(null);
      setShowForm(false);
      fetchPenyewa();
    } catch (error) {
      setAlert({
        isOpen: true,
        type: 'error',
        title: 'Error',
        message: "Error: " + error.response?.data?.message || error.message
      });
    }
  };

  const handleEdit = (item) => {
    setFormData({
      nama: item.nama,
      email: item.email,
      telepon: item.telepon,
      alamatAsal: item.alamatAsal || "",
      nomorIdentitas: item.nomorIdentitas || "",
      tanggalLahir: item.tanggalLahir?.split("T")[0] || "",
      pekerjaan: item.pekerjaan || "",
      noKontakEmergency: item.noKontakEmergency || "",
    });
    setEditId(item._id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm("Yakin ingin menghapus penyewa ini?")) {
      try {
        await axios.delete(`/api/penyewa/${id}`);
        setAlert({
          isOpen: true,
          type: 'success',
          title: 'Berhasil',
          message: 'Data penyewa berhasil dihapus!'
        });
        fetchPenyewa();
      } catch (error) {
        setAlert({
          isOpen: true,
          type: 'error',
          title: 'Error',
          message: "Error: " + error.response?.data?.message || error.message
        });
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-800 mb-2">Manajemen Penyewa</h1>
            <p className="text-gray-600">Kelola data penyewa kontrakan Anda</p>
          </div>
          <button
            onClick={() => {
              setFormData({
                nama: "",
                email: "",
                telepon: "",
                alamatAsal: "",
                nomorIdentitas: "",
                tanggalLahir: "",
                pekerjaan: "",
                noKontakEmergency: "",
              });
              setEditId(null);
              setShowForm(!showForm);
            }}
            className="bg-gradient-to-r from-pink-500 to-purple-600 text-white px-6 py-3 rounded-lg font-semibold flex items-center gap-2 hover:shadow-lg transition"
          >
            <Plus size={20} />
            Tambah Penyewa
          </button>
        </div>

        {/* Form Modal */}
        {showForm && (
          <div className="bg-white rounded-lg shadow-lg p-8 mb-8 border-l-4 border-purple-500">
            <h2 className="text-2xl font-bold mb-6">
              {editId ? "Edit Data Penyewa" : "Tambah Data Penyewa Baru"}
            </h2>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <input
                type="text"
                placeholder="Nama Penyewa"
                value={formData.nama}
                onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                required
                className="col-span-2 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
              <input
                type="email"
                placeholder="Email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
              <input
                type="tel"
                placeholder="No. Telepon"
                value={formData.telepon}
                onChange={(e) => setFormData({ ...formData, telepon: e.target.value })}
                required
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
              <input
                type="text"
                placeholder="Alamat Asal"
                value={formData.alamatAsal}
                onChange={(e) => setFormData({ ...formData, alamatAsal: e.target.value })}
                className="col-span-2 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
              <input
                type="text"
                placeholder="Nomor Identitas (KTP/SIM)"
                value={formData.nomorIdentitas}
                onChange={(e) => setFormData({ ...formData, nomorIdentitas: e.target.value })}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
              <input
                type="date"
                placeholder="Tanggal lahir"
                value={formData.tanggalLahir}
                onChange={(e) => setFormData({ ...formData, tanggalLahir: e.target.value })}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
              <input
                type="text"
                placeholder="Pekerjaan"
                value={formData.pekerjaan}
                onChange={(e) => setFormData({ ...formData, pekerjaan: e.target.value })}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
              <input
                type="tel"
                placeholder="No. Kontak Emergency"
                value={formData.noKontakEmergency}
                onChange={(e) => setFormData({ ...formData, noKontakEmergency: e.target.value })}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
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
            <p className="text-gray-600 mt-4">Memuat data penyewa...</p>
          </div>
        )}

        {/* Empty State */}
        {!loading && penyewa.length === 0 && (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <AlertCircle size={48} className="mx-auto text-gray-400 mb-4" />
            <p className="text-gray-600 text-lg">Belum ada data penyewa</p>
            <p className="text-gray-400 mb-6">Klik tombol "Tambah Penyewa" untuk memulai</p>
          </div>
        )}

        {/* Table */}
        {!loading && penyewa.length > 0 && (
          <div className="bg-white rounded-lg shadow-md overflow-hidden overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-100 border-b">
                <tr>
                  <th className="px-6 py-4 text-left font-semibold text-gray-700">Nama</th>
                  <th className="px-6 py-4 text-left font-semibold text-gray-700">Email</th>
                  <th className="px-6 py-4 text-left font-semibold text-gray-700">Telepon</th>
                  <th className="px-6 py-4 text-left font-semibold text-gray-700">Alamat Asal</th>
                  <th className="px-6 py-4 text-left font-semibold text-gray-700">Identitas</th>
                  <th className="px-6 py-4 text-left font-semibold text-gray-700">Pekerjaan</th>
                  <th className="px-6 py-4 text-left font-semibold text-gray-700">Status Bayar</th>
                  <th className="px-6 py-4 text-center font-semibold text-gray-700">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {penyewa.map((item) => {
                  const hasUnpaid = hasUnpaidContract(item._id);
                  return (
                    <tr key={item._id} className={`border-b transition ${
                      hasUnpaid ? 'bg-red-100 hover:bg-red-200' : 'hover:bg-gray-50'
                    }`}>
                      <td className="px-6 py-4 font-medium text-gray-800">{item.nama}</td>
                      <td className="px-6 py-4 text-gray-600">{item.email}</td>
                      <td className="px-6 py-4 text-gray-600">{item.telepon}</td>
                      <td className="px-6 py-4 text-gray-600">{item.alamatAsal || "-"}</td>
                      <td className="px-6 py-4 text-gray-600">{item.nomorIdentitas || "-"}</td>
                      <td className="px-6 py-4 text-gray-600">{item.pekerjaan || "-"}</td>
                      <td className="px-6 py-4">
                        {hasUnpaid ? (
                          <div>
                            <span className="bg-red-500 text-white px-3 py-1 rounded-full text-sm font-semibold">
                              ⚠ Belum Bayar
                            </span>
                            {getLateDaysInfo(item._id) && (
                              <p className="text-xs text-red-600 font-semibold mt-1">
                                Telat {getLateDaysInfo(item._id)} hari
                              </p>
                            )}
                          </div>
                        ) : (
                          <span className="bg-green-500 text-white px-3 py-1 rounded-full text-sm font-semibold">
                            ✓ Lunas
                          </span>
                        )}
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
                  );
                })}
              </tbody>
            </table>
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
