import { useState, useEffect } from 'react';
import { api, RawMaterialReception, Supplier, RawMaterial } from '../services/api';
import { PlusIcon, ClipboardDocumentListIcon, PencilIcon, TrashIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { SelectModal } from '../components/SelectModal';
import toast from 'react-hot-toast';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';

dayjs.extend(utc);

export default function Receptions() {
  const [receptions, setReceptions] = useState<RawMaterialReception[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [materials, setMaterials] = useState<RawMaterial[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editReception, setEditReception] = useState<RawMaterialReception | null>(null);
  const [deleteModal, setDeleteModal] = useState<RawMaterialReception | null>(null);
  
  // Modale wyboru
  const [isSupplierSelectOpen, setIsSupplierSelectOpen] = useState(false);
  const [isMaterialSelectOpen, setIsMaterialSelectOpen] = useState(false);
  
  const userRole = JSON.parse(localStorage.getItem('user') || '{}').role || 'EMPLOYEE';
  const isAdmin = userRole === 'ADMIN';
  
  const [formData, setFormData] = useState({
    supplierId: '',
    rawMaterialId: '',
    quantity: '',
    unit: 'kg',
    batchNumber: '',
    expiryDate: '',
    temperature: '',
    isCompliant: true,
    notes: '',
    receivedDate: dayjs().format('YYYY-MM-DD'),
    receivedTime: '',
    vehicleClean: true,
    vehicleTemperature: '',
    packagingIntact: true,
    documentsComplete: true,
  });

  useEffect(() => {
    Promise.all([loadReceptions(), loadSuppliers(), loadMaterials()]);
  }, []);

  const loadReceptions = async () => {
    try {
      const data = await api.getReceptions();
      setReceptions(data);
    } catch (error) {
      toast.error('Błąd podczas ładowania przyjęć');
    } finally {
      setIsLoading(false);
    }
  };

  const loadSuppliers = async () => {
    const data = await api.getSuppliers();
    setSuppliers(data);
  };

  const loadMaterials = async () => {
    const data = await api.getRawMaterials();
    setMaterials(data);
  };

  const openModal = () => {
    setFormData({
      supplierId: suppliers[0]?.id.toString() || '',
      rawMaterialId: materials[0]?.id.toString() || '',
      quantity: '',
      unit: 'kg',
      batchNumber: '',
      expiryDate: '',
      temperature: '',
      isCompliant: true,
      notes: '',
      receivedDate: dayjs().format('YYYY-MM-DD'),
      receivedTime: dayjs().format('HH:mm'),
      vehicleClean: true,
      vehicleTemperature: '',
      packagingIntact: true,
      documentsComplete: true,
    });
    setEditReception(null);
    setIsModalOpen(true);
  };

  const openEditModal = (reception: RawMaterialReception) => {
    setEditReception(reception);
    setFormData({
      supplierId: reception.supplierId.toString(),
      rawMaterialId: reception.rawMaterialId.toString(),
      quantity: reception.quantity.toString(),
      unit: reception.unit,
      batchNumber: reception.batchNumber,
      expiryDate: reception.expiryDate ? dayjs(reception.expiryDate).format('YYYY-MM-DD') : '',
      temperature: reception.temperature?.toString() || '',
      isCompliant: reception.isCompliant,
      notes: reception.notes || '',
      receivedDate: dayjs(reception.receivedAt).format('YYYY-MM-DD'),
      receivedTime: (reception as any).receivedTime || dayjs(reception.receivedAt).format('HH:mm'),
      vehicleClean: (reception as any).vehicleClean ?? true,
      vehicleTemperature: (reception as any).vehicleTemperature?.toString() || '',
      packagingIntact: (reception as any).packagingIntact ?? true,
      documentsComplete: (reception as any).documentsComplete ?? true,
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        supplierId: parseInt(formData.supplierId),
        rawMaterialId: parseInt(formData.rawMaterialId),
        quantity: parseFloat(formData.quantity),
        unit: formData.unit,
        batchNumber: formData.batchNumber,
        expiryDate: formData.expiryDate,
        temperature: formData.temperature ? parseFloat(formData.temperature) : undefined,
        isCompliant: formData.isCompliant,
        notes: formData.notes || undefined,
        receivedDate: formData.receivedDate,
        receivedTime: formData.receivedTime || undefined,
        vehicleClean: formData.vehicleClean,
        vehicleTemperature: formData.vehicleTemperature ? parseFloat(formData.vehicleTemperature) : undefined,
        packagingIntact: formData.packagingIntact,
        documentsComplete: formData.documentsComplete,
      };
      
      if (editReception) {
        await api.updateReception(editReception.id, payload);
        toast.success('Przyjęcie zaktualizowane');
      } else {
        await api.createReception(payload);
        toast.success('Przyjęcie zarejestrowane');
      }
      
      setIsModalOpen(false);
      setEditReception(null);
      loadReceptions();
    } catch (error) {
      toast.error('Błąd podczas zapisywania');
    }
  };

  const handleDelete = async () => {
    if (!deleteModal) return;
    try {
      await api.deleteReception(deleteModal.id);
      toast.success('Przyjęcie usunięte');
      setDeleteModal(null);
      loadReceptions();
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
          <h1 className="text-2xl font-bold text-gray-900">Przyjęcia surowców</h1>
          <p className="text-gray-500 mt-1">Rejestracja i kontrola przyjęć</p>
        </div>
        <button onClick={openModal} className="btn-primary flex items-center gap-2">
          <PlusIcon className="w-5 h-5" />
          Nowe przyjęcie
        </button>
      </div>

      {/* Receptions Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Data</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Surowiec</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Dostawca</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ilość</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nr partii</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Temp.</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                {isAdmin && <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Akcje</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {receptions.map((reception) => (
                <tr key={reception.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm text-gray-900">
                    {dayjs.utc(reception.receivedAt).local().format('DD.MM.YYYY HH:mm')}
                  </td>
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">
                    {reception.rawMaterial?.name}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">
                    {reception.supplier?.name}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900">
                    {reception.quantity} {reception.unit}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">
                    {reception.batchNumber}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900">
                    {reception.temperature ? `${reception.temperature}°C` : '-'}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`badge ${reception.isCompliant ? 'badge-success' : 'badge-danger'}`}>
                      {reception.isCompliant ? 'Zgodne' : 'Niezgodne'}
                    </span>
                  </td>
                  {isAdmin && (
                    <td className="px-4 py-3 text-right space-x-1">
                      <button
                        onClick={() => openEditModal(reception)}
                        className="p-1 text-gray-400 hover:text-blue-600"
                        title="Edytuj"
                      >
                        <PencilIcon className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => setDeleteModal(reception)}
                        className="p-1 text-gray-400 hover:text-red-600"
                        title="Usuń"
                      >
                        <TrashIcon className="w-5 h-5" />
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {receptions.length === 0 && (
        <div className="card text-center py-12">
          <ClipboardDocumentListIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900">Brak przyjęć</h3>
          <p className="text-gray-500 mt-2">Zarejestruj pierwsze przyjęcie surowców.</p>
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen p-4">
            <div className="fixed inset-0 bg-black bg-opacity-30" onClick={() => { setIsModalOpen(false); setEditReception(null); }}></div>
            <div className="relative bg-white rounded-xl shadow-xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">
                {editReception ? 'Edytuj przyjęcie surowca' : 'Nowe przyjęcie surowca'}
              </h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Dostawca *</label>
                    <button
                      type="button"
                      onClick={() => setIsSupplierSelectOpen(true)}
                      className="input w-full text-left hover:bg-gray-50 transition-colors flex items-center justify-between"
                    >
                      <span className={formData.supplierId ? 'text-gray-900' : 'text-gray-400'}>
                        {formData.supplierId 
                          ? `🏢 ${suppliers.find(s => s.id === parseInt(formData.supplierId))?.name}` 
                          : 'Wybierz dostawcę...'}
                      </span>
                      <MagnifyingGlassIcon className="w-4 h-4 text-gray-400" />
                    </button>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Surowiec *</label>
                    <button
                      type="button"
                      onClick={() => setIsMaterialSelectOpen(true)}
                      className="input w-full text-left hover:bg-gray-50 transition-colors flex items-center justify-between"
                    >
                      <span className={formData.rawMaterialId ? 'text-gray-900' : 'text-gray-400'}>
                        {formData.rawMaterialId 
                          ? `🥩 ${materials.find(m => m.id === parseInt(formData.rawMaterialId))?.name}` 
                          : 'Wybierz surowiec...'}
                      </span>
                      <MagnifyingGlassIcon className="w-4 h-4 text-gray-400" />
                    </button>
                  </div>
                </div>

                <div className="grid sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Ilość *</label>
                    <input
                      type="number"
                      step="0.01"
                      className="input"
                      required
                      value={formData.quantity}
                      onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Jednostka</label>
                    <select
                      className="input"
                      value={formData.unit}
                      onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                    >
                      <option value="kg">kg</option>
                      <option value="szt">szt</option>
                      <option value="l">l</option>
                      <option value="opak">opak</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Temperatura (°C)</label>
                    <input
                      type="number"
                      step="0.1"
                      className="input"
                      placeholder="np. 4.5"
                      value={formData.temperature}
                      onChange={(e) => setFormData({ ...formData, temperature: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nr partii dostawcy *</label>
                    <input
                      type="text"
                      className="input"
                      required
                      value={formData.batchNumber}
                      onChange={(e) => setFormData({ ...formData, batchNumber: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Data przyjęcia</label>
                    <input
                      type="date"
                      className="input"
                      value={formData.receivedDate}
                      onChange={(e) => setFormData({ ...formData, receivedDate: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Godzina przyjęcia</label>
                    <input
                      type="time"
                      className="input"
                      value={formData.receivedTime}
                      onChange={(e) => setFormData({ ...formData, receivedTime: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Data ważności *</label>
                    <input
                      type="date"
                      className="input"
                      required
                      value={formData.expiryDate}
                      onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Temp. pojazdu (°C)</label>
                    <input
                      type="number"
                      step="0.1"
                      className="input"
                      placeholder="np. 2.5"
                      value={formData.vehicleTemperature}
                      onChange={(e) => setFormData({ ...formData, vehicleTemperature: e.target.value })}
                    />
                  </div>
                </div>

                {/* Kontrola dostawy */}
                <div className="bg-blue-50 rounded-lg p-4 space-y-3">
                  <h4 className="text-sm font-semibold text-blue-800 flex items-center gap-2">
                    🚚 Kontrola dostawy
                  </h4>
                  <div className="grid sm:grid-cols-2 gap-3">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        className="w-5 h-5 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                        checked={formData.vehicleClean}
                        onChange={(e) => setFormData({ ...formData, vehicleClean: e.target.checked })}
                      />
                      <span className="text-sm text-gray-700">Pojazd czysty</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        className="w-5 h-5 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                        checked={formData.packagingIntact}
                        onChange={(e) => setFormData({ ...formData, packagingIntact: e.target.checked })}
                      />
                      <span className="text-sm text-gray-700">Opakowania nieuszkodzone</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        className="w-5 h-5 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                        checked={formData.documentsComplete}
                        onChange={(e) => setFormData({ ...formData, documentsComplete: e.target.checked })}
                      />
                      <span className="text-sm text-gray-700">Dokumenty kompletne (HDI, WZ)</span>
                    </label>
                  </div>
                </div>

                {/* Status zgodności */}
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      className="w-5 h-5 text-green-600 rounded border-gray-300 focus:ring-green-500"
                      checked={formData.isCompliant}
                      onChange={(e) => setFormData({ ...formData, isCompliant: e.target.checked })}
                    />
                    <span className="text-sm font-medium text-gray-700">Surowiec zgodny z wymaganiami</span>
                  </label>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Uwagi</label>
                  <textarea
                    className="input"
                    rows={2}
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button type="button" onClick={() => { setIsModalOpen(false); setEditReception(null); }} className="flex-1 btn-secondary">
                    Anuluj
                  </button>
                  <button type="submit" className="flex-1 btn-primary">
                    {editReception ? 'Zapisz zmiany' : 'Zarejestruj przyjęcie'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {deleteModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen p-4">
            <div className="fixed inset-0 bg-black bg-opacity-30" onClick={() => setDeleteModal(null)}></div>
            <div className="relative bg-white rounded-xl shadow-xl max-w-md w-full p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Usuń przyjęcie</h2>
              <p className="text-gray-500 mb-4">
                Czy na pewno chcesz usunąć przyjęcie <strong>{deleteModal.rawMaterial?.name}</strong> z dnia {dayjs(deleteModal.receivedAt).format('DD.MM.YYYY')}?
              </p>
              <div className="bg-red-50 rounded-lg p-4 mb-4">
                <p className="text-sm text-red-800">
                  ⚠️ Ta operacja jest nieodwracalna. Wszystkie dane przyjęcia zostaną usunięte.
                </p>
              </div>
              <div className="flex gap-3">
                <button onClick={() => setDeleteModal(null)} className="flex-1 btn-secondary">
                  Anuluj
                </button>
                <button onClick={handleDelete} className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 font-medium">
                  Usuń przyjęcie
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Supplier Select Modal */}
      <SelectModal<Supplier>
        isOpen={isSupplierSelectOpen}
        onClose={() => setIsSupplierSelectOpen(false)}
        onSelect={(supplier) => {
          setFormData({ ...formData, supplierId: supplier.id.toString() });
          setIsSupplierSelectOpen(false);
        }}
        title="🏢 Wybierz dostawcę"
        items={suppliers}
        getItemId={(s) => s.id}
        searchFields={['name', 'address', 'contact'] as any}
        showTimeFilters={false}
        colorScheme="blue"
        emptyMessage="Brak dostawców"
        renderItem={(s) => (
          <div>
            <p className="font-medium text-gray-900">🏢 {s.name}</p>
            <p className="text-sm text-gray-500">
              {s.address && `${s.address} • `}{s.phone || 'Brak kontaktu'}
            </p>
            {s.vetNumber && (
              <p className="text-xs text-gray-400">Nr wet.: {s.vetNumber}</p>
            )}
          </div>
        )}
      />

      {/* Material Select Modal */}
      <SelectModal<RawMaterial>
        isOpen={isMaterialSelectOpen}
        onClose={() => setIsMaterialSelectOpen(false)}
        onSelect={(material) => {
          setFormData({ ...formData, rawMaterialId: material.id.toString(), unit: material.unit });
          setIsMaterialSelectOpen(false);
        }}
        title="🥩 Wybierz surowiec"
        items={materials}
        getItemId={(m) => m.id}
        searchFields={['name', 'category'] as any}
        showTimeFilters={false}
        colorScheme="meat"
        emptyMessage="Brak surowców"
        renderItem={(m) => (
          <div>
            <p className="font-medium text-gray-900">
              {m.category === 'MEAT' ? '🥩' : '📦'} {m.name}
            </p>
            <p className="text-sm text-gray-500">
              {m.category === 'MEAT' ? 'Mięso' : m.category === 'ADDITIVE' ? 'Dodatek' : 'Inne'} • {m.unit}
            </p>
          </div>
        )}
      />
    </div>
  );
}
