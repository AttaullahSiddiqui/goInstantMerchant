import { Component, OnInit, OnDestroy, ElementRef, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { ModalController, AlertController } from '@ionic/angular';
import { ChatCustomerPage } from '../chat-customer/chat-customer.page';
import { Order } from 'src/models/order.models';
import { NavController } from '@ionic/angular';
import { TranslateService } from '@ngx-translate/core';
import { UiElementsService } from '../services/common/ui-elements.service';
import { ApiService } from '../services/network/api.service';
import { CallNumber } from '@ionic-native/call-number/ngx';
import { GoogleMapsService } from '../services/network/google-maps.service';
import { Subscription } from 'rxjs';
import { MyAddress } from 'src/models/address.models';
import { Chat } from 'src/models/chat.models';
import { Constants } from 'src/models/constants.models';
import { User } from 'src/models/user.models';
import { Message } from 'src/models/message.models';
import { Helper } from 'src/models/helper.models';
import createHTMLMapMarker from '../../assets/scripts/html-map-marker.js';
import * as firebase from 'firebase/app';

@Component({
  selector: 'app-order-info',
  templateUrl: './order-info.page.html',
  styleUrls: ['./order-info.page.scss']
})
export class OrderInfoPage implements OnInit, OnDestroy {
  @ViewChild("pleaseConnect", { static: true }) pleaseConnect: ElementRef;
  @ViewChild("map", { static: true }) mapElement: ElementRef;
  viewType: string;
  viewTypeB: string;
  private subscriptions = new Array<Subscription>();
  order: Order;
  canUpdate = true;

  private initialized = false;
  private markerDeliveryGuy;
  private posDeliveryGuy;
  private numDeltas = 100;
  private delay = 10; //milliseconds
  private i = 0;
  private deltaLat;
  private deltaLng;
  private lastToPos = [0, 0];

  @ViewChild("myContentInner", { static: true }) myContentInner: any;
  userMe: User;
  chatChild: string;
  userPlayerId: string;
  newMessageText: string;
  chatRef: firebase.database.Reference;
  inboxRef: firebase.database.Reference;
  messages = new Array<Message>();
  chatObj = new Chat();

  constructor(private router: Router, private navCtrl: NavController, private translate: TranslateService,
    private modalController: ModalController, private alertCtrl: AlertController, private callNumber: CallNumber,
    private uiElementService: UiElementsService, private apiService: ApiService, private maps: GoogleMapsService) { }

  ngOnInit() {
    if (this.router.getCurrentNavigation().extras.state) this.order = this.router.getCurrentNavigation().extras.state.order;
    this.canUpdate = this.isOrderUpdateable();
  }

  ngOnDestroy() {
    for (let sub of this.subscriptions) sub.unsubscribe();
    this.uiElementService.dismissLoading();
  }

  ionViewDidEnter() {
    if (!this.initialized) {
      let address = new MyAddress();
      address.latitude = this.order.vendor.latitude;
      address.longitude = this.order.vendor.longitude;
      let mapLoaded = this.maps.init(this.mapElement.nativeElement, this.pleaseConnect.nativeElement, address).then(() => {
        this.initialized = true;
        this.plotMarkers();
        this.registerUpdates();
      }).catch(err => { console.log("maps.init", err); });
      mapLoaded.catch(err => { console.log("mapLoaded", err); });
    }
  }

  private plotMarkers() {
    let posMe = new google.maps.LatLng(Number(this.order.vendor.latitude), Number(this.order.vendor.longitude));
    let markerMe = new google.maps.Marker({
      position: posMe, map: this.maps.map
      //, icon: 'assets/images/marker_map_me.png'
    });
    markerMe.addListener('click', (event) => this.uiElementService.presentToast(this.order.vendor.name));

    let posCustomer = new google.maps.LatLng(Number(this.order.address.latitude), Number(this.order.address.longitude));
    let markerCustomer = createHTMLMapMarker({
      latlng: posCustomer,
      map: this.maps.map,
      html: '<div id="doctor_map"><img src="' + this.order.user.image_url + '"></div>'
    });
    markerCustomer.addListener('click', (event) => this.uiElementService.presentToast(this.order.user.name));

    let directionsService = new google.maps.DirectionsService();
    let directionsDisplay = new google.maps.DirectionsRenderer({
      map: this.maps.map,
      polylineOptions: {
        strokeColor: '#279411',
        strokeOpacity: 1.0,
        strokeWeight: 5
      },
      markerOptions: {
        opacity: 0,
        clickable: false,
        position: markerCustomer
      }
    });
    let dirReq: any = {
      origin: posMe,
      destination: posCustomer,
      travelMode: google.maps.TravelMode.DRIVING
    };
    directionsService.route(dirReq, function (result, status) {
      if (status == google.maps.DirectionsStatus.OK) {
        directionsDisplay.setDirections(result);
      }
    });

    if (this.order.delivery && this.order.delivery.delivery.latitude && this.order.delivery.delivery.longitude) {
      this.posDeliveryGuy = new google.maps.LatLng(Number(this.order.delivery.delivery.latitude), Number(this.order.delivery.delivery.longitude));
      this.markerDeliveryGuy = createHTMLMapMarker({
        latlng: this.posDeliveryGuy,
        map: this.maps.map,
        html: '<div id="doctor_map"><img src="' + this.order.delivery.delivery.user.image_url + '"></div>'
      });
      this.markerDeliveryGuy.addListener('click', (event) => this.uiElementService.presentToast(this.order.delivery.delivery.user.name));
    }
  }

  private registerUpdates() {
    if (this.order.delivery && this.order.delivery.delivery.latitude && this.order.delivery.delivery.longitude) {
      //location updates
      this.updatesLocation();
      //chat updates
      this.updatesChat();
    }
  }

  private updatesLocation() {
    const component = this;
    firebase.database().ref("deliveries").child(String(this.order.delivery.delivery.id)).child("location").on('child_changed', function (data) {
      var fireLocation = data.val() as { latitude: string, longitude: string };
      if (fireLocation.latitude != null && fireLocation.longitude != null) component.onNewLocation(new google.maps.LatLng(Number(fireLocation.latitude), Number(fireLocation.longitude)));
    });
  }

  private updatesChat() {
    let chat = new Chat();
    chat.chatId = this.order.delivery.delivery.user.id + Constants.ROLE_DELIVERY;
    chat.chatImage = this.order.delivery.delivery.user.image_url;
    chat.chatName = this.order.delivery.delivery.user.name;
    chat.chatStatus = this.translate.instant("delivery_partner");
    chat.myId = this.order.vendor.user_id + Constants.ROLE_VENDOR;

    this.chatObj = chat;

    this.userMe = Helper.getLoggedInUser();
    this.chatChild = Helper.getChatChild(this.chatObj.myId, this.chatObj.chatId);

    const component = this;
    this.inboxRef = firebase.database().ref(Constants.REF_INBOX);
    this.chatRef = firebase.database().ref(Constants.REF_CHAT);
    this.chatRef.child(this.chatChild).limitToLast(20).on("child_added", function (snapshot, prevChildKey) {
      var newMessage = snapshot.val() as Message;
      if (newMessage) {
        newMessage.timeDiff = Helper.formatMillisDateTime(Number(newMessage.dateTimeStamp), Helper.getLocale());
        component.addMessage(newMessage);
        component.markDelivered();
        component.scrollList();
      }
    }, function (error) {
      console.error("child_added", error);
    });

    firebase.database().ref(Constants.REF_USERS_FCM_IDS).child(this.chatObj.chatId).once("value", function (snap) {
      component.userPlayerId = snap.val();
    });

    this.translate.get("just_moment").subscribe(value => this.uiElementService.presentToast(value));
  }

  scrollList() {
    try {
      this.myContentInner.scrollToBottom(300);
    } catch (error) {
      console.log(error);
    }
  }

  markDelivered() {
    if (this.messages && this.messages.length) {
      if (this.messages[this.messages.length - 1].senderId != this.chatObj.myId) {
        this.messages[this.messages.length - 1].delivered = true;
        this.chatRef.child(this.chatChild).child(this.messages[this.messages.length - 1].id).child("delivered").set(true);
      }
      // else {
      //   let toNotify;
      //   if (!this.messages[this.messages.length - 1].delivered) {
      //     toNotify = this.messages[this.messages.length - 1];
      //     this.messages[this.messages.length - 1].delivered = true;
      //   }
      //   if (toNotify) {
      //     this.notifyMessages(toNotify);
      //   }
      // }
    }
  }

  addMessage(msg: Message) {
    this.messages = this.messages.concat(msg);
    //this.storage.set(Constants.KEY_MESSAGES + this.chatChild, this.messages);
    // if (this.chatObj && msg) {
    //   let isMeSender = msg.senderId == this.chatObj.myId;
    //   this.chatObj.chatImage = isMeSender ? msg.recipientImage : msg.senderImage;
    //   this.chatObj.chatName = isMeSender ? msg.recipientName : msg.senderName;
    //   this.chatObj.chatStatus = isMeSender ? msg.recipientStatus : msg.senderStatus;
    // }
  }

  send() {
    if (this.newMessageText && this.newMessageText.trim().length) {
      let toSend = new Message();
      toSend.chatId = this.chatChild;
      toSend.body = this.newMessageText;
      toSend.dateTimeStamp = String(new Date().getTime());
      toSend.delivered = false;
      toSend.sent = true;
      toSend.recipientId = this.chatObj.chatId;
      toSend.recipientImage = this.chatObj.chatImage;
      toSend.recipientName = this.chatObj.chatName;
      toSend.recipientStatus = this.chatObj.chatStatus;
      toSend.senderId = this.chatObj.myId;
      toSend.senderName = this.userMe.name;
      toSend.senderImage = (this.userMe.image_url && this.userMe.image_url.length) ? this.userMe.image_url : "assets/images/empty_dp.png";
      toSend.senderStatus = this.userMe.email;
      toSend.id = this.chatRef.child(this.chatChild).push().key;

      this.chatRef.child(this.chatChild).child(toSend.id).set(toSend).then(res => {
        this.inboxRef.child(toSend.recipientId).child(toSend.senderId).set(toSend);
        this.inboxRef.child(toSend.senderId).child(toSend.recipientId).set(toSend);
        this.newMessageText = '';
        this.notifyMessages();
      });
    } else {
      this.translate.get("type_message").subscribe(value => this.uiElementService.presentToast(value));
    }
  }

  private notifyMessages() {
    this.apiService.postNotification(Constants.ROLE_DELIVERY, Number(this.chatObj.chatId) ? this.chatObj.chatId : this.chatObj.chatId.substring(0, this.chatObj.chatId.indexOf(Constants.ROLE_DELIVERY))).subscribe(res => console.log("notiS", res), err => console.log("notiF", err));
  }

  private onNewLocation(newPos: google.maps.LatLng) {
    if (!this.posDeliveryGuy || !newPos.equals(this.posDeliveryGuy)) {

      if (this.posDeliveryGuy != null) {
        this.i = 0;
        this.lastToPos[0] = this.posDeliveryGuy.lat();
        this.lastToPos[1] = this.posDeliveryGuy.lng();
        this.deltaLat = (newPos.lat() - this.lastToPos[0]) / this.numDeltas;
        this.deltaLng = (newPos.lng() - this.lastToPos[1]) / this.numDeltas;
      }

      if (this.markerDeliveryGuy == null) {
        this.markerDeliveryGuy = createHTMLMapMarker({
          latlng: this.posDeliveryGuy,
          map: this.maps.map,
          html: '<div id="doctor_map"><img src="' + this.order.delivery.delivery.user.image_url + '"></div>'
        });
        this.markerDeliveryGuy.addListener('click', (event) => this.uiElementService.presentToast(this.order.delivery.delivery.user.name));
      } else {
        //this.markerDeliveryGuy.setPosition(this.posDeliveryGuy);
        this.moveMarker();
      }
      this.maps.map.panTo(this.posDeliveryGuy);

    }
  }

  private moveMarker() {
    this.lastToPos[0] = this.lastToPos[0] + this.deltaLat;
    this.lastToPos[1] = this.lastToPos[1] + this.deltaLng;
    let newToPos = new google.maps.LatLng(Number(this.lastToPos[0]), Number(this.lastToPos[1]));
    this.markerDeliveryGuy.setPosition(newToPos);
    this.posDeliveryGuy = newToPos;
    if (this.i != this.numDeltas) {
      this.i++;
      // setTimeout(() => this.moveMarker(), this.delay);
    }
    //  else {
    //   this.requestDirection(this.lastTo);
    // }
  }

  confirmUpdate(status) {
    let keyTitle = status == "accepted" ? "confirm_accept_title" : "confirm_reject_title";
    let keyMessage = status == "accepted" ? "confirm_accept_message" : "confirm_reject_message";
    this.translate.get([keyTitle, keyMessage, "yes", "no"]).subscribe(values => {
      this.alertCtrl.create({
        header: values[keyTitle],
        message: values[keyMessage],
        buttons: [{
          text: values["no"],
          handler: () => { }
        }, {
          text: values["yes"],
          handler: () => {
            this.updateOrderStatus(status);
          }
        }]
      }).then(alert => alert.present());
    });
  }

  updateOrder() {
    let toUpdate = null;
    switch (this.order.status) {
      case "new":
      case "pending":
        toUpdate = "accepted";
        break;
      // case "accepted":
      //   toUpdate = "preparing";
      //   break;
      // case "preparing":
      //   toUpdate = "prepared";
      //   break;
      // case "accepted":
      //   toUpdate = "prepared";
      //   break;
      case "accepted":
        this.translate.get(["just_moment", "something_wrong"]).subscribe(values => {
          this.uiElementService.presentLoading(values["just_moment"]);
          this.subscriptions.push(this.apiService.getOrderById(this.order.id).subscribe(res => {
            this.order = res;
            this.uiElementService.dismissLoading();
            if (this.order.delivery == null) {
              this.translate.get("delivery_na").subscribe(value => this.uiElementService.presentToast(value));
            } else if (this.order.delivery.status == "new" || this.order.delivery.status == "pending" || this.order.delivery.status == "allotted") {
              this.translate.get("delivery_left_na").subscribe(value => this.uiElementService.presentToast(value));
            } else {
              this.updateOrderStatus("dispatched");
            }
          }, err => {
            console.log("updateOrder", err);
            this.uiElementService.presentToast(values["something_wrong"]);
            this.uiElementService.dismissLoading();
          }));
        });
        break;
    }
    if (toUpdate != null) this.updateOrderStatus(toUpdate);
  }

  updateOrderStatus(statusToUpdate) {
    this.translate.get(["updating", "something_wrong"]).subscribe(values => {
      this.uiElementService.presentLoading(values["updating"]);
      this.subscriptions.push(this.apiService.updateOrder(this.order.id, { status: statusToUpdate }).subscribe(res => {
        this.order = res;
        this.translate.get(("order_status_message_" + res.status)).subscribe(value => this.uiElementService.presentToast(value));
        this.canUpdate = this.isOrderUpdateable();
        this.uiElementService.dismissLoading();
      }, err => {
        console.log("updateOrder", err);
        this.uiElementService.presentToast(values["something_wrong"]);
        this.uiElementService.dismissLoading();
      }));
    });
  }

  private isOrderUpdateable(): boolean {
    let toReturn = true;
    if (this.order != null) {
      if (this.order.status == "cancelled" || this.order.status == "refund" || this.order.status == "hold" || this.order.status == "rejected" || this.order.status == "failed" || this.order.status == "dispatched" || this.order.status == "intransit" || this.order.status == "complete") {
        toReturn = false;
      }
    }
    return toReturn;
  }

  setViewType(vt) {
    this.viewType = vt;
  }
  setViewTypeB(vt) {
    this.viewTypeB = vt;
  }

  navChatCustomer() {
    let chat = new Chat();
    chat.chatId = this.order.user_id + Constants.ROLE_USER;
    chat.chatImage = this.order.user.image_url;
    chat.chatName = this.order.user.name;
    chat.chatStatus = this.translate.instant("order_id") + this.order.id + " | " + this.order.created_at;
    chat.myId = this.order.vendor.user_id + Constants.ROLE_VENDOR;

    this.modalController.create({ component: ChatCustomerPage, componentProps: { chat: chat } }).then((modalElement) => modalElement.present());
  }

  dialDriver() {
    this.callNumber.callNumber(this.order.delivery.delivery.user.mobile_number, false).then(res => console.log('Launched dialer!', res)).catch(err => console.log('Error launching dialer', err));
  }

  dialCustomer() {
    this.callNumber.callNumber(this.order.user.mobile_number, false).then(res => console.log('Launched dialer!', res)).catch(err => console.log('Error launching dialer', err));
  }

}
