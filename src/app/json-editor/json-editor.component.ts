import { AfterViewInit, Component, Input, OnInit, ViewChild } from '@angular/core';
import { JsonEditorOptions, JsonEditorComponent as JsonEditorComponent2 } from "ang-jsoneditor";

@Component({
  selector: 'app-json-editor',
  templateUrl: './json-editor.component.html',
  styleUrls: ['./json-editor.component.scss'],
})
export class JsonEditorComponent implements OnInit {

  public editorOptions: JsonEditorOptions;
  @Input() initialData: any;
  public jsonData: any;
  @ViewChild('editor') editor !: JsonEditorComponent2;

  constructor() {
    this.editorOptions = new JsonEditorOptions()
    this.editorOptions.modes = ['code', 'text', 'tree', 'view', 'form'];
    this.editorOptions.mode = 'code';

  }
  ngOnInit() {
    this.jsonData = this.initialData;

  }
  showJson(d: Event) {
    this.jsonData = this.editor.get();
  }

}
