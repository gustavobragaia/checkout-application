import Fastify from "fastify";

const app = Fastify();

app.get("/health", async () => {
  return { ok: true };
});

const port = Number(process.env.PORT ?? 3001);

app.listen({ port, host: "0.0.0.0" }).catch((err) => {
  app.log.error(err);
  process.exit(1);
});
