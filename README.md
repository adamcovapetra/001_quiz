# Quiz Flask

Jednoduchá webová kvízová aplikace vytvořená ve **Flasku**.  
Uživatel si na začátku nastaví **kategorii, obtížnost a počet otázek**. Otázky se během jednoho kola **neopakují** a na konci hry se zobrazí skóre.

---

## 🎯 Cíl projektu

- výběr kategorie
- výběr obtížnosti (easy / medium)
- nastavení počtu otázek
- náhodné otázky z JSON souboru
- odpovědi ve formátu A / B / C / D
- počítání skóre
- automatický konec hry
- možnost hru restartovat
- žádné opakování otázek v jednom kole

---

## 🛠 Použité technologie

- Python + Flask
- HTML
- CSS
- JavaScript

---

## ⚙️ Jak aplikace funguje

- Frontend (JavaScript) komunikuje s backendem přes REST API (`/api/question`)
- Backend:
  - načítá otázky z JSON
  - filtruje je podle kategorie, obtížnosti a již použitých ID
  - vrací náhodnou otázku
- Frontend:
  - zobrazuje otázky a odpovědi
  - vyhodnocuje správnost odpovědi
  - počítá skóre a počet otázek
  - zobrazuje konec hry a umožňuje restart

---

## 📌 Stav projektu

Projekt je funkční a dále rozšiřitelný.  
Slouží jako výukový projekt pro:
- Flask backend
- práci s JSON daty
- frontend logiku v JavaScriptu
- Git a GitHub workflow
