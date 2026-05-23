import Question from "../models/Question.js";
import Quiz from "../models/Quiz.js";

export const createQuiz = async (req, res) => {
    try{ 
        let {title,description} = req.body;

        // REMOVE EXTRA SPACES
        title = title?.trim();
        description = description?.trim();

        // VALIDATION
        if(!title) {

            return res.status(400).json({

                message: "Title is required"

            });

        }

        const generateJoinCode = () => {
            return Math.floor(100000 + Math.random() * 900000).toString();
        };

        const quiz = await Quiz.create({
            title,
            description,
            joinCode: generateJoinCode()
        });

        res.status(200).json({
            content: quiz
        })
    } catch(error) {
        res.status(401).json({
            message: error?.message
        })
    }
};

export const getQuizzes = async (req, res) => {
    try {
        const quizzes = await Quiz.find().sort({ createdAt: -1 });
        res.status(200).json({ content: quizzes });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const getQuizById = async (req, res) => {
    try {
        const quiz = await Quiz.findById(req.params.id);
        if (!quiz) return res.status(404).json({ message: "Quiz not found" });
        const questions = await Question.find({ quizId: quiz._id });
        res.status(200).json({ content: { ...quiz.toObject(), questions } });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const deleteQuiz = async (req, res) => {
    try {
        const quiz = await Quiz.findByIdAndDelete(req.params.id);
        if (!quiz) return res.status(404).json({ message: "Quiz not found" });
        // Also delete associated questions
        await Question.deleteMany({ quizId: req.params.id });
        res.status(200).json({ message: "Quiz deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const createQuestion = async (req,res) => {
    try {
        const { quizId } = req.params;
        const{questionText,options,correctAnswer,timeLimit,points} = req.body;

        const quiz = await Quiz.findById(quizId);
        if (!quiz) {
            return res.status(403).json({ success: false, message: 'Invalid quiz' });
        }

        const question = await Question.create({
            quizId,
            questionText,
            options,
            correctAnswer,
            timeLimit,
            points
        });

        res.status(201).json({
            content: question
        })
    } catch(error) {
        res.status(500).json({
            message: error?.message
        })
    }
};

export const deleteQuestion = async (req, res) => {
    try {
        const question = await Question.findByIdAndDelete(req.params.id);
        if (!question) return res.status(404).json({ message: "Question not found" });
        res.status(200).json({ message: "Question deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};