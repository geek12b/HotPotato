import { GAME_CONFIG } from "../config/gameConfig.js";
import { buildCircleSeating, getNextSeatNumber } from "../engine/seatingEngine.js";
import { WordDeckEngine } from "../engine/wordDeckEngine.js";
import { RoundTimerEngine } from "../engine/timerEngine.js";
import { SoundEngine } from "../engine/soundEngine.js";
import { renderSetupView } from "./setupView.js";
import { renderSeatingView } from "./seatingView.js";
import { renderTurnView, updateTurnClockOnly } from "./turnView.js";

async function loadWords() {
  try {
    const res = await fetch("./words.json");
    if (!res.ok) throw new Error("words fetch failed");
    return await res.json();
  } catch (_) {
    return [
      { id: "fb-1", word: "پیتزا", category: "خوراکی‌ها", difficulty: "آسان" },
      { id: "fb-2", word: "مسواک", category: "اشیاء", difficulty: "آسان" }
    ];
  }
}

async function init() {
  const words = await loadWords();
  const deck = new WordDeckEngine(words);
  const sound = new SoundEngine();

  let state = {
    phase: "setup", // "setup" | "playing"
    settings: {
      playerCount: GAME_CONFIG.defaultPlayers,
      totalRounds: GAME_CONFIG.defaultRounds,
      durationMinutes: GAME_CONFIG.defaultMinutes,
      category: GAME_CONFIG.allCategoriesLabel,
      difficulty: GAME_CONFIG.randomDifficultyLabel,
      playerNames: Array.from({ length: GAME_CONFIG.defaultPlayers }, () => "")
    },
    seats: buildCircleSeating(GAME_CONFIG.defaultPlayers, []),
    currentRound: 1,
    activeSeatNumber: 1,
    wordRevealed: false,
    currentWord: null,
    remainingSeconds: GAME_CONFIG.defaultMinutes * 60,
    isPaused: false,
    roundExpired: false,
    teamSeconds: {}
  };

  const mainStage = document.getElementById("mainStage");
  const seatingStage = document.getElementById("seatingStage");

  const timer = new RoundTimerEngine({
    onTick: ({ remainingSeconds, teamSeconds }) => {
      state.remainingSeconds = remainingSeconds;
      state.teamSeconds = teamSeconds;
      updateTurnClockOnly(mainStage, remainingSeconds, teamSeconds);
      sound.onTimerTick(remainingSeconds, Math.round(state.settings.durationMinutes * 60));
    },
    onExpire: ({ teamSeconds }) => {
      state.remainingSeconds = 0;
      state.teamSeconds = teamSeconds;
      state.isPaused = false;
      state.wordRevealed = false;
      state.currentWord = null;
      state.roundExpired = true;
      sound.playBuzzer();
      render();
    }
  });

  function startRound(roundNum, startSeatNum = 1) {
    sound.unlock();
    sound.resetRoundAudio();

    const teamCount = state.settings.playerCount / 2;
    const teamIds = Array.from({ length: teamCount }, (_, i) => i + 1);
    const startSeat = state.seats.find((s) => s.seatNumber === startSeatNum) || state.seats[0];
    const durationSec = Math.round(state.settings.durationMinutes * 60);

    const initialTeamSeconds = {};
    for (const tId of teamIds) initialTeamSeconds[tId] = 0;

    state = {
      ...state,
      phase: "playing",
      currentRound: roundNum,
      activeSeatNumber: startSeat.seatNumber,
      wordRevealed: false,
      currentWord: null,
      remainingSeconds: durationSec,
      isPaused: false,
      roundExpired: false,
      teamSeconds: initialTeamSeconds
    };

    render();
    timer.startRound(durationSec, teamIds, startSeat.teamId);
  }

  function render() {
    if (state.phase === "setup") {
      renderSetupView(
        mainStage,
        state.settings,
        (nextSettings) => {
          state.settings = nextSettings;
          state.seats = buildCircleSeating(nextSettings.playerCount, nextSettings.playerNames);
          state.remainingSeconds = Math.round(nextSettings.durationMinutes * 60);
          render();
        },
        (currentSettings) => {
          state.settings = currentSettings;
          state.seats = buildCircleSeating(currentSettings.playerCount, currentSettings.playerNames);
          deck.resetMatch();
          startRound(1, 1);
        }
      );
      renderSeatingView(seatingStage, state.seats, null);
      return;
    }

    renderTurnView(mainStage, {
      currentRound: state.currentRound,
      totalRounds: state.settings.totalRounds,
      seats: state.seats,
      activeSeatNumber: state.activeSeatNumber,
      wordRevealed: state.wordRevealed,
      currentWord: state.currentWord,
      remainingSeconds: state.remainingSeconds,
      isPaused: state.isPaused,
      teamSeconds: state.teamSeconds,
      roundExpired: state.roundExpired
    }, {
      onTogglePause: () => {
        sound.unlock();
        state.isPaused = timer.togglePause();
        sound.setPaused(state.isPaused);
        render();
      },
      onRevealWord: () => {
        sound.unlock();
        state.currentWord = deck.drawNextWord(state.settings.category, state.settings.difficulty);
        state.wordRevealed = true;
        render();
      },
      onMarkCorrect: () => {
        sound.unlock();
        const nextSeatNum = getNextSeatNumber(state.activeSeatNumber, state.settings.playerCount);
        const nextSeat = state.seats.find((s) => s.seatNumber === nextSeatNum);
        if (nextSeat) {
          timer.setActiveTeam(nextSeat.teamId);
        }
        state.activeSeatNumber = nextSeatNum;
        state.wordRevealed = false;
        state.currentWord = null;
        render();
      },
      onStartNextRound: () => {
        const nextRound = Math.min(state.settings.totalRounds, state.currentRound + 1);
        const nextStarter = getNextSeatNumber(state.activeSeatNumber, state.settings.playerCount);
        startRound(nextRound, nextStarter);
      },
      onRestartMatch: () => {
        deck.resetMatch();
        startRound(1, 1);
      },
      onBackToSetup: () => {
        timer.stop();
        state.phase = "setup";
        state.roundExpired = false;
        state.wordRevealed = false;
        state.currentWord = null;
        render();
      }
    });

    renderSeatingView(seatingStage, state.seats, state.activeSeatNumber);
  }

  render();
}

init();
