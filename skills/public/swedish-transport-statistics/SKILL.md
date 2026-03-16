---
name: swedish-transport-statistics
description: Använd denna färdighet när användaren frågar om Trafikanalys, transportstatistik, fordon i trafik, bilregistreringar, nyregistreringar, fordonskilometer, järnvägstransport, flygtrafik, sjöfart, punktlighet tåg, drivmedel fordon, elbilsstatistik, trafikutveckling, svenska transporter, trafa.se, eller fordonsflotta Sverige.
mcp-server: trafikanalys
---

# Svensk transportstatistik (Trafikanalys MCP v1.0)

## Översikt
Hämta statistik från Trafikanalys (trafa.se) — Sveriges officiella transportstatistik. Fordon i trafik, nyregistreringar, fordonskilometer, järnväg, flyg, sjöfart m.m.

## Tillgängliga MCP-verktyg

| Verktyg | Beskrivning |
|---------|-------------|
| `trafa_list_products` | Lista alla tillgängliga statistikprodukter |
| `trafa_get_product_structure` | Hämta dimensioner och mått för en produkt |
| `trafa_query_data` | **Huvudverktyg** — Hämta statistisk data med frågesträng |
| `trafa_cars_in_traffic` | Bilar i trafik (snabbåtkomst) |
| `trafa_new_registrations` | Nyregistreringar av fordon |
| `trafa_vehicle_km` | Fordonskilometer |
| `trafa_rail_transport` | Järnvägstransporter |
| `trafa_air_traffic` | Flygtrafik |

## Arbetsflöde

### Fordonsstatistik
1. Använd `trafa_cars_in_traffic` för antal bilar i trafik
2. Använd `trafa_new_registrations` för nyregistreringar
3. Lägg till dimension `drivm` för uppdelning per drivmedel

### Generell sökning
1. Använd `trafa_list_products` för att se alla produkter
2. Använd `trafa_get_product_structure` för att se dimensioner
3. Använd `trafa_query_data` med frågesträng

## Frågesträngsformat
```
PRODUKT|MÅTT|DIMENSION:värde1,värde2|DIMENSION2:värde
```

### Exempel
- `t10016|itrfslut|ar:2024` — Bilar i trafik 2024
- `t10016|itrfslut|ar:2023,2024|drivm` — Per drivmedel
- `t10016|nyregunder|ar:2024` — Nyregistreringar 2024
- `t0401|fordonkm|ar:2024` — Fordonskilometer
- `t0603||ar:2024` — Järnväg 2024

### Vanliga produktkoder
| Kod | Beskrivning |
|-----|-------------|
| t10016 | Personbilar |
| t10013 | Lastbilar |
| t10011 | Bussar |
| t10014 | Motorcyklar |
| t0401 | Fordonskilometer |
| t0501 | Flygtrafik |
| t0603 | Järnvägstransporter |
| t0604 | Tågpunktlighet |
| t0802 | Sjöfart |

### Vanliga dimensioner
- `ar` — År
- `drivm` — Drivmedel (bensin, diesel, el, hybrid, etc.)
- `agarkat` — Ägarkategori
- `kon` — Kön

## KRITISKA REGLER
1. **Max 4 verktygsanrop per fråga**
2. **Om ett verktyg misslyckas — försök INTE igen.**
3. **Presentera data överskådligt** — använd tabeller
4. **Ange källa**: "Källa: Trafikanalys (trafa.se)"

## Felsökning
- Tomt resultat: Kontrollera produktkod och dimensionsnamn
- Felaktig frågesträng: Använd format PRODUKT|MÅTT|DIMENSION:värde
- Okänd produkt: Använd `trafa_list_products` för att lista alla
