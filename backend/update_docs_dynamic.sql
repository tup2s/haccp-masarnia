-- Aktualizuj ścieżki do dynamicznych raportów (API)
UPDATE "Document" SET "filePath" = '/api/document-reports/receptions' WHERE title = 'Formularz przyjęcia surowca';
UPDATE "Document" SET "filePath" = '/api/document-reports/temperature' WHERE title = 'Formularz kontroli temperatury';
UPDATE "Document" SET "filePath" = '/api/document-reports/curing' WHERE title LIKE '%peklowani%' AND category = 'FORM';
UPDATE "Document" SET "filePath" = '/api/document-reports/production' WHERE title LIKE '%produkcj%' AND category = 'FORM';
UPDATE "Document" SET "filePath" = '/api/document-reports/cleaning' WHERE title LIKE '%czysto%' OR title LIKE '%sprząt%';
UPDATE "Document" SET "filePath" = '/api/document-reports/audits' WHERE title LIKE '%audyt%';

-- Instrukcje zostaw jako statyczne HTML lub też jako dynamiczne
UPDATE "Document" SET "filePath" = '/haccp-docs/Instrukcja_przyjecia_surowcow.html' WHERE title = 'Instrukcja przyjęcia surowców';
UPDATE "Document" SET "filePath" = '/haccp-docs/Instrukcja_peklowania.html' WHERE title = 'Instrukcja peklowania';
