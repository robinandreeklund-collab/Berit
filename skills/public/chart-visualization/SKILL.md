---
name: chart-visualization
description: Visualisera data som diagram. Välj diagramtyp, bygg JSON-payload, kör via bash med node scripts/generate.js. ANVÄND ALLTID bash-verktyget — detta är INTE ett separat verktyg.
dependency:
  nodejs: ">=18.0.0"
---

# Chart Visualization Skill

## KRITISKT: Hur diagram skapas

**Det finns INGET verktyg som heter `chart-visualization` eller `generate_*_chart`.**

Du skapar diagram genom att anropa **`bash`-verktyget** med kommandot:

```bash
cd /mnt/skills/chart-visualization && node scripts/generate.js '{"tool":"generate_line_chart","args":{"data":[...],"title":"..."}}'
```

**ALDRIG** anropa `chart-visualization` som ett verktyg — det existerar inte.
**ALDRIG** anropa `generate_line_chart` som ett verktyg — det existerar inte.
**ALLTID** använd `bash`-verktyget med `node scripts/generate.js`.

## Arbetsflöde

### Steg 1: Välj diagramtyp

| Data | Diagramtyp (tool-värde) |
|------|------------------------|
| Trend/tidsserie | `generate_line_chart` eller `generate_area_chart` |
| Jämförelse/kategorier | `generate_bar_chart` eller `generate_column_chart` |
| Andel/fördelning | `generate_pie_chart` eller `generate_treemap_chart` |
| Korrelation | `generate_scatter_chart` |
| Flöde | `generate_sankey_chart` |
| Statistisk fördelning | `generate_boxplot_chart` eller `generate_violin_chart` |
| Frekvens | `generate_histogram_chart` |
| Multi-dimensionell | `generate_radar_chart` |
| Process/tratt | `generate_funnel_chart` |
| Procent/framsteg | `generate_liquid_chart` |
| Ordmoln | `generate_word_cloud_chart` |
| Karta (regioner) | `generate_district_map` |
| Karta (punkter) | `generate_pin_map` |
| Karta (rutt) | `generate_path_map` |
| Organisation | `generate_organization_chart` |
| Tankekarta | `generate_mind_map` |
| Nätverk | `generate_network_graph` |
| Fiskbensdiagram | `generate_fishbone_diagram` |
| Flödesdiagram | `generate_flow_diagram` |
| Tabell/kalkylblad | `generate_spreadsheet` |
| Två Y-axlar | `generate_dual_axes_chart` |
| Venn | `generate_venn_chart` |

### Steg 2: Läs referensdokumentation

Läs filen `references/<tool-namn>.md` för att se vilka fält som krävs:

```
read_file references/generate_line_chart.md
```

### Steg 3: Bygg JSON-payload och kör via bash

```bash
cd /mnt/skills/chart-visualization && node scripts/generate.js '{"tool":"generate_line_chart","args":{"data":[{"year":"2020","value":100},{"year":"2021","value":120}],"title":"Utveckling 2020-2021","xField":"year","yField":"value"}}'
```

### Steg 4: Visa resultatet

Skriptet returnerar en bild-URL. Visa den för användaren med bilden och den data som användes.

## Referensmaterial

Detaljerade specifikationer för varje diagramtyp finns i `references/`-mappen.

## Licens

Denna skill är baserad på [antvis/chart-visualization-skills](https://github.com/antvis/chart-visualization-skills), licensierad under MIT-licensen.
