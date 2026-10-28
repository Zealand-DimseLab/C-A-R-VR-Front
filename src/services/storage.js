import { blankAnswers, QUESTION_FIELDS } from '../data/fields.js';

const PREFIX = 'carvr:questionnaire:v1:';
export const STORAGE_PREFIX = PREFIX;
export const AUTOSAVE_INTERVAL_MS = 5_000;
export const SCHEMA_VERSION = '1';
export const cleanId = (value) => String(value ?? '').trim();
export const idIsValid = (id) => /^[a-zA-Z0-9_-]{1,32}$/.test(cleanId(id));
const keyOf = (id) => PREFIX + cleanId(id);

export function emptyRecord(id) {
  return {
    id: cleanId(id),
    schemaVersion: SCHEMA_VERSION,
    part: '1',
    updatedAt: '',
    createdAt: new Date().toISOString(),
    answers: blankAnswers()
  };
}

/** Round-trip validation: unrecognised fields never get persisted or submitted. */
export function normalizeRecord(input, requiredId) {
  const id = cleanId(requiredId ?? input?.id);
  if (!idIsValid(id)) throw new Error('ID skal være 1–32 tegn: bogstaver, tal, - eller _.');
  const answers = blankAnswers();
  for (const field of QUESTION_FIELDS) {
    const value = input?.answers?.[field];
    answers[field] = typeof value === 'string' ? value : '';
  }
  return {
    id,
    schemaVersion: SCHEMA_VERSION,
    part: input?.part === '2' ? '2' : '1',
    createdAt: typeof input?.createdAt === 'string' && input.createdAt ? input.createdAt : new Date().toISOString(),
    updatedAt: typeof input?.updatedAt === 'string' ? input.updatedAt : '',
    answers
  };
}

/** Stores one participant per stable ID, in this browser on this computer. */
export function saveRecord(record, store = window.localStorage) {
  const normalized = normalizeRecord(record);
  const next = { ...normalized, updatedAt: new Date().toISOString() };
  store.setItem(keyOf(next.id), JSON.stringify(next));
  return next;
}

export function getRecord(id, store = window.localStorage) {
  const clean = cleanId(id);
  if (!idIsValid(clean)) throw new Error('Ugyldigt ID. Brug bogstaver, tal, - eller _.');
  const json = store.getItem(keyOf(clean));
  if (!json) return null;
  try {
    const parsed = JSON.parse(json);
    if (!parsed || typeof parsed !== 'object' || parsed.id !== clean || !parsed.answers || typeof parsed.answers !== 'object' || Array.isArray(parsed.answers)) throw new Error('Invalid record');
    return normalizeRecord(parsed, clean);
  } catch { throw new Error('Den lokale besvarelse kan ikke læses. Den er ikke blevet overskrevet.'); }
}

export function recentRecords(store = window.localStorage) {
  const records = [];
  for (let i = 0; i < store.length; i++) {
    const key = store.key(i);
    if (!key?.startsWith(PREFIX)) continue;
    try {
      const record = getRecord(key.slice(PREFIX.length), store);
      if (record) records.push(record);
    } catch { /* Invalid local entry: keep it untouched for manual recovery */ }
  }
  return records.sort((a,b) => (b.updatedAt || '').localeCompare(a.updatedAt || '')).slice(0, 10);
}

export function exportRecord(record) {
  const normalized = normalizeRecord(record);
  return JSON.stringify(normalized, null, 2);
}
