import { useState, useEffect } from 'react';
import { api, Document } from '../services/api';
import { PlusIcon, DocumentTextIcon, FolderIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import dayjs from 'dayjs';

const CATEGORIES = [
  { value: 'PROCEDURE', label: 'Procedury', color: 'bg-blue-100 text-blue-800' },
  { value: 'INSTRUCTION', label: 'Instrukcje', color: 'bg-green-100 text-green-800' },
  { value: 'FORM', label: 'Formularze', color: 'bg-purple-100 text-purple-800' },
  { value: 'RECORD', label: 'Zapisy', color: 'bg-orange-100 text-orange-800' },
  { value: 'CERTIFICATE', label: 'Certyfikaty', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'OTHER', label: 'Inne', color: 'bg-gray-100 text-gray-800' },
];

export default function Documents() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDoc, setEditingDoc] = useState<Document | null>(null);
  const [filter, setFilter] = useState<string>('all');
  const [formData, setFormData] = useState({
    title: '',
    category: 'PROCEDURE',
    version: '1.0',
    fileName: '',
    filePath: '',
    validFrom: dayjs().format('YYYY-MM-DD'),
    validUntil: '',
  });

  useEffect(() => {
    loadDocuments();
  }, []);

  const loadDocuments = async () => {
    try {
      const data = await api.getDocuments();
      setDocuments(data);
    } catch (error) {
      toast.error('Błąd podczas ładowania dokumentów');
    } finally {
      setIsLoading(false);
    }
  };

  const openModal = (doc?: Document) => {
    if (doc) {
      setEditingDoc(doc);
      setFormData({
        title: doc.title,
        category: doc.category,
        version: doc.version || '1.0',
        fileName: doc.fileName || '',
        filePath: doc.filePath || '',
        validFrom: doc.validFrom ? dayjs(doc.validFrom).format('YYYY-MM-DD') : '',
        validUntil: doc.validUntil ? dayjs(doc.validUntil).format('YYYY-MM-DD') : '',
      });
    } else {
      setEditingDoc(null);
      setFormData({
        title: '',
        category: 'PROCEDURE',
        version: '1.0',
        fileName: '',
        filePath: '',
        validFrom: dayjs().format('YYYY-MM-DD'),
        validUntil: '',
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        validUntil: formData.validUntil || undefined,
        filePath: formData.filePath || undefined,
        fileName: formData.fileName || formData.title,
      };
      if (editingDoc) {
        await api.updateDocument(editingDoc.id, payload);
        toast.success('Dokument zaktualizowany');
      } else {
        await api.createDocument(payload);
        toast.success('Dokument dodany');
      }
      setIsModalOpen(false);
      loadDocuments();
    } catch (error) {
      toast.error('Błąd podczas zapisywania');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Czy na pewno usunąć ten dokument?')) return;
    try {
      await api.deleteDocument(id);
      toast.success('Dokument usunięty');
      loadDocuments();
    } catch (error) {
      toast.error('Błąd podczas usuwania');
    }
  };

  const getCategoryInfo = (value: string) => CATEGORIES.find(c => c.value === value) || CATEGORIES[5];

  const filteredDocs = filter === 'all' 
    ? documents 
    : documents.filter(d => d.category === filter);

  const groupedDocs = CATEGORIES.map(cat => ({
    ...cat,
    count: documents.filter(d => d.category === cat.value).length,
  }));

  if (isLoading) {
    return <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-meat-600"></div>
    </div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dokumentacja HACCP</h1>
          <p className="text-gray-500 mt-1">Procedury, instrukcje i formularze</p>
        </div>
        <button onClick={() => openModal()} className="btn-primary flex items-center gap-2">
          <PlusIcon className="w-5 h-5" />
          Dodaj dokument
        </button>
      </div>

      {/* Category Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {groupedDocs.map((cat) => (
          <button
            key={cat.value}
            onClick={() => setFilter(filter === cat.value ? 'all' : cat.value)}
            className={`p-3 rounded-lg text-left transition-all ${
              filter === cat.value
                ? 'ring-2 ring-meat-500 ring-offset-2'
                : 'hover:shadow-md'
            } ${cat.color}`}
          >
            <div className="flex items-center gap-2">
              <FolderIcon className="w-5 h-5" />
              <span className="font-medium">{cat.count}</span>
            </div>
            <p className="text-sm mt-1">{cat.label}</p>
          </button>
        ))}
      </div>

      {/* Documents List */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Dokument</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Kategoria</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Plik</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Wersja</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ważny od</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Akcje</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {filteredDocs.map((doc) => {
                const catInfo = getCategoryInfo(doc.category);
                const isExpired = doc.validUntil && dayjs(doc.validUntil).isBefore(dayjs());
                return (
                  <tr key={doc.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <DocumentTextIcon className="w-5 h-5 text-gray-400" />
                        <div>
                          <p className="font-medium text-gray-900">{doc.title}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded ${catInfo.color}`}>
                        {catInfo.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">{doc.fileName || '-'}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">{doc.version}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {doc.validFrom ? dayjs(doc.validFrom).format('DD.MM.YYYY') : '-'}
                    </td>
                    <td className="px-4 py-3">
                      {isExpired ? (
                        <span className="badge badge-danger">Wygasły</span>
                      ) : (
                        <span className="badge badge-success">Aktywny</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openModal(doc)}
                          className="p-1 text-gray-400 hover:text-meat-600"
                        >
                          <PencilIcon className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleDelete(doc.id)}
                          className="p-1 text-gray-400 hover:text-red-600"
                        >
                          <TrashIcon className="w-5 h-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {filteredDocs.length === 0 && (
        <div className="card text-center py-12">
          <DocumentTextIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900">Brak dokumentów</h3>
          <p className="text-gray-500 mt-2">
            {filter !== 'all' ? 'Brak dokumentów w wybranej kategorii.' : 'Dodaj pierwszy dokument.'}
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
                {editingDoc ? 'Edytuj dokument' : 'Nowy dokument'}
              </h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tytuł dokumentu *</label>
                  <input
                    type="text"
                    className="input"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nazwa pliku</label>
                    <input
                      type="text"
                      className="input"
                      placeholder="np. procedura-haccp.pdf"
                      value={formData.fileName}
                      onChange={(e) => setFormData({ ...formData, fileName: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Wersja</label>
                    <input
                      type="text"
                      className="input"
                      value={formData.version}
                      onChange={(e) => setFormData({ ...formData, version: e.target.value })}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Kategoria *</label>
                  <select
                    className="input"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat.value} value={cat.value}>{cat.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Ścieżka pliku</label>
                  <input
                    type="text"
                    className="input"
                    placeholder="np. dokumenty/procedury/P-01.pdf"
                    value={formData.filePath}
                    onChange={(e) => setFormData({ ...formData, filePath: e.target.value })}
                  />
                  <p className="text-xs text-gray-500 mt-1">Lokalna ścieżka do pliku dokumentu</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Ważny od</label>
                    <input
                      type="date"
                      className="input"
                      value={formData.validFrom}
                      onChange={(e) => setFormData({ ...formData, validFrom: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Ważny do</label>
                    <input
                      type="date"
                      className="input"
                      value={formData.validUntil}
                      onChange={(e) => setFormData({ ...formData, validUntil: e.target.value })}
                    />
                  </div>
                </div>
                <div className="flex gap-3 pt-4">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 btn-secondary">
                    Anuluj
                  </button>
                  <button type="submit" className="flex-1 btn-primary">
                    {editingDoc ? 'Zapisz zmiany' : 'Dodaj dokument'}
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
