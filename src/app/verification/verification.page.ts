import { Component, OnInit } from '@angular/core';
import { NavController, Platform } from '@ionic/angular';
import { ActivatedRoute } from '@angular/router';
import { UiElementsService } from '../services/common/ui-elements.service';
import { MyEventsService } from '../services/events/my-events.service';
import { ApiService } from '../services/network/api.service';
import { TranslateService } from '@ngx-translate/core';
import { Constants } from 'src/models/constants.models';
import * as firebase from 'firebase/app';

@Component({
  selector: 'app-verification',
  templateUrl: './verification.page.html',
  styleUrls: ['./verification.page.scss']
})
export class VerificationPage implements OnInit {
  private recaptchaVerifier: firebase.auth.RecaptchaVerifier;
  private captchanotvarified: boolean = true;
  private result: any;
  private buttonDisabled: any = true;
  private component: any;
  private captchaVerified: boolean = false;
  private verfificationId: any;
  private timer: any;
  private minutes: number = 0;
  private seconds: number = 0;
  private totalSeconds: number = 0;
  private intervalCalled: boolean = false;
  private dialCode: string;
  private resendCode: boolean = false;
  private otpNotSent: boolean = true;
  private credential: any;

  phoneNumberFull: string;
  otp = "";
  showOTPTimmer: string;
  

  constructor(private route: ActivatedRoute, private uiElementService: UiElementsService, private myEvent: MyEventsService,
    private platform: Platform, private apiService: ApiService, private translate: TranslateService, private navCtrl: NavController) {
    this.route.queryParams.subscribe(params => this.phoneNumberFull = params["phoneNumberFull"]);
  }

  ngOnInit() {
    if (!(this.platform.is('cordova'))) {
      this.makeCaptcha();
    }
    this.sendOTP();
  }

  resendOTP(){
    if(this.resendCode){
      this.sendOTP();
    }
  }

  loginUser(token) {
    this.translate.get('just_moment').subscribe(value => {
      this.uiElementService.presentLoading(value);

      this.apiService.loginUser({ token: token, role: Constants.ROLE_VENDOR }).subscribe(res => {
        this.uiElementService.dismissLoading();
        this.myEvent.setLoginData(res);
        this.navCtrl.pop();
      }, err => {
        console.log(err);
        this.uiElementService.dismissLoading();
        this.uiElementService.presentErrorAlert((err && err.error && err.error.message && String(err.error.message).toLowerCase().includes("role")) ? "User exists with different role" : "Something went wrong");
      });
    });
  }

  getUserToken(user) {
    user.getIdToken(false).then(res => {
      console.log('user_token_success', res);
      this.loginUser(res);
    }).catch(err => {
      console.log('user_token_failure', err);
    });
  }

  sendOTP() {
    this.resendCode = false;
    this.otpNotSent = true;
    if (this.platform.is('cordova')) {
      this.sendOtpPhone(this.phoneNumberFull);
    } else {
      this.sendOtpBrowser(this.phoneNumberFull);
    }
    if (this.intervalCalled) {
      clearInterval(this.timer);
    }
  }

  createTimer() {
    this.intervalCalled = true;
    this.totalSeconds--;
    if (this.totalSeconds == 0) {
      this.otpNotSent = true;
      this.resendCode = true;
      this.showOTPTimmer = "00:00";
      clearInterval(this.timer);
    } else {
      this.seconds = (this.totalSeconds % 60);
      if (this.totalSeconds >= this.seconds) {
        this.minutes = (this.totalSeconds - this.seconds) / 60
      } else {
        this.minutes = 0;
      }
      this.showOTPTimmer = ("0" + this.minutes).slice(-2) + ":" + ("0" + this.seconds).slice(-2)
    }
  }

  createInterval() {
    this.totalSeconds = 120;
    this.createTimer();
    this.timer = setInterval(() => {
      this.createTimer();
    }, 1000);
  }

  sendOtpPhone(phone) {
    const component = this;
    this.translate.get('sending_otp').subscribe(value => {
      this.uiElementService.presentLoading(value);

      (<any>window).FirebasePlugin.verifyPhoneNumber(function (credential) {
        component.uiElementService.dismissLoading();
        console.log("verifyPhoneNumber", JSON.stringify(credential));
        //component.verfificationId = credential.instantVerification ? credential.id : credential.verificationId;
        component.credential = credential;
        if (credential.instantVerification) {
          component.translate.get("verifying_otp_auto").subscribe(value => component.uiElementService.presentToast(value));
          component.verifyOtpPhone();
        } else {
          component.translate.get("sending_otp_success").subscribe(value => component.uiElementService.presentToast(value));
          component.otpNotSent = false;
          component.createInterval();
        }
        // component.translate.get("otp_sent").subscribe(value => {
        //   component.global.showToast(value);
        // });
        // component.otpNotSent = false;
        // component.createInterval(); 
      }, function (error) {
        console.log("otp_send_fail", error);
        component.otpNotSent = true;
        component.resendCode = true;
        component.uiElementService.dismissLoading();
        component.translate.get('sending_otp_fail').subscribe(text => component.uiElementService.presentToast(text));
      }, phone, 60);
    });
  }

  sendOtpBrowser(phone) {
    const component = this;
    this.uiElementService.dismissLoading();
    this.uiElementService.presentLoading(this.translate.instant('sending_otp'));
    firebase.auth().signInWithPhoneNumber(phone, this.recaptchaVerifier).then((confirmationResult) => {
      console.log("otp_send_success", confirmationResult);
      component.otpNotSent = false;
      component.result = confirmationResult;
      component.uiElementService.dismissLoading();
      component.uiElementService.presentToast("OTP Sent");
      if (component.intervalCalled) {
        clearInterval(component.timer);
      }
      component.createInterval();
    }).catch(function (error) {
      console.log("otp_send_fail", error);
      component.resendCode = true;
      component.uiElementService.dismissLoading();
      if (error.message) {
        component.uiElementService.presentToast(error.message);
      } else {
        component.uiElementService.presentToast(this.translate.instant('OTP_Sending_failed'));
      }
    });
  }

  verify() {
    this.otpNotSent = true;
    if (this.platform.is('cordova')) {
      this.credential.code = String(this.otp);
      this.verifyOtpPhone();
    } else {
      this.verifyOtpBrowser();
    }
  }

  retryOld(credential) {
    //const credential = firebase.auth.PhoneAuthProvider.credential(this.verfificationId, this.otp);
    this.translate.get('verifying_otp').subscribe(value => {
      this.uiElementService.presentLoading(value);

      firebase.auth().signInAndRetrieveDataWithCredential(credential).then((info) => {
        console.log('otp_verify_success', info);
        this.uiElementService.dismissLoading();
        this.translate.get('verifying_otp_success').subscribe(value => this.uiElementService.presentToast(value));
        this.getUserToken(info.user);
      }, (error) => {
        console.log('otp_verify_fail', error);
        this.translate.get('verifying_otp_fail').subscribe(value => this.uiElementService.presentToast(value));
        this.uiElementService.dismissLoading();
      })
    });
  }

  verifyOtpPhone() {
    const component = this;
    this.translate.get('verifying_otp').subscribe(text => {
      this.uiElementService.presentLoading(text);
      console.log("credential", component.credential);
      (<any>window).FirebasePlugin.signInWithCredential(component.credential, function () {
        console.log("signInWithCredential");
        (<any>window).FirebasePlugin.getCurrentUser(function (user) {
          component.uiElementService.dismissLoading();
          console.log("getCurrentUser", JSON.stringify(user));
          component.translate.get('otp_verified').subscribe(text => component.uiElementService.presentToast(text));
          component.loginUser(user.idToken);
        }, function (error) {
          component.uiElementService.dismissLoading();
          console.log("getCurrentUser", JSON.stringify(error));
          component.translate.get('verify_otp_err').subscribe(text => component.uiElementService.presentToast(text));
        });
      }, function (error) {
        console.error("signInWithCredential", error);
        component.uiElementService.dismissLoading();
        component.retryOld(firebase.auth.PhoneAuthProvider.credential(component.credential.id, component.otp));
        component.translate.get('verify_otp_err').subscribe(text => component.uiElementService.presentToast(text));
      });
    });
  }

  verifyOtpBrowser() {
    const component = this;
    this.uiElementService.presentLoading(this.translate.instant('verifying_otp'));
    this.result.confirm(String(this.otp)).then(function (response) {
      console.log('otp_verify_success', response);
      component.uiElementService.dismissLoading();
      component.uiElementService.presentToast("OTP Verified");
      component.getUserToken(response.user);
    }).catch(function (error) {
      console.log('otp_verify_fail', error);
      if (error.message) {
        component.uiElementService.presentToast(error.message);
      } else {
        component.uiElementService.presentToast("OTP Verification failed");
      }
      component.uiElementService.dismissLoading();
    });
  }

  makeCaptcha() {
    const component = this;
    this.recaptchaVerifier = new firebase.auth.RecaptchaVerifier('recaptcha-container', {
      // 'size': 'normal',
      'size': 'invisible',
      'callback': function (response) {
        component.captchanotvarified = true;
        // reCAPTCHA solved, allow signInWithPhoneNumber.
      }
    });
    this.recaptchaVerifier.render();
  }

}
