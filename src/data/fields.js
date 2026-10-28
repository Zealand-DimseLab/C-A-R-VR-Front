/**
 * All questionnaire answers are plain strings. A future API/database adapter can
 * insert these fields into VARCHAR columns without numeric/boolean conversions.
 */
export const QUESTION_FIELDS = Object.freeze([
  'Navn', 'Koen', 'Aldersgruppe', 'Cyklisttype', 'CyklistKommentar',
  'TryghedITrafikken', 'HarProevetVR', 'HarProevetKondicykel',
  'Videosamtykke', 'Scenarie1Tid', 'Scenarie1Noter', 'Scenarie2Tid',
  'Scenarie2Noter', 'Scenarie3Tid', 'Scenarie3Noter', 'Gennemfoert',
  'DebriefOplevelse', 'DebriefTrafiksituationer', 'DebriefRealisme',
  'DebriefVR', 'DebriefFungeredeGodt', 'DebriefFungeredeMindreGodt',
  'DebriefAndet', 'GavekortUdleveret'
]);

export const blankAnswers = () => Object.fromEntries(QUESTION_FIELDS.map(key => [key, '']));

export const CHOICES = Object.freeze({
  Koen: ['Mand', 'Kvinde', 'Nonbinær', 'Andet'],
  Aldersgruppe: ['Ung (15-24 år)', 'Yngre voksen (25-39 år)', 'Midaldrende (40-59 år)', 'Senior (60+ år)'],
  Cyklisttype: [
    'Ny og urutinerede cyklist',
    'Forhenværende cyklist, har tidligere cyklet regelmæssigt, men ikke gør det længere',
    'Rutinerede cyklist, der cykler flere gange om måneden til forskellige formål',
    'Vanecyklist, der pendler eller cykler på anden vis flere gange ugeligt',
  ],
  TryghedITrafikken: ['Altid tryg', 'Næsten altid tryg', 'Indimellem tryg', 'Næsten aldrig tryg', 'Aldrig tryg'],
  HarProevetVR: ['Ja', 'Nej'],
  HarProevetKondicykel: ['Ja', 'Nej'],
  Videosamtykke: ['Ja', 'Nej'],
  Gennemfoert: ['Gennemført', 'Ikke gennemført'],
  GavekortUdleveret: ['Ja', 'Nej']
});

export const DEBRIEF_QUESTIONS = Object.freeze([
  ['DebriefOplevelse', 'Hvordan oplevede du testen?'],
  ['DebriefTrafiksituationer', 'Var der trafikale situationer, du vil fremhæve?'],
  ['DebriefRealisme', 'Føltes det virkelighedstro og realistisk?'],
  ['DebriefVR', 'Synes du, VR var en god oplevelse?'],
  ['DebriefFungeredeGodt', 'Hvad fungerede særligt godt?'],
  ['DebriefFungeredeMindreGodt', 'Hvad fungerede mindre godt?'],
  ['DebriefAndet', 'Andet? Er der noget vigtigt, som vi ikke har spurgt til?']
]);
