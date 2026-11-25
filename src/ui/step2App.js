import { GAME_CONFIG } from "../config/gameConfig.js";
import { buildCircleSeating } from "../engine/seatingEngine.js";
import { renderSetupView } from "./setupView.js";
import { renderSeatingView } from "./seatingView.js";

let settings = {
  playerCount: GAME_CONFIG.defaultPlayers,
  totalRounds: GAME_CONFIG.defaultRounds,
  durationMinutes: GAME_CONFIG.defaultMinutes,
  category: GAME_CONFIG.allCategoriesLabel,
  difficulty: GAME_CONFIG.randomDifficultyLabel,
  playerNames: Array.from({ length: GAME_CONFIG.defaultPlayers }, () => "")
};

const setupStage = document.getElementById("setupStage");
const seatingStage = document.getElementById("seatingStage");

function refresh() {
  const seats = buildCircleSeating(settings.playerCount, settings.playerNames);
  renderSetupView(
    setupStage,
    settings,
    (next) => {
      settings = next;
      refresh();
    },
    (current) => {
      const activeSeats = buildCircleSeating(current.playerCount, current.playerNames);
      const rosterSummary = activeSeats.map((s) => `#${s.seatNumber}: ${s.playerName}`).join("، ");
      const status = setupStage.querySelector("#setupStatus");
      if (status) {
        status.textContent = `تنظیمات تایید شد (${current.playerCount} نفر): ${rosterSummary}. (گیم‌پلی راند در مرحله ۳ اضافه می‌شود)`;
      }
    }
  );
  renderSeatingView(seatingStage, seats);
}

refresh();
