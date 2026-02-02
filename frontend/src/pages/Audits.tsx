import { useState, useEffect } from 'react';
import { api, AuditChecklist, AuditRecord } from '../services/api';
import { ClipboardDocumentCheckIcon, CheckIcon, XMarkIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import dayjs from 'dayjs';

export default function Audits() {
  const [checklists, setChecklists] = useState<AuditChecklist[]>([]);
  const [records, setRecords] = useState<AuditRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'execute' | 'history'>('execute');
  const [isAuditModalOpen, setIsAuditModalOpen] = useState(false);
  const [selectedChecklist, setSelectedChecklist] = useState<AuditChecklist | null>(null);
  const [auditResults, setAuditResults] = useState<{ [key: string]: { passed: boolean; notes: string } }>({});
  const [viewRecord, setViewRecord] = useState<AuditRecord | null>(null);
  const [editRecord, setEditRecord] = useState<AuditRecord | null>(null);
  const [deleteModal, setDeleteModal] = useState<AuditRecord | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [checklistsData, recordsData] = await Promise.all([
        api.getAuditChecklists(),
        api.getAuditRecords(),
      ]);
      setChecklists(checklistsData);
      setRecords(recordsData);
    } catch (error) {
      toast.error('Błąd podczas ładowania danych');
    } finally {
      setIsLoading(false);
    }
  };

  const startAudit = (checklist: AuditChecklist) => {
    setSelectedChecklist(checklist);
    const items = checklist.items as any[];
    const initialResults: { [key: string]: { passed: boolean; notes: string } } = {};
    items.forEach((_, index) => {
      initialResults[index.toString()] = { passed: true, notes: '' };
    });
    setAuditResults(initialResults);
    setIsAuditModalOpen(true);
  };

  const handleAuditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedChecklist) return;

    const items = selectedChecklist.items as any[];
    const results = items.map((item, index) => ({
      item: item.item || item,
      passed: auditResults[index.toString()]?.passed ?? true,
      notes: auditResults[index.toString()]?.notes || null,
    }));

    const passedCount = results.filter(r => r.passed).length;
    const score = Math.round((passedCount / results.length) * 100);

    try {
      await api.createAuditRecord({
        checklistId: selectedChecklist.id,
        results: results as any,
        score,
        notes: null,
      });
      toast.success(`Audyt zapisany. Wynik: ${score}%`);
      if (score < 80) {
        toast.error('Wynik poniżej 80%! Zostanie utworzone działanie korygujące.', { duration: 5000 });
      }
      setIsAuditModalOpen(false);
      loadData();
    } catch (error) {
      toast.error('Błąd podczas zapisywania audytu');
    }
  };

  const startEditAudit = (record: AuditRecord) => {
    setEditRecord(record);
    const results = record.results as any[];
    const initialResults: { [key: string]: { passed: boolean; notes: string } } = {};
    results.forEach((r, index) => {
      initialResults[index.toString()] = { passed: r.passed, notes: r.notes || '' };
    });
    setAuditResults(initialResults);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editRecord) return;

    const results = (editRecord.results as any[]).map((item, index) => ({
      item: item.item,
      passed: auditResults[index.toString()]?.passed ?? true,
      notes: auditResults[index.toString()]?.notes || null,
    }));

    const passedCount = results.filter(r => r.passed).length;
    const score = Math.round((passedCount / results.length) * 100);

    try {
      await api.updateAuditRecord(editRecord.id, {
        results: results as any,
        score,
      });
      toast.success('Audyt zaktualizowany');
      setEditRecord(null);
      setViewRecord(null);
      loadData();
    } catch (error) {
      toast.error('Błąd podczas aktualizacji audytu');
    }
  };

  const handleDeleteAudit = async () => {
    if (!deleteModal) return;
    try {
      await api.deleteAuditRecord(deleteModal.id);
      toast.success('Audyt usunięty');
      setDeleteModal(null);
      setViewRecord(null);
      loadData();
    } catch (error) {
      toast.error('Błąd podczas usuwania audytu');
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600 bg-green-100';
    if (score >= 80) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
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
          <h1 className="text-2xl font-bold text-gray-900">Audyty wewnętrzne</h1>
          <p className="text-gray-500 mt-1">Przeprowadzanie i historia audytów HACCP</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex gap-8">
          <button
            onClick={() => setActiveTab('execute')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'execute'
                ? 'border-meat-600 text-meat-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Przeprowadź audyt
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'history'
                ? 'border-meat-600 text-meat-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Historia ({records.length})
          </button>
        </nav>
      </div>

      {/* Execute Tab */}
      {activeTab === 'execute' && (
        <div className="grid md:grid-cols-2 gap-4">
          {checklists.map((checklist) => (
            <div key={checklist.id} className="card">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-indigo-100 rounded-lg">
                  <ClipboardDocumentCheckIcon className="w-6 h-6 text-indigo-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-medium text-gray-900">{checklist.name}</h3>
                  <p className="text-sm text-gray-400 mt-2">
                    {(checklist.items as any[]).length} punktów kontrolnych
                  </p>
                </div>
              </div>
              <button
                onClick={() => startAudit(checklist)}
                className="w-full mt-4 btn-primary"
              >
                Rozpocznij audyt
              </button>
            </div>
          ))}

          {checklists.length === 0 && (
            <div className="col-span-full card text-center py-12">
              <ClipboardDocumentCheckIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900">Brak list kontrolnych</h3>
              <p className="text-gray-500 mt-2">Skontaktuj się z administratorem w celu dodania list.</p>
            </div>
          )}
        </div>
      )}

      {/* History Tab */}
      {activeTab === 'history' && (
        <div className="space-y-4">
          {records.map((record) => (
            <div 
              key={record.id} 
              className="card hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => setViewRecord(record)}
            >
              <div className="flex items-center gap-4">
                <div className={`w-16 h-16 rounded-lg flex items-center justify-center ${getScoreColor(record.score ?? 0)}`}>
                  <span className="text-2xl font-bold">{record.score ?? 0}%</span>
                </div>
                <div className="flex-1">
                  <h3 className="font-medium text-gray-900">{record.checklist?.name}</h3>
                  <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                    <span>{dayjs(record.auditDate).format('DD.MM.YYYY HH:mm')}</span>
                    <span>Audytor: {record.user?.name || record.auditor}</span>
                  </div>
                </div>
                <span className={`badge ${(record.score ?? 0) >= 80 ? 'badge-success' : 'badge-danger'}`}>
                  {(record.score ?? 0) >= 80 ? 'Zaliczony' : 'Niezaliczony'}
                </span>
              </div>
            </div>
          ))}

          {records.length === 0 && (
            <div className="card text-center py-12">
              <ClipboardDocumentCheckIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900">Brak audytów</h3>
              <p className="text-gray-500 mt-2">Historia audytów jest pusta.</p>
            </div>
          )}
        </div>
      )}

      {/* Audit Modal */}
      {isAuditModalOpen && selectedChecklist && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen p-4">
            <div className="fixed inset-0 bg-black bg-opacity-30" onClick={() => setIsAuditModalOpen(false)}></div>
            <div className="relative bg-white rounded-xl shadow-xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                {selectedChecklist.name}
              </h2>
              <p className="text-gray-500 mb-6">Zaznacz wynik dla każdego punktu kontrolnego</p>
              <form onSubmit={handleAuditSubmit} className="space-y-4">
                {(selectedChecklist.items as any[]).map((item, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start gap-4">
                      <span className="text-sm text-gray-400 font-medium mt-1">{index + 1}.</span>
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{item.item || item}</p>
                        <div className="flex items-center gap-4 mt-3">
                          <button
                            type="button"
                            onClick={() => setAuditResults(prev => ({
                              ...prev,
                              [index.toString()]: { ...prev[index.toString()], passed: true }
                            }))}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg border-2 transition-colors ${
                              auditResults[index.toString()]?.passed
                                ? 'border-green-500 bg-green-50 text-green-700'
                                : 'border-gray-200 text-gray-500 hover:border-gray-300'
                            }`}
                          >
                            <CheckIcon className="w-5 h-5" />
                            Zgodne
                          </button>
                          <button
                            type="button"
                            onClick={() => setAuditResults(prev => ({
                              ...prev,
                              [index.toString()]: { ...prev[index.toString()], passed: false }
                            }))}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg border-2 transition-colors ${
                              !auditResults[index.toString()]?.passed
                                ? 'border-red-500 bg-red-50 text-red-700'
                                : 'border-gray-200 text-gray-500 hover:border-gray-300'
                            }`}
                          >
                            <XMarkIcon className="w-5 h-5" />
                            Niezgodne
                          </button>
                        </div>
                        {!auditResults[index.toString()]?.passed && (
                          <textarea
                            className="input mt-3"
                            rows={2}
                            placeholder="Opisz niezgodność..."
                            value={auditResults[index.toString()]?.notes || ''}
                            onChange={(e) => setAuditResults(prev => ({
                              ...prev,
                              [index.toString()]: { ...prev[index.toString()], notes: e.target.value }
                            }))}
                          />
                        )}
                      </div>
                    </div>
                  </div>
                ))}

                <div className="flex gap-3 pt-4">
                  <button type="button" onClick={() => setIsAuditModalOpen(false)} className="flex-1 btn-secondary">
                    Anuluj
                  </button>
                  <button type="submit" className="flex-1 btn-primary">
                    Zakończ audyt
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* View Record Modal */}
      {viewRecord && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen p-4">
            <div className="fixed inset-0 bg-black bg-opacity-30" onClick={() => setViewRecord(null)}></div>
            <div className="relative bg-white rounded-xl shadow-xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">{viewRecord.checklist?.name}</h2>
                  <p className="text-gray-500">
                    {dayjs(viewRecord.auditDate).format('DD.MM.YYYY HH:mm')} • {viewRecord.user?.name || viewRecord.auditor}
                  </p>
                </div>
                <div className={`w-20 h-20 rounded-lg flex items-center justify-center ${getScoreColor(viewRecord.score ?? 0)}`}>
                  <span className="text-3xl font-bold">{viewRecord.score ?? 0}%</span>
                </div>
              </div>

              <div className="space-y-3">
                {(viewRecord.results as any[]).map((result, index) => (
                  <div 
                    key={index} 
                    className={`p-3 rounded-lg ${result.passed ? 'bg-green-50' : 'bg-red-50'}`}
                  >
                    <div className="flex items-start gap-3">
                      {result.passed ? (
                        <CheckIcon className="w-5 h-5 text-green-600 mt-0.5" />
                      ) : (
                        <XMarkIcon className="w-5 h-5 text-red-600 mt-0.5" />
                      )}
                      <div>
                        <p className={`font-medium ${result.passed ? 'text-green-800' : 'text-red-800'}`}>
                          {result.item}
                        </p>
                        {result.notes && (
                          <p className="text-sm text-red-600 mt-1">{result.notes}</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 flex gap-3">
                <button onClick={() => setViewRecord(null)} className="flex-1 btn-secondary">
                  Zamknij
                </button>
                <button 
                  onClick={() => startEditAudit(viewRecord)} 
                  className="flex-1 btn-primary flex items-center justify-center gap-2"
                >
                  <PencilIcon className="w-4 h-4" />
                  Edytuj
                </button>
                <button 
                  onClick={() => setDeleteModal(viewRecord)} 
                  className="btn-danger flex items-center justify-center gap-2 px-4"
                >
                  <TrashIcon className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Audit Modal */}
      {editRecord && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen p-4">
            <div className="fixed inset-0 bg-black bg-opacity-30" onClick={() => setEditRecord(null)}></div>
            <div className="relative bg-white rounded-xl shadow-xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Edytuj audyt</h2>
              <p className="text-gray-500 mb-6">{editRecord.checklist?.name}</p>

              <form onSubmit={handleEditSubmit} className="space-y-4">
                {(editRecord.results as any[]).map((item, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <button
                        type="button"
                        onClick={() => setAuditResults(prev => ({
                          ...prev,
                          [index.toString()]: { ...prev[index.toString()], passed: !prev[index.toString()]?.passed }
                        }))}
                        className={`mt-0.5 w-6 h-6 rounded flex items-center justify-center flex-shrink-0 ${
                          auditResults[index.toString()]?.passed 
                            ? 'bg-green-500 text-white' 
                            : 'bg-red-500 text-white'
                        }`}
                      >
                        {auditResults[index.toString()]?.passed ? (
                          <CheckIcon className="w-4 h-4" />
                        ) : (
                          <XMarkIcon className="w-4 h-4" />
                        )}
                      </button>
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{item.item}</p>
                        {!auditResults[index.toString()]?.passed && (
                          <input
                            type="text"
                            placeholder="Uwagi (opcjonalnie)"
                            value={auditResults[index.toString()]?.notes || ''}
                            onChange={(e) => setAuditResults(prev => ({
                              ...prev,
                              [index.toString()]: { ...prev[index.toString()], notes: e.target.value }
                            }))}
                            className="mt-2 w-full input text-sm"
                          />
                        )}
                      </div>
                    </div>
                  </div>
                ))}

                <div className="flex gap-3 pt-4">
                  <button type="button" onClick={() => setEditRecord(null)} className="flex-1 btn-secondary">
                    Anuluj
                  </button>
                  <button type="submit" className="flex-1 btn-primary">
                    Zapisz zmiany
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen p-4">
            <div className="fixed inset-0 bg-black bg-opacity-30" onClick={() => setDeleteModal(null)}></div>
            <div className="relative bg-white rounded-xl shadow-xl max-w-md w-full p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Usuń audyt</h2>
              <p className="text-gray-600 mb-6">
                Czy na pewno chcesz usunąć ten audyt? Tej operacji nie można cofnąć.
              </p>
              <div className="flex gap-3">
                <button onClick={() => setDeleteModal(null)} className="flex-1 btn-secondary">
                  Anuluj
                </button>
                <button onClick={handleDeleteAudit} className="flex-1 btn-danger">
                  Usuń
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
