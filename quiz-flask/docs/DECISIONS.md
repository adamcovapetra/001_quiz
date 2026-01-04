# Decisions (Technická rozhodnutí)

Tento dokument vysvětluje hlavní rozhodnutí v projektu **Quiz Flask**: proč je aplikace navržená takto, co tím řešíme a jaké jsou alternativy.

---

## 1) Proč Flask (a ne Django / FastAPI)

**Rozhodnutí:** Flask jako backend framework.

**Důvod:**
- Cíl projektu je výukový: pochopit tok **frontend → API → backend** a práci s GitHubem.
- Flask umožní rychle postavit jednoduché API a jednu stránku bez zbytečné „režie“.
- Pro malý projekt s několika endpointy je Flask přímočarý a snadno se čte.

**Alternativy:**
- **Django**: hodí se spíš pro větší aplikace (uživatelé, admin, databáze, více stránek). Pro tento projekt by přidal hodně struktury navíc.
- **FastAPI**: skvělé pro moderní API, typy a dokumentaci, ale pro začátek je Flask jednodušší a méně „striktní“.

---

## 2) Proč máme backend v Pythonu a většinu logiky v JavaScriptu

**Rozhodnutí:** Hra běží interaktivně v prohlížeči, proto hlavní herní „flow“ (skóre, počítání otázek, UI) řeší JS.

**Důvod:**
- UI reaguje okamžitě bez refreshování stránky.
- Backend je použit jako „zdroj dat a pravidel“ (otázky + ověření správné odpovědi).
- Frontend řeší stav hry: `score`, `count`, zobrazení dalších otázek a finále.

**Alternativa:**
- Server-side hra (jen Python + HTML) by znamenala refresh stránky po každé odpovědi a složitější UX.

---

## 3) Proč jsou otázky v JSON

**Rozhodnutí:** Otázky jsou uloženy v `data/questions.json`.

**Důvod:**
- Jednoduché na úpravu a verzování v GitHubu.
- Snadno čitelné a přenositelné mezi jazyky.
- Pro výukový projekt není potřeba databáze.

**Limity JSON:**
- Bez databázových výhod (indexy, dotazování, editace přes admin).
- Při velkém počtu otázek by bylo výhodnější přejít na DB.

**Alternativa:**
- Databáze (SQLite/PostgreSQL) pokud bude:
  - hodně otázek,
  - uživatelské účty,
  - statistiky,
  - admin rozhraní.

---

## 4) Proč otázky vybírá backend náhodně

**Rozhodnutí:** Náhodný výběr otázky se děje v endpointu `/api/question`.

**Důvod:**
- Jedno místo, které rozhoduje „co se hraje“.
- Frontend nemusí mít celý dataset.
- Lepší kontrola do budoucna (např. vážení podle obtížnosti, logování, statistiky).

---

## 5) Proč neposíláme `answerIndex` do frontendu

**Rozhodnutí:** `/api/question` vrací pouze `choices` a nevrací `answerIndex`.

**Důvod:**
- Kdyby frontend dostal `answerIndex`, šlo by z devtools/network snadno odhalit správnou odpověď.
- Backend je „zdroj pravdy“ a vyhodnocuje odpověď přes `/api/answer`.

---

## 6) Proč posíláme do `/api/answer` text odpovědi (`selectedText`) a ne index

**Rozhodnutí:** Frontend posílá text vybrané odpovědi.

**Důvod:**
- Odpovědi na frontendu **mícháme** (shuffle), takže index by nebyl stabilní.
- Text odpovědi je robustní vůči míchání.

---

## 7) Proč se odpovědi míchají (shuffle)

**Rozhodnutí:** Odpovědi se před zobrazením promíchají.

**Důvod:**
- Uživatel si nemá pamatovat „správné písmeno“, ale správnou znalost.
- Zvyšuje to férovost a variabilitu hry.

---

## 8) Proč neumožňujeme opakování otázek v jednom kole

**Rozhodnutí:** V jednom kole se otázky neopakují (frontend posílá `exclude`).

**Důvod:**
- Hra je zajímavější a férovější.
- Uživatel má pocit progresu.
- V `app.js` se drží `usedIds`, které se posílají do backendu jako `exclude`.

**Poznámka:**
- Pokud už v dané kombinaci (kategorie + obtížnost) dojdou otázky, backend vrátí chybu „No more questions…“.

---

## 9) Proč je delší pauza po špatné odpovědi

**Rozhodnutí:** Po špatné odpovědi čekáme déle než po správné.

**Důvod:**
- Uživatel stihne zaregistrovat, co bylo špatně a co bylo správně.
- Je to výukově užitečné (rychlost hry nebrání učení).

Konkrétně:
- správně: kratší pauza
- špatně: delší pauza

---

## 10) Proč zobrazujeme procenta a emoji na konci

**Rozhodnutí:** Na konci zobrazíme `x/y`, procenta a emoji.

**Důvod:**
- Procenta dávají okamžitě jasnou informaci o úspěšnosti.
- Emoji je drobná motivace a zlepšuje UX.

---

## Plány do budoucna (možná vylepšení)

- Přidat databázi a admin rozhraní pro otázky
- Leaderboard / high score
- Uživatelské účty
- Více obtížností a filtrování kategorií
- Logování a statistiky (nejčastější chyby)