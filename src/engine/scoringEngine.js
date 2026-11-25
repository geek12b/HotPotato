import { GAME_CONFIG } from "../config/gameConfig.js";

export class TimeWeightedScoringStrategy {
  constructor({
    baselineInactiveSeconds = GAME_CONFIG.baselineInactiveSeconds,
    epsilon = GAME_CONFIG.weightEpsilon
  } = {}) {
    this.baselineInactiveSeconds = baselineInactiveSeconds;
    this.epsilon = epsilon;
  }

  calculateRound({ teamIds, teamSeconds, buzzerTeamId }) {
    const teamCount = teamIds.length;
    const poolTotal = teamCount;

    const weights = {};
    let weightSum = 0;

    for (const teamId of teamIds) {
      const sec = Math.max(0, Number(teamSeconds[teamId] ?? 0));
      const effectiveSec = sec > 0 ? sec : this.baselineInactiveSeconds;
      const w = 1 / (effectiveSec + this.epsilon);
      weights[teamId] = w;
      weightSum += w;
    }

    const baseScores = {};
    let minBase = Infinity;

    for (const teamId of teamIds) {
      const base =
        weightSum > 0 ? poolTotal * (weights[teamId] / weightSum) : poolTotal / teamCount;
      baseScores[teamId] = base;
      if (base < minBase) {
        minBase = base;
      }
    }

    if (!Number.isFinite(minBase)) {
      minBase = 0;
    }

    const teams = {};
    for (const teamId of teamIds) {
      const base = baseScores[teamId];
      const isBuzzerLoser = Number(teamId) === Number(buzzerTeamId);
      const penalty = isBuzzerLoser ? -minBase : 0;
      const roundScore = base + penalty;

      teams[teamId] = {
        teamId,
        secondsSpent: Number((teamSeconds[teamId] ?? 0).toFixed(1)),
        baseScore: Number(base.toFixed(2)),
        penalty: Number(penalty.toFixed(2)),
        roundScore: Number(roundScore.toFixed(2)),
        isBuzzerLoser
      };
    }

    return {
      poolTotal,
      minBasePenalty: Number((-minBase).toFixed(2)),
      buzzerTeamId,
      teams
    };
  }
}
