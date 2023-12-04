import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { FileUploadControl, FileUploadValidators } from '@iplab/ngx-file-upload';
import { NgxCsvParser, NgxCSVParserError } from 'ngx-csv-parser';
import { BehaviorSubject, Subscription } from 'rxjs';
import { ToastService } from 'src/app/shared/components/toast';
import { faTimes } from '@fortawesome/free-solid-svg-icons';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'import-file-import',
  templateUrl: './file-import.component.html',
  styleUrls: ['./file-import.component.sass']
})
export class FileImportComponent implements OnInit, OnDestroy {

  delimiter: string = ';';
  stepperIndex: any = 0;
  importForm: any;

  @Input() parsedCustomerData!: Array<any>;
  @Output() parsedCustomerDataChange: EventEmitter<Array<any>> = new EventEmitter<Array<any>>();
  @Output() moveToStep: EventEmitter<any> = new EventEmitter();

  faTimes = faTimes;

  constructor(
    private csvParser: NgxCsvParser,
    private toasterService : ToastService ,
    private translation:TranslateService
  ) { }

  
  private readonly _uploadedFile: BehaviorSubject<any> = new BehaviorSubject(null);
  public get uploadedFile(): BehaviorSubject<any> {
    return this._uploadedFile;
  }

  private subscription!: Subscription;

  public readonly control = new FileUploadControl(
      { listVisible: true, accept: ['text/csv'], discardInvalid: true, multiple: false },
      FileUploadValidators.filesLimit(1)
  );

  ngOnInit(): void {
    this.subscription = this.control.valueChanges.subscribe((values: Array<File>) => {
      if(values && values.length > 0){
        this.csvParser.parse(values[0], { header: true, delimiter: this.delimiter})
          .pipe().subscribe((result: any) => {
       
            this.parsedCustomerData = result;
            this.parsedCustomerDataChange.emit(this.parsedCustomerData);
          }, (error: NgxCSVParserError) => {
            this.toasterService.show({ type: 'danger', text: 'Upload csv file'});
            this.parsedCustomerData = [];
            this.parsedCustomerDataChange.emit(this.parsedCustomerData);
          });
      } else {
        this.parsedCustomerData = [];
        this.parsedCustomerDataChange.emit(this.parsedCustomerData);
      }  
    });
  }

  public ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  // Function for go to next step
  nextStep(step: string){
    this.moveToStep.emit(step);
  }

  // Function for validate file import
  validateImport() : boolean{
    return this.delimiter.trim() == '' || this.parsedCustomerData.length == 0;
  }
}
