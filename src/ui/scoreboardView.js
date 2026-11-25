export function renderScoreboardView(container, state, callbacks) {
  const { currentRound, settings, lastRoundSummary, cumulativeScores, isMatchFinished, seats } = state;
  const teamCount = settings.playerCount / 2;

  const rows = [];
  for (let t = 1; t <= teamCount; t++) {
    const r = lastRoundSummary?.teams?.[t] || {
      secondsSpent: 0,
      baseScore: 0,
      penalty: 0,
      roundScore: 0,
      isBuzzerLoser: false
    };
    const totalScore = Number((cumulativeScores[t] ?? 0).toFixed(2));
    const teamSeats = (seats || []).filter((s) => s.teamId === t);
    const colorHex = teamSeats[0]?.colorHex || "#38bdf8";
    const memberNames = teamSeats.map((s) => `${s.playerName} (#${s.seatNumber})`).join(" و ");
    rows.push({ teamId: t, totalScore, colorHex, memberNames, ...r });
  }

  rows.sort((a, b) => b.totalScore - a.totalScore);
  const leader = rows[0];
  const maxPositive = Math.max(0, ...rows.map((r) => r.totalScore));

  const winnerModalHtml =
    isMatchFinished && leader
      ? `
      <div id="winnerSpotlightOverlay" class="winner-overlay" role="dialog" aria-modal="true" aria-label="تیم برنده مسابقه">
        <canvas id="winnerFireworkCanvas" class="firework-canvas"></canvas>
        <div class="winner-circle-card" style="border-color:${leader.colorHex}; box-shadow: 0 0 40px ${leader.colorHex}44;">
          <div class="winner-crown">🏆 قهرمان سیب‌زمینی داغ</div>
          <div class="winner-circle-ring" style="border-color:${leader.colorHex}; background:${leader.colorHex}1f;">
            <div class="winner-team-name" style="color:${leader.colorHex};">تیم ${leader.teamId}</div>
            <div class="winner-players">${leader.memberNames || `اعضای تیم ${leader.teamId}`}</div>
            <div class="winner-score-badge">امتیاز کل: <strong>${leader.totalScore}</strong></div>
          </div>
          <button id="closeWinnerModalBtn" type="button" class="btn btn-primary btn-lg">
            مشاهده جدول کامل امتیازات
          </button>
        </div>
      </div>
    `
      : "";

  const progressBarsHtml = rows
    .map((row) => {
      const pct =
        maxPositive > 0 && row.totalScore > 0
          ? Math.max(4, Math.min(100, Math.round((row.totalScore / maxPositive) * 100)))
          : 0;
      const isNeg = row.totalScore < 0;

      return `
        <div class="progress-row">
          <div class="progress-meta">
            <span class="progress-team">
              <span class="dot" style="background:${row.colorHex};"></span>
              <strong>تیم ${row.teamId}</strong>
              <span class="muted-inline">(${row.memberNames})</span>
              ${row.isBuzzerLoser ? `<span class="tag-danger">بازنده راند</span>` : ""}
            </span>
            <span class="progress-val ${isNeg ? "neg" : ""}">${row.totalScore} (${pct}%)</span>
          </div>
          <div class="progress-track">
            <div
              class="progress-fill ${isNeg ? "is-negative" : ""}"
              style="width:${pct}%; background:${isNeg ? "#ef4444" : row.colorHex};"
            ></div>
          </div>
        </div>
      `;
    })
    .join("");

  const rowsHtml = rows
    .map(
      (row, idx) => `
      <tr class="${row.isBuzzerLoser ? "row-loser" : ""}">
        <td>#${idx + 1}</td>
        <td>
          <strong>تیم ${row.teamId}</strong>
          <div class="table-sub-names">${row.memberNames}</div>
          ${row.isBuzzerLoser ? `<span class="tag-danger">بازنده راند</span>` : ""}
        </td>
        <td>${row.secondsSpent}s</td>
        <td>${row.baseScore}</td>
        <td class="${row.penalty < 0 ? "neg" : ""}">${row.penalty}</td>
        <td class="${row.roundScore < 0 ? "neg" : "pos"}">
          ${row.roundScore > 0 ? `+${row.roundScore}` : row.roundScore}
        </td>
        <td><strong>${row.totalScore}</strong></td>
      </tr>
    `
    )
    .join("");

  container.innerHTML = `
    ${winnerModalHtml}
    <section class="card score-card">
      <div class="card-header">
        <h2>${isMatchFinished ? "پایان مسابقه — جدول نهایی" : `راند ${currentRound} تمام شد!`}</h2>
        ${
          lastRoundSummary?.buzzerTeamId
            ? `<p class="buzzer-alert">
                تیم ${lastRoundSummary.buzzerTeamId} هنگام زنگ پایان راند گوشی را در دست داشت و جریمه
                <strong>${lastRoundSummary.minBasePenalty}</strong> دریافت کرد.
              </p>`
            : ""
        }
        ${
          isMatchFinished && leader
            ? `<p class="winner-banner">
                تیم برتر مسابقه: <strong>تیم ${leader.teamId}</strong> (${leader.memberNames}) با امتیاز
                <strong>${leader.totalScore}</strong>!
              </p>`
            : ""
        }
      </div>

      <div class="progress-section">
        <div class="progress-heading">نمودار امتیاز کل همه راندها</div>
        <div class="progress-list">
          ${progressBarsHtml}
        </div>
      </div>

      <div class="table-wrap">
        <table class="score-table">
          <thead>
            <tr>
              <th>رتبه</th>
              <th>تیم</th>
              <th>زمان</th>
              <th>سهم پایه</th>
              <th>جریمه</th>
              <th>امتیاز راند</th>
              <th>مجموع کل</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml}
          </tbody>
        </table>
      </div>

      <div class="actions-row">
        ${
          !isMatchFinished
            ? `<button id="nextRoundBtn" type="button" class="btn btn-primary btn-lg">
                شروع راند بعدی (راند ${currentRound + 1})
              </button>`
            : `<button id="playAgainBtn" type="button" class="btn btn-success btn-lg">
                بازی مجدد
              </button>`
        }
        <button id="backSetupBtn" type="button" class="btn btn-ghost">بازگشت به تنظیمات</button>
      </div>
    </section>
  `;

  if (isMatchFinished && leader) {
    startShortFireworkBurst(container.querySelector("#winnerFireworkCanvas"), leader.colorHex, 2400);
    const overlay = container.querySelector("#winnerSpotlightOverlay");
    container.querySelector("#closeWinnerModalBtn")?.addEventListener("click", () => {
      overlay?.remove();
    });
  }

  container.querySelector("#nextRoundBtn")?.addEventListener("click", () => callbacks.onStartNextRound());
  container.querySelector("#playAgainBtn")?.addEventListener("click", () => callbacks.onRestartMatch());
  container.querySelector("#backSetupBtn")?.addEventListener("click", () => callbacks.onBackToSetup());
}

function startShortFireworkBurst(canvas, accentHex, durationMs = 2400) {
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const rect = canvas.getBoundingClientRect();
  const width = Math.max(300, Math.floor(rect.width || window.innerWidth));
  const height = Math.max(300, Math.floor(rect.height || window.innerHeight));
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = width * dpr;
  canvas.height = height * dpr;
  ctx.scale(dpr, dpr);

  const colors = [accentHex, "#fbbf24", "#f472b6", "#34d399", "#a78bfa", "#ffffff"];
  const particles = [];

  function spawnBurst(cx, cy, count = 34) {
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.25;
      const speed = 1.6 + Math.random() * 4.2;
      particles.push({
        x: cx,
        y: cy,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        alpha: 1,
        radius: 2 + Math.random() * 2.5,
        color: colors[i % colors.length]
      });
    }
  }

  spawnBurst(width * 0.5, height * 0.36, 40);
  const t2 = setTimeout(() => spawnBurst(width * 0.28, height * 0.28, 28), 450);
  const t3 = setTimeout(() => spawnBurst(width * 0.72, height * 0.30, 28), 900);

  const startTime = performance.now();
  let rafId = null;

  function frame(now) {
    const elapsed = now - startTime;
    ctx.clearRect(0, 0, width, height);

    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.06; // light gravity
      p.alpha = Math.max(0, 1 - elapsed / durationMs);

      if (p.alpha <= 0) {
        particles.splice(i, 1);
        continue;
      }

      ctx.save();
      ctx.globalAlpha = p.alpha;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fillStyle = p.color;
      ctx.fill();
      ctx.restore();
    }

    if (elapsed < durationMs) {
      rafId = requestAnimationFrame(frame);
    } else {
      ctx.clearRect(0, 0, width, height);
    }
  }

  rafId = requestAnimationFrame(frame);

  const cleanupTimer = setTimeout(() => {
    if (rafId !== null) cancelAnimationFrame(rafId);
    ctx.clearRect(0, 0, width, height);
  }, durationMs + 60);

  canvas.addEventListener(
    "DOMNodeRemoved",
    () => {
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(cleanupTimer);
      if (rafId !== null) cancelAnimationFrame(rafId);
    },
    { once: true }
  );
}
