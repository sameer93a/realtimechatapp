import { PrismaClient } from "@prisma/client";
import express from "express";
import z, { ParseStatus } from "zod";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import dotenv from "dotenv";

dotenv.config();

const client = new PrismaClient();
export const userRouter = express.Router();

const signupBody = z.object({
  username: z.string(),
  firstName: z.string(),
  lastName: z.string(),
  email: z.string().email(),
  password: z.string().min(6),
});

userRouter.post("/signup", async (req, res) => {
  const pasreResult = signupBody.safeParse(req.body);
  if (!pasreResult.success) {
    return res.status(400).json({
      msg: "please enter correct inputs",
      errors: pasreResult.error.errors,
    });
  }

  const { username, firstName, lastName, email, password } = req.body;

  const existingUser = await client.user.findFirst({
    where: { username },
  });

  if (existingUser) {
    return res.status(409).json({
      msg: "user already exits with this usernmae",
    });
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const newUser = await client.user.create({
    data: {
      username,
      firstName,
      lastName,
      email,
      password: hashedPassword,
    },
  });

  if (newUser) {
    const token = jwt.sign(
      { id: newUser.id },
      process.env.JWT_SECRET as string,
      {
        expiresIn: "1h",
      }
    );
    return res.status(201).json({
      msg: "user created successfully",
      token,
    });
  } else {
    return res.status(500).json({
      msg: "error whle creating user",
    });
  }
});

const signinBody = z.object({
  username: z.string(),
  password: z.string().min(6),
});

userRouter.post("/signin", async (req, res) => {
  const pasreResult = signinBody.safeParse(req.body);
  if (!pasreResult.success) {
    return res.status(400).json({
      msg: "Enter correct username and password",
      errors: pasreResult.error.errors,
    });
  }

  const { username, password } = req.body;

  const findUser = await client.user.findFirst({
    where: { username },
  });

  const isPasswrodValid = await bcrypt.compare(
    password,
    findUser?.password || ""
  );

  if (!isPasswrodValid) {
    return res.status(401).json({
      msg: "Ivalid password",
    });
  }

  const token = jwt.sign(
    { id: findUser?.id },
    process.env.JWT_SECRET as string,
    {
      expiresIn: "1h",
    }
  );

  return res.status(200).json({
    msg: "user signin successfully",
    token,
  });
});
