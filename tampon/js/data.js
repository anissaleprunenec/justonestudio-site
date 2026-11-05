// Données fictives de démo : une PME lyonnaise et ses factures fournisseurs.
// La date du jour est figée au mardi 3 novembre 2026.

const COMPANY = { nom: "Torréfaction artisanale", ville: "Lyon" };

const PEOPLE = {
  CM: { nom: "Clara Martin", role: "Comptable" },
  JL: { nom: "Julien Lemaire", role: "Gérant" },
  SB: { nom: "Samia Benali", role: "Responsable achats" },
};

// Profil affiché : Clara par défaut, la démo permet de passer dans la peau de Julien.
// Un lien peut aussi ouvrir la démo côté Julien : ?as=JL
const CURRENT_USER = (() => {
  try {
    const asked = new URLSearchParams(location.search).get("as");
    const saved = JSON.parse(localStorage.getItem("tampon-demo-v1") || "{}");
    if (asked === "JL" || asked === "CM") {
      saved.user = asked;
      localStorage.setItem("tampon-demo-v1", JSON.stringify(saved));
    }
    return saved.user || "CM";
  } catch (e) {
    return "CM";
  }
})();

// Notifications de départ, par destinataire
const SEED_NOTIFS = [
  { id: 1, for: "CM", when: "2 nov., 9:12", text: "Hélène Roux attend l'export d'octobre pour la déclaration de TVA.", href: "comptable.html", read: false },
  { id: 2, for: "CM", when: "2 nov., 8:40", text: "3 nouvelles factures reçues par e-mail, dont 2 avec un point à revoir.", href: "index.html?tab=verifier", read: false },
  { id: 3, for: "JL", when: "3 nov., 8:05", text: "3 factures attendent votre validation, la plus ancienne depuis 7 jours.", href: "index.html?tab=valider", read: false },
  { id: 4, for: "JL", when: "31 oct., 17:10", text: "Clara vous a envoyé la facture 2026-311 (imprimeur) à valider.", href: "facture.html?id=6", read: true },
];

// Motifs de refus proposés
const REFUSAL_REASONS = ["Prestation non réalisée", "Montant incorrect", "Facture en double", "Mentions obligatoires manquantes", "Autre motif"];

const INVOICES = [
  { id: 1, fournisseur: "Importateur de café vert", numero: "FA-2026-1184", recue: "2026-11-02", echeance: "2026-12-02", ttc: 8460.0, statut: "verifier", ia: 64, alerte: "2 champs à revoir", resp: "CM" },
  { id: 2, fournisseur: "Fabricant d'emballages", numero: "ER-55021", recue: "2026-11-02", echeance: "2026-11-17", ttc: 1932.48, statut: "verifier", ia: 97, resp: "CM" },
  { id: 3, fournisseur: "Transporteur", numero: "TV/10/0932", recue: "2026-11-01", echeance: "2026-11-15", ttc: 684.0, statut: "verifier", ia: 71, alerte: "Doublon possible", resp: "CM" },
  { id: 4, fournisseur: "Fournisseur d'électricité", numero: "10293847561", recue: "2026-10-30", echeance: "2026-11-14", ttc: 1247.9, statut: "valider", ia: 99, resp: "JL" },
  { id: 5, fournisseur: "Maintenance du torréfacteur", numero: "PF-26-0417", recue: "2026-10-28", echeance: "2026-11-06", ttc: 3576.0, statut: "valider", ia: 95, resp: "JL" },
  { id: 6, fournisseur: "Imprimeur", numero: "2026-311", recue: "2026-10-27", echeance: "2026-10-31", ttc: 540.0, statut: "valider", ia: 92, resp: "SB" },
  { id: 7, fournisseur: "Importateur de café vert", numero: "FA-2026-1102", recue: "2026-10-20", echeance: "2026-10-30", ttc: 7920.0, statut: "payer", ia: 98, resp: "JL" },
  { id: 8, fournisseur: "Laiterie", numero: "LDM-8812", recue: "2026-10-26", echeance: "2026-11-05", ttc: 412.35, statut: "payer", ia: 96, resp: "SB" },
  { id: 9, fournisseur: "Bailleur du local", numero: "LOY-11-2026", recue: "2026-10-25", echeance: "2026-11-05", ttc: 2400.0, statut: "payer", ia: 99, resp: "JL" },
  { id: 10, fournisseur: "Opérateur télécom", numero: "FB 7731 0092", recue: "2026-10-22", echeance: "2026-11-08", ttc: 89.99, statut: "payer", ia: 99, resp: "CM" },
  { id: 11, fournisseur: "Fabricant d'emballages", numero: "ER-54870", recue: "2026-10-12", echeance: "2026-10-27", ttc: 1660.8, statut: "payee", ia: 98, resp: "CM" },
  { id: 12, fournisseur: "Transporteur", numero: "TV/10/0871", recue: "2026-10-10", echeance: "2026-10-25", ttc: 684.0, statut: "payee", ia: 94, resp: "CM" },
  { id: 13, fournisseur: "Société de nettoyage", numero: "NC-0466", recue: "2026-10-09", echeance: "2026-10-24", ttc: 318.0, statut: "refusee", ia: 90, alerte: "Prestation non réalisée", resp: "SB" },
  { id: 14, fournisseur: "Maintenance du torréfacteur", numero: "PF-26-0389", recue: "2026-10-05", echeance: "2026-10-20", ttc: 3480.0, statut: "payee", ia: 97, resp: "JL" },
];

// Documents d'exemple pour la démo d'import, avec les imprévus du quotidien :
// un doublon, une photo illisible, un devis glissé dans le lot, un nouveau fournisseur.
// Les factures retenues rejoignent la liste une fois importées.
const SAMPLE_IMPORTS = [
  { id: 101, file: "ER-55140.pdf", fournisseur: "Fabricant d'emballages", numero: "ER-55140", recue: "2026-11-03", echeance: "2026-11-18", ttc: 2448.0, statut: "verifier", ia: 96, resp: "CM" },
  { id: 104, kind: "duplicate", dupOf: 2, file: "ER-55021-relance.pdf", fournisseur: "Fabricant d'emballages", numero: "ER-55021", recue: "2026-11-03", echeance: "2026-11-17", ttc: 1932.48, statut: "verifier", ia: 97, resp: "CM", alerte: "Doublon importé" },
  { id: 102, file: "facture-electricite-novembre.pdf", fournisseur: "Fournisseur d'électricité", numero: "10293921110", recue: "2026-11-03", echeance: "2026-11-18", ttc: 1312.4, statut: "verifier", ia: 98, resp: "CM" },
  { id: 901, kind: "unreadable", file: "photo-ticket-livraison.jpg" },
  { id: 103, file: "PF-26-0455.pdf", fournisseur: "Maintenance du torréfacteur", numero: "PF-26-0455", recue: "2026-11-03", echeance: "2026-11-18", ttc: 4210.0, statut: "verifier", ia: 74, resp: "CM" },
  { id: 902, kind: "notInvoice", file: "devis-entretien-bruleur.pdf", what: "un devis du mainteneur du torréfacteur", fournisseur: "Maintenance du torréfacteur" },
  {
    id: 105, kind: "newSupplier", file: "facture-sacs-jute.pdf", fournisseur: "Fabricant de sacs en jute", numero: "JF-2026-118", recue: "2026-11-03", echeance: "2026-12-03", ttc: 744.0, statut: "verifier", ia: 93, resp: "CM",
    newSupplier: { ville: "69009 Lyon", objet: "Sacs en toile de jute imprimés, 5 kg", qte: 120, tva: 20, iban: null, compte: "602 · Emballages" },
  },
];
const isInvoiceSample = (s) => s.kind !== "unreadable" && s.kind !== "notInvoice";

// Fiche de chaque fournisseur : ce que l'outil connaît déjà.
const SUPPLIERS = {
  "Importateur de café vert": { ville: "76600 Le Havre", objet: "Café vert Brésil Cerrado, sacs de 60 kg", qte: 22, tva: 5.5, iban: "FR76 3000 4012 3400 0105 2718 044", compte: "607 · Achats de marchandises" },
  "Fabricant d'emballages": { ville: "69200 Vénissieux", objet: "Sachets kraft à valve, 250 g et 1 kg", qte: 4000, tva: 20, iban: "FR76 1027 8073 0000 0204 1190 157", compte: "602 · Emballages" },
  "Transporteur": { ville: "69100 Villeurbanne", objet: "Livraisons clients, octobre", qte: 1, tva: 20, iban: "FR76 1695 8000 0123 4567 8901 234", compte: "624 · Transports" },
  "Fournisseur d'électricité": { ville: "75008 Paris", objet: "Électricité atelier, octobre", qte: 1, tva: 20, iban: "FR76 3000 3035 4000 0500 2617 866", compte: "606 · Énergie" },
  "Maintenance du torréfacteur": { ville: "69007 Lyon", objet: "Entretien du torréfacteur P25", qte: 1, tva: 20, iban: "FR76 3006 6100 4100 0105 8930 112", compte: "615 · Entretien et réparations" },
  "Imprimeur": { ville: "69003 Lyon", objet: "Étiquettes et cartes de fidélité", qte: 1, tva: 20, iban: "FR76 1382 5002 0008 0045 6123 978", compte: "623 · Publicité" },
  "Laiterie": { ville: "69290 Craponne", objet: "Lait entier bio, livraisons hebdomadaires", qte: 1, tva: 5.5, iban: "FR76 1780 6002 1004 1234 5678 912", compte: "607 · Achats de marchandises" },
  "Bailleur du local": { ville: "69002 Lyon", objet: "Loyer du local commercial, novembre", qte: 1, tva: 20, iban: "FR76 1009 6180 0000 0612 3344 501", compte: "613 · Locations" },
  "Opérateur télécom": { ville: "92130 Issy-les-Moulineaux", objet: "Fibre et téléphonie, novembre", qte: 1, tva: 20, iban: "FR76 3000 2005 5000 0015 7841 902", compte: "626 · Télécommunications" },
  "Société de nettoyage": { ville: "69008 Lyon", objet: "Nettoyage des locaux, octobre", qte: 1, tva: 20, iban: "FR76 1548 9047 1200 0207 9921 146", compte: "615 · Entretien et réparations" },
};

// Points que la lecture IA n'a pas pu trancher seule, par facture.
const CHECKS = {
  1: [
    {
      key: "echeance",
      title: "Échéance ambiguë",
      conf: 58,
      text: "Le document indique « 02/12/2026 », mais aussi « paiement à 30 jours fin de mois », ce qui donne le 31/12/2026.",
      options: [
        { value: "2026-12-02", label: "2 déc. 2026" },
        { value: "2026-12-31", label: "31 déc. 2026" },
      ],
    },
    {
      key: "iban",
      title: "IBAN différent du fournisseur",
      conf: 61,
      docValue: "FR76 4061 8803 1100 0402 9937 512",
      text: "Cet IBAN ne correspond pas à celui enregistré pour ce fournisseur (se terminant par 7180 44). Un changement d'IBAN peut cacher une fraude : confirmez-le d'abord avec le fournisseur.",
      options: [
        { value: "known", label: "Garder l'IBAN enregistré" },
        { value: "new", label: "Le fournisseur a confirmé" },
      ],
    },
  ],
  103: [
    {
      key: "ttc",
      title: "Montant inhabituel",
      conf: 74,
      text: "4 210 € TTC, c'est 18 % de plus que les entretiens habituels (3 576 €). La facture ajoute « remplacement du brûleur » : vérifiez que c'était prévu.",
      options: [
        { value: "ok", label: "C'était prévu" },
        { value: "ask", label: "Demander au fournisseur" },
      ],
    },
  ],
  3: [
    {
      key: "numero",
      title: "Doublon possible",
      conf: 71,
      text: "Même fournisseur et même montant que la facture TV/10/0871, réglée en octobre. Seul le numéro change.",
      refuseNote: "Doublon de TV/10/0871, réglée en octobre",
      options: [
        { value: "distinct", label: "Ce n'est pas un doublon" },
        { value: "doublon", label: "Refuser comme doublon", refuse: true },
      ],
    },
  ],
  // Importée malgré l'alerte de doublon
  104: [
    {
      key: "numero",
      title: "Doublon certain",
      conf: 99,
      text: "Même numéro, même montant et même fournisseur que ER-55021, reçue le 2 novembre et déjà dans la liste.",
      refuseNote: "Même facture que ER-55021, reçue le 2 novembre",
      options: [
        { value: "distinct", label: "Ce n'est pas un doublon" },
        { value: "doublon", label: "Refuser comme doublon", refuse: true },
      ],
    },
  ],
  // Nouveau fournisseur : son premier IBAN doit être confirmé avant tout virement
  105: [
    {
      key: "iban",
      title: "Nouveau fournisseur",
      conf: 88,
      docValue: "FR76 1470 7000 3100 2245 8810 263",
      text: "Ce fournisseur n'existe pas encore dans Tampon : la fiche fournisseur sera créée avec cet IBAN. Confirmez-le avec le fournisseur avant le premier virement.",
      options: [
        { value: "new", label: "IBAN confirmé avec le fournisseur" },
        { value: "rib", label: "RIB signé reçu" },
      ],
    },
  ],
};
