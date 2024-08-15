import { Hono } from "hono";
import { Post, PrismaClient, User } from "@prisma/client/edge";
import { withAccelerate } from "@prisma/extension-accelerate";
import { verify } from "hono/jwt";

import {
  createPostSchema,
  updatePostSchema,
} from "@sahiltomar100303/medium-common";

export const blogRouter = new Hono<{
  Bindings: {
    DATABASE_URL: string;
    JWT_SECRET: string;
  };
  Variables: {
    userId: string;
  };
}>();

type Payload = {
  id: string;
};

blogRouter.use("/*", async (c, next) => {
  const header = c.req.header("authorization") || "";
  const token = header?.split(" ")[1];

  if (!token) {
    c.status(403);
    return c.json({
      error: "Unauthorized",
    });
  }

  try {
    const payload = (await verify(token, c.env.JWT_SECRET)) as Payload;

    if (!payload) {
      c.status(403);
      return c.json({
        error: "Unauthorized",
      });
    }

    c.set("userId", payload.id);

    await next();
  } catch (e) {
    c.status(403);
    return c.json({
      error: "Unauthorized",
    });
  }
});

blogRouter.post("/", async (c) => {
  const body: Post = await c.req.json();

  const { success } = createPostSchema.safeParse(body);
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
    const post = await prisma.post.create({
      data: {
        title: body.title,
        content: body.content,
        authorId: c.get("userId"),
      },
    });

    c.status(200);
    return c.json({
      id: post.id,
    });
  } catch (e) {
    c.status(401);
    return c.json({
      message: "Invalid",
    });
  }
});

blogRouter.get("/", async (c) => {
  const prisma = new PrismaClient({
    datasourceUrl: c.env.DATABASE_URL,
  }).$extends(withAccelerate());

  try {
    const posts = await prisma.post.findMany({
      where: {
        authorId: c.get("userId"),
      },
    });

    c.status(200);
    return c.json({
      posts,
    });
  } catch (e) {
    c.status(411);
    return c.json({
      message: "Error while fetching posts",
    });
  }
});

blogRouter.put("/", async (c) => {
  const body: Post = await c.req.json();

  const { success } = updatePostSchema.safeParse(body);
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
    const post = await prisma.post.update({
      where: {
        id: body.id,
      },
      data: {
        title: body.title,
        content: body.content,
      },
    });

    c.status(200);
    return c.json({
      id: post.id,
    });
  } catch (e) {
    c.status(411);
    return c.json({
      message: "Error while updating post",
    });
  }
});

// pagination
blogRouter.get("/bulk", async (c) => {
  const prisma = new PrismaClient({
    datasourceUrl: c.env.DATABASE_URL,
  }).$extends(withAccelerate());

  try {
    const posts = await prisma.post.findMany();

    c.status(200);
    return c.json({
      posts,
    });
  } catch (e) {
    c.status(411);
    return c.json({
      message: "Error while fetching posts",
    });
  }
});

blogRouter.get("/:id", async (c) => {
  const prisma = new PrismaClient({
    datasourceUrl: c.env.DATABASE_URL,
  }).$extends(withAccelerate());

  const { id } = c.req.param();

  try {
    const post = await prisma.post.findUnique({
      where: {
        id,
      },
    });

    c.status(200);
    return c.json({
      post,
    });
  } catch (e) {
    c.status(411);
    return c.json({
      message: "Error while fetching post",
    });
  }
});
