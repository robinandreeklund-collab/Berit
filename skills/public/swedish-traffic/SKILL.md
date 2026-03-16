---
name: swedish-traffic
description: Använd denna färdighet när användaren frågar om svensk trafik, trafikstörningar, tågförseningar, väglag, vägarbeten, trafikolyckor, köer, vägavstängningar, trafikkameror, trafikprognoser, väderförhållanden på vägar, halka, vind, temperatur, plogning, saltning, eller annan trafikdata från Trafikverket. Denna färdighet använder Trafikverket MCP-verktygen för att hämta realtidsdata direkt från Trafikverkets öppna API.
mcp-servers: [trafikverket]
---

# Svensk Trafik (Trafikverket MCP v1.0)

## Översikt

Denna färdighet ger dig tillgång till realtids trafikdata via Trafikverkets öppna API. Du har 22 verktyg i 6 kategorier: trafikinfo, tåg, väg, väder, kameror och prognoser.

## Tillgängliga MCP-verktyg

### Trafikinfo (Störningar, Olyckor, Köer, Vägarbeten)

| Verktyg | Beskrivning |
|---------|-------------|
| `trafikverket_trafikinfo_storningar` | Hämta aktuella trafikstörningar (hinder, avbrott, incidenter) på vägar och järnvägar |
| `trafikverket_trafikinfo_olyckor` | Hämta aktuella trafikolyckor och incidenter |
| `trafikverket_trafikinfo_koer` | Hämta aktuella köer och framkomlighetsproblem |
| `trafikverket_trafikinfo_vagarbeten` | Hämta planerade och pågående vägarbeten samt omledningar |

### Tåg (Förseningar, Tidtabell, Stationer, Inställda)

| Verktyg | Beskrivning |
|---------|-------------|
| `trafikverket_tag_forseningar` | Hämta tågförseningar per station eller sträcka |
| `trafikverket_tag_tidtabell` | Hämta tidtabell för tågavgångar och ankomster vid en station |
| `trafikverket_tag_stationer` | Sök efter tågstationer och hållplatser |
| `trafikverket_tag_installda` | Hämta inställda tåg per station eller sträcka |

### Väg (Status, Underhåll, Hastighet, Avstängningar)

| Verktyg | Beskrivning |
|---------|-------------|
| `trafikverket_vag_status` | Hämta aktuellt väglag och vägförhållanden per län |
| `trafikverket_vag_underhall` | Hämta info om vägunderhåll (plogning, saltning, etc.) |
| `trafikverket_vag_hastighet` | Hämta hastighetsrestriktioner och hastighetsbegränsningar |
| `trafikverket_vag_avstangningar` | Hämta vägavstängningar och trafikomledningar |

### Väder (Stationer, Halka, Vind, Temperatur)

| Verktyg | Beskrivning |
|---------|-------------|
| `trafikverket_vader_stationer` | Lista väderstationer med senaste mätdata |
| `trafikverket_vader_halka` | Hämta halkvarningar och yttemperatur |
| `trafikverket_vader_vind` | Hämta vinddata (hastighet, byar, riktning) |
| `trafikverket_vader_temperatur` | Hämta luft- och vägtemperatur samt luftfuktighet |

### Kameror (Lista, Snapshot, Status)

| Verktyg | Beskrivning |
|---------|-------------|
| `trafikverket_kameror_lista` | Lista trafikkameror per plats eller län |
| `trafikverket_kameror_snapshot` | Hämta senaste bilden från en specifik trafikkamera |
| `trafikverket_kameror_status` | Kontrollera status på trafikkameror (aktiva/inaktiva) |

### Prognos (Trafik, Väg, Tåg)

| Verktyg | Beskrivning |
|---------|-------------|
| `trafikverket_prognos_trafik` | Hämta trafikflödesdata och prognoser |
| `trafikverket_prognos_vag` | Hämta väglagsprognoser per län |
| `trafikverket_prognos_tag` | Hämta tågprognoser och beräknade ankomsttider |

## Arbetsflöde

### Frågor om trafikstörningar

1. Identifiera typ: störning, olycka, kö eller vägarbete
2. Använd rätt verktyg med plats eller vägnummer som sökord
3. Presentera resultat med störningstyp, plats och tid

### Frågor om tågtrafik

1. Vid behov: sök station med `trafikverket_tag_stationer`
2. Använd rätt verktyg: förseningar, tidtabell eller inställda
3. Stationsnamn skickas som parameter (t.ex. "Stockholm C", "Göteborg C")

### Frågor om väglag

1. Identifiera län eller vägnummer
2. Använd `trafikverket_vag_status` för aktuellt väglag
3. Komplettera med `trafikverket_vag_underhall` för plogning/saltning

### Frågor om väder vid vägar

1. Använd rätt väderverktyg: halka, vind eller temperatur
2. Sök per plats eller vägnamn (t.ex. "E4 Gävle", "Ölandsbron")

### Frågor om trafikkameror

1. Lista kameror med `trafikverket_kameror_lista`
2. Hämta bild med `trafikverket_kameror_snapshot` (kräver kamera-ID från steg 1)

## Filtertyper

Verktygen använder olika filtertyper beroende på kategori:

| Filtertyp | Verktyg | Exempel |
|-----------|---------|---------|
| `location` | Trafikinfo, Vägavstängningar | "E4 Södertälje", "Stockholm" |
| `station` | Tåg, Tågprognoser | "Stockholm C", "Göteborg C" |
| `county` | Vägstatus, Underhåll, Hastighet, Trafikflöde, Vägprognos | Länskod (nummer) |
| `weather` | Väderstationer, Halka, Vind, Temperatur | "E4 Gävle", "Ölandsbron" |
| `camera` | Kameror lista/status | "E4 Stockholm", platsnamn |
| `camera_id` | Kameror snapshot | Kamera-ID (från lista) |

## KRITISKA REGLER

1. **Max 4 verktygsanrop per fråga** — välj rätt verktyg direkt, sedan SVAR
2. **Sök på SVENSKA** — "störningar" inte "disruptions"
3. **Om ett verktyg misslyckas — försök INTE igen.** Gå vidare eller svara med vad du har
4. **Presentera data överskådligt** — använd tabeller och listor
5. **Fråga INTE användaren** om förtydligande — gissa rimliga defaults (hela landet, just nu)
6. **Ange källa**: "Källa: Trafikverket (trafikverket.se)"
7. **Kameror kräver två steg**: lista först (hämta ID), sedan snapshot

## Exempelfrågor och arbetsflöden

### "Finns det trafikstörningar på E4?"

1. `trafikverket_trafikinfo_storningar(query="E4")` → lista störningar

### "Är tågen försenade från Stockholm Central?"

1. `trafikverket_tag_forseningar(query="Stockholm C")` → förseningar

### "Hur är vägläget i Norrbotten?"

1. `trafikverket_vag_status(query="Norrbotten")` → väglag

### "Är det halt på E4 vid Gävle?"

1. `trafikverket_vader_halka(query="E4 Gävle")` → halkdata

### "Visa trafikkameran vid E4 Södertälje"

1. `trafikverket_kameror_lista(query="E4 Södertälje")` → hitta kamera-ID
2. `trafikverket_kameror_snapshot(query="<kamera-ID>")` → bild

### "Hur mycket trafik är det på E4 mot Uppsala?"

1. `trafikverket_prognos_trafik(query="Uppsala")` → trafikflöde

## Presentera resultat

- Strukturera med tydliga rubriker per kategori
- Använd tabeller för listor (störningar, förseningar, etc.)
- Inkludera tidpunkter och allvarlighetsgrad
- Ange alltid källa: "Källa: Trafikverket (trafikverket.se)"
- Om kamerabilder: presentera URL som länk

## Felsökning

- **Inga resultat**: Prova bredare sökterm (län istället för specifik plats)
- **Verktyg misslyckas**: Gå vidare — svara med vad du har
- **Okänd station**: Sök med `trafikverket_tag_stationer` först
