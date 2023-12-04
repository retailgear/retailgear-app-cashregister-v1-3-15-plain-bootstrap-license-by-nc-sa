import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LoginCashRegisterComponent } from './login-cash-register/login-cash-register.component';
import { AppComponent } from './app.component';

const routes: Routes = [
  {
    path: 'home',
    loadChildren: () => import('./home/home.module').then(module => module.HomeModule)
  },
  // {
  //   path: 'till',
  //   loadChildren: () => import('./till/till.module').then(module => module.TillModule)
  // },
  {
    path: 'till-settings',
    loadChildren: () => import('./till-settings/till-settings.module').then(module => module.TillSettingsModule)
  },
  {
    path: 'print-settings',
    loadChildren: () => import('./print-settings/print-settings.module').then(module => module.PrintSettingsModule)
  },
  {
    path: 'payment-account-management',
    loadChildren: () => import('./payment-integration/payment-integration.module').then(module => module.PaymentIntegrationModule)
  },
  {
    path: 'workstations',
    loadChildren: () => import('./workstation/workstation.module').then(module => module.WorkstationModule)
  },
  {
    path: 'saving-points',
    loadChildren: () => import('./saving-points/saving-points.module').then(module => module.SavingPointsModule)
  },
  {
    path: 'statistics-settings',
    loadChildren: () => import('./statistics-settings/statistics-settings.module').then(module => module.StatisticsSettingsModule)
  },
  {
    path: 'fiskaly-settings',
    loadChildren: () => import('./fiskaly-settings/fiskaly-settings.module').then(module => module.FiskalySettingsModule)
  },
  {
    path: 'webshop-settings',
    loadChildren: () => import('./webshop-settings/webshop-settings.module').then(module => module.WebshopSettingsModule)
  },
  {
    path: 'devices',
    loadChildren: () => import('./device/device.module').then(module => module.DeviceModule)
  },
  {
    path: 'transactions',
    loadChildren: () => import('./transactions/transactions.module').then(module => module.TransactionsModule)
  },
  {
    path: 'web-orders',
    loadChildren: () => import('./web-orders/web-orders.module').then(module => module.WebOrdersModule)
  },
  {
    path: 'statistics',
    loadChildren: () => import(`./statistics/statistics.module`).then(module => module.StatisticsModule)
  },
  {
    path: 'services',
    loadChildren: () => import('./services/services.module').then(module => module.ServicesModule)
  },
  {
    path: 'activity-items',
    loadChildren: () => import('./activity-items/activity-items.module').then(module => module.ActivityItemsModule)
  },
  {
    path: 'testfilter',
    loadChildren: () => import('./testfilter/testfilter.module').then(module => module.TestFilterModule)
  },
  {
    path: 'customers',
    loadChildren: () => import('./customers/customers.module').then(module => module.CustomersModule)
  },
  {
    path: 'transactions-audit',
    loadChildren: () => import('./transaction-audit/transaction-audit.module').then(module => module.TransactionAuditModule)
  },
  {
    path: 'day-closure',
    loadChildren: () => import('./day-closure/day-closure.module').then(module => module.DayClosureModule)
  },
  // { path: '', redirectTo: 'home', pathMatch: 'full' },
  { path: 'customers-group', loadChildren: () => import('./customers-group/customers-group.module').then(m => m.CustomersGroupModule) },
  {
    path: 'gift-card',
    loadChildren: () => import('./import-gift-card/import-gift-card.module').then(module => module.ImportGiftCardModule)
  },
  {
    path: 'repair-order',
    loadChildren: () => import('./import-repair-order/import-repair-order.module').then(module => module.ImportRepairOrderModule)
  },
  { path: '', pathMatch: 'full', component: LoginCashRegisterComponent },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
