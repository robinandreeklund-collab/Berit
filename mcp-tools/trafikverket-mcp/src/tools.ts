/**
 * 22 tool definitions for the Trafikverket MCP server.
 *
 * Each tool maps to a Trafikverket API objecttype + filter combination.
 */

export interface ToolDefinition {
  id: string;
  name: string;
  description: string;
  category: string;
  objecttype: string;
  schemaVersion: string;
  namespace?: string;
  filterField: string;
  filterType: 'location' | 'station' | 'weather' | 'camera' | 'camera_id' | 'county';
  include?: string[];
  orderBy?: string;
}

export const TOOL_DEFINITIONS: ToolDefinition[] = [
  // ── Trafikinfo (4) ──────────────────────────────────────────────────────
  {
    id: 'trafikverket_trafikinfo_storningar',
    name: 'Trafikverket Trafikinfo — Störningar',
    description:
      'Hämta aktuella trafikstörningar (hinder, avbrott, incidenter) på vägar och järnvägar.\n\n' +
      '**Användningsfall:** Sök störningar per plats, län eller vägnummer.\n' +
      '**Returnerar:** Störningstyp, plats, allvarlighetsgrad, start/sluttid.\n' +
      '**Exempel:** "Störningar på E4 vid Södertälje", "Trafikstörningar i Stockholm"',
    category: 'trafikinfo',
    objecttype: 'Situation',
    schemaVersion: '1.5',
    namespace: 'road.trafficinfo',
    filterField: 'Deviation.LocationDescriptor',
    filterType: 'location',
  },
  {
    id: 'trafikverket_trafikinfo_olyckor',
    name: 'Trafikverket Trafikinfo — Olyckor',
    description:
      'Hämta aktuella trafikolyckor och incidenter.\n\n' +
      '**Användningsfall:** Sök olyckor per plats eller vägnummer.\n' +
      '**Returnerar:** Olyckstyp, plats, tid, allvarlighetsgrad.\n' +
      '**Exempel:** "Olycka på E6 vid Kungsbacka", "Trafikolyckor i Skåne idag"',
    category: 'trafikinfo',
    objecttype: 'Situation',
    schemaVersion: '1.5',
    namespace: 'road.trafficinfo',
    filterField: 'Deviation.LocationDescriptor',
    filterType: 'location',
  },
  {
    id: 'trafikverket_trafikinfo_koer',
    name: 'Trafikverket Trafikinfo — Köer',
    description:
      'Hämta aktuella köer och framkomlighetsproblem på vägar.\n\n' +
      '**Användningsfall:** Kontrollera köer och trängsel per plats.\n' +
      '**Returnerar:** Kötyp, plats, uppskattad fördröjning.\n' +
      '**Exempel:** "Köer i Göteborg just nu", "Köer på E18 mot Stockholm"',
    category: 'trafikinfo',
    objecttype: 'Situation',
    schemaVersion: '1.5',
    namespace: 'road.trafficinfo',
    filterField: 'Deviation.LocationDescriptor',
    filterType: 'location',
  },
  {
    id: 'trafikverket_trafikinfo_vagarbeten',
    name: 'Trafikverket Trafikinfo — Vägarbeten',
    description:
      'Hämta planerade och pågående vägarbeten samt omledningar.\n\n' +
      '**Användningsfall:** Sök vägarbeten per plats eller vägnummer.\n' +
      '**Returnerar:** Vägarbetstyp, plats, start/sluttid, omledningsinfo.\n' +
      '**Exempel:** "Vägarbeten på E4 mot Helsingborg", "Vägarbeten i Skåne"',
    category: 'trafikinfo',
    objecttype: 'Situation',
    schemaVersion: '1.5',
    namespace: 'road.trafficinfo',
    filterField: 'Deviation.LocationDescriptor',
    filterType: 'location',
  },

  // ── Tåg (4) ─────────────────────────────────────────────────────────────
  {
    id: 'trafikverket_tag_forseningar',
    name: 'Trafikverket Tåg — Förseningar',
    description:
      'Hämta tågförseningar per station eller sträcka.\n\n' +
      '**Användningsfall:** Se aktuella förseningar vid en station.\n' +
      '**Returnerar:** Tågnummer, station, annonserad/beräknad tid, försening.\n' +
      '**Exempel:** "Tågförseningar Stockholm C", "Försenade tåg mot Göteborg"',
    category: 'tag',
    objecttype: 'TrainAnnouncement',
    schemaVersion: '1.9',
    filterField: 'LocationSignature',
    filterType: 'station',
    orderBy: 'AdvertisedTimeAtLocation',
  },
  {
    id: 'trafikverket_tag_tidtabell',
    name: 'Trafikverket Tåg — Tidtabell',
    description:
      'Hämta tidtabell för tågavgångar och ankomster vid en station.\n\n' +
      '**Användningsfall:** Visa avgångar/ankomster per station.\n' +
      '**Returnerar:** Tågnummer, destination, spår, planerad/beräknad tid.\n' +
      '**Exempel:** "Avgångar från Malmö C", "Ankomster till Uppsala C"',
    category: 'tag',
    objecttype: 'TrainAnnouncement',
    schemaVersion: '1.9',
    filterField: 'LocationSignature',
    filterType: 'station',
    orderBy: 'AdvertisedTimeAtLocation',
  },
  {
    id: 'trafikverket_tag_stationer',
    name: 'Trafikverket Tåg — Stationer',
    description:
      'Sök efter tågstationer och hållplatser.\n\n' +
      '**Användningsfall:** Hitta stationsinfo (namn, signatur, koordinater).\n' +
      '**Returnerar:** Stationsnamn, signatur, län, koordinater.\n' +
      '**Exempel:** "Tågstationer i Stockholm", "Hitta station Lund"',
    category: 'tag',
    objecttype: 'TrainStation',
    schemaVersion: '1.4',
    filterField: 'AdvertisedLocationName',
    filterType: 'station',
  },
  {
    id: 'trafikverket_tag_installda',
    name: 'Trafikverket Tåg — Inställda',
    description:
      'Hämta inställda tåg per station eller sträcka.\n\n' +
      '**Användningsfall:** Se vilka tåg som är inställda.\n' +
      '**Returnerar:** Tågnummer, station, orsak, tidpunkt.\n' +
      '**Exempel:** "Inställda tåg Stockholm C", "Inställda tåg idag"',
    category: 'tag',
    objecttype: 'TrainAnnouncement',
    schemaVersion: '1.9',
    filterField: 'LocationSignature',
    filterType: 'station',
    orderBy: 'AdvertisedTimeAtLocation',
  },

  // ── Väg (4) ──────────────────────────────────────────────────────────────
  {
    id: 'trafikverket_vag_status',
    name: 'Trafikverket Väg — Status',
    description:
      'Hämta aktuellt väglag och vägförhållanden.\n\n' +
      '**Användningsfall:** Kontrollera väglag per län eller väg.\n' +
      '**Returnerar:** Väglag, orsak, tid, vägnummer.\n' +
      '**Exempel:** "Väglag på E45 i Västra Götaland", "Vägstatus i Norrbotten"',
    category: 'vag',
    objecttype: 'RoadCondition',
    schemaVersion: '1.2',
    filterField: 'CountyNo',
    filterType: 'county',
  },
  {
    id: 'trafikverket_vag_underhall',
    name: 'Trafikverket Väg — Underhåll',
    description:
      'Hämta information om vägunderhåll (plogning, saltning, etc.).\n\n' +
      '**Användningsfall:** Se underhållsaktiviteter per län.\n' +
      '**Returnerar:** Underhållstyp, väg, status, tidpunkt.\n' +
      '**Exempel:** "Plogning i Dalarnas län", "Vägunderhåll E4"',
    category: 'vag',
    objecttype: 'RoadCondition',
    schemaVersion: '1.2',
    filterField: 'CountyNo',
    filterType: 'county',
  },
  {
    id: 'trafikverket_vag_hastighet',
    name: 'Trafikverket Väg — Hastighet',
    description:
      'Hämta hastighetsrestriktioner och hastighetsbegränsningar.\n\n' +
      '**Användningsfall:** Se tillfälliga hastighetsbegränsningar per län.\n' +
      '**Returnerar:** Väg, hastighet, orsak, sträcka.\n' +
      '**Exempel:** "Hastighetsrestriktioner E6 Halland"',
    category: 'vag',
    objecttype: 'RoadCondition',
    schemaVersion: '1.2',
    filterField: 'CountyNo',
    filterType: 'county',
  },
  {
    id: 'trafikverket_vag_avstangningar',
    name: 'Trafikverket Väg — Avstängningar',
    description:
      'Hämta vägavstängningar och trafikomledningar.\n\n' +
      '**Användningsfall:** Hitta avstängda vägar per plats.\n' +
      '**Returnerar:** Väg, orsak, omledning, start/sluttid.\n' +
      '**Exempel:** "Avstängningar på E4", "Vägavstängningar Stockholms län"',
    category: 'vag',
    objecttype: 'Situation',
    schemaVersion: '1.5',
    namespace: 'road.trafficinfo',
    filterField: 'Deviation.LocationDescriptor',
    filterType: 'location',
  },

  // ── Väder (4) ────────────────────────────────────────────────────────────
  {
    id: 'trafikverket_vader_stationer',
    name: 'Trafikverket Väder — Stationer',
    description:
      'Lista väderstationer med senaste mätdata.\n\n' +
      '**Användningsfall:** Hitta väderstationer per plats eller län.\n' +
      '**Returnerar:** Stationsnamn, position, senaste mätvärden.\n' +
      '**Exempel:** "Väderstationer längs E4", "Väderstationer i Jämtland"',
    category: 'vader',
    objecttype: 'WeatherMeasurepoint',
    schemaVersion: '2.1',
    filterField: 'Name',
    filterType: 'weather',
  },
  {
    id: 'trafikverket_vader_halka',
    name: 'Trafikverket Väder — Halka',
    description:
      'Hämta halkvarningar och yttemperatur från väderstationer.\n\n' +
      '**Användningsfall:** Kontrollera halkförhållanden per plats.\n' +
      '**Returnerar:** Station, yttemperatur, is, vatten, snö.\n' +
      '**Exempel:** "Halka E4 Gävle", "Halkvarningar Norrbotten"',
    category: 'vader',
    objecttype: 'WeatherMeasurepoint',
    schemaVersion: '2.1',
    filterField: 'Name',
    filterType: 'weather',
  },
  {
    id: 'trafikverket_vader_vind',
    name: 'Trafikverket Väder — Vind',
    description:
      'Hämta vinddata från väderstationer.\n\n' +
      '**Användningsfall:** Se vindhastighet och riktning per plats.\n' +
      '**Returnerar:** Station, vindhastighet, vindbyar, riktning.\n' +
      '**Exempel:** "Vind på Ölandsbron", "Vindhastighet E6 Halland"',
    category: 'vader',
    objecttype: 'WeatherMeasurepoint',
    schemaVersion: '2.1',
    filterField: 'Name',
    filterType: 'weather',
  },
  {
    id: 'trafikverket_vader_temperatur',
    name: 'Trafikverket Väder — Temperatur',
    description:
      'Hämta temperaturdata från väderstationer.\n\n' +
      '**Användningsfall:** Se lufttemperatur och vägtemperatur per plats.\n' +
      '**Returnerar:** Station, lufttemperatur, vägtemperatur, luftfuktighet.\n' +
      '**Exempel:** "Temperatur E4 Hudiksvall", "Vägtemperatur Dalarna"',
    category: 'vader',
    objecttype: 'WeatherMeasurepoint',
    schemaVersion: '2.1',
    filterField: 'Name',
    filterType: 'weather',
  },

  // ── Kameror (3) ──────────────────────────────────────────────────────────
  {
    id: 'trafikverket_kameror_lista',
    name: 'Trafikverket Kameror — Lista',
    description:
      'Lista trafikkameror per plats eller län.\n\n' +
      '**Användningsfall:** Hitta trafikkameror på en viss sträcka.\n' +
      '**Returnerar:** Kamera-ID, namn, plats, status.\n' +
      '**Exempel:** "Trafikkameror E4 Stockholm", "Kameror i Skåne"',
    category: 'kameror',
    objecttype: 'Camera',
    schemaVersion: '1',
    filterField: 'Name',
    filterType: 'camera',
  },
  {
    id: 'trafikverket_kameror_snapshot',
    name: 'Trafikverket Kameror — Snapshot',
    description:
      'Hämta senaste bilden från en specifik trafikkamera.\n\n' +
      '**Användningsfall:** Visa aktuell kamerabild.\n' +
      '**Returnerar:** Kamera-ID, bild-URL, tidpunkt.\n' +
      '**Exempel:** "Kamerabild E4 Södertälje"',
    category: 'kameror',
    objecttype: 'Camera',
    schemaVersion: '1',
    filterField: 'Id',
    filterType: 'camera_id',
  },
  {
    id: 'trafikverket_kameror_status',
    name: 'Trafikverket Kameror — Status',
    description:
      'Kontrollera status på trafikkameror (aktiva/inaktiva).\n\n' +
      '**Användningsfall:** Se vilka kameror som är i drift.\n' +
      '**Returnerar:** Kamera-ID, namn, aktiv/inaktiv.\n' +
      '**Exempel:** "Aktiva kameror E6", "Kamerastatus Göteborgsområdet"',
    category: 'kameror',
    objecttype: 'Camera',
    schemaVersion: '1',
    filterField: 'Name',
    filterType: 'camera',
  },

  // ── Prognos (3) ──────────────────────────────────────────────────────────
  {
    id: 'trafikverket_prognos_trafik',
    name: 'Trafikverket Prognos — Trafik',
    description:
      'Hämta trafikflödesdata och prognoser.\n\n' +
      '**Användningsfall:** Se trafikflöde och medelhastighet per mätpunkt.\n' +
      '**Returnerar:** Mätpunkt, fordonshastighet, flöde, tidpunkt.\n' +
      '**Exempel:** "Trafikflöde E4 Uppsala", "Trafikprognos Stockholm"',
    category: 'prognos',
    objecttype: 'TrafficFlow',
    schemaVersion: '1.4',
    filterField: 'CountyNo',
    filterType: 'county',
  },
  {
    id: 'trafikverket_prognos_vag',
    name: 'Trafikverket Prognos — Väg',
    description:
      'Hämta väglagsprognoser.\n\n' +
      '**Användningsfall:** Se framtida vägförhållanden per län.\n' +
      '**Returnerar:** Väglag, prognos, tid, län.\n' +
      '**Exempel:** "Väglagsprognos Dalarna", "Vägprognos E45 imorgon"',
    category: 'prognos',
    objecttype: 'RoadCondition',
    schemaVersion: '1.2',
    filterField: 'CountyNo',
    filterType: 'county',
  },
  {
    id: 'trafikverket_prognos_tag',
    name: 'Trafikverket Prognos — Tåg',
    description:
      'Hämta tågprognoser och beräknade ankomsttider.\n\n' +
      '**Användningsfall:** Se prognostiserade ankomsttider.\n' +
      '**Returnerar:** Tågnummer, station, beräknad tid, prognos.\n' +
      '**Exempel:** "Tågprognos Stockholm C", "Beräknade ankomster Göteborg C"',
    category: 'prognos',
    objecttype: 'TrainAnnouncement',
    schemaVersion: '1.9',
    filterField: 'LocationSignature',
    filterType: 'station',
    orderBy: 'AdvertisedTimeAtLocation',
  },
];

/** Look up tool definition by ID (case-insensitive). */
export function getToolById(id: string): ToolDefinition | undefined {
  return TOOL_DEFINITIONS.find((t) => t.id === id.toLowerCase());
}

/** All tool IDs grouped by category. */
export function getToolsByCategory(): Record<string, ToolDefinition[]> {
  const grouped: Record<string, ToolDefinition[]> = {};
  for (const tool of TOOL_DEFINITIONS) {
    if (!grouped[tool.category]) grouped[tool.category] = [];
    grouped[tool.category].push(tool);
  }
  return grouped;
}
