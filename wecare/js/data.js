// Wecare — données fictives. Noms, numéros (plage réservée à la fiction 06 39 98) et dossiers sont inventés.
(function () {
  const TODAY = '2026-11-03';
  const NOW = 10 * 60;
  const DAY_START = 8 * 60;
  const DAY_END = 19 * 60;
  const LUNCH = [12 * 60, 13 * 60];
  const CLOSED = { '2026-11-01': 'Toussaint', '2026-11-11': 'Armistice', '2026-12-25': 'Noël' };
  const RANGE = ['2026-10-12', '2026-12-20'];

  // Dates : chaînes ISO, calculées en UTC pour ne pas dépendre du fuseau.
  const toDate = iso => new Date(iso + 'T00:00:00Z');
  const toIso = d => d.toISOString().slice(0, 10);
  const addDays = (iso, n) => { const d = toDate(iso); d.setUTCDate(d.getUTCDate() + n); return toIso(d); };
  const weekday = iso => (toDate(iso).getUTCDay() + 6) % 7; // 0 = lundi
  const monday = iso => addDays(iso, -weekday(iso));
  const fmt = (iso, opts) => new Intl.DateTimeFormat('fr-FR', { timeZone: 'UTC', ...opts }).format(toDate(iso));
  const hm = m => `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
  const toMin = s => { const [h, m] = s.split(':').map(Number); return h * 60 + m; };

  const rng = seed => () => {
    seed |= 0; seed = seed + 0x6D2B79F5 | 0;
    let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };

  // Chaque rendez-vous dure au moins une heure.
  const generalMotifs = [
    { label: 'Consultation', dur: 60 },
    { label: 'Renouvellement d’ordonnance', dur: 60 },
    { label: 'Suivi tension', dur: 60 },
    { label: 'Certificat médical', dur: 60 },
    { label: 'Première consultation', dur: 90 },
  ];
  const span = (a, b) => [a * 60, b * 60];
  const practitioners = [
    { id: 'p1', first: 'Hélène', last: 'Vasseur', name: 'Dr Hélène Vasseur', short: 'Dr Vasseur', initials: 'HV', sex: 'F', role: 'Médecin généraliste',
      hours: { 0: span(8, 18), 1: span(8, 18), 3: span(8, 18), 4: span(8, 18) }, motifs: generalMotifs },
    { id: 'p2', first: 'Karim', last: 'Benali', name: 'Dr Karim Benali', short: 'Dr Benali', initials: 'KB', sex: 'M', role: 'Médecin généraliste',
      hours: { 0: span(8, 18), 1: span(8, 18), 2: span(8, 18), 4: span(8, 18), 5: span(8, 12) }, motifs: generalMotifs },
    { id: 'p3', first: 'Marion', last: 'Le Goff', name: 'Marion Le Goff', short: 'M. Le Goff', initials: 'ML', sex: 'F', role: 'Kinésithérapeute',
      hours: { 0: span(9, 19), 2: span(9, 19), 3: span(9, 19) },
      motifs: [{ label: 'Rééducation épaule', dur: 60 }, { label: 'Rééducation genou', dur: 60 }, { label: 'Lombalgie', dur: 60 }, { label: 'Bilan kiné', dur: 90 }] },
    { id: 'p4', first: 'Inès', last: 'Ferreira', name: 'Inès Ferreira', short: 'I. Ferreira', initials: 'IF', sex: 'F', role: 'Sage-femme',
      hours: { 1: span(9, 17), 3: span(9, 17), 4: span(9, 17) },
      motifs: [{ label: 'Suivi de grossesse', dur: 60 }, { label: 'Préparation à la naissance', dur: 90 }, { label: 'Consultation post-natale', dur: 60 }, { label: 'Suivi gynécologique', dur: 60 }] },
    { id: 'p5', first: 'Thomas', last: 'Rigaud', name: 'Thomas Rigaud', short: 'T. Rigaud', initials: 'TR', sex: 'M', role: 'Ostéopathe',
      hours: { 1: span(9, 18), 2: span(9, 18), 5: span(9, 12) },
      motifs: [{ label: 'Séance d’ostéopathie', dur: 60 }, { label: 'Première séance', dur: 90 }] },
  ];
  const prac = id => practitioners.find(p => p.id === id);

  const STATUS = {
    booked: 'Prévu', arrived: 'En salle d’attente', inconsult: 'En consultation',
    done: 'Terminé', absent: 'Absent', cancelled: 'Annulé',
  };
  const PATIENT_STATUS = { actif: 'Suivi actif', rappeler: 'À rappeler', nouveau: 'Nouveau', inactif: 'Inactif' };

  // Dossiers détaillés, utilisés par la journée du 3 novembre.
  const patients = [
    { first: 'Yanis', last: 'Haddad', sex: 'M', birth: '1979-06-22', ref: 'p1', status: 'actif', alert: 'Allergie à la pénicilline' },
    { first: 'Noé', last: 'Marchand', sex: 'M', birth: '2020-02-09', ref: 'p1', status: 'actif', guardian: 'Pauline Marchand (mère)' },
    { first: 'Mathieu', last: 'Caron', sex: 'M', birth: '1986-11-03', ref: 'p1', status: 'actif' },
    { first: 'Jeanne', last: 'Lefèvre', sex: 'F', birth: '1948-04-17', ref: 'p1', status: 'actif', alert: 'Sous anticoagulants' },
    { first: 'Bernard', last: 'Collin', sex: 'M', birth: '1955-09-30', ref: 'p1', status: 'actif' },
    { first: 'Sofia', last: 'Amrani', sex: 'F', birth: '1991-01-12', ref: 'p1', status: 'actif' },
    { first: 'Mai', last: 'Nguyen', sex: 'F', birth: '1985-07-28', ref: 'p1', status: 'rappeler' },
    { first: 'Aïssatou', last: 'Diallo', sex: 'F', birth: '1994-05-05', ref: 'p4', status: 'actif' },
    { first: 'Élise', last: 'Perrin', sex: 'F', birth: '1990-10-19', ref: 'p4', status: 'actif' },
    { first: 'Chloé', last: 'Renaud', sex: 'F', birth: '1996-03-02', ref: 'p4', status: 'nouveau' },
    { first: 'Manon', last: 'Roy', sex: 'F', birth: '1993-12-24', ref: 'p4', status: 'actif' },
    { first: 'Rui', last: 'Martins', sex: 'M', birth: '1969-08-11', ref: 'p5', status: 'actif' },
    { first: 'Yann', last: 'Le Bihan', sex: 'M', birth: '1982-02-27', ref: 'p3', status: 'actif' },
    { first: 'Odile', last: 'Moreau', sex: 'F', birth: '1956-06-06', ref: 'p2', status: 'actif', alert: 'Allergie à l’iode' },
    { first: 'Hugo', last: 'Girard', sex: 'M', birth: '2001-09-14', ref: 'p2', status: 'actif' },
    { first: 'Nadia', last: 'Bensaïd', sex: 'F', birth: '1975-01-31', ref: 'p2', status: 'actif' },
    { first: 'Paul', last: 'Vidal', sex: 'M', birth: '1963-03-21', ref: 'p2', status: 'rappeler' },
    { first: 'Lina', last: 'Costa', sex: 'F', birth: '2003-07-08', ref: 'p2', status: 'nouveau' },
    { first: 'Julien', last: 'Fontaine', sex: 'M', birth: '1988-05-16', ref: 'p5', status: 'actif' },
    { first: 'Anne', last: 'Lemoine', sex: 'F', birth: '1971-11-25', ref: 'p5', status: 'actif' },
  ];

  const FIRST_F = ['Louise', 'Emma', 'Sarah', 'Léa', 'Marie', 'Inaya', 'Clara', 'Fatou', 'Anaïs', 'Julie', 'Nora', 'Agathe', 'Lucie', 'Amel', 'Claire', 'Eva', 'Mélanie', 'Yasmine'];
  const FIRST_M = ['Lucas', 'Adam', 'Théo', 'Pierre', 'Samir', 'Antoine', 'Nathan', 'Omar', 'Louis', 'Baptiste', 'Mehdi', 'Victor', 'Alain', 'Jules', 'Rayan', 'Olivier', 'Marc', 'Tom'];
  const LAST = ['Aubert', 'Barbier', 'Besson', 'Blanchard', 'Boyer', 'Brun', 'Chevalier', 'Cordier', 'Da Silva', 'Delmas', 'Denis', 'Dupuis', 'El Amrani', 'Faure', 'Fournier', 'Gauthier', 'Gilbert', 'Guérin', 'Hamon', 'Hoarau', 'Joly', 'Kaddour', 'Lacroix', 'Laurent', 'Lebrun', 'Leclerc', 'Lopez', 'Maillard', 'Masson', 'Meunier', 'Michel', 'Morin', 'N’Diaye', 'Noël', 'Olivier', 'Pasquier', 'Petit', 'Picard', 'Poulain', 'Prévost', 'Rey', 'Rivière', 'Robin', 'Roche', 'Sanchez', 'Schmitt', 'Tessier', 'Tran', 'Vincent', 'Weber'];
  const STREETS = ['rue des Tilleuls', 'avenue de Genève', 'rue Carnot', 'chemin des Fins', 'rue de la Paix', 'allée des Marronniers', 'quai de la Tournette', 'rue Sommeiller', 'boulevard du Lac', 'impasse des Vignes'];
  const CITIES = [['74000', 'Annecy'], ['74960', 'Cran-Gevrier'], ['74940', 'Annecy-le-Vieux'], ['74370', 'Pringy']];

  const r = rng(20261103);
  const pick = list => list[Math.floor(r() * list.length)];
  const seen = new Set();
  while (patients.length < 180) {
    const sex = r() < .54 ? 'F' : 'M';
    const first = pick(sex === 'F' ? FIRST_F : FIRST_M);
    const last = pick(LAST);
    if (seen.has(first + last)) continue;
    seen.add(first + last);
    const year = 1940 + Math.floor(r() * 80);
    const birth = `${year}-${String(1 + Math.floor(r() * 12)).padStart(2, '0')}-${String(1 + Math.floor(r() * 28)).padStart(2, '0')}`;
    const age = 2026 - year;
    const roll = r();
    const ref = sex === 'F' && age > 20 && age < 44 && roll < .4 ? 'p4' : roll < .45 ? 'p1' : roll < .78 ? 'p2' : roll < .9 ? 'p3' : 'p5';
    const s = r();
    const status = s < .78 ? 'actif' : s < .86 ? 'rappeler' : s < .93 ? 'nouveau' : 'inactif';
    patients.push({ first, last, sex, birth, ref, status });
  }

  const slug = s => s.normalize('NFD').replace(/[^\p{L}]/gu, '').toLowerCase();
  const ADMIN_NOTES = [
    'Préfère un appel en fin de journée.',
    'Mutuelle à mettre à jour au prochain passage.',
    'Rappel par SMS uniquement.',
    'Attestation de droits reçue, dossier à jour.',
  ];
  const MED_NOTES = {
    p1: ['Tension stable, traitement inchangé. Contrôle dans trois mois.', 'Bilan sanguin prescrit, résultats à revoir à la prochaine consultation.'],
    p2: ['Bonne évolution, pas de nouvelle plainte. Revoir si récidive.', 'Traitement bien toléré, renouvellement pour trois mois.'],
    p3: ['Amplitude en progrès. Exercices à domicile à poursuivre.', 'Douleur en baisse, séances espacées à une par semaine.'],
    p4: ['Examen normal, prochaine consultation dans un mois.', 'Échographie du troisième trimestre à programmer.'],
    p5: ['Tensions lombaires réduites. Séance de contrôle dans six semaines.', 'Bonne réponse à la séance, conseils posturaux donnés.'],
  };
  patients.forEach((p, i) => {
    p.id = `P-${1042 + i}`;
    p.phone = `06 39 98 ${String(10 + (i * 7) % 89).padStart(2, '0')} ${String(10 + (i * 13) % 89).padStart(2, '0')}`;
    p.email = `${slug(p.first)}.${slug(p.last)}@exemple.fr`;
    const c = CITIES[i % CITIES.length];
    p.address = `${3 + (i * 11) % 86} ${STREETS[i % STREETS.length]}`;
    p.city = `${c[0]} ${c[1]}`;
    const t = rng(i + 7);
    p.notes = [
      { id: `${p.id}-n1`, kind: 'admin', author: 'Nadia Tessier', date: '2026-09-18', text: ADMIN_NOTES[i % ADMIN_NOTES.length] },
      { id: `${p.id}-n2`, kind: 'med', author: prac(p.ref).short, date: '2026-10-14', text: MED_NOTES[p.ref][i % 2] },
    ];
    p.docs = [
      { id: `${p.id}-d1`, name: 'Attestation de mutuelle.pdf', type: 'Administratif', date: '2026-03-12', size: '184 Ko', restricted: false },
      { id: `${p.id}-d2`, name: 'Compte rendu de consultation.pdf', type: 'Médical', date: '2026-10-14', size: '96 Ko', restricted: true },
    ];
    if (t() < .4) p.docs.push({ id: `${p.id}-d3`, name: 'Résultats de laboratoire.pdf', type: 'Médical', date: '2026-08-27', size: '312 Ko', restricted: true });
  });

  const byLast = last => patients.find(p => p.last === last).id;
  const appts = [];
  let seq = 1;
  const add = (pracId, date, start, dur, patient, motif, status, extra = {}) => {
    const a = { id: `a${seq++}`, prac: pracId, date, start, dur, patient, motif, status, ...extra };
    appts.push(a);
    return a;
  };

  // Journée du 3 novembre, écrite à la main pour montrer tous les états.
  [
    ['p1', '08:00', 60, 'Caron', 'Consultation', 'done'],
    ['p1', '09:00', 60, 'Lefèvre', 'Renouvellement d’ordonnance', 'done'],
    ['p1', '10:00', 60, 'Amrani', 'Consultation', 'inconsult'],
    ['p1', '11:00', 60, 'Haddad', 'Renouvellement d’ordonnance', 'arrived', { arrivedAt: 578 }],
    ['p1', '13:00', 60, 'Vidal', 'Consultation', 'booked'],
    ['p1', '14:00', 90, 'Nguyen', 'Première consultation', 'cancelled', { cancelReason: 'Demande du patient' }],
    ['p1', '16:00', 60, 'Costa', 'Certificat médical', 'booked'],
    ['p1', '17:00', 60, 'Collin', 'Suivi tension', 'booked'],
    ['p2', '08:00', 60, 'Moreau', 'Suivi tension', 'done'],
    ['p2', '09:00', 60, 'Girard', 'Certificat médical', 'absent'],
    ['p2', '10:00', 60, 'Le Bihan', 'Consultation', 'inconsult'],
    ['p2', '11:00', 60, 'Marchand', 'Fièvre depuis deux jours', 'booked', { urgent: true, note: 'Appel de la mère à 8 h 40 : 39,2 °C ce matin.' }],
    ['p2', '13:00', 60, 'Bensaïd', 'Consultation', 'booked'],
    ['p2', '15:00', 60, 'Perrin', 'Renouvellement d’ordonnance', 'cancelled', { cancelReason: 'Demande du cabinet' }],
    ['p2', '16:00', 60, 'Moreau', 'Consultation', 'booked'],
    ['p4', '09:00', 60, 'Diallo', 'Suivi de grossesse', 'done'],
    ['p4', '10:00', 60, 'Perrin', 'Consultation post-natale', 'inconsult'],
    ['p4', '11:00', 60, 'Renaud', 'Suivi de grossesse', 'booked'],
    ['p4', '13:00', 60, 'Roy', 'Suivi gynécologique', 'booked'],
    ['p4', '15:00', 90, 'Diallo', 'Préparation à la naissance', 'booked'],
    ['p5', '09:00', 60, 'Fontaine', 'Séance d’ostéopathie', 'done'],
    ['p5', '10:00', 60, 'Lemoine', 'Séance d’ostéopathie', 'inconsult'],
    ['p5', '11:00', 60, 'Martins', 'Séance d’ostéopathie', 'arrived', { arrivedAt: 590 }],
    ['p5', '14:00', 90, 'Girard', 'Première séance', 'booked'],
    ['p5', '16:00', 60, 'Le Bihan', 'Séance d’ostéopathie', 'cancelled', { cancelReason: 'Demande du patient' }],
  ].forEach(([p, t, d, last, motif, status, extra]) => add(p, TODAY, toMin(t), d, byLast(last), motif, status, extra));

  // Le reste du calendrier suit les horaires réels de chaque praticien, sans double réservation.
  const age = p => 2026 - Number(p.birth.slice(0, 4));
  const pools = {};
  practitioners.forEach(pr => {
    pools[pr.id] = {
      own: patients.filter(p => p.ref === pr.id && p.status !== 'inactif'),
      any: patients.filter(p => p.status !== 'inactif' && (pr.id !== 'p4' || (p.sex === 'F' && age(p) > 18 && age(p) < 50))),
    };
  });
  for (let d = RANGE[0]; d <= RANGE[1]; d = addDays(d, 1)) {
    if (d === TODAY || CLOSED[d]) continue;
    const past = d < TODAY;
    const distance = (toDate(d) - toDate(TODAY)) / 864e5;
    const fill = past ? .72 : Math.max(.3, .58 - distance * .01);
    practitioners.forEach(pr => {
      const hours = pr.hours[weekday(d)];
      if (!hours) return;
      const motifs = pr.motifs.filter(m => !m.label.startsWith('Première'));
      let t = hours[0];
      while (t < hours[1]) {
        const m = pick(motifs);
        const hitsLunch = t < LUNCH[1] && t + m.dur > LUNCH[0];
        if (hitsLunch) { t = LUNCH[1]; continue; }
        if (t + m.dur > hours[1]) break;
        if (r() > fill) { t += 60; continue; }
        const pool = r() < .6 && pools[pr.id].own.length ? pools[pr.id].own : pools[pr.id].any;
        const s = r();
        const status = past ? (s < .88 ? 'done' : s < .93 ? 'absent' : 'cancelled') : (s < .94 ? 'booked' : 'cancelled');
        const extra = status === 'cancelled' ? { cancelReason: 'Demande du patient' } : (!past && s < .012 ? { urgent: true } : {});
        add(pr.id, d, t, m.dur, pick(pool).id, m.label, status, extra);
        t += Math.ceil(m.dur / 60) * 60;
      }
    });
  }

  const blocking = a => a.status !== 'cancelled' && a.status !== 'absent';
  const patient = id => patients.find(p => p.id === id);
  const apptsOn = date => appts.filter(a => a.date === date);
  const worksOn = (p, date) => !CLOSED[date] && Boolean(p.hours[weekday(date)]);

  function conflict(pracId, date, start, dur, ignoreId) {
    return appts.find(a => a.id !== ignoreId && a.prac === pracId && a.date === date && blocking(a)
      && start < a.start + a.dur && a.start < start + dur);
  }

  // Grille de créneaux d'un praticien pour une journée et une durée données.
  function slots(pracId, date, dur, ignoreId) {
    const p = prac(pracId);
    const hours = p.hours[weekday(date)];
    if (CLOSED[date] || !hours) return [];
    const list = [];
    for (let t = hours[0]; t + dur <= hours[1]; t += 60) {
      if (t < LUNCH[1] && t + dur > LUNCH[0]) continue;
      if (date < TODAY || (date === TODAY && t <= NOW)) continue;
      list.push({ start: t, free: !conflict(pracId, date, t, dur, ignoreId) });
    }
    return list;
  }

  function nextFree(pracId, fromDate, dur, count, ignoreId) {
    const found = [];
    for (let d = fromDate, i = 0; i < 28 && found.length < count; d = addDays(d, 1), i++) {
      slots(pracId, d, dur, ignoreId).forEach(s => {
        if (s.free && found.length < count) found.push({ date: d, start: s.start });
      });
    }
    return found;
  }

  const history = id => appts.filter(a => a.patient === id).sort((a, b) => (b.date + hm(b.start)).localeCompare(a.date + hm(a.start)));
  const nextAppt = id => appts
    .filter(a => a.patient === id && !['cancelled', 'absent', 'done'].includes(a.status) && (a.date > TODAY || (a.date === TODAY && a.start + a.dur > NOW)))
    .sort((a, b) => (a.date + hm(a.start)).localeCompare(b.date + hm(b.start)))[0];

  function ageOf(p) {
    const [y, m, d] = p.birth.split('-').map(Number);
    const [ty, tm, td] = TODAY.split('-').map(Number);
    return ty - y - (tm < m || (tm === m && td < d) ? 1 : 0);
  }

  window.Data = {
    TODAY, NOW, DAY_START, DAY_END, LUNCH, CLOSED, STATUS, PATIENT_STATUS,
    practitioners, patients, appts,
    addDays, weekday, monday, fmt, hm, toMin,
    prac, patient, apptsOn, worksOn, conflict, slots, nextFree, history, nextAppt, ageOf, add,
  };
})();
