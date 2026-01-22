import { useState, useEffect } from 'react';
import { api, CCP, Hazard } from '../services/api';
import { PlusIcon, ShieldCheckIcon, ExclamationTriangleIcon, PencilIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

export default function HACCPPlan() {
  const [ccps, setCcps] = useState<CCP[]>([]);
  const [hazards, setHazards] = useState<Hazard[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'ccps' | 'hazards'>('ccps');
  const [isCCPModalOpen, setIsCCPModalOpen] = useState(false);
  const [isHazardModalOpen, setIsHazardModalOpen] = useState(false);
  const [editingCCP, setEditingCCP] = useState<CCP | null>(null);
  const [editingHazard, setEditingHazard] = useState<Hazard | null>(null);

  const [ccpForm, setCcpForm] = useState({
    name: '',
    description: '',
    criticalLimit: '',
    monitoringProcedure: '',
    correctiveAction: '',
    verificationProcedure: '',
    records: '',
  });

  const [hazardForm, setHazardForm] = useState({
    name: '',
    type: 'BIOLOGICAL',
    description: '',
    severity: 'MEDIUM',
    likelihood: 'MEDIUM',
    controlMeasures: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [ccpsData, hazardsData] = await Promise.all([
        api.getCCPs(),
        api.getHazards(),
      ]);
      setCcps(ccpsData);
      setHazards(hazardsData);
    } catch (error) {
      toast.error('Błąd podczas ładowania danych');
    } finally {
      setIsLoading(false);
    }
  };

  const openCCPModal = (ccp?: CCP) => {
    if (ccp) {
      setEditingCCP(ccp);
      setCcpForm({
        name: ccp.name,
        description: ccp.description || '',
        criticalLimit: ccp.criticalLimit,
        monitoringProcedure: ccp.monitoringProcedure || '',
        correctiveAction: ccp.correctiveAction || '',
        verificationProcedure: ccp.verificationProcedure || '',
        records: ccp.records || '',
      });
    } else {
      setEditingCCP(null);
      setCcpForm({
        name: '',
        description: '',
        criticalLimit: '',
        monitoringProcedure: '',
        correctiveAction: '',
        verificationProcedure: '',
        records: '',
      });
    }
    setIsCCPModalOpen(true);
  };

  const openHazardModal = (hazard?: Hazard) => {
    if (hazard) {
      setEditingHazard(hazard);
      setHazardForm({
        name: hazard.name,
        type: hazard.type,
        description: hazard.description || '',
        severity: hazard.severity,
        likelihood: hazard.likelihood,
        controlMeasures: hazard.controlMeasures || '',
      });
    } else {
      setEditingHazard(null);
      setHazardForm({
        name: '',
        type: 'BIOLOGICAL',
        description: '',
        severity: 'MEDIUM',
        likelihood: 'MEDIUM',
        controlMeasures: '',
      });
    }
    setIsHazardModalOpen(true);
  };

  const handleCCPSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingCCP) {
        await api.updateCCP(editingCCP.id, ccpForm);
        toast.success('CCP zaktualizowany');
      } else {
        await api.createCCP(ccpForm);
        toast.success('CCP dodany');
      }
      setIsCCPModalOpen(false);
      loadData();
    } catch (error) {
      toast.error('Błąd podczas zapisywania');
    }
  };

  const handleHazardSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingHazard) {
        await api.updateHazard(editingHazard.id, hazardForm);
        toast.success('Zagrożenie zaktualizowane');
      } else {
        await api.createHazard(hazardForm);
        toast.success('Zagrożenie dodane');
      }
      setIsHazardModalOpen(false);
      loadData();
    } catch (error) {
      toast.error('Błąd podczas zapisywania');
    }
  };

  const getHazardTypeColor = (type: string) => {
    switch (type) {
      case 'BIOLOGICAL': return 'bg-red-100 text-red-800';
      case 'CHEMICAL': return 'bg-purple-100 text-purple-800';
      case 'PHYSICAL': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getHazardTypeLabel = (type: string) => {
    switch (type) {
      case 'BIOLOGICAL': return 'Biologiczne';
      case 'CHEMICAL': return 'Chemiczne';
      case 'PHYSICAL': return 'Fizyczne';
      default: return type;
    }
  };

  const getRiskColor = (severity: string, likelihood: string) => {
    const severityScore = severity === 'HIGH' ? 3 : severity === 'MEDIUM' ? 2 : 1;
    const likelihoodScore = likelihood === 'HIGH' ? 3 : likelihood === 'MEDIUM' ? 2 : 1;
    const risk = severityScore * likelihoodScore;
    if (risk >= 6) return 'bg-red-500';
    if (risk >= 3) return 'bg-yellow-500';
    return 'bg-green-500';
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
          <h1 className="text-2xl font-bold text-gray-900">Plan HACCP</h1>
          <p className="text-gray-500 mt-1">Krytyczne Punkty Kontrolne i analiza zagrożeń</p>
        </div>
        <button 
          onClick={() => activeTab === 'ccps' ? openCCPModal() : openHazardModal()} 
          className="btn-primary flex items-center gap-2"
        >
          <PlusIcon className="w-5 h-5" />
          {activeTab === 'ccps' ? 'Dodaj CCP' : 'Dodaj zagrożenie'}
        </button>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex gap-8">
          <button
            onClick={() => setActiveTab('ccps')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'ccps'
                ? 'border-meat-600 text-meat-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <ShieldCheckIcon className="w-5 h-5 inline mr-2" />
            Punkty CCP ({ccps.length})
          </button>
          <button
            onClick={() => setActiveTab('hazards')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'hazards'
                ? 'border-meat-600 text-meat-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <ExclamationTriangleIcon className="w-5 h-5 inline mr-2" />
            Zagrożenia ({hazards.length})
          </button>
        </nav>
      </div>

      {/* CCPs Tab */}
      {activeTab === 'ccps' && (
        <div className="space-y-4">
          {ccps.map((ccp, index) => (
            <div key={ccp.id} className="card border-l-4 border-meat-600">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-meat-100 rounded-lg flex items-center justify-center">
                    <span className="text-xl font-bold text-meat-700">CCP{index + 1}</span>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{ccp.name}</h3>
                    {ccp.description && <p className="text-gray-500 mt-1">{ccp.description}</p>}
                  </div>
                </div>
                <button
                  onClick={() => openCCPModal(ccp)}
                  className="p-2 text-gray-400 hover:text-meat-600"
                >
                  <PencilIcon className="w-5 h-5" />
                </button>
              </div>

              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
                <div className="bg-red-50 p-3 rounded-lg">
                  <p className="text-xs font-medium text-red-700 uppercase">Limit krytyczny</p>
                  <p className="mt-1 font-medium text-red-900">{ccp.criticalLimit}</p>
                </div>
                {ccp.monitoringProcedure && (
                  <div className="bg-blue-50 p-3 rounded-lg">
                    <p className="text-xs font-medium text-blue-700 uppercase">Monitoring</p>
                    <p className="mt-1 text-sm text-blue-900">{ccp.monitoringProcedure}</p>
                  </div>
                )}
                {ccp.correctiveAction && (
                  <div className="bg-orange-50 p-3 rounded-lg">
                    <p className="text-xs font-medium text-orange-700 uppercase">Działania korygujące</p>
                    <p className="mt-1 text-sm text-orange-900">{ccp.correctiveAction}</p>
                  </div>
                )}
                {ccp.verificationProcedure && (
                  <div className="bg-green-50 p-3 rounded-lg">
                    <p className="text-xs font-medium text-green-700 uppercase">Weryfikacja</p>
                    <p className="mt-1 text-sm text-green-900">{ccp.verificationProcedure}</p>
                  </div>
                )}
                {ccp.records && (
                  <div className="bg-purple-50 p-3 rounded-lg">
                    <p className="text-xs font-medium text-purple-700 uppercase">Zapisy</p>
                    <p className="mt-1 text-sm text-purple-900">{ccp.records}</p>
                  </div>
                )}
              </div>
            </div>
          ))}

          {ccps.length === 0 && (
            <div className="card text-center py-12">
              <ShieldCheckIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900">Brak punktów CCP</h3>
              <p className="text-gray-500 mt-2">Dodaj pierwszy Krytyczny Punkt Kontrolny.</p>
            </div>
          )}
        </div>
      )}

      {/* Hazards Tab */}
      {activeTab === 'hazards' && (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Zagrożenie</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Typ</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Ryzyko</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Środki kontroli</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Akcje</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {hazards.map((hazard) => (
                  <tr key={hazard.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-medium text-gray-900">{hazard.name}</p>
                        {hazard.description && (
                          <p className="text-sm text-gray-500 truncate max-w-xs">{hazard.description}</p>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded ${getHazardTypeColor(hazard.type)}`}>
                        {getHazardTypeLabel(hazard.type)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${getRiskColor(hazard.severity, hazard.likelihood)}`}></div>
                        <span className="text-sm text-gray-500">
                          {hazard.severity}/{hazard.likelihood}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500 max-w-xs truncate">
                      {hazard.controlMeasures || '-'}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => openHazardModal(hazard)}
                        className="p-1 text-gray-400 hover:text-meat-600"
                      >
                        <PencilIcon className="w-5 h-5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {hazards.length === 0 && (
            <div className="text-center py-12">
              <ExclamationTriangleIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900">Brak zagrożeń</h3>
              <p className="text-gray-500 mt-2">Dodaj analizę zagrożeń.</p>
            </div>
          )}
        </div>
      )}

      {/* CCP Modal */}
      {isCCPModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen p-4">
            <div className="fixed inset-0 bg-black bg-opacity-30" onClick={() => setIsCCPModalOpen(false)}></div>
            <div className="relative bg-white rounded-xl shadow-xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">
                {editingCCP ? 'Edytuj CCP' : 'Nowy Krytyczny Punkt Kontrolny'}
              </h2>
              <form onSubmit={handleCCPSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nazwa CCP *</label>
                  <input
                    type="text"
                    className="input"
                    required
                    placeholder="np. Kontrola temperatury chłodni"
                    value={ccpForm.name}
                    onChange={(e) => setCcpForm({ ...ccpForm, name: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Opis</label>
                  <textarea
                    className="input"
                    rows={2}
                    value={ccpForm.description}
                    onChange={(e) => setCcpForm({ ...ccpForm, description: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Limit krytyczny *</label>
                  <input
                    type="text"
                    className="input"
                    required
                    placeholder="np. Temperatura ≤ 4°C"
                    value={ccpForm.criticalLimit}
                    onChange={(e) => setCcpForm({ ...ccpForm, criticalLimit: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Procedura monitorowania</label>
                  <textarea
                    className="input"
                    rows={2}
                    placeholder="Jak i kiedy monitorować..."
                    value={ccpForm.monitoringProcedure}
                    onChange={(e) => setCcpForm({ ...ccpForm, monitoringProcedure: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Działania korygujące</label>
                  <textarea
                    className="input"
                    rows={2}
                    placeholder="Co zrobić gdy przekroczono limit..."
                    value={ccpForm.correctiveAction}
                    onChange={(e) => setCcpForm({ ...ccpForm, correctiveAction: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Procedura weryfikacji</label>
                  <textarea
                    className="input"
                    rows={2}
                    value={ccpForm.verificationProcedure}
                    onChange={(e) => setCcpForm({ ...ccpForm, verificationProcedure: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Wymagane zapisy</label>
                  <input
                    type="text"
                    className="input"
                    placeholder="np. Dziennik temperatur"
                    value={ccpForm.records}
                    onChange={(e) => setCcpForm({ ...ccpForm, records: e.target.value })}
                  />
                </div>
                <div className="flex gap-3 pt-4">
                  <button type="button" onClick={() => setIsCCPModalOpen(false)} className="flex-1 btn-secondary">
                    Anuluj
                  </button>
                  <button type="submit" className="flex-1 btn-primary">
                    {editingCCP ? 'Zapisz zmiany' : 'Dodaj CCP'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Hazard Modal */}
      {isHazardModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen p-4">
            <div className="fixed inset-0 bg-black bg-opacity-30" onClick={() => setIsHazardModalOpen(false)}></div>
            <div className="relative bg-white rounded-xl shadow-xl max-w-lg w-full p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">
                {editingHazard ? 'Edytuj zagrożenie' : 'Nowe zagrożenie'}
              </h2>
              <form onSubmit={handleHazardSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nazwa zagrożenia *</label>
                  <input
                    type="text"
                    className="input"
                    required
                    placeholder="np. Salmonella w mięsie drobiowym"
                    value={hazardForm.name}
                    onChange={(e) => setHazardForm({ ...hazardForm, name: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Typ zagrożenia *</label>
                  <select
                    className="input"
                    value={hazardForm.type}
                    onChange={(e) => setHazardForm({ ...hazardForm, type: e.target.value })}
                  >
                    <option value="BIOLOGICAL">Biologiczne</option>
                    <option value="CHEMICAL">Chemiczne</option>
                    <option value="PHYSICAL">Fizyczne</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Opis</label>
                  <textarea
                    className="input"
                    rows={2}
                    value={hazardForm.description}
                    onChange={(e) => setHazardForm({ ...hazardForm, description: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Dotkliwość</label>
                    <select
                      className="input"
                      value={hazardForm.severity}
                      onChange={(e) => setHazardForm({ ...hazardForm, severity: e.target.value })}
                    >
                      <option value="LOW">Niska</option>
                      <option value="MEDIUM">Średnia</option>
                      <option value="HIGH">Wysoka</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Prawdopodobieństwo</label>
                    <select
                      className="input"
                      value={hazardForm.likelihood}
                      onChange={(e) => setHazardForm({ ...hazardForm, likelihood: e.target.value })}
                    >
                      <option value="LOW">Niskie</option>
                      <option value="MEDIUM">Średnie</option>
                      <option value="HIGH">Wysokie</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Środki kontroli</label>
                  <textarea
                    className="input"
                    rows={2}
                    placeholder="Jak kontrolować to zagrożenie..."
                    value={hazardForm.controlMeasures}
                    onChange={(e) => setHazardForm({ ...hazardForm, controlMeasures: e.target.value })}
                  />
                </div>
                <div className="flex gap-3 pt-4">
                  <button type="button" onClick={() => setIsHazardModalOpen(false)} className="flex-1 btn-secondary">
                    Anuluj
                  </button>
                  <button type="submit" className="flex-1 btn-primary">
                    {editingHazard ? 'Zapisz zmiany' : 'Dodaj zagrożenie'}
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
