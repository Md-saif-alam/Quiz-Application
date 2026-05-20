const answeredUsers = {};

const evaluateAnswer = async({
        data,
        socket,
        Question,
        activeQuestions
    }) => {

    const question = await Question.findById(data.questionId);

    if(!question) {
        return null;
    }
    
    const activeQuestion =
    activeQuestions[data.joinCode];

    if(!activeQuestion) {

        return null;

    }

    const currentTime = Date.now();

    const elapsedTime =
        (currentTime - activeQuestion.startedAt) / 1000;

    // TIMER ENDED
    if(elapsedTime > question.timeLimit) {

        return null;

    }

    const stateKey = `${data.joinCode}_${data.questionId}`;

    // CREATE QUESTION ENTRY
    if(!answeredUsers[stateKey]) {

        answeredUsers[stateKey] = [];

    }

    // DUPLICATE ANSWER PROTECTION
    const alreadyAnswered =
        answeredUsers[stateKey]
        .includes(socket.data.username);

    if(alreadyAnswered) {

        return null;

    }

    // STORE USERNAME
    answeredUsers[stateKey]
      .push(socket.data.username);

    // CHECK ANSWER
    const isCorrect =
        data.selectedOption === question.correctAnswer;

    // WRONG ANSWER
    if(!isCorrect) {

        return null;

    }

    return {

        username: socket.data.username,

        questionId: data.questionId,

        timeTaken: data.timeTaken,

        selectedOption: data.selectedOption,

        isCorrect: true,

        joinCode: data.joinCode
    };

};

export default evaluateAnswer;