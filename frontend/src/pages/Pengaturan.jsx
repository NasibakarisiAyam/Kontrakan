import { Save, Lock, Bell, Moon } from "lucide-react";
import { useState } from "react";

export default function Pengaturan() {
  const [settings, setSettings] = useState({
    namaUsaha: "SmartKontrakan",
    email: "admin@smartkontrakan.com",
    telepon: "081234567890",
    alamat: "Jakarta, Indonesia",
    notifikasi: true,
    darkMode: false,
    passwordLama: "",
    passwordBaru: "",
    konfirmasiPassword: "",
  });

  const [saved, setSaved] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setSettings({
      ...settings,
      [name]: type === "checkbox" ? checked : value,
    });
    setSaved(false);
  };

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">Pengaturan</h1>
          <p className="text-gray-600">Kelola preferensi dan pengaturan aplikasi Anda</p>
        </div>

        {/* Success Message */}
        {saved && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-lg mb-6">
            ✓ Pengaturan berhasil disimpan!
          </div>
        )}

        <div className="space-y-6">
          {/* Informasi Usaha */}
          <div className="bg-white rounded-lg shadow-md p-8 border-l-4 border-blue-500">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
              <span className="text-blue-500">ℹ️</span>
              Informasi Usaha
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Nama Usaha
                </label>
                <input
                  type="text"
                  name="namaUsaha"
                  value={settings.namaUsaha}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  name="email"
                  value={settings.email}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Telepon
                </label>
                <input
                  type="tel"
                  name="telepon"
                  value={settings.telepon}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Alamat
                </label>
                <input
                  type="text"
                  name="alamat"
                  value={settings.alamat}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Preferensi */}
          <div className="bg-white rounded-lg shadow-md p-8 border-l-4 border-purple-500">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
              <span className="text-purple-500">⚙️</span>
              Preferensi
            </h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <Bell size={24} className="text-purple-500" />
                  <div>
                    <p className="font-semibold text-gray-800">Notifikasi</p>
                    <p className="text-sm text-gray-600">Terima notifikasi dari sistem</p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    name="notifikasi"
                    checked={settings.notifikasi}
                    onChange={handleChange}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                </label>
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <Moon size={24} className="text-purple-500" />
                  <div>
                    <p className="font-semibold text-gray-800">Mode Gelap</p>
                    <p className="text-sm text-gray-600">Aktifkan tema gelap</p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    name="darkMode"
                    checked={settings.darkMode}
                    onChange={handleChange}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                </label>
              </div>
            </div>
          </div>

          {/* Keamanan */}
          <div className="bg-white rounded-lg shadow-md p-8 border-l-4 border-red-500">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
              <Lock size={24} className="text-red-500" />
              Keamanan
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Password Lama
                </label>
                <input
                  type="password"
                  name="passwordLama"
                  value={settings.passwordLama}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Password Baru
                </label>
                <input
                  type="password"
                  name="passwordBaru"
                  value={settings.passwordBaru}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Konfirmasi Password
                </label>
                <input
                  type="password"
                  name="konfirmasiPassword"
                  value={settings.konfirmasiPassword}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>
            </div>
          </div>

          {/* Button Simpan */}
          <div className="flex justify-end gap-4">
            <button
              onClick={handleSave}
              className="bg-gradient-to-r from-pink-500 to-purple-600 text-white px-8 py-3 rounded-lg font-semibold flex items-center gap-2 hover:shadow-lg transition"
            >
              <Save size={20} />
              Simpan Pengaturan
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
