import Quiz from "../models/Quiz.js";

export const startQuiz = async (req, res) => {
    try {
        const{quizId} = req.body;

        const quiz = await Quiz.findById(quizId)

        if(!quiz) {
            return res.status(404).json({message: "Quiz not found"});
        }

        quiz.status = "active";
        quiz.startTime = new Date()
        await quiz.save();

        res.status(200).json({
            message: "Quiz started successfully",
            quiz
        })
    } catch(error) {
        res.status(500).json({
            message: error?.message
        })
    }
};