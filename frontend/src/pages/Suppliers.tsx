import { useState, useEffect } from 'react';
import { api, Supplier } from '../services/api';
import { PlusIcon, PencilIcon, TrashIcon, TruckIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

export default function Suppliers() {
  const { isAdmin } = useAuth();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    vetNumber: '',
    address: '',
    phone: '',
    email: '',
    contactPerson: '',
  });

  useEffect(() => {
    loadSuppliers();
  }, []);

  const loadSuppliers = async () => {
    try {
      const data = await api.getSuppliers();
      setSuppliers(data);
    } catch (error) {
      toast.error('Błąd podczas ładowania dostawców');
    } finally {
      setIsLoading(false);
    }
  };

  const openModal = (supplier?: Supplier) => {
    if (supplier) {
      setEditingSupplier(supplier);
      setFormData({
        name: supplier.name,
        vetNumber: supplier.vetNumber || '',
        address: supplier.address || '',
        phone: supplier.phone || '',
        email: supplier.email || '',
        contactPerson: supplier.contactPerson || '',
      });
    } else {
      setEditingSupplier(null);
      setFormData({ name: '', vetNumber: '', address: '', phone: '', email: '', contactPerson: '' });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingSupplier) {
        await api.updateSupplier(editingSupplier.id, formData);
        toast.success('Dostawca zaktualizowany');
      } else {
        await api.createSupplier(formData);
        toast.success('Dostawca dodany');
      }
      setIsModalOpen(false);
      loadSuppliers();
    } catch (error) {
      toast.error('Błąd podczas zapisywania');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Czy na pewno usunąć tego dostawcę?')) return;
    try {
      await api.deleteSupplier(id);
      toast.success('Dostawca usunięty');
      loadSuppliers();
    } catch (error) {
      toast.error('Błąd podczas usuwania');
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
          <h1 className="text-2xl font-bold text-gray-900">Dostawcy</h1>
          <p className="text-gray-500 mt-1">Zarządzanie dostawcami surowców</p>
        </div>
        {isAdmin && (
          <button onClick={() => openModal()} className="btn-primary flex items-center gap-2">
            <PlusIcon className="w-5 h-5" />
            Dodaj dostawcę
          </button>
        )}
      </div>

      {/* Suppliers Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {suppliers.map((supplier) => (
          <div key={supplier.id} className="card">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <TruckIcon className="w-6 h-6 text-blue-600" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-medium text-gray-900 truncate">{supplier.name}</h3>
                    {supplier.vetNumber && (
                      <p className="text-sm text-meat-600 font-medium">Nr wet: {supplier.vetNumber}</p>
                    )}
                  </div>
                  <span className={`badge ${supplier.isApproved ? 'badge-success' : 'badge-danger'}`}>
                    {supplier.isApproved ? 'Zatwierdzony' : 'Niezatwierdzony'}
                  </span>
                </div>
                <div className="mt-3 space-y-1 text-sm text-gray-500">
                  {supplier.address && <p>{supplier.address}</p>}
                  {supplier.phone && <p>Tel: {supplier.phone}</p>}
                  {supplier.email && <p>{supplier.email}</p>}
                  {supplier.contactPerson && <p>Kontakt: {supplier.contactPerson}</p>}
                </div>
              </div>
            </div>
            <div className="flex gap-2 mt-4 pt-4 border-t border-gray-100">
              {isAdmin && (
                <>
                  <button
                    onClick={() => openModal(supplier)}
                    className="flex-1 flex items-center justify-center gap-1 text-sm text-gray-600 hover:text-meat-600"
                  >
                    <PencilIcon className="w-4 h-4" /> Edytuj
                  </button>
                  <button
                    onClick={() => handleDelete(supplier.id)}
                    className="flex-1 flex items-center justify-center gap-1 text-sm text-gray-600 hover:text-red-600"
                  >
                    <TrashIcon className="w-4 h-4" /> Usuń
                  </button>
                </>
              )}
            </div>
          </div>
        ))}
      </div>

      {suppliers.length === 0 && (
        <div className="card text-center py-12">
          <TruckIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900">Brak dostawców</h3>
          <p className="text-gray-500 mt-2">Dodaj pierwszego dostawcę, aby rozpocząć.</p>
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen p-4">
            <div className="fixed inset-0 bg-black bg-opacity-30" onClick={() => setIsModalOpen(false)}></div>
            <div className="relative bg-white rounded-xl shadow-xl max-w-lg w-full p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">
                {editingSupplier ? 'Edytuj dostawcę' : 'Nowy dostawca'}
              </h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nazwa firmy *</label>
                  <input
                    type="text"
                    className="input"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Numer weterynaryjny</label>
                  <input
                    type="text"
                    className="input"
                    placeholder="np. 12345601"
                    value={formData.vetNumber}
                    onChange={(e) => setFormData({ ...formData, vetNumber: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Adres</label>
                  <input
                    type="text"
                    className="input"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Telefon</label>
                    <input
                      type="tel"
                      className="input"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <input
                      type="email"
                      className="input"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Osoba kontaktowa</label>
                  <input
                    type="text"
                    className="input"
                    value={formData.contactPerson}
                    onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                  />
                </div>
                <div className="flex gap-3 pt-4">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 btn-secondary">
                    Anuluj
                  </button>
                  <button type="submit" className="flex-1 btn-primary">
                    {editingSupplier ? 'Zapisz zmiany' : 'Dodaj dostawcę'}
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
