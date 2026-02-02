-- Aktualizuj ścieżki do API backendu
UPDATE "Document" SET "filePath" = 'http://localhost:3001/haccp-docs/Formularz_kontroli_temperatury.html' WHERE title = 'Formularz kontroli temperatury';
UPDATE "Document" SET "filePath" = 'http://localhost:3001/haccp-docs/Formularz_przyjecia_surowca.html' WHERE title = 'Formularz przyjęcia surowca';
UPDATE "Document" SET "filePath" = 'http://localhost:3001/haccp-docs/Instrukcja_przyjecia_surowcow.html' WHERE title = 'Instrukcja przyjęcia surowców';
UPDATE "Document" SET "filePath" = 'http://localhost:3001/haccp-docs/Instrukcja_peklowania.html' WHERE title = 'Instrukcja peklowania';
