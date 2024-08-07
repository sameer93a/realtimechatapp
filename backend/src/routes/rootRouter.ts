import express from "express";
import { userRouter } from "./userRoutet";

export const router = express.Router();

router.use("/user", userRouter);
