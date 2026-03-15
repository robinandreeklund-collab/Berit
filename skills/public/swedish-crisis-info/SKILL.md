---
name: swedish-crisis-info
description: Använd denna färdighet när användaren frågar om kriser i Sverige, krisinformation, VMA, Viktigt Meddelande till Allmänheten, krislarm, varningar, olyckor, naturkatastrofer, översvämningar, stormar, samhällsstörningar, MSB, beredskap, nödläge, aktuella kriser och larm, vädervarningar, evakuering, eller krishantering i Sverige. Denna färdighet använder Krisinformation MCP-verktygen för att hämta data direkt från Krisinformation.se (MSB) API.
---

# Krisinformation (Krisinformation MCP v1.0)

## Översikt

2 verktyg för att hämta krisinformation från Krisinformation.se (MSB). Täcker krisnyheter, olyckor, samhällsstörningar och aktiva VMA-varningar (Viktigt Meddelande till Allmänheten).

**Nollresultat är normalt** — om inga kriser pågår returneras tomma listor.

## Tillgängliga MCP-verktyg

| Verktyg | Beskrivning |
|---------|-------------|
| `krisinformation_search` | Sök krisnyheter och händelser (senaste 1–30 dagarna) |
| `krisinformation_active` | Hämta aktiva VMA-varningar just nu |

## Arbetsflöde

### Frågor om aktuella kriser / "Är det kris?"

1. `krisinformation_active()` → aktiva VMA (ofta tomt = inga aktiva VMA)
2. `krisinformation_search(days=3)` → senaste 3 dagarnas krisnyheter

### Frågor om kriser i ett specifikt län

1. `krisinformation_active(county="01")` → VMA i Stockholm
2. `krisinformation_search(county="01", days=7)` → krisnyheter i Stockholm senaste veckan

### "Finns det aktiva VMA?"

1. `krisinformation_active()` → lista aktiva VMA (tomt = lugnt)

### "Vad har hänt senaste veckan?"

1. `krisinformation_search(days=7)` → alla krisnyheter senaste 7 dagarna

## Parametrar

### county — Länskod

| Kod | Län |
|-----|-----|
| 01 | Stockholms län |
| 03 | Uppsala län |
| 04 | Södermanlands län |
| 05 | Östergötlands län |
| 06 | Jönköpings län |
| 07 | Kronobergs län |
| 08 | Kalmar län |
| 09 | Gotlands län |
| 10 | Blekinge län |
| 12 | Skåne län |
| 13 | Hallands län |
| 14 | Västra Götalands län |
| 17 | Värmlands län |
| 18 | Örebro län |
| 19 | Västmanlands län |
| 20 | Dalarnas län |
| 21 | Gävleborgs län |
| 22 | Västernorrlands län |
| 23 | Jämtlands län |
| 24 | Västerbottens län |
| 25 | Norrbottens län |

OBS: Kod 02, 11, 15, 16 existerar inte i detta API.

### days — Antal dagar tillbaka

- Min: 1, Max: 30, Standard: 7

## VMA-allvarlighetsgrader

| Grad | Beskrivning |
|------|-------------|
| Severe | Allvarlig fara — omedelbar åtgärd krävs |
| Moderate | Måttlig fara — var uppmärksam |
| Minor | Låg fara — informationsmeddelande |

## KRITISKA REGLER

1. **Max 4 verktygsanrop per fråga** — typiskt räcker 1–2 anrop
2. **Börja alltid med `krisinformation_active`** för VMA-frågor
3. **Om verktyget misslyckas — försök INTE igen.** Svara med vad du har
4. **Tomt resultat = inga kriser** — informera användaren att det är lugnt
5. **Presentera VMA tydligt** — markera allvarlighetsgrad, plats och åtgärder
6. **Fråga INTE användaren** om förtydligande — gissa rimliga defaults
7. **Ange källa**: "Källa: Krisinformation.se (MSB)"

## Exempelfrågor och arbetsflöden

### "Finns det aktiva VMA i Sverige?"

1. `krisinformation_active()` → aktiva VMA-varningar

### "Kriser i Skåne senaste veckan?"

1. `krisinformation_active(county="12")` → aktiva VMA i Skåne
2. `krisinformation_search(county="12", days=7)` → krisnyheter i Skåne

### "Har det hänt något allvarligt i Sverige?"

1. `krisinformation_active()` → VMA
2. `krisinformation_search(days=3)` → senaste 3 dagarna

### "Vädervarningar?"

1. `krisinformation_active()` → VMA (inkl. väderrelaterade)
2. `krisinformation_search(days=1)` → senaste nyheter

## Felsökning

- **Tom data (VMA):** Inga aktiva VMA just nu — helt normalt, informera användaren att det är lugnt
- **Tom data (nyheter):** Inga krisnyheter under perioden — prova längre tidsperiod (days=14)
- **Timeout:** MSB:s API kan vara långsamt — försök inte igen, informera användaren
- **Fel länskod:** Kontrollera att koden finns i tabellen ovan (02, 11, 15, 16 saknas)
