/** Short weekday labels aligned with DAYS (index 0 = Пн). */
export const SHORT = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"] as const;

/** КБЖУ activity bonus (extra kcal as carbs) per day index. */
export const KBJU_BONUS = [300, 0, 300, 250, 200, 250, 0] as const;

/** Why-label for the bonus, per day index. */
export const KBJU_BONUS_WHY = [
  "велозаезд 2.5ч", "", "велозаезд 2.5ч", "скейт 2ч", "бассейн", "бассейн 1.5ч", "",
] as const;

export const COMPLETION_LEVELS = [
  { value: 1 as const, label: "Полностью" },
  { value: 0.5 as const, label: "Половина" },
  { value: 0.25 as const, label: "Четверть" },
];
