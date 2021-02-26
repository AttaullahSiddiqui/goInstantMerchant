import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';

import { IonicModule } from '@ionic/angular';

import { PhoneNumberPageRoutingModule } from './phone-number-routing.module';

import { PhoneNumberPage } from './phone-number.page';
import { SelectCountryPageModule } from '../select-country/select-country.module';
import { Keyboard } from '@ionic-native/keyboard/ngx';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    TranslateModule,
    PhoneNumberPageRoutingModule,
    SelectCountryPageModule
  ], providers: [Keyboard],
  declarations: [PhoneNumberPage]
})
export class PhoneNumberPageModule { }
