/**
 * CEO Academy V1 content — short, no-AI modules. Each card gives a simple
 * definition, a professional definition, an EN CUIVRE example, and a pitfall.
 */

export interface AcademyCard {
  id: string;
  term: string;
  simple: string;
  professional: string;
  example: string;
  pitfall: string;
}

export interface AcademyModule {
  id: string;
  title: string;
  cards: AcademyCard[];
}

export const academyModules: AcademyModule[] = [
  {
    id: "materials",
    title: "Matières",
    cards: [
      {
        id: "cathode",
        term: "Cathode de cuivre (Grade A)",
        simple: "Plaque de cuivre pur à 99,99%, la référence du marché.",
        professional:
          "Cuivre raffiné électrolytiquement conforme à la norme LME (Cu-CATH-1), pureté ≥ 99,99%.",
        example: "EN CUIVRE revend des cathodes Grade A à des câbliers comme CâblePlus.",
        pitfall: "Exiger un assay/COA récent : une 'cathode' sans certificat peut être hors-norme.",
      },
      {
        id: "millberry",
        term: "Millberry (cuivre recyclé propre)",
        simple: "Fil de cuivre propre récupéré, presque aussi pur que du neuf.",
        professional: "Cuivre de récupération n°1 (bare bright), sans isolant ni oxydation.",
        example: "EN CUIVRE rachète du Millberry aux électriciens via EN CUIVRE CIRCULAR.",
        pitfall: "Un Millberry oxydé ou huilé perd de la valeur : contrôler visuellement.",
      },
      {
        id: "brass",
        term: "Laiton",
        simple: "Alliage cuivre + zinc, jaune, facile à usiner.",
        professional: "Alliage Cu-Zn, nuances variables selon %Zn et additifs (plomb).",
        example: "EN CUIVRE négocie du laiton pour fonderies et l'atelier.",
        pitfall: "La nuance change le prix : ne pas confondre laiton et bronze.",
      },
      {
        id: "bronze",
        term: "Bronze",
        simple: "Alliage cuivre + étain, plus dur, souvent premium.",
        professional: "Alliage Cu-Sn (parfois +Al/+Ni), résistant à la corrosion.",
        example: "EN CUIVRE ATELIER l'utilise pour des objets signature.",
        pitfall: "Le prix suit l'étain, plus volatil que le cuivre.",
      },
      {
        id: "aluminium",
        term: "Aluminium",
        simple: "Métal léger, moins cher au kilo que le cuivre.",
        professional: "Alliages série 1xxx–7xxx selon usage; densité ~1/3 du cuivre.",
        example: "EN CUIVRE fournit Alumex en profilés/chutes aluminium.",
        pitfall: "Marge au kilo faible : raisonner en volume et en logistique.",
      },
    ],
  },
  {
    id: "pricing",
    title: "Prix",
    cards: [
      {
        id: "lme",
        term: "LME",
        simple: "La bourse qui fixe le prix mondial du cuivre.",
        professional: "London Metal Exchange : cotation de référence ($/t) pour les non-ferreux.",
        example: "EN CUIVRE indexe ses offres cathode sur le LME + premium.",
        pitfall: "Le LME est en USD/t : gérer le change EUR/USD.",
      },
      {
        id: "premium",
        term: "Premium",
        simple: "Le supplément au-dessus du prix LME.",
        professional: "Prime de livraison/qualité/région ajoutée au prix LME.",
        example: "Un premium cathode Europe s'ajoute au LME pour livraison à Anvers.",
        pitfall: "Oublier le premium fausse totalement la marge.",
      },
      {
        id: "spread",
        term: "Spread",
        simple: "L'écart entre le prix d'achat et le prix de vente.",
        professional: "Différentiel entre deux cotations/positions (ou achat vs vente).",
        example: "EN CUIVRE vit du spread fournisseur ↔ acheteur.",
        pitfall: "Un spread positif brut peut devenir négatif après logistique.",
      },
      {
        id: "landed",
        term: "Landed cost",
        simple: "Le coût total une fois la marchandise livrée.",
        professional: "Achat + transport + assurance + douane + financement + frais.",
        example: "Le Margin Guard calcule le landed cost avant de valider un deal.",
        pitfall: "Comparer un prix d'achat brut à un prix de vente 'rendu' est piégeux.",
      },
      {
        id: "grossmargin",
        term: "Marge brute",
        simple: "Ce qui reste après avoir payé la matière et la logistique.",
        professional: "(Prix de vente − landed cost) / prix de vente, en %.",
        example: "EN CUIVRE vise une marge brute ≥ 8% avant de contractualiser.",
        pitfall: "Marge en % vs en € : un gros volume à faible % peut battre un petit deal.",
      },
    ],
  },
  {
    id: "incoterms",
    title: "Commerce international",
    cards: [
      {
        id: "exw",
        term: "EXW",
        simple: "L'acheteur vient tout chercher à l'usine.",
        professional: "Ex Works : le vendeur met à disposition, l'acheteur assume tout le transport.",
        example: "EN CUIVRE achète EXW Lyon des chutes locales.",
        pitfall: "EXW = tout le risque logistique pour l'acheteur.",
      },
      {
        id: "fca",
        term: "FCA",
        simple: "Le vendeur livre au transporteur désigné.",
        professional: "Free Carrier : transfert de risque à la remise au transporteur.",
        example: "MétalSud livre FCA Marseille les busbars.",
        pitfall: "Bien nommer le lieu FCA exact.",
      },
      {
        id: "fob",
        term: "FOB",
        simple: "Le vendeur charge sur le bateau.",
        professional: "Free On Board : risque transféré une fois à bord au port d'embarquement.",
        example: "Katanga propose FOB Durban pour la cathode RDC.",
        pitfall: "FOB ne couvre pas le fret maritime ni l'assurance.",
      },
      {
        id: "cif",
        term: "CIF",
        simple: "Le vendeur paie le fret et l'assurance jusqu'au port.",
        professional: "Cost, Insurance and Freight jusqu'au port de destination.",
        example: "BrassCo cote CIF Anvers.",
        pitfall: "L'assurance CIF est souvent minimale : vérifier la couverture.",
      },
      {
        id: "ddp",
        term: "DDP",
        simple: "Le vendeur livre tout compris, douane payée.",
        professional: "Delivered Duty Paid : le vendeur assume tout jusqu'à destination.",
        example: "EN CUIVRE peut vendre DDP pour simplifier la vie du client.",
        pitfall: "DDP concentre tout le risque/coût côté vendeur.",
      },
    ],
  },
  {
    id: "documents",
    title: "Documents",
    cards: [
      {
        id: "coa",
        term: "COA",
        simple: "Le certificat qui prouve la qualité de la matière.",
        professional: "Certificate of Analysis : composition/pureté attestée en labo.",
        example: "Pas de deal cathode sans COA conforme.",
        pitfall: "Un COA peut être falsifié : recouper avec un assay indépendant.",
      },
      {
        id: "assay",
        term: "Assay",
        simple: "L'analyse qui mesure la teneur réelle du métal.",
        professional: "Essai/analyse déterminant la composition métallique.",
        example: "L'assay Katanga conditionne le prix final.",
        pitfall: "Assay à la charge de qui ? À définir avant expédition.",
      },
      {
        id: "origin",
        term: "Certificate of Origin",
        simple: "Le document qui indique d'où vient la marchandise.",
        professional: "Certificat d'origine douanier (chambre de commerce).",
        example: "Obligatoire pour dédouaner le corridor RDC → Europe.",
        pitfall: "Origine manquante = blocage douane et flag de risque.",
      },
      {
        id: "invoice",
        term: "Invoice",
        simple: "La facture commerciale.",
        professional: "Commercial Invoice : base de la transaction et du dédouanement.",
        example: "EN CUIVRE émet une invoice claire par deal.",
        pitfall: "Sous-facturer pour la douane est illégal et risqué.",
      },
      {
        id: "packing",
        term: "Packing List",
        simple: "La liste détaillée de ce qui est expédié.",
        professional: "Détail colis/poids/quantités accompagnant l'expédition.",
        example: "Jointe au bronze livré à l'atelier.",
        pitfall: "Incohérence packing/invoice = flag quantité.",
      },
      {
        id: "bl",
        term: "Bill of Lading",
        simple: "Le titre de transport maritime.",
        professional: "Connaissement : contrat de transport + titre de propriété des marchandises.",
        example: "Le B/L sécurise le paiement documentaire du corridor RDC.",
        pitfall: "Ne jamais lâcher l'original B/L sans garantie de paiement.",
      },
    ],
  },
];

export const glossaryTerms = academyModules.flatMap((m) =>
  m.cards.map((c) => ({
    term: c.term,
    definition: c.professional,
    simple: c.simple,
    module: m.title,
  })),
);
