import { useState, useEffect } from 'react';
import api from '../services/api';
import {
  TrashIcon,
  PlusIcon,
  PencilIcon,
  TruckIcon,
  BuildingOfficeIcon,
  ScaleIcon,
  FunnelIcon,
  Cog6ToothIcon,
  DocumentTextIcon,
  ArchiveBoxXMarkIcon,
} from '@heroicons/react/24/outline';

interface WasteType {
  id: number;
  name: string;
  category: string;
  code: string | null;
  description: string | null;
  unit: string;
  isActive: boolean;
  _count?: { wasteRecords: number };
}

interface WasteCollector {
  id: number;
  name: string;
  address: string | null;
  phone: string | null;
  email: string | null;
  vetNumber: string | null;
  contractNumber: string | null;
  contactPerson: string | null;
  isActive: boolean;
  _count?: { wasteRecords: number };
}

interface WasteRecord {
  id: number;
  wasteTypeId: number;
  collectorId: number | null;
  quantity: number;
  unit: string;
  collectionDate: string;
  documentNumber: string | null;
  vehicleNumber: string | null;
  driverName: string | null;
  notes: string | null;
  wasteType: WasteType;
  collector: WasteCollector | null;
}

export default function Waste() {
  const [records, setRecords] = useState<WasteRecord[]>([]);
  const [wasteTypes, setWasteTypes] = useState<WasteType[]>([]);
  const [collectors, setCollectors] = useState<WasteCollector[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'records' | 'types' | 'collectors'>('records');
  
  const [showRecordModal, setShowRecordModal] = useState(false);
  const [showTypeModal, setShowTypeModal] = useState(false);
  const [showCollectorModal, setShowCollectorModal] = useState(false);
  
  const [editingRecord, setEditingRecord] = useState<WasteRecord | null>(null);
  const [editingType, setEditingType] = useState<WasteType | null>(null);
  const [editingCollector, setEditingCollector] = useState<WasteCollector | null>(null);
  
  const [filterCollector, setFilterCollector] = useState('');

  const [recordFormData, setRecordFormData] = useState({
    wasteTypeId: '',
    collectorId: '',
    quantity: '',
    unit: 'kg',
    collectionDate: new Date().toISOString().split('T')[0],
    documentNumber: '',
    vehicleNumber: '',
    driverName: '',
    notes: '',
  });

  const [typeFormData, setTypeFormData] = useState({
    name: '',
    category: 'KATEGORIA_3',
    code: '02 02 02',
    description: '',
    unit: 'kg',
  });

  const [collectorFormData, setCollectorFormData] = useState({
    name: '',
    address: '',
    phone: '',
    email: '',
    vetNumber: '',
    contractNumber: '',
    contactPerson: '',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [recordsRes, typesRes, collectorsRes] = await Promise.all([
        api.getWasteRecords(),
        api.getWasteTypes(),
        api.getWasteCollectors(),
      ]);
      setRecords(recordsRes);
      setWasteTypes(typesRes);
      setCollectors(collectorsRes);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Record handlers
  const handleRecordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        ...recordFormData,
        collectorId: recordFormData.collectorId || null,
      };
      if (editingRecord) {
        await api.updateWasteRecord(editingRecord.id, payload);
      } else {
        await api.createWasteRecord(payload);
      }
      setShowRecordModal(false);
      resetRecordForm();
      fetchData();
    } catch (error) {
      console.error('Error saving record:', error);
    }
  };

  const handleDeleteRecord = async (id: number) => {
    if (!confirm('Czy na pewno chcesz usunąć ten wpis?')) return;
    try {
      await api.deleteWasteRecord(id);
      fetchData();
    } catch (error) {
      console.error('Error deleting record:', error);
    }
  };

  const openEditRecordModal = (record: WasteRecord) => {
    setEditingRecord(record);
    setRecordFormData({
      wasteTypeId: record.wasteTypeId.toString(),
      collectorId: record.collectorId?.toString() || '',
      quantity: record.quantity.toString(),
      unit: record.unit,
      collectionDate: record.collectionDate.split('T')[0],
      documentNumber: record.documentNumber || '',
      vehicleNumber: record.vehicleNumber || '',
      driverName: record.driverName || '',
      notes: record.notes || '',
    });
    setShowRecordModal(true);
  };

  const resetRecordForm = () => {
    setEditingRecord(null);
    setRecordFormData({
      wasteTypeId: '',
      collectorId: '',
      quantity: '',
      unit: 'kg',
      collectionDate: new Date().toISOString().split('T')[0],
      documentNumber: '',
      vehicleNumber: '',
      driverName: '',
      notes: '',
    });
  };

  // Type handlers
  const handleTypeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingType) {
        await api.updateWasteType(editingType.id, typeFormData);
      } else {
        await api.createWasteType(typeFormData);
      }
      setShowTypeModal(false);
      resetTypeForm();
      fetchData();
    } catch (error) {
      console.error('Error saving type:', error);
    }
  };

  const handleDeleteType = async (id: number) => {
    if (!confirm('Czy na pewno chcesz usunąć ten typ odpadu?')) return;
    try {
      await api.deleteWasteType(id);
      fetchData();
    } catch (error) {
      console.error('Error deleting type:', error);
    }
  };

  const openEditTypeModal = (type: WasteType) => {
    setEditingType(type);
    setTypeFormData({
      name: type.name,
      category: type.category,
      code: type.code || '',
      description: type.description || '',
      unit: type.unit,
    });
    setShowTypeModal(true);
  };

  const resetTypeForm = () => {
    setEditingType(null);
    setTypeFormData({
      name: '',
      category: 'KATEGORIA_3',
      code: '',
      description: '',
      unit: 'kg',
    });
  };

  // Collector handlers
  const handleCollectorSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingCollector) {
        await api.updateWasteCollector(editingCollector.id, collectorFormData);
      } else {
        await api.createWasteCollector(collectorFormData);
      }
      setShowCollectorModal(false);
      resetCollectorForm();
      fetchData();
    } catch (error) {
      console.error('Error saving collector:', error);
    }
  };

  const handleDeleteCollector = async (id: number) => {
    if (!confirm('Czy na pewno chcesz usunąć tę firmę?')) return;
    try {
      await api.deleteWasteCollector(id);
      fetchData();
    } catch (error) {
      console.error('Error deleting collector:', error);
    }
  };

  const openEditCollectorModal = (collector: WasteCollector) => {
    setEditingCollector(collector);
    setCollectorFormData({
      name: collector.name,
      address: collector.address || '',
      phone: collector.phone || '',
      email: collector.email || '',
      vetNumber: collector.vetNumber || '',
      contractNumber: collector.contractNumber || '',
      contactPerson: collector.contactPerson || '',
    });
    setShowCollectorModal(true);
  };

  const resetCollectorForm = () => {
    setEditingCollector(null);
    setCollectorFormData({
      name: '',
      address: '',
      phone: '',
      email: '',
      vetNumber: '',
      contractNumber: '',
      contactPerson: '',
    });
  };

  const filteredRecords = records.filter(record => {
    if (filterCollector && record.collectorId?.toString() !== filterCollector) return false;
    return true;
  });

  const activeTypes = wasteTypes.filter(t => t.isActive);
  const activeCollectors = collectors.filter(c => c.isActive);

  // Statystyki
  const totalQuantity = records.reduce((sum, r) => sum + r.quantity, 0);
  const thisMonthRecords = records.filter(r => {
    const date = new Date(r.collectionDate);
    const now = new Date();
    return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
  });
  const thisMonthQuantity = thisMonthRecords.reduce((sum, r) => sum + r.quantity, 0);
  const collectionsCount = records.length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-meat-600 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Ewidencja odpadów</h1>
          <p className="text-gray-600">Odpady porozbiorowe i poprodukcyjne (Kategoria 3)</p>
        </div>
      </div>

      {/* Statystyki */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <ScaleIcon className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Łącznie</p>
              <p className="text-2xl font-bold text-gray-900">{totalQuantity.toFixed(0)} kg</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <ArchiveBoxXMarkIcon className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Ten miesiąc</p>
              <p className="text-2xl font-bold text-gray-900">{thisMonthQuantity.toFixed(0)} kg</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <TruckIcon className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Liczba odbiorów</p>
              <p className="text-2xl font-bold text-gray-900">{collectionsCount}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-100 rounded-lg">
              <BuildingOfficeIcon className="h-6 w-6 text-orange-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Firmy odbierające</p>
              <p className="text-2xl font-bold text-gray-900">{activeCollectors.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('records')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'records'
                ? 'border-meat-500 text-meat-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <DocumentTextIcon className="h-5 w-5 inline mr-2" />
            Ewidencja
          </button>
          <button
            onClick={() => setActiveTab('types')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'types'
                ? 'border-meat-500 text-meat-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Cog6ToothIcon className="h-5 w-5 inline mr-2" />
            Rodzaje odpadów
          </button>
          <button
            onClick={() => setActiveTab('collectors')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'collectors'
                ? 'border-meat-500 text-meat-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <BuildingOfficeIcon className="h-5 w-5 inline mr-2" />
            Firmy odbierające
          </button>
        </nav>
      </div>

      {/* Tab: Ewidencja */}
      {activeTab === 'records' && (
        <>
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="flex flex-wrap gap-2 items-center">
              <FunnelIcon className="h-5 w-5 text-gray-400" />
              <select
                value={filterCollector}
                onChange={(e) => setFilterCollector(e.target.value)}
                className="rounded-md border-gray-300 text-sm"
              >
                <option value="">Wszystkie firmy</option>
                {collectors.map(col => (
                  <option key={col.id} value={col.id}>{col.name}</option>
                ))}
              </select>
            </div>
            <button
              onClick={() => { resetRecordForm(); setShowRecordModal(true); }}
              className="inline-flex items-center gap-2 bg-meat-600 text-white px-4 py-2 rounded-lg hover:bg-meat-700"
            >
              <PlusIcon className="h-5 w-5" />
              Dodaj wpis
            </button>
          </div>

          <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Data odbioru</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rodzaj odpadu</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ilość</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Firma odbierająca</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nr dokumentu</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Pojazd</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Akcje</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredRecords.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                        Brak wpisów do wyświetlenia
                      </td>
                    </tr>
                  ) : (
                    filteredRecords.map((record) => (
                      <tr key={record.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {new Date(record.collectionDate).toLocaleDateString('pl-PL')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <p className="text-sm font-medium text-gray-900">{record.wasteType.name}</p>
                            <span className="inline-block px-2 py-0.5 text-xs rounded-full mt-1 bg-green-100 text-green-800">
                              Kategoria 3
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {record.quantity} {record.unit}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {record.collector?.name || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {record.documentNumber || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {record.vehicleNumber || '-'}
                          {record.driverName && <span className="block text-xs text-gray-400">{record.driverName}</span>}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button
                            onClick={() => openEditRecordModal(record)}
                            className="text-meat-600 hover:text-meat-900 mr-3"
                          >
                            <PencilIcon className="h-5 w-5" />
                          </button>
                          <button
                            onClick={() => handleDeleteRecord(record.id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            <TrashIcon className="h-5 w-5" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Tab: Rodzaje odpadów */}
      {activeTab === 'types' && (
        <>
          <div className="flex justify-end">
            <button
              onClick={() => { resetTypeForm(); setShowTypeModal(true); }}
              className="inline-flex items-center gap-2 bg-meat-600 text-white px-4 py-2 rounded-lg hover:bg-meat-700"
            >
              <PlusIcon className="h-5 w-5" />
              Dodaj rodzaj
            </button>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {wasteTypes.map((type) => (
              <div key={type.id} className={`bg-white shadow rounded-lg p-4 ${!type.isActive ? 'opacity-60' : ''}`}>
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="font-medium text-gray-900">{type.name}</h3>
                    <span className="inline-block px-2 py-0.5 text-xs rounded-full mt-1 bg-green-100 text-green-800">
                      Kategoria 3
                    </span>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => openEditTypeModal(type)} className="text-gray-400 hover:text-meat-600">
                      <PencilIcon className="h-4 w-4" />
                    </button>
                    <button onClick={() => handleDeleteType(type.id)} className="text-gray-400 hover:text-red-600">
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                {type.code && <p className="text-sm text-gray-500">Kod: {type.code}</p>}
                <p className="text-sm text-gray-500">Jednostka: {type.unit}</p>
                {type.description && <p className="text-sm text-gray-400 mt-1">{type.description}</p>}
                {type._count && <p className="text-xs text-gray-400 mt-2">Wpisów: {type._count.wasteRecords}</p>}
              </div>
            ))}
          </div>
        </>
      )}

      {/* Tab: Firmy odbierające */}
      {activeTab === 'collectors' && (
        <>
          <div className="flex justify-end">
            <button
              onClick={() => { resetCollectorForm(); setShowCollectorModal(true); }}
              className="inline-flex items-center gap-2 bg-meat-600 text-white px-4 py-2 rounded-lg hover:bg-meat-700"
            >
              <PlusIcon className="h-5 w-5" />
              Dodaj firmę
            </button>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {collectors.map((collector) => (
              <div key={collector.id} className={`bg-white shadow rounded-lg p-4 ${!collector.isActive ? 'opacity-60' : ''}`}>
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-gray-100 rounded-lg">
                      <TruckIcon className="h-6 w-6 text-gray-600" />
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">{collector.name}</h3>
                      {collector.vetNumber && <p className="text-xs text-gray-500">Nr wet.: {collector.vetNumber}</p>}
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => openEditCollectorModal(collector)} className="text-gray-400 hover:text-meat-600">
                      <PencilIcon className="h-4 w-4" />
                    </button>
                    <button onClick={() => handleDeleteCollector(collector.id)} className="text-gray-400 hover:text-red-600">
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                {collector.address && <p className="text-sm text-gray-500">{collector.address}</p>}
                {collector.phone && <p className="text-sm text-gray-500">Tel: {collector.phone}</p>}
                {collector.email && <p className="text-sm text-gray-500">Email: {collector.email}</p>}
                {collector.contractNumber && <p className="text-sm text-gray-500">Nr umowy: {collector.contractNumber}</p>}
                {collector.contactPerson && <p className="text-sm text-gray-500">Kontakt: {collector.contactPerson}</p>}
                {collector._count && <p className="text-xs text-gray-400 mt-2">Odbiorów: {collector._count.wasteRecords}</p>}
              </div>
            ))}
          </div>
        </>
      )}

      {/* Modal - Wpis odpadu */}
      {showRecordModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-xl font-bold mb-4">
                {editingRecord ? 'Edytuj wpis' : 'Dodaj nowy wpis'}
              </h2>
              <form onSubmit={handleRecordSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Rodzaj odpadu *</label>
                  <select
                    value={recordFormData.wasteTypeId}
                    onChange={(e) => setRecordFormData({ ...recordFormData, wasteTypeId: e.target.value })}
                    className="w-full rounded-md border-gray-300"
                    required
                  >
                    <option value="">Wybierz rodzaj</option>
                    {activeTypes.map((type) => (
                      <option key={type.id} value={type.id}>
                        {type.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Ilość *</label>
                    <input
                      type="number"
                      step="0.1"
                      value={recordFormData.quantity}
                      onChange={(e) => setRecordFormData({ ...recordFormData, quantity: e.target.value })}
                      className="w-full rounded-md border-gray-300"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Jednostka</label>
                    <select
                      value={recordFormData.unit}
                      onChange={(e) => setRecordFormData({ ...recordFormData, unit: e.target.value })}
                      className="w-full rounded-md border-gray-300"
                    >
                      <option value="kg">kg</option>
                      <option value="t">t</option>
                      <option value="szt">szt</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Data odbioru *</label>
                  <input
                    type="date"
                    value={recordFormData.collectionDate}
                    onChange={(e) => setRecordFormData({ ...recordFormData, collectionDate: e.target.value })}
                    className="w-full rounded-md border-gray-300"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Firma odbierająca</label>
                  <select
                    value={recordFormData.collectorId}
                    onChange={(e) => setRecordFormData({ ...recordFormData, collectorId: e.target.value })}
                    className="w-full rounded-md border-gray-300"
                  >
                    <option value="">Wybierz firmę</option>
                    {activeCollectors.map((col) => (
                      <option key={col.id} value={col.id}>{col.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nr dokumentu/WZ</label>
                  <input
                    type="text"
                    value={recordFormData.documentNumber}
                    onChange={(e) => setRecordFormData({ ...recordFormData, documentNumber: e.target.value })}
                    className="w-full rounded-md border-gray-300"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nr rejestracyjny pojazdu</label>
                    <input
                      type="text"
                      value={recordFormData.vehicleNumber}
                      onChange={(e) => setRecordFormData({ ...recordFormData, vehicleNumber: e.target.value })}
                      className="w-full rounded-md border-gray-300"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Kierowca</label>
                    <input
                      type="text"
                      value={recordFormData.driverName}
                      onChange={(e) => setRecordFormData({ ...recordFormData, driverName: e.target.value })}
                      className="w-full rounded-md border-gray-300"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Uwagi</label>
                  <textarea
                    value={recordFormData.notes}
                    onChange={(e) => setRecordFormData({ ...recordFormData, notes: e.target.value })}
                    className="w-full rounded-md border-gray-300"
                    rows={2}
                  />
                </div>
                <div className="flex justify-end gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowRecordModal(false)}
                    className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                  >
                    Anuluj
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-meat-600 text-white rounded-lg hover:bg-meat-700"
                  >
                    {editingRecord ? 'Zapisz zmiany' : 'Dodaj wpis'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Modal - Rodzaj odpadu */}
      {showTypeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-xl font-bold mb-4">
                {editingType ? 'Edytuj rodzaj odpadu' : 'Dodaj rodzaj odpadu'}
              </h2>
              <form onSubmit={handleTypeSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nazwa *</label>
                  <input
                    type="text"
                    value={typeFormData.name}
                    onChange={(e) => setTypeFormData({ ...typeFormData, name: e.target.value })}
                    className="w-full rounded-md border-gray-300"
                    placeholder="np. Kości, Tłuszcz, Skóry"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Kategoria</label>
                  <div className="px-3 py-2 bg-green-50 border border-green-200 rounded-md text-green-800">
                    Kategoria 3 - Odpady porozbiorowe i poprodukcyjne
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Kod odpadu</label>
                    <input
                      type="text"
                      value={typeFormData.code}
                      onChange={(e) => setTypeFormData({ ...typeFormData, code: e.target.value })}
                      className="w-full rounded-md border-gray-300"
                      placeholder="np. 02 02 02"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Jednostka</label>
                    <select
                      value={typeFormData.unit}
                      onChange={(e) => setTypeFormData({ ...typeFormData, unit: e.target.value })}
                      className="w-full rounded-md border-gray-300"
                    >
                      <option value="kg">kg</option>
                      <option value="t">t</option>
                      <option value="szt">szt</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Opis</label>
                  <textarea
                    value={typeFormData.description}
                    onChange={(e) => setTypeFormData({ ...typeFormData, description: e.target.value })}
                    className="w-full rounded-md border-gray-300"
                    rows={2}
                  />
                </div>
                <div className="flex justify-end gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowTypeModal(false)}
                    className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                  >
                    Anuluj
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-meat-600 text-white rounded-lg hover:bg-meat-700"
                  >
                    {editingType ? 'Zapisz zmiany' : 'Dodaj rodzaj'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Modal - Firma odbierająca */}
      {showCollectorModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-xl font-bold mb-4">
                {editingCollector ? 'Edytuj firmę' : 'Dodaj firmę odbierającą'}
              </h2>
              <form onSubmit={handleCollectorSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nazwa firmy *</label>
                  <input
                    type="text"
                    value={collectorFormData.name}
                    onChange={(e) => setCollectorFormData({ ...collectorFormData, name: e.target.value })}
                    className="w-full rounded-md border-gray-300"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Adres</label>
                  <input
                    type="text"
                    value={collectorFormData.address}
                    onChange={(e) => setCollectorFormData({ ...collectorFormData, address: e.target.value })}
                    className="w-full rounded-md border-gray-300"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Telefon</label>
                    <input
                      type="text"
                      value={collectorFormData.phone}
                      onChange={(e) => setCollectorFormData({ ...collectorFormData, phone: e.target.value })}
                      className="w-full rounded-md border-gray-300"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <input
                      type="email"
                      value={collectorFormData.email}
                      onChange={(e) => setCollectorFormData({ ...collectorFormData, email: e.target.value })}
                      className="w-full rounded-md border-gray-300"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nr weterynaryjny / zezwolenia</label>
                    <input
                      type="text"
                      value={collectorFormData.vetNumber}
                      onChange={(e) => setCollectorFormData({ ...collectorFormData, vetNumber: e.target.value })}
                      className="w-full rounded-md border-gray-300"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nr umowy</label>
                    <input
                      type="text"
                      value={collectorFormData.contractNumber}
                      onChange={(e) => setCollectorFormData({ ...collectorFormData, contractNumber: e.target.value })}
                      className="w-full rounded-md border-gray-300"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Osoba kontaktowa</label>
                  <input
                    type="text"
                    value={collectorFormData.contactPerson}
                    onChange={(e) => setCollectorFormData({ ...collectorFormData, contactPerson: e.target.value })}
                    className="w-full rounded-md border-gray-300"
                  />
                </div>
                <div className="flex justify-end gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowCollectorModal(false)}
                    className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                  >
                    Anuluj
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-meat-600 text-white rounded-lg hover:bg-meat-700"
                  >
                    {editingCollector ? 'Zapisz zmiany' : 'Dodaj firmę'}
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
