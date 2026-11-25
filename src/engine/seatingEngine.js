import { GAME_CONFIG } from "../config/gameConfig.js";

export function buildCircleSeating(
  playerCount,
  customNames = [],
  palette = GAME_CONFIG.teamPalette
) {
  if (
    playerCount < GAME_CONFIG.minPlayers ||
    playerCount > GAME_CONFIG.maxPlayers ||
    playerCount % 2 !== 0
  ) {
    throw new Error(
      `Player count must be an even number between ${GAME_CONFIG.minPlayers} and ${GAME_CONFIG.maxPlayers}.`
    );
  }

  const teamCount = playerCount / 2;
  const seats = [];

  for (let seatNum = 1; seatNum <= playerCount; seatNum++) {
    const teamIndex = (seatNum - 1) % teamCount;
    const teamId = teamIndex + 1;
    const partnerSeat = ((seatNum - 1 + teamCount) % playerCount) + 1;
    const color = palette[teamIndex % palette.length];
    const rawName = typeof customNames[seatNum - 1] === "string" ? customNames[seatNum - 1].trim() : "";
    const playerName = rawName || `نفر ${seatNum}`;

    seats.push({
      seatNumber: seatNum,
      playerName,
      teamId,
      teamNameFa: `تیم ${teamId}`,
      partnerSeat,
      colorHex: color.hex,
      colorSoft: color.soft
    });
  }

  return seats;
}

export function getNextSeatNumber(currentSeat, playerCount) {
  return (currentSeat % playerCount) + 1;
}
