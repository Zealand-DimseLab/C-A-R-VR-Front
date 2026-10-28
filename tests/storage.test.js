import test from 'node:test';
import assert from 'node:assert/strict';
import { blankAnswers, QUESTION_FIELDS } from '../src/data/fields.js';
import { AUTOSAVE_INTERVAL_MS, cleanId, emptyRecord, getRecord, idIsValid, normalizeRecord, recentRecords, saveRecord } from '../src/services/storage.js';

function store() {
  const m = new Map();
  return { getItem: k => m.has(k) ? m.get(k) : null, setItem: (k,v) => m.set(k,v), key: i => [...m.keys()][i] || null, get length() { return m.size; } };
}

test('all answer fields are strings', () => {
  const a = blankAnswers();
  assert.equal(Object.keys(a).length, QUESTION_FIELDS.length);
  assert.ok(Object.values(a).every(x => typeof x === 'string'));
});

test('ID is explicit and supports typical Unity numeric IDs', () => {
  assert.equal(cleanId(' 123 '), '123');
  assert.equal(idIsValid('123'), true);
  assert.equal(idIsValid('C-012'), true);
  assert.equal(idIsValid(''), false);
  assert.equal(idIsValid('a/b'), false);
  assert.equal(idIsValid('x'.repeat(33)), false);
});

test('independent IDs can be saved and loaded again', () => {
  const mem = store();
  const a = emptyRecord('123');
  a.answers.Navn = 'Anne';
  const b = emptyRecord('456');
  b.answers.Navn = 'Bo';
  saveRecord(a, mem);
  saveRecord(b, mem);
  assert.equal(getRecord('123', mem).answers.Navn, 'Anne');
  assert.equal(getRecord('456', mem).answers.Navn, 'Bo');
  assert.equal(recentRecords(mem).length, 2);
});

test('both parts retain each others answers under same ID', () => {
  const mem = store();
  const a = emptyRecord('100');
  a.answers.Navn = 'Test';
  a.answers.Scenarie1Noter = 'Bil kom tæt forbi';
  a.part = '2';
  a.answers.DebriefOplevelse = 'Okay oplevelse';
  const saved = saveRecord(a, mem);
  assert.equal(saved.part, '2');
  const loaded = getRecord('100', mem);
  assert.equal(loaded.answers.Navn, 'Test');
  assert.equal(loaded.answers.Scenarie1Noter, 'Bil kom tæt forbi');
  assert.equal(loaded.answers.DebriefOplevelse, 'Okay oplevelse');
});

test('unrecognized fields and non-string values are ignored', () => {
  const n = normalizeRecord({ id: '77', answers: { Navn: 'Nina', Koen: 22, HEMMELIG: 'nej' } });
  assert.equal(n.answers.Navn, 'Nina');
  assert.equal(n.answers.Koen, '');
  assert.equal('HEMMELIG' in n.answers, false);
});

test('autosave interval is exactly five seconds', () => assert.equal(AUTOSAVE_INTERVAL_MS, 5000));
