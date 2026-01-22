import { useState, useEffect } from 'react';
import { api, Product } from '../services/api';
import { PlusIcon, PencilIcon, TrashIcon, ShoppingBagIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

export default function Products() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    category: '',
    description: '',
    unit: 'kg',
    shelfLife: '',
    storageTemp: '',
    allergens: '',
  });

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      const data = await api.getProducts();
      setProducts(data);
    } catch (error) {
      toast.error('Błąd podczas ładowania produktów');
    } finally {
      setIsLoading(false);
    }
  };

  const openModal = (product?: Product) => {
    if (product) {
      setEditingProduct(product);
      setFormData({
        name: product.name,
        sku: product.sku || '',
        category: product.category || '',
        description: product.description || '',
        unit: product.unit,
        shelfLife: product.shelfLife?.toString() || '',
        storageTemp: product.storageTemp || '',
        allergens: product.allergens || '',
      });
    } else {
      setEditingProduct(null);
      setFormData({
        name: '',
        sku: '',
        category: '',
        description: '',
        unit: 'kg',
        shelfLife: '',
        storageTemp: '',
        allergens: '',
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        shelfLife: formData.shelfLife ? parseInt(formData.shelfLife) : null,
      };
      if (editingProduct) {
        await api.updateProduct(editingProduct.id, payload);
        toast.success('Produkt zaktualizowany');
      } else {
        await api.createProduct(payload);
        toast.success('Produkt dodany');
      }
      setIsModalOpen(false);
      loadProducts();
    } catch (error) {
      toast.error('Błąd podczas zapisywania');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Czy na pewno usunąć ten produkt?')) return;
    try {
      await api.deleteProduct(id);
      toast.success('Produkt usunięty');
      loadProducts();
    } catch (error) {
      toast.error('Błąd podczas usuwania');
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
          <h1 className="text-2xl font-bold text-gray-900">Produkty</h1>
          <p className="text-gray-500 mt-1">Katalog wyrobów gotowych</p>
        </div>
        <button onClick={() => openModal()} className="btn-primary flex items-center gap-2">
          <PlusIcon className="w-5 h-5" />
          Dodaj produkt
        </button>
      </div>

      {/* Products Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {products.map((product) => (
          <div key={product.id} className="card">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-meat-100 rounded-lg">
                <ShoppingBagIcon className="w-6 h-6 text-meat-600" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-gray-900 truncate">{product.name}</h3>
                {product.sku && <p className="text-sm text-gray-500">SKU: {product.sku}</p>}
                {product.category && (
                  <span className="inline-flex px-2 py-0.5 mt-1 text-xs font-medium rounded bg-gray-100 text-gray-800">
                    {product.category}
                  </span>
                )}
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-gray-100 grid grid-cols-2 gap-2 text-sm">
              <div>
                <p className="text-gray-500">Termin ważności</p>
                <p className="font-medium">{product.shelfLife ? `${product.shelfLife} dni` : '-'}</p>
              </div>
              <div>
                <p className="text-gray-500">Temp. przech.</p>
                <p className="font-medium">{product.storageTemp || '-'}</p>
              </div>
              {product.allergens && (
                <div className="col-span-2">
                  <p className="text-gray-500">Alergeny</p>
                  <p className="font-medium text-orange-600">{product.allergens}</p>
                </div>
              )}
            </div>
            <div className="flex gap-2 mt-4 pt-4 border-t border-gray-100">
              <button
                onClick={() => openModal(product)}
                className="flex-1 flex items-center justify-center gap-1 text-sm text-gray-600 hover:text-meat-600"
              >
                <PencilIcon className="w-4 h-4" /> Edytuj
              </button>
              <button
                onClick={() => handleDelete(product.id)}
                className="flex-1 flex items-center justify-center gap-1 text-sm text-gray-600 hover:text-red-600"
              >
                <TrashIcon className="w-4 h-4" /> Usuń
              </button>
            </div>
          </div>
        ))}
      </div>

      {products.length === 0 && (
        <div className="card text-center py-12">
          <ShoppingBagIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900">Brak produktów</h3>
          <p className="text-gray-500 mt-2">Dodaj pierwszy produkt do katalogu.</p>
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen p-4">
            <div className="fixed inset-0 bg-black bg-opacity-30" onClick={() => setIsModalOpen(false)}></div>
            <div className="relative bg-white rounded-xl shadow-xl max-w-lg w-full p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">
                {editingProduct ? 'Edytuj produkt' : 'Nowy produkt'}
              </h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nazwa *</label>
                    <input
                      type="text"
                      className="input"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">SKU</label>
                    <input
                      type="text"
                      className="input"
                      value={formData.sku}
                      onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Kategoria</label>
                    <input
                      type="text"
                      className="input"
                      placeholder="np. Kiełbasy, Wędliny"
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    />
                  </div>
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
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Jednostka</label>
                    <select
                      className="input"
                      value={formData.unit}
                      onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                    >
                      <option value="kg">kg</option>
                      <option value="szt">szt</option>
                      <option value="opak">opak</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Termin (dni)</label>
                    <input
                      type="number"
                      className="input"
                      min="1"
                      value={formData.shelfLife}
                      onChange={(e) => setFormData({ ...formData, shelfLife: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Temp.</label>
                    <input
                      type="text"
                      className="input"
                      placeholder="0-4°C"
                      value={formData.storageTemp}
                      onChange={(e) => setFormData({ ...formData, storageTemp: e.target.value })}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Alergeny</label>
                  <input
                    type="text"
                    className="input"
                    placeholder="np. soja, mleko, gorczyca"
                    value={formData.allergens}
                    onChange={(e) => setFormData({ ...formData, allergens: e.target.value })}
                  />
                </div>
                <div className="flex gap-3 pt-4">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 btn-secondary">
                    Anuluj
                  </button>
                  <button type="submit" className="flex-1 btn-primary">
                    {editingProduct ? 'Zapisz zmiany' : 'Dodaj produkt'}
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
