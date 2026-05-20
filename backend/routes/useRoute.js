import express from "express";
import {createAdmin, createUser} from "../controllers/userController.js";

const router = express.Router();

router.post("/admin_login", createAdmin);
router.post("/user",createUser);

export default router