export const GAME_CONFIG = Object.freeze({
  brandName: "HotPotato", // Internal reference
  brandTitleFa: "سیب‌زمینی داغ",
  brandTaglineFa: "توضیح بده، سریع رد کن و نذار سیب‌زمینی داغ تو دستت بترکه!",
  minPlayers: 4,
  maxPlayers: 20,
  defaultPlayers: 12,
  minRounds: 1,
  maxRounds: 20,
  defaultRounds: 10,
  defaultMinutes: 2,
  minMinutes: 0.5,
  maxMinutes: 15,
  urgentSecondsThreshold: 10,
  baselineInactiveSeconds: 18,
  weightEpsilon: 1.0,
  allCategoriesLabel: "همه دسته‌بندی‌ها",
  categories: Object.freeze([
    "خوراکی‌ها",
    "اشیاء",
    "شغل‌ها",
    "مکان‌ها",
    "حیوانات"
  ]),
  randomDifficultyLabel: "تصادفی",
  difficulties: Object.freeze([
    "آسان",
    "متوسط",
    "سخت"
  ]),
  teamPalette: Object.freeze([
    { id: 1, nameFa: "تیم ۱", hex: "#38bdf8", soft: "rgba(56, 189, 248, 0.16)" },
    { id: 2, nameFa: "تیم ۲", hex: "#f472b6", soft: "rgba(244, 114, 182, 0.16)" },
    { id: 3, nameFa: "تیم ۳", hex: "#34d399", soft: "rgba(52, 211, 153, 0.16)" },
    { id: 4, nameFa: "تیم ۴", hex: "#fbbf24", soft: "rgba(251, 191, 36, 0.16)" },
    { id: 5, nameFa: "تیم ۵", hex: "#a78bfa", soft: "rgba(167, 139, 250, 0.16)" },
    { id: 6, nameFa: "تیم ۶", hex: "#fb7185", soft: "rgba(251, 113, 133, 0.16)" },
    { id: 7, nameFa: "تیم ۷", hex: "#2dd4bf", soft: "rgba(45, 212, 191, 0.16)" },
    { id: 8, nameFa: "تیم ۸", hex: "#f97316", soft: "rgba(249, 115, 22, 0.16)" },
    { id: 9, nameFa: "تیم ۹", hex: "#818cf8", soft: "rgba(129, 140, 248, 0.16)" },
    { id: 10, nameFa: "تیم ۱۰", hex: "#a3e635", soft: "rgba(163, 230, 53, 0.16)" }
  ])
});
