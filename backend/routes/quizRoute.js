import express from "express";
import {createQuiz,createQuestion,getQuizzes,getQuizById,deleteQuiz, deleteQuestion} from "../controllers/quizController.js"
import { startQuiz } from "../controllers/startQuizController.js";
import protect from "../middleware/protect.js";

const router = express.Router();

router.post("/create_quiz",protect,createQuiz);
router.get("/quizzes",protect ,getQuizzes);
router.get("/quizzes/:id",protect, getQuizById);
router.delete("/quizzes/:id", protect, deleteQuiz);
router.post("/create_quiz/question/:quizId",protect, createQuestion)
router.delete("/question/:id", protect, deleteQuestion);
router.post("/quiz/start",protect, startQuiz)

export default router