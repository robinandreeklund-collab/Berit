---
name: swedish-statistics
description: Använd denna färdighet när användaren frågar om svensk statistik, svenska befolkningsdata, ekonomisk data för Sverige, svensk arbetsmarknad, svensk miljöstatistik, utbildningsstatistik, BNP, invånarantal i svenska kommuner/regioner, eller annan officiell statistik från SCB (Statistiska centralbyrån). Denna färdighet använder SCB MCP-verktygen för att hämta data direkt från SCB:s PxWebAPI 2.0.
---

# Svensk Statistik (SCB MCP)

## Översikt

Denna färdighet ger dig tillgång till Sveriges officiella statistik via SCB:s (Statistiska centralbyrån) PxWebAPI 2.0. Du har 1 200+ statistiktabeller med data om befolkning, ekonomi, miljö, arbetsmarknad och utbildning — 75+ års historisk data.

## Tillgängliga MCP-verktyg

Du har dessa verktyg tillgängliga via SCB MCP-servern:

| Verktyg | Beskrivning |
|---------|-------------|
| `search_tables` | Sök bland statistiktabeller med nyckelord (fuzzy matching — "Goteborg" matchar "Göteborg") |
| `find_region_code` | Slå upp regionkoder för svenska kommuner och regioner (312+ regioner) |
| `get_table_variables` | Hämta tillgängliga dimensioner/variabler för en specifik tabell |
| `get_table_data` | Hämta faktisk statistikdata med filtrering |
| `preview_data` | Testa frågor innan full hämtning |

## Arbetsflöde

### Steg 1: Sök rätt tabell

Börja ALLTID med att söka efter relevanta tabeller:

```
search_tables(query="befolkning kommun")
```

Sökningar fungerar bäst på svenska. Servern stödjer fuzzy matching.

**Vanliga söktermer:**
- Befolkning: `"befolkning"`, `"folkmängd"`, `"invånare"`
- Ekonomi: `"BNP"`, `"bruttonationalprodukt"`, `"inflation"`
- Arbetsmarknad: `"sysselsättning"`, `"arbetslöshet"`, `"förvärvsarbetande"`
- Miljö: `"utsläpp"`, `"växthusgaser"`, `"avfall"`
- Utbildning: `"studenter"`, `"utbildningsnivå"`

### Steg 2: Slå upp regionkoder (om regiondata behövs)

Om frågan gäller en specifik kommun/region, slå upp koden:

```
find_region_code(query="Göteborg")
```

Vanliga regionkoder:
- `"0180"` = Stockholm
- `"1480"` = Göteborg
- `"1280"` = Malmö
- `"00"` = Hela riket

### Steg 3: Undersök tabellens variabler

Innan du hämtar data, se vilka dimensioner som finns:

```
get_table_variables(table_id="BE0101N1")
```

Detta visar tillgängliga filtrerings- och grupperingsalternativ.

### Steg 4: Förhandsgranska data (valfritt)

Testa din fråga med ett litet urval först:

```
preview_data(table_id="BE0101N1", variables={"region": ["0180"], "tid": ["2024"]})
```

### Steg 5: Hämta data

Hämta den faktiska statistiken:

```
get_table_data(table_id="BE0101N1", variables={"region": ["0180", "1480"], "tid": ["2020", "2021", "2022", "2023", "2024"]})
```

**Tips för variabelfiltrering:**
- Använd `TOP(n)` för att hämta de senaste n tidsperioderna: `"tid": ["TOP(5)"]`
- Använd `*` som wildcard för alla värden: `"region": ["*"]`
- Kombinera specifika värden: `"tid": ["2020", "2021", "2022"]`

## Vanliga frågor och exempelarbetsflöden

### "Hur många invånare har Göteborg?"

1. `find_region_code(query="Göteborg")` → `"1480"`
2. `search_tables(query="folkmängd kommun")` → hitta tabellens ID
3. `get_table_data(table_id="...", variables={"region": ["1480"], "tid": ["TOP(1)"]})` → aktuell data

### "Jämför befolkningen i Stockholm, Göteborg och Malmö"

1. `find_region_code(query="Stockholm")` → `"0180"`
2. `find_region_code(query="Göteborg")` → `"1480"`
3. `find_region_code(query="Malmö")` → `"1280"`
4. `search_tables(query="folkmängd kommun")` → tabellens ID
5. `get_table_data(table_id="...", variables={"region": ["0180", "1480", "1280"], "tid": ["TOP(5)"]})` → data

### "Visa BNP-utveckling de senaste 10 åren"

1. `search_tables(query="BNP bruttonationalprodukt")` → tabellens ID
2. `get_table_variables(table_id="...")` → se tillgängliga dimensioner
3. `get_table_data(table_id="...", variables={"tid": ["TOP(10)"]})` → data

### "Hur ser arbetslösheten ut i Sverige?"

1. `search_tables(query="arbetslöshet")` → tabellens ID
2. `get_table_data(table_id="...", variables={"tid": ["TOP(5)"]})` → data

## Presentera resultat

- Presentera data i tydliga tabeller (Markdown-format)
- Inkludera trender och jämförelser när det är relevant
- Ange alltid källa: "Källa: SCB (Statistiska centralbyrån)"
- Använd svenska siffror (mellanslag som tusentalsavgränsare: 1 000 000)
- Förklara vad siffrorna betyder i kontext

## Felsökning

- **Tom sökning**: Prova synonymer eller bredare söktermer
- **Tabell hittades inte**: Kontrollera tabellens ID med `search_tables`
- **Regionkod okänd**: Använd `find_region_code` — stödjer fuzzy matching
- **Timeout**: SCB:s API kan ibland vara långsamt — försök igen

## Datakategorier

| Kategori | Exempel |
|----------|---------|
| Befolkning | Folkmängd, födelseöverskott, invandring/utvandring, åldersfördelning |
| Ekonomi | BNP, skatter, företagsstatistik, nationalräkenskaper |
| Miljö | Växthusgasutsläpp, avfallshantering, vattenanvändning |
| Arbetsmarknad | Sysselsättning, arbetslöshet, yrkesdata, löner |
| Utbildning | Studentantal, utbildningsnivå, kompetensutveckling |
