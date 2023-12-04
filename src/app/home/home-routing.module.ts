import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { HomeComponent } from './home.component';
import {PrintComponent} from "../print/print.component";
import {BarcodeComponent} from "../barcode/barcode.component";

const routes: Routes = [
  {
    path : '',
    component : HomeComponent
  },
  {
    path: 'print',
    component: PrintComponent
  }, {
    path: 'barcode',
    component: BarcodeComponent
  }

];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class HomeRoutingModule { }
