import { useState, useEffect } from 'react';
import { api, PestControlPoint, PestControlCheck } from '../services/api';
import { PlusIcon, BugAntIcon, MapPinIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import dayjs from 'dayjs';

export default function PestControl() {
  const [points, setPoints] = useState<PestControlPoint[]>([]);
  const [checks, setChecks] = useState<PestControlCheck[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'points' | 'checks'>('points');
  const [isPointModalOpen, setIsPointModalOpen] = useState(false);
  const [isCheckModalOpen, setIsCheckModalOpen] = useState(false);
  const [selectedPoint, setSelectedPoint] = useState<PestControlPoint | null>(null);
  const [pointForm, setPointForm] = useState({
    name: '',
    pointType: 'BAIT_STATION',
    location: '',
    checkFrequency: 'MONTHLY',
  });
  const [checkForm, setCheckForm] = useState({
    pointId: '',
    status: 'OK',
    activityDetected: false,
    notes: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [pointsData, checksData] = await Promise.all([
        api.getPestControlPoints(),
        api.getPestControlChecks(),
      ]);
      setPoints(pointsData);
      setChecks(checksData);
    } catch (error) {
      toast.error('Błąd podczas ładowania danych');
    } finally {
      setIsLoading(false);
    }
  };

  const openPointModal = (point?: PestControlPoint) => {
    if (point) {
      setSelectedPoint(point);
      setPointForm({
        name: point.name,
        pointType: point.pointType,
        location: point.location || '',
        checkFrequency: point.checkFrequency,
      });
    } else {
      setSelectedPoint(null);
      setPointForm({ name: '', pointType: 'BAIT_STATION', location: '', checkFrequency: 'MONTHLY' });
    }
    setIsPointModalOpen(true);
  };

  const openCheckModal = (point: PestControlPoint) => {
    setCheckForm({
      pointId: point.id.toString(),
      status: 'OK',
      activityDetected: false,
      notes: '',
    });
    setIsCheckModalOpen(true);
  };

  const handlePointSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (selectedPoint) {
        await api.updatePestControlPoint(selectedPoint.id, pointForm);
        toast.success('Punkt zaktualizowany');
      } else {
        await api.createPestControlPoint(pointForm);
        toast.success('Punkt dodany');
      }
      setIsPointModalOpen(false);
      loadData();
    } catch (error) {
      toast.error('Błąd podczas zapisywania');
    }
  };

  const handleCheckSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createPestControlCheck({
        pointId: parseInt(checkForm.pointId),
        status: checkForm.status,
        activityDetected: checkForm.activityDetected,
        notes: checkForm.notes || null,
      });
      toast.success('Kontrola zarejestrowana');
      if (checkForm.activityDetected) {
        toast.error('Wykryto aktywność szkodników! Zostanie utworzone działanie korygujące.', { duration: 5000 });
      }
      setIsCheckModalOpen(false);
      loadData();
    } catch (error) {
      toast.error('Błąd podczas zapisywania');
    }
  };

  const getPointTypeLabel = (type: string) => {
    switch (type) {
      case 'BAIT_STATION': return 'Stacja deratyzacyjna';
      case 'INSECT_TRAP': return 'Pułapka na owady';
      case 'UV_LAMP': return 'Lampa UV';
      case 'OTHER': return 'Inny';
      default: return type;
    }
  };

  const getPointTypeIcon = (type: string) => {
    switch (type) {
      case 'BAIT_STATION': return '🐀';
      case 'INSECT_TRAP': return '🪰';
      case 'UV_LAMP': return '💡';
      default: return '📍';
    }
  };

  const getFrequencyLabel = (freq: string) => {
    switch (freq) {
      case 'DAILY': return 'Codziennie';
      case 'WEEKLY': return 'Co tydzień';
      case 'MONTHLY': return 'Co miesiąc';
      default: return freq;
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
          <h1 className="text-2xl font-bold text-gray-900">Kontrola szkodników (DDD)</h1>
          <p className="text-gray-500 mt-1">Monitoring i kontrola punktów DDD</p>
        </div>
        <button onClick={() => openPointModal()} className="btn-primary flex items-center gap-2">
          <PlusIcon className="w-5 h-5" />
          Nowy punkt
        </button>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex gap-8">
          <button
            onClick={() => setActiveTab('points')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'points'
                ? 'border-meat-600 text-meat-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Punkty kontrolne ({points.length})
          </button>
          <button
            onClick={() => setActiveTab('checks')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'checks'
                ? 'border-meat-600 text-meat-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Historia kontroli ({checks.length})
          </button>
        </nav>
      </div>

      {/* Points Tab */}
      {activeTab === 'points' && (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {points.map((point) => (
            <div key={point.id} className="card">
              <div className="flex items-start gap-3">
                <div className="text-2xl">{getPointTypeIcon(point.pointType)}</div>
                <div className="flex-1">
                  <h3 className="font-medium text-gray-900">{point.name}</h3>
                  <p className="text-sm text-gray-500">{getPointTypeLabel(point.pointType)}</p>
                </div>
                <span className={`badge ${point.isActive ? 'badge-success' : 'badge-danger'}`}>
                  {point.isActive ? 'Aktywny' : 'Nieaktywny'}
                </span>
              </div>
              {point.location && (
                <div className="mt-3 flex items-center gap-1 text-sm text-gray-500">
                  <MapPinIcon className="w-4 h-4" />
                  {point.location}
                </div>
              )}
              <div className="mt-2 text-sm text-gray-500">
                Kontrola: {getFrequencyLabel(point.checkFrequency)}
              </div>
              <div className="flex gap-2 mt-4 pt-4 border-t border-gray-100">
                <button
                  onClick={() => openCheckModal(point)}
                  className="flex-1 btn-primary text-sm py-2"
                >
                  <BugAntIcon className="w-4 h-4 inline mr-1" />
                  Kontroluj
                </button>
                <button
                  onClick={() => openPointModal(point)}
                  className="px-3 btn-secondary text-sm py-2"
                >
                  Edytuj
                </button>
              </div>
            </div>
          ))}

          {points.length === 0 && (
            <div className="col-span-full card text-center py-12">
              <BugAntIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900">Brak punktów DDD</h3>
              <p className="text-gray-500 mt-2">Dodaj pierwszy punkt kontrolny.</p>
            </div>
          )}
        </div>
      )}

      {/* Checks Tab */}
      {activeTab === 'checks' && (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Data</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Punkt</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Aktywność</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Kontrolujący</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Uwagi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {checks.map((check) => (
                  <tr key={check.id} className={`hover:bg-gray-50 ${check.activityDetected ? 'bg-red-50' : ''}`}>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {dayjs(check.checkDate).format('DD.MM.YYYY HH:mm')}
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">
                      {check.point?.name}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`badge ${check.status === 'OK' ? 'badge-success' : 'badge-warning'}`}>
                        {check.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      {check.activityDetected ? (
                        <ExclamationTriangleIcon className="w-5 h-5 text-red-500 mx-auto" />
                      ) : (
                        <span className="text-green-500">✓</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {check.checkedBy?.name}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {check.notes || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {checks.length === 0 && (
            <div className="text-center py-12">
              <BugAntIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900">Brak kontroli</h3>
              <p className="text-gray-500 mt-2">Historia kontroli jest pusta.</p>
            </div>
          )}
        </div>
      )}

      {/* Point Modal */}
      {isPointModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen p-4">
            <div className="fixed inset-0 bg-black bg-opacity-30" onClick={() => setIsPointModalOpen(false)}></div>
            <div className="relative bg-white rounded-xl shadow-xl max-w-lg w-full p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">
                {selectedPoint ? 'Edytuj punkt DDD' : 'Nowy punkt DDD'}
              </h2>
              <form onSubmit={handlePointSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nazwa/Numer punktu *</label>
                  <input
                    type="text"
                    className="input"
                    required
                    placeholder="np. D-01, P-05"
                    value={pointForm.name}
                    onChange={(e) => setPointForm({ ...pointForm, name: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Typ punktu *</label>
                  <select
                    className="input"
                    value={pointForm.pointType}
                    onChange={(e) => setPointForm({ ...pointForm, pointType: e.target.value })}
                  >
                    <option value="BAIT_STATION">Stacja deratyzacyjna</option>
                    <option value="INSECT_TRAP">Pułapka na owady</option>
                    <option value="UV_LAMP">Lampa UV</option>
                    <option value="OTHER">Inny</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Lokalizacja</label>
                  <input
                    type="text"
                    className="input"
                    placeholder="np. Magazyn surowców, przy drzwiach"
                    value={pointForm.location}
                    onChange={(e) => setPointForm({ ...pointForm, location: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Częstotliwość kontroli *</label>
                  <select
                    className="input"
                    value={pointForm.checkFrequency}
                    onChange={(e) => setPointForm({ ...pointForm, checkFrequency: e.target.value })}
                  >
                    <option value="DAILY">Codziennie</option>
                    <option value="WEEKLY">Co tydzień</option>
                    <option value="MONTHLY">Co miesiąc</option>
                  </select>
                </div>
                <div className="flex gap-3 pt-4">
                  <button type="button" onClick={() => setIsPointModalOpen(false)} className="flex-1 btn-secondary">
                    Anuluj
                  </button>
                  <button type="submit" className="flex-1 btn-primary">
                    {selectedPoint ? 'Zapisz zmiany' : 'Dodaj punkt'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Check Modal */}
      {isCheckModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen p-4">
            <div className="fixed inset-0 bg-black bg-opacity-30" onClick={() => setIsCheckModalOpen(false)}></div>
            <div className="relative bg-white rounded-xl shadow-xl max-w-lg w-full p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Kontrola punktu DDD</h2>
              <form onSubmit={handleCheckSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Punkt</label>
                  <select
                    className="input"
                    value={checkForm.pointId}
                    onChange={(e) => setCheckForm({ ...checkForm, pointId: e.target.value })}
                  >
                    {points.map((p) => (
                      <option key={p.id} value={p.id}>{p.name} - {p.location}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select
                    className="input"
                    value={checkForm.status}
                    onChange={(e) => setCheckForm({ ...checkForm, status: e.target.value })}
                  >
                    <option value="OK">OK - bez uwag</option>
                    <option value="NEEDS_ATTENTION">Wymaga uwagi</option>
                    <option value="REPLACED">Wymieniono przynętę</option>
                    <option value="DAMAGED">Uszkodzony</option>
                  </select>
                </div>
                <div>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      className="rounded border-gray-300 text-red-600 focus:ring-red-500"
                      checked={checkForm.activityDetected}
                      onChange={(e) => setCheckForm({ ...checkForm, activityDetected: e.target.checked })}
                    />
                    <span className="text-sm font-medium text-red-700">
                      Wykryto aktywność szkodników
                    </span>
                  </label>
                  {checkForm.activityDetected && (
                    <p className="mt-1 text-sm text-red-600">
                      ⚠️ Zostanie automatycznie utworzone działanie korygujące
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Uwagi</label>
                  <textarea
                    className="input"
                    rows={2}
                    value={checkForm.notes}
                    onChange={(e) => setCheckForm({ ...checkForm, notes: e.target.value })}
                  />
                </div>
                <div className="flex gap-3 pt-4">
                  <button type="button" onClick={() => setIsCheckModalOpen(false)} className="flex-1 btn-secondary">
                    Anuluj
                  </button>
                  <button type="submit" className="flex-1 btn-primary">
                    Zapisz kontrolę
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
