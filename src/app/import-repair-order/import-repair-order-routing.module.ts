import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ImportRepairOrderComponent } from './import-repair-order.component';

const routes: Routes = [
    { path: '', component: ImportRepairOrderComponent, pathMatch: 'full' },
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class ImportRepairOrderRoutingModule { }