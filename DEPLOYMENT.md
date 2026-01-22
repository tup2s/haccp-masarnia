# 🥩 HACCP MLO - Wdrożenie i Dostęp Sieciowy

## Szybki Start

### Uruchomienie na jednym komputerze (głównym serwerze):

```bash
cd /home/tup2s/Desktop/HACCP
chmod +x start.sh
./start.sh
```

Po uruchomieniu skrypt wyświetli adres IP, pod którym aplikacja jest dostępna.

---

## Dostęp z innych urządzeń

### Wymagania:
- Wszystkie urządzenia muszą być w **tej samej sieci WiFi/LAN**
- Na głównym komputerze musi działać aplikacja (backend + frontend)

### Jak połączyć się z telefonu/tabletu/innego komputera:

1. Sprawdź adres IP głównego komputera:
   ```bash
   hostname -I | awk '{print $1}'
   ```
   
2. Na innym urządzeniu otwórz przeglądarkę i wpisz:
   ```
   http://ADRES_IP:5173
   ```
   np. `http://192.168.1.100:5173`

---

## Ręczne uruchomienie serwerów

### Terminal 1 - Backend:
```bash
cd /home/tup2s/Desktop/HACCP/backend
npm run dev
```

### Terminal 2 - Frontend:
```bash
cd /home/tup2s/Desktop/HACCP/frontend
npm run dev
```

---

## Porty używane przez aplikację

| Usługa   | Port  | Opis                        |
|----------|-------|-----------------------------|
| Frontend | 5173  | Interfejs użytkownika React |
| Backend  | 3001  | API REST (Node.js/Express)  |

---

## Firewall

Jeśli urządzenia zewnętrzne nie mogą się połączyć, może być konieczne otwarcie portów:

```bash
# Ubuntu/Debian
sudo ufw allow 5173
sudo ufw allow 3001

# Fedora/RHEL
sudo firewall-cmd --add-port=5173/tcp --permanent
sudo firewall-cmd --add-port=3001/tcp --permanent
sudo firewall-cmd --reload
```

---

## Domyślne dane logowania

| Rola          | Email              | Hasło     |
|---------------|--------------------|-----------|
| Administrator | admin@haccp.local  | admin123  |

**WAŻNE:** Po pierwszym logowaniu zmień hasło w ustawieniach!

---

## Baza danych

Aplikacja używa SQLite - lokalnej bazy danych, która:
- ✅ Nie wymaga instalacji serwera baz danych
- ✅ Wszystkie dane są w jednym pliku: `backend/prisma/dev.db`
- ✅ Łatwa do backupu (wystarczy skopiować plik)

### Backup bazy:
```bash
cp /home/tup2s/Desktop/HACCP/backend/prisma/dev.db ~/haccp_backup_$(date +%Y%m%d).db
```

---

## Zarządzanie użytkownikami (pracownikami)

1. Zaloguj się jako Administrator
2. Przejdź do **Ustawienia** → kliknij "Zarządzaj →" przy sekcji Pracownicy
3. Lub bezpośrednio do **Menu → Użytkownicy**

Możesz:
- Dodawać nowych pracowników
- Edytować ich dane i role
- Usuwać konta

### Role użytkowników:
- **Administrator** - pełny dostęp, edycja/usuwanie wpisów
- **Kierownik** - rozszerzone uprawnienia
- **Pracownik** - podstawowe operacje

---

## Rozwiązywanie problemów

### Problem: Nie można połączyć się z innego urządzenia

1. Sprawdź czy oba urządzenia są w tej samej sieci
2. Sprawdź czy firewall nie blokuje portów
3. Upewnij się, że używasz poprawnego adresu IP

### Problem: Błąd połączenia z API

1. Sprawdź czy backend działa na porcie 3001
2. Upewnij się, że plik `frontend/src/services/api.ts` ma poprawny baseURL

### Problem: Baza danych nie działa

```bash
cd /home/tup2s/Desktop/HACCP/backend
npx prisma db push
```

---

## Produkcja (opcjonalnie)

Dla trwałego wdrożenia produkcyjnego:

### 1. Zbuduj frontend:
```bash
cd frontend
npm run build
```

### 2. Użyj PM2 do zarządzania procesem:
```bash
npm install -g pm2
cd backend
pm2 start npm --name "haccp-backend" -- run dev
```

### 3. Serwuj frontend przez Nginx lub podobny serwer
