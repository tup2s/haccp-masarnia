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

---

# ☁️ Wdrożenie w Chmurze (Darmowe)

Ten dokument opisuje jak wdrożyć aplikację HACCP na darmowych usługach chmurowych.

## 📋 Wymagania

- Konto na [GitHub](https://github.com) (już masz: tup2s/haccp-masarnia)
- Konto na [Neon.tech](https://neon.tech) (baza PostgreSQL)
- Konto na [Render.com](https://render.com) (backend)
- Konto na [Vercel](https://vercel.com) (frontend)

---

## 1️⃣ Baza danych - Neon.tech

### Krok 1: Załóż konto
1. Wejdź na https://neon.tech
2. Kliknij "Sign Up" i zaloguj się przez GitHub

### Krok 2: Utwórz projekt
1. Kliknij "New Project"
2. Nazwa: `haccp-masarnia`
3. Region: **Frankfurt** (najbliżej Polski)
4. Kliknij "Create Project"

### Krok 3: Skopiuj connection string
1. Po utworzeniu projektu zobaczysz **Connection string**
2. Skopiuj go - będzie wyglądał tak:
   ```
   postgresql://user:password@ep-xxx.eu-central-1.aws.neon.tech/neondb?sslmode=require
   ```
3. **Zapisz go bezpiecznie** - będziesz go potrzebować w Render.com

---

## 2️⃣ Backend - Render.com

### Krok 1: Załóż konto
1. Wejdź na https://render.com
2. Kliknij "Get Started" i zaloguj się przez GitHub

### Krok 2: Utwórz Web Service
1. Kliknij "New +" → "Web Service"
2. Połącz z repozytorium GitHub: `tup2s/haccp-masarnia`
3. Wypełnij formularz:
   - **Name**: `haccp-backend`
   - **Region**: Frankfurt (EU Central)
   - **Branch**: main
   - **Root Directory**: `backend`
   - **Runtime**: Node
   - **Build Command**: `npm install && npx prisma generate && npm run build`
   - **Start Command**: `npx prisma migrate deploy && npm start`
   - **Plan**: Free

### Krok 3: Ustaw zmienne środowiskowe
W sekcji "Environment" dodaj:

| Zmienna | Wartość |
|---------|---------|
| `DATABASE_URL` | Twój connection string z Neon.tech |
| `JWT_SECRET` | Kliknij "Generate" lub wpisz własny długi string |
| `NODE_ENV` | `production` |

### Krok 4: Deploy
1. Kliknij "Create Web Service"
2. Poczekaj na build (5-10 minut za pierwszym razem)
3. Po zakończeniu skopiuj URL np. `https://haccp-backend.onrender.com`

### Krok 5: Zainicjuj bazę danych
Po pierwszym deploy musisz utworzyć tabele i dodać dane:

1. W panelu Render, wejdź w swój serwis
2. Kliknij "Shell" (zakładka po lewej)
3. Uruchom:
   ```bash
   npx prisma db push
   npx tsx prisma/seed.ts
   ```

**UWAGA**: Darmowy plan Render usypia serwis po 15 min nieaktywności. Pierwsze żądanie po uśpieniu może trwać 30-60 sekund.

---

## 3️⃣ Frontend - Vercel

### Krok 1: Załóż konto
1. Wejdź na https://vercel.com
2. Kliknij "Sign Up" i zaloguj się przez GitHub

### Krok 2: Zaimportuj projekt
1. Kliknij "Add New..." → "Project"
2. Zaimportuj repozytorium `haccp-masarnia`
3. Wypełnij formularz:
   - **Framework Preset**: Vite
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`

### Krok 3: Ustaw zmienne środowiskowe
W sekcji "Environment Variables" dodaj:

| Zmienna | Wartość |
|---------|---------|
| `VITE_API_URL` | `https://haccp-backend.onrender.com/api` |

(Zamień `haccp-backend` na nazwę Twojego serwisu z Render)

### Krok 4: Deploy
1. Kliknij "Deploy"
2. Poczekaj 1-2 minuty
3. Gotowe! Twoja aplikacja jest dostępna pod adresem np. `https://haccp-masarnia.vercel.app`

---

## 🔧 Po wdrożeniu

### Logowanie
- **Email**: admin@masarnia.pl
- **Hasło**: admin123

### Aktualizacje
Każdy push do branch `main` automatycznie:
- Zaktualizuje backend na Render
- Zaktualizuje frontend na Vercel

### Monitorowanie
- **Render**: Panel → Logs (logi backendu)
- **Vercel**: Panel → Deployments (logi frontendu)
- **Neon**: Dashboard → Monitoring (statystyki bazy)

---

## 🆘 Rozwiązywanie problemów - Chmura

### "Błąd połączenia z API"
1. Sprawdź czy backend na Render działa (nie jest uśpiony)
2. Sprawdź czy `VITE_API_URL` jest poprawne w Vercel
3. Sprawdź logi w Render

### "Błąd bazy danych"
1. Sprawdź czy `DATABASE_URL` w Render jest poprawne
2. Uruchom w Render Shell: `npx prisma db push`

### "Strona się nie ładuje"
1. Sprawdź Console w przeglądarce (F12)
2. Sprawdź logi deploymentu w Vercel

---

## 💰 Limity darmowych planów

| Usługa | Limit |
|--------|-------|
| **Neon** | 0.5 GB storage, 1 projekt |
| **Render** | 750h/miesiąc, usypianie po 15 min |
| **Vercel** | 100 GB bandwidth, unlimited deploys |

Dla małej masarni te limity są w pełni wystarczające!

---

## 📞 Wsparcie

Jeśli masz problemy, sprawdź dokumentację:
- Neon: https://neon.tech/docs
- Render: https://render.com/docs
- Vercel: https://vercel.com/docs
