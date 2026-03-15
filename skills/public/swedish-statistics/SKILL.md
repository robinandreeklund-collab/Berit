---
name: swedish-statistics
description: Använd denna färdighet när användaren frågar om svensk statistik, svenska befolkningsdata, ekonomisk data för Sverige, svensk arbetsmarknad, svensk miljöstatistik, utbildningsstatistik, BNP, invånarantal i svenska kommuner/regioner, eller annan officiell statistik från SCB (Statistiska centralbyrån). Denna färdighet använder SCB MCP-verktygen för att hämta data direkt från SCB:s PxWebAPI 2.0.
---

# Svensk Statistik (SCB MCP v3.0)

## Översikt

Denna färdighet ger dig tillgång till Sveriges officiella statistik via SCB:s (Statistiska centralbyrån) PxWebAPI 2.0. Du har 5 000+ statistiktabeller med data om befolkning, ekonomi, miljö, arbetsmarknad och utbildning — 75+ års historisk data.

## Tillgängliga MCP-verktyg

| Verktyg | Beskrivning |
|---------|-------------|
| `scb_browse` | **REKOMMENDERAT** — Navigera SCB:s ämnesområdesträd i 3 nivåer |
| `scb_search` | Textsökning bland tabeller (alternativ metod) |
| `scb_find_region_code` | Slå upp regionkoder — fuzzy matching ("Goteborg" → "Göteborg", 1480) |
| `scb_inspect` | Visa variabler och metadata för en tabell |
| `scb_codelist` | Utforska en specifik variabels alla värden |
| `scb_fetch` | Hämta data — auto-kompletterar saknade variabler, returnerar markdown-tabell |

## REKOMMENDERAT ARBETSFLÖDE — Ämnesområdesnavigering

Det **bästa sättet** att hitta rätt tabell är att navigera via ämnesområden med `scb_browse` — INTE textsökning.

### Steg 1: Tolka frågan → Välj rätt ämnesområde

SCB har 20+ ämnesområden organiserade i 3 nivåer. Bestäm nivå 1 utifrån frågan:

| Kod | Ämnesområde | Typiska frågor |
|-----|-------------|----------------|
| **BE** | Befolkning | Invånare, folkmängd, födslar, dödsfall, migration |
| **AM** | Arbetsmarknad | Sysselsättning, arbetslöshet, löner, yrken |
| **NR** | Nationalräkenskaper | BNP, ekonomisk tillväxt |
| **HE** | Hushållens ekonomi | Inkomst, skatt, disponibel inkomst |
| **BO** | Boende, byggande | Bostäder, hyror, fastighetspriser, bygglov |
| **UF** | Utbildning och forskning | Skola, universitet, utbildningsnivå |
| **MI** | Miljö | Utsläpp, vatten, avfall, klimat, natur |
| **PR** | Priser och konsumtion | KPI, inflation, konsumentpriser |
| **OE** | Offentlig ekonomi | Kommunekonomi, skattesats, offentliga finanser |
| **ME** | Demokrati | Val, riksdag, kommun, förtroendevalda |
| **TK** | Transport | Fordon, trafik, bilar |
| **EN** | Energi | El, bränsle, energibalans |
| **FM** | Finansmarknad | Bank, aktier, betalningsbalans |
| **HA** | Handel | Export, import, utrikeshandel |
| **HS** | Hälso- och sjukvård | Sjukvård, dödsorsaker |
| **JO** | Jord- och skogsbruk | Jordbruk, lantbruk, fiske |
| **KU** | Kultur och fritid | Kultur, bibliotek, idrott |
| **LE** | Levnadsförhållanden | Integration, jämställdhet, IT |
| **NV** | Näringsverksamhet | Företag, industri, bransch |
| **SO** | Socialförsäkring | Pension, föräldrapenning |

### Steg 2: Navigera djupare med scb_browse (3 nivåer)

```
scb_browse()                              → Alla 20+ ämnesområden (nivå 1)
scb_browse(subjectCode="BE")              → Underområden (nivå 2): BE0101, BE0401...
scb_browse(subjectCode="BE0101")          → Ämnen (nivå 3): Folkmängd, Döda, Flyttningar...
scb_browse(subjectCode="BE0101A")         → Tabeller i ämnet Folkmängd
```

### Steg 3: Välj rätt tabell

Nu ser du ALLA tabeller i ämnet. Välj den som bäst matchar frågan.

### Steg 4: Hämta data

1. `scb_find_region_code` om frågan gäller en specifik plats
2. `scb_inspect` för att se tabellens variabler
3. `scb_fetch` för att hämta data (auto-kompletterar saknade variabler)

## Snabbguide: Fråga → Sökväg → Tabell

| Fråga | Sökväg | Typisk tabell |
|-------|--------|---------------|
| Hur många bor i X? | BE → BE0101 → BE0101A (Folkmängd) | TAB638, TAB6471 |
| Befolkningsutveckling | BE → BE0101 → BE0101G (Befolkningsförändringar) | |
| Utrikes födda | BE → BE0101 → BE0101E (Utrikes födda) | TAB6642 |
| Befolkningsprognos | BE → BE0401 → BE0401A (Aktuella framskrivningar) | TAB694 |
| Arbetslöshet | AM → AM0401 → AM0401A (AKU) | |
| Sysselsättning | AM → AM0206 → AM0206A (RAMS) | |
| Löner | AM → AM0110 → AM0110A (Lönestruktur) | |
| BNP/tillväxt | NR → NR0103 → NR0103B (BNP år) | |
| Inkomster | HE → HE0110 → HE0110A (Förvärvsinkomst) | |
| Bostadspriser | BO → BO0104 → BO0104A (Fastighetspriser) | |
| Hyror | BO → BO0201 → BO0201B (Hyror) | |
| Utsläpp/klimat | MI → MI1301 → MI1301B (Utsläpp till luft) | |
| KPI/Inflation | PR → PR0101 → PR0101A (KPI) | |
| Valresultat | ME → ME0104 → ME0104A (Riksdagsval) | |
| Fordon/bilar | TK → TK1001 → TK1001A (Fordonsbestånd) | |
| Utbildningsnivå | UF → UF0501 → UF0501A (Utbildningsnivå) | |

## KRITISKA REGLER

1. **Använd `scb_browse` för att navigera** — textsökning ger ofta dåliga resultat
2. **Gå direkt från `scb_inspect` till `scb_fetch`** — fetch auto-kompletterar saknade variabler
3. **Använd INTE `scb_validate`** — den behövs inte, fetch hanterar allt
4. **Max 5 verktygsanrop totalt per fråga** — browse → region → inspect → fetch. Sedan SVAR.
5. **Presentera `markdown_table` direkt** från fetch-resultatet — skriv INTE filer
6. **Fråga INTE användaren** om förtydligande — gissa rimliga defaults (senaste år, totalt)
7. **Sök på SVENSKA** — "befolkning" inte "population"
8. **Om ett verktyg misslyckas — försök INTE igen.** Gå vidare eller svara med vad du har.

## Regionkoder

| Kod | Region |
|-----|--------|
| `"00"` | Hela riket |
| `"0180"` | Stockholm |
| `"1480"` | Göteborg |
| `"1280"` | Malmö |
| `"0380"` | Uppsala |

Använd `scb_find_region_code` för att slå upp andra kommuner/län. Fuzzy matching stöds.

## Tips för variabelfiltrering

- `TOP(n)` — senaste n tidsperioderna: `"Tid": ["TOP(5)"]`
- `BOTTOM(n)` — äldsta n tidsperioderna
- `*` — alla värden: `"Region": ["*"]`
- Kombinera specifika värden: `"Tid": ["2022", "2023", "2024"]`

## Exempelarbetsflöden

### "Hur många bor i Borås?"

1. `scb_browse(subjectCode="BE0101A")` → Folkmängd-tabeller → TAB638
2. `scb_find_region_code(query="Borås")` → `"1490"`
3. `scb_fetch(tableId="TAB638", selection={"Region": ["1490"], "Tid": ["TOP(1)"]})` → data

### "Jämför befolkningen i Stockholm, Göteborg och Malmö"

1. `scb_browse(subjectCode="BE0101A")` → TAB638
2. `scb_fetch(tableId="TAB638", selection={"Region": ["0180", "1480", "1280"], "Tid": ["TOP(5)"]})` → data

### "Visa BNP-utveckling de senaste 10 åren"

1. `scb_browse(subjectCode="NR0103")` → hitta BNP-tabell
2. `scb_inspect(tableId="...")` → se dimensioner
3. `scb_fetch(tableId="...", selection={"Tid": ["TOP(10)"]})` → data

## Presentera resultat

- Visa `markdown_table` direkt från `scb_fetch`-resultatet
- Inkludera trender och jämförelser när relevant
- Ange alltid källa: "Källa: SCB (Statistiska centralbyrån)"
- Förklara vad siffrorna betyder i kontext

## Felsökning

- **Tom sökning**: Använd `scb_browse` istället för `scb_search`
- **Tabell hittades inte**: Navigera via ämnesområden
- **Regionkod okänd**: Använd `scb_find_region_code` — stödjer fuzzy matching
- **Många anrop**: Om du fastnar — **sluta loopa**, presentera vad du har hittills
