import { useState, useEffect } from 'react';
import { api, RawMaterial } from '../services/api';
import { PlusIcon, PencilIcon, TrashIcon, CubeIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

const CATEGORIES = [
  { value: 'MEAT', label: 'Mięso' },
  { value: 'SPICES', label: 'Przyprawy' },
  { value: 'ADDITIVES', label: 'Dodatki' },
  { value: 'PACKAGING', label: 'Opakowania' },
  { value: 'OTHER', label: 'Inne' },
];

export default function RawMaterials() {
  const [materials, setMaterials] = useState<RawMaterial[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<RawMaterial | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    category: 'MEAT',
    unit: 'kg',
    storageTemp: '',
    shelfLife: '',
    allergens: '',
  });

  useEffect(() => {
    loadMaterials();
  }, []);

  const loadMaterials = async () => {
    try {
      const data = await api.getRawMaterials();
      setMaterials(data);
    } catch (error) {
      toast.error('Błąd podczas ładowania surowców');
    } finally {
      setIsLoading(false);
    }
  };

  const openModal = (material?: RawMaterial) => {
    if (material) {
      setEditingMaterial(material);
      setFormData({
        name: material.name,
        category: material.category,
        unit: material.unit,
        storageTemp: material.storageTemp || '',
        shelfLife: material.shelfLife?.toString() || '',
        allergens: material.allergens || '',
      });
    } else {
      setEditingMaterial(null);
      setFormData({ name: '', category: 'MEAT', unit: 'kg', storageTemp: '', shelfLife: '', allergens: '' });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        shelfLife: formData.shelfLife ? parseInt(formData.shelfLife) : null,
      };
      if (editingMaterial) {
        await api.updateRawMaterial(editingMaterial.id, payload);
        toast.success('Surowiec zaktualizowany');
      } else {
        await api.createRawMaterial(payload);
        toast.success('Surowiec dodany');
      }
      setIsModalOpen(false);
      loadMaterials();
    } catch (error) {
      toast.error('Błąd podczas zapisywania');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Czy na pewno usunąć ten surowiec?')) return;
    try {
      await api.deleteRawMaterial(id);
      toast.success('Surowiec usunięty');
      loadMaterials();
    } catch (error) {
      toast.error('Błąd podczas usuwania');
    }
  };

  const getCategoryLabel = (value: string) => CATEGORIES.find(c => c.value === value)?.label || value;
  const getCategoryColor = (value: string) => {
    switch (value) {
      case 'MEAT': return 'bg-red-100 text-red-800';
      case 'SPICES': return 'bg-yellow-100 text-yellow-800';
      case 'ADDITIVES': return 'bg-purple-100 text-purple-800';
      case 'PACKAGING': return 'bg-blue-100 text-blue-800';
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
          <h1 className="text-2xl font-bold text-gray-900">Surowce</h1>
          <p className="text-gray-500 mt-1">Katalog surowców i materiałów</p>
        </div>
        <button onClick={() => openModal()} className="btn-primary flex items-center gap-2">
          <PlusIcon className="w-5 h-5" />
          Dodaj surowiec
        </button>
      </div>

      {/* Materials Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nazwa</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Kategoria</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Jednostka</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Temp. przech.</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Termin (dni)</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Alergeny</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Akcje</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {materials.map((material) => (
                <tr key={material.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <CubeIcon className="w-5 h-5 text-gray-400" />
                      <span className="font-medium text-gray-900">{material.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getCategoryColor(material.category)}`}>
                      {getCategoryLabel(material.category)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">{material.unit}</td>
                  <td className="px-4 py-3 text-sm text-gray-500">{material.storageTemp || '-'}</td>
                  <td className="px-4 py-3 text-sm text-gray-500">{material.shelfLife || '-'}</td>
                  <td className="px-4 py-3 text-sm text-gray-500">{material.allergens || '-'}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => openModal(material)}
                        className="p-1 text-gray-400 hover:text-meat-600"
                      >
                        <PencilIcon className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleDelete(material.id)}
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

      {materials.length === 0 && (
        <div className="card text-center py-12">
          <CubeIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900">Brak surowców</h3>
          <p className="text-gray-500 mt-2">Dodaj pierwszy surowiec do katalogu.</p>
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen p-4">
            <div className="fixed inset-0 bg-black bg-opacity-30" onClick={() => setIsModalOpen(false)}></div>
            <div className="relative bg-white rounded-xl shadow-xl max-w-lg w-full p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">
                {editingMaterial ? 'Edytuj surowiec' : 'Nowy surowiec'}
              </h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nazwa *</label>
                  <input
                    type="text"
                    className="input"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Kategoria *</label>
                    <select
                      className="input"
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    >
                      {CATEGORIES.map((cat) => (
                        <option key={cat.value} value={cat.value}>{cat.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Jednostka *</label>
                    <select
                      className="input"
                      value={formData.unit}
                      onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                    >
                      <option value="kg">kg</option>
                      <option value="g">g</option>
                      <option value="l">l</option>
                      <option value="szt">szt</option>
                      <option value="opak">opak</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Temp. przechowywania</label>
                    <input
                      type="text"
                      className="input"
                      placeholder="np. 0-4°C"
                      value={formData.storageTemp}
                      onChange={(e) => setFormData({ ...formData, storageTemp: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Termin ważności (dni)</label>
                    <input
                      type="number"
                      className="input"
                      min="1"
                      value={formData.shelfLife}
                      onChange={(e) => setFormData({ ...formData, shelfLife: e.target.value })}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Alergeny</label>
                  <input
                    type="text"
                    className="input"
                    placeholder="np. soja, mleko, jaja"
                    value={formData.allergens}
                    onChange={(e) => setFormData({ ...formData, allergens: e.target.value })}
                  />
                </div>
                <div className="flex gap-3 pt-4">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 btn-secondary">
                    Anuluj
                  </button>
                  <button type="submit" className="flex-1 btn-primary">
                    {editingMaterial ? 'Zapisz zmiany' : 'Dodaj surowiec'}
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
