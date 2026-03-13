# Berit - DeerFlow med Lokal LLM (LM Studio)

Detta projekt ar en fork av [DeerFlow](https://github.com/bytedance/deer-flow) konfigurerad for att anvanda en lokal LLM via LM Studio.

**LLM:** Nemotron 3 Nano
**LM Studio:** http://192.168.50.170:8000

---

## Steg 1: Installera systemkrav

Du behover foljande verktyg installerade:

```bash
# Node.js 22+ (https://nodejs.org)
node -v   # ska visa v22.x eller hogre

# pnpm (pakethanterare for frontend)
npm install -g pnpm

# uv (Python-pakethanterare for backend)
curl -LsSf https://astral.sh/uv/install.sh | sh

# nginx (reverse proxy)
# Ubuntu/Debian:
sudo apt install nginx
# macOS:
brew install nginx
```

Verifiera att allt ar installerat:

```bash
make check
```

---

## Steg 2: Starta LM Studio

1. Oppna LM Studio pa maskinen (192.168.50.170)
2. Ladda modellen **Nemotron 3 Nano**
3. Starta servern pa port **8000**
4. Se till att "Serve on network" ar aktiverat sa andra maskiner kan na den

Testa att LM Studio svarar:

```bash
curl http://192.168.50.170:8000/v1/models
```

Du bor fa tillbaka en JSON-lista med tillgangliga modeller.

---

## Steg 3: Installera projektberoenden

```bash
make install
```

Detta installerar:
- Backend Python-beroenden (via `uv`)
- Frontend Node.js-beroenden (via `pnpm`)

---

## Steg 4: Konfigurera API-nycklar (valfritt)

Filen `.env` i projektroten innehaller nycklar for externa tjanster. LM Studio kraver **ingen API-nyckel**.

Om du vill anvanda websok-funktionen, skaffa en gratis Tavily-nyckel:

1. Ga till https://tavily.com och skapa ett konto
2. Redigera `.env` och satt din nyckel:

```bash
TAVILY_API_KEY=din-tavily-nyckel-har
```

**OBS:** Websok ar valfritt. DeerFlow fungerar utan det, men agenten kan inte soka pa natet.

---

## Steg 5: Starta DeerFlow

```bash
make dev
```

Detta startar fyra tjanster:
1. **LangGraph** (agent-server) pa port 2024
2. **Gateway API** pa port 8001
3. **Frontend** (Next.js) pa port 3000
4. **Nginx** (reverse proxy) pa port 2026

---

## Steg 6: Oppna i webblasaren

Ga till: **http://localhost:2026**

Du bor se DeerFlow-gransssnittet. Nemotron 3 Nano visas som tillganglig modell.

---

## Felsökning

### "Model not found" eller anslutningsfel
- Kontrollera att LM Studio kör: `curl http://192.168.50.170:8000/v1/models`
- Kontrollera att porten 8000 är öppen i brandväggen
- Kontrollera att "Serve on network" är aktiverat i LM Studio

### LangGraph startar inte
- Kolla loggen: `cat logs/langgraph.log`
- Vanligaste felet: Python-beroenden saknas. Kör `cd backend && uv sync`

### Frontend startar inte
- Kolla loggen: `cat logs/frontend.log`
- Vanligaste felet: Node-beroenden saknas. Kör `cd frontend && pnpm install`

### Modellnamnet stämmer inte
Om din modell i LM Studio har ett annat namn än `nemotron-3-nano`, uppdatera `config.yaml`:

```yaml
models:
  - name: nemotron-3-nano
    model: ditt-faktiska-modellnamn-i-lm-studio  # Ändra här
    base_url: http://192.168.50.170:8000/v1
    ...
```

Du kan se exakt modellnamn via:
```bash
curl http://192.168.50.170:8000/v1/models
```

---

## Stoppa DeerFlow

```bash
make stop
```

## Viktiga filer

| Fil | Syfte |
|-----|-------|
| `config.yaml` | Huvudkonfiguration - modeller, verktyg, sandbox |
| `.env` | API-nycklar for externa tjanster |
| `frontend/.env` | Frontend-konfiguration |
| `logs/` | Loggfiler for alla tjanster |
