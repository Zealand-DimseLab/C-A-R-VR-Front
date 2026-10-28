const apiBase = "https://localhost:7175/api/cardata"
export const apiIsConfigured = Boolean(apiBase);

const testPersonNumber = (id) => {
  const n = Number(id);
  if (!Number.isInteger(n)) throw new Error('Testperson-ID skal være et heltal for at kunne sendes til databasen.');
  return n;
};

const buildQuarterOne = ({ id, answers: a }) => ({
  TestPersonNumber: testPersonNumber(id),
  Name: a.Navn,
  Gender: a.Koen,
  Age: a.Aldersgruppe,
  Consent: a.Videosamtykke === 'Ja' ? 1 : 0,
  Q1: a.Cyklisttype,
  Q1Comment: a.CyklistKommentar,
  Q2: a.TryghedITrafikken,
  Q3: a.HarProevetVR,
  Q4: a.HarProevetKondicykel
});

const buildQuarterTwo = ({ id, answers: a }) => ({
  TestPersonNumber: testPersonNumber(id),
  Q5: a.Gennemfoert,
  Q6: a.DebriefOplevelse,
  Q7: a.DebriefTrafiksituationer,
  Q8: a.DebriefRealisme,
  Q9: a.DebriefVR,
  Q10: a.DebriefFungeredeGodt,
  Q11: a.DebriefFungeredeMindreGodt,
  Q12: a.DebriefAndet,
  Q13: a.GavekortUdleveret
});

const buildNotes = ({ id, answers: a }) => ({
  UserId: testPersonNumber(id),
  ScenarioName1: a.Scenarie1Tid, ScenarioNotes1: a.Scenarie1Noter,
  ScenarioName2: a.Scenarie2Tid, ScenarioNotes2: a.Scenarie2Noter,
  ScenarioName3: a.Scenarie3Tid, ScenarioNotes3: a.Scenarie3Noter
});

async function readJson(response) {
  const text = await response.text();
  let data = null;
  try { data = text ? JSON.parse(text) : null; } catch { /* ikke JSON */ }
  if (!response.ok) throw new Error(data?.title || data?.error || text || `API-fejl: HTTP ${response.status}`);
  return data;
}

async function post(path, body) {
  const res = await fetch(`${apiBase}/${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  return readJson(res);
}

export async function sendToApi(record) {
  if (!apiIsConfigured) throw new Error('API er ikke sat op endnu. Data er stadig gemt lokalt.');
  await post('quaterone', buildQuarterOne(record));   // skal først, opretter rækken
  await post('quatertwo', buildQuarterTwo(record));
  await post('notes', buildNotes(record));
}

