// Seed data for Mesora: Istanbul districts, candidate venues and two demo groups.
// Venue travel minutes are a cached transit table (as an OSRM table call would return)
// in DISTRICT_ORDER. The live adapter in lib/solver.ts replaces them later.

export const DISTRICT_ORDER = [
  "kadikoy",
  "besiktas",
  "bakirkoy",
  "atasehir",
  "uskudar",
  "sisli",
  "fatih",
  "beyoglu",
  "maltepe",
  "sariyer",
] as const;

export type DistrictId = (typeof DISTRICT_ORDER)[number];
export type Side = "Europe" | "Asia";
export type Diet = "any" | "vegetarian" | "vegan";

export interface District {
  id: DistrictId;
  name: string;
  side: Side;
  lat: number;
  lon: number;
}

export interface Venue {
  id: string;
  name: string;
  area: string;
  lat: number;
  lon: number;
  vegetarian: boolean;
  vegan: boolean;
  avgSpendTry: number;
  opens: string;
  closes: string;
  outdoor: boolean;
  /** Transit minutes from each district, in DISTRICT_ORDER. */
  minutes: number[];
}

export interface Participant {
  name: string;
  district: DistrictId;
  diet: Diet;
  budgetTry: number;
  earliest: string;
}

export interface Group {
  id: string;
  title: string;
  city: string;
  dateLabel: string;
  participants: Participant[];
}

export const DISTRICTS: District[] = [
  { id: "kadikoy", name: "Kadıköy", side: "Asia", lat: 40.9903, lon: 29.029 },
  { id: "besiktas", name: "Beşiktaş", side: "Europe", lat: 41.0422, lon: 29.0067 },
  { id: "bakirkoy", name: "Bakırköy", side: "Europe", lat: 40.9805, lon: 28.8722 },
  { id: "atasehir", name: "Ataşehir", side: "Asia", lat: 40.9923, lon: 29.1244 },
  { id: "uskudar", name: "Üsküdar", side: "Asia", lat: 41.0253, lon: 29.0152 },
  { id: "sisli", name: "Şişli", side: "Europe", lat: 41.0602, lon: 28.9877 },
  { id: "fatih", name: "Fatih", side: "Europe", lat: 41.0186, lon: 28.9397 },
  { id: "beyoglu", name: "Beyoğlu", side: "Europe", lat: 41.0369, lon: 28.9773 },
  { id: "maltepe", name: "Maltepe", side: "Asia", lat: 40.9357, lon: 29.1306 },
  { id: "sariyer", name: "Sarıyer", side: "Europe", lat: 41.1674, lon: 29.0503 },
];

export const VENUES: Venue[] = [
  { id: "harem-sahil", name: "Harem Sahil Çay Bahçesi", area: "Harem, Üsküdar", lat: 41.005, lon: 29.0105, vegetarian: true, vegan: false, avgSpendTry: 160, opens: "07:00", closes: "00:00", outdoor: true, minutes: [18, 32, 74, 30, 10, 42, 45, 38, 28, 55] },
  { id: "yenikapi-avlu", name: "Yenikapı Avlu Mutfak", area: "Yenikapı, Fatih", lat: 41.0037, lon: 28.951, vegetarian: true, vegan: true, avgSpendTry: 360, opens: "11:00", closes: "00:00", outdoor: false, minutes: [30, 35, 20, 38, 26, 30, 12, 22, 40, 52] },
  { id: "moda-sahne", name: "Moda Sahne Kafe", area: "Moda, Kadıköy", lat: 40.9842, lon: 29.0255, vegetarian: true, vegan: true, avgSpendTry: 380, opens: "10:00", closes: "01:00", outdoor: false, minutes: [8, 40, 62, 28, 20, 45, 40, 35, 25, 60] },
  { id: "galata-kuyu", name: "Galata Kuyu Meyhanesi", area: "Karaköy, Beyoğlu", lat: 41.0256, lon: 28.9741, vegetarian: true, vegan: false, avgSpendTry: 650, opens: "17:00", closes: "02:00", outdoor: false, minutes: [32, 18, 40, 48, 28, 20, 18, 8, 50, 40] },
  { id: "sirkeci-gar", name: "Sirkeci Gar Lokantası", area: "Sirkeci, Fatih", lat: 41.0145, lon: 28.977, vegetarian: false, vegan: false, avgSpendTry: 340, opens: "11:00", closes: "22:00", outdoor: false, minutes: [28, 30, 26, 36, 20, 30, 8, 15, 38, 48] },
  { id: "carsi-durum", name: "Çarşı Dürüm Evi", area: "Çarşı, Beşiktaş", lat: 41.043, lon: 29.005, vegetarian: false, vegan: false, avgSpendTry: 220, opens: "10:00", closes: "03:00", outdoor: false, minutes: [35, 6, 48, 45, 25, 18, 30, 20, 52, 30] },
  { id: "kozyatagi-bowl", name: "Kozyatağı Bowl House", area: "Kozyatağı, Ataşehir", lat: 40.976, lon: 29.096, vegetarian: true, vegan: true, avgSpendTry: 340, opens: "09:00", closes: "22:00", outdoor: false, minutes: [18, 55, 68, 10, 28, 50, 50, 45, 15, 65] },
  { id: "sisli-bahce", name: "Şişli Kapalı Bahçe", area: "Bomonti, Şişli", lat: 41.0602, lon: 28.9877, vegetarian: true, vegan: false, avgSpendTry: 520, opens: "12:00", closes: "01:00", outdoor: true, minutes: [40, 18, 42, 50, 35, 6, 28, 18, 55, 30] },
  { id: "altunizade-firin", name: "Altunizade Fırın Mutfak", area: "Altunizade, Üsküdar", lat: 41.0215, lon: 29.044, vegetarian: true, vegan: true, avgSpendTry: 290, opens: "07:00", closes: "21:00", outdoor: false, minutes: [15, 22, 36, 18, 8, 28, 30, 26, 26, 40] },
  { id: "bagdat-avlu", name: "Bağdat Avlu", area: "Suadiye, Kadıköy", lat: 40.964, lon: 29.079, vegetarian: true, vegan: false, avgSpendTry: 450, opens: "09:00", closes: "00:00", outdoor: true, minutes: [15, 50, 70, 15, 30, 55, 52, 48, 10, 70] },
];

export const GROUPS: Group[] = [
  {
    id: "friday-supper",
    title: "Friday supper",
    city: "Istanbul",
    dateLabel: "Fri 4 Dec 2026",
    participants: [
      { name: "Emre", district: "besiktas", diet: "any", budgetTry: 600, earliest: "19:30" },
      { name: "Selin", district: "bakirkoy", diet: "any", budgetTry: 450, earliest: "19:00" },
      { name: "Arda", district: "atasehir", diet: "any", budgetTry: 500, earliest: "20:00" },
      { name: "Deniz", district: "kadikoy", diet: "vegetarian", budgetTry: 400, earliest: "19:00" },
    ],
  },
  {
    id: "sunday-brunch",
    title: "Sunday brunch",
    city: "Istanbul",
    dateLabel: "Sun 6 Dec 2026",
    participants: [
      { name: "Zeynep", district: "sariyer", diet: "vegan", budgetTry: 450, earliest: "11:00" },
      { name: "Kerem", district: "maltepe", diet: "any", budgetTry: 400, earliest: "10:30" },
      { name: "Ece", district: "beyoglu", diet: "vegetarian", budgetTry: 500, earliest: "11:30" },
      { name: "Burak", district: "uskudar", diet: "any", budgetTry: 350, earliest: "10:00" },
      { name: "Lale", district: "fatih", diet: "any", budgetTry: 600, earliest: "11:00" },
    ],
  },
];

/** The open invite a newcomer joins: Friday supper before Deniz joined. */
export const OPEN_INVITE: Group = {
  ...GROUPS[0],
  id: "friday-invite",
  participants: GROUPS[0].participants.filter((p) => p.name !== "Deniz"),
};

/** The sentence the demo types into the agent box. */
export const SAMPLE_SENTENCE = "I'm in Kadıköy, vegetarian, can't leave before 19:00, 400 lira a head max";

export const TIME_OPTIONS = ["18:30", "19:00", "19:30", "20:00", "20:30", "21:00"];
export const BUDGET_OPTIONS = [250, 300, 400, 500, 700];

export function getGroup(id: string): Group | undefined {
  return GROUPS.find((g) => g.id === id);
}

export function getDistrict(id: DistrictId): District {
  return DISTRICTS.find((d) => d.id === id) ?? DISTRICTS[0];
}
