import { FastifyRequest } from "fastify";

export type DomainPaymentStatus =
  | "PAID"
  | "FAILED"
  | "REFUNDED"
  | "CHARGEBACK"
  | null;

export type ProviderPaymentDetails = {
  status?: string | null;
  externalReference: string | null;
};

export interface PixWebhookAdapter<
  TRequest extends FastifyRequest = FastifyRequest,
> {
  name: string;
  extractProviderPaymentId(req: TRequest): string | null;
  getPayment(providerPaymentId: string): Promise<ProviderPaymentDetails>;
  mapStatus(status: string): DomainPaymentStatus;
}
