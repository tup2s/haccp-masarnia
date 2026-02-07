import { useState, useEffect } from 'react';
import { api } from '../services/api';
import { PrinterIcon, CalendarIcon, ChartBarIcon } from '@heroicons/react/24/outline';
import dayjs from 'dayjs';
import 'dayjs/locale/pl';

dayjs.locale('pl');

interface ReportType {
  id: string;
  name: string;
  code: string;
  description: string;
  periodType: 'week' | 'month' | 'range';
}

export default function Reports() {
  const [reports, setReports] = useState<ReportType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Stan dla formularzy wyboru okresu
  const [weekDate, setWeekDate] = useState(dayjs().startOf('week').format('YYYY-MM-DD'));
  const [monthDate, setMonthDate] = useState(dayjs().format('YYYY-MM'));
  const [rangeStart, setRangeStart] = useState(dayjs().startOf('week').format('YYYY-MM-DD'));
  const [rangeEnd, setRangeEnd] = useState(dayjs().format('YYYY-MM-DD'));

  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = async () => {
    try {
      const data = await api.getDataReports();
      setReports(data);
    } catch (error) {
      console.error('Błąd ładowania raportów:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const openReport = (reportId: string, params: Record<string, string>) => {
    const url = api.getDataReportUrl(reportId, params);
    window.open(url, '_blank');
  };

  const handleGenerateReport = (report: ReportType) => {
    let params: Record<string, string> = {};
    
    switch (report.periodType) {
      case 'week':
        params = { week: weekDate };
        break;
      case 'month':
        params = { month: monthDate };
        break;
      case 'range':
        params = { startDate: rangeStart, endDate: rangeEnd };
        break;
    }
    
    openReport(report.id, params);
  };

  const getReportIcon = (reportId: string) => {
    const icons: Record<string, string> = {
      'temperature-weekly': '🌡️',
      'reception': '🥩',
      'cleaning': '🧹',
      'production': '🏭',
      'pest-control': '🐀',
      'curing': '🧂',
    };
    return icons[reportId] || '📊';
  };

  // Szybkie przyciski tygodniowe
  const quickWeeks = [
    { label: 'Bieżący tydzień', date: dayjs().startOf('week') },
    { label: 'Poprzedni tydzień', date: dayjs().subtract(1, 'week').startOf('week') },
    { label: '2 tygodnie temu', date: dayjs().subtract(2, 'week').startOf('week') },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-meat-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Raporty z danymi</h1>
        <p className="text-gray-500 mt-1">Formularze wypełnione danymi z systemu - do druku i archiwizacji</p>
      </div>

      {/* Info box */}
      <div className="card bg-blue-50 border border-blue-200">
        <div className="flex gap-3">
          <div className="text-blue-600 text-2xl">📋</div>
          <div>
            <h4 className="font-medium text-blue-900">Dokumentacja do teczki HACCP</h4>
            <p className="text-sm text-blue-700 mt-1">
              Wybierz okres i wygeneruj raport wypełniony danymi z systemu. 
              Wydrukuj, podpisz i włóż do dokumentacji HACCP wymaganej przez PIW.
            </p>
          </div>
        </div>
      </div>

      {/* Szybki wybór tygodnia */}
      <div className="card">
        <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <CalendarIcon className="w-5 h-5" />
          Szybkie raporty tygodniowe
        </h3>
        <div className="grid md:grid-cols-3 gap-4">
          {quickWeeks.map((week) => (
            <div key={week.label} className="border rounded-lg p-4 bg-gray-50">
              <p className="font-medium text-gray-900">{week.label}</p>
              <p className="text-sm text-gray-500 mb-3">
                {week.date.format('DD.MM')} - {week.date.add(6, 'day').format('DD.MM.YYYY')}
              </p>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => openReport('temperature-weekly', { week: week.date.format('YYYY-MM-DD') })}
                  className="btn-secondary text-xs px-2 py-1"
                >
                  🌡️ Temperatura
                </button>
                <button
                  onClick={() => openReport('reception', { startDate: week.date.format('YYYY-MM-DD'), endDate: week.date.add(6, 'day').format('YYYY-MM-DD') })}
                  className="btn-secondary text-xs px-2 py-1"
                >
                  🥩 Przyjęcia
                </button>
                <button
                  onClick={() => openReport('cleaning', { startDate: week.date.format('YYYY-MM-DD'), endDate: week.date.add(6, 'day').format('YYYY-MM-DD') })}
                  className="btn-secondary text-xs px-2 py-1"
                >
                  🧹 Mycie
                </button>
                <button
                  onClick={() => openReport('production', { startDate: week.date.format('YYYY-MM-DD'), endDate: week.date.add(6, 'day').format('YYYY-MM-DD') })}
                  className="btn-secondary text-xs px-2 py-1"
                >
                  🏭 Produkcja
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Wszystkie raporty */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {reports.map((report) => (
          <div key={report.id} className="card hover:shadow-lg transition-shadow">
            <div className="flex items-start gap-3 mb-4">
              <div className="text-3xl">{getReportIcon(report.id)}</div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900">{report.name}</h3>
                <p className="text-xs text-gray-500">{report.code}</p>
                <p className="text-sm text-gray-600 mt-1">{report.description}</p>
              </div>
            </div>

            {/* Wybór okresu w zależności od typu */}
            <div className="space-y-3 border-t pt-4">
              {report.periodType === 'week' && (
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Wybierz tydzień (poniedziałek)</label>
                  <input
                    type="date"
                    className="input"
                    value={weekDate}
                    onChange={(e) => setWeekDate(e.target.value)}
                  />
                </div>
              )}

              {report.periodType === 'month' && (
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Wybierz miesiąc</label>
                  <input
                    type="month"
                    className="input"
                    value={monthDate}
                    onChange={(e) => setMonthDate(e.target.value)}
                  />
                </div>
              )}

              {report.periodType === 'range' && (
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Od</label>
                    <input
                      type="date"
                      className="input"
                      value={rangeStart}
                      onChange={(e) => setRangeStart(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Do</label>
                    <input
                      type="date"
                      className="input"
                      value={rangeEnd}
                      onChange={(e) => setRangeEnd(e.target.value)}
                    />
                  </div>
                </div>
              )}

              <button
                onClick={() => handleGenerateReport(report)}
                className="w-full btn-primary flex items-center justify-center gap-2"
              >
                <PrinterIcon className="w-5 h-5" />
                Generuj i drukuj
              </button>
            </div>
          </div>
        ))}
      </div>

      {reports.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <ChartBarIcon className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>Brak dostępnych raportów</p>
        </div>
      )}
    </div>
  );
}
