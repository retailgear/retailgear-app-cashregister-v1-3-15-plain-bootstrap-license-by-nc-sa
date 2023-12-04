export class Payment {
  constructor(
    public iPaymentId: string,
    public iBusinessPaymentMethodId: string,
    public dDate: Date,
    public nAmount: number,
    public sMethod: string,
    public sCardName: string
  ) {
  }
}
