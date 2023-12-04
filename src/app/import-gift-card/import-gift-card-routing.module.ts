import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ImportGiftCardComponent } from './import-gift-card.component';

const routes: Routes = [
    { path: '', component: ImportGiftCardComponent, pathMatch: 'full' },
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class ImportGiftCardRoutingModule { }
