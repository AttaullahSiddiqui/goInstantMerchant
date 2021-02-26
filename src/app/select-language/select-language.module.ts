import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
 
import { IonicModule } from '@ionic/angular';

import { SelectLanguagePageRoutingModule } from './select-language-routing.module';

import { SelectLanguagePage } from './select-language.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    TranslateModule,   
    SelectLanguagePageRoutingModule
  ],
  declarations: [SelectLanguagePage]
})
export class SelectLanguagePageModule {}
