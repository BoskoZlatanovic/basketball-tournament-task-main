function calculateInitialForm(teams, exhibitions) {
    for (const [isoCode, matches] of Object.entries(exhibitions)) {
        let formPoints = 0;
        matches.forEach(match => {
            const [teamScore, opponentScore] = match.Result.split('-').map(Number);
            const scoreDifference = teamScore - opponentScore;
            const opponentRanking = teams.get(match.Opponent)?.fibaRanking || 50;
            formPoints += scoreDifference * (50 / opponentRanking);
        });
        const team = teams.get(isoCode);
        if (team) {
            team.form = formPoints / matches.length;
        }
    }
}

function simulateMatch(team1, team2) {

    const rankDiff = team2.fibaRanking - team1.fibaRanking;
    const formDiff = team1.form - team2.form;
    const baseProb = 0.5 + rankDiff * 0.01 + formDiff * 0.005;
    const team1Prob = Math.max(0.1, Math.min(0.9, baseProb));

    let team1Score, team2Score;
    const team1Wins = Math.random() < team1Prob;

    do {
        team1Score = Math.floor(Math.random() * 30) + 70;
        team2Score = Math.floor(Math.random() * 30) + 70;
    } while ((team1Wins && team1Score <= team2Score) || (!team1Wins && team1Score >= team2Score));

    const winner = team1Wins ? team1 : team2;
    const loser = team1Wins ? team2 : team1;
    const score = `${team1Score}:${team2Score}`;

    // Update form based on match result
    const scoreDiff = Math.abs(team1Score - team2Score);
    winner.form += scoreDiff * 0.1;
    loser.form -= scoreDiff * 0.1;

    // Update team stats
    updateTeamStats(team1, team1Score, team2Score);
    updateTeamStats(team2, team2Score, team1Score);

    console.log(`        ${team1.name} - ${team2.name} (${score})`);

    return { winner, loser, score };
}


function updateTeamStats(team, scoreFor, scoreAgainst) {
    const isWinner = scoreFor > scoreAgainst;
    team.points += isWinner ? 2 : 1;
    team.wins += isWinner ? 1 : 0;
    team.losses += isWinner ? 0 : 1;
    team.pointsScored += scoreFor;
    team.pointsConceded += scoreAgainst;
}

function simulateGroupPhase(groups, teams) {
    for (let round = 1; round <= 3; round++) {
        console.log(`Grupna faza - ${round}. kolo:`);
        for (const group in groups) {
            console.log(`    Grupa ${group}:`);
            const teamsInGroup = groups[group];

            switch(round) {
                case 1:
                    simulateMatch(teams.get(teamsInGroup[0].ISOCode), teams.get(teamsInGroup[1].ISOCode));
                    simulateMatch(teams.get(teamsInGroup[2].ISOCode), teams.get(teamsInGroup[3].ISOCode));
                    break;
                case 2:
                    simulateMatch(teams.get(teamsInGroup[0].ISOCode), teams.get(teamsInGroup[2].ISOCode));
                    simulateMatch(teams.get(teamsInGroup[1].ISOCode), teams.get(teamsInGroup[3].ISOCode));
                    break;
                case 3:
                    simulateMatch(teams.get(teamsInGroup[0].ISOCode), teams.get(teamsInGroup[3].ISOCode));
                    simulateMatch(teams.get(teamsInGroup[1].ISOCode), teams.get(teamsInGroup[2].ISOCode));
                    break;
            }
        }
        console.log();
    }
}

function calculateGroupStandings(groups, teams) {
    const standings = {};
    for (const group in groups) {
        standings[group] = groups[group]
            .map(team => teams.get(team.ISOCode))
            .sort((a, b) =>
                b.points - a.points ||
                (b.pointsScored - b.pointsConceded) - (a.pointsScored - a.pointsConceded) ||
                b.pointsScored - a.pointsScored
            );
    }
    return standings;
}


// Na kraju fajla
module.exports = {
    calculateInitialForm,
    simulateGroupPhase,
    calculateGroupStandings
};