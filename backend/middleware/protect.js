import jwt from "jsonwebtoken"

const protect = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader) {
            return res.status(404).json({ message: "Token not found" });
        }

        const token = authHeader.split(" ")[1];

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        next();
    } catch (error) {
        res.status(500).json({ message: error?.message });
    }
};

export default protect;

