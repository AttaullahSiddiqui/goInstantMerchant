import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { NavController, AlertController, Platform } from '@ionic/angular';
import { TranslateService } from '@ngx-translate/core';
import { UiElementsService } from '../services/common/ui-elements.service';
import { ApiService } from '../services/network/api.service';
import { Product } from 'src/models/product.models';
import { Category } from 'src/models/category.models';
import { FirebaseUploaderService } from '../services/network/firebase-uploader.service';
import { Subscription } from 'rxjs';
import { ProductRequest } from 'src/models/product-request.models';
import { Helper } from 'src/models/helper.models';
import { MyEventsService } from '../services/events/my-events.service';
import { IOSFilePicker } from '@ionic-native/file-picker/ngx';
import { Camera, CameraOptions } from '@ionic-native/camera/ngx';
import { Crop } from '@ionic-native/crop/ngx';

@Component({
  selector: 'app-edit-product',
  templateUrl: './edit-product.page.html',
  styleUrls: ['./edit-product.page.scss']
})
export class EditProductPage implements OnInit {
  private subscriptions = new Array<Subscription>();
  product: Product;
  productRequest = new ProductRequest();
  pageTitle: string;
  currency_icon: string;

  categoriesSelectedStrings = new Array<string>();
  categoriesSelectedStringsFormatted: string;
  categoryStrings = new Array<string>();
  private categories: Array<Category>;
  productQuantityStatus = true;

  constructor(private router: Router, private navCtrl: NavController, private translate: TranslateService, private alertCtrl: AlertController,
    private uiElementService: UiElementsService, private apiService: ApiService, private platform: Platform, private camera: Camera,
    private myEvent: MyEventsService, private iosFilePicker: IOSFilePicker, private cropService: Crop, private fireUpService: FirebaseUploaderService) {
    //setTimeout(() => this.productRequest.image_urls = ["https://static.toiimg.com/thumb/72279200.cms?width=680&height=512&imgsize=1077894"], 2000);
  }

  ngOnInit() {
    this.currency_icon = Helper.getSetting("currency_icon");
    if (this.router.getCurrentNavigation().extras.state) {
      this.product = this.router.getCurrentNavigation().extras.state.product;
      if (this.product != null) {
        console.log('procuct',this.product)
        if (this.product && this.product.title) this.productRequest.title = this.product.title;
        // this.productRequest.detail = this.product.detail;
        if (this.product && this.product.title) this.productRequest.price = this.product.price;
         this.productQuantityStatus = this.product.stock_quantity_status;
         this.productRequest.stock_quantity = this.productQuantityStatus ? "-1" : '0'
        if (this.product && this.product.meta && this.product.meta.food_type) this.productRequest.meta.food_type = (this.product.meta && this.product.meta.food_type) ? this.product.meta.food_type : "veg";
        // if (this.product.stock_quantity_status && this.product.vendor_products[0] && this.product.vendor_products[0].stock_quantity == 0) this.productRequest.stock_quantity = "0";
        if (this.product && this.product.categories && this.product.categories.length) for (let cat of this.product.categories) { this.productRequest.categories.push(cat.id); this.categoriesSelectedStrings.push(cat.title); }
        this.setCategoriesText();
        if (this.product && this.product.image_urls && this.product.image_urls.length) for (let img of this.product.image_urls) if (img != "assets/images/plc_no_item.png") this.productRequest.image_urls.push(img);
      }
    }

    let profile = Helper.getProfile();
    this.productRequest.vendor_id = profile.id;

    this.translate.get(this.product == null ? "create_item" : "edit_item").subscribe(value => this.pageTitle = value);

    this.translate.get("just_moment").subscribe(value => {
      this.uiElementService.presentLoading(value);
      this.subscriptions.push(this.apiService.getCategoriesChild(Helper.getProfile().categories).subscribe(res => {
        for (let cNew of res) this.categoryStrings.push(cNew.title);
        this.categories = res;
        this.uiElementService.dismissLoading();
      }, err => {
        console.log("getCategoriesParents", err);
        this.uiElementService.dismissLoading();
        this.navCtrl.pop();
      }));
    });
  }

  private setCategoriesText() {
    this.categoriesSelectedStringsFormatted = "";
    for (let ct of this.categoriesSelectedStrings) this.categoriesSelectedStringsFormatted += (ct + ", ");
    if (this.categoriesSelectedStringsFormatted.length) this.categoriesSelectedStringsFormatted = this.categoriesSelectedStringsFormatted.substring(0, this.categoriesSelectedStringsFormatted.length - 2);
  }

  changeProQuantity() {
    this.productRequest.stock_quantity = this.productQuantityStatus ? "-1" : '0';
    console.log('toggle', this.productRequest.stock_quantity);
  }

  onCategoriesChange() {
    this.setCategoriesText();
  }

  ngOnDestroy() {
    for (let sub of this.subscriptions) sub.unsubscribe();
    this.uiElementService.dismissLoading();
  }

  // categoryComparison(c1: Category, c2: Category) {
  //   return c1 && c2 ? c1.id === c2.id : c1 === c2;
  // }

  pickImage() {
    this.translate.get(["image_pic_header", "image_pic_subheader", "image_pic_camera", "image_pic_gallery"]).subscribe(values => {
      this.alertCtrl.create({
        header: values["image_pic_header"],
        message: values["image_pic_subheader"],
        buttons: [{
          text: values["image_pic_camera"],
          handler: () => {
            this.getImageCamera();
          }
        }, {
          text: values["image_pic_gallery"],
          handler: () => {
            this.getImageGallery();
          }
        }]
      }).then(alert => alert.present());
    });
  }

  getImageGallery() {
    const component = this;
    this.platform.ready().then(() => {
      if (this.platform.is("android")) {
        //{ "mime": "application/pdf" }  // text/plain, image/png, image/jpeg, audio/wav etc
        //(<any>window).fileChooser.open({ "mime": component.uploadType == 1 ? "image/jpeg" : "application/*" }, (uri) => component.resolveUri(uri), (err) => console.log("fileChooser", err)); // with mime filter
        (<any>window).fileChooser.open({ "mime": "image/*" }, (uri) => component.reduceImages(uri), (err) => console.log("fileChooser", err)); // with mime filter
      } else if (this.platform.is("ios")) {
        this.iosFilePicker.pickFile().then(uri => component.reduceImages(uri));
      }

      // if (this.platform.is("cordova")) {
      //   this.imagePicker.getPictures({
      //     maximumImagesCount: 1,
      //   }).then((results) => {
      //     if (results && results[0]) {
      //       if (this.imageType == 1) {
      //         this.reduceImages(results).then(() => console.log('cropped_images'));
      //       } else {
      //         this.uploadImage(results[0]);
      //       }
      //     }
      //   }, (err) => {
      //     console.log("getPictures", JSON.stringify(err));
      //   });
      // }
    });
  }

  reduceImages(selected_pictures: string) {
    // return selected_pictures.reduce((promise: any, item: any) => {
    //   return promise.then((result) => {
    //     return this.cropService.crop(item, { quality: 100 }).then(cropped_image => this.uploadImage(cropped_image));
    //   });
    // }, Promise.resolve());
    this.cropService.crop(selected_pictures, { quality: 100 }).then(cropped_image => this.uploadImage(cropped_image));
  }

  getImageCamera() {
    const options: CameraOptions = {
      quality: 75,
      destinationType: this.platform.is("android") ? this.camera.DestinationType.FILE_URI : this.camera.DestinationType.NATIVE_URI,
      encodingType: this.camera.EncodingType.JPEG,
      mediaType: this.camera.MediaType.PICTURE
    }
    this.camera.getPicture(options).then((imageData) => this.reduceImages(imageData), (err) => {
      this.translate.get('camera_err').subscribe(value => this.uiElementService.presentToast(value, "top"));
      console.log("getPicture", JSON.stringify(err));
    });
  }

  uploadImage(imageUri) {
    this.translate.get(["uploading_image", "uploading_fail"]).subscribe(values => {
      this.uiElementService.presentLoading(values["uploading_image"]);
      this.fireUpService.resolveUriAndUpload(imageUri).then(res => {
        console.log("resolveUriAndUpload", res);
        this.productRequest.image_urls.push(String(res));
        this.uiElementService.dismissLoading();
      }, err => {
        console.log("resolveUriAndUpload", err);
        this.uiElementService.dismissLoading();
        this.uiElementService.presentErrorAlert(values["uploading_fail"]);
      });
    });
  }

  confirmRemoveImage(index: number) {
    this.translate.get(["remove_img", "remove_img_desc", "no", "yes"]).subscribe(values => {
      this.alertCtrl.create({
        header: values["remove_img"],
        message: values["remove_img_desc"],
        buttons: [{
          text: values["no"],
          handler: () => { }
        }, {
          text: values["yes"],
          handler: () => {
            this.productRequest.image_urls.splice(index, 1);
          }
        }]
      }).then(alert => alert.present());
    });
  }

  saveProduct() {
    if (!this.productRequest.title || !this.productRequest.title.length) {
      this.translate.get("err_field_product_title").subscribe(value => this.uiElementService.presentToast(value));
    } else if (!this.categoriesSelectedStrings || !this.categoriesSelectedStrings.length) {
      this.translate.get("err_field_product_categories").subscribe(value => this.uiElementService.presentToast(value));
    } else if (!this.productRequest.meta.food_type || !this.productRequest.meta.food_type.length) {
      this.translate.get("err_field_product_food_type").subscribe(value => this.uiElementService.presentToast(value));
    } else if (!this.productRequest.price || Number(this.productRequest.price) < 0) {
      this.translate.get("err_field_product_price").subscribe(value => this.uiElementService.presentToast(value));
    } else {
      this.productRequest.categories = [];
      for (let cat of this.categories) if (this.categoriesSelectedStrings.includes(cat.title)) this.productRequest.categories.push(cat.id);

      let pur = {
        title: this.productRequest.title,
        detail: this.productRequest.detail,
        price: this.productRequest.price,
        vendor_id: this.productRequest.vendor_id,
        categories: this.productRequest.categories,
        image_urls: this.productRequest.image_urls,
        stock_quantity: this.productRequest.stock_quantity,
        meta: JSON.stringify(this.productRequest.meta)
      }
      this.translate.get(["saving"]).subscribe(values => {
        this.uiElementService.presentLoading(values["saving"]);
        this.subscriptions.push((this.product != null && this.product.id != null) ? this.apiService.updateProduct(this.product.id, pur).subscribe(res => this.handleRes(res), err => this.handleErr(err)) : this.apiService.createProduct(pur).subscribe(res => this.handleRes(res), err => this.handleErr(err)));
      });
    }
  }

  handleRes(res) {
    console.log("handleRes", res);
    // window.localStorage.setItem("refreshlist", "true");
    this.myEvent.setUpdatePoductData('true');
    this.navCtrl.pop();
    this.uiElementService.dismissLoading();
  }

  handleErr(err) {
    console.log("handleErr", err);
    this.translate.get("something_wrong").subscribe(value => this.uiElementService.presentToast(value));
    this.uiElementService.dismissLoading();
    this.navCtrl.pop();
  }

}

