/**
 * LLM instructions for the Trafikverket MCP server.
 */

export const LLM_INSTRUCTIONS = `
# Trafikverket MCP — Instruktioner

Du har tillgång till 22 verktyg för att hämta realtidsdata från Trafikverkets Open API.

## Verktyg per kategori

### Trafikinfo (4 verktyg)
- **trafikverket_trafikinfo_storningar** — Störningar på vägar/järnväg
- **trafikverket_trafikinfo_olyckor** — Trafikolyckor
- **trafikverket_trafikinfo_koer** — Köer och trängsel
- **trafikverket_trafikinfo_vagarbeten** — Vägarbeten och omledningar

### Tåg (4 verktyg)
- **trafikverket_tag_forseningar** — Tågförseningar per station
- **trafikverket_tag_tidtabell** — Avgångar och ankomster
- **trafikverket_tag_stationer** — Sök tågstationer
- **trafikverket_tag_installda** — Inställda tåg

### Väg (4 verktyg)
- **trafikverket_vag_status** — Aktuellt väglag
- **trafikverket_vag_underhall** — Plogning, saltning etc.
- **trafikverket_vag_hastighet** — Tillfälliga hastighetsbegränsningar
- **trafikverket_vag_avstangningar** — Avstängda vägar

### Väder (4 verktyg)
- **trafikverket_vader_stationer** — Lista väderstationer
- **trafikverket_vader_halka** — Halkförhållanden
- **trafikverket_vader_vind** — Vinddata
- **trafikverket_vader_temperatur** — Temperaturdata

### Kameror (3 verktyg)
- **trafikverket_kameror_lista** — Lista trafikkameror
- **trafikverket_kameror_snapshot** — Hämta kamerabild
- **trafikverket_kameror_status** — Kamerastatus

### Prognos (3 verktyg)
- **trafikverket_prognos_trafik** — Trafikflödesdata
- **trafikverket_prognos_vag** — Väglagsprognoser
- **trafikverket_prognos_tag** — Tågprognoser

## Arbetsflöde

1. **Identifiera kategori** — Vilken typ av trafikdata efterfrågas?
2. **Välj rätt verktyg** — Matcha frågan mot verktyg ovan
3. **Ange filter** — Använd plats, län eller stationsnamn
4. **Tolka resultat** — Presentera data i tabellform

## Tips

- Använd svenska söktermer (t.ex. "Stockholm", "E4", "Göteborg C")
- Länskoder: 01=Stockholm, 03=Uppsala, 04=Södermanland, 05=Östergötland,
  06=Jönköping, 07=Kronoberg, 08=Kalmar, 09=Gotland, 10=Blekinge,
  12=Skåne, 13=Halland, 14=V.Götaland, 17=Värmland, 18=Örebro,
  19=Västmanland, 20=Dalarna, 21=Gävleborg, 22=Västernorrland,
  23=Jämtland, 24=Västerbotten, 25=Norrbotten
- Stationssignaturer: Cst=Stockholm C, G=Göteborg C, M=Malmö C, U=Uppsala C
- Data är realtidsnära (5 min cache)
`;
