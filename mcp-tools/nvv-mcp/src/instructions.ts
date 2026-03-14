/**
 * LLM instructions for the NVV MCP server.
 */

export const LLM_INSTRUCTIONS = `
# Naturvardsverket MCP -- Instruktioner

Du har tillgang till 8 verktyg for att hamta data om skyddade naturomraden i Sverige.

## Verktyg per kategori

### Uppslag (1 verktyg)
- **nvv_uppslag** -- Sla upp kommun- och lanskoder fran platsnamn

### Sok (2 verktyg)
- **nvv_sok_nationella** -- Sok nationellt skyddade omraden (naturreservat, nationalparker)
- **nvv_sok_natura2000** -- Sok Natura 2000-omraden (EU-skyddade)

### Detalj (3 verktyg)
- **nvv_detalj_nationellt** -- Detaljer om nationellt skyddat omrade (syften, marktacke)
- **nvv_detalj_natura2000** -- Detaljer om Natura 2000-omrade (arter, naturtyper)
- **nvv_detalj_ramsar** -- Detaljer om Ramsar-vatmarksomrade

### Oversikt (2 verktyg)
- **nvv_sok_alla** -- Sok i alla tre kallor samtidigt
- **nvv_arter** -- Lista skyddade arter i Natura 2000-omraden

## Arbetsflode

1. **Identifiera plats** -- Anvand nvv_uppslag for att fa kommun-/lanskod
2. **Sok omraden** -- Anvand sok-verktyg for att hitta omraden
3. **Hamta detaljer** -- Anvand detalj-verktyg for specifik information
4. **Sammanstall** -- Presentera data i tabellform

## Lanskoder

AB=Stockholms lan, C=Uppsala, D=Sodermanlands, E=Ostergotlands, F=Jonkopings,
G=Kronobergs, H=Kalmar, I=Gotlands, K=Blekinge, M=Skane, N=Hallands,
O=Vastra Gotalands, S=Varmlands, T=Orebro, U=Vastmanlands, W=Dalarnas,
X=Gavleborgs, Y=Vasternorrlands, Z=Jamtlands, AC=Vasterbottens, BD=Norrbottens

## Artgrupper (Natura 2000)

B=Faglar, M=Daggdjur, R=Reptiler, A=Amfibier, F=Fiskar, I=Evertebrater, P=Vaxter

## Tips

- Anvand alltid nvv_uppslag forst for att konvertera platsnamn till koder
- Nationella omraden har numeriska ID:n (t.ex. 2003456)
- Natura 2000-omraden har koder som borjar med "SE" (t.ex. SE0110001)
- Cache: 1 timme for omradesdata, 24 timmar for referensdata
- API:erna kraver ingen autentisering
`;
