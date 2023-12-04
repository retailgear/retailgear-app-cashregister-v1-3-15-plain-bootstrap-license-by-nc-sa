import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { FileUploadControl, FileUploadValidators } from '@iplab/ngx-file-upload';
import { NgxCsvParser, NgxCSVParserError } from 'ngx-csv-parser';
import { BehaviorSubject, Subscription } from 'rxjs';
import { ToastService } from '../../shared/components/toast';
import { faTimes } from '@fortawesome/free-solid-svg-icons';

@Component({
  selector: 'transaction-import-file-import',
  templateUrl: './transaction-file-import.component.html',
  styleUrls: ['./transaction-file-import.component.scss']
})
export class TransactionFileImportComponent implements OnInit, OnDestroy {

  delimiter: string = '';
  stepperIndex: any = 0;
  importForm: any;
  bDelimiter:boolean = false;

  @Input() parsedTransactionData!: Array<any>;
  @Output() parsedTransactionDataChange: EventEmitter<Array<any>> = new EventEmitter<Array<any>>();
  @Output() moveToStep: EventEmitter<any> = new EventEmitter();

  faTimes = faTimes;

  constructor(
    private csvParser: NgxCsvParser,
    private toasterService : ToastService
  ) { }

  
  private readonly _uploadedFile: BehaviorSubject<any> = new BehaviorSubject(null);
  public get uploadedFile(): BehaviorSubject<any> {
    return this._uploadedFile;
  }

  private subscription!: Subscription;

  public readonly control = new FileUploadControl(
    { listVisible: true, accept: ['text/csv'], discardInvalid: true, multiple: false },
    FileUploadValidators.filesLimit(1)
    //  OLD JSON 
    // { listVisible: true, accept: ['text/JSON'], discardInvalid: true, multiple: false },
    // FileUploadValidators.filesLimit(1)
  );

  ngOnInit(): void {
    this.subscription = this.control.valueChanges.subscribe((values: Array<File>) => {
      if(values && values.length > 0){
        this.csvParser.parse(values[0], { header: true, delimiter: this.delimiter})
          .pipe().subscribe((result: any) => {
            if (result.length) {
              this.parsedTransactionData = result;
              this.parsedTransactionDataChange.emit(this.parsedTransactionData);
              this.bDelimiter = true;
            }
          }, (error: NgxCSVParserError) => {
            this.toasterService.show({ type: 'danger', text: 'Upload csv file'});
            this.parsedTransactionData = [];
            this.parsedTransactionDataChange.emit(this.parsedTransactionData);
          });
      } else {
        this.parsedTransactionData = [];
        this.parsedTransactionDataChange.emit(this.parsedTransactionData);
      } 

      //OLD JSON
      //   let reader : any = new FileReader();
      //   let data : Array<any> = [];
      //   let self = this;
      //   reader.onload = function(){
      //     data = JSON.parse(reader.result);
      //     if (data.length) {
      //       self.parsedTransactionData = data;
      //       self.parsedTransactionDataChange.emit(self.parsedTransactionData);
      //     }
      //   }
      //   reader.readAsText(values[0]);
      //   this.bDelimiter = true;
      // } else {
      //   this.parsedTransactionData = [];
      //   this.parsedTransactionDataChange.emit(this.parsedTransactionData);
      // }

    });
  }

  public ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  // Function for go to next step
  nextStep(step: string){
    const tempData = JSON.parse(JSON.stringify(this.parsedTransactionData));
    this.control.setValue([]);
    this.delimiter = '';
    this.bDelimiter = false;
    this.moveToStep.emit(step);
    this.parsedTransactionData = tempData;
    this.parsedTransactionDataChange.emit(this.parsedTransactionData);
  }

  // Function for validate file import
  validateImport() : boolean{
    return !this.bDelimiter || !this.parsedTransactionData.length;
  }
}
