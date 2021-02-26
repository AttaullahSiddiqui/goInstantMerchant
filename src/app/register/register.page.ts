import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, NavigationExtras } from '@angular/router';
import { SignUpRequest } from 'src/models/auth-signup-request.models';
import { NavController, AlertController, ModalController } from '@ionic/angular';
import { UiElementsService } from '../services/common/ui-elements.service';
import { ApiService } from '../services/network/api.service';
import { TranslateService } from '@ngx-translate/core';
import { Helper } from 'src/models/helper.models';
import { SelectCountryPage } from '../select-country/select-country.page';

@Component({
  selector: 'app-register',
  templateUrl: './register.page.html',
  styleUrls: ['./register.page.scss']
})
export class RegisterPage implements OnInit {
  countries: any;
  phoneNumber: string;
  countryCode: string;
  phoneNumberFull: string;
  phoneNumberHint: string;
  countryCodeCountryText: string;
  signUpRequest = new SignUpRequest();

  constructor(private navCtrl: NavController, private uiElementService: UiElementsService,
    private apiService: ApiService, private route: ActivatedRoute, private modalController: ModalController,
    private translate: TranslateService, private alertCtrl: AlertController) { }

  ngOnInit() {
    this.changeHint();
    this.route.queryParams.subscribe(params => {
      let code = params["code"];
      let phone = params["phone"];
      let name = params["name"];
      let email = params["email"];
      if (code && code.length) this.countryCode = code;
      if (phone && phone.length) this.phoneNumber = phone;
      if (name && name.length) this.signUpRequest.name = name;
      if (email && email.length) this.signUpRequest.email = email;

      this.apiService.getCountries().subscribe(res => { this.countries = res; this.countryCode = this.countryCode; this.changeHint(true); });
    });
    this.apiService.getCountries().subscribe(res => { this.countries = res; this.changeHint(true); });
  }

  changeHint(clearPhoneSkip?: boolean) {
    this.phoneNumber = clearPhoneSkip ? this.phoneNumber : "";
    if (this.countryCode && this.countryCode.length) {
      for (let country of this.countries) if (country.callingCodes[0] && country.callingCodes[0] == this.countryCode) this.countryCodeCountryText = country.name;
      this.translate.get('enter_mobile_number_exluding').subscribe(value => this.phoneNumberHint = (value + " (+" + this.countryCode + ")"));
    } else {
      this.translate.get('enter_mobile_number').subscribe(value => this.phoneNumberHint = value);
    }
  }

  requestSignUp() {
    var reg = /^([A-Za-z0-9_\-\.])+\@([A-Za-z0-9_\-\.])+\.([A-Za-z]{2,4})$/;
    if (this.signUpRequest.name.length < 2) {
      this.translate.get("err_valid_name").subscribe(value => this.uiElementService.presentToast(value));
    } else if (this.signUpRequest.email.length <= 5 || !reg.test(this.signUpRequest.email)) {
      this.translate.get("err_valid_email").subscribe(value => this.uiElementService.presentToast(value));
    } else if (!this.countryCode || !this.countryCode.length || !this.phoneNumber || !this.phoneNumber.length) {
      this.translate.get("err_valid_phone").subscribe(value => this.uiElementService.presentToast(value));
    } else {
      this.alertPhone();
    }
  }

  alertPhone() {
    this.translate.get(['alert_phone', 'no', 'yes']).subscribe(text => {
      this.phoneNumberFull = "+" + this.countryCode + Helper.formatPhone(this.phoneNumber);
      this.alertCtrl.create({
        header: this.phoneNumberFull,
        message: text['alert_phone'],
        buttons: [{
          text: text['no'],
          role: 'cancel',
          handler: () => {
            console.log('Cancel clicked');
          }
        }, {
          text: text['yes'],
          handler: () => {
            this.signUpRequest.password = String(Math.floor(100000 + Math.random() * 900000));
            this.signUpRequest.mobile_number = this.phoneNumberFull;
            this.signUp();
          }
        }]
      }).then(alert => alert.present());
    });
  }

  navSelectCountry() {
    this.modalController.create({ component: SelectCountryPage, componentProps: { countryCode: this.countryCode } }).then((modalElement) => {
      modalElement.onDidDismiss().then(data => {
        if (data && data.data) { this.countryCode = data.data; this.changeHint(); }
      });
      modalElement.present();
    });
  }

  signUp() {
    this.translate.get('signing_up').subscribe(value => {
      this.uiElementService.presentLoading(value);

      this.apiService.createUser(this.signUpRequest).subscribe(res => {
        console.log(res);
        this.uiElementService.dismissLoading();

        let navigationExtras: NavigationExtras = { queryParams: { phoneNumberFull: res.user.mobile_number } };
        this.navCtrl.navigateForward(['./verification'], navigationExtras);
      }, err => {
        console.log(err);
        this.uiElementService.dismissLoading();
        let errMsg;
        this.translate.get(['invalid_credentials', 'invalid_credential_email', 'invalid_credential_phone', 'invalid_credential_password']).subscribe(value => {
          errMsg = value['invalid_credentials'];
          if (err && err.error && err.error.errors) {
            if (err.error.errors.email) {
              errMsg = value['invalid_credential_email'];
            } else if (err.error.errors.mobile_number) {
              errMsg = value['invalid_credential_phone'];
            } else if (err.error.errors.password) {
              errMsg = value['invalid_credential_password'];
            }
          }
          this.uiElementService.presentErrorAlert(errMsg);
        });
      });
    });
  }

}
