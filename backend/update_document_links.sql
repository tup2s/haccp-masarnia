-- Aktualizuj linki do formularzy i instrukcji
UPDATE "Document" SET "filePath" = '/haccp-docs/Formularz_kontroli_temperatury.html' WHERE title = 'Formularz kontroli temperatury';
UPDATE "Document" SET "filePath" = '/haccp-docs/Formularz_przyjecia_surowca.html' WHERE title = 'Formularz przyjęcia surowca';
UPDATE "Document" SET "filePath" = '/haccp-docs/Instrukcja_przyjecia_surowcow.html' WHERE title = 'Instrukcja przyjęcia surowców';
UPDATE "Document" SET "filePath" = '/haccp-docs/Instrukcja_peklowania.html' WHERE title = 'Instrukcja peklowania';

-- Dla pozostałych dokumentów też ustaw linki (jeśli istnieją odpowiedniki)
UPDATE "Document" SET "filePath" = '/haccp-docs/Formularz_kontroli_czystosci.html' WHERE title = 'Formularz kontroli czystości' AND "filePath" = '';
UPDATE "Document" SET "filePath" = '/haccp-docs/Formularz_kontroli_szkodnikow.html' WHERE title = 'Formularz kontroli szkodników' AND "filePath" = '';
UPDATE "Document" SET "filePath" = '/haccp-docs/Formularz_audytu_wewnetrznego.html' WHERE title = 'Formularz audytu wewnętrznego' AND "filePath" = '';
UPDATE "Document" SET "filePath" = '/haccp-docs/Formularz_dzialan_korygujacych.html' WHERE title = 'Formularz działań korygujących' AND "filePath" = '';
UPDATE "Document" SET "filePath" = '/haccp-docs/Formularz_rozbiorow.html' WHERE title = 'Formularz rozbiorów' AND "filePath" = '';

UPDATE "Document" SET "filePath" = '/haccp-docs/Instrukcja_produkcji.html' WHERE title = 'Instrukcja produkcji' AND "filePath" = '';
UPDATE "Document" SET "filePath" = '/haccp-docs/Instrukcja_sprzatania_i_dezynfekcji.html' WHERE title = 'Instrukcja sprzątania i dezynfekcji' AND "filePath" = '';
UPDATE "Document" SET "filePath" = '/haccp-docs/Instrukcja_postepowania_z_niezgodnosciami.html' WHERE title = 'Instrukcja postępowania z niezgodnościami' AND "filePath" = '';
UPDATE "Document" SET "filePath" = '/haccp-docs/Instrukcja_kontroli_temperatury.html' WHERE title = 'Instrukcja kontroli temperatury' AND "filePath" = '';
UPDATE "Document" SET "filePath" = '/haccp-docs/Instrukcja_rozbiorow_i_przygotowania_miesa.html' WHERE title = 'Instrukcja rozbiorów i przygotowania mięsa' AND "filePath" = '';
UPDATE "Document" SET "filePath" = '/haccp-docs/Instrukcja_znakowania_i_etykietowania.html' WHERE title = 'Instrukcja znakowania i etykietowania' AND "filePath" = '';

UPDATE "Document" SET "filePath" = '/haccp-docs/Procedura_kontroli_CCP.html' WHERE title = 'Procedura kontroli CCP' AND "filePath" = '';
UPDATE "Document" SET "filePath" = '/haccp-docs/Procedura_audytow_wewnetrznych.html' WHERE title = 'Procedura audytów wewnętrznych' AND "filePath" = '';
UPDATE "Document" SET "filePath" = '/haccp-docs/Procedura_wycofania_produktu.html' WHERE title = 'Procedura wycofania produktu' AND "filePath" = '';
UPDATE "Document" SET "filePath" = '/haccp-docs/Procedura_szkolen_pracownikow.html' WHERE title = 'Procedura szkoleń pracowników' AND "filePath" = '';
