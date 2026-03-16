---
name: swedish-education
description: Använd denna färdighet när användaren frågar om svensk utbildning, läroplaner, kursplaner, skolenheter, gymnasieprogram, ämnen, kurser, vuxenutbildning (YH, SFI, Komvux), Skolverket, skoltyper, studievägar, centralt innehåll, kunskapskrav, eller skolstatistik. Denna färdighet använder Skolverket MCP-verktygen för att hämta data direkt från Skolverkets öppna API:er.
mcp-server: skolverket
---

# Svensk Utbildning (Skolverket MCP v2.7.0)

## Översikt

Denna färdighet ger dig tillgång till Sveriges utbildningsdata via Skolverkets öppna API:er. Du har 37 verktyg som täcker läroplaner, skolenheter, gymnasieprogram, vuxenutbildning och skolstatistik.

## Tillgängliga MCP-verktyg

### Läroplan API (Ämnen, Kurser, Program, Läroplaner)

| Verktyg | Beskrivning |
|---------|-------------|
| `search_subjects` | Sök ämnen i läroplanen (filter: skoltyp, tidsperiod) |
| `get_subject_details` | Hämta detaljer om ett ämne (kod krävs) |
| `get_subject_versions` | Hämta alla versioner av ett ämne |
| `search_courses` | Sök kurser (filter: skoltyp, ämneskod, tidsperiod) |
| `get_course_details` | Hämta kursdetaljer inkl. centralt innehåll och kunskapskrav |
| `get_course_versions` | Hämta alla versioner av en kurs |
| `search_programs` | Sök gymnasieprogram och studievägar |
| `get_program_details` | Hämta programdetaljer inkl. inriktningar |
| `get_program_versions` | Hämta versionshistorik för ett program |
| `search_curriculums` | Sök läroplaner (LGR11, GY11, etc.) |
| `get_curriculum_details` | Hämta komplett läroplan med alla avsnitt |
| `get_curriculum_versions` | Hämta versionshistorik för en läroplan |

### Stöddata (Värdesamlingar)

| Verktyg | Beskrivning |
|---------|-------------|
| `get_school_types` | Lista alla skoltyper (GR, GY, VUX, etc.) |
| `get_types_of_syllabus` | Lista alla typer av läroplaner |
| `get_subject_and_course_codes` | Hämta alla ämnes- och kurskoder |
| `get_study_path_codes` | Hämta studievägskoder (programkoder) |
| `get_api_info` | Information om Skolverkets Läroplan API |

### Skolenhetsregistret

| Verktyg | Beskrivning |
|---------|-------------|
| `search_school_units` | Sök skolenheter med filter |
| `get_school_unit_details` | Hämta detaljer om en skolenhet (8-siffrig kod) |
| `get_school_units_by_status` | Filtrera skolenheter efter status (AKTIV, UPPHORT, VILANDE) |
| `search_school_units_by_name` | Sök skolenheter efter namn |
| `search_school_units_v4` | Utökad sökning (kommun, län, skolform, status) |

### Vuxenutbildning (YH, SFI, Komvux)

| Verktyg | Beskrivning |
|---------|-------------|
| `search_adult_education` | Sök vuxenutbildningar med omfattande filter |
| `get_adult_education_details` | Hämta detaljer om ett utbildningstillfälle |
| `filter_adult_education_by_distance` | Filtrera på distans/campus |
| `filter_adult_education_by_pace` | Filtrera efter studietakt (100%, 50%, etc.) |
| `get_education_areas` | Hämta alla utbildningsområden |
| `get_directions` | Hämta alla inriktningar |
| `get_adult_education_areas_v4` | Hämta utbildningsområden och inriktningar (YH, SFI, Komvux) |

### Gymnasieutbildningar & Statistik

| Verktyg | Beskrivning |
|---------|-------------|
| `search_education_events` | Sök gymnasieutbildningar (kommun, län, programkod, distans) |
| `count_education_events` | Räkna gymnasieutbildningar som matchar filter |
| `count_adult_education_events` | Räkna vuxenutbildningar som matchar filter |
| `get_school_unit_education_events` | Hämta utbildningstillfällen för en skolenhet |
| `get_school_types_v4` | Alla skoltyper med beskrivningar |
| `get_geographical_areas_v4` | Alla län och kommuner |
| `get_programs_v4` | Alla gymnasieprogram med inriktningar |
| `get_school_unit_documents` | Skolinspektionens dokument och rapporter |
| `get_school_unit_statistics` | Statistik för en skolenhet (skolform, läsår) |
| `get_national_statistics` | Nationell statistik per skolform |
| `get_program_statistics` | Programstatistik för gymnasium |

## Arbetsflöde

### Frågor om läroplaner och kurser

1. Identifiera skoltyp: GR (grundskola), GY (gymnasium), VUX (vuxenutbildning)
2. Sök ämne/kurs med `search_subjects` eller `search_courses`
3. Hämta detaljer med `get_subject_details` eller `get_course_details`

### Frågor om skolor

1. Sök med `search_school_units_by_name` eller `search_school_units_v4`
2. Hämta detaljer med `get_school_unit_details`
3. Vid behov: hämta statistik med `get_school_unit_statistics`

### Frågor om gymnasieprogram

1. Lista program med `search_programs` eller `get_programs_v4`
2. Hämta programdetaljer med `get_program_details`
3. Hitta utbildningstillfällen med `search_education_events`

### Frågor om vuxenutbildning

1. Sök med `search_adult_education` (filter: sökord, stad, typ, distans, studietakt)
2. Hämta detaljer med `get_adult_education_details`
3. Använd `get_education_areas` för att se tillgängliga utbildningsområden

## Viktiga parametrar

### Skoltyper
- `GR` = Grundskola
- `GY` = Gymnasium
- `VUX` = Vuxenutbildning
- `GRSÄR` = Grundsärskola
- `GYSÄR` = Gymnasiesärskola

### Tidsperioder (timespan)
- `LATEST` = Gällande (default)
- `FUTURE` = Framtida
- `EXPIRED` = Utgångna
- `MODIFIED` = Ändrade

### Skolenhetsstatus
- `AKTIV` = Aktiv skolenhet
- `UPPHORT` = Upphörd
- `VILANDE` = Vilande

### Vuxenutbildningstyper (typeOfSchool)
- `yh` = Yrkeshögskola
- `sfi` = Svenska för invandrare
- `komvuxgycourses` = Komvux gymnasiekurser

## KRITISKA REGLER

1. **Sök ALLTID först** — gissa inte kurskoder eller skolenhetskoder
2. **Använd rätt skoltyp** — GR för grundskola, GY för gymnasium
3. **Max 5 verktygsanrop per fråga** — sök → detaljer → eventuellt statistik. Sedan SVAR.
4. **Svara på SVENSKA** — alla Skolverkets data är på svenska
5. **Om ett verktyg misslyckas — försök INTE igen.** Gå vidare eller svara med vad du har.
6. **Ange källa**: "Källa: Skolverket (skolverket.se)"

## Exempelfrågor och arbetsflöden

### "Vilka kurser ingår i teknikprogrammet?"

1. `search_programs(schooltype="GY")` → hitta TE-programmets kod
2. `get_program_details(code="TE")` → alla kurser och inriktningar

### "Hitta gymnasieskolor i Malmö"

1. `search_school_units_v4(municipality="Malmö", typeOfSchool="gy", status="AKTIV")` → lista skolor

### "Vad innehåller kursen Matematik 1c?"

1. `get_course_details(code="MATMAT01c")` → centralt innehåll och kunskapskrav

### "Finns det distansutbildningar inom programmering?"

1. `search_adult_education(searchTerm="programmering", distance="true")` → lista utbildningar

### "Visa statistik för en gymnasieskola"

1. `search_school_units_by_name(name="Katedralskolan")` → hitta skolenhetskod
2. `get_school_unit_statistics(code="...", schoolType="gy")` → statistik

## Presentera resultat

- Strukturera svaret tydligt med rubriker
- Visa kurser/ämnen i tabellformat när möjligt
- Inkludera relevanta koder (kurskoder, programkoder) för referens
- Ange alltid källa: "Källa: Skolverket (skolverket.se)"
