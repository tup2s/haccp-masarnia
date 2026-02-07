#!/bin/bash

# Skrypt startowy dla aplikacji HACCP MLO
# Uruchamia backend i frontend w trybie sieciowym

echo "🥩 Uruchamianie aplikacji HACCP MLO..."
echo ""

# Pobierz adres IP
IP_ADDRESS=$(hostname -I | awk '{print $1}')

echo "📡 Twoje adresy dostępowe:"
echo "   Frontend: http://${IP_ADDRESS}:5173"
echo "   Backend:  http://${IP_ADDRESS}:3001/api"
echo ""

# Funkcja do zatrzymania procesów
cleanup() {
    echo ""
    echo "🛑 Zatrzymywanie serwerów..."
    kill $BACKEND_PID $FRONTEND_PID 2>/dev/null
    exit 0
}

# Przechwytuj sygnał Ctrl+C
trap cleanup SIGINT SIGTERM

# Uruchom backend
echo "🚀 Uruchamianie backendu..."
cd "$(dirname "$0")/backend"
npm run dev &
BACKEND_PID=$!
sleep 3

# Uruchom frontend
echo "🎨 Uruchamianie frontendu..."
cd "$(dirname "$0")/frontend"
npm run dev &
FRONTEND_PID=$!

echo ""
echo "✅ Aplikacja uruchomiona!"
echo ""
echo "📱 Aby uzyskać dostęp z innych urządzeń w sieci:"
echo "   1. Upewnij się, że wszystkie urządzenia są w tej samej sieci WiFi/LAN"
echo "   2. Otwórz przeglądarkę na telefonie/tablecie/komputerze"
echo "   3. Wpisz adres: http://${IP_ADDRESS}:5173"
echo ""
echo "🔐 Domyślne logowanie:"
echo "   Email: admin@haccp.local"
echo "   Hasło: admin123"
echo ""
echo "Naciśnij Ctrl+C aby zatrzymać serwery..."

# Czekaj na procesy
wait $BACKEND_PID $FRONTEND_PID
