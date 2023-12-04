import { ExtraService } from "./extra-service.model";
import { EdiProduct } from "./edi-product.model";
import { Property } from "./property.model";
import { Payment } from "./payment.model";
import { BusinessProductMetadata } from "./business-product-metadata.model";

export class TransactionItem {
  
  sProductName: string;
  sComment: string;
  sProductNumber: string;
  nPriceIncVat: number;
  nPurchasePrice: number;
  nProfit: number;
  bEntryMethodCustomerValue: boolean| null;
  nVatRate: number;
  nQuantity: number;
  nReceivedQuantity: number| null;
  // 10
  aExtraServices: [ExtraService | null];
  iProductId: string;
  sEan: string;
  sArticleNumber: string;
  aImage: [string];
  nMargin: number;
  nExtraLabel: number| null;
  oEdiProduct: EdiProduct| null;
  iBusinessPartnerId: string| null;
  sBusinessPartnerName: string| null;
  iBusinessId: string;
  // 20
  iArticleGroupId: string| null;
  iArticleGroupOriginalId: string| null;
  oArticleGroupMetaData: {aProperty: [Property] } | null;
  aPayments: [Payment] | null;
  bPayLater: boolean;
  bDeposit: boolean;
  sProductCategory: string;
  sGiftCardNumber: string| null;
  iParentTransactionDetailId: string| null;
  iGiftCardTransaction: string| null;
  // 30
  nEstimatedTotal: number;
  nPaymentAmount: number;
  nPaidLaterAmount: number;
  bDiscount: boolean;
  bDiscountPercent: boolean;
  nDiscountValue: number;
  nRefundAmount: number;
  nProductSize: number| null;
  nProductSizeFor: string| null;
  dEstimatedDate: Date| null;
  // 40
  dEstimatedDateString: string| null;
  iBusinessBrandId: string| null;
  iBusinessProductId: string| null;
  oBusinessProductMetaData: BusinessProductMetadata| null;
  eStatus: string;
  iWorkstationId: string;
  iEmployeeId: string;
  iAssigneeId: string;
  iLocationId: string;
  sBagNumber: string;
  iSupplierId: any;
  //Optional here, since we don't know the transaction id when we create one (50)
  iLastTransactionItemId: string| null;
  iTransactionId: string| null;
  oType: {
    eTransactionType: string,
    bRefund: boolean,
    nStockCorrection: number,
    eKind: string,
    bDiscount: boolean,
    bPrepayment: boolean,
  };
  iActivityItemId: any;
  oGoldFor: any;
  nDiscount: number;
  nRedeemedLoyaltyPoints: number;
  sUniqueIdentifier: string;
  nRevenueAmount: number;
  sDescription: string;
  // 60
  sServicePartnerRemark: string;
  eEstimatedDateAction: string;
  eActivityItemStatus: string;
  bGiftcardTaxHandling: string;
  bDiscountOnPercentage: boolean;  
  constructor() {}

}
