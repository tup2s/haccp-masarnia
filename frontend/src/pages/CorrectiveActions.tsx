import { useState, useEffect } from 'react';
import { api, CorrectiveAction } from '../services/api';
import { PlusIcon, WrenchScrewdriverIcon, ClockIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import dayjs from 'dayjs';

export default function CorrectiveActions() {
  const [actions, setActions] = useState<CorrectiveAction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAction, setEditingAction] = useState<CorrectiveAction | null>(null);
  const [filter, setFilter] = useState<string>('all');
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    source: 'OTHER',
    priority: 'MEDIUM',
    dueDate: '',
    status: 'OPEN',
    resolution: '',
  });

  useEffect(() => {
    loadActions();
  }, []);

  const loadActions = async () => {
    try {
      const data = await api.getCorrectiveActions();
      setActions(data);
    } catch (error) {
      toast.error('Błąd podczas ładowania działań korygujących');
    } finally {
      setIsLoading(false);
    }
  };

  const openModal = (action?: CorrectiveAction) => {
    if (action) {
      setEditingAction(action);
      setFormData({
        title: action.title,
        description: action.description || '',
        source: action.source,
        priority: action.priority,
        dueDate: action.dueDate ? dayjs(action.dueDate).format('YYYY-MM-DD') : '',
        status: action.status,
        resolution: action.resolution || '',
      });
    } else {
      setEditingAction(null);
      setFormData({
        title: '',
        description: '',
        source: 'OTHER',
        priority: 'MEDIUM',
        dueDate: dayjs().add(7, 'day').format('YYYY-MM-DD'),
        status: 'OPEN',
        resolution: '',
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        dueDate: formData.dueDate || null,
        description: formData.description || null,
        resolution: formData.resolution || null,
      };
      if (editingAction) {
        await api.updateCorrectiveAction(editingAction.id, payload);
        toast.success('Działanie zaktualizowane');
      } else {
        await api.createCorrectiveAction(payload);
        toast.success('Działanie dodane');
      }
      setIsModalOpen(false);
      loadActions();
    } catch (error) {
      toast.error('Błąd podczas zapisywania');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'OPEN': return 'badge-danger';
      case 'IN_PROGRESS': return 'badge-warning';
      case 'COMPLETED': return 'badge-success';
      default: return 'badge-info';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'OPEN': return 'Otwarte';
      case 'IN_PROGRESS': return 'W trakcie';
      case 'COMPLETED': return 'Zakończone';
      default: return status;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'HIGH': return 'text-red-600 bg-red-50';
      case 'MEDIUM': return 'text-yellow-600 bg-yellow-50';
      case 'LOW': return 'text-green-600 bg-green-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case 'HIGH': return 'Wysoki';
      case 'MEDIUM': return 'Średni';
      case 'LOW': return 'Niski';
      default: return priority;
    }
  };

  const getSourceLabel = (source: string) => {
    switch (source) {
      case 'TEMPERATURE': return 'Monitoring temp.';
      case 'RECEPTION': return 'Przyjęcie surowców';
      case 'AUDIT': return 'Audyt';
      case 'PEST_CONTROL': return 'Kontrola DDD';
      case 'CUSTOMER_COMPLAINT': return 'Reklamacja';
      case 'OTHER': return 'Inne';
      default: return source;
    }
  };

  const filteredActions = filter === 'all' 
    ? actions 
    : actions.filter(a => a.status === filter);

  const stats = {
    open: actions.filter(a => a.status === 'OPEN').length,
    inProgress: actions.filter(a => a.status === 'IN_PROGRESS').length,
    completed: actions.filter(a => a.status === 'COMPLETED').length,
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
          <h1 className="text-2xl font-bold text-gray-900">Działania korygujące</h1>
          <p className="text-gray-500 mt-1">Zarządzanie niezgodnościami i działaniami naprawczymi</p>
        </div>
        <button onClick={() => openModal()} className="btn-primary flex items-center gap-2">
          <PlusIcon className="w-5 h-5" />
          Nowe działanie
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="card bg-red-50 border border-red-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 rounded-lg">
              <WrenchScrewdriverIcon className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-red-700">{stats.open}</p>
              <p className="text-sm text-red-600">Otwarte</p>
            </div>
          </div>
        </div>
        <div className="card bg-yellow-50 border border-yellow-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <ClockIcon className="w-6 h-6 text-yellow-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-yellow-700">{stats.inProgress}</p>
              <p className="text-sm text-yellow-600">W trakcie</p>
            </div>
          </div>
        </div>
        <div className="card bg-green-50 border border-green-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircleIcon className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-green-700">{stats.completed}</p>
              <p className="text-sm text-green-600">Zakończone</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filter */}
      <div className="flex gap-2">
        {['all', 'OPEN', 'IN_PROGRESS', 'COMPLETED'].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === f
                ? 'bg-meat-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {f === 'all' ? 'Wszystkie' : getStatusLabel(f)}
          </button>
        ))}
      </div>

      {/* Actions List */}
      <div className="space-y-4">
        {filteredActions.map((action) => (
          <div key={action.id} className="card hover:shadow-md transition-shadow cursor-pointer" onClick={() => openModal(action)}>
            <div className="flex items-start gap-4">
              <div className={`p-2 rounded-lg ${getPriorityColor(action.priority)}`}>
                <WrenchScrewdriverIcon className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="font-medium text-gray-900">{action.title}</h3>
                    <div className="flex flex-wrap gap-2 mt-2">
                      <span className={`badge ${getStatusColor(action.status)}`}>
                        {getStatusLabel(action.status)}
                      </span>
                      <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded ${getPriorityColor(action.priority)}`}>
                        Priorytet: {getPriorityLabel(action.priority)}
                      </span>
                      <span className="badge badge-info">
                        {getSourceLabel(action.source)}
                      </span>
                    </div>
                  </div>
                  {action.dueDate && (
                    <div className="text-right text-sm">
                      <p className="text-gray-500">Termin</p>
                      <p className={`font-medium ${
                        dayjs(action.dueDate).isBefore(dayjs()) && action.status !== 'COMPLETED'
                          ? 'text-red-600'
                          : 'text-gray-900'
                      }`}>
                        {dayjs(action.dueDate).format('DD.MM.YYYY')}
                      </p>
                    </div>
                  )}
                </div>
                {action.description && (
                  <p className="mt-2 text-sm text-gray-600 line-clamp-2">{action.description}</p>
                )}
                {action.resolution && (
                  <div className="mt-2 p-2 bg-green-50 rounded text-sm text-green-700">
                    <strong>Rozwiązanie:</strong> {action.resolution}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredActions.length === 0 && (
        <div className="card text-center py-12">
          <WrenchScrewdriverIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900">Brak działań</h3>
          <p className="text-gray-500 mt-2">
            {filter === 'all' ? 'Nie ma żadnych działań korygujących.' : 'Brak działań o wybranym statusie.'}
          </p>
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen p-4">
            <div className="fixed inset-0 bg-black bg-opacity-30" onClick={() => setIsModalOpen(false)}></div>
            <div className="relative bg-white rounded-xl shadow-xl max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">
                {editingAction ? 'Edytuj działanie korygujące' : 'Nowe działanie korygujące'}
              </h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tytuł *</label>
                  <input
                    type="text"
                    className="input"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Opis problemu</label>
                  <textarea
                    className="input"
                    rows={2}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Źródło</label>
                    <select
                      className="input"
                      value={formData.source}
                      onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                    >
                      <option value="TEMPERATURE">Monitoring temp.</option>
                      <option value="RECEPTION">Przyjęcie surowców</option>
                      <option value="AUDIT">Audyt</option>
                      <option value="PEST_CONTROL">Kontrola DDD</option>
                      <option value="CUSTOMER_COMPLAINT">Reklamacja</option>
                      <option value="OTHER">Inne</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Priorytet</label>
                    <select
                      className="input"
                      value={formData.priority}
                      onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                    >
                      <option value="LOW">Niski</option>
                      <option value="MEDIUM">Średni</option>
                      <option value="HIGH">Wysoki</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Termin realizacji</label>
                    <input
                      type="date"
                      className="input"
                      value={formData.dueDate}
                      onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                    <select
                      className="input"
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    >
                      <option value="OPEN">Otwarte</option>
                      <option value="IN_PROGRESS">W trakcie</option>
                      <option value="COMPLETED">Zakończone</option>
                    </select>
                  </div>
                </div>
                {(formData.status === 'COMPLETED' || editingAction?.status === 'COMPLETED') && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Opis rozwiązania</label>
                    <textarea
                      className="input"
                      rows={2}
                      placeholder="Opisz podjęte działania i ich efekt..."
                      value={formData.resolution}
                      onChange={(e) => setFormData({ ...formData, resolution: e.target.value })}
                    />
                  </div>
                )}
                <div className="flex gap-3 pt-4">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 btn-secondary">
                    Anuluj
                  </button>
                  <button type="submit" className="flex-1 btn-primary">
                    {editingAction ? 'Zapisz zmiany' : 'Dodaj działanie'}
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
