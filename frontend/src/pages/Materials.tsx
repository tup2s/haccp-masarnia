import { useState, useEffect } from 'react';
import {
  BeakerIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  MagnifyingGlassIcon,
  ArchiveBoxArrowDownIcon,
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

interface Material {
  id: number;
  name: string;
  category: string;
  unit: string;
  supplierId: number | null;
  minStock: number | null;
  currentStock: number;
  storageConditions: string | null;
  allergens: string | null;
  isActive: boolean;
  supplier?: { id: number; name: string } | null;
}

interface Supplier {
  id: number;
  name: string;
}

interface MaterialReceipt {
  id: number;
  materialId: number;
  batchNumber: string;
  quantity: number;
  unit: string;
  expiryDate: string | null;
  receivedAt: string;
  material: { name: string };
  supplier?: { name: string } | null;
}

const categoryLabels: Record<string, string> = {
  SPICE: 'Przyprawy',
  ADDITIVE: 'Dodatki',
  CASING: 'Osłonki',
  PACKAGING: 'Opakowania',
};

const categoryColors: Record<string, string> = {
  SPICE: 'bg-orange-100 text-orange-800',
  ADDITIVE: 'bg-purple-100 text-purple-800',
  CASING: 'bg-blue-100 text-blue-800',
  PACKAGING: 'bg-gray-100 text-gray-800',
};

export default function Materials() {
  const { user } = useAuth();
  const [materials, setMaterials] = useState<Material[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [receipts, setReceipts] = useState<MaterialReceipt[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [activeTab, setActiveTab] = useState<'list' | 'receipts'>('list');
  
  // Modal states
  const [showMaterialModal, setShowMaterialModal] = useState(false);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<Material | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<number | null>(null);

  // Form state
  const [form, setForm] = useState({
    name: '',
    category: 'SPICE',
    unit: 'kg',
    supplierId: '',
    minStock: '',
    storageConditions: '',
    allergens: '',
  });

  const [receiptForm, setReceiptForm] = useState({
    materialId: '',
    supplierId: '',
    batchNumber: '',
    quantity: '',
    unit: 'kg',
    expiryDate: '',
    pricePerUnit: '',
    documentNumber: '',
    notes: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [materialsRes, suppliersRes, receiptsRes] = await Promise.all([
        api.getMaterials(),
        api.getSuppliers(),
        api.getMaterialReceipts(),
      ]);
      setMaterials(materialsRes);
      setSuppliers(suppliersRes);
      setReceipts(receiptsRes);
    } catch (error) {
      console.error('Błąd ładowania:', error);
      toast.error('Błąd podczas ładowania danych');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitMaterial = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const data = {
        name: form.name,
        category: form.category,
        unit: form.unit,
        supplierId: form.supplierId ? parseInt(form.supplierId) : null,
        minStock: form.minStock ? parseFloat(form.minStock) : null,
        storageConditions: form.storageConditions || null,
        allergens: form.allergens || null,
      };

      if (editingMaterial) {
        await api.updateMaterial(editingMaterial.id, data);
        toast.success('Materiał zaktualizowany');
      } else {
        await api.createMaterial(data);
        toast.success('Materiał dodany');
      }

      setShowMaterialModal(false);
      resetForm();
      loadData();
    } catch (error) {
      toast.error('Błąd podczas zapisywania');
    }
  };

  const handleSubmitReceipt = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createMaterialReceipt({
        materialId: parseInt(receiptForm.materialId),
        supplierId: receiptForm.supplierId ? parseInt(receiptForm.supplierId) : null,
        batchNumber: receiptForm.batchNumber,
        quantity: parseFloat(receiptForm.quantity),
        unit: receiptForm.unit,
        expiryDate: receiptForm.expiryDate || null,
        pricePerUnit: receiptForm.pricePerUnit ? parseFloat(receiptForm.pricePerUnit) : null,
        documentNumber: receiptForm.documentNumber || null,
        notes: receiptForm.notes || null,
      });

      toast.success('Przyjęcie zarejestrowane');
      setShowReceiptModal(false);
      resetReceiptForm();
      loadData();
    } catch (error) {
      toast.error('Błąd podczas zapisywania');
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await api.deleteMaterial(id);
      toast.success('Materiał usunięty');
      setShowDeleteConfirm(null);
      loadData();
    } catch (error) {
      toast.error('Błąd podczas usuwania');
    }
  };

  const openEditModal = (material: Material) => {
    setEditingMaterial(material);
    setForm({
      name: material.name,
      category: material.category,
      unit: material.unit,
      supplierId: material.supplierId?.toString() || '',
      minStock: material.minStock?.toString() || '',
      storageConditions: material.storageConditions || '',
      allergens: material.allergens || '',
    });
    setShowMaterialModal(true);
  };

  const resetForm = () => {
    setEditingMaterial(null);
    setForm({
      name: '',
      category: 'SPICE',
      unit: 'kg',
      supplierId: '',
      minStock: '',
      storageConditions: '',
      allergens: '',
    });
  };

  const resetReceiptForm = () => {
    setReceiptForm({
      materialId: '',
      supplierId: '',
      batchNumber: '',
      quantity: '',
      unit: 'kg',
      expiryDate: '',
      pricePerUnit: '',
      documentNumber: '',
      notes: '',
    });
  };

  const filteredMaterials = materials.filter(m => {
    const matchesSearch = m.name.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = !categoryFilter || m.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  // Materiały z niskim stanem
  const lowStockMaterials = materials.filter(m => 
    m.minStock && m.currentStock < m.minStock
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-meat-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Materiały i Dodatki</h1>
          <p className="text-gray-500 mt-1">Przyprawy, osłonki, opakowania</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => { resetReceiptForm(); setShowReceiptModal(true); }}
            className="btn-secondary flex items-center gap-2"
          >
            <ArchiveBoxArrowDownIcon className="w-5 h-5" />
            Przyjęcie
          </button>
          <button
            onClick={() => { resetForm(); setShowMaterialModal(true); }}
            className="btn-primary flex items-center gap-2"
          >
            <PlusIcon className="w-5 h-5" />
            Dodaj materiał
          </button>
        </div>
      </div>

      {/* Alert niski stan */}
      {lowStockMaterials.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-yellow-800 font-medium">⚠️ Niski stan magazynowy:</p>
          <p className="text-yellow-700 text-sm mt-1">
            {lowStockMaterials.map(m => m.name).join(', ')}
          </p>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-4 border-b">
        <button
          onClick={() => setActiveTab('list')}
          className={`pb-2 px-1 font-medium ${
            activeTab === 'list'
              ? 'border-b-2 border-meat-600 text-meat-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Lista materiałów ({materials.length})
        </button>
        <button
          onClick={() => setActiveTab('receipts')}
          className={`pb-2 px-1 font-medium ${
            activeTab === 'receipts'
              ? 'border-b-2 border-meat-600 text-meat-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Przyjęcia ({receipts.length})
        </button>
      </div>

      {activeTab === 'list' && (
        <>
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Szukaj materiału..."
                className="input pl-10"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <select
              className="input w-full sm:w-48"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
            >
              <option value="">Wszystkie kategorie</option>
              {Object.entries(categoryLabels).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
          </div>

          {/* Materials Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredMaterials.map((material) => (
              <div key={material.id} className="card hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start">
                  <div>
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${categoryColors[material.category]}`}>
                      {categoryLabels[material.category]}
                    </span>
                    <h3 className="font-semibold text-gray-900 mt-2">{material.name}</h3>
                    {material.supplier && (
                      <p className="text-sm text-gray-500">Dostawca: {material.supplier.name}</p>
                    )}
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => openEditModal(material)}
                      className="p-1 text-gray-400 hover:text-blue-600"
                    >
                      <PencilIcon className="w-4 h-4" />
                    </button>
                    {user?.role === 'ADMIN' && (
                      <button
                        onClick={() => setShowDeleteConfirm(material.id)}
                        className="p-1 text-gray-400 hover:text-red-600"
                      >
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t flex justify-between items-center">
                  <div>
                    <p className="text-sm text-gray-500">Stan magazynowy</p>
                    <p className={`text-lg font-bold ${
                      material.minStock && material.currentStock < material.minStock
                        ? 'text-red-600'
                        : 'text-gray-900'
                    }`}>
                      {material.currentStock} {material.unit}
                    </p>
                  </div>
                  {material.minStock && (
                    <div className="text-right">
                      <p className="text-xs text-gray-500">Min. stan</p>
                      <p className="text-sm text-gray-600">{material.minStock} {material.unit}</p>
                    </div>
                  )}
                </div>

                {material.allergens && (
                  <p className="mt-2 text-xs text-red-600">⚠️ Alergeny: {material.allergens}</p>
                )}
              </div>
            ))}
          </div>

          {filteredMaterials.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              <BeakerIcon className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>Brak materiałów</p>
            </div>
          )}
        </>
      )}

      {activeTab === 'receipts' && (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Data</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Materiał</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nr partii</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ilość</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Dostawca</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ważność</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {receipts.map((receipt) => (
                <tr key={receipt.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm text-gray-900">
                    {new Date(receipt.receivedAt).toLocaleDateString('pl-PL')}
                  </td>
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">
                    {receipt.material.name}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600 font-mono">
                    {receipt.batchNumber}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900">
                    {receipt.quantity} {receipt.unit}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {receipt.supplier?.name || '-'}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {receipt.expiryDate
                      ? new Date(receipt.expiryDate).toLocaleDateString('pl-PL')
                      : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {receipts.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              <p>Brak przyjęć materiałów</p>
            </div>
          )}
        </div>
      )}

      {/* Material Modal */}
      {showMaterialModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-xl font-bold mb-4">
                {editingMaterial ? 'Edytuj materiał' : 'Nowy materiał'}
              </h2>
              <form onSubmit={handleSubmitMaterial} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nazwa *</label>
                  <input
                    type="text"
                    className="input"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Kategoria *</label>
                    <select
                      className="input"
                      value={form.category}
                      onChange={(e) => setForm({ ...form, category: e.target.value })}
                    >
                      {Object.entries(categoryLabels).map(([key, label]) => (
                        <option key={key} value={key}>{label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Jednostka *</label>
                    <select
                      className="input"
                      value={form.unit}
                      onChange={(e) => setForm({ ...form, unit: e.target.value })}
                    >
                      <option value="kg">kg</option>
                      <option value="g">g</option>
                      <option value="l">l</option>
                      <option value="ml">ml</option>
                      <option value="szt">szt</option>
                      <option value="m">m</option>
                      <option value="op">opakowanie</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Dostawca</label>
                    <select
                      className="input"
                      value={form.supplierId}
                      onChange={(e) => setForm({ ...form, supplierId: e.target.value })}
                    >
                      <option value="">-- wybierz --</option>
                      {suppliers.map((s) => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Min. stan</label>
                    <input
                      type="number"
                      step="0.01"
                      className="input"
                      value={form.minStock}
                      onChange={(e) => setForm({ ...form, minStock: e.target.value })}
                      placeholder="np. 5"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Warunki przechowywania</label>
                  <input
                    type="text"
                    className="input"
                    value={form.storageConditions}
                    onChange={(e) => setForm({ ...form, storageConditions: e.target.value })}
                    placeholder="np. Suche, ciemne miejsce"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Alergeny</label>
                  <input
                    type="text"
                    className="input"
                    value={form.allergens}
                    onChange={(e) => setForm({ ...form, allergens: e.target.value })}
                    placeholder="np. Gorczyca, seler"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button type="button" onClick={() => setShowMaterialModal(false)} className="btn-secondary flex-1">
                    Anuluj
                  </button>
                  <button type="submit" className="btn-primary flex-1">
                    {editingMaterial ? 'Zapisz' : 'Dodaj'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Receipt Modal */}
      {showReceiptModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-xl font-bold mb-4">Przyjęcie materiału</h2>
              <form onSubmit={handleSubmitReceipt} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Materiał *</label>
                  <select
                    className="input"
                    value={receiptForm.materialId}
                    onChange={(e) => {
                      const mat = materials.find(m => m.id === parseInt(e.target.value));
                      setReceiptForm({
                        ...receiptForm,
                        materialId: e.target.value,
                        unit: mat?.unit || 'kg',
                      });
                    }}
                    required
                  >
                    <option value="">-- wybierz --</option>
                    {materials.map((m) => (
                      <option key={m.id} value={m.id}>{m.name}</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nr partii *</label>
                    <input
                      type="text"
                      className="input"
                      value={receiptForm.batchNumber}
                      onChange={(e) => setReceiptForm({ ...receiptForm, batchNumber: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Ilość *</label>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        step="0.01"
                        className="input flex-1"
                        value={receiptForm.quantity}
                        onChange={(e) => setReceiptForm({ ...receiptForm, quantity: e.target.value })}
                        required
                      />
                      <span className="input w-16 text-center bg-gray-50">{receiptForm.unit}</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Dostawca</label>
                    <select
                      className="input"
                      value={receiptForm.supplierId}
                      onChange={(e) => setReceiptForm({ ...receiptForm, supplierId: e.target.value })}
                    >
                      <option value="">-- wybierz --</option>
                      {suppliers.map((s) => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Data ważności</label>
                    <input
                      type="date"
                      className="input"
                      value={receiptForm.expiryDate}
                      onChange={(e) => setReceiptForm({ ...receiptForm, expiryDate: e.target.value })}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nr dokumentu (faktura)</label>
                  <input
                    type="text"
                    className="input"
                    value={receiptForm.documentNumber}
                    onChange={(e) => setReceiptForm({ ...receiptForm, documentNumber: e.target.value })}
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button type="button" onClick={() => setShowReceiptModal(false)} className="btn-secondary flex-1">
                    Anuluj
                  </button>
                  <button type="submit" className="btn-primary flex-1">
                    Przyjmij
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-sm w-full p-6">
            <h3 className="text-lg font-bold mb-2">Potwierdź usunięcie</h3>
            <p className="text-gray-600 mb-4">Czy na pewno chcesz usunąć ten materiał?</p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(null)}
                className="btn-secondary flex-1"
              >
                Anuluj
              </button>
              <button
                onClick={() => handleDelete(showDeleteConfirm)}
                className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 flex-1"
              >
                Usuń
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
