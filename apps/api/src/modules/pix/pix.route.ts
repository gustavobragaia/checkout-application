import { FastifyInstance } from "fastify";
import { PixService } from "./pix.service";
import { CustomError } from "../../errors/custom-error";

export async function pixPublicRoutes(app: FastifyInstance) {
  const cookieName = "checkout_session_id";
  const pixService = new PixService();

  //create pix payment
  app.post("/session/pay", async (req, res) => {
    const sessionId = req.cookies?.[cookieName];
    if (!sessionId) {
      throw new CustomError("Missing SessionId to generate PIX", 401);
    }
    const result = await pixService.createOrGetPixPayment(sessionId);
    return res.code(200).send(result);
  });

  //get status of pix
  app.get("/session/pay", async (req, res) => {
    const sessionId = req.cookies?.[cookieName];
    if (!sessionId) {
      throw new CustomError("Missing SessionId to generate PIX", 401);
    }
    const result = await pixService.createOrGetPixPayment(sessionId);
    return res.code(200).send(result);
  });
}
