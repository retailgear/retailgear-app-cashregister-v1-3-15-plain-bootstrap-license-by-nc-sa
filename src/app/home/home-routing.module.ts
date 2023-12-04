import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
// import { BarcodeComponent } from "../barcode/barcode.component";
// import { PrintComponent } from "../print/print.component";
import { HomeComponent } from './home.component';

const routes: Routes = [
  // {
  //   path: 'print',
  //   component: PrintComponent
  // }, {
  //   path: 'barcode',
  //   component: BarcodeComponent
  // },
  {
    path: '',
    component: HomeComponent,
    children:[
      {
        path: 'transactions',
        loadChildren: () => import('../transactions/transactions.module').then(module => module.TransactionsModule)
      },
      {
        path: 'activity-items',
        loadChildren: () => import('../activity-items/activity-items.module').then(module => module.ActivityItemsModule)
      },
      {
        path: 'customers',
        loadChildren: () => import('../customers/customers.module').then(module => module.CustomersModule)
      },
      {
        path: 'transactions-audit',
        loadChildren: () => import('../transaction-audit/transaction-audit.module').then(module => module.TransactionAuditModule)
      },
      {
        path: 'devices',
        loadChildren: () => import('../device/device.module').then(module => module.DeviceModule)
      },
      {
        path: 'statistics-settings',
        loadChildren: () => import('../statistics-settings/statistics-settings.module').then(module => module.StatisticsSettingsModule)
      },
      {
        path: 'fiskaly-settings',
        loadChildren: () => import('../fiskaly-settings/fiskaly-settings.module').then(module => module.FiskalySettingsModule)
      },
      {
        path: 'saving-points',
        loadChildren: () => import('../saving-points/saving-points.module').then(module => module.SavingPointsModule)
      },
      {
        path: 'payment-account-management',
        loadChildren: () => import('../payment-integration/payment-integration.module').then(module => module.PaymentIntegrationModule)
      },
      {
        path: 'print-settings',
        loadChildren: () => import('../print-settings/print-settings.module').then(module => module.PrintSettingsModule)
      },
      {
        path: 'workstations',
        loadChildren: () => import('../workstation/workstation.module').then(module => module.WorkstationModule)
      },
      {
        path: 'till-settings',
        loadChildren: () => import('../till-settings/till-settings.module').then(module => module.TillSettingsModule)
      },
      {
        path: '',
        loadChildren: () => import('../till/till.module').then(module => module.TillModule)
      },
    ]
  },

];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class HomeRoutingModule { }
