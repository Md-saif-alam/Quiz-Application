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

    // TOP 5
    const top5 =
        questionLeaderboard[stateKey]
        .slice(0, 5);

    // UPDATE USER STATS
    top5.forEach((user, index) => {

        // CREATE USER
        if(!userStats[user.username]) {

            userStats[user.username] = {

                totalCorrect: 0,
                firstPlaceCount: 0,
                top3Count: 0

            };

        }

        // TOTAL CORRECT
        userStats[user.username]
          .totalCorrect += 1;

        // FIRST PLACE
        if(index === 0) {

            userStats[user.username]
              .firstPlaceCount += 1;

        }

        // TOP 3
        if(index < 3) {

            userStats[user.username]
              .top3Count += 1;

        }

    });

    return {

        top5,
        userStats

    };

};

export default updateLeaderboard;