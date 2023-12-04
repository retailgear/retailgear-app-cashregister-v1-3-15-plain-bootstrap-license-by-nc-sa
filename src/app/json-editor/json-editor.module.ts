import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { JsonEditorComponent } from './json-editor.component';
import { NgJsonEditorModule } from '@maaxgr/ang-jsoneditor'

@NgModule({
  imports: [
    CommonModule, NgJsonEditorModule
  ],
  declarations: [JsonEditorComponent],
  exports: [JsonEditorComponent]
})
export class JsonEditorModule {


}
