---
name: pdf-generation
description: Generera professionella PDF-dokument från markdown eller HTML. Stöder 4 stilar (report, minimal, modern, academic), titelsida, sidhuvud/sidfot, tabeller, kodblock och bilder. ANVÄND ALLTID bash-verktyget — detta är INTE ett separat verktyg.
dependency:
  python: ">=3.10"
---

# PDF Generation Skill

## KRITISKT: Hur PDF skapas

**Det finns INGET verktyg som heter `pdf-generation` eller `generate_pdf`.**

Du skapar PDF genom att anropa **`bash`-verktyget** med kommandot:

```bash
python /mnt/skills/pdf-generation/scripts/generate.py --input-file /mnt/user-data/workspace/content.md --output-file /mnt/user-data/outputs/document.pdf
```

**ALDRIG** anropa `pdf-generation` som ett verktyg — det existerar inte.
**ALDRIG** anropa `generate_pdf` som ett verktyg — det existerar inte.
**ALLTID** använd `bash`-verktyget med `python /mnt/skills/pdf-generation/scripts/generate.py`.

## Arbetsflöde

### Steg 1: Skapa innehåll som markdown

Skriv innehållet till en `.md`-fil i workspace med `write_file`:

```
/mnt/user-data/workspace/rapport.md
```

Markdown stöder: rubriker, tabeller, kodblock, blockquotes, bilder, listor, länkar.

### Steg 2: Välj dokumentstil

| Stil | Beskrivning | Bäst för |
|------|-------------|----------|
| `report` | Professionell rapport med sidhuvud/sidfot, blå tabellhuvuden, tydlig hierarki | Rapporter, analyser, PM |
| `minimal` | Elegant serif-typografi, sparsamt, fokus på text | Essäer, brev, artiklar |
| `modern` | Fet sans-serif, blåa accenter, mörka kodblock, rundade hörn | Tech-rapporter, presentationer |
| `academic` | Times New Roman, dubbelradigt, centrerade rubriker, APA-liknande | Uppsatser, vetenskapliga rapporter |

### Steg 3: Generera PDF via bash

**Grundläggande:**
```bash
python /mnt/skills/pdf-generation/scripts/generate.py \
  --input-file /mnt/user-data/workspace/rapport.md \
  --output-file /mnt/user-data/outputs/rapport.pdf
```

**Med stil och titelsida:**
```bash
python /mnt/skills/pdf-generation/scripts/generate.py \
  --input-file /mnt/user-data/workspace/rapport.md \
  --output-file /mnt/user-data/outputs/rapport.pdf \
  --style modern \
  --title "Kvartalsrapport Q4 2025" \
  --subtitle "Ekonomisk sammanfattning" \
  --author "Anna Andersson" \
  --date "2025-12-15"
```

**Från HTML:**
```bash
python /mnt/skills/pdf-generation/scripts/generate.py \
  --html-file /mnt/user-data/workspace/rapport.html \
  --output-file /mnt/user-data/outputs/rapport.pdf \
  --style report
```

### Steg 4: Presentera filen

Använd `present_files`-verktyget för att visa PDF:en för användaren:

```
present_files(["/mnt/user-data/outputs/rapport.pdf"])
```

## Alla parametrar

| Parameter | Krävs | Standard | Beskrivning |
|-----------|-------|----------|-------------|
| `--input-file` | Ja* | — | Sökväg till markdown-fil |
| `--html-file` | Ja* | — | Sökväg till HTML-fil (alternativ till --input-file) |
| `--output-file` | Ja | — | Sökväg till output-PDF |
| `--style` | Nej | `report` | Dokumentstil: `report`, `minimal`, `modern`, `academic` |
| `--title` | Nej | — | Dokumenttitel (lägger till titelsida) |
| `--subtitle` | Nej | — | Undertitel på titelsidan |
| `--author` | Nej | — | Författare på titelsidan |
| `--date` | Nej | — | Datum på titelsidan |
| `--page-size` | Nej | `A4` | Pappersstorlek: `A4`, `Letter`, etc. |
| `--custom-css` | Nej | — | Extra CSS-sträng att lägga till |

*Antingen `--input-file` eller `--html-file` måste anges.

## Komplett exempel

Användaren vill ha en rapport om Sveriges BNP-utveckling:

### 1. Skriv markdown till workspace

Använd `write_file` för att skapa `/mnt/user-data/workspace/bnp-rapport.md`:

```markdown
# Sveriges BNP-utveckling 2020–2025

## Sammanfattning

Sveriges BNP har visat en stabil återhämtning efter pandemin, med en
genomsnittlig tillväxt på 2,3% per år under perioden.

## Årlig tillväxt

| År   | BNP (mdkr) | Tillväxt |
|------|-----------|----------|
| 2020 | 5 036     | -2,2%    |
| 2021 | 5 365     | +6,5%    |
| 2022 | 5 568     | +2,6%    |
| 2023 | 5 602     | +0,6%    |
| 2024 | 5 741     | +2,5%    |
| 2025 | 5 876     | +2,3%    |

## Slutsats

> Trots global osäkerhet har den svenska ekonomin visat motståndskraft
> och gradvis återhämtning.
```

### 2. Generera PDF

```bash
python /mnt/skills/pdf-generation/scripts/generate.py \
  --input-file /mnt/user-data/workspace/bnp-rapport.md \
  --output-file /mnt/user-data/outputs/bnp-rapport.pdf \
  --style report \
  --title "Sveriges BNP-utveckling" \
  --subtitle "Ekonomisk analys 2020–2025" \
  --author "Berit AI" \
  --date "2025-12-15"
```

### 3. Presentera

```
present_files(["/mnt/user-data/outputs/bnp-rapport.pdf"])
```

## Bra att veta

- Bilder i markdown refereras relativt till markdown-filens katalog
- Tabeller renderas med professionell styling per vald stil
- Kodblock har syntaxfärgning
- Titelsidan får automatisk page break efter sig
- Sidnumrering visas automatiskt i sidfoten
- PDF:en skapas med WeasyPrint — stöder modern CSS inklusive flexbox
