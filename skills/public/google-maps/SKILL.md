---
name: google-maps
description: Använd denna färdighet när användaren frågar om kartor, platser, adresser,
  geocoding, vägbeskrivningar, avstånd, restid, navigation, Google Maps, koordinater,
  latitud, longitud, elevation, höjd, tidszon, väder på en plats, nearby places,
  restauranger nära mig, hotell, butiker, sevärdheter, POI, jämför platser, eller
  planera rutt med flera stopp.
---

# Google Maps (Google Maps MCP v1.0)

## Översikt
Ger tillgång till Google Maps API via 13 MCP-verktyg. Sök platser, hämta vägbeskrivningar, geocoda adresser, beräkna avstånd, och mer.

## Tillgängliga MCP-verktyg

| Verktyg | Beskrivning |
|---------|-------------|
| `maps_search_nearby` | Sök närliggande platser (restauranger, hotell, etc.) |
| `maps_search_places` | Textsökning efter platser |
| `maps_place_details` | Hämta detaljerad platsinformation |
| `maps_geocode` | Konvertera adress till koordinater |
| `maps_reverse_geocode` | Konvertera koordinater till adress |
| `maps_directions` | Steg-för-steg vägbeskrivningar |
| `maps_distance_matrix` | Beräkna avstånd och restid mellan punkter |
| `maps_elevation` | Hämta höjddata för koordinater |
| `maps_timezone` | Hämta tidszonsinformation för en plats |
| `maps_weather` | Hämta väderinformation för en plats |
| `maps_explore_area` | Utforska ett område (närliggande platser med detaljer) |
| `maps_plan_route` | Planera rutt med flera stopp |
| `maps_compare_places` | Jämför platser sida vid sida |

## Arbetsflöde

1. **Identifiera behov** — Vill användaren söka platser, navigera, geocoda, eller jämföra?
2. **Välj rätt verktyg:**
   - Platssökning → `maps_search_places` eller `maps_search_nearby`
   - Adress → koordinater → `maps_geocode`
   - Koordinater → adress → `maps_reverse_geocode`
   - Vägbeskrivning → `maps_directions`
   - Avstånd/restid → `maps_distance_matrix`
   - Höjddata → `maps_elevation`
   - Komplex utforskning → `maps_explore_area`
   - Ruttplanering (flera stopp) → `maps_plan_route`
3. **Presentera data** — Visa i tabell med relevanta detaljer

## Vanliga parametrar

### maps_search_nearby
- `location`: Koordinater (lat, lng) eller adress
- `radius`: Sökradie i meter (max 50000)
- `type`: Platstyp (restaurant, hotel, gas_station, etc.)

### maps_directions
- `origin`: Startpunkt (adress eller koordinater)
- `destination`: Slutpunkt
- `mode`: Transportläge (driving, walking, bicycling, transit)

### maps_distance_matrix
- `origins`: Lista med startpunkter
- `destinations`: Lista med slutpunkter
- `mode`: Transportläge

## KRITISKA REGLER
1. **Max 4 verktygsanrop per fråga**
2. **Om ett verktyg misslyckas — försök INTE igen.**
3. **Presentera data överskådligt** — använd tabeller
4. **Ange källa**: "Källa: Google Maps"
5. **Koordinater** — använd format `lat,lng` (t.ex. `59.3293,18.0686` för Stockholm)

## Felsökning
- **INVALID_REQUEST**: Kontrollera att koordinater/adress är giltiga
- **ZERO_RESULTS**: Inga resultat hittades — prova bredare sökning
- **OVER_QUERY_LIMIT**: API-kvoten är slut
