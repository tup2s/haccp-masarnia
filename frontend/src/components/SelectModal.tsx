import { useState, useMemo } from 'react';
import { MagnifyingGlassIcon, XMarkIcon, FunnelIcon } from '@heroicons/react/24/outline';
import dayjs from 'dayjs';

// Typy filtrów czasowych
export type TimeFilter = 'all' | 'today' | 'yesterday' | 'this_week' | 'last_week' | 'this_month';

export const TIME_FILTERS: { value: TimeFilter; label: string }[] = [
  { value: 'all', label: 'Wszystkie' },
  { value: 'today', label: 'Dzisiaj' },
  { value: 'yesterday', label: 'Wczoraj' },
  { value: 'this_week', label: 'Ten tydzień' },
  { value: 'last_week', label: 'Poprzedni tydzień' },
  { value: 'this_month', label: 'Ten miesiąc' },
];

// Funkcja filtrowania po dacie
export const filterByTime = (
  items: any[],
  filter: TimeFilter,
  dateField: string = 'createdAt'
): any[] => {
  if (filter === 'all') return items;
  
  const now = dayjs();
  const today = now.startOf('day');
  const yesterday = today.subtract(1, 'day');
  const thisWeekStart = now.startOf('week');
  const lastWeekStart = thisWeekStart.subtract(1, 'week');
  const lastWeekEnd = thisWeekStart.subtract(1, 'day');
  const thisMonthStart = now.startOf('month');

  return items.filter(item => {
    const itemDate = dayjs(item[dateField]);
    if (!itemDate.isValid()) return true;
    
    switch (filter) {
      case 'today':
        return itemDate.isSame(today, 'day');
      case 'yesterday':
        return itemDate.isSame(yesterday, 'day');
      case 'this_week':
        return itemDate.isAfter(thisWeekStart.subtract(1, 'day')) && itemDate.isBefore(now.add(1, 'day'));
      case 'last_week':
        return itemDate.isAfter(lastWeekStart.subtract(1, 'day')) && itemDate.isBefore(lastWeekEnd.add(1, 'day'));
      case 'this_month':
        return itemDate.isAfter(thisMonthStart.subtract(1, 'day')) && itemDate.isBefore(now.add(1, 'day'));
      default:
        return true;
    }
  });
};

interface SelectModalProps<T> {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (item: T) => void;
  title: string;
  items: T[];
  renderItem: (item: T) => React.ReactNode;
  searchFields?: (keyof T)[];
  dateField?: string;
  showTimeFilters?: boolean;
  emptyMessage?: string;
  colorScheme?: 'default' | 'meat' | 'purple' | 'green' | 'blue' | 'orange';
  getItemId: (item: T) => number | string;
}

export function SelectModal<T>({
  isOpen,
  onClose,
  onSelect,
  title,
  items,
  renderItem,
  searchFields = [],
  dateField,
  showTimeFilters = true,
  emptyMessage = 'Brak elementów do wyboru',
  colorScheme = 'default',
  getItemId,
}: SelectModalProps<T>) {
  const [filter, setFilter] = useState<TimeFilter>('all');
  const [search, setSearch] = useState('');

  const colorClasses = {
    default: {
      border: 'border-gray-200',
      hoverBorder: 'hover:border-gray-400',
      hoverBg: 'hover:bg-gray-50',
      selectText: 'text-gray-600',
    },
    meat: {
      border: 'border-gray-200',
      hoverBorder: 'hover:border-meat-400',
      hoverBg: 'hover:bg-meat-50',
      selectText: 'text-meat-600',
    },
    purple: {
      border: 'border-purple-200',
      hoverBorder: 'hover:border-purple-400',
      hoverBg: 'hover:bg-purple-50',
      selectText: 'text-purple-600',
    },
    green: {
      border: 'border-green-200',
      hoverBorder: 'hover:border-green-400',
      hoverBg: 'hover:bg-green-50',
      selectText: 'text-green-600',
    },
    blue: {
      border: 'border-blue-200',
      hoverBorder: 'hover:border-blue-400',
      hoverBg: 'hover:bg-blue-50',
      selectText: 'text-blue-600',
    },
    orange: {
      border: 'border-orange-200',
      hoverBorder: 'hover:border-orange-400',
      hoverBg: 'hover:bg-orange-50',
      selectText: 'text-orange-600',
    },
  };

  const colors = colorClasses[colorScheme];

  const filteredItems = useMemo(() => {
    let filtered = items;
    
    // Filtrowanie po czasie
    if (showTimeFilters && dateField && filter !== 'all') {
      filtered = filterByTime(filtered, filter, dateField);
    }
    
    // Filtrowanie po tekście
    if (search.trim() && searchFields.length > 0) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter(item => 
        searchFields.some(field => {
          const value = getNestedValue(item, field as string);
          return value && String(value).toLowerCase().includes(searchLower);
        })
      );
    }
    
    return filtered;
  }, [items, filter, search, showTimeFilters, dateField, searchFields]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="fixed inset-0 bg-black bg-opacity-40" onClick={onClose}></div>
        <div className="relative bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[85vh] flex flex-col">
          {/* Header */}
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
              <button
                onClick={onClose}
                className="p-1 hover:bg-gray-100 rounded-lg"
              >
                <XMarkIcon className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Filtry czasowe */}
            {showTimeFilters && dateField && (
              <div className="flex flex-wrap gap-2 mb-3">
                <FunnelIcon className="w-4 h-4 text-gray-400 mt-1.5" />
                {TIME_FILTERS.map(f => (
                  <button
                    key={f.value}
                    type="button"
                    onClick={() => setFilter(f.value)}
                    className={`px-3 py-1 text-sm rounded-full transition-colors ${
                      filter === f.value
                        ? 'bg-meat-600 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            )}

            {/* Wyszukiwarka */}
            <div className="relative">
              <MagnifyingGlassIcon className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                className="input pl-10"
                placeholder="Szukaj..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                autoFocus
              />
            </div>
          </div>

          {/* Lista elementów */}
          <div className="flex-1 overflow-y-auto p-4">
            <div className="space-y-2">
              {filteredItems.length === 0 ? (
                <p className="text-center text-gray-500 py-8">{emptyMessage}</p>
              ) : (
                filteredItems.map(item => (
                  <button
                    key={getItemId(item)}
                    type="button"
                    onClick={() => {
                      onSelect(item);
                      onClose();
                    }}
                    className={`w-full p-3 border ${colors.border} rounded-lg ${colors.hoverBorder} ${colors.hoverBg} transition-colors text-left flex items-center justify-between group`}
                  >
                    <div className="flex-1">{renderItem(item)}</div>
                    <span className={`${colors.selectText} opacity-0 group-hover:opacity-100 transition-opacity ml-2`}>
                      Wybierz →
                    </span>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-gray-200 bg-gray-50 rounded-b-xl">
            <button
              type="button"
              onClick={onClose}
              className="w-full btn-secondary"
            >
              Anuluj
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Helper do pobierania zagnieżdżonych wartości (np. "rawMaterial.name")
function getNestedValue(obj: any, path: string): any {
  return path.split('.').reduce((current, key) => current?.[key], obj);
}

export default SelectModal;
