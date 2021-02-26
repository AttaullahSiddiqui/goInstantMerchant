import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { SupportRequest } from 'src/models/support-request.models';
import { NavController } from '@ionic/angular';
import { TranslateService } from '@ngx-translate/core';
import { UiElementsService } from '../services/common/ui-elements.service';
import { ApiService } from '../services/network/api.service';
import { Helper } from 'src/models/helper.models';

@Component({
  selector: 'app-support',
  templateUrl: './support.page.html',
  styleUrls: ['./support.page.scss']
})
export class SupportPage implements OnInit {
  private subscriptions = new Array<Subscription>();
  supportRequest: SupportRequest;

  constructor(private navCtrl: NavController, private translate: TranslateService,
    private uiElementService: UiElementsService, private apiService: ApiService) {
    let userMe = Helper.getLoggedInUser();
    this.supportRequest = new SupportRequest(userMe.name, userMe.email, userMe.mobile_number);
  }

  ngOnInit() { }

  ngOnDestroy() {
    for (let sub of this.subscriptions) sub.unsubscribe();
    this.uiElementService.dismissLoading();
  }

  submit() {
    if (this.supportRequest && this.supportRequest.message) {
      this.translate.get(["supporting", "supporting_success", "something_wrong"]).subscribe(values => {
        this.uiElementService.presentLoading(values["supporting"]);
        this.subscriptions.push(this.apiService.submitSupport(this.supportRequest).subscribe(res => {
          this.uiElementService.dismissLoading();
          this.uiElementService.presentToast(values["supporting_success"]);
          this.navCtrl.navigateRoot(["./tabs/my_orders"]);
        }, err => {
          console.log("submitSupport", err);
          this.uiElementService.dismissLoading();
          this.uiElementService.presentToast(values["something_wrong"]);
        }));
      });
    } else {
      this.translate.get("err_valid_support_msg").subscribe(value => this.uiElementService.presentToast(value));
    }
  }
}
