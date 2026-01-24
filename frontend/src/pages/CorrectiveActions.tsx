import { useState, useEffect } from 'react';
import { api, CorrectiveAction } from '../services/api';
import { PlusIcon, ExclamationTriangleIcon, CheckCircleIcon, ClockIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import dayjs from 'dayjs';

export default function CorrectiveActions() {
  const [actions, setActions] = useState<CorrectiveAction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedAction, setSelectedAction] = useState<CorrectiveAction | null>(null);
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed'>('all');
  const [form, setForm] = useState({
    title: '',
    description: '',
    cause: '',
    actionTaken: '',
    priority: 'MEDIUM',
    dueDate: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const data = await api.getCorrectiveActions();
      setActions(data);
    } catch (error) {
      toast.error('Błąd podczas ładowania danych');
    } finally {
      setIsLoading(false);
    }
  };

  const openModal = (action?: CorrectiveAction) => {
    if (action) {
      setSelectedAction(action);
      setForm({
        title: action.title,
        description: action.description || '',
        cause: action.cause || '',
        actionTaken: action.actionTaken || '',
        priority: action.priority,
        dueDate: action.dueDate ? dayjs(action.dueDate).format('YYYY-MM-DD') : '',
      });
    } else {
      setSelectedAction(null);
      setForm({
        title: '',
        description: '',
        cause: '',
        actionTaken: '',
        priority: 'MEDIUM',
        dueDate: '',
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const data = {
        ...form,
        dueDate: form.dueDate ? new Date(form.dueDate).toISOString() : undefined,
      };

      if (selectedAction) {
        await api.updateCorrectiveAction(selectedAction.id, data);
        toast.success('Działanie zaktualizowane');
      } else {
        await api.createCorrectiveAction(data);
        toast.success('Działanie dodane');
      }
      setIsModalOpen(false);
      loadData();
    } catch (error) {
      toast.error('Błąd podczas zapisywania');
    }
  };

  const handleComplete = async (action: CorrectiveAction) => {
    try {
      await api.updateCorrectiveAction(action.id, { status: 'COMPLETED', completedAt: new Date().toISOString() });
      toast.success('Oznaczono jako zakończone');
      loadData();
    } catch (error) {
      toast.error('Błąd podczas aktualizacji');
    }
  };

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case 'LOW': return 'Niski';
      case 'MEDIUM': return 'Średni';
      case 'HIGH': return 'Wysoki';
      case 'CRITICAL': return 'Krytyczny';
      default: return priority;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'LOW': return 'bg-gray-100 text-gray-800';
      case 'MEDIUM': return 'bg-yellow-100 text-yellow-800';
      case 'HIGH': return 'bg-orange-100 text-orange-800';
      case 'CRITICAL': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return <CheckCircleIcon className="w-5 h-5 text-green-500" />;
      case 'IN_PROGRESS':
        return <ClockIcon className="w-5 h-5 text-blue-500" />;
      default:
        return <ExclamationTriangleIcon className="w-5 h-5 text-yellow-500" />;
    }
  };

  const filteredActions = actions.filter((action) => {
    if (filter === 'pending') return action.status !== 'COMPLETED';
    if (filter === 'completed') return action.status === 'COMPLETED';
    return true;
  });

  if (isLoading) {
    return <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-meat-600"></div>
    </div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Działania korygujące</h1>
          <p className="text-gray-500 mt-1">Zarządzaj działaniami naprawczymi</p>
        </div>
        <button onClick={() => openModal()} className="btn-primary flex items-center gap-2">
          <PlusIcon className="w-5 h-5" />
          Nowe działanie
        </button>
      </div>

      {/* Filter */}
      <div className="flex gap-2">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-lg text-sm font-medium ${
            filter === 'all' ? 'bg-meat-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Wszystkie ({actions.length})
        </button>
        <button
          onClick={() => setFilter('pending')}
          className={`px-4 py-2 rounded-lg text-sm font-medium ${
            filter === 'pending' ? 'bg-meat-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          W toku ({actions.filter(a => a.status !== 'COMPLETED').length})
        </button>
        <button
          onClick={() => setFilter('completed')}
          className={`px-4 py-2 rounded-lg text-sm font-medium ${
            filter === 'completed' ? 'bg-meat-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Zakończone ({actions.filter(a => a.status === 'COMPLETED').length})
        </button>
      </div>

      {/* Actions List */}
      <div className="space-y-4">
        {filteredActions.map((action) => (
          <div key={action.id} className="card">
            <div className="flex items-start gap-4">
              {getStatusIcon(action.status)}
              <div className="flex-1">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-medium text-gray-900">{action.title}</h3>
                    <span className={`inline-flex px-2 py-0.5 mt-1 text-xs font-medium rounded ${getPriorityColor(action.priority)}`}>
                      {getPriorityLabel(action.priority)}
                    </span>
                  </div>
                  {action.dueDate && (
                    <span className={`text-sm ${dayjs(action.dueDate).isBefore(dayjs()) && action.status !== 'COMPLETED' ? 'text-red-600 font-medium' : 'text-gray-500'}`}>
                      Termin: {dayjs(action.dueDate).format('DD.MM.YYYY')}
                    </span>
                  )}
                </div>
                {action.description && (
                  <p className="mt-2 text-sm text-gray-600">{action.description}</p>
                )}
                {action.cause && (
                  <div className="mt-2">
                    <span className="text-xs text-gray-500 font-medium">Przyczyna:</span>
                    <p className="text-sm text-gray-600">{action.cause}</p>
                  </div>
                )}
                {action.actionTaken && (
                  <div className="mt-2">
                    <span className="text-xs text-gray-500 font-medium">Podjęte działanie:</span>
                    <p className="text-sm text-gray-600">{action.actionTaken}</p>
                  </div>
                )}
                <div className="flex gap-2 mt-4 pt-3 border-t border-gray-100">
                  {action.status !== 'COMPLETED' && (
                    <button
                      onClick={() => handleComplete(action)}
                      className="text-sm text-green-600 hover:text-green-700 font-medium"
                    >
                      ✓ Oznacz jako zakończone
                    </button>
                  )}
                  <button
                    onClick={() => openModal(action)}
                    className="text-sm text-meat-600 hover:text-meat-700 font-medium"
                  >
                    Edytuj
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}

        {filteredActions.length === 0 && (
          <div className="card text-center py-12">
            <ExclamationTriangleIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900">Brak działań</h3>
            <p className="text-gray-500 mt-2">Nie znaleziono działań korygujących.</p>
          </div>
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen p-4">
            <div className="fixed inset-0 bg-black bg-opacity-30" onClick={() => setIsModalOpen(false)}></div>
            <div className="relative bg-white rounded-xl shadow-xl max-w-lg w-full p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">
                {selectedAction ? 'Edytuj działanie' : 'Nowe działanie korygujące'}
              </h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tytuł *</label>
                  <input
                    type="text"
                    className="input"
                    required
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Opis</label>
                  <textarea
                    className="input"
                    rows={2}
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Przyczyna</label>
                  <textarea
                    className="input"
                    rows={2}
                    placeholder="Co spowodowało problem?"
                    value={form.cause}
                    onChange={(e) => setForm({ ...form, cause: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Podjęte działanie</label>
                  <textarea
                    className="input"
                    rows={2}
                    placeholder="Co zostało zrobione?"
                    value={form.actionTaken}
                    onChange={(e) => setForm({ ...form, actionTaken: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Priorytet</label>
                    <select
                      className="input"
                      value={form.priority}
                      onChange={(e) => setForm({ ...form, priority: e.target.value })}
                    >
                      <option value="LOW">Niski</option>
                      <option value="MEDIUM">Średni</option>
                      <option value="HIGH">Wysoki</option>
                      <option value="CRITICAL">Krytyczny</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Termin</label>
                    <input
                      type="date"
                      className="input"
                      value={form.dueDate}
                      onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
                    />
                  </div>
                </div>
                <div className="flex gap-3 pt-4">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 btn-secondary">
                    Anuluj
                  </button>
                  <button type="submit" className="flex-1 btn-primary">
                    {selectedAction ? 'Zapisz zmiany' : 'Dodaj działanie'}
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
