import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';

import { SelectLanguagePage } from './select-language.page';

describe('SelectLanguagePage', () => {
  let component: SelectLanguagePage;
  let fixture: ComponentFixture<SelectLanguagePage>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ SelectLanguagePage ],
      imports: [IonicModule.forRoot()]
    }).compileComponents();

    fixture = TestBed.createComponent(SelectLanguagePage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
