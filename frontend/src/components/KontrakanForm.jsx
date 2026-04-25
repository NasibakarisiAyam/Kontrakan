import { useState } from "react";
import axios from "axios";
import { PlusCircle, Loader2, X } from "lucide-react";
import Alert from "./Alert";

export default function KontrakanForm({ refresh }) {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    namaKontrakan: "",
    alamat: "",
    hargaPerBulan: "",
    minimumDP: "",
    statusKontrak: "Belum Dikontrak",
  });
  const [loading, setLoading] = useState(false);

  // Alert State
  const [alert, setAlert] = useState({
    isOpen: false,
    type: 'info',
    title: '',
    message: ''
  });

  const submit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      await axios.post("/kontrakan", form);
      setForm({
        namaKontrakan: "",
        alamat: "",
        hargaPerBulan: "",
        statusKontrak: "Belum Dikontrak",
      });
      setShowForm(false);
      refresh();
      setAlert({
        isOpen: true,
        type: 'success',
        title: 'Berhasil',
        message: 'Kontrakan berhasil ditambahkan!'
      });
    } catch (error) {
      console.error("Error adding kontrakan:", error);
      setAlert({
        isOpen: true,
        type: 'error',
        title: 'Error',
        message: 'Gagal menambah kontrakan'
      });
    } finally {
      setLoading(false);
    }
  };

  if (showForm) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <form
          onSubmit={submit}
          className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full mx-4"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Tambah Kontrakan Baru</h2>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="text-gray-500 hover:text-gray-900"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Nama Kontrakan <span className="text-red-500">*</span>
              </label>
              <input
                required
                type="text"
                className="w-full border border-gray-300 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                placeholder="Masukkan nama kontrakan"
                value={form.namaKontrakan}
                onChange={(e) => setForm({ ...form, namaKontrakan: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Alamat <span className="text-red-500">*</span>
              </label>
              <input
                required
                type="text"
                className="w-full border border-gray-300 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                placeholder="Masukkan alamat kontrakan"
                value={form.alamat}
                onChange={(e) => setForm({ ...form, alamat: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Harga per Bulan (Rp) <span className="text-red-500">*</span>
              </label>
              <input
                required
                type="number"
                className="w-full border border-gray-300 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                placeholder="Masukkan harga per bulan"
                min="0"
                value={form.hargaPerBulan}
                onChange={(e) => setForm({ ...form, hargaPerBulan: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Minimum DP (Rp) <span className="text-red-500">*</span>
              </label>
              <input
                required
                type="number"
                className="w-full border border-gray-300 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                placeholder="Masukkan minimum DP"
                min="0"
                value={form.minimumDP}
                onChange={(e) => setForm({ ...form, minimumDP: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Status Kontrak <span className="text-red-500">*</span>
              </label>
              <select
                value={form.statusKontrak}
                onChange={(e) => setForm({ ...form, statusKontrak: e.target.value })}
                className="w-full border border-gray-300 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
              >
                <option value="Belum Dikontrak">Belum Dikontrak</option>
                <option value="Sudah Dikontrak">Sudah Dikontrak</option>
              </select>
            </div>
          </div>

          <div className="flex gap-3 mt-6">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="flex-1 px-4 py-3 border border-gray-300 text-gray-900 rounded-lg hover:bg-gray-50 font-semibold transition"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-gradient-to-r from-pink-500 to-purple-600 hover:shadow-lg disabled:opacity-70 text-white py-3 rounded-lg font-semibold transition flex items-center justify-center gap-2"
            >
              {loading ? <><Loader2 className="animate-spin w-5 h-5" /> Menyimpan...</> : <><PlusCircle className="w-5 h-5" /> Simpan</>}
            </button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <>
      <button
        onClick={() => setShowForm(true)}
        className="fixed bottom-8 right-8 w-16 h-16 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transition z-40 group"
      >
        <span className="absolute -top-12 right-0 bg-gray-900 text-white px-4 py-2 rounded-lg text-sm opacity-0 group-hover:opacity-100 transition whitespace-nowrap">
          Tambah Kontrakan
        </span>
        <PlusCircle className="w-8 h-8" />
      </button>

      {/* Custom Alert */}
      <Alert
        isOpen={alert.isOpen}
        onClose={() => setAlert({ ...alert, isOpen: false })}
        type={alert.type}
        title={alert.title}
        message={alert.message}
      />
    </>
  );
}
