import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ImageAndDocumentsDialogComponent } from './image-and-documents-dialog.component';

describe('ImagesAndDocumentsDialogComponent', () => {
  let component: ImageAndDocumentsDialogComponent;
  let fixture: ComponentFixture<ImageAndDocumentsDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ImageAndDocumentsDialogComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ImageAndDocumentsDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
