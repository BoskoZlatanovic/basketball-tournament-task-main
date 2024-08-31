function rankTeams(finalStandings) {
    const groupWinners = [];
    const groupRunnerUps = [];
    const groupThirds = [];

    for (const group in finalStandings) {

        groupWinners.push(finalStandings[group][0]);
        groupRunnerUps.push(finalStandings[group][1]);
        groupThirds.push(finalStandings[group][2]);

    }

    function compareTeams(a, b) {
        if (a.points !== b.points)
            return b.points - a.points;

        const aGoalDiff = a.pointsScored - a.pointsConceded;
        const bGoalDiff = b.pointsScored - b.pointsConceded;

        if (aGoalDiff !== bGoalDiff)
            return bGoalDiff - aGoalDiff;

        return b.pointsScored - a.pointsScored;
    }

    groupWinners.sort(compareTeams);
    groupRunnerUps.sort(compareTeams);
    groupThirds.sort(compareTeams);

    const rankedTeams = [
        ...groupWinners.map((team, index) => ({ ...team, rank: index + 1 })),
        ...groupRunnerUps.map((team, index) => ({ ...team, rank: index + 4 })),
        ...groupThirds.slice(0, 2).map((team, index) => ({ ...team, rank: index + 7 }))
    ];

    // console.log("Ranked Teams (inside rankTeams):", rankedTeams);

    return rankedTeams;
}


function createPots(rankedTeams) {
    const pots = {
        D: rankedTeams.filter(team => team.rank <= 2),
        E: rankedTeams.filter(team => team.rank > 2 && team.rank <= 4),
        F: rankedTeams.filter(team => team.rank > 4 && team.rank <= 6),
        G: rankedTeams.filter(team => team.rank > 6 && team.rank <= 8)
    };
    // console.log("Pots created:", JSON.parse(JSON.stringify(pots))); // Deep copy for logging
    return pots;
}


function drawQuarterFinals(pots) {
    const potsCopy = JSON.parse(JSON.stringify(pots));

    function tryDrawMatches(potD, potG, potE, potF) {
        const matches = [];

        // Try to match D with G
        for (const teamD of potD) {
            const possibleOpponents = potG.filter(teamG => teamG.group !== teamD.group);
            if (possibleOpponents.length > 0) {
                const teamG = possibleOpponents[Math.floor(Math.random() * possibleOpponents.length)];
                matches.push([teamD, teamG]);
                potG = potG.filter(t => t !== teamG);
            } else {
                return null; // Invalid combination
            }
        }

        // Match remaining E with F
        for (const teamE of potE) {
            const possibleOpponents = potF.filter(teamF => teamF.group !== teamE.group);
            if (possibleOpponents.length > 0) {
                const teamF = possibleOpponents[Math.floor(Math.random() * possibleOpponents.length)];
                matches.push([teamE, teamF]);
                potF = potF.filter(t => t !== teamF);
            } else {
                return null; // Invalid combination
            }
        }

        return matches;
    }

    // Try first combination
    let matches = tryDrawMatches([...potsCopy.D], [...potsCopy.G], [...potsCopy.E], [...potsCopy.F]);

    // If first combination fails, try the second (swapped) combination
    if (!matches) {
        matches = tryDrawMatches([...potsCopy.D], [...potsCopy.G.reverse()], [...potsCopy.E], [...potsCopy.F]);
    }

    // If both combinations fail, the draw is invalid
    if (!matches) {
        console.error("Nije moguće formirati validne parove za četvrtfinale. Žreb se poništava.");
        return null;
    }

    return matches;
}

function drawSemiFinals(quarterFinals) {
    // Shuffle the D vs G matches and E vs F matches separately
    const DGMatches = quarterFinals.slice(0, 2).sort(() => Math.random() - 0.5);
    const EFMatches = quarterFinals.slice(2, 4).sort(() => Math.random() - 0.5);

    // Create semi-final matches
    return [
        [DGMatches[0], EFMatches[0]],
        [DGMatches[1], EFMatches[1]]
    ];
}

function displayDrawResults(pots, quarterFinals, semiFinals){
    console.log("\nŠeširi:");
    for (const [pot, teams] of Object.entries(pots)) {
        console.log(`    Šešir ${pot}`);
        if (teams.length === 0) {
            console.log("        (prazan)");
        } else {
            teams.forEach(team => console.log(`        ${team.name}`));
        }
    }

    console.log("\nEliminaciona faza:");
    console.log("Četvrtfinale:");
    quarterFinals.forEach(([team1, team2], index) => {
        console.log(`    ${index + 1}. ${team1.name} - ${team2.name}`);
    });

    console.log("\nPolufinale:");
    semiFinals.forEach(([match1, match2], index) => {
        console.log(`    ${index + 1}. Pobednik (${match1[0].name} - ${match1[1].name}) vs Pobednik (${match2[0].name} - ${match2[1].name})`);
    });
}

// Funkcija za ažuriranje forme timova nakon utakmice
function updateTeamForm(winner, loser, scoreDifference) {
    const rankDifference = loser.fibaRanking - winner.fibaRanking;
    const formChange = scoreDifference * (1 + Math.max(0, rankDifference / 10));

    winner.form += formChange;
    loser.form -= formChange;
}

// Funkcija za simulaciju jedne utakmice eliminacione faze
function simulateKnockoutMatch(team1, team2) {
    const rankDiff = team2.fibaRanking - team1.fibaRanking;
    const formDiff = team1.form - team2.form;
    const baseProb = 0.5 + rankDiff * 0.01 + formDiff * 0.005;
    const team1Prob = Math.max(0.1, Math.min(0.9, baseProb));

    let team1Score, team2Score;
    do {
        team1Score = Math.floor(Math.random() * 30) + 70;
        team2Score = Math.floor(Math.random() * 30) + 70;
    } while (team1Score === team2Score);

    const winner = team1Score > team2Score ? team1 : team2;
    const loser = winner === team1 ? team2 : team1;
    const score = `${team1Score}:${team2Score}`;
    const scoreDifference = Math.abs(team1Score - team2Score);

    updateTeamForm(winner, loser, scoreDifference);

    console.log(`    ${team1.name} - ${team2.name} (${score})`);

    return { winner, loser, score };
}

// Funkcija za simulaciju cele eliminacione faze
function simulateKnockoutPhase(quarterFinals, semiFinalDraws) {
    console.log("\nČetvrtfinale:");
    const quarterFinalsResults = quarterFinals.map(match => simulateKnockoutMatch(match[0], match[1]));

    console.log("\nPolufinale:");
    const semiFinalsResults = semiFinalDraws.map(semifinalPair => {
        const match1Winners = quarterFinalsResults.filter(qfr =>
            qfr.winner === semifinalPair[0][0] || qfr.winner === semifinalPair[0][1]
        );
        const match2Winners = quarterFinalsResults.filter(qfr =>
            qfr.winner === semifinalPair[1][0] || qfr.winner === semifinalPair[1][1]
        );

        if (match1Winners.length === 0 || match2Winners.length === 0) {
            console.error("Greška u formiranju polufinala");
            return null;
        }

        return simulateKnockoutMatch(match1Winners[0].winner, match2Winners[0].winner);
    }).filter(result => result !== null);

    console.log("\nUtakmica za treće mesto:");
    const thirdPlaceMatch = [semiFinalsResults[0].loser, semiFinalsResults[1].loser];
    const thirdPlaceResult = simulateKnockoutMatch(thirdPlaceMatch[0], thirdPlaceMatch[1]);

    console.log("\nFinale:");
    const finalMatch = [semiFinalsResults[0].winner, semiFinalsResults[1].winner];
    const finalResult = simulateKnockoutMatch(finalMatch[0], finalMatch[1]);

    return {
        quarterFinalsResults,
        semiFinalsResults,
        thirdPlaceResult,
        finalResult
    };
}

// Na kraju fajla
module.exports = {
    rankTeams,
    createPots,
    drawQuarterFinals,
    drawSemiFinals,
    simulateKnockoutPhase,
    displayDrawResults
};