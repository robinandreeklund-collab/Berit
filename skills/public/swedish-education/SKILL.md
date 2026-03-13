---
name: swedish-education
description: Använd denna färdighet när användaren frågar om svensk utbildning, läroplaner, kursplaner, ämnesplaner, gymnasieprogram, skolenheter (förskolor, grundskolor, gymnasier), vuxenutbildning (komvux, SFI, yrkeshögskola), kurskoder, betygskriterier, centralt innehåll, eller annan information från Skolverket. Denna färdighet använder Skolverket MCP-verktygen för att hämta data direkt från Skolverkets öppna API:er.
---

# Svensk Utbildning (Skolverket MCP)

## Översikt

Denna färdighet ger dig tillgång till Skolverkets (Statens skolverk) öppna API:er. Du har verktyg för att söka i läroplaner, kursplaner, ämnesplaner, skolenhetsregistret och planerade utbildningar.

## Tillgängliga API:er

| API | Beskrivning |
|-----|-------------|
| **Läroplan API** | Ämnen, kurser, program, läroplaner, kunskapskrav, centralt innehåll |
| **Skolenhetsregistret** | Alla förskolor, grundskolor, gymnasier och andra skolenheter i Sverige |
| **Planerade utbildningar** | Vuxenutbildningar: yrkeshögskola (YH), komvux, SFI |

## Tillgängliga MCP-verktyg

### Läroplan API (ämnen, kurser, program)

| Verktyg | Beskrivning |
|---------|-------------|
| `search_subjects` | Sök ämnen i läroplanen (filtrera på skoltyp: GR, GY, VUX och tidsperiod) |
| `get_subject_details` | Hämta detaljerad info om ett specifikt ämne |
| `get_subject_versions` | Hämta alla versioner av ett ämne |
| `search_courses` | Sök kurser (filtrera på skoltyp, ämneskod, tidsperiod) |
| `get_course_details` | Hämta kursdetaljer inkl. centralt innehåll och kunskapskrav |
| `get_course_versions` | Hämta alla versioner av en kurs |
| `search_programs` | Sök gymnasieprogram och studievägar |
| `get_program_details` | Hämta programdetaljer inkl. inriktningar |
| `get_program_versions` | Versionshistorik för ett program |
| `search_curriculums` | Sök läroplaner (LGR22, GY11, etc.) |
| `get_curriculum_details` | Hämta komplett läroplan med alla avsnitt |
| `get_curriculum_versions` | Versionshistorik för en läroplan |
| `analyze_course` | Analysera en kurs med centralt innehåll och kunskapskrav |
| `compare_curriculum_versions` | Jämför två versioner av ett ämne eller kurs |

### Referensdata

| Verktyg | Beskrivning |
|---------|-------------|
| `get_school_types` | Lista alla skoltyper (GR, GY, VUX, etc.) |
| `get_types_of_syllabus` | Lista alla typer av läroplaner |
| `get_subject_and_course_codes` | Alla tillgängliga ämnes- och kurskoder |
| `get_study_path_codes` | Studievägskoder (programkoder) |
| `get_api_info` | Information om Skolverkets Läroplan API |

### Skolenhetsregistret

| Verktyg | Beskrivning |
|---------|-------------|
| `search_school_units` | Sök skolenheter med filter |
| `get_school_unit_details` | Detaljer om en specifik skolenhet (8-siffrig kod) |
| `get_school_units_by_status` | Filtrera skolenheter efter status (AKTIV, UPPHORT, VILANDE) |
| `search_school_units_by_name` | Sök skolenheter efter namn |

### Vuxenutbildning (YH, Komvux, SFI)

| Verktyg | Beskrivning |
|---------|-------------|
| `search_adult_education` | Sök vuxenutbildningar med filter (sökord, stad, typ, distans, studietakt) |
| `get_adult_education_details` | Detaljerad info om ett utbildningstillfälle |
| `find_adult_education` | Hitta vuxenutbildningar baserat på kriterier |
| `health_check` | Kontrollera API-status |

## Arbetsflöde

### Steg 1: Identifiera rätt verktyg

Beroende på frågan, välj rätt kategori:

- **Ämnen/kurser/program** -> Läroplan API-verktygen
- **Hitta en skola** -> Skolenhetsregistret
- **Vuxenutbildning** -> Planerade utbildningar

### Steg 2: Sök bred, förfina sen

Börja med en bred sökning och förfina:

```
search_subjects(schooltype="GY")           # Alla gymnasieämnen
search_courses(subjectCode="MAT")          # Alla matematikkurser
search_school_units(status="AKTIV")        # Alla aktiva skolor
search_adult_education(town="Stockholm")   # Utbildningar i Stockholm
```

### Steg 3: Hämta detaljer

När du hittat rätt, hämta fullständiga detaljer:

```
get_course_details(code="MATMAT01c")       # Matematik 1c - centralt innehåll + kunskapskrav
get_program_details(code="NA")             # Naturvetenskapsprogrammet
get_school_unit_details(code="12345678")   # Specifik skola
```

## Vanliga frågor och exempelarbetsflöden

### "Vad innehåller Matematik 1c?"

1. `get_course_details(code="MATMAT01c")` -> centralt innehåll och kunskapskrav

### "Vilka gymnasieprogram finns det?"

1. `search_programs(schooltype="GY")` -> lista alla gymnasieprogram

### "Jämför Lgr11 och Lgr22"

1. `search_curriculums()` -> hitta koderna
2. `get_curriculum_details(code="LGR11")` -> första versionen
3. `get_curriculum_details(code="LGR22")` -> andra versionen

### "Vilka skolor finns i Malmö?"

1. `search_school_units_by_name(name="Malmö")` -> skolor med Malmö i namnet

### "Hitta YH-utbildningar inom IT"

1. `search_adult_education(searchTerm="IT", typeOfSchool="yh")` -> YH-utbildningar

### "Vilka kurser finns i Svenska?"

1. `search_courses(subjectCode="SVE")` -> alla svenskakurser

## Skoltyper

| Kod | Skoltyp |
|-----|---------|
| GR | Grundskolan |
| GY | Gymnasieskolan |
| VUX | Vuxenutbildning |
| GRSÄR | Grundsärskolan |
| GYSÄR | Gymnasiesärskolan |
| SFI | Svenska för invandrare |

## Tidsperioder

| Värde | Beskrivning |
|-------|-------------|
| LATEST | Gällande (standard) |
| FUTURE | Framtida (beslutade men ej ikraft) |
| EXPIRED | Utgångna |
| MODIFIED | Ändrade |

## Presentera resultat

- Presentera data i tydliga tabeller (Markdown-format)
- Ange alltid källa: "Källa: Skolverket (Statens skolverk)"
- Förklara utbildningstermer som kan vara oklara
- Vid kursplansinformation, strukturera centralt innehåll och kunskapskrav tydligt
- Använd svenska termer (ej översätt skoltyper/kurskoder)

## Felsökning

- **Tom sökning**: Prova bredare söktermer eller andra filter
- **Kurs/ämne hittas inte**: Kontrollera koden med `get_subject_and_course_codes`
- **Skolenhet hittas inte**: Använd `search_school_units_by_name` med del av namnet
- **Timeout**: Skolverkets API kan ibland vara långsamt — försök igen
