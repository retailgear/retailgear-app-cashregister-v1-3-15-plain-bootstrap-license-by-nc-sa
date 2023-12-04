import {Phone} from "./phone.model";

export class Customer {
 constructor(
   public nMatchingCode: number,
   public sSalutation: string,
   public sFirstName: string,
   public sPrefix: string,
   public sLastName: string,
   public dDateOfBirth: Date,
   public nClientId: number,
   public sGender: string,
   public bIsEmailVerified: boolean,
   public bCounter: boolean,
   public sEmail: string,
   public sPassword: string,
   public sPasswordSalt: string,
   public sSignUpPageUrl: string,
   public oPhone: Phone
 ) {
 }

}
