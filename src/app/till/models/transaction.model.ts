import { TransactionItem } from "./transaction-item.model";

export class Transaction {
  _id: string | null
  iBusinessPartnerId: string | null
  iActivityId: string | null
  iBusinessId: string
  sNumber: string | null
  eType: string
  eStatus: string
  iWorkstationId: string
  iEmployeeId: string
  iLocationId: string
  items: TransactionItem[] | null
  iCustomerId: any
  sDayClosureMethod: any

  oCustomer: {
    _id: string;
    sFirstName: string;
    sSalutation: string;
    sLastName: string;
    sPrefix: string;
    oInvoiceAddress: string;
    oShippingAddress: string;
    nClientId: string;
    sGender: string;
    bCounter: string;
    oPhone: string;
    sVatNumber: string;
    sCocNumber: string;
    sEmail: string;
    sCompanyName: string;
    bIsCompany: boolean;
    oContactPerson: string;
  }

        
  constructor() {}
}
