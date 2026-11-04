import express from "express";
import { getMenu } from "../controllers/menuController.js";

const router = express.Router();

router.get("/", getMenu); // public: customers have no login

export default router;
