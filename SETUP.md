# Berit - DeerFlow med Lokal LLM (LM Studio)

Komplett steg-for-steg-guide for att satta upp DeerFlow med en lokal LLM via LM Studio i WSL (Windows Subsystem for Linux).

**LLM:** Nemotron 3 Nano
**LM Studio:** http://192.168.50.170:8000
**OS:** WSL2 (Ubuntu)

---

## Forutsattningar

- Windows med WSL2 installerat (Ubuntu rekommenderas)
- LM Studio installerat pa en maskin i natverket (192.168.50.170)
- Git installerat i WSL

---

## Steg 1: Oppna WSL och forbered terminalen

Oppna PowerShell eller Windows Terminal och starta WSL:

```bash
wsl
```

Skapa en arbetsmapp (eller anvand en befintlig):

```bash
mkdir -p ~/projekt
cd ~/projekt
```

---

## Steg 2: Klona repot

```bash
git clone https://github.com/robinandreeklund-collab/Berit.git
cd Berit
git checkout claude/deer-flow-local-llm-146g4
```

---

## Steg 3: Installera Python 3.12 via pyenv

DeerFlow kraver Python 3.12. Enklaste sattet i WSL ar via pyenv:

```bash
# Installera pyenv-beroenden
sudo apt update
sudo apt install -y build-essential libssl-dev zlib1g-dev \
  libbz2-dev libreadline-dev libsqlite3-dev curl git \
  libncursesw5-dev xz-utils tk-dev libxml2-dev libxmlsec1-dev \
  libffi-dev liblzma-dev

# Installera pyenv
curl https://pyenv.run | bash

# Lagg till pyenv i din shell (klistra in allt nedan)
echo '' >> ~/.bashrc
echo '# pyenv' >> ~/.bashrc
echo 'export PYENV_ROOT="$HOME/.pyenv"' >> ~/.bashrc
echo 'export PATH="$PYENV_ROOT/bin:$PATH"' >> ~/.bashrc
echo 'eval "$(pyenv init -)"' >> ~/.bashrc

# Ladda om shell
source ~/.bashrc

# Installera Python 3.12
pyenv install 3.12
pyenv global 3.12

# Verifiera
python --version
# Ska visa: Python 3.12.x
```

---

## Steg 4: Installera uv (Python-pakethanterare)

```bash
curl -LsSf https://astral.sh/uv/install.sh | sh

# Ladda om PATH
source ~/.bashrc

# Verifiera
uv --version
```

---

## Steg 5: Installera Node.js 22 och pnpm

```bash
# Installera Node.js 22 via NodeSource
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs

# Verifiera Node.js
node -v
# Ska visa: v22.x.x

# Installera pnpm
npm install -g pnpm

# Verifiera pnpm
pnpm -v
```

---

## Steg 6: Installera nginx

```bash
sudo apt install -y nginx

# Verifiera
nginx -v
```

---

## Steg 7: Verifiera alla systemkrav

```bash
cd ~/projekt/Berit
make check
```

Du ska se gront bockmarkering for alla fyra: Node.js, pnpm, uv, nginx.
Om nagot saknas, ga tillbaka till relevant steg ovan.

---

## Steg 8: Starta LM Studio

Pa maskinen dar LM Studio kor (192.168.50.170):

1. Oppna LM Studio
2. Ga till **Models** och ladda ner / ladda **Nemotron 3 Nano**
3. Ga till **Server** (ikonen langst till vanster)
4. Se till att **port 8000** ar intstalld
5. Aktivera **"Serve on Local Network"** (viktig! annars kan bara localhost na servern)
6. Klicka **Start Server**

Testa fran WSL att LM Studio svarar:

```bash
curl http://192.168.50.170:8000/v1/models
```

Du ska fa tillbaka JSON med modellnamnet. **Notera modellnamnet** - du behover det i nasta steg.

Exempel pa svar:
```json
{
  "data": [
    {
      "id": "nvidia/Nemotron-3-Nano-4B-v1",
      "object": "model"
    }
  ]
}
```

---

## Steg 9: Uppdatera modellnamnet i config.yaml (om det behövs)

Modellnamnet i `config.yaml` ar satt till `nemotron-3-nano`. Om LM Studio rapporterar ett annat namn (t.ex. `nvidia/Nemotron-3-Nano-4B-v1`), uppdatera det:

```bash
nano config.yaml
```

Hitta raden `model: nemotron-3-nano` och andra till det namn du fick fran `curl`-kommandot:

```yaml
models:
  - name: nemotron-3-nano
    display_name: Nemotron 3 Nano (LM Studio)
    use: langchain_openai:ChatOpenAI
    model: nvidia/Nemotron-3-Nano-4B-v1    # <-- Ändra till ditt modellnamn
    base_url: http://192.168.50.170:8000/v1
    api_key: lm-studio
    max_tokens: 4096
    temperature: 0.7
```

Spara med `Ctrl+O`, `Enter`, `Ctrl+X`.

---

## Steg 10: Installera projektberoenden

```bash
cd ~/projekt/Berit

# Installera backend (Python) och frontend (Node.js)
make install
```

Detta gor:
- `cd backend && uv sync` - skapar virtuell miljo i `backend/.venv` och installerar alla Python-paket
- `cd frontend && pnpm install` - installerar alla Node.js-paket

**OBS:** `uv sync` skapar automatiskt en isolerad `.venv` i `backend/`-mappen. Du behover inte skapa en venv manuellt.

Kontrollera att det fungerade:

```bash
# Backend venv ska finnas
ls backend/.venv/bin/python

# Frontend node_modules ska finnas
ls frontend/node_modules/.pnpm
```

---

## Steg 11: Konfigurera API-nycklar (valfritt men rekommenderat)

LM Studio kraver **ingen API-nyckel**. Men om du vill att agenten ska kunna soka pa natet behover du en Tavily-nyckel:

1. Ga till https://tavily.com och skapa ett gratis konto
2. Kopiera din API-nyckel
3. Redigera `.env` i projektroten:

```bash
nano .env
```

Andra raden:
```
TAVILY_API_KEY=din-riktiga-tavily-nyckel
```

Spara med `Ctrl+O`, `Enter`, `Ctrl+X`.

**Utan Tavily:** DeerFlow fungerar, men agenten kan inte soka pa natet. Den kan fortfarande anvanda sin LLM-kunskap, lasa/skriva filer, och kora bash-kommandon.

---

## Steg 12: Starta DeerFlow

```bash
cd ~/projekt/Berit
make dev
```

Vantan medan fyra tjanster startar:

| Tjanst | Port | Beskrivning |
|--------|------|-------------|
| LangGraph | 2024 | Agent-orkestrering (LangGraph-servern) |
| Gateway API | 8001 | REST API for modeller, minne, skills |
| Frontend | 3000 | Next.js webbgransnitt |
| Nginx | 2026 | Reverse proxy - samlar allt pa en port |

Du ser statusmeddelanden for varje tjanst. Nar allt ar klart visas:

```
==========================================
  DeerFlow development server is running!
==========================================

  Application: http://localhost:2026
```

---

## Steg 13: Oppna i webblasaren

Oppna webblasaren pa din **Windows-maskin** och ga till:

**http://localhost:2026**

Du ska se DeerFlow-granssnittet. Nemotron 3 Nano visas som tillganglig modell.

Testa genom att skriva ett meddelande, t.ex.:
> "Hej! Kan du forklara vad du ar?"

---

## Stoppa DeerFlow

Tryck `Ctrl+C` i terminalen dar `make dev` kor, eller kor:

```bash
make stop
```

---

## Starta om DeerFlow (nasta gang)

Nar allt redan ar installerat behover du bara:

```bash
wsl
cd ~/projekt/Berit
make dev
```

Och oppna http://localhost:2026 i webblasaren.

---

## Felsokning

### Kan inte na LM Studio fran WSL

```bash
# Testa anslutningen
curl http://192.168.50.170:8000/v1/models

# Om det inte fungerar, prova:
# 1. Kontrollera att LM Studio kör
# 2. Kontrollera att "Serve on Local Network" ar aktiverat
# 3. Kontrollera att Windows-brandvaggen inte blockerar port 8000
# 4. Kontrollera att IP-adressen stammer: kör ipconfig pa Windows-maskinen
```

### LangGraph startar inte

```bash
# Kolla loggen
cat logs/langgraph.log

# Vanliga problem:
# - Python-beroenden saknas: cd backend && uv sync
# - Fel Python-version: python --version (ska vara 3.12)
# - Port 2024 redan upptagen: lsof -i :2024
```

### Frontend startar inte

```bash
# Kolla loggen
cat logs/frontend.log

# Vanliga problem:
# - Node-beroenden saknas: cd frontend && pnpm install
# - Fel Node-version: node -v (ska vara 22+)
# - Port 3000 redan upptagen: lsof -i :3000
```

### Nginx startar inte

```bash
# Kolla loggen
cat logs/nginx.log

# Vanliga problem:
# - Port 2026 redan upptagen: lsof -i :2026
# - Nginx konfigurationsfel: nginx -t -c $(pwd)/docker/nginx/nginx.local.conf -p $(pwd)
```

### Agenten svarar inte eller ger konstiga svar

- Nemotron 3 Nano ar en liten modell (4B parametrar). Den ar snabb men har begransningar:
  - Komplex planering och tool-use kan vara instabilt
  - Langa svar kan vara ofullstandiga
- Testa med enkla fragor forst
- Om agenten inte alls svarar, kolla att LM Studio visar aktivitet nar du skickar meddelanden

### Gateway-fel (500 / "Environment variable not found")

```bash
# Om .env saknar en variabel som config.yaml refererar till:
cat logs/gateway.log | grep "Environment variable"

# Se till att alla $-variabler i config.yaml har motsvarande varden i .env
# LM Studio anvander api_key: lm-studio (inte en $-referens), sa det ska inte vara ett problem
```

---

## Portoversikt

| Port | Tjanst | Åtkomst |
|------|--------|---------|
| 2026 | Nginx (huvudingangen) | http://localhost:2026 |
| 3000 | Next.js frontend | Direkt: http://localhost:3000 |
| 8001 | Gateway API | Direkt: http://localhost:8001 |
| 2024 | LangGraph agent-server | Direkt: http://localhost:2024 |
| 8000 | LM Studio (extern maskin) | http://192.168.50.170:8000 |

---

## Viktiga filer

| Fil | Syfte |
|-----|-------|
| `config.yaml` | Huvudkonfiguration - modell, verktyg, sandbox |
| `.env` | API-nycklar for externa tjanster (Tavily, Jina) |
| `frontend/.env` | Frontend-konfiguration |
| `backend/.venv/` | Pythons virtuella miljo (skapas av uv sync) |
| `logs/` | Loggfiler for alla tjanster |
| `Makefile` | Alla kommandon: make dev, make stop, make install, etc. |

---

## Alla make-kommandon

```bash
make check          # Kontrollera systemkrav
make install        # Installera alla beroenden
make dev            # Starta i utvecklingslage (hot-reload)
make start          # Starta i produktionslage
make stop           # Stoppa alla tjanster
make clean          # Stoppa + rensa temp-filer
```
