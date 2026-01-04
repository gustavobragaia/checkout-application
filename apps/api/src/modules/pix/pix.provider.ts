//will selected the provider
export interface PixChargeResult {
  providerPaymentId: string;
  copyPaste: string;
  expiresAt: Date;
  qrCode: string;
}

export interface PixProvider {
  createCharge(input: {
    amountCents: number;
    externalReference: string;
    description: string;
    payerEmail: string;
    idempotencyKey: string;
  }): Promise<PixChargeResult>;
}
