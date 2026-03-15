---
name: swedish-crisis-info
description: Använd denna färdighet när användaren frågar om kriser i Sverige, krisinformation, VMA, Viktigt Meddelande till Allmänheten, krislarm, varningar, olyckor, naturkatastrofer, översvämningar, stormar, samhällsstörningar, MSB, beredskap, nödläge, eller aktuella kriser och larm i Sverige.
---

# Krisinformation (Krisinformation MCP v1.0)

## Översikt
2 verktyg för att hämta krisinformation från Krisinformation.se (MSB).

## Tillgängliga MCP-verktyg

| Verktyg | Beskrivning |
|---------|-------------|
| `krisinformation_search` | Sök krisnyheter och händelser |
| `krisinformation_active` | Hämta aktiva VMA-varningar |

## Arbetsflöde

1. **Kolla VMA** — Börja med `krisinformation_active` för att se aktiva varningar
2. **Sök nyheter** — Använd `krisinformation_search` för bredare nyhetssökning
3. **Filtrera** — Ange länskod (county) för att begränsa till ett specifikt län

## Länskoder (urval)

| Kod | Län |
|-----|-----|
| 01 | Stockholms län |
| 12 | Skåne län |
| 14 | Västra Götalands län |
| 20 | Dalarnas län |
| 25 | Norrbottens län |

## KRITISKA REGLER
1. **Max 4 verktygsanrop per fråga**
2. **Om ett verktyg misslyckas — försök INTE igen.**
3. **Presentera data överskådligt** — VMA först, sedan nyheter
4. **Ange källa**: "Källa: Krisinformation.se (MSB)"
