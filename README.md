# C-A-R VR – Spørgeskema

**En lille, selvstændig React/Vite-frontend.** Den ændrer **ikke** jeres eksisterende C-A-R API, database eller Unity-projekt.

## Hvad den gør

- Testansvarlig skriver manuelt et **testperson-ID øverst**, f.eks. `1024`.
- **Find / opret skema:** Et tidligere gemt ID hentes frem. Et nyt ID opretter en tom besvarelse.
- Hele spørgeskemaet er opdelt i **præcis 2 dele**:
  - **Del 1:** 1. Velkomst/briefing, 2. Kort spørgeskema og 3. Gennemkørsel/observationer.
  - **Del 2:** 4. Debrief og afrunding.
- **Autosave hvert 5. sekund** når data er ændret, plus ekstra gemning ved skift mellem delene eller når fanen skjules.
- Gemmer under det indtastede **ID** på **samme computer og i samme browser**, så det kan hentes frem senere.
- **Gem nu** gemmer manuelt, og **Eksportér** laver en JSON-backup.
- Alle svar og ID'er er **tekststrenge**, klar til senere at blive sendt via jeres API til SQL `VARCHAR`-felter.

> **Vigtigt:** Denne version gemmer **lokalt i browseren** (localStorage), ikke i MS SQL. En besvarelse kan derfor **ikke** hentes fra en anden computer endnu. Browserdata kan også blive slettet. Brug eksport-knappen til backup og opsæt den sikrede API-integration, før rigtige forsknings-/personoplysninger bruges i drift.

## Start på Windows

1. Installer **Node.js 22 eller nyere**.
2. Pak ZIP-filen ud.
3. Dobbeltklik på `START.bat`.
4. Åbn <http://localhost:5173> (åbner også automatisk).

Alternativt i terminalen fra projektmappen:

```bash
npm install
npm run dev
```

## Opslag på ID

- Tast et eksisterende ID og klik **Find / opret skema** – alle gemte svar vises.
- Tast et ID, der ikke findes lokalt – et nyt skema oprettes med præcis dette ID.
- Du kan også klikke på et ID under **Senest anvendte ID'er**.
- ID accepterer bogstaver, tal, bindestreg og underscore, maks. 32 tegn. Bevar samme ID i Unity og andre systemer.
- Hold øje med teksten **Gemt på denne computer** nederst. Hvis der står **Gemning fejlede**, er svarene endnu ikke sikkert gemt.

## Sådan gøres appen klar til jeres eksisterende API

Den eksisterende API understøtter endnu ikke nødvendigvis dette skemas fulde dataformat. For ikke at ændre jeres system, har vi samlet forbindelsen i **`src/services/questionnaireApi.js`**. Der sendes **intet automatisk** til API'et.

Når API'et engang har endpoints til skemaet, kan du kopiere `.env.example` til `.env` og skrive URL'en:

```env
VITE_QUESTIONNAIRE_API_URL=/api/questionnaire
```

Det forventede kontrakt er:

- `GET /api/questionnaire/{id}` → et JSON-objekt med felterne `id`, `schemaVersion`, `createdAt`, `updatedAt`, `part`, `answers`.
- `POST /api/questionnaire` → modtager samme JSON-objekt. Backend skal oprette/overskrive for det pågældende ID og svare med 2xx og JSON.
- `answers` indeholder tekststrenge til alle spørgeskemaets spørgsmål.

**Endpoints ovenfor er et forslag til fremtidig integration, ikke en påstand om at de allerede findes i jeres API.** Når URL'en er konfigureret, vises knapperne **Hent fra API** og **Send til API**. Brug kun disse sammen med en API, der faktisk implementerer kontrakten. Hvis API'et kører på en anden server/port, skal I håndtere CORS eller opsætte Vite-proxy, og API'et skal selv stå for autentifikation, adgangskontrol og kryptering.

**Tilføj aldrig SQL-forbindelsesstrenge, adgangskoder eller hemmelige nøgler til frontendens `.env`**: Vite's `VITE_`-variabler er synlige i browserens JavaScript. Den slags skal kun være på .NET-serveren.

## Filstruktur

```text
CAR-VR-Spoergeskema/
  src/
    App.jsx                       # Hele formularen, præcis 2 dele
    main.jsx                      # React bootstrap
    styles.css                    # Design og mobilvisning
    data/fields.js                # Spørgsmål og svarmuligheder
    services/storage.js           # Lokalt opslag/autosave på test-ID
    services/questionnaireApi.js  # Klar til GET/POST via det eksisterende API
  tests/storage.test.js           # Tests af ID, opslag og datamodel
  .env.example                    # Frivillig fremtidig API-URL
  index.html
  package.json
  vite.config.js
  START.bat
```

## Test og build

```bash
npm test
npm run build
```

`npm run build` laver en optimeret frontend i `dist/` (ingen database, ingen .NET-API inkluderet).

## Sikkerhed og begrænsninger

- Data gemmes ukrypteret i browserens lokale lager på den aktuelle brugerprofil.
- Lokal autosave er **ikke** backup og er **ikke** synkroniseret mellem computere.
- ID skal indtastes korrekt, så samme ID bruges til alle data fra en testperson.
- Behandling af persondata/video-samtykke kræver jeres egne sikkerheds- og databeskyttelsesprocedurer.
- Spørgeskemaet er baseret på `Testforløb-procedure.docx`.
# C-A-R-Front
