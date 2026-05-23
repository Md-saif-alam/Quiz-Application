import Question from "../models/Question.js";
import evaluateAnswer from "../service/evaluateAnswer.js";
import updateLeaderboard from "../service/updateLeaderboard.js";
import User from "../models/User.js";

const questionLeaderboard = {};
const userStats = {};
const activeQuestions = {};
const quizParticipants = {};
const quizAdmins = {};

const socketHandler = (io) => {

    io.on("connection", (socket) => {

        console.log("User connected:", socket.id);

        // JOIN QUIZ
        socket.on("join-quiz", ({ joinCode, username, role }) => {

            socket.join(joinCode);

            socket.data.username = username;
            socket.data.role = role;

            if (role === "admin") {
                quizAdmins[joinCode] = socket.id;
            }

            if (!quizParticipants[joinCode]) {
                quizParticipants[joinCode] = [];
            }
            
            if (role !== "admin") {
                // Prevent duplicate entries for the same socket
                const existing = quizParticipants[joinCode].find(p => p.socketId === socket.id);
                if (!existing) {
                    quizParticipants[joinCode].push({ username, socketId: socket.id });
                }
            }

            io.to(joinCode).emit("participants-update", quizParticipants[joinCode]);
            console.log(`${role} ${username} joined room ${joinCode}`);

            // Store info for disconnect cleanup
            socket.data.room = joinCode;
        });

        // PUBLISH QUESTION
        socket.on("publish-question", ({ joinCode, question }) => {

            if (socket.data.role !== "admin") return;

            // STORE ACTIVE QUESTION
            activeQuestions[joinCode] = {

                questionId: question._id,

                startedAt: Date.now()

            };

            const safeQuestion = {

                _id: question._id,

                questionText: question.questionText,

                options: question.options,

                timeLimit: question.timeLimit,

                correctAnswer: question.correctAnswer

            };

            io.to(joinCode)
                .emit("new-question", safeQuestion);

        });

        // SUBMIT ANSWER
        socket.on("submit-answer", async (data) => {

            try {

                const result = await evaluateAnswer({
                    data,
                    socket,
                    Question,
                    activeQuestions
                });

                // wrong answer
                if (!result) return;

                const leaderboard = updateLeaderboard({
                    result,
                    questionLeaderboard,
                    userStats
                });

                // SEND TOP 10 LEADERBOARD
                io.to(data.joinCode)
                    .emit("leaderboard-update", leaderboard);

                // SEND ANSWER ONLY TO ADMIN
                const adminSocketId = quizAdmins[data.joinCode];
                if (adminSocketId) {
                    io.to(adminSocketId)
                        .emit("answer-received", result);
                }

            } catch (error) {

                console.log(error.message);

            }

        });

        // END QUIZ
        socket.on("end-quiz", async (joinCode) => {
            if (socket.data.role === "admin") {
                io.to(joinCode).emit("quiz-ended");
                console.log(`Quiz ${joinCode} ended by admin`);
                
                try {
                    // Delete all participant data from database
                    await User.deleteMany({ role: "student" });
                    
                    // Optional: Clean up memory structures for this quiz
                    const usernamesToClean = new Set();
                    if (quizParticipants[joinCode]) {
                        quizParticipants[joinCode].forEach(p => usernamesToClean.add(p.username));
                        delete quizParticipants[joinCode];
                    }
                    if (activeQuestions[joinCode]) {
                        delete activeQuestions[joinCode];
                    }
                    Object.keys(questionLeaderboard).forEach(key => {
                        if (key.startsWith(`${joinCode}_`)) {
                            questionLeaderboard[key].forEach(entry => usernamesToClean.add(entry.username));
                            delete questionLeaderboard[key];
                        }
                    });
                    usernamesToClean.forEach(username => {
                        delete userStats[username];
                    });
                    console.log("All participant data deleted successfully.");
                } catch (error) {
                    console.error("Error deleting participant data:", error);
                }
            }
        });

        // REQUEST FINAL RESULTS
        socket.on("request-final-results", (joinCode) => {
            if (socket.data.role === "admin") {
                const quizUsers = quizParticipants[joinCode] ? quizParticipants[joinCode].map(p => p.username) : [];
                const finalStats = {};
                
                quizUsers.forEach(username => {
                    finalStats[username] = { totalCorrect: 0, firstPlaceCount: 0, top3Count: 0, totalTime: 0 };
                });
                
                // Calculate accurate final stats from questionLeaderboard
                Object.keys(questionLeaderboard).forEach(key => {
                    if (key.startsWith(`${joinCode}_`)) {
                        const board = questionLeaderboard[key];
                        board.forEach((entry, idx) => {
                            if (!finalStats[entry.username]) {
                                finalStats[entry.username] = { totalCorrect: 0, firstPlaceCount: 0, top3Count: 0, totalTime: 0 };
                            }
                            finalStats[entry.username].totalCorrect += 1;
                            finalStats[entry.username].totalTime += entry.timeTaken;
                            if (idx === 0) finalStats[entry.username].firstPlaceCount += 1;
                            if (idx < 3) finalStats[entry.username].top3Count += 1;
                        });
                    }
                });
                
                io.to(joinCode).emit("final-results", finalStats);
            }
        });

        // DISCONNECT
        socket.on("disconnect", () => {
            const room = socket.data.room;
            if (room && quizParticipants[room]) {
                quizParticipants[room] = quizParticipants[room].filter(p => p.socketId !== socket.id);
                io.to(room).emit("participants-update", quizParticipants[room]);
            }
            console.log("User disconnected:", socket.id);
        });

    });

};

export default socketHandler;