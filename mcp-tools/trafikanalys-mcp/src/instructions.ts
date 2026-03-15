/**
 * LLM instructions for the Trafikanalys MCP server.
 */

export const LLM_INSTRUCTIONS = `
# Trafikanalys MCP — Instruktioner

Du har tillgång till 8 verktyg för att hämta svensk transportstatistik från Trafikanalys (trafa.se).

## Verktyg per kategori

### Struktur (2 verktyg)
- **trafa_list_products** — Lista alla tillgängliga statistikprodukter
- **trafa_get_product_structure** — Hämta dimensioner och mått för en produkt

### Data (1 verktyg)
- **trafa_query_data** — Flexibelt datauttag med frågesyntax (HUVUDVERKTYGET)

### Fordon (2 verktyg)
- **trafa_cars_in_traffic** — Personbilar registrerade i trafik (t10016)
- **trafa_new_registrations** — Nyregistrerade fordon (t10016)

### Transport (3 verktyg)
- **trafa_vehicle_km** — Fordonskilometer (t0401)
- **trafa_rail_transport** — Järnvägstransporter (t0603)
- **trafa_air_traffic** — Flygtrafik (t0501)

## Arbetsflöde

1. **Identifiera produkt** — Vilken statistikprodukt behövs?
2. **Utforska struktur** — Använd trafa_get_product_structure för att se dimensioner
3. **Välj rätt verktyg** — Använd specialverktyg eller trafa_query_data
4. **Ange filter** — År, drivmedel, ägarkategori etc.
5. **Tolka resultat** — Presentera data i tabellform

## Frågesyntax (trafa_query_data)

Format: PRODUKT|MÅTT|DIMENSION:värde1,värde2|DIMENSION2:värde

Exempel:
- t10016|itrfslut|ar:2024 — Bilar i trafik 2024
- t10016|itrfslut|ar:2023,2024|drivm — Bilar per drivmedel
- t10016|nyregunder|ar:2024 — Nyregistreringar 2024
- t0401|fordonkm|ar:2024 — Fordonskilometer 2024
- t0603||ar:2024 — Järnvägstransporter 2024
- t0501||ar:2024 — Flygtrafik 2024

## Viktiga produktkoder

- t10016 — Personbilar
- t10013 — Lastbilar
- t10011 — Bussar
- t10014 — Motorcyklar
- t0401 — Fordonskilometer
- t0501 — Flygtrafik
- t0603 — Järnvägstransporter
- t0802 — Sjöfart

## Viktiga mått

- itrfslut — I trafik (slutbestånd)
- nyregunder — Nyregistreringar under perioden
- fordonkm — Fordonskilometer

## Dimensioner

- ar — År
- drivm — Drivmedel
- agarkat — Ägarkategori
- kon — Kön

## Tips

- Ingen autentisering krävs
- Språk: lang=sv (standard) eller lang=en
- Cache: 1 timme data, 24 timmar metadata
- Använd trafa_get_product_structure för att se alla tillgängliga dimensioner och mått
`;
