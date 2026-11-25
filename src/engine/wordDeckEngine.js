import { GAME_CONFIG } from "../config/gameConfig.js";

function createDateTimeSeed(matchSalt = 0) {
  const now = new Date();
  // Mix epoch milliseconds with calendar/clock fields and match salt into a 32-bit unsigned seed
  const clockMix =
    (now.getFullYear() * 10000 +
      (now.getMonth() + 1) * 100 +
      now.getDate()) ^
    (now.getHours() * 3600000 +
      now.getMinutes() * 60000 +
      now.getSeconds() * 1000 +
      now.getMilliseconds());

  const combined =
    (Date.now() ^ Math.imul(clockMix, 2654435761) ^ Math.imul(matchSalt + 1, 2246822519)) >>> 0;
  return combined === 0 ? 0x9e3779b9 : combined;
}

function createMulberry32(seed) {
  let state = seed >>> 0;
  return function nextRandom() {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export class WordDeckEngine {
  constructor(words = []) {
    this.allWords = Array.isArray(words) ? words : [];
    this.usedIds = new Set();
    this.matchCounter = 0;
    this.rng = createMulberry32(createDateTimeSeed(0));
  }

  resetMatch() {
    this.usedIds.clear();
    this.matchCounter += 1;
    const seed = createDateTimeSeed(this.matchCounter);
    this.rng = createMulberry32(seed);
  }

  getFilteredPool(category, difficulty) {
    return this.allWords.filter((item) => {
      const okCat =
        !category || category === GAME_CONFIG.allCategoriesLabel || item.category === category;
      const okDiff =
        !difficulty || difficulty === GAME_CONFIG.randomDifficultyLabel || item.difficulty === difficulty;
      return okCat && okDiff;
    });
  }

  drawNextWord(category, difficulty) {
    let pool = this.getFilteredPool(category, difficulty);
    if (pool.length === 0) {
      pool = this.allWords;
    }

    let unused = pool.filter((w) => !this.usedIds.has(w.id));
    if (unused.length === 0) {
      for (const w of pool) {
        this.usedIds.delete(w.id);
      }
      unused = pool;
    }

    const index = Math.floor(this.rng() * unused.length);
    const chosen = unused[index];
    this.usedIds.add(chosen.id);
    return chosen;
  }
}
