import { Hono } from "hono";
import { PrismaClient, User } from "@prisma/client/edge";
import { withAccelerate } from "@prisma/extension-accelerate";
import { sign } from "hono/jwt";

import { signinSchema, signupSchema } from "@sahiltomar100303/medium-common";

export const userRouter = new Hono<{
  Bindings: {
    DATABASE_URL: string;
    JWT_SECRET: string;
  };
}>();

userRouter.post("/signup", async (c) => {
  const body: User = await c.req.json();

  const { success } = signupSchema.safeParse(body);
  if (!success) {
    c.status(411);
    return c.json({
      error: "Invalid inputs",
    });
  }

  const prisma = new PrismaClient({
    datasourceUrl: c.env.DATABASE_URL,
  }).$extends(withAccelerate());

  try {
    const user = await prisma.user.create({
      data: {
        email: body.email,
        password: body.password,
        name: body.name,
      },
    });

    const token = await sign({ id: user.id }, c.env.JWT_SECRET);

    c.status(200);
    return c.json({
      jwt: token,
    });
  } catch (e) {
    c.status(401);
    c.json({
      message: "Invalid",
    });
  }
});

type SignInUser = {
  email: string;
  password: string;
};

userRouter.post("/signin", async (c) => {
  const body: SignInUser = await c.req.json();

  const { success } = signinSchema.safeParse(body);
  if (!success) {
    c.status(411);
    return c.json({
      error: "Invalid inputs",
    });
  }

  const prisma = new PrismaClient({
    datasourceUrl: c.env.DATABASE_URL,
  }).$extends(withAccelerate());

  try {
    const user = await prisma.user.findUnique({
      where: {
        email: body.email,
        password: body.password,
      },
    });

    if (!user) {
      c.status(403);
      return c.json({
        error: "Invalid credentials",
      });
    }

    const token = await sign({ id: user.id }, c.env.JWT_SECRET);

    c.status(200);
    return c.json({
      jwt: token,
    });
  } catch (e) {
    c.status(411);
    c.json({
      message: "Invalid",
    });
  }
});
