import fp from "fastify-plugin";
import jwt from "@fastify/jwt";
import { Role } from "../generated/prisma/enums";

declare module "@fastify/jwt" {
  interface FastifyJWT {
    payload: {
      sub: string;
      email: string;
      role: Role[];
    };
    user: {
      sub: string;
      email: string;
      role: Role[];
      iat: number;
      exp: number;
    };
  }
}

export default fp(async (app) => {
  app.register(jwt, {
    secret: process.env.JWT_SECRET ?? "dev-secret",
  });
});
