# 🌐 Dostęp do HACCP z Internetu (inna sieć)

## Opcja 1: Tunel ngrok (NAJPROSTSZE - darmowe)

Ngrok tworzy tymczasowy publiczny adres URL, który działa z dowolnego miejsca na świecie.

### Instalacja ngrok:

```bash
# Ubuntu/Debian
curl -s https://ngrok-agent.s3.amazonaws.com/ngrok.asc | sudo tee /etc/apt/trusted.gpg.d/ngrok.asc >/dev/null
echo "deb https://ngrok-agent.s3.amazonaws.com buster main" | sudo tee /etc/apt/sources.list.d/ngrok.list
sudo apt update && sudo apt install ngrok

# lub pobierz ręcznie z: https://ngrok.com/download
```

### Rejestracja (darmowa):
1. Wejdź na https://ngrok.com
2. Załóż darmowe konto
3. Skopiuj swój authtoken
4. Uruchom: `ngrok config add-authtoken TWOJ_TOKEN`

### Uruchomienie:

```bash
# Terminal 1 - Backend musi działać lokalnie
cd /home/tup2s/Desktop/HACCP/backend && npm run dev

# Terminal 2 - Frontend musi działać lokalnie  
cd /home/tup2s/Desktop/HACCP/frontend && npm run dev

# Terminal 3 - Tunel ngrok do frontendu
ngrok http 5173
```

Ngrok wyświetli publiczny adres, np:
```
Forwarding   https://abc123.ngrok.io -> http://localhost:5173
```

Użyj tego adresu `https://abc123.ngrok.io` na telefonie z dowolnego miejsca!

⚠️ **UWAGA:** Darmowy ngrok zmienia adres przy każdym uruchomieniu.

---

## Opcja 2: Cloudflare Tunnel (darmowe, stały adres)

Jeśli masz domenę w Cloudflare, możesz użyć darmowego tunelu ze stałym adresem.

### Instalacja:
```bash
# Ubuntu/Debian
curl -L --output cloudflared.deb https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb
sudo dpkg -i cloudflared.deb
```

### Szybki tunel (bez konfiguracji):
```bash
cloudflared tunnel --url http://localhost:5173
```

---

## Opcja 3: Port Forwarding na routerze

Jeśli masz stały adres IP lub używasz DDNS:

1. Zaloguj się do routera (zazwyczaj 192.168.1.1)
2. Znajdź "Port Forwarding" lub "Virtual Server"
3. Dodaj regułę:
   - Port zewnętrzny: 5173
   - Port wewnętrzny: 5173
   - Adres IP: adres komputera z HACCP
   - Protokół: TCP

4. Sprawdź swój publiczny IP: `curl ifconfig.me`
5. Dostęp: `http://TWOJ_PUBLICZNY_IP:5173`

⚠️ **Ryzyko bezpieczeństwa** - otwierasz port na świat!

---

## Opcja 4: Tailscale VPN (POLECANE dla firmy)

Tailscale tworzy bezpieczną prywatną sieć między urządzeniami.

### Instalacja:
```bash
curl -fsSL https://tailscale.com/install.sh | sh
sudo tailscale up
```

### Zalety:
- ✅ Bezpieczne (szyfrowane)
- ✅ Działa przez NAT
- ✅ Stałe adresy IP
- ✅ Darmowe dla 3 użytkowników

Po instalacji na wszystkich urządzeniach, używasz adresu Tailscale zamiast lokalnego.

---

## Opcja 5: VPS w chmurze (profesjonalne)

Wdrożenie na serwer w chmurze (np. DigitalOcean, Hetzner, OVH):

### Koszt: ~20-50 zł/miesiąc

### Kroki:
1. Wynajmij VPS z Ubuntu
2. Zainstaluj Node.js, npm
3. Skopiuj projekt na serwer
4. Użyj PM2 do uruchomienia
5. Skonfiguruj Nginx jako reverse proxy
6. Dodaj certyfikat SSL (Let's Encrypt)

---

## Porównanie opcji

| Opcja | Koszt | Trudność | Bezpieczeństwo | Stały adres |
|-------|-------|----------|----------------|-------------|
| ngrok | Darmowy | ⭐ Łatwe | ⭐⭐⭐ | ❌ Zmienia się |
| Cloudflare | Darmowy | ⭐⭐ Średnie | ⭐⭐⭐⭐ | ✅ Tak |
| Port Forward | Darmowy | ⭐⭐ Średnie | ⭐ Niskie | ⚠️ Zależy od ISP |
| Tailscale | Darmowy | ⭐ Łatwe | ⭐⭐⭐⭐⭐ | ✅ Tak |
| VPS | Płatny | ⭐⭐⭐ Trudne | ⭐⭐⭐⭐ | ✅ Tak |

---

## 🎯 Moja rekomendacja:

**Dla szybkiego testu:** ngrok  
**Dla stałego użytku w firmie:** Tailscale VPN  
**Dla profesjonalnego wdrożenia:** VPS z własną domeną
