import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SelectArticleDialogComponent } from './select-articlegroup-dialog.component';

describe('TerminalDialogComponent', () => {
  let component: SelectArticleDialogComponent;
  let fixture: ComponentFixture<SelectArticleDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [SelectArticleDialogComponent]
    })
      .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(SelectArticleDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
