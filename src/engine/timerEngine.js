export class RoundTimerEngine {
  constructor({ onTick, onExpire }) {
    this.onTick = onTick;
    this.onExpire = onExpire;
    this.intervalId = null;
    this.remainingSeconds = 0;
    this.isRunning = false;
    this.isPaused = false;
    this.activeTeamId = null;
    this.teamSeconds = {};
    this.lastTickMs = null;
  }

  startRound(durationSeconds, teamIds, initialActiveTeamId) {
    this.stop();
    this.remainingSeconds = Math.max(1, Number(durationSeconds));
    this.isRunning = true;
    this.isPaused = false;
    this.activeTeamId = initialActiveTeamId;
    this.teamSeconds = {};
    for (const id of teamIds) {
      this.teamSeconds[id] = 0;
    }
    this.lastTickMs = performance.now();

    this.intervalId = setInterval(() => this._step(), 100);
  }

  setActiveTeam(teamId) {
    this.activeTeamId = teamId;
  }

  togglePause() {
    if (!this.isRunning) return false;
    this.isPaused = !this.isPaused;
    this.lastTickMs = performance.now();
    return this.isPaused;
  }

  stop() {
    if (this.intervalId !== null) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.isRunning = false;
    this.isPaused = false;
  }

  _step() {
    if (!this.isRunning || this.isPaused) {
      this.lastTickMs = performance.now();
      return;
    }

    const now = performance.now();
    const elapsedSec = Math.max(0, (now - this.lastTickMs) / 1000);
    this.lastTickMs = now;

    if (
      this.activeTeamId != null &&
      Object.prototype.hasOwnProperty.call(this.teamSeconds, this.activeTeamId)
    ) {
      this.teamSeconds[this.activeTeamId] += elapsedSec;
    }

    this.remainingSeconds = Math.max(0, this.remainingSeconds - elapsedSec);

    if (this.onTick) {
      this.onTick({
        remainingSeconds: this.remainingSeconds,
        teamSeconds: { ...this.teamSeconds },
        activeTeamId: this.activeTeamId
      });
    }

    if (this.remainingSeconds <= 0) {
      const snapshot = { ...this.teamSeconds };
      const buzzerTeamId = this.activeTeamId;
      this.stop();
      if (this.onExpire) {
        this.onExpire({
          remainingSeconds: 0,
          teamSeconds: snapshot,
          buzzerTeamId
        });
      }
    }
  }
}
