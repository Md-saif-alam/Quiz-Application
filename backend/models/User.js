import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true
    },

    // for admin
    email: {
        type: String,
    },
    password: {
        type: String,
    },
    
    role: {
        type: String,
        enum: ["admin", "student"],
        default: "student"
    }
},
{
    timestamps: true
}
);

const User = mongoose.model("User",userSchema);
export default User;