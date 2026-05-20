import Quiz from "../models/Quiz.js";
import User from "../models/User.js";
import bcryptjs from "bcrypt"
import generateToken from "../middleware/generateToken.js";

export const createAdmin = async (req,res) => {
    try {
        const { email, password } = req.body;
        const adminEmail = process.env.ADMIN_USER;
        
        
        if (email !== adminEmail) {
            return res.status(401).json({ message: "Invalid admin email" });
        }
        if (password !== process.env.ADMIN_PASSWORD) {
            return res.status(401).json({ message: "Invalid password" });
        }

        let existingAdmin = await User.findOne({ email: adminEmail });

        // Auto-create the admin user if it doesn't exist yet
        if (!existingAdmin) {
            const hashPassword = await bcryptjs.hash("admin123", 10);
            existingAdmin = await User.create({
                username: "Admin",
                email: adminEmail,
                password: hashPassword,
                role: "admin"
            });
        }

        // Generate token
        const token = generateToken(existingAdmin);

        return res.status(200).json(
            { message: "Login successful", user: existingAdmin, token: token }
        );
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const createUser = async (req,res) => {
    try {
        const{username,joinCode} = req.body;
        
        // find quiz
        const quiz = await Quiz.findOne({joinCode});

        if(!quiz) {
            return res.status(404).json({message: "Invalid join code"});
        };

        // create user
        const user = await User.create({
            username: username,
            role: "student"
        });

        res.status(200).json({
            message: "User created successfully",
            user,
            quizId: quiz._id,
            joinCode: quiz.joinCode
        });
    } catch(error) {
        res.status(500).json({message: error?.message})
    }
}
