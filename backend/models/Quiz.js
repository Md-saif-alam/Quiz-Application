import mongoose from "mongoose";

const quizSchema = new mongoose.Schema({
    title: {
        type: String
    },
    description: {
        type: String
    },
    joinCode: {
        type: String,
        unique: true
    },
    startTime: {
        type: Date
    },
    endTime: {
        type: Date
    },
    status: {
        type: String,
        enum: ["draft","waiting","active","completed"],
        default: "draft"
    }
},
{
    timestamps: true
}
);

const Quiz = mongoose.model("Quiz", quizSchema);
export default Quiz;