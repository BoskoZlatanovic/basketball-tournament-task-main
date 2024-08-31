const fs = require('fs');
const { calculateInitialForm, simulateGroupPhase, calculateGroupStandings } = require('../src/groupPhase');
const { rankTeams, createPots, drawQuarterFinals, drawSemiFinals, simulateKnockoutPhase, displayDrawResults } = require('../src/knockoutPhase');

// Ucitavanje podataka
const groups = JSON.parse(fs.readFileSync('../basketball-tournament-task-main/json/groups.json', 'utf8'));
const exhibitions = JSON.parse(fs.readFileSync('../basketball-tournament-task-main/Sjson/exibitions.json', 'utf8'));

// Kreiranje mape za podatke o timovima
const teams = new Map();

// Inicijalizacija timova
for (const group in groups) {
  groups[group].forEach(team => {
    teams.set(team.ISOCode, {
      name: team.Team,
      group: group,
      fibaRanking: team.FIBARanking,
      points: 0,
      wins: 0,
      losses: 0,
      pointsScored: 0,
      pointsConceded: 0,
      form: 0
    });
  });
}


calculateInitialForm(teams, exhibitions);

// Simulacija grupne faze
simulateGroupPhase(groups, teams);

const finalStandings = calculateGroupStandings(groups, teams);

// Prikaz konačnog plasmana u grupama
console.log("Konačan plasman u grupama:");
for (const group in finalStandings) {
  console.log(`    Grupa ${group} (Ime - pobede/porazi/bodovi/postignuti koševi/primljeni koševi/koš razlika):`);
  finalStandings[group].forEach((team, index) => {
    console.log(`        ${index + 1}. ${team.name.padEnd(12)} ${team.wins} / ${team.losses} / ${team.points} / ${team.pointsScored} / ${team.pointsConceded} / ${(team.pointsScored - team.pointsConceded >= 0 ? '+' : '') + (team.pointsScored - team.pointsConceded)}`);
  });
  console.log();
}

///// KRAJ GRUPNE FAZE /////

// ZREB ZA ELIMINACIONU FAZU

// Izvršavanje žreba
const rankedTeams = rankTeams(finalStandings);
const pots = createPots(rankedTeams);

let quarterFinals;
let semiFinals;

while (true) {
    quarterFinals = drawQuarterFinals(pots);
    if (quarterFinals === null) {
        console.log("Žreb nije uspeo. Pokušavam ponovo...");
        continue;
    }

    semiFinals = drawSemiFinals(quarterFinals);
    break;
}

if (!quarterFinals || !semiFinals) {
    console.error("Nije moguće formirati validne parove za četvrtfinale ili polufinale. Program se završava.");
    process.exit(1);
}

displayDrawResults(pots, quarterFinals, semiFinals);

// Simulacija eliminacione faze
const knockoutResults = simulateKnockoutPhase(quarterFinals, semiFinals);

// Prikaz konačnih rezultata
console.log("\nMedalje:");
console.log(`    1. ${knockoutResults.finalResult.winner.name}`);
console.log(`    2. ${knockoutResults.finalResult.loser.name}`);
console.log(`    3. ${knockoutResults.thirdPlaceResult.winner.name}`);