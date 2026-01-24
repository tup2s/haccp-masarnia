import { useState, useEffect } from 'react';
import { api, CleaningArea, CleaningRecord } from '../services/api';
import { PlusIcon, SparklesIcon, ClockIcon, CheckBadgeIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import dayjs from 'dayjs';

export default function Cleaning() {
  const [areas, setAreas] = useState<CleaningArea[]>([]);
  const [records, setRecords] = useState<CleaningRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'areas' | 'records'>('areas');
  const [isAreaModalOpen, setIsAreaModalOpen] = useState(false);
  const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);
  const [selectedArea, setSelectedArea] = useState<CleaningArea | null>(null);
  const [areaForm, setAreaForm] = useState({
    name: '',
    location: '',
    frequency: 'DAILY',
    method: '',
    chemicals: '',
  });
  const [recordForm, setRecordForm] = useState({
    cleaningAreaId: '',
    method: '',
    chemicals: '',
    notes: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [areasData, recordsData] = await Promise.all([
        api.getCleaningAreas(),
        api.getCleaningRecords(),
      ]);
      setAreas(areasData);
      setRecords(recordsData);
    } catch (error) {
      toast.error('Błąd podczas ładowania danych');
    } finally {
      setIsLoading(false);
    }
  };

  const openAreaModal = (area?: CleaningArea) => {
    if (area) {
      setSelectedArea(area);
      setAreaForm({
        name: area.name,
        location: area.location || '',
        frequency: area.frequency,
        method: area.method || '',
        chemicals: area.chemicals || '',
      });
    } else {
      setSelectedArea(null);
      setAreaForm({ name: '', location: '', frequency: 'DAILY', method: '', chemicals: '' });
    }
    setIsAreaModalOpen(true);
  };

  const openRecordModal = (area: CleaningArea) => {
    setRecordForm({
      cleaningAreaId: area.id.toString(),
      method: area.method || '',
      chemicals: area.chemicals || '',
      notes: '',
    });
    setIsRecordModalOpen(true);
  };

  const handleAreaSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (selectedArea) {
        await api.updateCleaningArea(selectedArea.id, areaForm);
        toast.success('Strefa zaktualizowana');
      } else {
        await api.createCleaningArea(areaForm);
        toast.success('Strefa dodana');
      }
      setIsAreaModalOpen(false);
      loadData();
    } catch (error) {
      toast.error('Błąd podczas zapisywania');
    }
  };

  const handleRecordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createCleaningRecord({
        cleaningAreaId: parseInt(recordForm.cleaningAreaId),
        method: recordForm.method,
        chemicals: recordForm.chemicals || undefined,
        notes: recordForm.notes || undefined,
      });
      toast.success('Mycie zarejestrowane');
      setIsRecordModalOpen(false);
      loadData();
    } catch (error) {
      toast.error('Błąd podczas zapisywania');
    }
  };

  const getFrequencyLabel = (freq: string) => {
    switch (freq) {
      case 'DAILY': return 'Codziennie';
      case 'WEEKLY': return 'Co tydzień';
      case 'MONTHLY': return 'Co miesiąc';
      case 'AS_NEEDED': return 'W razie potrzeby';
      default: return freq;
    }
  };

  const getFrequencyColor = (freq: string) => {
    switch (freq) {
      case 'DAILY': return 'bg-red-100 text-red-800';
      case 'WEEKLY': return 'bg-orange-100 text-orange-800';
      case 'MONTHLY': return 'bg-blue-100 text-blue-800';
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
          <h1 className="text-2xl font-bold text-gray-900">Mycie i dezynfekcja</h1>
          <p className="text-gray-500 mt-1">Zarządzanie czystością stref produkcyjnych</p>
        </div>
        <button onClick={() => openAreaModal()} className="btn-primary flex items-center gap-2">
          <PlusIcon className="w-5 h-5" />
          Nowa strefa
        </button>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex gap-8">
          <button
            onClick={() => setActiveTab('areas')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'areas'
                ? 'border-meat-600 text-meat-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Strefy ({areas.length})
          </button>
          <button
            onClick={() => setActiveTab('records')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'records'
                ? 'border-meat-600 text-meat-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Historia mycia ({records.length})
          </button>
        </nav>
      </div>

      {/* Areas Tab */}
      {activeTab === 'areas' && (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {areas.map((area) => (
            <div key={area.id} className="card">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-cyan-100 rounded-lg">
                  <SparklesIcon className="w-6 h-6 text-cyan-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-medium text-gray-900">{area.name}</h3>
                  <span className={`inline-flex px-2 py-0.5 mt-1 text-xs font-medium rounded ${getFrequencyColor(area.frequency)}`}>
                    {getFrequencyLabel(area.frequency)}
                  </span>
                </div>
              </div>
              {area.method && (
                <div className="mt-3 text-sm text-gray-500">
                  <p className="font-medium text-gray-700">Metoda:</p>
                  <p className="whitespace-pre-wrap">{area.method}</p>
                </div>
              )}
              {area.chemicals && (
                <div className="mt-2 text-sm">
                  <p className="text-gray-500">Środki: {area.chemicals}</p>
                </div>
              )}
              <div className="flex gap-2 mt-4 pt-4 border-t border-gray-100">
                <button
                  onClick={() => openRecordModal(area)}
                  className="flex-1 btn-primary text-sm py-2"
                >
                  <CheckBadgeIcon className="w-4 h-4 inline mr-1" />
                  Rejestruj mycie
                </button>
                <button
                  onClick={() => openAreaModal(area)}
                  className="px-3 btn-secondary text-sm py-2"
                >
                  Edytuj
                </button>
              </div>
            </div>
          ))}

          {areas.length === 0 && (
            <div className="col-span-full card text-center py-12">
              <SparklesIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900">Brak stref</h3>
              <p className="text-gray-500 mt-2">Dodaj pierwszą strefę do mycia.</p>
            </div>
          )}
        </div>
      )}

      {/* Records Tab */}
      {activeTab === 'records' && (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Data i godzina</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Strefa</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Środki</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Wykonał</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Uwagi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {records.map((record) => (
                  <tr key={record.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-900">
                      <ClockIcon className="w-4 h-4 inline mr-1 text-gray-400" />
                      {dayjs(record.cleanedAt).format('DD.MM.YYYY HH:mm')}
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">
                      {record.cleaningArea?.name}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {record.chemicals || '-'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {record.user?.name}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {record.notes || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {records.length === 0 && (
            <div className="text-center py-12">
              <ClockIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900">Brak zapisów</h3>
              <p className="text-gray-500 mt-2">Historia mycia jest pusta.</p>
            </div>
          )}
        </div>
      )}

      {/* Area Modal */}
      {isAreaModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen p-4">
            <div className="fixed inset-0 bg-black bg-opacity-30" onClick={() => setIsAreaModalOpen(false)}></div>
            <div className="relative bg-white rounded-xl shadow-xl max-w-lg w-full p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">
                {selectedArea ? 'Edytuj strefę' : 'Nowa strefa'}
              </h2>
              <form onSubmit={handleAreaSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nazwa strefy *</label>
                  <input
                    type="text"
                    className="input"
                    required
                    value={areaForm.name}
                    onChange={(e) => setAreaForm({ ...areaForm, name: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Lokalizacja</label>
                  <input
                    type="text"
                    className="input"
                    value={areaForm.location}
                    onChange={(e) => setAreaForm({ ...areaForm, location: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Częstotliwość mycia *</label>
                  <select
                    className="input"
                    value={areaForm.frequency}
                    onChange={(e) => setAreaForm({ ...areaForm, frequency: e.target.value })}
                  >
                    <option value="DAILY">Codziennie</option>
                    <option value="WEEKLY">Co tydzień</option>
                    <option value="MONTHLY">Co miesiąc</option>
                    <option value="AS_NEEDED">W razie potrzeby</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Metoda mycia</label>
                  <textarea
                    className="input"
                    rows={3}
                    placeholder="Opisz sposób mycia i dezynfekcji..."
                    value={areaForm.method}
                    onChange={(e) => setAreaForm({ ...areaForm, method: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Środki chemiczne</label>
                  <input
                    type="text"
                    className="input"
                    placeholder="np. Chloran 5%, Dez-50"
                    value={areaForm.chemicals}
                    onChange={(e) => setAreaForm({ ...areaForm, chemicals: e.target.value })}
                  />
                </div>
                <div className="flex gap-3 pt-4">
                  <button type="button" onClick={() => setIsAreaModalOpen(false)} className="flex-1 btn-secondary">
                    Anuluj
                  </button>
                  <button type="submit" className="flex-1 btn-primary">
                    {selectedArea ? 'Zapisz zmiany' : 'Dodaj strefę'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Record Modal */}
      {isRecordModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen p-4">
            <div className="fixed inset-0 bg-black bg-opacity-30" onClick={() => setIsRecordModalOpen(false)}></div>
            <div className="relative bg-white rounded-xl shadow-xl max-w-lg w-full p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Rejestruj mycie</h2>
              <form onSubmit={handleRecordSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Strefa</label>
                  <select
                    className="input"
                    value={recordForm.cleaningAreaId}
                    onChange={(e) => setRecordForm({ ...recordForm, cleaningAreaId: e.target.value })}
                  >
                    {areas.map((a) => (
                      <option key={a.id} value={a.id}>{a.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Metoda</label>
                  <input
                    type="text"
                    className="input"
                    value={recordForm.method}
                    onChange={(e) => setRecordForm({ ...recordForm, method: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Użyte środki</label>
                  <input
                    type="text"
                    className="input"
                    value={recordForm.chemicals}
                    onChange={(e) => setRecordForm({ ...recordForm, chemicals: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Uwagi</label>
                  <textarea
                    className="input"
                    rows={2}
                    value={recordForm.notes}
                    onChange={(e) => setRecordForm({ ...recordForm, notes: e.target.value })}
                  />
                </div>
                <div className="flex gap-3 pt-4">
                  <button type="button" onClick={() => setIsRecordModalOpen(false)} className="flex-1 btn-secondary">
                    Anuluj
                  </button>
                  <button type="submit" className="flex-1 btn-primary">
                    Potwierdź mycie
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
