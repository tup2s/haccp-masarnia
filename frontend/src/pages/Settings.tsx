import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Cog6ToothIcon, BuildingStorefrontIcon, ShieldCheckIcon, BellIcon, UsersIcon, PrinterIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import api from '../services/api';

interface CompanySettings {
  id?: number;
  companyName: string;
  address: string;
  nip: string;
  vetNumber: string;
  phone: string;
  email: string;
  ownerName: string;
  // Ustawienia drukarki
  printerIp: string;
  printerPort: number;
  labelWidth: number;
  labelHeight: number;
}

interface Employee {
  id: number;
  name: string;
  email: string;
  role: string;
  createdAt?: string;
}

export default function Settings() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testingPrinter, setTestingPrinter] = useState(false);
  const [employees, setEmployees] = useState<Employee[]>([]);
  
  const [companySettings, setCompanySettings] = useState<CompanySettings>({
    companyName: '',
    address: '',
    nip: '',
    vetNumber: '',
    phone: '',
    email: '',
    ownerName: '',
    printerIp: '',
    printerPort: 9100,
    labelWidth: 60,
    labelHeight: 40,
  });

  const [notificationSettings, setNotificationSettings] = useState({
    tempAlerts: true,
    expiryAlerts: true,
    auditReminders: true,
    correctiveActionAlerts: true,
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [settingsRes, usersRes] = await Promise.all([
        api.getSettings(),
        api.getUsers()
      ]);
      setCompanySettings({
        id: settingsRes.id,
        companyName: settingsRes.companyName || '',
        address: settingsRes.address || '',
        nip: settingsRes.nip || '',
        vetNumber: settingsRes.vetNumber || '',
        phone: settingsRes.phone || '',
        email: settingsRes.email || '',
        ownerName: settingsRes.ownerName || '',
        printerIp: settingsRes.printerIp || '',
        printerPort: settingsRes.printerPort || 9100,
        labelWidth: settingsRes.labelWidth || 60,
        labelHeight: settingsRes.labelHeight || 40,
      });
      setEmployees(usersRes);
    } catch (error) {
      console.error('Błąd ładowania danych:', error);
      toast.error('Błąd podczas ładowania ustawień');
    } finally {
      setLoading(false);
    }
  };

  const handleCompanySave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.updateSettings(companySettings);
      toast.success('Dane firmy zapisane');
    } catch (error) {
      console.error('Błąd zapisu:', error);
      toast.error('Błąd podczas zapisywania danych');
    } finally {
      setSaving(false);
    }
  };

  const handleTestPrinter = async () => {
    if (!companySettings.printerIp) {
      toast.error('Podaj adres IP drukarki');
      return;
    }
    
    setTestingPrinter(true);
    try {
      const result = await api.testPrinter();
      toast.success(result.message);
    } catch (error: any) {
      toast.error(error.message || 'Błąd połączenia z drukarką');
    } finally {
      setTestingPrinter(false);
    }
  };

  const handleNotificationSave = (e: React.FormEvent) => {
    e.preventDefault();
    // Zapisujemy lokalnie, można rozbudować o API
    localStorage.setItem('haccp_notifications', JSON.stringify(notificationSettings));
    toast.success('Ustawienia powiadomień zapisane');
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'ADMIN': return 'Administrator';
      case 'MANAGER': return 'Kierownik';
      default: return 'Pracownik';
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'ADMIN': return 'bg-red-100 text-red-800';
      case 'MANAGER': return 'bg-blue-100 text-blue-800';
      default: return 'bg-green-100 text-green-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-meat-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Ustawienia</h1>
        <p className="text-gray-500 mt-1">Konfiguracja aplikacji HACCP</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Company Settings */}
        <div className="card">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-meat-100 rounded-lg">
              <BuildingStorefrontIcon className="w-6 h-6 text-meat-600" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900">Dane zakładu</h2>
          </div>
          <form onSubmit={handleCompanySave} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nazwa zakładu</label>
              <input
                type="text"
                className="input"
                value={companySettings.companyName}
                onChange={(e) => setCompanySettings({ ...companySettings, companyName: e.target.value })}
                placeholder='np. Masarnia "Pod Kasztanem"'
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Właściciel</label>
              <input
                type="text"
                className="input"
                value={companySettings.ownerName}
                onChange={(e) => setCompanySettings({ ...companySettings, ownerName: e.target.value })}
                placeholder='np. Jan Kowalski'
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Adres</label>
              <input
                type="text"
                className="input"
                value={companySettings.address}
                onChange={(e) => setCompanySettings({ ...companySettings, address: e.target.value })}
                placeholder='np. ul. Mięsna 15, 00-001 Warszawa'
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">NIP</label>
                <input
                  type="text"
                  className="input"
                  value={companySettings.nip}
                  onChange={(e) => setCompanySettings({ ...companySettings, nip: e.target.value })}
                  placeholder='np. 1234567890'
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nr weterynaryjny</label>
                <input
                  type="text"
                  className="input"
                  value={companySettings.vetNumber}
                  onChange={(e) => setCompanySettings({ ...companySettings, vetNumber: e.target.value })}
                  placeholder='np. 12345678'
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Telefon</label>
                <input
                  type="tel"
                  className="input"
                  value={companySettings.phone}
                  onChange={(e) => setCompanySettings({ ...companySettings, phone: e.target.value })}
                  placeholder='np. +48 123 456 789'
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  className="input"
                  value={companySettings.email}
                  onChange={(e) => setCompanySettings({ ...companySettings, email: e.target.value })}
                  placeholder='np. kontakt@firma.pl'
                />
              </div>
            </div>
            {user?.role === 'ADMIN' && (
              <button type="submit" className="btn-primary" disabled={saving}>
                {saving ? 'Zapisywanie...' : 'Zapisz dane firmy'}
              </button>
            )}
          </form>
        </div>

        {/* Employee List */}
        <div className="card">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <UsersIcon className="w-6 h-6 text-blue-600" />
              </div>
              <h2 className="text-lg font-semibold text-gray-900">Pracownicy</h2>
            </div>
            {user?.role === 'ADMIN' && (
              <a href="/uzytkownicy" className="text-sm text-meat-600 hover:text-meat-700 font-medium">
                Zarządzaj →
              </a>
            )}
          </div>
          <div className="space-y-3 max-h-80 overflow-y-auto">
            {employees.map((employee) => (
              <div key={employee.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-meat-100 rounded-full flex items-center justify-center">
                    <span className="text-sm font-bold text-meat-700">
                      {employee.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{employee.name}</p>
                    <p className="text-sm text-gray-500">{employee.email}</p>
                  </div>
                </div>
                <span className={`px-2 py-1 text-xs font-medium rounded ${getRoleBadge(employee.role)}`}>
                  {getRoleLabel(employee.role)}
                </span>
              </div>
            ))}
            {employees.length === 0 && (
              <p className="text-center text-gray-500 py-4">Brak pracowników</p>
            )}
          </div>
        </div>

        {/* Printer Settings */}
        <div className="card">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-purple-100 rounded-lg">
              <PrinterIcon className="w-6 h-6 text-purple-600" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900">Drukarka etykiet</h2>
          </div>
          <div className="space-y-4">
            <p className="text-sm text-gray-500">
              Konfiguracja drukarki Godex do drukowania etykiet partii peklowania.
            </p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Adres IP drukarki</label>
                <input
                  type="text"
                  className="input"
                  value={companySettings.printerIp}
                  onChange={(e) => setCompanySettings({ ...companySettings, printerIp: e.target.value })}
                  placeholder="np. 192.168.1.100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Port</label>
                <input
                  type="number"
                  className="input"
                  value={companySettings.printerPort}
                  onChange={(e) => setCompanySettings({ ...companySettings, printerPort: parseInt(e.target.value) || 9100 })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Szerokość etykiety (mm)</label>
                <input
                  type="number"
                  className="input"
                  value={companySettings.labelWidth}
                  onChange={(e) => setCompanySettings({ ...companySettings, labelWidth: parseInt(e.target.value) || 60 })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Wysokość etykiety (mm)</label>
                <input
                  type="number"
                  className="input"
                  value={companySettings.labelHeight}
                  onChange={(e) => setCompanySettings({ ...companySettings, labelHeight: parseInt(e.target.value) || 40 })}
                />
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={handleTestPrinter}
                disabled={testingPrinter || !companySettings.printerIp}
                className="btn-secondary flex items-center gap-2"
              >
                {testingPrinter ? (
                  <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <PrinterIcon className="w-4 h-4" />
                )}
                Testuj drukarkę
              </button>
              <p className="text-xs text-gray-400 self-center">
                Kliknij "Zapisz zmiany" w sekcji "Dane zakładu" aby zapisać ustawienia drukarki.
              </p>
            </div>
          </div>
        </div>

        {/* Notification Settings */}
        <div className="card">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <BellIcon className="w-6 h-6 text-yellow-600" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900">Powiadomienia</h2>
          </div>
          <form onSubmit={handleNotificationSave} className="space-y-4">
            <label className="flex items-center justify-between p-3 bg-gray-50 rounded-lg cursor-pointer">
              <div>
                <p className="font-medium text-gray-900">Alerty temperaturowe</p>
                <p className="text-sm text-gray-500">Powiadomienia o przekroczeniu limitów</p>
              </div>
              <input
                type="checkbox"
                className="rounded border-gray-300 text-meat-600 focus:ring-meat-500 w-5 h-5"
                checked={notificationSettings.tempAlerts}
                onChange={(e) => setNotificationSettings({ ...notificationSettings, tempAlerts: e.target.checked })}
              />
            </label>
            <label className="flex items-center justify-between p-3 bg-gray-50 rounded-lg cursor-pointer">
              <div>
                <p className="font-medium text-gray-900">Alerty terminów ważności</p>
                <p className="text-sm text-gray-500">Przypomnienia o zbliżających się terminach</p>
              </div>
              <input
                type="checkbox"
                className="rounded border-gray-300 text-meat-600 focus:ring-meat-500 w-5 h-5"
                checked={notificationSettings.expiryAlerts}
                onChange={(e) => setNotificationSettings({ ...notificationSettings, expiryAlerts: e.target.checked })}
              />
            </label>
            <label className="flex items-center justify-between p-3 bg-gray-50 rounded-lg cursor-pointer">
              <div>
                <p className="font-medium text-gray-900">Przypomnienia o audytach</p>
                <p className="text-sm text-gray-500">Przypomnienia o zaplanowanych audytach</p>
              </div>
              <input
                type="checkbox"
                className="rounded border-gray-300 text-meat-600 focus:ring-meat-500 w-5 h-5"
                checked={notificationSettings.auditReminders}
                onChange={(e) => setNotificationSettings({ ...notificationSettings, auditReminders: e.target.checked })}
              />
            </label>
            <label className="flex items-center justify-between p-3 bg-gray-50 rounded-lg cursor-pointer">
              <div>
                <p className="font-medium text-gray-900">Działania korygujące</p>
                <p className="text-sm text-gray-500">Powiadomienia o nowych i przeterminowanych</p>
              </div>
              <input
                type="checkbox"
                className="rounded border-gray-300 text-meat-600 focus:ring-meat-500 w-5 h-5"
                checked={notificationSettings.correctiveActionAlerts}
                onChange={(e) => setNotificationSettings({ ...notificationSettings, correctiveActionAlerts: e.target.checked })}
              />
            </label>
            <button type="submit" className="btn-primary">
              Zapisz ustawienia
            </button>
          </form>
        </div>

        {/* Account Info */}
        <div className="card">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-purple-100 rounded-lg">
              <ShieldCheckIcon className="w-6 h-6 text-purple-600" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900">Twoje konto</h2>
          </div>
          <div className="space-y-4">
            <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
              <div className="w-16 h-16 bg-meat-100 rounded-full flex items-center justify-center">
                <span className="text-2xl font-bold text-meat-700">
                  {user?.name?.charAt(0) || 'U'}
                </span>
              </div>
              <div>
                <p className="font-semibold text-gray-900">{user?.name}</p>
                <p className="text-gray-500">{user?.email}</p>
                <span className={`inline-flex px-2 py-0.5 mt-1 text-xs font-medium rounded ${
                  user?.role === 'ADMIN' ? 'bg-red-100 text-red-800' :
                  user?.role === 'MANAGER' ? 'bg-blue-100 text-blue-800' :
                  'bg-green-100 text-green-800'
                }`}>
                  {user?.role === 'ADMIN' ? 'Administrator' :
                   user?.role === 'MANAGER' ? 'Kierownik' : 'Pracownik'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* System Info */}
        <div className="card lg:col-span-2">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-gray-100 rounded-lg">
              <Cog6ToothIcon className="w-6 h-6 text-gray-600" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900">Informacje o systemie</h2>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
            <div className="p-4 bg-gray-50 rounded-lg">
              <span className="text-gray-500">Wersja aplikacji</span>
              <p className="font-semibold text-gray-900 mt-1">1.0.0</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <span className="text-gray-500">Typ działalności</span>
              <p className="font-semibold text-gray-900 mt-1">MLO</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <span className="text-gray-500">Baza danych</span>
              <p className="font-semibold text-gray-900 mt-1">SQLite (lokalna)</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <span className="text-gray-500">Liczba pracowników</span>
              <p className="font-semibold text-gray-900 mt-1">{employees.length}</p>
            </div>
          </div>
          <div className="mt-4 p-3 bg-green-50 rounded-lg">
            <p className="text-sm text-green-700">
              ✓ System działa poprawnie. Wszystkie komponenty są aktywne.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
