-- Formularze HACCP
INSERT INTO "Document" (title, category, "fileName", "filePath", version, "validFrom", "uploadedBy", "createdAt", "updatedAt") VALUES
('Formularz kontroli temperatury', 'FORM', 'Formularz_kontroli_temperatury.pdf', '', '1.0', CURRENT_DATE, 1, NOW(), NOW()),
('Formularz przyjęcia surowca', 'FORM', 'Formularz_przyjecia_surowca.pdf', '', '1.0', CURRENT_DATE, 1, NOW(), NOW()),
('Formularz kontroli czystości', 'FORM', 'Formularz_kontroli_czystosci.pdf', '', '1.0', CURRENT_DATE, 1, NOW(), NOW()),
('Formularz kontroli szkodników', 'FORM', 'Formularz_kontroli_szkodnikow.pdf', '', '1.0', CURRENT_DATE, 1, NOW(), NOW()),
('Formularz audytu wewnętrznego', 'FORM', 'Formularz_audytu_wewnetrznego.pdf', '', '1.0', CURRENT_DATE, 1, NOW(), NOW()),
('Formularz działań korygujących', 'FORM', 'Formularz_dzialan_korygujacych.pdf', '', '1.0', CURRENT_DATE, 1, NOW(), NOW()),
('Formularz rozbiorów', 'FORM', 'Formularz_rozbiorow.pdf', '', '1.0', CURRENT_DATE, 1, NOW(), NOW());

-- Instrukcje HACCP
INSERT INTO "Document" (title, category, "fileName", "filePath", version, "validFrom", "uploadedBy", "createdAt", "updatedAt") VALUES
('Instrukcja przyjęcia surowców', 'INSTRUCTION', 'Instrukcja_przyjecia_surowcow.pdf', '', '1.0', CURRENT_DATE, 1, NOW(), NOW()),
('Instrukcja peklowania', 'INSTRUCTION', 'Instrukcja_peklowania.pdf', '', '1.0', CURRENT_DATE, 1, NOW(), NOW()),
('Instrukcja produkcji', 'INSTRUCTION', 'Instrukcja_produkcji.pdf', '', '1.0', CURRENT_DATE, 1, NOW(), NOW()),
('Instrukcja sprzątania i dezynfekcji', 'INSTRUCTION', 'Instrukcja_sprzatania_i_dezynfekcji.pdf', '', '1.0', CURRENT_DATE, 1, NOW(), NOW()),
('Instrukcja postępowania z niezgodnościami', 'INSTRUCTION', 'Instrukcja_postepowania_z_niezgodnosciami.pdf', '', '1.0', CURRENT_DATE, 1, NOW(), NOW()),
('Instrukcja kontroli temperatury', 'INSTRUCTION', 'Instrukcja_kontroli_temperatury.pdf', '', '1.0', CURRENT_DATE, 1, NOW(), NOW()),
('Instrukcja rozbiorów i przygotowania mięsa', 'INSTRUCTION', 'Instrukcja_rozbiorow_i_przygotowania_miesa.pdf', '', '1.0', CURRENT_DATE, 1, NOW(), NOW()),
('Instrukcja znakowania i etykietowania', 'INSTRUCTION', 'Instrukcja_znakowania_i_etykietowania.pdf', '', '1.0', CURRENT_DATE, 1, NOW(), NOW());

-- Procedury
INSERT INTO "Document" (title, category, "fileName", "filePath", version, "validFrom", "uploadedBy", "createdAt", "updatedAt") VALUES
('Procedura kontroli CCP', 'PROCEDURE', 'Procedura_kontroli_CCP.pdf', '', '1.0', CURRENT_DATE, 1, NOW(), NOW()),
('Procedura audytów wewnętrznych', 'PROCEDURE', 'Procedura_audytow_wewnetrznych.pdf', '', '1.0', CURRENT_DATE, 1, NOW(), NOW()),
('Procedura wycofania produktu', 'PROCEDURE', 'Procedura_wycofania_produktu.pdf', '', '1.0', CURRENT_DATE, 1, NOW(), NOW()),
('Procedura szkoleń pracowników', 'PROCEDURE', 'Procedura_szkolen_pracownikow.pdf', '', '1.0', CURRENT_DATE, 1, NOW(), NOW());
