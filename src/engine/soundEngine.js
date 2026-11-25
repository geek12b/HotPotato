export class SoundEngine {
  constructor(tracks = {}, options = {}) {
    this.tracks = {
      tick: tracks.tick || "./assets/sounds/tick.mp3",
      urgent: tracks.urgent || "./assets/sounds/urgent.mp3",
      buzzer: tracks.buzzer || "./assets/sounds/buzzer.mp3"
    };
    this.tickShare = options.tickShare ?? 0.8;
    this.lastTickSecond = null;

    this.ctx = null;
    this.buffers = { tick: null, urgent: null, buzzer: null };
    this.loadingPromises = {};
    this.activeSource = null;
    this.activeGain = null;
    this.activeKey = null;
    this.isPaused = false;
  }

  _ensureContext() {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return null;
    if (!this.ctx) {
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === "suspended") {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  async _loadBuffer(key) {
    if (this.buffers[key]) return this.buffers[key];
    if (this.loadingPromises[key]) return this.loadingPromises[key];

    const url = this.tracks[key];
    if (!url) return null;

    this.loadingPromises[key] = (async () => {
      try {
        const ctx = this._ensureContext();
        if (!ctx) return null;
        const resp = await fetch(url);
        if (!resp.ok) return null;
        const arrBuf = await resp.arrayBuffer();
        const decoded = await ctx.decodeAudioData(arrBuf);
        this.buffers[key] = decoded;
        return decoded;
      } catch (_) {
        return null;
      } finally {
        delete this.loadingPromises[key];
      }
    })();

    return this.loadingPromises[key];
  }

  unlock() {
    this._ensureContext();
    this._loadBuffer("tick");
    this._loadBuffer("urgent");
    this._loadBuffer("buzzer");
  }

  stopActive() {
    if (this.activeSource) {
      try {
        this.activeSource.stop(0);
        this.activeSource.disconnect();
      } catch (_) {
        // Ignore already-stopped source
      }
      this.activeSource = null;
    }
    if (this.activeGain) {
      try {
        this.activeGain.disconnect();
      } catch (_) {
        // Ignore
      }
      this.activeGain = null;
    }
    this.activeKey = null;
  }

  resetRoundAudio() {
    this.lastTickSecond = null;
    this.isPaused = false;
    this.stopActive();
  }

  setPaused(paused) {
    this.isPaused = Boolean(paused);
    if (!this.ctx) return;
    if (this.isPaused && this.ctx.state === "running") {
      this.ctx.suspend().catch(() => {});
    } else if (!this.isPaused && this.ctx.state === "suspended") {
      this.ctx.resume().catch(() => {});
    }
  }

  async _startBufferTrack(key, { volume = 1.0, loop = true } = {}) {
    if (this.isPaused) return;
    if (this.activeKey === key && this.activeSource) {
      if (this.activeGain && this.ctx) {
        this.activeGain.gain.setTargetAtTime(
          Math.min(1, Math.max(0, volume)),
          this.ctx.currentTime,
          0.03
        );
      }
      return;
    }

    const buffer = await this._loadBuffer(key);
    if (!buffer || this.isPaused) return;

    const ctx = this._ensureContext();
    if (!ctx) return;

    // Stop prior buffer track only once the new buffer is decoded and ready
    if (this.activeKey === key && this.activeSource) return;
    this.stopActive();

    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = loop;

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(Math.min(1, Math.max(0, volume)), ctx.currentTime);

    source.connect(gain);
    gain.connect(ctx.destination);

    source.onended = () => {
      if (this.activeSource === source) {
        this.activeSource = null;
        this.activeGain = null;
        this.activeKey = null;
      }
    };

    this.activeSource = source;
    this.activeGain = gain;
    this.activeKey = key;
    source.start(0);
  }

  _playFinalSecondAccent(remainingSeconds) {
    if (remainingSeconds > 2.2 || this.isPaused) return;
    try {
      const ctx = this._ensureContext();
      if (!ctx || ctx.state !== "running") return;
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(remainingSeconds <= 1.1 ? 920 : 740, ctx.currentTime);
      g.gain.setValueAtTime(0.14, ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.14);
      osc.connect(g);
      g.connect(ctx.destination);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.15);
    } catch (_) {
      // Ignore
    }
  }

  onTimerTick(remainingSeconds, totalDurationSeconds = 120) {
    if (this.isPaused) return;
    const wholeSec = Math.ceil(remainingSeconds);
    if (wholeSec <= 0 || wholeSec === this.lastTickSecond) return;
    this.lastTickSecond = wholeSec;

    const safeTotal = Math.max(1, Number(totalDurationSeconds) || 120);
    const rem = Math.max(0, Number(remainingSeconds) || 0);
    const urgentThresholdSec = safeTotal * (1 - this.tickShare);
    const ratioElapsed = 1 - Math.min(1, rem / safeTotal);

    if (rem <= urgentThresholdSec) {
      // Play urgent track cleanly from start through final seconds without seeking into tail silence
      this._startBufferTrack("urgent", { volume: 0.95, loop: true });
      this._playFinalSecondAccent(rem);
    } else {
      // Seamless sample-accurate loop of tick.mp3 for first 80% of round
      this._startBufferTrack("tick", {
        volume: Math.min(1, 0.55 + ratioElapsed * 0.35),
        loop: true
      });
    }
  }

  async playBuzzer() {
    this.isPaused = false;
    this.stopActive();

    const buffer = await this._loadBuffer("buzzer");
    const ctx = this._ensureContext();
    if (!buffer || !ctx) return;

    try {
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.loop = false;

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(1.0, ctx.currentTime);

      source.connect(gain);
      gain.connect(ctx.destination);
      source.start(0);
    } catch (_) {
      // Ignore
    }
  }
}
