import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Bars3Icon,
  XMarkIcon,
  HomeIcon,
  BeakerIcon,
  TruckIcon,
  CubeIcon,
  ClipboardDocumentListIcon,
  SparklesIcon,
  BugAntIcon,
  AcademicCapIcon,
  ExclamationTriangleIcon,
  ClipboardDocumentCheckIcon,
  DocumentTextIcon,
  ShieldCheckIcon,
  ChartBarIcon,
  UsersIcon,
  Cog6ToothIcon,
  ArrowRightOnRectangleIcon,
  QueueListIcon,
  ArchiveBoxIcon,
  BuildingStorefrontIcon,
  SwatchIcon,
  ScaleIcon,
  DocumentMagnifyingGlassIcon,
} from '@heroicons/react/24/outline';

interface LayoutProps {
  children: React.ReactNode;
}

// Sekcja: Dane podstawowe (słowniki)
const masterDataNavigation = [
  { name: 'Produkty', href: '/produkty', icon: BuildingStorefrontIcon },
  { name: 'Surowce', href: '/surowce', icon: CubeIcon },
  { name: 'Dostawcy', href: '/dostawcy', icon: TruckIcon },
  { name: 'Materiały', href: '/materialy', icon: SwatchIcon },
];

// Sekcja: Operacje
const operationsNavigation = [
  { name: 'Przyjęcia surowców', href: '/przyjecia', icon: ArchiveBoxIcon },
  { name: 'Peklowanie', href: '/peklowanie', icon: BeakerIcon },
  { name: 'Produkcja', href: '/produkcja', icon: ClipboardDocumentListIcon },
];

// Sekcja: HACCP i Kontrola
const haccpNavigation = [
  { name: 'Temperatura', href: '/temperatura', icon: BeakerIcon },
  { name: 'Mycie i dezynfekcja', href: '/mycie', icon: SparklesIcon },
  { name: 'Kontrola DDD', href: '/ddd', icon: BugAntIcon },
  { name: 'Badania laboratoryjne', href: '/badania', icon: DocumentMagnifyingGlassIcon },
  { name: 'Audyty', href: '/audyty', icon: ClipboardDocumentCheckIcon },
  { name: 'Szkolenia', href: '/szkolenia', icon: AcademicCapIcon },
  { name: 'Działania korygujące', href: '/korekty', icon: ExclamationTriangleIcon },
  { name: 'Ewidencja odpadów', href: '/odpady', icon: ScaleIcon },
];

// Sekcja: Dokumentacja i Raporty
const docsNavigation = [
  { name: 'Traceability', href: '/traceability', icon: QueueListIcon },
  { name: 'Plan HACCP', href: '/haccp', icon: ShieldCheckIcon },
  { name: 'Dokumenty', href: '/dokumenty', icon: DocumentTextIcon },
  { name: 'Raporty', href: '/raporty', icon: ChartBarIcon },
];

const adminNavigation = [
  { name: 'Użytkownicy', href: '/uzytkownicy', icon: UsersIcon },
  { name: 'Ustawienia', href: '/ustawienia', icon: Cog6ToothIcon },
];

export default function Layout({ children }: LayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, logout } = useAuth();
  const location = useLocation();

  const isActive = (href: string) => {
    if (href === '/') return location.pathname === '/';
    return location.pathname.startsWith(href);
  };

  const renderNavSection = (items: typeof masterDataNavigation, title: string, closeSidebar = false) => (
    <>
      <div className="mt-4 mb-2">
        <p className="px-6 text-xs font-semibold text-gray-400 uppercase tracking-wider">{title}</p>
      </div>
      {items.map((item) => (
        <Link
          key={item.name}
          to={item.href}
          onClick={closeSidebar ? () => setSidebarOpen(false) : undefined}
          className={`flex items-center gap-3 px-6 py-2.5 text-sm font-medium transition-colors ${
            isActive(item.href) ? 'bg-meat-50 text-meat-600 border-r-4 border-meat-600' : 'text-gray-700 hover:bg-gray-50'
          }`}
        >
          <item.icon className="h-5 w-5" />
          {item.name}
        </Link>
      ))}
    </>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile sidebar */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="fixed inset-0 bg-gray-900/80" onClick={() => setSidebarOpen(false)} />
          <div className="fixed inset-y-0 left-0 w-72 bg-white shadow-xl overflow-y-auto flex flex-col">
            <div className="flex h-16 items-center justify-between px-6 border-b flex-shrink-0">
              <span className="text-xl font-bold text-meat-600">HACCP MLO</span>
              <button onClick={() => setSidebarOpen(false)}>
                <XMarkIcon className="h-6 w-6 text-gray-500" />
              </button>
            </div>
            <nav className="flex-1 py-4 overflow-y-auto">
              {/* Dashboard */}
              <Link
                to="/"
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-6 py-3 text-sm font-medium transition-colors ${
                  isActive('/') ? 'bg-meat-50 text-meat-600 border-r-4 border-meat-600' : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <HomeIcon className="h-5 w-5" />
                Dashboard
              </Link>

              {renderNavSection(masterDataNavigation, 'Dane podstawowe', true)}
              {renderNavSection(operationsNavigation, 'Operacje', true)}
              {renderNavSection(haccpNavigation, 'HACCP & Kontrola', true)}
              {renderNavSection(docsNavigation, 'Dokumentacja', true)}

              {user?.role === 'ADMIN' && renderNavSection(adminNavigation, 'Administracja', true)}
            </nav>
            {/* Mobile user info and logout */}
            <div className="border-t border-gray-200 p-4 flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-full bg-meat-100 flex items-center justify-center">
                  <span className="text-meat-600 font-semibold text-sm">
                    {user?.name?.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{user?.name}</p>
                  <p className="text-xs text-gray-500">{user?.role}</p>
                </div>
                <button
                  onClick={() => {
                    logout();
                    setSidebarOpen(false);
                  }}
                  className="p-2 text-gray-400 hover:text-red-500"
                  title="Wyloguj"
                >
                  <ArrowRightOnRectangleIcon className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
        <div className="flex flex-col flex-1 bg-white border-r border-gray-200 overflow-hidden">
          <div className="flex h-16 items-center px-6 border-b flex-shrink-0">
            <span className="text-xl font-bold text-meat-600">HACCP MLO</span>
          </div>
          <nav className="flex-1 overflow-y-auto py-4 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent hover:scrollbar-thumb-gray-400">
            {/* Dashboard */}
            <Link
              to="/"
              className={`flex items-center gap-3 px-6 py-2.5 text-sm font-medium transition-colors ${
                isActive('/') ? 'bg-meat-50 text-meat-600 border-r-4 border-meat-600' : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              <HomeIcon className="h-5 w-5" />
              Dashboard
            </Link>

            {renderNavSection(masterDataNavigation, 'Dane podstawowe')}
            {renderNavSection(operationsNavigation, 'Operacje')}
            {renderNavSection(haccpNavigation, 'HACCP & Kontrola')}
            {renderNavSection(docsNavigation, 'Dokumentacja')}

            {user?.role === 'ADMIN' && renderNavSection(adminNavigation, 'Administracja')}
          </nav>
          <div className="border-t border-gray-200 p-4 flex-shrink-0">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-full bg-meat-100 flex items-center justify-center">
                <span className="text-meat-600 font-semibold text-sm">
                  {user?.name?.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{user?.name}</p>
                <p className="text-xs text-gray-500">{user?.role}</p>
              </div>
              <button
                onClick={logout}
                className="p-2 text-gray-400 hover:text-gray-500"
                title="Wyloguj"
              >
                <ArrowRightOnRectangleIcon className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top bar */}
        <div className="sticky top-0 z-40 flex h-16 items-center gap-4 bg-white border-b border-gray-200 px-4 lg:px-8">
          <button
            className="lg:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <Bars3Icon className="h-6 w-6 text-gray-500" />
          </button>
          <div className="flex-1" />
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-500">
              {new Date().toLocaleDateString('pl-PL', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </span>
          </div>
        </div>

        {/* Page content */}
        <main className="p-4 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
