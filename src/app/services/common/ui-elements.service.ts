import { Injectable } from '@angular/core';
import { ToastController, LoadingController, AlertController } from '@ionic/angular';
import { TranslateService } from '@ngx-translate/core';

@Injectable({
  providedIn: 'root'
})
export class UiElementsService {
  private isLoading: boolean;


  constructor(private toastController: ToastController, private loadingController: LoadingController,
    private alertCtrl: AlertController, private translateService: TranslateService) { }

  presentToast(body: string, position?: string, duration?: number) {
    this.toastController.create({
      message: body,
      duration: (duration && duration > 0) ? duration : 2000,
      position: (position && (position == "bottom" || position == "middle")) ? position : 'top'
    }).then(toast => toast.present());
  }

  presentErrorAlert(msg: string, headingText?: string, actionText?: string) {
    this.translateService.get(["error", "dismiss"]).subscribe(values => {
      this.alertCtrl.create({
        header: (headingText ? headingText : values["error"]),
        message: msg,
        buttons: [(actionText ? actionText : values["dismiss"])]
      }).then(alert => alert.present());
    });
  }

  async presentLoading(body: string) {
    this.isLoading = true;
    return await this.loadingController.create({ message: body }).then(overlay => {
      overlay.present().then(() => {
        if (!this.isLoading) {
          try {
            overlay.dismiss().then(() => console.log('loading aborted'));
          } catch (error) {
            console.log(error);
          }
        }
      });
    });
  }

  async dismissLoading() {
    this.isLoading = false;
    try {
      return await this.loadingController.dismiss();
    } catch (error) {
      console.log(error);
      return null;
    }
  }

}
