import { useState, useEffect } from 'react';
import api from '../utils/api';
import { UserPlus, Users, Mail, Phone, Shield, Trash2, Loader2 } from 'lucide-react';
import Alert from '../components/Alert';

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Form State
  const [formData, setFormData] = useState({
    nama: '',
    email: '',
    password: '',
    telepon: '',
    role: 'karyawan' // Default role
  });

  // Alert State
  const [alert, setAlert] = useState({
    isOpen: false,
    type: 'info',
    title: '',
    message: ''
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await api.get('/auth/users');
      if (res.success) {
        setUsers(res.data);
      }
    } catch (error) {
      console.error('Gagal mengambil data user:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setAlert({ ...alert, isOpen: false });

    try {
      // Gunakan endpoint khusus create user untuk admin
      const res = await api.post('/auth/create', formData);
      
      if (res.success) {
        setAlert({
          isOpen: true,
          type: 'success',
          title: 'Berhasil',
          message: 'Akun baru berhasil dibuat'
        });
        setShowModal(false);
        setFormData({
          nama: '',
          email: '',
          password: '',
          telepon: '',
          role: 'karyawan'
        });
        fetchUsers(); // Refresh list
      }
    } catch (error) {
      setAlert({
        isOpen: true,
        type: 'error',
        title: 'Gagal',
        message: error.message || 'Gagal membuat akun'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Users className="w-8 h-8 text-pink-600" />
            Manajemen Akun
          </h1>
          <p className="text-gray-600 mt-1">Kelola akun admin dan karyawan</p>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="bg-pink-600 text-white px-4 py-2 rounded-lg hover:bg-pink-700 transition flex items-center gap-2 shadow-lg"
        >
          <UserPlus className="w-5 h-5" />
          Tambah Akun
        </button>
      </div>

      {/* User List */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Memuat data...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 font-semibold text-gray-700">Nama</th>
                  <th className="px-6 py-4 font-semibold text-gray-700">Kontak</th>
                  <th className="px-6 py-4 font-semibold text-gray-700">Role</th>
                  <th className="px-6 py-4 font-semibold text-gray-700">Bergabung</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {users.map((user) => (
                  <tr key={user._id} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">{user.nama}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1 text-sm text-gray-600">
                        <div className="flex items-center gap-2">
                          <Mail className="w-3 h-3" /> {user.email}
                        </div>
                        {user.telepon && (
                          <div className="flex items-center gap-2">
                            <Phone className="w-3 h-3" /> {user.telepon}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${
                        user.role === 'admin' 
                          ? 'bg-purple-100 text-purple-700' 
                          : user.role === 'karyawan'
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-gray-100 text-gray-700'
                      }`}>
                        <Shield className="w-3 h-3" />
                        {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {new Date(user.createdAt).toLocaleDateString('id-ID', {
                        day: 'numeric', month: 'long', year: 'numeric'
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Tambah Akun */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-xl animate-in fade-in zoom-in duration-200">
            <h2 className="text-xl font-bold mb-4 text-gray-900">Buat Akun Baru</h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nama Lengkap</label>
                <input type="text" name="nama" required value={formData.nama} onChange={handleChange} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-pink-500 outline-none" placeholder="Nama karyawan" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input type="email" name="email" required value={formData.email} onChange={handleChange} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-pink-500 outline-none" placeholder="email@contoh.com" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                <input type="password" name="password" required minLength={6} value={formData.password} onChange={handleChange} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-pink-500 outline-none" placeholder="Minimal 6 karakter" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nomor Telepon</label>
                <input type="tel" name="telepon" value={formData.telepon} onChange={handleChange} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-pink-500 outline-none" placeholder="08..." />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Role Akun</label>
                <select name="role" value={formData.role} onChange={handleChange} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-pink-500 outline-none bg-white">
                  <option value="karyawan">Karyawan</option>
                  <option value="admin">Admin</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  *Admin memiliki akses penuh, Karyawan memiliki akses terbatas.
                </p>
              </div>

              <div className="flex gap-3 pt-4">
                <button 
                  type="button" 
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
                >
                  Batal
                </button>
                <button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="flex-1 bg-pink-600 text-white px-4 py-2 rounded-lg hover:bg-pink-700 transition flex items-center justify-center gap-2"
                >
                  {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Buat Akun'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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