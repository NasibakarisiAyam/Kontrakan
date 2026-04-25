import { useEffect, useState } from "react";
import axios from "axios";
import KontrakanCard from "../components/KontrakanCard";
import KontrakanForm from "../components/KontrakanForm";
import { Home, CheckCircle, Clock } from "lucide-react";

export default function Dashboard() {
  const [kontrakan, setKontrakan] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await axios.get("http://localhost:5000/api/kontrakan?limit=10000");
      setKontrakan(res.data.data || []);
    } catch (error) {
      console.error("Error fetching data:", error);
      setKontrakan([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Stats calculation
  const totalKontrakan = kontrakan.length;
  const totalTersedia = kontrakan.filter(k => k.statusKontrak === "Belum Dikontrak").length;
  const totalTertanggung = kontrakan.filter(k => k.statusKontrak === "Sudah Dikontrak").length;

  return (
    <div className="max-w-7xl mx-auto">
      {/* Welcome Section */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">Anda</h1>
        <p className="text-gray-600">
          Kelola jadwal booking ruangan dengan mudah. Lihat status ruangan, jadwal, dan pesan ruangan hanya dalam beberapa klik.
        </p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-2xl p-8 shadow-sm hover:shadow-md transition">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-gray-600 text-sm mb-2">Jumlah Kontrakan</p>
              <p className="text-5xl font-bold text-gray-900">{totalKontrakan}</p>
            </div>
            <div className="w-14 h-14 bg-gradient-to-br from-pink-400 to-pink-600 rounded-xl flex items-center justify-center">
              <Home className="w-7 h-7 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-8 shadow-sm hover:shadow-md transition">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-gray-600 text-sm mb-2">Kontrakan Tersedia</p>
              <p className="text-5xl font-bold text-gray-900">{totalTersedia}</p>
            </div>
            <div className="w-14 h-14 bg-gradient-to-br from-purple-400 to-purple-600 rounded-xl flex items-center justify-center">
              <CheckCircle className="w-7 h-7 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-8 shadow-sm hover:shadow-md transition">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-gray-600 text-sm mb-2">Kontrakan Dikontrak</p>
              <p className="text-5xl font-bold text-gray-900">{totalTertanggung}</p>
            </div>
            <div className="w-14 h-14 bg-gradient-to-br from-rose-400 to-rose-600 rounded-xl flex items-center justify-center">
              <Clock className="w-7 h-7 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Kontrakan Form - Floating Action Button */}
      <KontrakanForm refresh={fetchData} />

      {/* Kontrakan List */}
      {!loading && kontrakan.length > 0 && (
        <div className="mt-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Daftar Kontrakan</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {kontrakan.map((item) => (
              <KontrakanCard
                key={item._id}
                data={item}
                refresh={fetchData}
              />
            ))}
          </div>
        </div>
      )}

      {!loading && kontrakan.length === 0 && (
        <div className="mt-8 bg-white rounded-2xl shadow-sm p-12 text-center">
          <p className="text-gray-500 text-lg">
            Belum ada data kontrakan. Tambahkan kontrakan baru!
          </p>
        </div>
      )}
    </div>
  );
}
