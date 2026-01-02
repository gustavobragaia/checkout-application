import "dotenv/config";
import Fastify from "fastify";
import fastifyCookie from "@fastify/cookie";
import { authRoutes } from "./modules/auth/auth.route";
import jwtPlugin from "./plugins/jwt";
import authPlugin from "./plugins/auth";
import { productRoutes } from "./modules/products/products.route";
import { checkoutPublicRoutes } from "./modules/checkout-links/public-checkout.routes";
import { checkoutProtectedRoutes } from "./modules/checkout-links/checkout-links.routes";
import { checkoutSessionPublicRoutes } from "./modules/checkout-links/checkout-session.routes";

const app = Fastify({ logger: true });
app.register(fastifyCookie);
app.register(jwtPlugin);
app.register(authPlugin);
app.register(authRoutes);
app.register(productRoutes, { prefix: "/api/v1" });
app.register(checkoutProtectedRoutes, { prefix: "/api/v1" });
app.register(checkoutPublicRoutes);
app.register(checkoutSessionPublicRoutes);

const port = Number(process.env.PORT ?? 3001);

app.listen({ port, host: "0.0.0.0" }).catch((err) => {
  app.log.error(err);
  process.exit(1);
});
