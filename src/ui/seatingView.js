export function renderSeatingView(container, seats, activeSeatNumber = null) {
  const total = seats.length;
  const size = 290;
  const center = size / 2;
  const radius = 112;

  const nodes = seats
    .map((seat, idx) => {
      const angle = (idx / total) * Math.PI * 2 - Math.PI / 2;
      const x = center + radius * Math.cos(angle);
      const y = center + radius * Math.sin(angle);
      const activeClass = seat.seatNumber === activeSeatNumber ? "is-active" : "";

      return `
        <div
          class="circle-node ${activeClass}"
          style="left:${x.toFixed(1)}px; top:${y.toFixed(1)}px; border-color:${seat.colorHex}; background:${seat.colorSoft};"
          title="${seat.playerName} (${seat.teamNameFa})"
        >
          <span class="seat-num">${seat.seatNumber}</span>
          <span class="seat-name" style="color:${seat.colorHex};">${seat.playerName}</span>
        </div>
      `;
    })
    .join("");

  const teamCount = total / 2;
  const legend = [];
  for (let t = 1; t <= teamCount; t++) {
    const pair = seats.filter((s) => s.teamId === t);
    const hex = pair[0]?.colorHex || "#38bdf8";
    const text = pair.map((s) => `${s.playerName} (#${s.seatNumber})`).join(" ↔ ");
    legend.push(`
      <span class="team-chip" style="border-color:${hex};">
        <span class="dot" style="background:${hex};"></span>
        <span>تیم ${t}: ${text}</span>
      </span>
    `);
  }

  container.innerHTML = `
    <section class="card">
      <div class="card-header">
        <h3>چیدمان دایره‌ای (${total} نفر — ${teamCount} تیم)</h3>
        <p class="muted">هم‌تیمی‌ها هم‌رنگ و روبه‌روی هم قرار می‌گیرند.</p>
      </div>
      <div class="circle-stage" style="width:${size}px; height:${size}px;">
        <div class="circle-ring"></div>
        ${nodes}
      </div>
      <div class="team-legend">${legend.join("")}</div>
    </section>
  `;
}
