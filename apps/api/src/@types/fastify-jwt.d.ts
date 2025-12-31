import "@fastify/jwt";

declare module "@fastify/jwt" {
  interface FastifyJWT {
    payload: {
      sub: string;
      email: string;
      role: unknown;
    };
    user: {
      sub: string;
      email: string;
      role: unknown;
      iat: number;
      exp: number;
    };
  }
}
