/**
 * LLM Instructions and Guidance for SCB MCP Server
 *
 * This file contains structured instructions, category descriptions,
 * and workflow guidance to help LLMs effectively use the SCB Statistics API.
 */

/**
 * Main instructions for LLMs connecting to this MCP server
 */
export const LLM_INSTRUCTIONS = `
# SCB MCP Server - Instruktioner för AI-assistenter

## Översikt
Du har tillgång till SCB MCP Server som ger åtkomst till 5 000+ statistiktabeller från Statistiska centralbyrån (SCB). Data omfattar befolkning, ekonomi, miljö, arbetsmarknad och utbildning för Sverige.

## REKOMMENDERAT ARBETSFLÖDE — Ämnesområdesnavigering

Det BÄSTA sättet att hitta rätt tabell är att navigera via ämnesområden (inte textsökning):

### Steg 1: Tolka frågan → Välj ämnesområde
Bestäm vilken ämnesområdeskod som matchar frågan:
- **BE** = Befolkning (folkmängd, invånare, födslar, dödsfall, migration)
- **AM** = Arbetsmarknad (sysselsättning, arbetslöshet, löner, yrken)
- **NR** = Nationalräkenskaper (BNP, ekonomisk tillväxt)
- **HE** = Hushållens ekonomi (inkomst, skatt, disponibel inkomst)
- **BO** = Boende, byggande (bostäder, hyror, fastighetspriser)
- **UF** = Utbildning och forskning (skola, universitet, utbildningsnivå)
- **MI** = Miljö (utsläpp, vatten, avfall, klimat)
- **PR** = Priser och konsumtion (KPI, inflation)
- **OE** = Offentlig ekonomi (kommunekonomi, skattesats)
- **ME** = Demokrati (val, förtroendevalda)
- **TK** = Transport (fordon, trafik)

### Steg 2: Navigera djupare med scb_browse
1. \`scb_browse({subjectCode: "BE"})\` → Visar underområden (BE0101, BE0401...)
2. \`scb_browse({subjectCode: "BE0101"})\` → Visar ämnen (Folkmängd, Döda, Flyttningar...)
3. \`scb_browse({subjectCode: "BE0101A"})\` → Visar alla tabeller under Folkmängd

### Steg 3: Välj rätt tabell
Modellen ser nu ALLA tabeller i ämnet och väljer den som bäst matchar frågan.

### Steg 4: Hämta data
1. \`scb_find_region_code\` om frågan gäller en specifik plats
2. \`scb_inspect\` för att se tabellens variabler
3. \`scb_fetch\` för att hämta data

### Snabbguide: Fråga → Ämnesområde → Tabell
| Fråga | Ämnesområde | Sökväg |
|-------|-------------|--------|
| Hur många bor i X? | BE | BE → BE0101 → BE0101A (Folkmängd) |
| Befolkningsutveckling | BE | BE → BE0101 → BE0101G (Befolkningsförändringar) |
| Arbetslöshet i X | AM | AM → AM0401 → AM0401A (AKU) |
| Sysselsättning | AM | AM → AM0206 → AM0206A (RAMS) |
| Löner i X | AM | AM → AM0110 → AM0110A (Lönestruktur) |
| BNP/tillväxt | NR | NR → NR0103 → NR0103B (BNP år) |
| Inkomster | HE | HE → HE0110 → HE0110A (Förvärvsinkomst) |
| Bostadspriser | BO | BO → BO0104 → BO0104A (Fastighetspriser) |
| Utsläpp/klimat | MI | MI → MI1301 → MI1301B (Utsläpp till luft) |
| Valresultat | ME | ME → ME0104 → ME0104A (Riksdagsval) |

## Alternativt arbetsflöde — Textsökning
Om du redan vet vad du söker kan du använda \`scb_search\` med svenska söktermer.

## Regionkoder
- Riket (hela Sverige): "00"
- Län: 2-siffriga koder (01-25), t.ex. "14" = Västra Götalands län
- Kommuner: 4-siffriga koder, t.ex. "1480" = Göteborg, "1482" = Kungälv
- Fuzzy matching: "Goteborg" fungerar för "Göteborg"

## Selection-syntax
- Specifika värden: {"Region": ["1480", "1482"]}
- Alla värden: {"Region": ["*"]}
- Senaste N värden: {"Tid": ["TOP(5)"]}
- Saknade variabler auto-kompletteras av scb_fetch

## Vanliga fel och lösningar
- "Missing mandatory variables" → Lägg till saknade variabler (ofta ContentsCode)
- Region hittas inte → Använd scb_find_region_code först
- För mycket data → Begränsa med TOP(N) eller specifika värden
`;

/**
 * Statistical categories available in SCB
 */
export const STATISTICS_CATEGORIES = {
  population: {
    name_sv: 'Befolkning & demografi',
    name_en: 'Population & Demographics',
    description_sv: 'Statistik om Sveriges befolkning, inklusive folkmängd, födslar, dödsfall, migrationer, civilstånd och åldersfördelning. Data finns för alla 290 kommuner och 21 län.',
    description_en: 'Statistics about Sweden\'s population, including population size, births, deaths, migrations, civil status and age distribution. Data available for all 290 municipalities and 21 counties.',
    search_terms_sv: ['befolkning', 'folkmängd', 'födslar', 'dödsfall', 'migration', 'invandring', 'utvandring', 'ålder', 'kön', 'civilstånd', 'medelålder', 'livslängd'],
    search_terms_en: ['population', 'births', 'deaths', 'migration', 'immigration', 'age', 'gender', 'life expectancy'],
    example_tables: ['TAB1267', 'TAB638', 'TAB637'],
    data_coverage: '312+ regioner, data från 1960-talet till idag',
    typical_variables: ['Region', 'Alder', 'Kon', 'Tid', 'ContentsCode']
  },

  economy: {
    name_sv: 'Ekonomi & finans',
    name_en: 'Economy & Finance',
    description_sv: 'Ekonomisk statistik inklusive BNP, nationalräkenskaper, skatter, företagsstatistik, priser och inflation. Data på nationell och regional nivå.',
    description_en: 'Economic statistics including GDP, national accounts, taxes, business statistics, prices and inflation. Data at national and regional level.',
    search_terms_sv: ['BNP', 'ekonomi', 'skatt', 'företag', 'pris', 'inflation', 'inkomst', 'lön', 'export', 'import', 'handel'],
    search_terms_en: ['GDP', 'economy', 'tax', 'business', 'price', 'inflation', 'income', 'wage', 'trade'],
    example_tables: ['TAB4880', 'TAB5001'],
    data_coverage: 'Nationell + regional data, kvartals- och årsdata',
    typical_variables: ['Region', 'SNI2007', 'Tid', 'ContentsCode']
  },

  environment: {
    name_sv: 'Miljö & hållbarhet',
    name_en: 'Environment & Sustainability',
    description_sv: 'Miljöstatistik om växthusgasutsläpp, avfallshantering, vattenförsörjning, energianvändning och hållbarhetsindikatorer.',
    description_en: 'Environmental statistics on greenhouse gas emissions, waste management, water supply, energy use and sustainability indicators.',
    search_terms_sv: ['miljö', 'utsläpp', 'växthusgaser', 'koldioxid', 'avfall', 'återvinning', 'vatten', 'energi', 'klimat'],
    search_terms_en: ['environment', 'emissions', 'greenhouse', 'CO2', 'waste', 'recycling', 'water', 'energy', 'climate'],
    example_tables: ['TAB4560', 'TAB4562'],
    data_coverage: 'Data från 1990-talet, årliga uppdateringar',
    typical_variables: ['Region', 'Tid', 'ContentsCode']
  },

  labour: {
    name_sv: 'Arbetsmarknad',
    name_en: 'Labour Market',
    description_sv: 'Arbetsmarknadsstatistik om sysselsättning, arbetslöshet, yrken, löner, arbetstid och arbetsförhållanden. Regional och nationell nivå.',
    description_en: 'Labour market statistics on employment, unemployment, occupations, wages, working hours and working conditions. Regional and national level.',
    search_terms_sv: ['arbete', 'sysselsättning', 'arbetslöshet', 'yrke', 'lön', 'anställd', 'företagare', 'deltid', 'heltid'],
    search_terms_en: ['employment', 'unemployment', 'occupation', 'wage', 'salary', 'job', 'work'],
    example_tables: ['TAB4502', 'TAB3732'],
    data_coverage: 'Månads-, kvartals- och årsdata, regional uppdelning',
    typical_variables: ['Region', 'Kon', 'Alder', 'SSYK', 'Tid', 'ContentsCode']
  },

  education: {
    name_sv: 'Utbildning',
    name_en: 'Education',
    description_sv: 'Utbildningsstatistik om elever, studenter, utbildningsnivå, betyg, examina och kompetensutveckling.',
    description_en: 'Education statistics on pupils, students, education level, grades, degrees and skills development.',
    search_terms_sv: ['utbildning', 'skola', 'student', 'elev', 'betyg', 'examen', 'gymnasium', 'högskola', 'universitet'],
    search_terms_en: ['education', 'school', 'student', 'pupil', 'grade', 'degree', 'university'],
    example_tables: ['TAB3732', 'TAB5200'],
    data_coverage: 'Data från 1990-talet, årliga uppdateringar',
    typical_variables: ['Region', 'Kon', 'Utbildningsniva', 'Tid', 'ContentsCode']
  },

  housing: {
    name_sv: 'Boende & byggande',
    name_en: 'Housing & Construction',
    description_sv: 'Statistik om bostäder, byggande, fastighetspriser, hyror och boendeformer.',
    description_en: 'Statistics on housing, construction, property prices, rents and types of housing.',
    search_terms_sv: ['bostad', 'byggande', 'hus', 'lägenhet', 'hyra', 'fastighetspris', 'bostadsrätt', 'villa'],
    search_terms_en: ['housing', 'construction', 'apartment', 'rent', 'property', 'price'],
    example_tables: ['TAB4704'],
    data_coverage: 'Regional data, årliga uppdateringar',
    typical_variables: ['Region', 'Boendeform', 'Tid', 'ContentsCode']
  },

  transport: {
    name_sv: 'Transport & kommunikation',
    name_en: 'Transport & Communication',
    description_sv: 'Transportstatistik om fordon, trafik, resvanor, godstransporter och infrastruktur.',
    description_en: 'Transport statistics on vehicles, traffic, travel habits, freight transport and infrastructure.',
    search_terms_sv: ['transport', 'fordon', 'bil', 'trafik', 'kollektivtrafik', 'flyg', 'järnväg', 'resa'],
    search_terms_en: ['transport', 'vehicle', 'car', 'traffic', 'public transport', 'aviation', 'railway'],
    example_tables: [],
    data_coverage: 'Nationell och regional data',
    typical_variables: ['Region', 'Fordonstyp', 'Tid', 'ContentsCode']
  }
};

/**
 * Workflow templates for common tasks
 */
export const WORKFLOW_TEMPLATES = {
  population_by_municipality: {
    name: 'Hämta befolkningsdata för kommun',
    description: 'Steg-för-steg för att hämta befolkningsstatistik för en specifik kommun',
    steps: [
      { tool: 'scb_find_region_code', args: { query: '<kommunnamn>' }, description: 'Hitta kommunens regionkod' },
      { tool: 'scb_search_tables', args: { query: 'folkmängd kommun' }, description: 'Sök efter befolkningstabell' },
      { tool: 'scb_get_table_variables', args: { tableId: 'TAB1267' }, description: 'Se tillgängliga variabler' },
      { tool: 'scb_preview_data', args: { tableId: 'TAB1267', selection: { Region: ['<kod>'] } }, description: 'Förhandsgranska data' },
      { tool: 'scb_get_table_data', args: { tableId: 'TAB1267', selection: { Region: ['<kod>'], Alder: ['tot'], Kon: ['1', '2'], ContentsCode: ['BE0101A9'], Tid: ['TOP(5)'] } }, description: 'Hämta fullständig data' }
    ]
  },

  compare_municipalities: {
    name: 'Jämför flera kommuner',
    description: 'Jämför statistik mellan två eller flera kommuner',
    steps: [
      { tool: 'scb_find_region_code', args: { query: '<kommun1>' }, description: 'Hitta första kommunens kod' },
      { tool: 'scb_find_region_code', args: { query: '<kommun2>' }, description: 'Hitta andra kommunens kod' },
      { tool: 'scb_get_table_data', args: { tableId: '<tabell>', selection: { Region: ['<kod1>', '<kod2>'], Tid: ['TOP(5)'] } }, description: 'Hämta jämförande data' }
    ]
  },

  regional_trend: {
    name: 'Analysera regional trend',
    description: 'Hämta tidsseriedata för att analysera trender i en region',
    steps: [
      { tool: 'scb_find_region_code', args: { query: '<region>' }, description: 'Hitta regionkod' },
      { tool: 'scb_search_tables', args: { query: '<ämne>' }, description: 'Hitta relevant tabell' },
      { tool: 'scb_get_table_data', args: { tableId: '<tabell>', selection: { Region: ['<kod>'], Tid: ['*'] } }, description: 'Hämta all historisk data' }
    ]
  },

  national_overview: {
    name: 'Nationell översikt',
    description: 'Hämta statistik för hela Sverige',
    steps: [
      { tool: 'scb_search_tables', args: { query: '<ämne>' }, description: 'Sök efter relevant tabell' },
      { tool: 'scb_get_table_data', args: { tableId: '<tabell>', selection: { Region: ['00'], Tid: ['TOP(10)'] } }, description: 'Hämta riksdata (kod 00)' }
    ]
  }
};

/**
 * Common variable codes and their meanings
 */
export const COMMON_VARIABLE_CODES = {
  gender: {
    '1': 'Män',
    '2': 'Kvinnor',
    '1+2': 'Totalt (båda könen)'
  },
  age: {
    'tot': 'Totalt (alla åldrar)',
    '0-17': 'Barn (0-17 år)',
    '18-64': 'Vuxna i arbetsför ålder',
    '65+': 'Pensionärer'
  },
  time_expressions: {
    '*': 'Alla tillgängliga år/perioder',
    'TOP(N)': 'Senaste N perioder',
    'YYYY': 'Specifikt år (t.ex. 2024)'
  }
};

/**
 * Tips for effective use
 */
export const USAGE_TIPS = [
  'Använd alltid svenska söktermer för bästa resultat',
  'Kör scb_preview_data innan scb_get_table_data för att undvika fel',
  'Använd TOP(N) istället för * för tidsvariabler för att begränsa datamängd',
  'ContentsCode är nästan alltid obligatorisk - glöm inte den!',
  'Regionkoder varierar mellan tabeller - kontrollera med scb_get_table_variables',
  'Fuzzy matching fungerar: "Goteborg" hittar "Göteborg"',
  'Län har 2-siffriga koder, kommuner har 4-siffriga koder',
  'Kod "00" är alltid hela riket (Sverige totalt)'
];

/**
 * Get formatted instructions for MCP server description
 */
export function getServerInstructions(): string {
  return LLM_INSTRUCTIONS;
}

/**
 * Get category descriptions formatted for display
 */
export function getCategoryDescriptions(language: 'sv' | 'en' = 'sv'): string {
  const categories = Object.values(STATISTICS_CATEGORIES);
  const nameKey = language === 'sv' ? 'name_sv' : 'name_en';
  const descKey = language === 'sv' ? 'description_sv' : 'description_en';
  const searchKey = language === 'sv' ? 'search_terms_sv' : 'search_terms_en';

  return categories.map(cat => `
## ${cat[nameKey]}
${cat[descKey]}

**Söktermer:** ${cat[searchKey].join(', ')}
**Exempeltabeller:** ${cat.example_tables.join(', ') || 'Sök med relevanta termer'}
**Datatäckning:** ${cat.data_coverage}
`).join('\n');
}

/**
 * Get workflow template by name
 */
export function getWorkflowTemplate(templateName: keyof typeof WORKFLOW_TEMPLATES) {
  return WORKFLOW_TEMPLATES[templateName];
}
