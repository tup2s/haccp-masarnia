# Szablony dokumentów HACCP

## Jak używać tych dokumentów?

### 1. Otwieranie i drukowanie
- Otwórz plik HTML w przeglądarce (Chrome, Firefox, Edge)
- Kliknij "Drukuj" lub naciśnij Ctrl+P
- Wybierz "Zapisz jako PDF" aby utworzyć PDF
- Lub drukuj bezpośrednio na drukarce

### 2. Edycja (przed drukowaniem)
- Otwórz plik HTML w edytorze tekstu (Notepad++, VSCode)
- Zmień pola oznaczone "____________" na swoje dane
- Zapisz i otwórz w przeglądarce

### 3. Dostępne dokumenty

**Formularze:**
- `Formularz_przyjecia_surowca.html` - wypełniaj przy każdej dostawie mięsa
- `Formularz_kontroli_temperatury.html` - wypełniaj codziennie (2x dziennie)

**Instrukcje:**
- `Instrukcja_przyjecia_surowcow.html` - jak przyjmować dostawy
- `Instrukcja_peklowania.html` - jak peklować mięso bezpiecznie

### 4. Co pokazać weterynarzowi?

**Obowiązkowe do okazania:**
1. Wypełnione formularze kontroli temperatury (za ostatnie 3 miesiące)
2. Formularze przyjęcia surowców (wszystkie dostawy)
3. Instrukcje (wydrukowane, zatwierdzone podpisem)
4. Plan HACCP (z aplikacji - eksport do PDF)

**Wskazówki:**
- Dokumenty muszą być WYPEŁNIONE (nie puste szablony)
- Muszą mieć podpisy osób odpowiedzialnych
- Przechowuj w segregatorach przez min. 2 lata
- Trzymaj na bieżąco - kontroluj każdego dnia

### 5. Uzupełnienie danych zakładu

Przed pierwszym drukowaniem zmień w każdym pliku HTML:
- "NAZWA ZAKŁADU / MASARNI" → twoja nazwa
- "Adres zakładu" → twój adres
- "NIP: _____________" → twój NIP
- "Weterynaryjny nr rej.: _____________" → nr z PIW
- "Data obowiązywania: ____________" → dzisiejsza data

## Jak generować PDF?

### Metoda 1: Z przeglądarki
1. Otwórz plik HTML w Chrome/Firefox
2. Ctrl+P (lub Plik → Drukuj)
3. Wybierz "Zapisz jako PDF"
4. Kliknij "Zapisz"

### Metoda 2: Online (wkhtmltopdf)
```bash
wkhtmltopdf Formularz_przyjecia_surowca.html Formularz_przyjecia_surowca.pdf
```

### Metoda 3: Za pomocą puppeteer (Node.js)
W katalogu backend uruchom:
```bash
npm install puppeteer
node generate-pdfs.js
```

## Częste pytania

**P: Czy muszę wypełniać wszystkie formularze?**
O: TAK - to wymóg prawny dla HACCP. Kontrola temperatury to CCP (Punkt Krytyczny).

**P: Jak długo przechowywać dokumenty?**
O: Minimum 2 lata od daty wytworzenia produktu.

**P: Co jeśli zapomniałem wypełnić formularz?**
O: To niezgodność w systemie HACCP. Odnotuj w rejestrze niezgodności i podejmij działania zapobiegawcze.

**P: Czy mogę modyfikować formularze?**
O: Tak, ale każda zmiana musi być zatwierdzona przez osobę odpowiedzialną za HACCP i udokumentowana.
