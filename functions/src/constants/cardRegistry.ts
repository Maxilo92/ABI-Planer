export interface BaseCardConfig {
  id: string;
  name: string;
  rarity: string;
  type: 'teacher' | 'support';
  color?: string;
  description?: string;
}

export interface TeacherCardConfig extends BaseCardConfig {
  type: 'teacher';
  hp: number;
  attacks: Array<{
    name: string;
    damage: number;
    description?: string;
  }>;
}

export interface SupportCardConfig extends BaseCardConfig {
  type: 'support';
  description: string;
  effect: string;
  effectId: string;
  baseMultiplier: number;
  incrementPerLevel: number;
  style: string;
}

export type CardConfig = TeacherCardConfig | SupportCardConfig;

export interface ResolvedCard extends BaseCardConfig {
  setId: string;
  fullId: string; // setId:cardId
  cardNumber: string; // prefix-cardId
  hp?: number;
  attacks?: TeacherCardConfig['attacks'];
  description?: string;
  effect?: string;
  effectId?: string;
  baseMultiplier?: number;
  incrementPerLevel?: number;
  style?: string;
}

export interface SetDefinition {
  id: string;
  name: string;
  prefix: string;
  color: string;
  cards: CardConfig[];
}

const CANONICAL_TEACHER_SET_ID = 'teacher_vol1';
const LEGACY_TEACHER_SET_ID = 'teachers_v1';

export const TEACHERS_V1: TeacherCardConfig[] = [
  { id: "herr-zeiler", name: "Herr Zeiler", rarity: "legendary", type: "teacher", hp: 90, description: "Macht gerne früher Schluss.", attacks: [{"damage":30,"name":"TÜRKEI BESUCH","description":"FÜR DIE HAIRLINE"},{"description":"Mag er halt","name":"Vogel Biss","damage":10},{"description":"Lethal ","name":"„Och Finn“","damage":50}] },
  { id: "frau-bennari", name: "Frau Bennari", rarity: "common", type: "teacher", hp: 60, attacks: [{ name: "Klausur korrigieren", damage: 20 }] },
  { id: "frau-biastoch", name: "Frau Biastoch", rarity: "rare", type: "teacher", hp: 70, attacks: [{ name: "Hefterkontrolle", damage: 25 }] },
  { id: "frau-bien", name: "Frau Bien", rarity: "common", type: "teacher", hp: 60, attacks: [{ name: "Summ-Attacke", damage: 15 }] },
  { id: "frau-bley", name: "Frau Bley", rarity: "common", type: "teacher", hp: 60, attacks: [{ name: "Vokabeltest", damage: 20 }] },
  { id: "frau-burckhardt", name: "Frau Burckhardt", rarity: "rare", type: "teacher", hp: 75, attacks: [{ name: "Analyse", damage: 30 }] },
  { id: "frau-clemens", name: "Frau Clemens", rarity: "common", type: "teacher", hp: 60, attacks: [{ name: "Lesestunde", damage: 15 }] },
  { id: "frau-courant-fernandes", name: "Frau Courant Fernandes", rarity: "common", type: "teacher", hp: 65, attacks: [{ name: "Vokabel-Sprint", damage: 20 }] },
  { id: "frau-deleske", name: "Frau Deleske", rarity: "common", type: "teacher", hp: 60, attacks: [{ name: "Zuhören!", damage: 15 }] },
  { id: "frau-drescher", name: "Frau Drescher", rarity: "common", type: "teacher", hp: 60, attacks: [{ name: "Diktat", damage: 20 }] },
  { id: "frau-ernst", name: "Frau Ernst", rarity: "rare", type: "teacher", hp: 70, description: "Zu Verhaltensstreng", attacks: [{"name":"Sozialberater","damage":30},{"description":"Eigentlich Lustig","name":"Belehrung an die Jungs","damage":20}] },
  { id: "frau-feuerbach", name: "Frau Feuerbach", rarity: "epic", type: "teacher", hp: 80, description: "Besitzerin des Kunst Raumes", attacks: [{"name":"Leporello ","damage":30,"description":"Zu viel Arbeit"},{"damage":40,"name":"70% Motivation","description":"Note trotzdem gewürfelt"}] },
  { id: "frau-fiedler", name: "Frau Fiedler", rarity: "rare", type: "teacher", hp: 70, attacks: [{ name: "Formel-Check", damage: 25 }] },
  { id: "frau-franke", name: "Frau Franke", rarity: "rare", type: "teacher", hp: 75, attacks: [{ name: "Grammatik-Hammer", damage: 30 }] },
  { id: "frau-friedrich", name: "Frau Friedrich", rarity: "rare", type: "teacher", hp: 70, attacks: [{ name: "Experiment", damage: 25 }] },
  { id: "frau-fritzsch", name: "Frau Fritzsch", rarity: "common", type: "teacher", hp: 60, attacks: [{ name: "Notiz machen", damage: 15 }] },
  { id: "frau-galle", name: "Frau Galle", rarity: "rare", type: "teacher", hp: 75, attacks: [{ name: "Quellenkritik", damage: 30 }] },
  { id: "frau-gantumur", name: "Frau Gantumur", rarity: "common", type: "teacher", hp: 60, attacks: [{ name: "Vokabeln!", damage: 20 }] },
  { id: "frau-ganzer", name: "Frau Ganzer", rarity: "rare", type: "teacher", hp: 70, attacks: [{ name: "Hausaufgaben-Check", damage: 25 }] },
  { id: "frau-haase", name: "Frau Haase", rarity: "common", type: "teacher", hp: 60, attacks: [{ name: "Häschen-Hüpfer", damage: 15 }] },
  { id: "frau-henker", name: "Frau Henker", rarity: "epic", type: "teacher", hp: 85, attacks: [{ name: "Urteilsspruch", damage: 45 }] },
  { id: "frau-hoppe", name: "Frau Hoppe", rarity: "common", type: "teacher", hp: 60, attacks: [{ name: "Hopp-Hopp", damage: 15 }] },
  { id: "frau-jerol", name: "Frau Jerol", rarity: "common", type: "teacher", hp: 70, description: "", attacks: [{"damage":30,"name":"FEMINISTEN ATTACKE","description":"HALT NUR WÜTEND"},{"damage":20,"name":"STANLEY ATTACKE "}] },
  { id: "frau-jurk", name: "Frau Jurk", rarity: "common", type: "teacher", hp: 60, attacks: [{ name: "Mitschrift", damage: 15 }] },
  { id: "frau-k-gler", name: "Frau Kügler", rarity: "common", type: "teacher", hp: 60, attacks: [{ name: "Lernkontrolle", damage: 20 }] },
  { id: "frau-k-nzelmann", name: "Frau Künzelmann", rarity: "common", type: "teacher", hp: 60, attacks: [{ name: "Vortrag", damage: 15 }] },
  { id: "frau-kaule", name: "Frau Kaule", rarity: "common", type: "teacher", hp: 60, attacks: [{ name: "Kausalkette", damage: 20 }] },
  { id: "frau-kober", name: "Frau Kober", rarity: "common", type: "teacher", hp: 60, attacks: [{ name: "Kurzvortrag", damage: 15 }] },
  { id: "frau-kobisch", name: "Frau Kobisch", rarity: "common", type: "teacher", hp: 60, attacks: [{ name: "Karte ziehen", damage: 15 }] },
  { id: "frau-krenzke", name: "Frau Krenzke", rarity: "common", type: "teacher", hp: 60, attacks: [{ name: "Kartenarbeit", damage: 20 }] },
  { id: "frau-laber", name: "Frau Laber", rarity: "epic", type: "teacher", hp: 90, attacks: [{ name: "Dauerreden", damage: 40 }] },
  { id: "frau-link", name: "Frau Link", rarity: "common", type: "teacher", hp: 60, attacks: [{ name: "Verknüpfung", damage: 15 }] },
  { id: "frau-loitsch", name: "Frau Loitsch", rarity: "mythic", type: "teacher", hp: 90, description: "Sehr Netten Mann", attacks: [{ name: "Physik-Rätsel", damage: 50 }] },
  { id: "frau-manuwald", name: "Frau Manuwald", rarity: "common", type: "teacher", hp: 60, attacks: [{ name: "Schreibübung", damage: 15 }] },
  { id: "frau-matz", name: "Frau Matz", rarity: "rare", type: "teacher", hp: 70, attacks: [{ name: "Mathe-Trick", damage: 30 }] },
  { id: "frau-meinhold", name: "Frau Meinhold", rarity: "mythic", type: "teacher", hp: 120, description: "Mag irgendwie keiner", attacks: [{"description":"Fatal","name":"„Sie“","damage":40},{"description":"Gar kein Bock","damage":20,"name":"Stundenarbeit"}] },
  { id: "frau-mey", name: "Frau Mey", rarity: "common", type: "teacher", hp: 60, attacks: [{ name: "Maiglöckchen", damage: 15 }] },
  { id: "frau-neufeldt", name: "Frau Neufeldt", rarity: "rare", type: "teacher", hp: 75, attacks: [{ name: "Neuland", damage: 25 }] },
  { id: "frau-neugebauer", name: "Frau Neugebauer", rarity: "common", type: "teacher", hp: 60, attacks: [{ name: "Grundstein", damage: 15 }] },
  { id: "frau-nims", name: "Frau Nims", rarity: "common", type: "teacher", hp: 60, attacks: [{ name: "Nimm's leicht", damage: 15 }] },
  { id: "frau-nobis", name: "Frau Nobis", rarity: "common", type: "teacher", hp: 60, attacks: [{ name: "Edelmütig", damage: 15 }] },
  { id: "frau-packheiser", name: "Frau Packheiser", rarity: "common", type: "teacher", hp: 80, description: "Bio Gk", attacks: [{"name":"Enzyme Malen","damage":20},{"damage":30,"name":"Mikroskopieren "}] },
  { id: "frau-peucker", name: "Frau Peucker", rarity: "common", type: "teacher", hp: 60, attacks: [{ name: "Paukenschlag", damage: 20 }] },
  { id: "frau-piwonka", name: "Frau Piwonka", rarity: "epic", type: "teacher", hp: 110, description: "Zu Komplexe Aufgaben", attacks: [{"name":"Eisenhelm werfen","damage":40,"description":"Tut schon weh"},{"description":"Kommandantin ","name":"BigBand Armee","damage":20}] },
  { id: "frau-r-hling", name: "Frau Röhling", rarity: "common", type: "teacher", hp: 60, attacks: [{ name: "Rollenverteilung", damage: 15 }] },
  { id: "frau-r-mer", name: "Frau Römer", rarity: "rare", type: "teacher", hp: 75, attacks: [{ name: "Latein-Power", damage: 35 }] },
  { id: "frau-reichelt", name: "Frau Reichelt", rarity: "common", type: "teacher", hp: 60, attacks: [{ name: "Reichtum an Wissen", damage: 15 }] },
  { id: "frau-rosenthal", name: "Frau Rosenthal", rarity: "common", type: "teacher", hp: 60, attacks: [{ name: "Rosen-Dorn", damage: 15 }] },
  { id: "frau-runge", name: "Frau Runge", rarity: "common", type: "teacher", hp: 60, attacks: [{ name: "Langstreckenlauf", damage: 20 }] },
  { id: "frau-ruscher", name: "Frau Ruscher", rarity: "rare", type: "teacher", hp: 70, attacks: [{ name: "Schnelligkeit", damage: 25 }] },
  { id: "frau-schier", name: "Frau Schier", rarity: "rare", type: "teacher", hp: 70, description: "ICH HAB DAS FEUER GELÖSCHT", attacks: [{"name":"FEUER LÖSCHEN","damage":40},{"name":"RAUCH SEHEN","damage":20}] },
  { id: "frau-schimek", name: "Frau Schimek", rarity: "rare", type: "teacher", hp: 70, attacks: [{ name: "Schachzug", damage: 30 }] },
  { id: "frau-schmidt", name: "Frau Schmidt", rarity: "common", type: "teacher", hp: 60, attacks: [{ name: "Standard-Check", damage: 15 }] },
  { id: "frau-schultz", name: "Frau Schultz", rarity: "rare", type: "teacher", hp: 75, description: "Nette Mathelehrerin", attacks: [{"description":"Lk Easy","damage":20,"name":"Dreieck Berechnen"},{"description":"-Aura","damage":40,"name":"Falsche Lösung anschreiben"}] },
  { id: "frau-schumann", name: "Frau Schumann", rarity: "epic", type: "teacher", hp: 70, description: "Sehr Nette Lehrerin", attacks: [{"description":"Gehörschutz Empfohlen ","name":"Grelle Stimme","damage":40},{"description":"Bringt halt nichts","damage":10,"name":"Willhelm ein Helm geben"}] },
  { id: "frau-schwarzer", name: "Frau Schwarzer", rarity: "common", type: "teacher", hp: 60, attacks: [{ name: "Schwarzmalerei", damage: 15 }] },
  { id: "frau-stein", name: "Frau Stein", rarity: "common", type: "teacher", hp: 65, attacks: [{ name: "Stein-Wurf", damage: 20 }] },
  { id: "frau-stelzig", name: "Frau Stelzig", rarity: "common", type: "teacher", hp: 60, attacks: [{ name: "Stelzen-Lauf", damage: 15 }] },
  { id: "frau-strote", name: "Frau Strote", rarity: "epic", type: "teacher", hp: 85, attacks: [{ name: "Strenge", damage: 40 }] },
  { id: "frau-t-th", name: "Frau Tóth", rarity: "rare", type: "teacher", hp: 70, attacks: [{ name: "Ungarn-Power", damage: 30 }] },
  { id: "frau-unger", name: "Frau Unger", rarity: "mythic", type: "teacher", hp: 100, description: "", attacks: [{"name":"Schwarze Klamotten ","damage":30,"description":"Endgegner Drip"},{"description":"Demotiviereung Nr. 1 ","damage":40,"name":"1vs1 Klausurausgabe"}] },
  { id: "frau-vogel", name: "Frau Vogel", rarity: "mythic", type: "teacher", hp: 95, attacks: [{ name: "Vogel-Flug", damage: 45 }] },
  { id: "frau-wahl", name: "Frau Wahl", rarity: "common", type: "teacher", hp: 60, attacks: [{ name: "Wahl-Kampf", damage: 15 }] },
  { id: "frau-weise", name: "Frau Weise", rarity: "rare", type: "teacher", hp: 75, attacks: [{ name: "Weisheit", damage: 35 }] },
  { id: "frau-wendorff", name: "Frau Wendorff", rarity: "rare", type: "teacher", hp: 70, attacks: [{ name: "Diplomatie", damage: 25 }] },
  { id: "frau-wilke", name: "Frau Wilke", rarity: "common", type: "teacher", hp: 60, attacks: [{ name: "Willenskraft", damage: 15 }] },
  { id: "frau-wonneberger", name: "Frau Wonneberger", rarity: "common", type: "teacher", hp: 60, attacks: [{ name: "Wonne-Gefühl", damage: 15 }] },
  { id: "herr-altenhenne", name: "Herr Altenhenne", rarity: "rare", type: "teacher", hp: 70, attacks: [{ name: "Altersschlag", damage: 25 }] },
  { id: "herr-de-vivanco", name: "Herr de Vivanco", rarity: "epic", type: "teacher", hp: 80, description: "WIR MACHEN HEUTE SCHÜLERVERSUCHE", attacks: [{"name":"GROßER LEIM","damage":30,"description":"KLEBRIG"},{"name":"HÜBSCHE HOSE","damage":20}] },
  { id: "herr-fritzsch", name: "Herr Fritzsch", rarity: "common", type: "teacher", hp: 60, attacks: [{ name: "Frischling", damage: 15 }] },
  { id: "herr-fuchs", name: "Herr Fuchs", rarity: "rare", type: "teacher", hp: 75, attacks: [{ name: "Fuchs-List", damage: 30 }] },
  { id: "herr-gr-ler", name: "Herr Gräßler", rarity: "legendary", type: "teacher", hp: 110, description: "Dem muss in Sommer doch warm sein", attacks: [{"name":"Klingelton","damage":20,"description":"Das A-Team kommt"},{"description":"","name":"2 Wochen Afghanistan EINSATZ","damage":40}] },
  { id: "herr-grabowski", name: "Herr Grabowski", rarity: "epic", type: "teacher", hp: 85, attacks: [{ name: "Grabung", damage: 35 }] },
  { id: "herr-j-rg", name: "Herr Jörg", rarity: "rare", type: "teacher", hp: 75, description: "Latein Nr. 1", attacks: [{"description":"Fatal","name":"Mika und Oli hassen","damage":40},{"description":"Check nix","damage":20,"name":"Gottlose Viele Aufgaben machen"}] },
  { id: "herr-k-nner", name: "Herr Känner", rarity: "iconic", type: "teacher", hp: 130, description: "Ober Boss", attacks: [{"name":"Elterngespräch ","damage":30,"description":"Och nö "},{"damage":60,"name":"Verweis","description":"Ab nach Hause"}] },
  { id: "herr-kaiser", name: "Herr Kaiser", rarity: "rare", type: "teacher", hp: 80, attacks: [{ name: "Kaiserschnitt", damage: 30 }] },
  { id: "herr-kreye", name: "Herr Kreye", rarity: "rare", type: "teacher", hp: 75, attacks: [{ name: "Kreativität", damage: 25 }] },
  { id: "herr-kutschick", name: "Herr Kutschick", rarity: "epic", type: "teacher", hp: 90, attacks: [{ name: "Kutschen-Fahrt", damage: 40 }] },
  { id: "herr-lange", name: "Herr Lange", rarity: "common", type: "teacher", hp: 65, attacks: [{ name: "Langer Atem", damage: 20 }] },
  { id: "herr-loitsch", name: "Herr Loitsch", rarity: "legendary", type: "teacher", hp: 105, description: "Alt aber immernoch Top-Fit", attacks: [{"damage":50,"name":"Physik Gott","description":"Machste nix"},{"description":"Schlimmer als Latein","damage":30,"name":"Mathe Sprache üben"}] },
  { id: "herr-lory", name: "Herr Lory", rarity: "mythic", type: "teacher", hp: 110, description: "Kann man gut mit Reden", attacks: [{"description":"Siehste Nix","name":"Schiel-Attacke ","damage":30},{"name":"Lautstärke x2","damage":20,"description":"Gehörsturz"}] },
  { id: "herr-moch", name: "Herr Moch", rarity: "epic", type: "teacher", hp: 120, description: "DU BIST EIN NICHTS", attacks: [{"name":"Abwertend manchen Menschgruppen  gegenüber","damage":40,"description":"Schon Bodenlos"},{"damage":30,"name":"Haasen gegen die Wand werfen "}] },
  { id: "herr-musiol", name: "Herr Musiol", rarity: "rare", type: "teacher", hp: 75, attacks: [{ name: "Musik-Stunde", damage: 30 }] },
  { id: "herr-rehnolt", name: "Herr Rehnolt", rarity: "epic", type: "teacher", hp: 90, attacks: [{ name: "Regelung", damage: 40 }] },
  { id: "herr-rentsch", name: "Herr Rentsch", rarity: "mythic", type: "teacher", hp: 80, description: "JETZT IST UNTERRICHT JETZT BIN ICH GEIL", attacks: [{"description":"Alle Instrumente können","name":"Solo Orchester ","damage":40},{"description":"PAYFONE","damage":20,"name":"FASCHING SAVEN"}] },
  { id: "herr-richter", name: "Herr Richter", rarity: "legendary", type: "teacher", hp: 80, description: "Bester Lehrer der Schule", attacks: [{"description":"Süßer Typ","damage":1,"name":"Eis essen"},{"description":"High Definition Multimedia Interface","name":"Technik Probleme","damage":60}] },
  { id: "herr-riedel", name: "Herr Riedel", rarity: "legendary", type: "teacher", hp: 110, description: "Fahrrad Fanatiker", attacks: [{"description":"Ganz Interessant ","name":"Familien Geschichten ","damage":20},{"name":"Klausur nach 2 Jahren nichts tun","damage":50,"description":"Endgame"}] },
  { id: "herr-ritter", name: "Herr Ritter", rarity: "rare", type: "teacher", hp: 85, attacks: [{ name: "Ritterschlag", damage: 35 }] },
  { id: "herr-sarodnik", name: "Herr Sarodnik", rarity: "mythic", type: "teacher", hp: 100, description: "Flexer Nr. 1 (aber garnich so Krass)", attacks: [{"name":"BMW Rev","damage":5,"description":"Halt geleased"},{"name":"1vs1 Clash Royale","damage":50,"description":"Halt Top 100"}] },
  { id: "herr-schlegel", name: "Herr Schlegel", rarity: "epic", type: "teacher", hp: 100, description: "", attacks: [{"name":"FREAKY FRIDAY","damage":40,"description":"OH YEAH"},{"damage":20,"name":"FAHRRAD FAHREN ","description":"AB GEHTS"}] },
  { id: "herr-schneider", name: "Herr Schneider", rarity: "epic", type: "teacher", hp: 90, attacks: [{ name: "Zuschnitt", damage: 35 }] },
  { id: "herr-scholz", name: "Herr Scholz", rarity: "epic", type: "teacher", hp: 80, description: "Halber Schüler noch", attacks: [{"damage":30,"name":"Mac Book Attacke","description":"Aluminium Tut schon weh"},{"damage":20,"name":"Lehrbuch Aufgaben"}] },
  { id: "herr-schulze", name: "Herr Schulze", rarity: "rare", type: "teacher", hp: 120, description: "WIKINGER", attacks: [{"damage":30,"name":"BONSAI ZÜCHTEN "}] },
  { id: "herr-stange", name: "Herr Stange", rarity: "mythic", type: "teacher", hp: 150, description: "Abstand halten und Mitschrieben", attacks: [{"description":"Kann er aber nich","damage":30,"name":"Anschreien "},{"damage":40,"name":"Hefter Raus!"}] },
  { id: "herr-stange-junior-1774192999093", name: "Herr Stange Junior", rarity: "rare", type: "teacher", hp: 130, description: "", attacks: [{"description":"100kg ","name":"Bankdrücken","damage":30},{"damage":10,"name":"Bodenturnen "}] },
  { id: "herr-stirner", name: "Herr Stirner", rarity: "epic", type: "teacher", hp: 120, description: "", attacks: [{"damage":30,"name":"Hantel Werfen"}] },
  { id: "herr-stuhlmacher", name: "Herr Stuhlmacher", rarity: "rare", type: "teacher", hp: 80, attacks: [{ name: "Handarbeit", damage: 25 }] },
  { id: "herr-trinczek", name: "Herr Trinczek", rarity: "mythic", type: "teacher", hp: 90, description: "Technik Gott", attacks: [{"description":"Ist halt OP","damage":50,"name":"Server Lahmlegen "},{"name":"Basecap Wurf ","damage":20,"description":"Tut schon weh"}] },
  { id: "herr-wei-", name: "Herr Weiß", rarity: "mythic", type: "teacher", hp: 80, description: "Business Meister", attacks: [{"name":"90 Vorlesung","damage":20,"description":"Einschläfernd "},{"description":"Viel zu viel","damage":30,"name":"680 Seiten VW Analysieren"}] },
  { id: "frau-richter", name: "Frau Richter", rarity: "iconic", type: "teacher", hp: 65, description: "Old but Gold", attacks: [{"description":"Oh nein ","name":"In Rente Gehen ","damage":80},{"damage":20,"name":"Kunstausstellung  ","description":"Sehr schöne Bilder"}] },
  { id: "frau-kmpf", name: "Frau Kämpf", rarity: "rare", type: "teacher", hp: 75, attacks: [{ name: "Kampfgeist", damage: 30 }] }
];

export const SUPPORT_V1: SupportCardConfig[] = [
  {
    id: 'noten-wuerfeln',
    name: 'Noten würfeln',
    rarity: 'common',
    type: 'support',
    description: 'Wirf einen 6-seitigen Würfel. Der Gegner erleidet Schaden in Höhe der Augenzahl multipliziert mit 10.',
    effect: 'Wirf einen Würfel, der Gegner nimmt die Augenzahl multipliziert mit 10 Schaden.',
    effectId: 'dice_roll_damage',
    baseMultiplier: 10,
    incrementPerLevel: 1,
    style: 'modern-flat'
  }
];

export const CARD_SETS: Record<string, SetDefinition> = {
  [CANONICAL_TEACHER_SET_ID]: {
    id: CANONICAL_TEACHER_SET_ID,
    name: 'Lehrer Set v1',
    prefix: 'T1',
    color: '#3b82f6',
    cards: TEACHERS_V1
  },
  'support_v1': {
    id: 'support_v1',
    name: 'Support Set v1',
    prefix: 'S1',
    color: '#10b981',
    cards: SUPPORT_V1
  }
};

export const cardRegistry: Record<string, ResolvedCard> = {};

/**
 * Rebuilds the registry index from CARD_SETS and optional dynamic sets.
 */
export function rebuildRegistryIndex(dynamicSets?: Record<string, SetDefinition>) {
  // Clear existing index
  Object.keys(cardRegistry).forEach(key => delete cardRegistry[key]);

  const allSets = { ...CARD_SETS, ...(dynamicSets || {}) };

  Object.values(allSets).forEach((set) => {
    set.cards.forEach((card) => {
      const fullId = `${set.id}:${card.id}`;
      const resolvedCard = {
        ...card,
        setId: set.id,
        fullId,
        cardNumber: `${set.prefix}-${card.id}`,
        color: card.color || set.color,
      } as ResolvedCard;

      cardRegistry[fullId] = resolvedCard;

      if (set.id === CANONICAL_TEACHER_SET_ID) {
        const legacyFullId = `${LEGACY_TEACHER_SET_ID}:${card.id}`;
        cardRegistry[legacyFullId] = {
          ...resolvedCard,
          setId: CANONICAL_TEACHER_SET_ID,
          fullId,
        };
      }
    });
  });
}

rebuildRegistryIndex();

export function getCard(id: string): ResolvedCard | undefined {
  if (!id) return undefined;
  let fullId = id;
  if (!id.includes(':')) {
    fullId = `${CANONICAL_TEACHER_SET_ID}:${id}`;
  }

  const directMatch = cardRegistry[fullId];
  if (directMatch) return directMatch;

  if (fullId.startsWith(`${LEGACY_TEACHER_SET_ID}:`)) {
    const cardId = fullId.slice(`${LEGACY_TEACHER_SET_ID}:`.length);
    return cardRegistry[`${CANONICAL_TEACHER_SET_ID}:${cardId}`];
  }
  return undefined;
}

export function getAllCards(): ResolvedCard[] {
  const unique = new Map<string, ResolvedCard>();
  Object.values(cardRegistry).forEach((card) => {
    if (!unique.has(card.fullId)) unique.set(card.fullId, card);
  });
  return Array.from(unique.values());
}

export function getCardsBySet(setId: string): ResolvedCard[] {
  return Object.values(cardRegistry).filter(card => card.setId === setId);
}
