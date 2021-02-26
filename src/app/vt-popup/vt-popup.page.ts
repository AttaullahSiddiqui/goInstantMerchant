import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { ModalController, NavController } from '@ionic/angular';
import { UiElementsService } from '../services/common/ui-elements.service';

@Component({
  selector: 'app-vt-popup',
  templateUrl: './vt-popup.page.html',
  styleUrls: ['./vt-popup.page.scss'],
})
export class VtPopupPage implements OnInit {
  loading: any;
  loadingShown: boolean;
  email_Id: string = '';

  constructor(public navCtrl: NavController, public modalCtrl: ModalController, private modalController: ModalController,
    private http: HttpClient,private uiElementService: UiElementsService,) {

  }

  ngOnInit() {
  }

  dismiss() {
    this.modalController.dismiss();
  }
  
  onSubscribe() {
    var reg = /^([A-Za-z0-9_\-\.])+\@([A-Za-z0-9_\-\.])+\.([A-Za-z]{2,4})$/;
    if (this.email_Id.length <= 5 || !reg.test(this.email_Id)) {
      return this.uiElementService.presentToast('Please provide your Email.')
    }
    this.uiElementService.presentLoading('Sending...')
    let req = {
      "email": this.email_Id,
      "source": "opus_application_foodoz"
    }
    this.http.post("https://dashboard.vtlabs.dev/api/subscribe", req).subscribe((res) => {
      this.uiElementService.presentToast('Submitted successfully.')
      this.modalController.dismiss();
      this.uiElementService.dismissLoading();
    })
  }
}
