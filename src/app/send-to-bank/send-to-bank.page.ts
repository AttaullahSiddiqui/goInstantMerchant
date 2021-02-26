import { Component, OnInit, OnDestroy } from '@angular/core';
import { Helper } from 'src/models/helper.models';
import { Subscription } from 'rxjs';
import { NavController } from '@ionic/angular';
import { TranslateService } from '@ngx-translate/core';
import { UiElementsService } from '../services/common/ui-elements.service';
import { ApiService } from '../services/network/api.service';
import { PayoutRequest } from 'src/models/payout-request.models';

@Component({
  selector: 'app-send-to-bank',
  templateUrl: './send-to-bank.page.html',
  styleUrls: ['./send-to-bank.page.scss']
})
export class SendToBankPage implements OnInit, OnDestroy {
  private subscriptions = new Array<Subscription>();
  currency_icon: string;
  balance = 0;
  payourRequest = new PayoutRequest();

  constructor(private navCtrl: NavController, private translate: TranslateService,
    private uiElementService: UiElementsService, private apiService: ApiService) { }

  ngOnInit() {
    this.currency_icon = Helper.getSetting("currency_icon");
    this.refreshBalance();
  }

  ngOnDestroy() {
    for (let sub of this.subscriptions) sub.unsubscribe();
    this.uiElementService.dismissLoading();
  }

  refreshBalance() {
    this.subscriptions.push(this.apiService.getBalance().subscribe(res => this.balance = res.balance, err => console.log("getBalance", err)));
  }

  submit() {
    if (!this.payourRequest.bank_name || !this.payourRequest.bank_name.length) {
      this.translate.get("err_field_bank_name").subscribe(value => this.uiElementService.presentToast(value));
    } else if (!this.payourRequest.bank_account_name || !this.payourRequest.bank_account_name.length) {
      this.translate.get("err_field_bank_account_name").subscribe(value => this.uiElementService.presentToast(value));
    } else if (!this.payourRequest.bank_account_number || !this.payourRequest.bank_account_number.length) {
      this.translate.get("err_field_bank_account_number").subscribe(value => this.uiElementService.presentToast(value));
    } else if (!this.payourRequest.bank_code || !this.payourRequest.bank_code.length) {
      this.translate.get("err_field_bank_code").subscribe(value => this.uiElementService.presentToast(value));
    } else if (!this.payourRequest.amount || (this.payourRequest.amount > this.balance || this.payourRequest.amount < 0)) {
      this.translate.get("err_field_amount").subscribe(value => this.uiElementService.presentToast(value));
    } else {
      this.translate.get(["just_moment", "something_wrong"]).subscribe(values => {
        this.uiElementService.presentLoading(values["just_moment"]);
        this.subscriptions.push(this.apiService.walletTransfer(this.payourRequest).subscribe(res => {
          Helper.setBankDetail({
            bank_name: this.payourRequest.bank_name,
            bank_account_name: this.payourRequest.bank_account_name,
            bank_account_number: this.payourRequest.bank_account_number
          });
          this.uiElementService.dismissLoading();
          this.navCtrl.pop();
        }, err => {
          console.log("updateOrder", err);
          this.uiElementService.presentToast(values["something_wrong"]);
          this.uiElementService.dismissLoading();
          this.navCtrl.pop();
        }));
      });
    }
  }

}
