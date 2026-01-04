# Quiz Flask 🎓

Jednoduchá webová kvízová aplikace vytvořená ve **Flasku** s frontendem v **HTML/CSS/JavaScriptu**.  
Uživatel si na začátku zvolí **kategorii**, **obtížnost** a **počet otázek**. Otázky se během jednoho kola **neopakují** a po dokončení hry se zobrazí **skóre i úspěšnost v procentech**.

Projekt slouží primárně jako **výuková aplikace** pro pochopení spolupráce backendu a frontendu.

---

## 🎯 Cíl projektu

- výběr kategorie kvízu
- výběr obtížnosti (easy / medium)
- nastavení počtu otázek
- náhodné otázky z JSON souboru
- odpovědi ve formátu A / B / C / D
- počítání skóre
- zobrazení úspěšnosti v procentech
- automatický konec hry
- možnost hru restartovat
- žádné opakování otázek v jednom kole

---

## 🛠 Použité technologie

### Backend
- **Python**
- **Flask**

### Frontend
- **HTML** – struktura stránky
- **CSS** – vzhled a rozložení
- **JavaScript** – herní logika, práce s API

### Data
- **JSON** – databáze otázek

---

## ⚙️ Jak aplikace funguje

### Architektura
Aplikace je rozdělena na **backend** a **frontend**, které spolu komunikují pomocí jednoduchého REST API.

---

### Backend (Flask – `app.py`)
- načítá otázky ze souboru `questions.json`
- filtruje otázky podle:
  - kategorie
  - obtížnosti
  - již použitých ID
- vrací náhodnou otázku přes API endpoint (např. `/api/question`)
- zajišťuje, že:
  - otázky nejsou opakovány
  - data nejsou přímo vystavena v HTML

---

### Frontend (JavaScript – `app.js`)
- komunikuje s backendem přes REST API
- zobrazuje otázky a odpovědi
- vyhodnocuje správnost odpovědi
- počítá:
  - aktuální skóre
  - počet zodpovězených otázek
- řídí průběh hry:
  - přechod mezi otázkami
  - konec hry
  - restart hry

---

## 📌 Stav projektu

Projekt je **funkční** a **snadno rozšiřitelný**.

Slouží jako výukový projekt pro:
- základy **Flask backendu**
- práci s **JSON daty**
- pochopení role **JavaScriptu ve webové aplikaci**
- základní **Git a GitHub workflow**
- oddělení frontend / backend logiky

---

## 🚀 Možná budoucí rozšíření

- přidání databáze (SQLite / PostgreSQL)
- uživatelské účty a ukládání výsledků
- administrace otázek
- časový limit na odpovědi
- další obtížnosti
- přechod na FastAPI nebo frontend framework

---