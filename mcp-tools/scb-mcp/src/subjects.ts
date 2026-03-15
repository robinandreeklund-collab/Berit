/**
 * SCB Subject Area Tree (Ämnesområden)
 *
 * 3-level hierarchy matching SCB's official classification.
 * Used by scb_browse to navigate the statistics tree.
 *
 * Level 1: Ämnesområde (e.g., BE = Befolkning)
 * Level 2: Statistikområde (e.g., BE0101 = Befolkningsstatistik)
 * Level 3: Ämne (e.g., BE0101A = Folkmängd)
 */

export interface SubjectNode {
  id: string;
  label: string;
  /** Search keywords to find tables in this area */
  keywords?: string[];
  children?: SubjectNode[];
}

export const SUBJECT_TREE: SubjectNode[] = [
  {
    id: 'AM',
    label: 'Arbetsmarknad',
    keywords: ['arbete', 'jobb', 'sysselsättning', 'arbetslöshet', 'lön', 'yrke'],
    children: [
      {
        id: 'AM0101',
        label: 'Konjunkturstatistik, löner för privat sektor (KLP)',
        keywords: ['lön', 'privat sektor', 'konjunktur'],
        children: [
          { id: 'AM0101A', label: 'Löner', keywords: ['lön', 'lönestatistik', 'privat'] },
        ],
      },
      {
        id: 'AM0103',
        label: 'Konjunkturstatistik, löner för kommuner (KLK)',
        keywords: ['lön', 'kommun', 'offentlig'],
        children: [
          { id: 'AM0103A', label: 'Löner', keywords: ['lön', 'kommun'] },
        ],
      },
      {
        id: 'AM0104',
        label: 'Konjunkturstatistik, sjuklöner',
        keywords: ['sjuklön', 'sjukfrånvaro'],
        children: [
          { id: 'AM0104A', label: 'Sjuklöner', keywords: ['sjuklön'] },
        ],
      },
      {
        id: 'AM0110',
        label: 'Lönestrukturstatistik',
        keywords: ['lönestruktur', 'lönespridning', 'medellön'],
        children: [
          { id: 'AM0110A', label: 'Lönestrukturstatistik, hela ekonomin', keywords: ['lönestruktur', 'medellön', 'löneskillnad'] },
        ],
      },
      {
        id: 'AM0206',
        label: 'Registerbaserad arbetsmarknadsstatistik (RAMS)',
        keywords: ['sysselsättning', 'förvärvsarbetande', 'pendling', 'arbetsställe'],
        children: [
          { id: 'AM0206A', label: 'Sysselsättning, förvärvsarbetande och arbetsinkomster', keywords: ['sysselsättning', 'förvärvsarbetande', 'arbetsinkomst'] },
          { id: 'AM0206B', label: 'Arbetsställen', keywords: ['arbetsställe'] },
          { id: 'AM0206C', label: 'Pendling', keywords: ['pendling', 'arbetspendling'] },
        ],
      },
      {
        id: 'AM0207',
        label: 'Kortperiodisk sysselsättningsstatistik',
        keywords: ['sysselsättning', 'månadsdata'],
      },
      {
        id: 'AM0208',
        label: 'Yrkesregistret med yrkesstatistik',
        keywords: ['yrke', 'SSYK', 'yrkesstatistik'],
        children: [
          { id: 'AM0208Z', label: 'SSYK', keywords: ['yrke', 'SSYK', 'yrkeskod'] },
        ],
      },
      {
        id: 'AM0211',
        label: 'Anställningar',
        keywords: ['anställning', 'anställd', 'nyanställning'],
        children: [
          { id: 'AM0211A', label: 'Anställningar', keywords: ['anställning'] },
        ],
      },
      {
        id: 'AM0301',
        label: 'Arbetskostnadsindex (AKI)',
        keywords: ['arbetskostnad', 'kostnadsindex'],
      },
      {
        id: 'AM0401',
        label: 'Arbetskraftsundersökningarna (AKU)',
        keywords: ['arbetskraft', 'AKU', 'arbetslöshet', 'sysselsättningsgrad', 'arbetslöshetsgrad'],
        children: [
          { id: 'AM0401A', label: 'Grundtabeller AKU', keywords: ['AKU', 'arbetskraft', 'sysselsättning', 'arbetslöshet'] },
          { id: 'AM0401X', label: 'Tillägg till AKU', keywords: ['AKU', 'tillägg'] },
        ],
      },
      {
        id: 'AM9906',
        label: 'Historisk arbetsmarknadsstatistik',
        keywords: ['historisk', 'arbetsmarknad'],
      },
    ],
  },
  {
    id: 'BE',
    label: 'Befolkning',
    keywords: ['befolkning', 'invånare', 'folkmängd', 'demografi', 'hur många bor'],
    children: [
      {
        id: 'BE0001',
        label: 'Namnstatistik',
        keywords: ['namn', 'förnamn', 'efternamn', 'namnstatistik'],
        children: [
          { id: 'BE0001D', label: 'Nyfödda', keywords: ['nyfödda', 'dopnamn', 'barnnamn'] },
          { id: 'BE0001G', label: 'Hela befolkningen', keywords: ['namn', 'förnamn', 'vanligaste namn'] },
        ],
      },
      {
        id: 'BE0101',
        label: 'Befolkningsstatistik',
        keywords: ['befolkning', 'folkmängd', 'födslar', 'dödsfall', 'flyttning', 'invånare'],
        children: [
          { id: 'BE0101A', label: 'Folkmängd', keywords: ['folkmängd', 'invånare', 'befolkning', 'hur många bor', 'antal invånare'] },
          { id: 'BE0101C', label: 'Befolkningstäthet', keywords: ['befolkningstäthet', 'täthet', 'areal', 'befolkning per km'] },
          { id: 'BE0101D', label: 'Födda', keywords: ['födda', 'födelse', 'nativitet', 'barnafödande'] },
          { id: 'BE0101E', label: 'Utrikes födda', keywords: ['utrikes födda', 'utlandsfödda', 'födelseland', 'invandrad'] },
          { id: 'BE0101F', label: 'Utländska medborgare', keywords: ['utländska medborgare', 'medborgarskap'] },
          { id: 'BE0101G', label: 'Befolkningsförändringar', keywords: ['befolkningsförändring', 'folkökning', 'folkminskning', 'befolkningsutveckling'] },
          { id: 'BE0101H', label: 'Födda och döda', keywords: ['födda', 'döda', 'nativitet', 'mortalitet'] },
          { id: 'BE0101I', label: 'Döda', keywords: ['döda', 'dödsfall', 'dödlighet', 'livslängd', 'medellivslängd'] },
          { id: 'BE0101J', label: 'Flyttningar', keywords: ['flyttning', 'inflyttning', 'utflyttning', 'invandring', 'utvandring', 'migration'] },
          { id: 'BE0101N', label: 'Medborgarskapsbyten', keywords: ['medborgarskap', 'naturalisering'] },
          { id: 'BE0101X', label: 'Nyckeltal', keywords: ['nyckeltal', 'befolkningsöversikt'] },
          { id: 'BE0101Y', label: 'Regional statistik (DeSO/RegSO)', keywords: ['DeSO', 'RegSO', 'delområde', 'regional'] },
        ],
      },
      {
        id: 'BE0401',
        label: 'Befolkningsframskrivningar',
        keywords: ['prognos', 'framskrivning', 'befolkningsprognos', 'befolkningsframskrivning'],
        children: [
          { id: 'BE0401A', label: 'Aktuella framskrivningar', keywords: ['prognos', 'framskrivning', 'aktuell'] },
          { id: 'BE0401B', label: 'Äldre framskrivningar', keywords: ['äldre prognos', 'historisk framskrivning'] },
          { id: 'BE0401C', label: 'Äldre alternativa framskrivningar', keywords: ['alternativ prognos'] },
          { id: 'BE0401E', label: 'Aktuella alternativa framskrivningar', keywords: ['alternativ prognos', 'scenario'] },
        ],
      },
    ],
  },
  {
    id: 'BO',
    label: 'Boende, byggande och bebyggelse',
    keywords: ['bostad', 'boende', 'byggande', 'hus', 'lägenhet', 'hyra'],
    children: [
      {
        id: 'BO0101',
        label: 'Bostadsbyggande och ombyggnad',
        keywords: ['bostadsbyggande', 'nybygge', 'ombyggnad', 'bygglov'],
        children: [
          { id: 'BO0101A', label: 'Bostadsbyggande', keywords: ['bostadsbyggande', 'nyproduktion', 'färdigställda'] },
        ],
      },
      {
        id: 'BO0104',
        label: 'Fastighetspriser och lagfarter',
        keywords: ['fastighetspris', 'lagfart', 'huspriser', 'bostadspriser'],
        children: [
          { id: 'BO0104A', label: 'Fastighetspriser', keywords: ['fastighetspris', 'småhus', 'huspriser'] },
        ],
      },
      {
        id: 'BO0201',
        label: 'Bostads- och hyresundersökningen',
        keywords: ['hyra', 'bostadsbestånd', 'boendeform'],
        children: [
          { id: 'BO0201A', label: 'Bostadsbeståndet', keywords: ['bostadsbestånd', 'lägenheter', 'bostäder'] },
          { id: 'BO0201B', label: 'Hyror', keywords: ['hyra', 'boendekostnad'] },
        ],
      },
    ],
  },
  {
    id: 'EN',
    label: 'Energi',
    keywords: ['energi', 'el', 'elkraft', 'bränsle'],
    children: [
      {
        id: 'EN0105',
        label: 'Oljeleveranser',
        keywords: ['olja', 'oljeleverans', 'bensin', 'diesel'],
      },
      {
        id: 'EN0108',
        label: 'Energistatistik för småhus, flerbostadshus och lokaler',
        keywords: ['energianvändning', 'uppvärmning', 'fastighetsenergi'],
      },
      {
        id: 'EN0203',
        label: 'Ämnesövergripande energibalanser',
        keywords: ['energibalans', 'tillförd energi', 'energianvändning'],
      },
    ],
  },
  {
    id: 'FM',
    label: 'Finansmarknad',
    keywords: ['finans', 'bank', 'aktie', 'ränta', 'valuta'],
    children: [
      {
        id: 'FM0001',
        label: 'Finansmarknadsstatistik',
        keywords: ['finansmarknad', 'bank', 'kreditinstitut'],
      },
      {
        id: 'FM5001',
        label: 'Betalningsbalansen',
        keywords: ['betalningsbalans', 'utlandsställning', 'portföljinvestering'],
        children: [
          { id: 'FM5001A', label: 'Direktinvesteringar', keywords: ['direktinvestering', 'utlandsinvestering'] },
        ],
      },
    ],
  },
  {
    id: 'HA',
    label: 'Handel med varor och tjänster',
    keywords: ['handel', 'export', 'import', 'utrikeshandel', 'detaljhandel'],
    children: [
      {
        id: 'HA0101',
        label: 'Utrikeshandel med varor',
        keywords: ['utrikeshandel', 'export', 'import', 'varuhandel'],
        children: [
          { id: 'HA0101A', label: 'Utrikeshandel med varor', keywords: ['export', 'import', 'handelsbalans'] },
        ],
      },
      {
        id: 'HA0103',
        label: 'Utrikeshandel med tjänster',
        keywords: ['tjänstehandel', 'tjänsteexport'],
      },
    ],
  },
  {
    id: 'HE',
    label: 'Hushållens ekonomi',
    keywords: ['hushåll', 'inkomst', 'ekonomi', 'sparande', 'förmögenhet'],
    children: [
      {
        id: 'HE0000',
        label: 'Hushållens ekonomi allmän statistik',
        keywords: ['hushåll', 'ekonomi', 'inkomst'],
      },
      {
        id: 'HE0103',
        label: 'Hushållens ekonomi (HEK)',
        keywords: ['HEK', 'inkomst', 'disponibel inkomst', 'hushållsinkomst'],
        children: [
          { id: 'HE0103A', label: 'Inkomstfördelning', keywords: ['inkomstfördelning', 'gini', 'disponibel inkomst'] },
        ],
      },
      {
        id: 'HE0110',
        label: 'Inkomster och skatter',
        keywords: ['inkomst', 'skatt', 'deklaration', 'medelinkomst'],
        children: [
          { id: 'HE0110A', label: 'Sammanräknad förvärvsinkomst', keywords: ['förvärvsinkomst', 'medelinkomst', 'medianinkomst'] },
          { id: 'HE0110B', label: 'Disponibel inkomst', keywords: ['disponibel inkomst'] },
        ],
      },
    ],
  },
  {
    id: 'HS',
    label: 'Hälso- och sjukvård',
    keywords: ['hälsa', 'sjukvård', 'sjukdom', 'vård', 'läkare'],
    children: [
      {
        id: 'HS0301',
        label: 'Dödsorsaker',
        keywords: ['dödsorsak', 'dödlighet', 'mortalitet'],
      },
    ],
  },
  {
    id: 'JO',
    label: 'Jord- och skogsbruk, fiske',
    keywords: ['jordbruk', 'skog', 'fiske', 'lantbruk', 'gård'],
    children: [
      {
        id: 'JO0104',
        label: 'Jordbruksföretag och företagare',
        keywords: ['jordbruk', 'lantbruk', 'jordbruksföretag'],
      },
      {
        id: 'JO0201',
        label: 'Jordbruksekonomi',
        keywords: ['jordbruksekonomi', 'jordbruksinkomst'],
      },
    ],
  },
  {
    id: 'KU',
    label: 'Kultur och fritid',
    keywords: ['kultur', 'fritid', 'bibliotek', 'museum', 'sport', 'idrott'],
    children: [
      {
        id: 'KU0101',
        label: 'Kulturmiljövård',
        keywords: ['kulturmiljö', 'byggnadsminne', 'riksintresse'],
      },
    ],
  },
  {
    id: 'LE',
    label: 'Levnadsförhållanden',
    keywords: ['levnadsförhållanden', 'jämställdhet', 'integration', 'IT', 'livskvalitet'],
    children: [
      {
        id: 'LE0105',
        label: 'Integration – analys',
        keywords: ['integration', 'nyanländ', 'utrikesfödd'],
        children: [
          { id: 'LE0105A', label: 'Sysselsättning', keywords: ['sysselsättning', 'integration'] },
          { id: 'LE0105B', label: 'Boende', keywords: ['boende', 'integration'] },
          { id: 'LE0105C', label: 'Demografi', keywords: ['demografi', 'integration'] },
          { id: 'LE0105E', label: 'Inkomster', keywords: ['inkomst', 'integration'] },
        ],
      },
      {
        id: 'LE0108',
        label: 'IT bland individer',
        keywords: ['IT', 'internet', 'digitalisering', 'dator'],
      },
      {
        id: 'LE0201',
        label: 'Jämställdhetsstatistik',
        keywords: ['jämställdhet', 'kön', 'löneskillnad', 'jämställd'],
      },
    ],
  },
  {
    id: 'ME',
    label: 'Demokrati',
    keywords: ['demokrati', 'val', 'riksdag', 'kommun', 'förtroendevald', 'politik'],
    children: [
      {
        id: 'ME0104',
        label: 'Allmänna val',
        keywords: ['val', 'riksdagsval', 'kommunval', 'valresultat', 'röstning'],
        children: [
          { id: 'ME0104A', label: 'Riksdagsval', keywords: ['riksdagsval', 'riksdag'] },
          { id: 'ME0104B', label: 'Kommunfullmäktigeval', keywords: ['kommunval', 'kommunfullmäktige'] },
          { id: 'ME0104C', label: 'Regionfullmäktigeval', keywords: ['regionval', 'regionfullmäktige', 'landstingsval'] },
        ],
      },
      {
        id: 'ME0105',
        label: 'Demokratistatistik',
        keywords: ['demokrati', 'förtroendevald', 'politiskt deltagande'],
      },
    ],
  },
  {
    id: 'MI',
    label: 'Miljö',
    keywords: ['miljö', 'utsläpp', 'klimat', 'vatten', 'avfall', 'natur'],
    children: [
      {
        id: 'MI0108',
        label: 'Vattenuttag och vattenanvändning',
        keywords: ['vatten', 'vattenuttag', 'vattenanvändning', 'avlopp'],
      },
      {
        id: 'MI0305',
        label: 'Avfall',
        keywords: ['avfall', 'sopor', 'återvinning', 'avfallshantering'],
      },
      {
        id: 'MI0603',
        label: 'Skyddad natur',
        keywords: ['naturskydd', 'naturreservat', 'nationalpark', 'skyddad natur'],
      },
      {
        id: 'MI0810',
        label: 'Tätorter och småorter',
        keywords: ['tätort', 'småort', 'stadsplanering'],
        children: [
          { id: 'MI0810A', label: 'Befolkning och arealer', keywords: ['tätort', 'befolkning', 'areal'] },
          { id: 'MI0810C', label: 'Förvärvsarbetande', keywords: ['tätort', 'förvärvsarbetande'] },
          { id: 'MI0810E', label: 'Småorter', keywords: ['småort'] },
        ],
      },
      {
        id: 'MI1301',
        label: 'Miljöräkenskaper',
        keywords: ['miljöräkenskap', 'miljöskatt', 'utsläpp', 'växthusgaser', 'koldioxid'],
        children: [
          { id: 'MI1301A', label: 'Miljöskatter', keywords: ['miljöskatt', 'koldioxidskatt'] },
          { id: 'MI1301B', label: 'Utsläpp till luft', keywords: ['utsläpp', 'växthusgaser', 'koldioxid', 'CO2'] },
        ],
      },
    ],
  },
  {
    id: 'NR',
    label: 'Nationalräkenskaper',
    keywords: ['BNP', 'nationalräkenskaper', 'ekonomisk tillväxt', 'bruttonationalprodukt'],
    children: [
      {
        id: 'NR0103',
        label: 'Nationalräkenskaper (ENS)',
        keywords: ['BNP', 'nationalräkenskaper', 'ekonomisk tillväxt'],
        children: [
          { id: 'NR0103A', label: 'BNP kvartal', keywords: ['BNP', 'kvartalsdata', 'tillväxt'] },
          { id: 'NR0103B', label: 'BNP år', keywords: ['BNP', 'årsdata', 'bruttonationalprodukt'] },
        ],
      },
      {
        id: 'NR0105',
        label: 'Regionalräkenskaper',
        keywords: ['regional BNP', 'bruttoregionalprodukt', 'BRP'],
        children: [
          { id: 'NR0105A', label: 'Bruttoregionalprodukt (BRP)', keywords: ['BRP', 'regional ekonomi'] },
        ],
      },
    ],
  },
  {
    id: 'NV',
    label: 'Näringsverksamhet',
    keywords: ['företag', 'näringsliv', 'industri', 'bransch'],
    children: [
      {
        id: 'NV0101',
        label: 'Industriproduktionsindex',
        keywords: ['industri', 'produktion', 'industriindex'],
      },
      {
        id: 'NV0109',
        label: 'Industrins orderingång och omsättning',
        keywords: ['order', 'omsättning', 'industri'],
      },
      {
        id: 'NV0119',
        label: 'Företagens ekonomi',
        keywords: ['företagsekonomi', 'omsättning', 'resultat', 'företag'],
      },
    ],
  },
  {
    id: 'OE',
    label: 'Offentlig ekonomi',
    keywords: ['kommun', 'kommunekonomi', 'skatt', 'offentlig sektor', 'statsbudget'],
    children: [
      {
        id: 'OE0101',
        label: 'Kommunernas och regionernas finanser',
        keywords: ['kommunekonomi', 'kommunal ekonomi', 'kommunalskatt', 'skattesats'],
      },
      {
        id: 'OE0115',
        label: 'Räkenskapssammandrag för kommuner och regioner',
        keywords: ['räkenskapssammandrag', 'kommun', 'region', 'verksamhet', 'kostnad'],
        children: [
          { id: 'OE0115A', label: 'Kommunernas verksamhet', keywords: ['kommun', 'verksamhet', 'kostnad'] },
        ],
      },
    ],
  },
  {
    id: 'PR',
    label: 'Priser och konsumtion',
    keywords: ['pris', 'inflation', 'KPI', 'konsumtion', 'konsumentpris'],
    children: [
      {
        id: 'PR0101',
        label: 'Konsumentprisindex (KPI)',
        keywords: ['KPI', 'konsumentprisindex', 'inflation', 'prisökning'],
        children: [
          { id: 'PR0101A', label: 'KPI', keywords: ['KPI', 'inflation', 'konsumentpris'] },
        ],
      },
      {
        id: 'PR0301',
        label: 'Hushållens utgifter (HUT)',
        keywords: ['hushållsutgifter', 'konsumtion', 'utgifter'],
      },
    ],
  },
  {
    id: 'SO',
    label: 'Socialförsäkring m.m.',
    keywords: ['socialförsäkring', 'pension', 'föräldrapenning', 'sjukpenning'],
    children: [
      {
        id: 'SO0301',
        label: 'Socialtjänststatistik',
        keywords: ['socialtjänst', 'ekonomiskt bistånd', 'försörjningsstöd'],
      },
    ],
  },
  {
    id: 'TK',
    label: 'Transporter och kommunikationer',
    keywords: ['transport', 'trafik', 'fordon', 'bil', 'flyg', 'järnväg', 'kollektivtrafik'],
    children: [
      {
        id: 'TK1001',
        label: 'Fordonsstatistik',
        keywords: ['fordon', 'bil', 'registrering', 'fordonsbestånd'],
        children: [
          { id: 'TK1001A', label: 'Fordonsbestånd', keywords: ['fordon', 'bil', 'bestånd', 'antal bilar'] },
        ],
      },
    ],
  },
  {
    id: 'UF',
    label: 'Utbildning och forskning',
    keywords: ['utbildning', 'skola', 'universitet', 'forskning', 'elev', 'student'],
    children: [
      {
        id: 'UF0501',
        label: 'Befolkningens utbildning',
        keywords: ['utbildningsnivå', 'utbildad', 'utbildningsbakgrund'],
        children: [
          { id: 'UF0501A', label: 'Utbildningsnivå', keywords: ['utbildningsnivå', 'högutbildad'] },
        ],
      },
      {
        id: 'UF0549',
        label: 'Analyser och statistik om befolkningens utbildning',
        keywords: ['utbildning', 'SFI', 'svenskundervisning'],
      },
      {
        id: 'UF0306',
        label: 'Statliga anslag till forskning och utveckling',
        keywords: ['forskning', 'FoU', 'forskningsanslag'],
      },
    ],
  },
  {
    id: 'AA',
    label: 'Ämnesövergripande statistik',
    keywords: ['ämnesövergripande', 'tvärvetenskap'],
    children: [
      {
        id: 'AA0003',
        label: 'Registerdata för integration',
        keywords: ['integration', 'register', 'invandring'],
      },
    ],
  },
  {
    id: 'OV',
    label: 'Övrigt',
    keywords: ['övrigt'],
  },
];

/**
 * Find a node in the tree by its id.
 * Returns the node and its depth (0=level1, 1=level2, 2=level3).
 */
export function findSubjectNode(id: string): { node: SubjectNode; depth: number; path: SubjectNode[] } | undefined {
  const idUpper = id.toUpperCase();
  for (const l1 of SUBJECT_TREE) {
    if (l1.id.toUpperCase() === idUpper) return { node: l1, depth: 0, path: [l1] };
    for (const l2 of l1.children || []) {
      if (l2.id.toUpperCase() === idUpper) return { node: l2, depth: 1, path: [l1, l2] };
      for (const l3 of l2.children || []) {
        if (l3.id.toUpperCase() === idUpper) return { node: l3, depth: 2, path: [l1, l2, l3] };
      }
    }
  }
  return undefined;
}

/**
 * Get the children of a subject node, or all level-1 nodes if no id provided.
 */
export function getSubjectChildren(parentId?: string): SubjectNode[] {
  if (!parentId) return SUBJECT_TREE;
  const result = findSubjectNode(parentId);
  if (!result) return [];
  return result.node.children || [];
}

/**
 * Collect all search keywords for a node and its ancestors.
 */
export function getSearchKeywords(id: string): string[] {
  const result = findSubjectNode(id);
  if (!result) return [];
  const keywords: string[] = [];
  for (const node of result.path) {
    if (node.keywords) keywords.push(...node.keywords);
  }
  // Also add the label itself as a keyword
  keywords.push(result.node.label);
  return [...new Set(keywords)];
}

/**
 * Format the subject tree for display (used in LLM instructions).
 */
export function formatSubjectTree(): string {
  const lines: string[] = ['# SCB Ämnesområden (Subject Areas)\n'];
  for (const l1 of SUBJECT_TREE) {
    lines.push(`## ${l1.id} — ${l1.label}`);
    if (l1.children) {
      for (const l2 of l1.children) {
        lines.push(`  - **${l2.id}** ${l2.label}`);
        if (l2.children) {
          for (const l3 of l2.children) {
            lines.push(`    - ${l3.id}: ${l3.label}`);
          }
        }
      }
    }
    lines.push('');
  }
  return lines.join('\n');
}
