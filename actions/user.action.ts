"use server";

import db from "@/drizzle/src";
import { usersTable } from "@/drizzle/src/db/schema";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { eq } from "drizzle-orm";
import { cookies } from "next/headers";
const JWT_SECRET = process.env.JWT_SECRET || "supersecret";

export async function SignUp({
  firstName,
  lastName,
  address1,
  city,
  state,
  dateOfBirth,
  ssn,
  email,
  password,
}: SignUpParams) {
  try {
    if (
      !firstName ||
      !lastName ||
      !address1 ||
      !city ||
      !state ||
      !dateOfBirth ||
      !ssn ||
      !email ||
      !password
    ) {
      return { error: "All fields are required" };
    }
    const existingUser = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.email, email));
    if (existingUser.length > 0) {
      return { error: "Email already exists" };
    }
    const hashedPassword = await bcrypt.hash(password, 12);
    const [user] = await db
      .insert(usersTable)
      .values({
        firstname: firstName,
        lastname: lastName,
        address: address1,
        city: city,
        state: state,
        dateofbirth: dateOfBirth,
        ssn: ssn,
        email: email,
        password: hashedPassword,
      })
      .returning();
    const token = jwt.sign({ userId: user.id }, JWT_SECRET, {
      expiresIn: "1d",
    });
    const cookie = await cookies();
    cookie.set("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 60 * 60 * 24, // 1day
      path: "/",
    });
    return {
      message: "User created successfully",
      user: {
        firstname: user.firstname,
        lastname: user.lastname,
      }, // Return relevant user data
    };
  } catch (err: unknown) {
    if (err instanceof Error) {
      console.error(err.message);
    } else {
      console.error(err);
    }
    return {
      error: "Internal Server Error",
    };
  }
}

export async function SignIn({ email, password }: LoginUser) {
  try {
    if (!email || !password) {
      return { error: "Email and password are required" };
    }

    const [user] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.email, email));

    if (!user) {
      return { error: "Invalid credentials" };
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return { error: "Invalid credentials" };
    }

    const token = jwt.sign({ userId: user.id }, JWT_SECRET, {
      expiresIn: "1d",
    });

    const cookie = await cookies();
    cookie.set("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 60 * 60 * 24, // 1 day
      path: "/",
    });

    return {
      message: "Signed in successfully",
      user: {
        firstname: user.firstname,
        lastname: user.lastname,
      },
    };
  } catch (err: unknown) {
    if (err instanceof Error) {
      console.error(err.message);
    } else {
      console.error(err);
    }
    return {
      error: "Internal Server Error",
    };
  }
}
