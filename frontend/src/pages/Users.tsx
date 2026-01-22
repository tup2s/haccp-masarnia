import { useState, useEffect } from 'react';
import { api, User } from '../services/api';
import { PlusIcon, UserIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import dayjs from 'dayjs';

export default function Users() {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'EMPLOYEE',
  });

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const data = await api.getUsers();
      setUsers(data);
    } catch (error) {
      toast.error('Błąd podczas ładowania użytkowników');
    } finally {
      setIsLoading(false);
    }
  };

  const openModal = (user?: User) => {
    if (user) {
      setEditingUser(user);
      setFormData({
        name: user.name,
        email: user.email,
        password: '',
        role: user.role,
      });
    } else {
      setEditingUser(null);
      setFormData({
        name: '',
        email: '',
        password: '',
        role: 'EMPLOYEE',
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingUser) {
        const payload: any = {
          name: formData.name,
          email: formData.email,
          role: formData.role,
        };
        if (formData.password) {
          payload.password = formData.password;
        }
        await api.updateUser(editingUser.id, payload);
        toast.success('Użytkownik zaktualizowany');
      } else {
        if (!formData.password) {
          toast.error('Hasło jest wymagane');
          return;
        }
        await api.createUser(formData);
        toast.success('Użytkownik dodany');
      }
      setIsModalOpen(false);
      loadUsers();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Błąd podczas zapisywania');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Czy na pewno usunąć tego użytkownika?')) return;
    try {
      await api.deleteUser(id);
      toast.success('Użytkownik usunięty');
      loadUsers();
    } catch (error) {
      toast.error('Błąd podczas usuwania');
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'ADMIN': return 'Administrator';
      case 'MANAGER': return 'Kierownik';
      case 'EMPLOYEE': return 'Pracownik';
      default: return role;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'ADMIN': return 'bg-red-100 text-red-800';
      case 'MANAGER': return 'bg-blue-100 text-blue-800';
      case 'EMPLOYEE': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-meat-600"></div>
    </div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Użytkownicy</h1>
          <p className="text-gray-500 mt-1">Zarządzanie kontami użytkowników</p>
        </div>
        <button onClick={() => openModal()} className="btn-primary flex items-center gap-2">
          <PlusIcon className="w-5 h-5" />
          Dodaj użytkownika
        </button>
      </div>

      {/* Users Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Użytkownik</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rola</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Utworzony</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Akcje</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-meat-100 rounded-full flex items-center justify-center">
                        <UserIcon className="w-5 h-5 text-meat-600" />
                      </div>
                      <span className="font-medium text-gray-900">{user.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">{user.email}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded ${getRoleColor(user.role)}`}>
                      {getRoleLabel(user.role)}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`badge ${user.isActive ? 'badge-success' : 'badge-danger'}`}>
                      {user.isActive ? 'Aktywny' : 'Nieaktywny'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">
                    {dayjs(user.createdAt).format('DD.MM.YYYY')}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => openModal(user)}
                        className="p-1 text-gray-400 hover:text-meat-600"
                      >
                        <PencilIcon className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleDelete(user.id)}
                        className="p-1 text-gray-400 hover:text-red-600"
                      >
                        <TrashIcon className="w-5 h-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {users.length === 0 && (
        <div className="card text-center py-12">
          <UserIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900">Brak użytkowników</h3>
          <p className="text-gray-500 mt-2">Dodaj pierwszego użytkownika.</p>
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen p-4">
            <div className="fixed inset-0 bg-black bg-opacity-30" onClick={() => setIsModalOpen(false)}></div>
            <div className="relative bg-white rounded-xl shadow-xl max-w-lg w-full p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">
                {editingUser ? 'Edytuj użytkownika' : 'Nowy użytkownik'}
              </h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Imię i nazwisko *</label>
                  <input
                    type="text"
                    className="input"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                  <input
                    type="email"
                    className="input"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Hasło {editingUser ? '(zostaw puste, aby nie zmieniać)' : '*'}
                  </label>
                  <input
                    type="password"
                    className="input"
                    required={!editingUser}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Rola *</label>
                  <select
                    className="input"
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  >
                    <option value="EMPLOYEE">Pracownik</option>
                    <option value="MANAGER">Kierownik</option>
                    <option value="ADMIN">Administrator</option>
                  </select>
                  <p className="text-xs text-gray-500 mt-1">
                    Administrator - pełny dostęp • Kierownik - zarządzanie danymi • Pracownik - wprowadzanie danych
                  </p>
                </div>
                <div className="flex gap-3 pt-4">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 btn-secondary">
                    Anuluj
                  </button>
                  <button type="submit" className="flex-1 btn-primary">
                    {editingUser ? 'Zapisz zmiany' : 'Dodaj użytkownika'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
