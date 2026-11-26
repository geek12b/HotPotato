import { GAME_CONFIG } from "../config/gameConfig.js";

export function renderSetupView(container, settings, onChange, onStartClick) {
  const evenCounts = [];
  for (let n = GAME_CONFIG.minPlayers; n <= GAME_CONFIG.maxPlayers; n += 2) {
    evenCounts.push(n);
  }

  const categories = [GAME_CONFIG.allCategoriesLabel, ...GAME_CONFIG.categories];
  const difficulties = [GAME_CONFIG.randomDifficultyLabel, ...GAME_CONFIG.difficulties];
  const playerNames = Array.from(
    { length: settings.playerCount },
    (_, idx) => settings.playerNames?.[idx] ?? ""
  );

  const nameInputsHtml = playerNames
    .map((nameVal, idx) => {
      const seatNum = idx + 1;
      return `
        <div class="name-input-item">
          <label for="playerName_${seatNum}">صندلی ${seatNum}</label>
          <input
            id="playerName_${seatNum}"
            data-seat-index="${idx}"
            type="text"
            maxlength="24"
            class="input-control player-name-input"
            placeholder="نفر ${seatNum}"
            value="${nameVal.replace(/"/g, "&quot;")}"
          />
        </div>
      `;
    })
    .join("");

  container.innerHTML = `
    <section class="card">
      <div class="card-header">
        <h2>تنظیمات بازی</h2>
        <p class="muted">تعداد بازیکنان زوج (۴ تا ۲۰)، اسامی دلخواه، زمان راند، دسته و سختی را تنظیم کنید.</p>
      </div>

      <div class="form-grid">
        <div class="form-group">
          <label for="playerCountSelect">تعداد بازیکنان</label>
          <select id="playerCountSelect" class="input-control">
            ${evenCounts
              .map(
                (n) =>
                  `<option value="${n}" ${n === settings.playerCount ? "selected" : ""}>${n} نفر (${n / 2} تیم)</option>`
              )
              .join("")}
          </select>
        </div>

        <div class="form-group">
          <label for="roundCountInput">تعداد راندها</label>
          <input
            id="roundCountInput"
            type="number"
            class="input-control"
            min="${GAME_CONFIG.minRounds}"
            max="${GAME_CONFIG.maxRounds}"
            value="${settings.totalRounds}"
          />
        </div>

        <div class="form-group">
          <label for="durationMinInput">زمان هر راند (دقیقه)</label>
          <input
            id="durationMinInput"
            type="number"
            step="0.5"
            class="input-control"
            min="${GAME_CONFIG.minMinutes}"
            max="${GAME_CONFIG.maxMinutes}"
            value="${settings.durationMinutes}"
          />
        </div>

        <div class="form-group">
          <label for="categorySelect">دسته‌بندی کلمات</label>
          <select id="categorySelect" class="input-control">
            ${categories
              .map(
                (c) =>
                  `<option value="${c}" ${c === settings.category ? "selected" : ""}>${c}</option>`
              )
              .join("")}
          </select>
        </div>

        <div class="form-group full-span">
          <label for="difficultySelect">سطح سختی</label>
          <select id="difficultySelect" class="input-control">
            ${difficulties
              .map(
                (d) =>
                  `<option value="${d}" ${d === settings.difficulty ? "selected" : ""}>${d}</option>`
              )
              .join("")}
          </select>
        </div>

        <div class="form-group full-span">
          <label>نام بازیکنان (اختیاری — در صورت خالی بودن از «نفر ۱...» استفاده می‌شود)</label>
          <div class="names-grid">
            ${nameInputsHtml}
          </div>
        </div>
      </div>

      <div class="actions-row">
        <button id="startGameBtn" type="button" class="btn btn-primary btn-lg">
          شروع بازی
        </button>
      </div>
      <p id="setupStatus" class="status-note"></p>
    </section>
  `;

  const readCurrent = () => {
    const count = Number(container.querySelector("#playerCountSelect").value);
    const updatedNames = Array.from({ length: count }, (_, idx) => {
      const inputEl = container.querySelector(`#playerName_${idx + 1}`);
      return inputEl ? inputEl.value : (settings.playerNames?.[idx] ?? "");
    });

    return {
      playerCount: count,
      totalRounds: Math.max(
        GAME_CONFIG.minRounds,
        Math.min(
          GAME_CONFIG.maxRounds,
          Number(container.querySelector("#roundCountInput").value) || GAME_CONFIG.defaultRounds
        )
      ),
      durationMinutes: Math.max(
        GAME_CONFIG.minMinutes,
        Math.min(
          GAME_CONFIG.maxMinutes,
          Number(container.querySelector("#durationMinInput").value) || GAME_CONFIG.defaultMinutes
        )
      ),
      category: container.querySelector("#categorySelect").value,
      difficulty: container.querySelector("#difficultySelect").value,
      playerNames: updatedNames
    };
  };

  for (const id of [
    "#playerCountSelect",
    "#roundCountInput",
    "#durationMinInput",
    "#categorySelect",
    "#difficultySelect"
  ]) {
    container.querySelector(id).addEventListener("change", () => onChange(readCurrent()));
  }

  for (const nameInput of container.querySelectorAll(".player-name-input")) {
    nameInput.addEventListener("change", () => onChange(readCurrent()));
  }

  container.querySelector("#startGameBtn").addEventListener("click", () => {
    const current = readCurrent();
    onChange(current);
    onStartClick(current);
  });
}
