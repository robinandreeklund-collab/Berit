---
name: swedish-nature-protection
description: Använd denna färdighet när användaren frågar om skyddade naturområden, naturreservat, nationalparker, Natura 2000, Ramsar, våtmarker, naturvård, Naturvårdsverket, NVV, skyddad natur, naturskydd, biotopskydd, arter, djur, växter, fåglar, habitat, naturtyper, biologisk mångfald, artskydd, miljöskydd, eller naturskyddade platser i Sverige.
mcp-server: nvv
---

# Naturvårdsverket MCP (NVV MCP v1.0)

## Översikt
Ger tillgång till data om skyddade naturområden i Sverige via Naturvårdsverkets öppna API:er. 8 verktyg som täcker nationella skyddade områden, Natura 2000-områden och Ramsar-våtmarker.

## Tillgängliga MCP-verktyg

### Uppslag (1)
| Verktyg | Beskrivning |
|---------|-------------|
| `nvv_uppslag` | Konvertera ortnamn till kommun-/länskoder |

### Sök (2)
| Verktyg | Beskrivning |
|---------|-------------|
| `nvv_sok_nationella` | Sök nationella skyddade områden (naturreservat, nationalparker) |
| `nvv_sok_natura2000` | Sök Natura 2000-områden |

### Detalj (3)
| Verktyg | Beskrivning |
|---------|-------------|
| `nvv_detalj_nationellt` | Detaljinfo om ett nationellt skyddat område |
| `nvv_detalj_natura2000` | Detaljinfo om ett Natura 2000-område inkl. arter/naturtyper |
| `nvv_detalj_ramsar` | Detaljinfo om ett Ramsar-våtmarksområde |

### Översikt (2)
| Verktyg | Beskrivning |
|---------|-------------|
| `nvv_sok_alla` | Sök i alla tre datakällor samtidigt |
| `nvv_arter` | Lista skyddade arter i Natura 2000-områden |

## Arbetsflöde

### Hitta skyddade områden i en kommun
1. Använd `nvv_uppslag` med typ="kommun" och namn="Stockholm" för att få kommunkoden
2. Använd `nvv_sok_alla` med kommunkoden för att söka i alla tre källor
3. Hämta detaljer med rätt detaljverktyg (`nvv_detalj_nationellt`, `nvv_detalj_natura2000` eller `nvv_detalj_ramsar`)

### Artinventering
1. Använd `nvv_arter` för att lista skyddade arter (filtrera på grupp: B=fåglar, M=däggdjur, etc.)
2. Sök Natura 2000-områden med `nvv_sok_natura2000`
3. Hämta artlista för specifikt område med `nvv_detalj_natura2000` och include="species"

## Vanliga parametrar

### Länskoder
| Kod | Län |
|-----|-----|
| AB | Stockholms län |
| C | Uppsala län |
| M | Skåne län |
| O | Västra Götalands län |
| E | Östergötlands län |
| BD | Norrbottens län |

### Artgrupper
| Kod | Grupp |
|-----|-------|
| B | Fåglar |
| M | Däggdjur |
| R | Reptiler |
| A | Amfibier |
| F | Fiskar |
| I | Evertebrater (ryggradslösa) |
| P | Växter |

## KRITISKA REGLER
1. **Max 4 verktygsanrop per fråga**
2. **Om ett verktyg misslyckas — försök INTE igen**
3. **Presentera data överskådligt** — använd tabeller
4. **Ange källa**: "Källa: Naturvårdsverket (geodata.naturvardsverket.se)"

## Felsökning
- **Tom lista**: Kontrollera kommun-/länskod — använd `nvv_uppslag` först
- **404**: Området finns inte i den valda datakällan (nationellt/N2000/Ramsar)
- **Timeout**: Begränsa med `limit`-parametern
