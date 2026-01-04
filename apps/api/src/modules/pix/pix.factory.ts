import { MercadoPagoProvider } from "./providers/mercado-pago.provider";

//where i can implement other switch cases to others providers
export function makePixProvider() {
  const name = process.env.PIX_PROVIDER ?? "MERCADO_PAGO";

  switch (name) {
    case "MERCADO_PAGO":
      if (!process.env.MERCADO_PAGO_ACCESS_TOKEN) {
        throw new Error("MERCADO_PAGO_ACCESS_TOKEN is required for PIX");
      }
      return new MercadoPagoProvider(process.env.MERCADO_PAGO_ACCESS_TOKEN);

    default:
      throw new Error(`Unsupported PIX_PROVIDER: ${name}`);
  }
}
