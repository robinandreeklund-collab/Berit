---
name: oecd-statistics
description: Använd denna färdighet när användaren frågar om OECD, OECD-statistik, internationell jämförelse, BNP jämförelse länder, arbetslöshet internationellt, utbildningsstatistik internationellt, handelsdata, FDI, grön tillväxt, bostadspriser internationellt, inkomstfördelning, bistånd, ODA, innovationsstatistik, PISA, hälsostatistik internationellt, klimatdata OECD, eller ekonomisk statistik för flera länder.
mcp-server: oecd
---

# OECD-statistik (OECD MCP v1.0)

## Översikt
Hämta statistisk data från OECD:s SDMX API — 30+ verifierade dataset som täcker ekonomi, hälsa, utbildning, arbetsmarknad, handel, miljö, m.m. för OECD:s 38 medlemsländer.

## Tillgängliga MCP-verktyg

| Verktyg | Beskrivning |
|---------|-------------|
| `oecd_search_dataflows` | Sök dataset med nyckelord |
| `oecd_list_dataflows` | Bläddra dataset per kategori |
| `oecd_get_data_structure` | Hämta metadata och dimensioner för ett dataset |
| `oecd_query_data` | **Huvudverktyg** — Hämta faktisk statistisk data |
| `oecd_get_categories` | Lista alla 17 datakategorier |
| `oecd_get_popular_datasets` | Vanliga/populära dataset |
| `oecd_search_indicators` | Hitta specifika indikatorer |
| `oecd_get_dataflow_url` | Generera OECD Data Explorer-länk |
| `oecd_list_categories_detailed` | Detaljerad kategoriinfo med exempel |

## Arbetsflöde

### Hitta rätt dataset
1. Använd `oecd_get_categories` för att se alla kategorier
2. Använd `oecd_search_dataflows` med nyckelord ELLER `oecd_list_dataflows` per kategori
3. Använd `oecd_get_data_structure` för att se dimensioner

### Hämta data
1. Använd `oecd_query_data` med dataflow_id och filter
2. Filter-syntax: punkt-separerade dimensioner (t.ex. SWE+NOR.GDP..A)
3. Använd + för flera värden, tom position för alla

### Vanliga dataset

| Dataset | Beskrivning |
|---------|-------------|
| QNA | Kvartals BNP |
| MEI | Huvudsakliga ekonomiska indikatorer |
| HPI | Bostadsprisindex |
| IDD | Inkomstfördelning |
| HEALTH_STAT | Hälsostatistik |
| EAG_FIN | Utbildningsfinansiering |
| GREEN_GROWTH | Grön tillväxt |
| FDI | Utländska direktinvesteringar |

## Landskoder (ISO 3166-1 alpha-3)
- SWE (Sverige), NOR (Norge), DNK (Danmark), FIN (Finland)
- USA, GBR, DEU, FRA, JPN, CAN, AUS
- OECD (OECD-genomsnitt)

## KRITISKA REGLER
1. **Max 4 verktygsanrop per fråga**
2. **Max 1000 observationer per förfrågan** (standard: 100)
3. **Om ett verktyg misslyckas — försök INTE igen.**
4. **Presentera data överskådligt** — använd tabeller
5. **Ange källa**: "Källa: OECD (sdmx.oecd.org)"

## Felsökning
- 404: Dataset-ID finns inte — kontrollera med search_dataflows
- Tomt resultat: Filtret matchar ingen data — prova bredare filter
- Rate limit: OECD blockerar efter ~20 snabba anrop — vänta automatiskt
