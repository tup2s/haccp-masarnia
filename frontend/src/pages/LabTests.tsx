import { useState, useEffect } from 'react';
import api from '../services/api';
import {
  BeakerIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  FunnelIcon,
  DocumentTextIcon,
  Cog6ToothIcon,
} from '@heroicons/react/24/outline';

interface LabTestType {
  id: number;
  name: string;
  category: string;
  unit: string | null;
  normMin: number | null;
  normMax: number | null;
  normText: string | null;
  frequency: string | null;
  description: string | null;
  isActive: boolean;
  _count?: { labTests: number };
}

interface LabTest {
  id: number;
  labTestTypeId: number;
  sampleDate: string;
  resultDate: string | null;
  sampleSource: string | null;
  sampleBatchId: string | null;
  result: string | null;
  resultValue: number | null;
  isCompliant: boolean | null;
  laboratory: string | null;
  documentNumber: string | null;
  notes: string | null;
  labTestType: LabTestType;
}

const CATEGORIES = [
  { value: 'MIKROBIOLOGICZNE', label: 'Mikrobiologiczne', color: 'bg-purple-100 text-purple-800' },
  { value: 'FIZYKOCHEMICZNE', label: 'Fizykochemiczne', color: 'bg-blue-100 text-blue-800' },
  { value: 'TRWAŁOŚĆ', label: 'Trwałość', color: 'bg-orange-100 text-orange-800' },
  { value: 'SMOLISTOŚĆ', label: 'Smolistość (WWA)', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'WYMAZY', label: 'Wymazy powierzchniowe', color: 'bg-green-100 text-green-800' },
];

export default function LabTests() {
  const [tests, setTests] = useState<LabTest[]>([]);
  const [testTypes, setTestTypes] = useState<LabTestType[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showTypeModal, setShowTypeModal] = useState(false);
  const [editingTest, setEditingTest] = useState<LabTest | null>(null);
  const [editingType, setEditingType] = useState<LabTestType | null>(null);
  const [activeTab, setActiveTab] = useState<'tests' | 'types'>('tests');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterCompliant, setFilterCompliant] = useState('');

  const [formData, setFormData] = useState({
    labTestTypeId: '',
    sampleDate: new Date().toISOString().split('T')[0],
    resultDate: '',
    sampleSource: '',
    sampleBatchId: '',
    result: '',
    resultValue: '',
    isCompliant: '',
    laboratory: '',
    documentNumber: '',
    notes: '',
  });

  const [typeFormData, setTypeFormData] = useState({
    name: '',
    category: 'MIKROBIOLOGICZNE',
    unit: '',
    normMin: '',
    normMax: '',
    normText: '',
    frequency: '',
    description: '',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [testsRes, typesRes] = await Promise.all([
        api.getLabTests(),
        api.getLabTestTypes(),
      ]);
      setTests(testsRes);
      setTestTypes(typesRes);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        isCompliant: formData.isCompliant === '' ? null : formData.isCompliant === 'true',
      };

      if (editingTest) {
        await api.updateLabTest(editingTest.id, payload);
      } else {
        await api.createLabTest(payload);
      }
      setShowModal(false);
      resetForm();
      fetchData();
    } catch (error) {
      console.error('Error saving test:', error);
    }
  };

  const handleTypeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingType) {
        await api.updateLabTestType(editingType.id, typeFormData);
      } else {
        await api.createLabTestType(typeFormData);
      }
      setShowTypeModal(false);
      resetTypeForm();
      fetchData();
    } catch (error) {
      console.error('Error saving test type:', error);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Czy na pewno chcesz usunąć to badanie?')) return;
    try {
      await api.deleteLabTest(id);
      fetchData();
    } catch (error) {
      console.error('Error deleting test:', error);
    }
  };

  const handleDeleteType = async (id: number) => {
    if (!confirm('Czy na pewno chcesz usunąć ten typ badania?')) return;
    try {
      await api.deleteLabTestType(id);
      fetchData();
    } catch (error) {
      console.error('Error deleting test type:', error);
    }
  };

  const openEditModal = (test: LabTest) => {
    setEditingTest(test);
    setFormData({
      labTestTypeId: test.labTestTypeId.toString(),
      sampleDate: test.sampleDate.split('T')[0],
      resultDate: test.resultDate ? test.resultDate.split('T')[0] : '',
      sampleSource: test.sampleSource || '',
      sampleBatchId: test.sampleBatchId || '',
      result: test.result || '',
      resultValue: test.resultValue?.toString() || '',
      isCompliant: test.isCompliant === null ? '' : test.isCompliant.toString(),
      laboratory: test.laboratory || '',
      documentNumber: test.documentNumber || '',
      notes: test.notes || '',
    });
    setShowModal(true);
  };

  const openEditTypeModal = (type: LabTestType) => {
    setEditingType(type);
    setTypeFormData({
      name: type.name,
      category: type.category,
      unit: type.unit || '',
      normMin: type.normMin?.toString() || '',
      normMax: type.normMax?.toString() || '',
      normText: type.normText || '',
      frequency: type.frequency || '',
      description: type.description || '',
    });
    setShowTypeModal(true);
  };

  const resetForm = () => {
    setEditingTest(null);
    setFormData({
      labTestTypeId: '',
      sampleDate: new Date().toISOString().split('T')[0],
      resultDate: '',
      sampleSource: '',
      sampleBatchId: '',
      result: '',
      resultValue: '',
      isCompliant: '',
      laboratory: '',
      documentNumber: '',
      notes: '',
    });
  };

  const resetTypeForm = () => {
    setEditingType(null);
    setTypeFormData({
      name: '',
      category: 'MIKROBIOLOGICZNE',
      unit: '',
      normMin: '',
      normMax: '',
      normText: '',
      frequency: '',
      description: '',
    });
  };

  const getCategoryColor = (category: string) => {
    return CATEGORIES.find(c => c.value === category)?.color || 'bg-gray-100 text-gray-800';
  };

  const getCategoryLabel = (category: string) => {
    return CATEGORIES.find(c => c.value === category)?.label || category;
  };

  const filteredTests = tests.filter(test => {
    if (filterCategory && test.labTestType.category !== filterCategory) return false;
    if (filterCompliant === 'true' && test.isCompliant !== true) return false;
    if (filterCompliant === 'false' && test.isCompliant !== false) return false;
    if (filterCompliant === 'pending' && test.isCompliant !== null) return false;
    return true;
  });

  const activeTypes = testTypes.filter(t => t.isActive);

  // Statystyki
  const totalTests = tests.length;
  const compliantTests = tests.filter(t => t.isCompliant === true).length;
  const nonCompliantTests = tests.filter(t => t.isCompliant === false).length;
  const pendingTests = tests.filter(t => t.isCompliant === null).length;

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
          <h1 className="text-2xl font-bold text-gray-900">Badania laboratoryjne</h1>
          <p className="text-gray-600">Harmonogram i wyniki badań</p>
        </div>
      </div>

      {/* Statystyki */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <BeakerIcon className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Wszystkie badania</p>
              <p className="text-2xl font-bold text-gray-900">{totalTests}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircleIcon className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Zgodne</p>
              <p className="text-2xl font-bold text-green-600">{compliantTests}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 rounded-lg">
              <XCircleIcon className="h-6 w-6 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Niezgodne</p>
              <p className="text-2xl font-bold text-red-600">{nonCompliantTests}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <ClockIcon className="h-6 w-6 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Oczekujące</p>
              <p className="text-2xl font-bold text-yellow-600">{pendingTests}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('tests')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'tests'
                ? 'border-meat-500 text-meat-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <DocumentTextIcon className="h-5 w-5 inline mr-2" />
            Wyniki badań
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
            Typy badań
          </button>
        </nav>
      </div>

      {activeTab === 'tests' && (
        <>
          {/* Filtry i przycisk dodawania */}
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="flex flex-wrap gap-2 items-center">
              <FunnelIcon className="h-5 w-5 text-gray-400" />
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="rounded-md border-gray-300 text-sm"
              >
                <option value="">Wszystkie kategorie</option>
                {CATEGORIES.map(cat => (
                  <option key={cat.value} value={cat.value}>{cat.label}</option>
                ))}
              </select>
              <select
                value={filterCompliant}
                onChange={(e) => setFilterCompliant(e.target.value)}
                className="rounded-md border-gray-300 text-sm"
              >
                <option value="">Wszystkie wyniki</option>
                <option value="true">Zgodne</option>
                <option value="false">Niezgodne</option>
                <option value="pending">Oczekujące</option>
              </select>
            </div>
            <button
              onClick={() => { resetForm(); setShowModal(true); }}
              className="inline-flex items-center gap-2 bg-meat-600 text-white px-4 py-2 rounded-lg hover:bg-meat-700"
            >
              <PlusIcon className="h-5 w-5" />
              Dodaj badanie
            </button>
          </div>

          {/* Tabela wyników */}
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Data próbki</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rodzaj badania</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Źródło próbki</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Wynik</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Laboratorium</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Akcje</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredTests.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                        Brak badań do wyświetlenia
                      </td>
                    </tr>
                  ) : (
                    filteredTests.map((test) => (
                      <tr key={test.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {new Date(test.sampleDate).toLocaleDateString('pl-PL')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <p className="text-sm font-medium text-gray-900">{test.labTestType.name}</p>
                            <span className={`inline-block px-2 py-0.5 text-xs rounded-full mt-1 ${getCategoryColor(test.labTestType.category)}`}>
                              {getCategoryLabel(test.labTestType.category)}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {test.sampleSource || '-'}
                          {test.sampleBatchId && <span className="block text-xs text-gray-400">Partia: {test.sampleBatchId}</span>}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          {test.result || test.resultValue?.toString() || '-'}
                          {test.labTestType.unit && test.resultValue && <span className="text-gray-400 ml-1">{test.labTestType.unit}</span>}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {test.isCompliant === true && (
                            <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                              <CheckCircleIcon className="h-4 w-4" /> Zgodny
                            </span>
                          )}
                          {test.isCompliant === false && (
                            <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800">
                              <XCircleIcon className="h-4 w-4" /> Niezgodny
                            </span>
                          )}
                          {test.isCompliant === null && (
                            <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800">
                              <ClockIcon className="h-4 w-4" /> Oczekuje
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {test.laboratory || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button
                            onClick={() => openEditModal(test)}
                            className="text-meat-600 hover:text-meat-900 mr-3"
                          >
                            <PencilIcon className="h-5 w-5" />
                          </button>
                          <button
                            onClick={() => handleDelete(test.id)}
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

      {activeTab === 'types' && (
        <>
          <div className="flex justify-end">
            <button
              onClick={() => { resetTypeForm(); setShowTypeModal(true); }}
              className="inline-flex items-center gap-2 bg-meat-600 text-white px-4 py-2 rounded-lg hover:bg-meat-700"
            >
              <PlusIcon className="h-5 w-5" />
              Dodaj typ badania
            </button>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {testTypes.map((type) => (
              <div key={type.id} className={`bg-white shadow rounded-lg p-4 ${!type.isActive ? 'opacity-60' : ''}`}>
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="font-medium text-gray-900">{type.name}</h3>
                    <span className={`inline-block px-2 py-0.5 text-xs rounded-full mt-1 ${getCategoryColor(type.category)}`}>
                      {getCategoryLabel(type.category)}
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
                {type.unit && <p className="text-sm text-gray-500">Jednostka: {type.unit}</p>}
                {type.normText && <p className="text-sm text-gray-500">Norma: {type.normText}</p>}
                {(type.normMin !== null || type.normMax !== null) && (
                  <p className="text-sm text-gray-500">
                    Zakres: {type.normMin ?? '-'} - {type.normMax ?? '-'} {type.unit}
                  </p>
                )}
                {type.frequency && <p className="text-sm text-gray-500">Częstotliwość: {type.frequency}</p>}
                {type._count && <p className="text-xs text-gray-400 mt-2">Wykonanych badań: {type._count.labTests}</p>}
              </div>
            ))}
          </div>
        </>
      )}

      {/* Modal dodawania/edycji badania */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-xl font-bold mb-4">
                {editingTest ? 'Edytuj badanie' : 'Dodaj nowe badanie'}
              </h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Rodzaj badania *</label>
                    <select
                      value={formData.labTestTypeId}
                      onChange={(e) => setFormData({ ...formData, labTestTypeId: e.target.value })}
                      className="w-full rounded-md border-gray-300"
                      required
                    >
                      <option value="">Wybierz rodzaj badania</option>
                      {activeTypes.map((type) => (
                        <option key={type.id} value={type.id}>
                          {type.name} ({getCategoryLabel(type.category)})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Data pobrania próbki *</label>
                    <input
                      type="date"
                      value={formData.sampleDate}
                      onChange={(e) => setFormData({ ...formData, sampleDate: e.target.value })}
                      className="w-full rounded-md border-gray-300"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Data wyniku</label>
                    <input
                      type="date"
                      value={formData.resultDate}
                      onChange={(e) => setFormData({ ...formData, resultDate: e.target.value })}
                      className="w-full rounded-md border-gray-300"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Źródło próbki</label>
                    <input
                      type="text"
                      value={formData.sampleSource}
                      onChange={(e) => setFormData({ ...formData, sampleSource: e.target.value })}
                      className="w-full rounded-md border-gray-300"
                      placeholder="np. Kiełbasa krakowska"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nr partii próbki</label>
                    <input
                      type="text"
                      value={formData.sampleBatchId}
                      onChange={(e) => setFormData({ ...formData, sampleBatchId: e.target.value })}
                      className="w-full rounded-md border-gray-300"
                      placeholder="np. KB-2024-001"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Wynik (tekstowy)</label>
                    <input
                      type="text"
                      value={formData.result}
                      onChange={(e) => setFormData({ ...formData, result: e.target.value })}
                      className="w-full rounded-md border-gray-300"
                      placeholder="np. nieobecne w 25g"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Wynik (liczbowy)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.resultValue}
                      onChange={(e) => setFormData({ ...formData, resultValue: e.target.value })}
                      className="w-full rounded-md border-gray-300"
                      placeholder="np. 15.5"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Status zgodności</label>
                    <select
                      value={formData.isCompliant}
                      onChange={(e) => setFormData({ ...formData, isCompliant: e.target.value })}
                      className="w-full rounded-md border-gray-300"
                    >
                      <option value="">Oczekuje na wynik</option>
                      <option value="true">Zgodny z normą</option>
                      <option value="false">Niezgodny z normą</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Laboratorium</label>
                    <input
                      type="text"
                      value={formData.laboratory}
                      onChange={(e) => setFormData({ ...formData, laboratory: e.target.value })}
                      className="w-full rounded-md border-gray-300"
                      placeholder="Nazwa laboratorium"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nr dokumentu/sprawozdania</label>
                    <input
                      type="text"
                      value={formData.documentNumber}
                      onChange={(e) => setFormData({ ...formData, documentNumber: e.target.value })}
                      className="w-full rounded-md border-gray-300"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Uwagi</label>
                    <textarea
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      className="w-full rounded-md border-gray-300"
                      rows={2}
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                  >
                    Anuluj
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-meat-600 text-white rounded-lg hover:bg-meat-700"
                  >
                    {editingTest ? 'Zapisz zmiany' : 'Dodaj badanie'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Modal dodawania/edycji typu badania */}
      {showTypeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-xl font-bold mb-4">
                {editingType ? 'Edytuj typ badania' : 'Dodaj nowy typ badania'}
              </h2>
              <form onSubmit={handleTypeSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nazwa badania *</label>
                  <input
                    type="text"
                    value={typeFormData.name}
                    onChange={(e) => setTypeFormData({ ...typeFormData, name: e.target.value })}
                    className="w-full rounded-md border-gray-300"
                    placeholder="np. Salmonella, Zawartość białka"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Kategoria *</label>
                  <select
                    value={typeFormData.category}
                    onChange={(e) => setTypeFormData({ ...typeFormData, category: e.target.value })}
                    className="w-full rounded-md border-gray-300"
                    required
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat.value} value={cat.value}>{cat.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Jednostka</label>
                  <input
                    type="text"
                    value={typeFormData.unit}
                    onChange={(e) => setTypeFormData({ ...typeFormData, unit: e.target.value })}
                    className="w-full rounded-md border-gray-300"
                    placeholder="np. CFU/g, %, mg/kg"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Norma min</label>
                    <input
                      type="number"
                      step="0.01"
                      value={typeFormData.normMin}
                      onChange={(e) => setTypeFormData({ ...typeFormData, normMin: e.target.value })}
                      className="w-full rounded-md border-gray-300"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Norma max</label>
                    <input
                      type="number"
                      step="0.01"
                      value={typeFormData.normMax}
                      onChange={(e) => setTypeFormData({ ...typeFormData, normMax: e.target.value })}
                      className="w-full rounded-md border-gray-300"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Norma (tekst)</label>
                  <input
                    type="text"
                    value={typeFormData.normText}
                    onChange={(e) => setTypeFormData({ ...typeFormData, normText: e.target.value })}
                    className="w-full rounded-md border-gray-300"
                    placeholder="np. nieobecne w 25g"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Częstotliwość badań</label>
                  <input
                    type="text"
                    value={typeFormData.frequency}
                    onChange={(e) => setTypeFormData({ ...typeFormData, frequency: e.target.value })}
                    className="w-full rounded-md border-gray-300"
                    placeholder="np. co miesiąc, co kwartał"
                  />
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
                    {editingType ? 'Zapisz zmiany' : 'Dodaj typ'}
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
