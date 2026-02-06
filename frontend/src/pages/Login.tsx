import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export default function Login() {
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login: doLogin } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await doLogin(login, password);
      toast.success('Zalogowano pomyślnie');
      navigate('/');
    } catch (error: any) {
      toast.error(error.message || 'Błąd logowania');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-meat-50 to-meat-100 py-12 px-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-meat-600">HACCP MLO</h1>
          <p className="text-gray-600 mt-2">System zarządzania bezpieczeństwem żywności</p>
        </div>

        <div className="bg-white rounded-xl shadow-xl p-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">Logowanie</h2>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Login</label>
              <input
                type="text"
                className="input"
                value={login}
                onChange={(e) => setLogin(e.target.value)}
                placeholder="admin"
                required
              />
            </div>

            <div>
              <label className="label">Hasło</label>
              <input
                type="password"
                className="input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full btn-primary py-3 disabled:opacity-50"
            >
              {isLoading ? 'Logowanie...' : 'Zaloguj się'}
            </button>
          </form>

          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600 font-medium mb-2">Dane demonstracyjne:</p>
            <p className="text-xs text-gray-500">Admin: admin / admin123</p>
            <p className="text-xs text-gray-500">Pracownik: pracownik / user123</p>
          </div>
        </div>
      </div>
    </div>
  );
}
