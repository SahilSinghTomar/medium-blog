import { z } from "zod";

export const signupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().optional(),
});

export const signinSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export const createPostSchema = z.object({
  title: z.string().min(1),
  content: z.string().min(1),
});

export const updatePostSchema = z.object({
  title: z.string().optional(),
  content: z.string().optional(),
});

export type signupSchemaType = z.infer<typeof signupSchema>;
export type signinSchemaType = z.infer<typeof signinSchema>;
export type createPostSchemaType = z.infer<typeof createPostSchema>;
export type updatePostSchemaType = z.infer<typeof updatePostSchema>;
