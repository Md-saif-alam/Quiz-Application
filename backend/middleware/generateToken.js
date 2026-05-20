import jwt from "jsonwebtoken";

const generateToken = (admin) => {
    const token = jwt.sign(
        {id: admin._id, role: admin.role},
        process.env.JWT_SECRET, 
        {expiresIn: "7d"}
    );

    return token
}

export default generateToken;