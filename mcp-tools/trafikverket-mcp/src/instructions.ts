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

## Flerstegsflöden (VIKTIGT)

Vissa frågor kräver **två anrop i sekvens**. Gör alltid steg 1 innan steg 2:

### Kamerabild från en plats
1. **trafikverket_kameror_lista** med plats → Hämta kamera-ID:n
2. **trafikverket_kameror_snapshot** med id → Hämta bilden

Exempel: "Visa kamerabild från E6 Göteborg"
→ Steg 1: \`trafikverket_kameror_lista(plats: "E6 Göteborg")\` → Returnerar kameror med ID
→ Steg 2: \`trafikverket_kameror_snapshot(id: "<kamera-id>")\` → Returnerar bild-URL

### Tåginformation per station
Om stationsnamnet inte matchar exakt:
1. **trafikverket_tag_stationer** med station → Hitta stationssignatur/namn
2. **trafikverket_tag_forseningar** / **trafikverket_tag_tidtabell** med station → Hämta data

### Väglag med prognos
1. **trafikverket_vag_status** med lan → Se aktuellt väglag
2. **trafikverket_prognos_vag** med lan → Se framtida väglag

### Störningar + kamerabild
1. **trafikverket_trafikinfo_storningar** med plats → Hitta störning
2. **trafikverket_kameror_lista** med plats → Hitta kameror i samma område
3. **trafikverket_kameror_snapshot** med id → Visa kamerabild

## Tips

- Använd svenska söktermer (t.ex. "Stockholm", "E4", "Göteborg C")
- Länskoder: 01=Stockholm, 03=Uppsala, 04=Södermanland, 05=Östergötland,
  06=Jönköping, 07=Kronoberg, 08=Kalmar, 09=Gotland, 10=Blekinge,
  12=Skåne, 13=Halland, 14=V.Götaland, 17=Värmland, 18=Örebro,
  19=Västmanland, 20=Dalarna, 21=Gävleborg, 22=Västernorrland,
  23=Jämtland, 24=Västerbotten, 25=Norrbotten
- Stationssignaturer: Cst=Stockholm C, G=Göteborg C, M=Malmö C, U=Uppsala C
- Data är realtidsnära (5 min cache)
- Anropa ALDRIG samma verktyg med samma parametrar två gånger — resultatet är cachat
`;
