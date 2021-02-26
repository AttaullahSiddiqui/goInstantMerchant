import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { SelectLanguagePage } from './select-language.page';

const routes: Routes = [
  {
    path: '',
    component: SelectLanguagePage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class SelectLanguagePageRoutingModule {}
