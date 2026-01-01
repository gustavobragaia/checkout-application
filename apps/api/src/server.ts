import "dotenv/config";
import Fastify from "fastify";
import { authRoutes } from "./modules/auth/auth.route";
import jwtPlugin from "./plugins/jwt";
import authPlugin from "./plugins/auth";
import { productRoutes } from "./modules/products/products.route";

const app = Fastify({ logger: true });
app.register(jwtPlugin);
app.register(authPlugin);
app.register(authRoutes);
app.register(productRoutes, { prefix: "/api/v1" });

const port = Number(process.env.PORT ?? 3001);

app.listen({ port, host: "0.0.0.0" }).catch((err) => {
  app.log.error(err);
  process.exit(1);
});
