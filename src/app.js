import { GAME_CONFIG } from "./config/gameConfig.js";
import { buildCircleSeating, getNextSeatNumber } from "./engine/seatingEngine.js";
import { WordDeckEngine } from "./engine/wordDeckEngine.js";
import { RoundTimerEngine } from "./engine/timerEngine.js";
import { SoundEngine } from "./engine/soundEngine.js";
import { TimeWeightedScoringStrategy } from "./engine/scoringEngine.js";
import { renderSetupView } from "./ui/setupView.js";
import { renderSeatingView } from "./ui/seatingView.js";
import { renderTurnView, updateTurnClockOnly } from "./ui/turnView.js";
import { renderScoreboardView } from "./ui/scoreboardView.js";

function createFreshScores(playerCount) {
  const teamCount = playerCount / 2;
  const scores = {};
  for (let t = 1; t <= teamCount; t++) {
    scores[t] = 0;
  }
  return scores;
}

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
  const scoring = new TimeWeightedScoringStrategy();

  let state = {
    phase: "setup", // "setup" | "playing" | "round_end"
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
    teamSeconds: {},
    lastRoundSummary: null,
    cumulativeScores: createFreshScores(GAME_CONFIG.defaultPlayers),
    isMatchFinished: false
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
    onExpire: ({ teamSeconds, buzzerTeamId }) => {
      sound.playBuzzer();

      const teamIds = Object.keys(state.cumulativeScores).map(Number);
      const summary = scoring.calculateRound({
        teamIds,
        teamSeconds,
        buzzerTeamId
      });

      const nextCumulative = { ...state.cumulativeScores };
      for (const teamId of teamIds) {
        nextCumulative[teamId] = Number(
          ((nextCumulative[teamId] ?? 0) + summary.teams[teamId].roundScore).toFixed(2)
        );
      }

      const isMatchFinished = state.currentRound >= state.settings.totalRounds;

      state = {
        ...state,
        phase: "round_end",
        remainingSeconds: 0,
        isPaused: false,
        wordRevealed: false,
        currentWord: null,
        teamSeconds,
        lastRoundSummary: summary,
        cumulativeScores: nextCumulative,
        isMatchFinished
      };

      render();
    }
  });

  function startMatch() {
    sound.unlock();
    deck.resetMatch();
    state = {
      ...state,
      cumulativeScores: createFreshScores(state.settings.playerCount),
      lastRoundSummary: null,
      isMatchFinished: false
    };
    startRound(1, 1);
  }

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
      teamSeconds: initialTeamSeconds,
      isMatchFinished: false
    };

    timer.prepareRound(durationSec, teamIds, startSeat.teamId);
    render();
  }

  function render() {
    if (state.phase === "setup") {
      renderSetupView(
        mainStage,
        state.settings,
        (nextSettings) => {
          state.settings = nextSettings;
          state.seats = buildCircleSeating(nextSettings.playerCount, nextSettings.playerNames);
          state.cumulativeScores = createFreshScores(nextSettings.playerCount);
          state.remainingSeconds = Math.round(nextSettings.durationMinutes * 60);
          render();
        },
        (currentSettings) => {
          state.settings = currentSettings;
          state.seats = buildCircleSeating(currentSettings.playerCount, currentSettings.playerNames);
          startMatch();
        }
      );
      renderSeatingView(seatingStage, state.seats, null);
      return;
    }

    if (state.phase === "playing") {
      renderTurnView(
        mainStage,
        {
          currentRound: state.currentRound,
          totalRounds: state.settings.totalRounds,
          seats: state.seats,
          activeSeatNumber: state.activeSeatNumber,
          wordRevealed: state.wordRevealed,
          currentWord: state.currentWord,
          remainingSeconds: state.remainingSeconds,
          isPaused: state.isPaused,
          teamSeconds: state.teamSeconds,
          roundExpired: false
        },
        {
          onTogglePause: () => {
            sound.unlock();
            state.isPaused = timer.togglePause();
            sound.setPaused(state.isPaused);
            render();
          },
          onRevealWord: () => {
            sound.unlock();
            if (!timer.isRunning) {
              timer.start();
            }
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
          onBackToSetup: () => {
            timer.stop();
            sound.resetRoundAudio();
            state.phase = "setup";
            state.wordRevealed = false;
            state.currentWord = null;
            render();
          }
        }
      );
      renderSeatingView(seatingStage, state.seats, state.activeSeatNumber);
      return;
    }

    if (state.phase === "round_end") {
      renderScoreboardView(mainStage, state, {
        onStartNextRound: () => {
          const nextRound = Math.min(state.settings.totalRounds, state.currentRound + 1);
          const nextStarter = getNextSeatNumber(state.activeSeatNumber, state.settings.playerCount);
          startRound(nextRound, nextStarter);
        },
        onRestartMatch: () => {
          startMatch();
        },
        onBackToSetup: () => {
          timer.stop();
          sound.resetRoundAudio();
          state.phase = "setup";
          state.wordRevealed = false;
          state.currentWord = null;
          render();
        }
      });
      renderSeatingView(seatingStage, state.seats, null);
    }
  }

  render();
}

init();
