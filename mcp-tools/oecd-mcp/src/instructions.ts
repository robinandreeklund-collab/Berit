/**
 * LLM instructions for the OECD MCP server.
 */

export const LLM_INSTRUCTIONS = `
# OECD MCP — Instruktioner

Du har tillgång till 9 verktyg för att hämta internationell statistik från OECD via SDMX API.

## Verktyg per kategori

### Sök & utforska (3 verktyg)
- **oecd_search_dataflows** — Sök dataset med nyckelord
- **oecd_list_dataflows** — Bläddra dataset per kategori
- **oecd_search_indicators** — Hitta specifika indikatorer

### Metadata (2 verktyg)
- **oecd_get_data_structure** — Visa dimensioner och filterformat för ett dataset
- **oecd_get_dataflow_url** — Generera OECD Data Explorer-länk

### Kategorier (2 verktyg)
- **oecd_get_categories** — Lista alla 17 datakategorier
- **oecd_list_categories_detailed** — Detaljerad kategoriinfo med exempeldataset

### Populära dataset (1 verktyg)
- **oecd_get_popular_datasets** — Kurerad lista med vanliga dataset

### Datahämtning (1 verktyg)
- **oecd_query_data** — Hämta faktisk statistisk data (HUVUDVERKTYGET)

## Rekommenderat arbetsflöde

1. **Hitta dataset** — Använd oecd_search_dataflows eller oecd_get_popular_datasets
2. **Förstå strukturen** — Kör ALLTID oecd_get_data_structure innan datahämtning
3. **Bygg filter** — Använd dimensionsinformation för att skapa korrekt filter
4. **Hämta data** — Använd oecd_query_data med rätt filter
5. **Presentera** — Visa data i tabellformat med tydliga förklaringar

## SDMX-filterformat

- Dimensioner separeras med punkt (.): \`SWE.GDP..A\`
- + för multipla värden: \`SWE+NOR+DNK\`
- Tom dimension = wildcard: \`SWE...\` (alla dimensioner utom land)
- Ordningen beror på datasetet — kör oecd_get_data_structure först!

## Vanliga landskoder (ISO 3166-1 alpha-3)

- SWE = Sverige, NOR = Norge, DNK = Danmark, FIN = Finland
- DEU = Tyskland, FRA = Frankrike, GBR = Storbritannien
- USA = USA, JPN = Japan, CHN = Kina, KOR = Sydkorea
- OECD = OECD-genomsnitt, EU27_2020 = EU27

## Vanliga dataset

- QNA — Kvartalsvisa nationalräkenskaper (BNP)
- MEI — Huvudsakliga ekonomiska indikatorer
- HEALTH_STAT — Hälsostatistik
- HPI — Bostadsprisindex
- IDD — Inkomstfördelning
- GREEN_GROWTH — Grön tillväxt
- AIR_GHG — Växthusgasutsläpp

## Tips

- API:t kräver ingen autentisering
- Cache: 1 timme data, 24 timmar metadata
- Rate limit: 1,5 sekunder mellan anrop
- Max 1000 observationer per anrop (standard: 100)
- Använd last_n_observations för att begränsa svaret
`;
