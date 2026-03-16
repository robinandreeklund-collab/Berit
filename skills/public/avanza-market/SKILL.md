---
name: avanza-market
description: Använd denna färdighet när användaren frågar om aktier, aktiekurs,
  börsen, Avanza, fonder, fondkurser, ETF, certifikat, warranter, utdelning,
  terminer, optioner, orderboken, mäklarstatistik, bolagsanalys, finansiella
  nyckeltal, börskurser, OMXS30, Stockholmsbörsen, köpa aktier, fondförvaltning,
  hållbarhetsbedömning, blankning, kursutveckling, eller Swedish stocks.
mcp-servers: [avanza]
---

# Avanza Marknadsdata (Avanza MCP v1.0)

## Översikt
Ger tillgång till Avanzas publika marknadsdata-API via 34 MCP-verktyg. Sök aktier, hämta kurser, analysera fonder, jämför ETF:er, och mer. Ingen autentisering krävs.

## Tillgängliga MCP-verktyg

### Sökning
| Verktyg | Beskrivning |
|---------|-------------|
| `search_instruments` | Sök aktier, fonder, ETF:er, certifikat etc. efter namn/symbol |
| `get_instrument_by_order_book_id` | Hämta instrument via order book ID |

### Aktier
| Verktyg | Beskrivning |
|---------|-------------|
| `get_stock_info` | Bolagsinformation (bransch, marknad, land) |
| `get_stock_quote` | Aktuell aktiekurs, förändring, volym |
| `get_stock_analysis` | Analytikers rekommendationer och riktkurs |
| `get_stock_chart` | Kurshistorik (diagram-data) |
| `get_orderbook` | Orderbok (köp/sälj-ordrar) |
| `get_marketplace_info` | Marknadsplatsinformation |
| `get_recent_trades` | Senaste avslut |
| `get_broker_trade_summary` | Mäklarstatistik (köp/sälj per mäklare) |
| `get_dividends` | Utdelningshistorik |
| `get_company_financials` | Finansiella nyckeltal (P/E, skuldsättning, etc.) |
| `get_marketmaker_chart` | Market maker-data |

### Fonder
| Verktyg | Beskrivning |
|---------|-------------|
| `get_fund_info` | Fondinformation (typ, avgift, risknivå) |
| `get_fund_sustainability` | Hållbarhetsbedömning |
| `get_fund_chart` | Kursutveckling |
| `get_fund_chart_periods` | Tillgängliga tidsperioder |
| `get_fund_description` | Fondförvaltarens beskrivning |
| `get_fund_holdings` | Fondens innehav |

### ETF:er
| Verktyg | Beskrivning |
|---------|-------------|
| `get_etf_info` | ETF-information |
| `get_etf_details` | Detaljerad ETF-data |
| `filter_etfs` | Filtrera ETF:er |

### Certifikat
| Verktyg | Beskrivning |
|---------|-------------|
| `get_certificate_info` | Certifikatinformation |
| `get_certificate_details` | Detaljerad certifikatdata |
| `filter_certificates` | Filtrera certifikat |

### Warranter
| Verktyg | Beskrivning |
|---------|-------------|
| `get_warrant_info` | Warrantinformation |
| `get_warrant_details` | Detaljerad warrantdata |
| `filter_warrants` | Filtrera warranter |

### Terminer
| Verktyg | Beskrivning |
|---------|-------------|
| `get_future_forward_info` | Termininformation |
| `get_future_forward_details` | Detaljerad termindata |
| `list_futures_forwards` | Lista terminer |
| `get_future_forward_filter_options` | Filteralternativ |

### Övrig data
| Verktyg | Beskrivning |
|---------|-------------|
| `get_number_of_owners` | Antal ägare (Avanza-kunder) |
| `get_short_selling` | Blankningsdata |

## Arbetsflöde

1. **Sök instrument** — Börja med `search_instruments` för att hitta order book ID
2. **Hämta data** — Använd specifikt verktyg med order book ID
3. **Presentera** — Visa i tabell med relevant kontext

### Vanliga frågor
- "Hur går Volvo?" → `search_instruments` → `get_stock_quote`
- "Vilka fonder har bäst hållbarhet?" → `search_instruments` → `get_fund_sustainability`
- "Visa orderbok för Ericsson" → `search_instruments` → `get_orderbook`
- "Utdelningshistorik HM" → `search_instruments` → `get_dividends`

## KRITISKA REGLER
1. **Max 4 verktygsanrop per fråga**
2. **Om ett verktyg misslyckas — försök INTE igen.**
3. **Sök alltid med `search_instruments` först** — order book ID krävs för övriga verktyg
4. **Presentera data överskådligt** — använd tabeller
5. **Ange källa**: "Källa: Avanza (publikt API, inofficiellt)"
6. **Varning**: API:et är inofficiellt och kan ändras utan förvarning

## Felsökning
- **404**: Ogiltigt order book ID — sök efter instrumentet igen
- **429**: Rate limit — vänta och försök senare
- **Timeout**: API:et svarar inte — informera användaren
