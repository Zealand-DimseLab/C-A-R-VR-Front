import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ArrowLeft, ArrowRight, Bike, BookOpen, Check, CheckCircle2, CircleAlert,
  ClipboardList, Clock3, CloudUpload, Database, Download, FileText,
  HardDrive, Info, ListChecks, RefreshCw, Save, Search, ShieldCheck,
  Users, Video
} from 'lucide-react';
import { CHOICES, DEBRIEF_QUESTIONS } from './data/fields.js';
import {
  AUTOSAVE_INTERVAL_MS, cleanId, emptyRecord, exportRecord, getRecord,
  idIsValid, normalizeRecord, recentRecords, saveRecord
} from './services/storage.js';
import { apiIsConfigured, sendToApi } from './services/questionnaireApi.js';

// Forudfyldt tekst i scenarie-observationer: "Bil1: " til "Bil6: "
const BIL_SKABELON = Array.from({ length: 6 }, (_, i) => `Bil${i + 1}: `).join('\n');
const SCENARIE_NUMRE = [1, 2, 3];

// Udfylder tomme scenarie-noter med skabelonen (rører ikke noter, der allerede har tekst)
function withBilTemplate(rec) {
  let changed = false;
  const answers = { ...rec.answers };
  for (const n of SCENARIE_NUMRE) {
    const key = `Scenarie${n}Noter`;
    if (!answers[key] || !String(answers[key]).trim()) {
      answers[key] = BIL_SKABELON;
      changed = true;
    }
  }
  return { record: changed ? { ...rec, answers } : rec, changed };
}

function ChoiceGroup({ name, value, options, onChange, columns = 2 }) {
  return <div className={`choices cols-${columns}`} role="radiogroup" aria-label={name}>
    {options.map((option) => <label key={option} className={`choice ${value === option ? 'selected' : ''}`}>
      <input type="radio" name={name} value={option} checked={value === option} onChange={() => onChange(option)} />
      <span className="radio-marker">{value === option && <Check size={12} strokeWidth={3} />}</span>
      <span>{option}</span>
    </label>)}
  </div>;
}

function Question({ number, title, help, children }) {
  return <div className="question">
    <div className="question-label">
      {number && <span className="number">{number}</span>}
      <div><h4>{title}</h4>{help && <p>{help}</p>}</div>
    </div>
    <div className="question-control">{children}</div>
  </div>;
}

function NoteArea({ id, value, onChange, placeholder, rows = 3 }) {
  return <textarea id={id} rows={rows} maxLength={9000} value={value ?? ''} onChange={(event) => onChange(event.target.value)} placeholder={placeholder || 'Skriv her...'} />;
}

function ScriptBox({ children }) {
  return <div className="script-box"><div className="script-title"><BookOpen size={16} /> Manuskript til testansvarlig</div><div className="script-body">{children}</div></div>;
}

function SectionTitle({ n, title, subtitle, icon: Icon }) {
  return <div className="section-title"><div className="section-icon"><Icon size={22} /></div><div><div className="section-index">AFSNIT {n}</div><h2>{title}</h2><p>{subtitle}</p></div></div>;
}

function FirstPart({ answers, setField }) {
  return <div className="section-list">
    <section className="content-card">
      <SectionTitle n="01" title="Velkomst og briefing" subtitle="Ca. 5 minutter · Introduktion til testen" icon={Video} />
      <ScriptBox>
        <p>Tak fordi du deltager i dag.</p>
        <p>Formålet er at teste et digitalt trafikunivers. Der er ikke en rigtig eller forkert oplevelse eller reaktion. Ej heller rigtige eller forkerte svar.</p>
        <p>Under testen vil du cykle i en virtuel verden og opleve forskellige trafikale situationer.</p>
        <p>Hele forløbet varer cirka 30 minutter, hvoraf selve cykelturen tager omkring 15 minutter.</p>
        <p>Vi optager cykelturen på video og vil bede dig give samtykke til, at det sker og bliver opbevaret i projektets levetid (udgangen af 2027). Hvis du senere ombestemmer dig, kan du altid trække dit samtykke tilbage.</p>
        <p>Hvis du under cykelturen føler dig utilpas, kan du til enhver tid afbryde.</p>
      </ScriptBox>
      <Question title="Samtykke til videooptagelse" help="Notér respondentens samtykke, før videooptagelse påbegyndes.">
        <ChoiceGroup name="Videosamtykke" value={answers.Videosamtykke} options={CHOICES.Videosamtykke} onChange={(v) => setField('Videosamtykke', v)} />
      </Question>
      <div className="context-tip"><Info size={16} /> Testpersonen har ret til at afbryde testen. Brug det samme test-ID under hele forløbet.</div>
    </section>

    <section className="content-card">
      <SectionTitle n="02" title="Kort spørgeskema" subtitle="Ca. 3 minutter · Baggrund og cykelvaner" icon={ClipboardList} />
      <Question number="01" title="Navn">
        <input className="text-field" type="text" maxLength={200} autoComplete="off" placeholder="Testpersonens navn" value={answers.Navn} onChange={(e) => setField('Navn', e.target.value)} />
      </Question>
      <Question number="02" title="Køn">
        <ChoiceGroup name="Koen" value={answers.Koen} options={CHOICES.Koen} onChange={(v) => setField('Koen', v)} />
      </Question>
      <Question number="03" title="Aldersgruppe">
        <ChoiceGroup name="Aldersgruppe" value={answers.Aldersgruppe} options={CHOICES.Aldersgruppe} onChange={(v) => setField('Aldersgruppe', v)} />
      </Question>
      <Question number="04" title="Hvordan vil du betegne dig selv som cyklisttype?">
        <ChoiceGroup name="Cyklisttype" value={answers.Cyklisttype} options={CHOICES.Cyklisttype} columns={1} onChange={(v) => setField('Cyklisttype', v)} />
        <label className="sub-label" htmlFor="cycle-comment">Anden / kommentarer</label>
        <NoteArea id="cycle-comment" rows={2} value={answers.CyklistKommentar} onChange={(v) => setField('CyklistKommentar', v)} />
      </Question>
      <Question number="05" title="Når du cykler i trafikken, hvordan føler du det?">
        <ChoiceGroup name="TryghedITrafikken" value={answers.TryghedITrafikken} options={CHOICES.TryghedITrafikken} onChange={(v) => setField('TryghedITrafikken', v)} />
      </Question>
      <Question number="06" title="Har du prøvet VR-briller før?">
        <ChoiceGroup name="HarProevetVR" value={answers.HarProevetVR} options={CHOICES.HarProevetVR} onChange={(v) => setField('HarProevetVR', v)} />
      </Question>
      <Question number="07" title="Har du prøvet en stationærcykel / kondicykel før?">
        <ChoiceGroup name="HarProevetKondicykel" value={answers.HarProevetKondicykel} options={CHOICES.HarProevetKondicykel} onChange={(v) => setField('HarProevetKondicykel', v)} />
      </Question>
    </section>

    <section className="content-card">
      <SectionTitle n="03" title="Gennemkørsel af test" subtitle="Ca. 15 minutter · Observationer fra VR-cykelturen" icon={Bike} />
      <div className="context-tip tinted"><Bike size={18} /><span>Før VR-brillerne tages på, kan testpersonen træde lidt i pedalerne og orientere sig på cyklen. Sørg for, at vedkommende føler sig tilpas og har fået svar på eventuelle spørgsmål.</span></div>
      <ScriptBox>
        <p>Når du cykler, kan du ikke læne dig i svingene, som du plejer, men kun dreje på styret.</p>
        <p>Du kommer til at cykle i en virtuel verden og opleve forskellige trafikale situationer, mens vi registrerer dine reaktioner.</p>
        <p>Du følger bare vejen og skiltene, og når du kommer til et sving, er det en god idé at sagtne farten rigtig meget.</p>
      </ScriptBox>
      <p className="caption-text">Notér testpersonens reaktioner og vigtige tidspunkter i hvert af de tre scenarier.</p>
      {SCENARIE_NUMRE.map(n => <div className="scenario" key={n}>
        <div className="scenario-top"><span>0{n}</span><strong>Scenarie {n}</strong></div>
        <div className="scenario-fields">
          <label className="sub-label" htmlFor={`time-${n}`}>Klokkeslæt / tidspunkt</label>
          <input id={`time-${n}`} className="text-field" maxLength={48} placeholder="Fx 11:42 eller 03:15 inde i testen" value={answers[`Scenarie${n}Tid`]} onChange={e => setField(`Scenarie${n}Tid`, e.target.value)} />
          <label className="sub-label" htmlFor={`note-${n}`}>Observationer</label>
          <NoteArea id={`note-${n}`} rows={7} value={answers[`Scenarie${n}Noter`]} onChange={v => setField(`Scenarie${n}Noter`, v)} placeholder="Hvad skete der, og hvordan reagerede testpersonen?" />
        </div>
      </div>)}
      <Question title="Dokumentation: Blev testen gennemført?">
        <ChoiceGroup name="Gennemfoert" value={answers.Gennemfoert} options={CHOICES.Gennemfoert} onChange={v => setField('Gennemfoert', v)} />
      </Question>
      <div className="context-tip">Efter endt gennemkørsel følges respondenten til debrief i del 2.</div>
    </section>
  </div>;
}

function SecondPart({ answers, setField }) {
  return <div className="section-list"><section className="content-card">
    <SectionTitle n="04" title="Debrief og afrunding" subtitle="Ca. 5 minutter · Efter cykelturen" icon={ListChecks} />
    <div className="context-tip tinted"><Info size={18} /> Stil spørgsmålene mundtligt og skriv testpersonens svar. Der er ingen rigtige eller forkerte svar.</div>
    {DEBRIEF_QUESTIONS.map(([key, question], i) => <Question key={key} number={String(i+1).padStart(2,'0')} title={question}>
      <NoteArea id={key} value={answers[key]} onChange={value => setField(key, value)} rows={3} placeholder="Skriv testpersonens svar her..." />
    </Question>)}
    <div className="closing-panel"><CheckCircle2 size={24} /><div><h3>Mange tak for din deltagelse.</h3><p>Afslut testen, og overræk gavekort.</p></div></div>
    <Question title="Gavekort overrakt?">
      <ChoiceGroup name="GavekortUdleveret" value={answers.GavekortUdleveret} options={CHOICES.GavekortUdleveret} onChange={v => setField('GavekortUdleveret', v)} />
    </Question>
  </section></div>;
}

function dateText(value) {
  if (!value) return 'Endnu ikke gemt';
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? value : d.toLocaleString('da-DK', { dateStyle: 'short', timeStyle: 'medium' });
}

export default function App() {
  const [lookup, setLookup] = useState('');
  const [record, setRecord] = useState(null);
  const [saveStatus, setSaveStatus] = useState('idle');
  const [alert, setAlert] = useState(null);
  const [recent, setRecent] = useState(() => recentRecords());
  const [apiBusy, setApiBusy] = useState(false);
  const current = useRef(null);
  const dirty = useRef(false);

  const showAlert = (type, text) => setAlert({ type, text });

  const flushSave = useCallback(() => {
    if (!current.current) return true;
    if (!dirty.current) return true;
    try {
      const next = saveRecord(current.current);
      current.current = next;
      dirty.current = false;
      setRecord(next);
      setRecent(recentRecords());
      setSaveStatus('saved');
      return true;
    } catch (error) {
      setSaveStatus('error');
      showAlert('error', `Kunne ikke gemme lokalt: ${error.message}`);
      return false;
    }
  }, []);

  // Autosave only dirty records every 5 seconds. Never silently send data to an API.
  useEffect(() => {
    const timer = window.setInterval(flushSave, AUTOSAVE_INTERVAL_MS);
    const whenHidden = () => { if (document.visibilityState === 'hidden') flushSave(); };
    const onPageHide = () => { if (dirty.current && current.current) { try { saveRecord(current.current); dirty.current = false; } catch { /* timer has shown any errors */ } } };
    document.addEventListener('visibilitychange', whenHidden);
    window.addEventListener('pagehide', onPageHide);
    return () => { window.clearInterval(timer); document.removeEventListener('visibilitychange', whenHidden); window.removeEventListener('pagehide', onPageHide); };
  }, [flushSave]);

  function installRecord(next, message) {
    const normalized = normalizeRecord(next);
    // Forudfyld tomme scenarie-noter med Bil1–Bil6 (nye og eksisterende besvarelser)
    const { record: filled, changed } = withBilTemplate(normalized);
    current.current = filled;
    dirty.current = changed;
    setLookup(filled.id);
    setRecord(filled);
    setSaveStatus(changed ? 'pending' : (filled.updatedAt ? 'saved' : 'idle'));
    setAlert(message ? { type: 'success', text: message } : null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function openById(idInput = lookup) {
    if (!flushSave()) return;
    const id = cleanId(idInput);
    if (!idIsValid(id)) { showAlert('error', 'Indtast et ID på 1–32 tegn (bogstaver, tal, - eller _).'); return; }
    try {
      const existing = getRecord(id);
      if (existing) { installRecord(existing, `Besvarelsen for ID ${id} er hentet fra denne computer.`); return; }
      const newRecord = saveRecord(emptyRecord(id));
      setRecent(recentRecords());
      installRecord(newRecord, `Nyt skema oprettet med ID ${id}.`);
    } catch (error) { showAlert('error', error.message); }
  }

  function setField(field, value) {
    if (!current.current) return;
    const next = { ...current.current, answers: { ...current.current.answers, [field]: value } };
    current.current = next;
    dirty.current = true;
    setRecord(next);
    setSaveStatus('pending');
    setAlert(null);
  }

  function movePart(part) {
    if (!current.current) return;
    current.current = { ...current.current, part: String(part) };
    dirty.current = true;
    setRecord(current.current);
    setSaveStatus('pending');
    flushSave(); // Save immediately when switching parts, in addition to the 5s timer.
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function downloadJson() {
    if (!flushSave()) return;
    const json = exportRecord(current.current);
    const blob = new Blob([json], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `CAR-VR-spoergeskema-${record.id}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1500);
  }


  async function pushToApi() {
    if (!record || apiBusy || !flushSave()) return;
    setApiBusy(true);
    try {
      await sendToApi(current.current);
      showAlert('success', `Besvarelse ${record.id} er sendt til API.`);
    } catch (err) { showAlert('error', `Besvarelsen er stadig lokalt gemt, men API-afsendelse fejlede: ${err.message}`); }
    finally { setApiBusy(false); }
  }

  return <div className="app-shell">
    <aside className="sidebar">
      <div className="logo"><div className="logo-mark"><Bike size={24} /></div><div><strong>C-A-R VR</strong><small>CYCLING AUGMENTATION RESEARCH</small></div></div>
      <div className="sidebar-heading">SPØRGESKEMA</div>
      <div className="side-navigation">
        <button className={`side-nav-button ${record?.part !== '2' ? 'active' : ''}`} onClick={() => record && movePart(1)} disabled={!record}><span className="side-step">1</span><span>Før og under test</span></button>
        <button className={`side-nav-button ${record?.part === '2' ? 'active' : ''}`} onClick={() => record && movePart(2)} disabled={!record}><span className="side-step">2</span><span>Debrief og afrunding</span></button>
      </div>
      <div className="sidebar-footer"><div className="local-pill"><HardDrive size={17} /><div><strong>Lokal lagring</strong><small>Automatisk hver 5. sekund</small></div></div><p>Én besvarelse pr. test-ID.</p></div>
    </aside>

    <main className="main-content">
      <header className="topbar"><div className="topbar-crumb">C-A-R VR <span>/</span> Testforløb</div><div className="topbar-right"><span className="topbar-indicator" /><span>{apiIsConfigured ? 'API kan bruges' : 'Klar til API-integration'}</span></div></header>
      <div className="page-container">
        <div className="page-intro"><div className="eyebrow">DIGITALT TESTFORLØB · CA. 30 MINUTTER</div><h1>Spørgeskema</h1><p>Registrér et testperson-ID, udfyld de to dele, og find besvarelsen igen på samme computer.</p></div>

        <section className="lookup-card" aria-label="Testperson-ID">
          <div className="lookup-header"><div className="lookup-icon"><Search size={20} /></div><div><h2>Testperson-ID</h2><p>Indtast det ID, som skal knytte alle svar sammen.</p></div>{record && <span className="active-tag"><CheckCircle2 size={15} /> Aktivt ID</span>}</div>
          <form className="lookup-form" onSubmit={e => { e.preventDefault(); openById(); }}>
            <input autoFocus type="text" maxLength={32} aria-label="Indtast testperson-ID" value={lookup} onChange={e => setLookup(e.target.value)} placeholder="Fx 1024" autoComplete="off" />
            <button className="btn primary" type="submit"><Search size={17} /> Find / opret skema</button>
          </form>
          {record && <div className="lookup-meta"><span>Aktivt ID: <strong>{record.id}</strong></span><span>Senest gemt: <strong>{dateText(record.updatedAt)}</strong></span></div>}
        </section>

        {alert && <div className={`message ${alert.type}`} role="status"><span>{alert.type === 'error' ? <CircleAlert size={18} /> : <CheckCircle2 size={18} />}</span><p>{alert.text}</p><button onClick={() => setAlert(null)} aria-label="Luk besked">×</button></div>}

        {!record ? <>
          <div className="welcome-card"><div className="welcome-symbol"><FileText size={26} /></div><h2>Start med et testperson-ID</h2><p>Skriv et eksisterende ID for at hente besvarelsen, eller brug et nyt ID for at oprette et spørgeskema.</p><div className="welcome-steps"><span><Check size={15} /> 2 dele</span><span><Clock3 size={15} /> Autosave 5 sek.</span><span><Search size={15} /> Opslag på ID</span></div></div>
          {recent.length > 0 && <section className="recent-section"><div className="recent-head"><h2>Senest anvendte ID’er</h2><span>Gemt i denne browser</span></div><div className="recent-list">{recent.map(item => <button key={item.id} className="recent-item" onClick={() => openById(item.id)}><div className="recent-bubble"><Users size={18} /></div><div><strong>{item.id}</strong><span>{item.answers.Navn || 'Uden navn'} · {dateText(item.updatedAt)}</span></div><ArrowRight size={18} /></button>)}</div></section>}
        </> : <>
          <div className="part-tabs" role="tablist" aria-label="Testforløbets dele">
            <button role="tab" aria-selected={record.part === '1'} className={record.part === '1' ? 'active' : ''} onClick={() => movePart(1)}><span className="part-index">01</span><span><strong>Før og under testen</strong><small>Briefing, spørgsmål og VR-observationer</small></span></button>
            <button role="tab" aria-selected={record.part === '2'} className={record.part === '2' ? 'active' : ''} onClick={() => movePart(2)}><span className="part-index">02</span><span><strong>Debrief og afrunding</strong><small>Evaluering efter VR-cykelturen</small></span></button>
          </div>
          <div className="part-overview"><div><span className="overline">DEL {record.part} AF 2</span><h2>{record.part === '1' ? 'Før og under testen' : '4. Debrief og afrunding (5 min)'}</h2><p>{record.part === '1' ? 'Afsnit 1–3 fra det originale testforløb' : 'Afsluttende spørgsmål og gavekort'}</p></div><span className="autosave-chip"><RefreshCw size={14} /> Gemmer hvert 5. sek.</span></div>
          {record.part === '1' ? <FirstPart answers={record.answers} setField={setField} /> : <SecondPart answers={record.answers} setField={setField} />}
          <div className="bottom-actions">
            <div className={`save-state ${saveStatus}`} aria-live="polite">
              {saveStatus === 'pending' ? <Clock3 size={18} /> : saveStatus === 'error' ? <CircleAlert size={18} /> : <CheckCircle2 size={18} />}
              <div><strong>{saveStatus === 'pending' ? 'Ændringer afventer autosave' : saveStatus === 'error' ? 'Gemning fejlede' : 'Gemt på denne computer'}</strong><small>{dateText(record.updatedAt)}</small></div>
            </div>
            <div className="buttons">
              <button className="btn outline" onClick={downloadJson} title="Gem en kopi som JSON-fil"><Download size={16} /> Eksportér</button>
              <button className="btn outline" onClick={flushSave}><Save size={17} /> Gem nu</button>
              {record.part === '1' ? <button className="btn primary" onClick={() => movePart(2)}>Gå til del 2 <ArrowRight size={17} /></button> : <button className="btn primary" onClick={() => movePart(1)}><ArrowLeft size={17} /> Til del 1</button>}
            </div>
          </div>
          {apiIsConfigured && <div className="api-actions"><Database size={18} /><span>API-integration er konfigureret</span><button disabled={apiBusy} onClick={pushToApi}><CloudUpload size={16} /> Send til API</button></div>}
        </>}
        <footer className="page-footer"><ShieldCheck size={16} /> Lokale data gemmes kun i denne browser. På delte computere bør I bruge en sikret backend til rigtige personoplysninger. Ingen data sendes til API automatisk.</footer>
      </div>
    </main>
  </div>;
}

