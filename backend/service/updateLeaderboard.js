const updateLeaderboard = ({
    result,
    questionLeaderboard,
    userStats
}) => {

    const stateKey = `${result.joinCode}_${result.questionId}`;

    // CREATE QUESTION ARRAY
    if(!questionLeaderboard[stateKey]) {

        questionLeaderboard[stateKey] = [];

    }

    // STORE RESPONSE
    questionLeaderboard[stateKey]
      .push({

          username: result.username,

          timeTaken: result.timeTaken

      });

    // SORT FASTEST FIRST
    questionLeaderboard[stateKey]
      .sort((a, b) => {

          return a.timeTaken - b.timeTaken;

      });

    // TOP 10
    const top10 =
        questionLeaderboard[stateKey]
        .slice(0, 10);

    // Update the specific user's stats ONLY ONCE for this correct answer
    if(!userStats[result.username]) {
        userStats[result.username] = {
            totalCorrect: 0,
            firstPlaceCount: 0,
            top3Count: 0,
            totalTime: 0
        };
    }

    userStats[result.username].totalCorrect += 1;
    userStats[result.username].totalTime += result.timeTaken;

    return {
        top10,
        userStats
    };

};

export default updateLeaderboard;