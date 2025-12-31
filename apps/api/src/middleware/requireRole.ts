import { FastifyReply, FastifyRequest } from "fastify";
import { Role } from "../generated/prisma/enums";

export function requireRole(role: Role) {
  return async (req: FastifyRequest, res: FastifyReply) => {
    // req.user.role vem do token e deve ser uma lista de strings
    const rolesRaw = req.user?.role as (Role | { role: Role })[] | undefined;
    const roles =
      rolesRaw?.map((r) => (typeof r === "string" ? r : r.role)) ?? [];

    if (!roles.includes(role)) {
      return res.status(403).send({ message: "Forbidden Acess Lil Nigga" });
    }
  };
}
