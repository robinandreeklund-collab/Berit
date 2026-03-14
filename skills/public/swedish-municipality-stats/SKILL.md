---
name: swedish-municipality-stats
description: Använd denna färdighet när användaren frågar om kommunstatistik, kommunal statistik, Kolada, kommun, kommuner, nyckeltal, KPI, kommunjämförelse, skolresultat, kommunranking, äldreomsorg, barnomsorg, hemtjänst, socialtjänst, kommunalekonomi, skattesats, befolkningsstatistik, demografisk data, regional statistik, landsting, region, organisationsenhet, verksamhetsdata, eller vill jämföra kommuner i Sverige.
---

# Kolada MCP (v1.0)

## Översikt
Ger tillgång till Kolada — Sveriges databas för kommunal och regional nyckeltalsjämförelse (RKA). 10 verktyg för att söka, hämta och jämföra över 6000 nyckeltal för alla Sveriges kommuner och regioner.

## Tillgängliga MCP-verktyg

### Sök (3)
| Verktyg | Beskrivning |
|---------|-------------|
| `kolada_sok_nyckeltal` | Sök nyckeltal (KPI) efter titel/nyckelord |
| `kolada_sok_kommun` | Sök kommuner efter namn |
| `kolada_sok_enhet` | Sök organisationsenheter (skolor, vårdcentraler, etc.) |

### Hämta data (4)
| Verktyg | Beskrivning |
|---------|-------------|
| `kolada_data_kommun` | Hämta nyckeltalsvärden för en specifik kommun |
| `kolada_data_alla_kommuner` | Hämta nyckeltalsvärden för alla kommuner ett visst år |
| `kolada_data_enhet` | Hämta nyckeltalsvärden per organisationsenhet |
| `kolada_nyckeltal_detalj` | Hämta detaljerad metadata om ett nyckeltal |

### Jämförelse (2)
| Verktyg | Beskrivning |
|---------|-------------|
| `kolada_jamfor_kommuner` | Jämför nyckeltal mellan flera kommuner |
| `kolada_trend` | Visa trend för ett nyckeltal i en kommun över tid |

### Referens (1)
| Verktyg | Beskrivning |
|---------|-------------|
| `kolada_kommungrupper` | Lista kommungrupper (klassificeringar) |

## Arbetsflöde

### Jämföra kommuner
1. Sök nyckeltalet med `kolada_sok_nyckeltal` (t.ex. "invånare" eller "skolresultat")
2. Sök kommuner med `kolada_sok_kommun` för att få ID:n
3. Använd `kolada_jamfor_kommuner` med KPI-ID och kommun-ID:n

### Analysera en kommun
1. Sök kommunen med `kolada_sok_kommun`
2. Sök relevanta nyckeltal med `kolada_sok_nyckeltal`
3. Hämta data med `kolada_data_kommun`
4. Visa trend med `kolada_trend`

### Hitta bäst/sämst i riket
1. Sök nyckeltalet med `kolada_sok_nyckeltal`
2. Hämta data för alla kommuner med `kolada_data_alla_kommuner`
3. Rangordna och presentera topp/botten

## Vanliga nyckeltal

| KPI-ID | Beskrivning |
|--------|-------------|
| N00945 | Invånare totalt |
| N00941 | Befolkningsökning/-minskning |
| N01951 | Nettokostnadsavvikelse, kr/inv |
| U09400 | Elever åk 9 som uppnått kunskapskrav i alla ämnen |
| N07900 | Resultat av medborgarundersökning |

## KRITISKA REGLER
1. **Max 4 verktygsanrop per fråga**
2. **Om ett verktyg misslyckas — försök INTE igen**
3. **Presentera data överskådligt** — använd tabeller
4. **Ange källa**: "Källa: Kolada (kolada.se)"
5. **Kön-filter**: Data finns ofta uppdelat på T=Totalt, M=Män, K=Kvinnor — visa Totalt som standard

## Felsökning
- **Tom lista**: Kontrollera KPI-ID (börjar med bokstav + siffror, t.ex. "N00945")
- **Inga data**: Alla nyckeltal har inte data för alla år — prova ett tidigare år
- **Timeout**: Begränsa med `limit`-parametern
