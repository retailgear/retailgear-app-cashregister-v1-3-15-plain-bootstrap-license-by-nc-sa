import { TransactionItem } from "./transaction-item.model";

export class Transaction {
  // TODO: Check which properties should be optional
  constructor(
    public _id: string | null,
    public iBusinessPartnerId: string | null,
    public iActivityId: string | null, // activity id added
    public iBusinessId: string,
    public sNumber: string | null,
    public eType: string,
    public eStatus: string,
    public iWorkstationId: string,
    public iEmployeeId: string,
    public iLocationId: string,
    public items: TransactionItem[] | null,
    public iCustomerId: any,
    public oCustomer?: {
      _id: string,
      sFirstName: string,
      sLastName: string,
      sPrefix: string,
      oInvoiceAddress: string,
      nClientId: string,
      sGender: string,
      bCounter: string,
      oPhone: string,
      sVatNumber: string,
      sCocNumber: string,
      sEmail: string
    }
  ) {
  }
}
