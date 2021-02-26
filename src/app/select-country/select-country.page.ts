import { Component, OnInit } from '@angular/core';
import { ModalController, NavParams } from '@ionic/angular';
import { ApiService } from '../services/network/api.service';
import { Country } from 'src/models/country.models';
import { TranslateService } from '@ngx-translate/core';
import { UiElementsService } from '../services/common/ui-elements.service';

@Component({
  selector: 'app-select-country',
  templateUrl: './select-country.page.html',
  styleUrls: ['./select-country.page.scss']
})
export class SelectCountryPage implements OnInit {
  countries = new Array<Country>();
  countryCodeSelected: string;

  constructor(private modalController: ModalController, private apiService: ApiService, private navParams: NavParams,
    private translate: TranslateService, private uiElementService: UiElementsService) { }

  ngOnInit() {
    this.countryCodeSelected = this.navParams.get('countryCode');
    this.apiService.getCountries().subscribe(res => this.countries = res);
  }

  dismiss() {
    this.modalController.dismiss();
  }

  navLogin() {
    if (!this.countryCodeSelected) {
      this.translate.get("select_country").subscribe(value => this.uiElementService.presentToast(value));
      return;
    }
    this.modalController.dismiss(this.countryCodeSelected);
  }

}
