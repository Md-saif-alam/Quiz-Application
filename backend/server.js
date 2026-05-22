import express from "express";
import userRouter from "./routes/useRoute.js"
import quizRouter from "./routes/quizRoute.js"
import connectDB from "./config/db.js";
import { configDotenv } from "dotenv";
import cors from "cors";
import http from "http";
import { Server } from "socket.io";
import socketHandler from "./sockets/socketHandler.js"

configDotenv();

const app = express();
app.use(cors());

// Create HTTP server
const server = http.createServer(app);

// Attach Socket.IO
const io = new Server(server, {
    cors: {
        origin: "*"
    }
});

app.use(express.json());

// Database connection
connectDB();

// Accessing port from .env file
const PORT = process.env.PORT || 5000;

app.get('/loaderio-e3f29f018776f5a088f65fc56211fb5f.txt', (req, res) => {
    res.send('loaderio-e3f29f018776f5a088f65fc56211fb5f');
});

app.use("/api", userRouter);
app.use("/api", quizRouter);

// Socket connection
socketHandler(io)

server.listen(PORT, () => {
    console.log(`server is running on port ${PORT}`);
})