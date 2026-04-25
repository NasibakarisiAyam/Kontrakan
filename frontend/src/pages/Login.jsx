import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Mail, Lock, Loader2 } from 'lucide-react';
import Alert from '../components/Alert';

export default function Login() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [alert, setAlert] = useState({
    isOpen: false,
    type: 'info',
    title: '',
    message: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log('=== LOGIN FORM SUBMITTED ===');
    console.log('Email:', formData.email);
    console.log('Password:', formData.password);
    setAlert({ ...alert, isOpen: false });
    setIsLoading(true);

    try {
      console.log('Calling login function...');
      const res = await login(formData.email, formData.password);
      
      console.log('Login result:', res);
      console.log('Response type:', typeof res);
      console.log('Response keys:', Object.keys(res || {}));
      console.log('Token in localStorage:', localStorage.getItem('token'));
      
      if (res && res.success) {
        console.log('Login successful! Redirecting to /');
        navigate('/', { replace: true });
        console.log('Navigate executed');
      } else {
        console.log('Login failed - response:', res);
        const errorMessage = res?.message || 'Email atau password salah.';
        console.log('Error message:', errorMessage);
        setAlert({
          isOpen: true,
          type: 'error',
          title: 'Gagal Login',
          message: errorMessage
        });
      }
    } catch (err) {
      console.error('Login error:', err);
      console.error('Error stack:', err.stack);
      setAlert({
        isOpen: true,
        type: 'error',
        title: 'Error',
        message: err?.message || 'Terjadi kesalahan sistem. Pastikan server berjalan.'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 p-4">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Selamat Datang Kembali</h1>
          <p className="text-gray-600 mt-2">Masuk untuk melanjutkan</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input type="email" name="email" required value={formData.email} onChange={handleChange} className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent outline-none transition" placeholder="nama@email.com" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input type="password" name="password" required value={formData.password} onChange={handleChange} className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent outline-none transition" placeholder="Masukkan password" />
            </div>
          </div>

          <button type="submit" disabled={isLoading} className="w-full bg-gradient-to-r from-pink-500 to-purple-600 text-white py-2.5 rounded-lg font-semibold hover:opacity-90 transition shadow-lg disabled:opacity-70 flex items-center justify-center gap-2">
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Masuk...
              </>
            ) : (
              'Masuk Sekarang'
            )}
          </button>
        </form>
      </div>

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
