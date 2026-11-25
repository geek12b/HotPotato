import { GAME_CONFIG } from "../config/gameConfig.js";
import { getNextSeatNumber } from "../engine/seatingEngine.js";

export function formatClock(seconds) {
  const safe = Math.max(0, Math.ceil(seconds));
  const mins = Math.floor(safe / 60);
  const secs = safe % 60;
  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

export function renderTurnView(container, viewState, callbacks) {
  const {
    currentRound,
    totalRounds,
    seats,
    activeSeatNumber,
    wordRevealed,
    currentWord,
    remainingSeconds,
    isPaused,
    teamSeconds,
    roundExpired
  } = viewState;

  const activeSeat = seats.find((s) => s.seatNumber === activeSeatNumber) || seats[0];
  const partnerSeat = seats.find((s) => s.seatNumber === activeSeat.partnerSeat);
  const nextSeatNum = getNextSeatNumber(activeSeat.seatNumber, seats.length);
  const nextSeat = seats.find((s) => s.seatNumber === nextSeatNum);
  const isUrgent = remainingSeconds <= GAME_CONFIG.urgentSecondsThreshold;
  const hasMoreRounds = currentRound < totalRounds;

  const teamTimesHtml = Object.entries(teamSeconds || {})
    .map(
      ([tId, sec]) =>
        `<span class="time-pill">تیم ${tId}: <strong>${Number(sec).toFixed(1)}s</strong></span>`
    )
    .join("");

  container.innerHTML = `
    <section class="card turn-card" style="border-top: 4px solid ${activeSeat.colorHex};">
      <div class="turn-topbar">
        <span class="badge">راند ${currentRound} از ${totalRounds}</span>
        <div class="timer-box ${isUrgent ? "is-urgent" : ""}">
          <span class="timer-label">زمان باقیمانده</span>
          <strong id="liveClock" class="timer-digits">${formatClock(remainingSeconds)}</strong>
        </div>
        <button id="pauseRoundBtn" type="button" class="btn btn-ghost btn-sm" ${roundExpired ? "disabled" : ""}>
          ${isPaused ? "ادامه" : "توقف موقت"}
        </button>
      </div>

      <div class="seat-banner" style="background:${activeSeat.colorSoft}; border-color:${activeSeat.colorHex};">
        <div class="seat-title">نوبت ${activeSeat.playerName} (صندلی ${activeSeat.seatNumber})</div>
        <div class="seat-sub" style="color:${activeSeat.colorHex};">
          ${activeSeat.teamNameFa} • هم‌تیمی روبه‌رو: ${partnerSeat ? partnerSeat.playerName : `نفر ${activeSeat.partnerSeat}`}
        </div>
      </div>

      ${
        roundExpired
          ? `
            <div class="expired-box">
              <div class="expired-title">راند ${currentRound} تمام شد!</div>
              <p class="muted">
                گوشی در دست <strong>${activeSeat.playerName}</strong> (${activeSeat.teamNameFa}) بود.
                امتیازدهی کامل و جدول راند در <strong>مرحله ۴</strong> اضافه می‌شود.
              </p>
              <div class="actions-row">
                ${
                  hasMoreRounds
                    ? `<button id="nextRoundBtn" type="button" class="btn btn-primary btn-lg">شروع راند ${currentRound + 1}</button>`
                    : `<button id="newMatchBtn" type="button" class="btn btn-success btn-lg">شروع بازی جدید (راند ۱)</button>`
                }
                <button id="backSetupBtn" type="button" class="btn btn-ghost">بازگشت به تنظیمات</button>
              </div>
            </div>
          `
          : !wordRevealed
          ? `
            <div class="handoff-box">
              <p class="handoff-note">
                گوشی را به <strong>${activeSeat.playerName}</strong> بدهید. وقتی آماده شدید دکمه زیر را بزنید.
              </p>
              <button id="readyBtn" type="button" class="btn btn-primary btn-xl" ${isPaused ? "disabled" : ""}>
                آماده ام
              </button>
            </div>
          `
          : `
            <div class="word-stage">
              <div class="word-meta">
                <span class="pill">${currentWord?.category || ""}</span>
                <span class="pill">${currentWord?.difficulty || ""}</span>
              </div>
              <div class="secret-word">${currentWord?.word || ""}</div>
              <p class="rule-hint">فقط با صحبت توضیح بده — خود کلمه، هم‌ریشه یا قافیه ممنوع است!</p>
              <button id="correctBtn" type="button" class="btn btn-success btn-xl" ${isPaused ? "disabled" : ""}>
                صحیح (ارسال به ${nextSeat?.playerName || `نفر ${nextSeatNum}`})
              </button>
            </div>
          `
      }

      <div class="team-timers-bar">${teamTimesHtml}</div>
    </section>
  `;

  container.querySelector("#pauseRoundBtn")?.addEventListener("click", () => callbacks.onTogglePause());
  container.querySelector("#readyBtn")?.addEventListener("click", () => callbacks.onRevealWord());
  container.querySelector("#correctBtn")?.addEventListener("click", () => callbacks.onMarkCorrect());
  container.querySelector("#nextRoundBtn")?.addEventListener("click", () => callbacks.onStartNextRound());
  container.querySelector("#newMatchBtn")?.addEventListener("click", () => callbacks.onRestartMatch());
  container.querySelector("#backSetupBtn")?.addEventListener("click", () => callbacks.onBackToSetup());
}

export function updateTurnClockOnly(container, remainingSeconds, teamSeconds = null) {
  const clockEl = container.querySelector("#liveClock");
  const timerBox = container.querySelector(".timer-box");
  if (clockEl) {
    clockEl.textContent = formatClock(remainingSeconds);
  }
  if (timerBox) {
    timerBox.classList.toggle("is-urgent", remainingSeconds <= GAME_CONFIG.urgentSecondsThreshold);
  }
  if (teamSeconds) {
    const bar = container.querySelector(".team-timers-bar");
    if (bar) {
      bar.innerHTML = Object.entries(teamSeconds)
        .map(
          ([tId, sec]) =>
            `<span class="time-pill">تیم ${tId}: <strong>${Number(sec).toFixed(1)}s</strong></span>`
        )
        .join("");
    }
  }
}
