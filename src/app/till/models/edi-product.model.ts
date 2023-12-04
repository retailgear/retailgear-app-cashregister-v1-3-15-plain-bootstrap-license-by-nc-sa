export class EdiProduct {
  constructor(
    public sArticle: string,
    public sSuppCode: string,
    public sInvoiceNumber: string,
    public sPurchasePrice: string,
    public sSupplierDescription: string,
    public sSellingPrice: string,
    public sEAN: string,
    public sProductNumber: string,
    public sPDK1: string,
    public sPDK2: string,
    public sPDK3: string,
    public sPDK4: string,
  ) {
  }
}
