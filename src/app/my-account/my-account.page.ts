import { Component, OnInit, Inject } from '@angular/core';
import { Router } from '@angular/router';
import { AlertController } from '@ionic/angular';
import { APP_CONFIG, AppConfig } from '../app.config';
import { Helper } from 'src/models/helper.models';
import { MyEventsService } from '../services/events/my-events.service';
import { TranslateService } from '@ngx-translate/core';
import { Profile } from 'src/models/profile.models';
import * as firebase from 'firebase';
import { InAppBrowser } from '@ionic-native/in-app-browser/ngx';
import { UiElementsService } from '../services/common/ui-elements.service';
import { ApiService } from '../services/network/api.service';

@Component({
  selector: 'app-my-account',
  templateUrl: './my-account.page.html',
  styleUrls: ['./my-account.page.scss']
})
export class MyAccountPage implements OnInit {
  profileMe: Profile;

  constructor(@Inject(APP_CONFIG) public config: AppConfig, private route: Router, private uiElementService: UiElementsService, private inAppBrowser: InAppBrowser,
    private apiService: ApiService, private myEvent: MyEventsService, private translate: TranslateService, private alertCtrl: AlertController) { }
  ngOnInit() {
  }
  ionViewDidEnter() {
    this.profileMe = Helper.getProfile();
  }
  store_profile() {
    this.route.navigate(['./store-profile']);
  }
  insight() {
    this.route.navigate(['./insight']);
  }
  wallet() {
    this.route.navigate(['./wallet']);
  }
  terms_conditions() {
    this.route.navigate(['./terms-conditions']);
  }
  support() {
    this.route.navigate(['./support']);
  }
  reviews() {
    this.route.navigate(['./reviews']);
  }
  settings() {
    this.route.navigate(['./settings']);
  }
  phone_number() {
    this.route.navigate(['./phone-number']);
  }

  navWhatsapp() {
    // let projectName = "foodoz";
    // this.http.get<any>("https://dashboard.vtlabs.dev/whatsapp.php?product_name=" + projectName, {
    //   headers: new HttpHeaders({ 'Accept': 'application/json', 'Content-Type': 'application/json' })
    // }).subscribe(res => {
    //   window.open(res['link'], '_system', 'location=no');
    // }, err => { });
  }
  logout() {
    this.translate.get(["logout_title", "logout_message", "no", "yes"]).subscribe(values => {
      this.alertCtrl.create({
        header: values["logout_title"],
        message: values["logout_message"],
        buttons: [{
          text: values["no"],
          handler: () => { }
        }, {
          text: values["yes"],
          handler: () => {
            try {
              (<any>window).FirebasePlugin.signOutUser(function () {
                console.log("User signed out");
              }, function (error) {
                console.error("Failed to sign out user: " + error);
              });
            } catch (e) { console.log("fireSignout", e); }

            try {
              firebase.auth().signOut().then(function () {
                console.log('Signed Out');
              }, function (error) {
                console.error('Sign Out Error', error);
              });
            } catch (e) { console.log("fireSignout", e); }
            Helper.setLoggedInUserResponse(null);
            this.myEvent.setLoginData(null);
          }
        }]
      }).then(alert => alert.present());
    });
  }

  buyAppAction() {
    this.translate.get("just_moment").subscribe(value => {
      this.uiElementService.presentLoading(value);
      this.apiService.getContactLink().subscribe(res => {
        this.uiElementService.dismissLoading();
        this.inAppBrowser.create((res.link ? res.link : "https://bit.ly/cc_Foodoz"), "_system");
      }, err => {
        console.log("getContactLink", err);
        this.uiElementService.dismissLoading();
        this.inAppBrowser.create("https://bit.ly/cc_Foodoz", "_system");
      });
    });
  }

  developed_by() {
    this.inAppBrowser.create("https://verbosetechlabs.com/", "_system");
  }
}
