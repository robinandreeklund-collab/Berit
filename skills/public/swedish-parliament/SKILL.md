---
name: swedish-parliament
description: Använd denna färdighet när användaren frågar om Sveriges riksdag, riksdagen, riksdagsledamöter, motioner, propositioner, betänkanden, interpellationer, skriftliga frågor, voteringar, omröstningar, riksdagsval, regeringen, regering, departement, SOU, statens offentliga utredningar, pressmeddelanden, regeringsbeslut, lagstiftning, lagförslag, utskott, debatter, anföranden, riksmöte, kammarens protokoll, svensk politik, politiska partier, statsminister, eller parlamentarisk data i Sverige.
---

# Riksdag & Regering MCP (v1.0)

## Översikt
Ger tillgång till data från Sveriges riksdag (data.riksdagen.se) och regeringskansliet (g0v.se). 15 verktyg för dokument, ledamöter, voteringar, anföranden och regeringsdokument.

## Tillgängliga MCP-verktyg

### Sök (4)
| Verktyg | Beskrivning |
|---------|-------------|
| `riksdag_sok_dokument` | Sök riksdagsdokument (motioner, propositioner, betänkanden) |
| `riksdag_sok_ledamoter` | Sök riksdagsledamöter efter namn, parti, valkrets |
| `riksdag_sok_anforanden` | Sök debattanföranden och tal |
| `riksdag_sok_voteringar` | Sök voteringsresultat |

### Hämta (5)
| Verktyg | Beskrivning |
|---------|-------------|
| `riksdag_hamta_dokument` | Hämta specifikt dokument med dok_id |
| `riksdag_hamta_ledamot` | Hämta ledamotsdetaljer med intressent_id |
| `riksdag_hamta_motioner` | Hämta senaste motionerna |
| `riksdag_hamta_propositioner` | Hämta senaste propositionerna |
| `riksdag_hamta_utskott` | Lista riksdagens utskott |

### Regering (3)
| Verktyg | Beskrivning |
|---------|-------------|
| `riksdag_regering_sok` | Sök regeringsdokument (pressmeddelanden, SOU, etc.) |
| `riksdag_regering_dokument` | Hämta specifikt regeringsdokument |
| `riksdag_regering_departement` | Analysera dokument per departement |

### Kalender & Analys (3)
| Verktyg | Beskrivning |
|---------|-------------|
| `riksdag_kalender` | Riksdagens kalender och händelser |
| `riksdag_kombinerad_sok` | Kombinerad sökning i riksdag + regering |
| `riksdag_statistik` | Tillgängliga statistikrapporter |

## Arbetsflöde

### Söka dokument
1. Identifiera dokumenttyp (motion, proposition, betänkande, etc.)
2. Använd `riksdag_sok_dokument` med `doktyp` och eventuell sökterm
3. Hämta detaljer med `riksdag_hamta_dokument` vid behov

### Söka ledamöter
1. Använd `riksdag_sok_ledamoter` med namn, parti eller valkrets
2. Hämta detaljer med `riksdag_hamta_ledamot` och ledamotens intressent_id

### Voteringsresultat
1. Använd `riksdag_sok_voteringar` med riksmöte (t.ex. "2024/25")
2. Filtrera på parti eller beteckning vid behov

### Regeringsdokument
1. Använd `riksdag_regering_sok` med sökord och dokumenttyp
2. Vanliga typer: pressmeddelanden, propositioner, sou, ds, dir, remisser

## Vanliga parametrar

### Dokumenttyper (doktyp)
| Kod | Typ |
|-----|-----|
| mot | Motion |
| prop | Proposition |
| bet | Betänkande |
| ip | Interpellation |
| fr | Skriftlig fråga |
| sou | SOU |

### Partikoder
S, M, SD, C, V, KD, L, MP

### Riksmöten
Format: "2024/25", "2023/24", etc.

## KRITISKA REGLER
1. **Max 4 verktygsanrop per fråga**
2. **Om ett verktyg misslyckas — försök INTE igen**
3. **Presentera data överskådligt** — använd tabeller
4. **Ange källa**: "Källa: Sveriges riksdag (data.riksdagen.se)" eller "Källa: Regeringskansliet (g0v.se)"

## Felsökning
- **Tom lista**: Kontrollera riksmöte-format (YYYY/YY) och dokumenttyp
- **404**: Kontrollera att dok_id eller intressent_id är korrekt
- **Timeout**: API:t kan vara långsamt vid stora sökningar — begränsa med `limit`
