import { useState, useEffect } from 'react';
import { api, TrainingRecord, User } from '../services/api';
import { PlusIcon, AcademicCapIcon, UserGroupIcon, CalendarIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import dayjs from 'dayjs';

export default function Trainings() {
  const [trainings, setTrainings] = useState<TrainingRecord[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [viewTraining, setViewTraining] = useState<TrainingRecord | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    trainingDate: dayjs().format('YYYY-MM-DD'),
    trainer: '',
    duration: '',
    participantIds: [] as number[],
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [trainingsData, usersData] = await Promise.all([
        api.getTrainings(),
        api.getUsers(),
      ]);
      setTrainings(trainingsData);
      setUsers(usersData);
    } catch (error) {
      toast.error('Błąd podczas ładowania danych');
    } finally {
      setIsLoading(false);
    }
  };

  const openModal = () => {
    setFormData({
      title: '',
      description: '',
      trainingDate: dayjs().format('YYYY-MM-DD'),
      trainer: '',
      duration: '',
      participantIds: [],
    });
    setIsModalOpen(true);
  };

  const toggleParticipant = (userId: number) => {
    setFormData(prev => ({
      ...prev,
      participantIds: prev.participantIds.includes(userId)
        ? prev.participantIds.filter(id => id !== userId)
        : [...prev.participantIds, userId],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.participantIds.length === 0) {
      toast.error('Wybierz przynajmniej jednego uczestnika');
      return;
    }
    try {
      await api.createTraining({
        title: formData.title,
        description: formData.description || null,
        trainingDate: formData.trainingDate,
        trainer: formData.trainer || null,
        duration: formData.duration ? parseInt(formData.duration) : null,
        participantIds: formData.participantIds,
      });
      toast.success('Szkolenie dodane');
      setIsModalOpen(false);
      loadData();
    } catch (error) {
      toast.error('Błąd podczas zapisywania');
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
          <h1 className="text-2xl font-bold text-gray-900">Szkolenia</h1>
          <p className="text-gray-500 mt-1">Ewidencja szkoleń HACCP i BHP</p>
        </div>
        <button onClick={openModal} className="btn-primary flex items-center gap-2">
          <PlusIcon className="w-5 h-5" />
          Nowe szkolenie
        </button>
      </div>

      {/* Trainings List */}
      <div className="space-y-4">
        {trainings.map((training) => (
          <div key={training.id} className="card">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-purple-100 rounded-lg">
                <AcademicCapIcon className="w-6 h-6 text-purple-600" />
              </div>
              <div className="flex-1">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-gray-900">{training.title}</h3>
                    <div className="flex flex-wrap gap-4 mt-2 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <CalendarIcon className="w-4 h-4" />
                        {dayjs(training.trainingDate).format('DD.MM.YYYY')}
                      </span>
                      {training.trainer && (
                        <span>Prowadzący: {training.trainer}</span>
                      )}
                      {training.duration && (
                        <span>{training.duration} min</span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => setViewTraining(training)}
                    className="text-sm text-meat-600 hover:text-meat-700"
                  >
                    Szczegóły
                  </button>
                </div>
                {training.description && (
                  <p className="mt-2 text-sm text-gray-600">{training.description}</p>
                )}
                <div className="mt-3 flex items-center gap-2">
                  <UserGroupIcon className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-500">
                    {training.participants?.length || 0} uczestników
                  </span>
                  <div className="flex -space-x-2">
                    {training.participants?.slice(0, 5).map((p) => (
                      <div
                        key={p.id}
                        className="w-7 h-7 rounded-full bg-meat-100 border-2 border-white flex items-center justify-center text-xs font-medium text-meat-700"
                        title={p.user?.name}
                      >
                        {p.user?.name?.charAt(0)}
                      </div>
                    ))}
                    {(training.participants?.length || 0) > 5 && (
                      <div className="w-7 h-7 rounded-full bg-gray-100 border-2 border-white flex items-center justify-center text-xs font-medium text-gray-500">
                        +{training.participants!.length - 5}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {trainings.length === 0 && (
        <div className="card text-center py-12">
          <AcademicCapIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900">Brak szkoleń</h3>
          <p className="text-gray-500 mt-2">Dodaj pierwsze szkolenie.</p>
        </div>
      )}

      {/* Create Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen p-4">
            <div className="fixed inset-0 bg-black bg-opacity-30" onClick={() => setIsModalOpen(false)}></div>
            <div className="relative bg-white rounded-xl shadow-xl max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Nowe szkolenie</h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Temat szkolenia *</label>
                  <input
                    type="text"
                    className="input"
                    required
                    placeholder="np. Szkolenie HACCP - zasady higieny"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Opis</label>
                  <textarea
                    className="input"
                    rows={2}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Data szkolenia *</label>
                    <input
                      type="date"
                      className="input"
                      required
                      value={formData.trainingDate}
                      onChange={(e) => setFormData({ ...formData, trainingDate: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Czas trwania (min)</label>
                    <input
                      type="number"
                      className="input"
                      min="1"
                      value={formData.duration}
                      onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Prowadzący</label>
                  <input
                    type="text"
                    className="input"
                    value={formData.trainer}
                    onChange={(e) => setFormData({ ...formData, trainer: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Uczestnicy * ({formData.participantIds.length} wybranych)
                  </label>
                  <div className="border border-gray-300 rounded-lg p-3 max-h-40 overflow-y-auto space-y-2">
                    {users.map((user) => (
                      <label key={user.id} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          className="rounded border-gray-300 text-meat-600 focus:ring-meat-500"
                          checked={formData.participantIds.includes(user.id)}
                          onChange={() => toggleParticipant(user.id)}
                        />
                        <span className="text-sm">{user.name}</span>
                        <span className="text-xs text-gray-400">({user.email})</span>
                      </label>
                    ))}
                  </div>
                </div>
                <div className="flex gap-3 pt-4">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 btn-secondary">
                    Anuluj
                  </button>
                  <button type="submit" className="flex-1 btn-primary">
                    Dodaj szkolenie
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* View Modal */}
      {viewTraining && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen p-4">
            <div className="fixed inset-0 bg-black bg-opacity-30" onClick={() => setViewTraining(null)}></div>
            <div className="relative bg-white rounded-xl shadow-xl max-w-lg w-full p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">{viewTraining.title}</h2>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Data</p>
                    <p className="font-medium">{dayjs(viewTraining.trainingDate).format('DD.MM.YYYY')}</p>
                  </div>
                  {viewTraining.duration && (
                    <div>
                      <p className="text-sm text-gray-500">Czas trwania</p>
                      <p className="font-medium">{viewTraining.duration} min</p>
                    </div>
                  )}
                  {viewTraining.trainer && (
                    <div className="col-span-2">
                      <p className="text-sm text-gray-500">Prowadzący</p>
                      <p className="font-medium">{viewTraining.trainer}</p>
                    </div>
                  )}
                </div>
                {viewTraining.description && (
                  <div>
                    <p className="text-sm text-gray-500">Opis</p>
                    <p className="text-sm">{viewTraining.description}</p>
                  </div>
                )}
                <div>
                  <p className="text-sm text-gray-500 mb-2">Lista uczestników</p>
                  <div className="bg-gray-50 rounded-lg p-3 space-y-2">
                    {viewTraining.participants?.map((p) => (
                      <div key={p.id} className="flex items-center gap-2 text-sm">
                        <div className="w-6 h-6 rounded-full bg-meat-100 flex items-center justify-center text-xs font-medium text-meat-700">
                          {p.user?.name?.charAt(0)}
                        </div>
                        <span>{p.user?.name}</span>
                        {p.completed && <span className="text-green-500">✓</span>}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="mt-6">
                <button onClick={() => setViewTraining(null)} className="w-full btn-secondary">
                  Zamknij
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
