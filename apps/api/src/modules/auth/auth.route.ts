import { FastifyInstance } from "fastify";
import * as z from "zod";
import { loginUser, registerUser } from "./auth.service";
import { prisma } from "../../lib/prisma";
import { requireRole } from "../../middleware/requireRole";

export async function authRoutes(app: FastifyInstance) {
  //register new user
  app.post("/auth/register", async (req, res) => {
    const bodySchema = z.object({
      email: z.string().email(),
      name: z.string().min(1),
      password: z.string().min(6),
    });

    const body = bodySchema.parse(req.body);

    const newUser = await registerUser(body);

    const token = app.jwt.sign(
      {
        sub: newUser.id,
        role: newUser.roles.map((r) => r.role), // store just role strings
        email: newUser.email,
      },
      { expiresIn: "1h" },
    );

    return res.code(201).send({ newUser, token });
  });

  //login user
  app.post("/auth/login", async (req, res) => {
    const bodySchema = z.object({
      email: z.string().email(),
      password: z.string().min(6),
    });

    const body = bodySchema.parse(req.body);

    const user = await loginUser(body);

    const token = app.jwt.sign(
      {
        sub: user.id,
        role: user.roles.map((r) => r.role), // store just role strings
        email: user.email,
      },
      { expiresIn: "1h" },
    );

    return res.code(200).send({ user, token });
  });

  //protected route
  app.get("/me", { onRequest: [app.authenticate] }, async (req, res) => {
    const userId = req.user.sub;
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        roles: true,
        createdAt: true,
      },
    });
    return { user };
  });

  app.get(
    "/me-adm",
    { onRequest: [app.authenticate, requireRole("ADMIN")] },
    async (req, res) => {
      const userId = req.user.sub;
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          name: true,
          email: true,
          roles: true,
          createdAt: true,
        },
      });
      return { user };
    },
  );
}
