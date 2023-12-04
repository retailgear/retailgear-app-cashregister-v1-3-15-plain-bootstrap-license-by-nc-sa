import {Property} from "./property.model";

export class BusinessProductMetadata {
  constructor(
    public iSupplierId: string,
    public iBusinessPartnerId: string,
    public iBusinessBrandId: string,
    public sLabelDescription: string,
    public bBestseller: boolean,
    public bHasStock: boolean,
    public bShowSuggestion: boolean,
    public aProperty: [Property],
    public image: [string],
    public oName: object,
    public oShortDescription: object,
    public eGender: string,
    public eOwnerShip: string,
    public sProductNumber: string,
  ) {
  }
}
