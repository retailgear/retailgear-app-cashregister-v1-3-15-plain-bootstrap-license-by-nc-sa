import { ComponentFactory, ComponentFactoryResolver, ComponentRef, NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { HomeRoutingModule } from './home-routing.module';
import { HomeComponent } from './home.component';
import { SharedModule } from '../shared/shared.module';


@NgModule({
  declarations: [
    HomeComponent,],
  imports: [
    CommonModule,
    HomeRoutingModule,
    SharedModule
  ],
  exports:[
    HomeComponent,
    HomeRoutingModule
  ],
  providers: [
  ],
  bootstrap: [
    HomeComponent
  ]
})
export class HomeModule {

  constructor(private componentFactoryResolver: ComponentFactoryResolver) {
  }

  public resolveComponent(): ComponentFactory<HomeComponent> {
    return this.componentFactoryResolver.resolveComponentFactory(HomeComponent);
  }

  public componentReference(){
    return HomeComponent;
  }
}
