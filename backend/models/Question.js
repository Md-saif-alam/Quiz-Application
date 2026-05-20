import mongoose from "mongoose";

const questionSchema = new mongoose.Schema({
    quizId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Quiz",
        required: true
    },
    questionText: {
        type: String,
        required: true
    },
    options: [{
        type: String,
        required: true
    }],
    correctAnswer: {
        type: Number,
        required: true
    },
    timeLimit: {
        type: Number,
        default: 10
    },
    points: {
        type: Number,
        default: 10
    }
},
{
    timestamps: true
}
);

const Question = mongoose.model("Question", questionSchema);
export default Question