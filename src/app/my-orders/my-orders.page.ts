import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { NavController } from '@ionic/angular';
import { TranslateService } from '@ngx-translate/core';
import { UiElementsService } from '../services/common/ui-elements.service';
import { ApiService } from '../services/network/api.service';
import { Order } from 'src/models/order.models';
import { Helper } from 'src/models/helper.models';
import { Profile } from 'src/models/profile.models';
import { NavigationExtras } from '@angular/router';
import * as firebase from 'firebase/app';

@Component({
  selector: 'app-my-orders',
  templateUrl: './my-orders.page.html',
  styleUrls: ['./my-orders.page.scss']
})
export class MyOrdersPage implements OnInit, OnDestroy {
  showOrder: string = "active";
  private myOrdersRef: firebase.database.Reference;
  private refresher: any;
  private subscriptions = new Array<Subscription>();
  orders = new Array<Order>();
  // pastOrderList = new Array<Order>();
  // inProcessList = new Array<Order>();
  isLoading = true;
  private pageNo = 1;
  private doneAll = false;
  private infiniteScrollEvent;
  private profile: Profile;
  private orderStatus = ['cancelled', 'rejected', 'refund', 'failed', 'complete'];

  constructor(private navCtrl: NavController, private translate: TranslateService,
    private uiElementService: UiElementsService, private apiService: ApiService) { }

  ngOnInit() {
    this.profile = Helper.getProfile();
    this.myOrdersRef = firebase.database().ref("vendors").child(String(this.profile.id)).child("orders");
    this.translate.get("loading").subscribe(value => {
      this.uiElementService.presentLoading(value);
      this.getOrders(this.showOrder);
    });
  }

  ngOnDestroy() {
    console.log("ngOnDestroy");
    this.unRegisterUpdates();
    for (let sub of this.subscriptions) sub.unsubscribe();
    this.uiElementService.dismissLoading();
  }

  selectTab(event) {
    this.translate.get("loading").subscribe(value => {
      this.uiElementService.presentLoading(value);
      this.showOrder = event.target.value ? event.target.value : 'active'
      console.log(this.showOrder);
      this.orders = [];
      this.pageNo = 1;
      this.isLoading = true;
      if (this.infiniteScrollEvent) { this.infiniteScrollEvent.target.complete(); }
      if (this.refresher) { this.refresher.target.complete(); }
      if (this.showOrder == 'active') {
        this.getOrders(this.showOrder);
      } else if (this.showOrder == 'past') {
        this.getOrders(this.showOrder);
      }
    });
  }

  getOrders(showOrder) {
    this.apiService.getOrders(this.pageNo, this.profile.id, showOrder).subscribe(res => {
      // res.data.map(element => {
      //   if (element.status.toLowerCase() === this.orderStatus[0] || element.status.toLowerCase() === this.orderStatus[1] || element.status.toLowerCase() == this.orderStatus[2] ||
      //     element.status.toLowerCase() === this.orderStatus[3] || element.status.toLowerCase() == this.orderStatus[4]) {
      //     this.pastOrderList.push(element);
      //   } else {
      //     this.inProcessList.push(element)
      //   }
      // })
      // if (!this.orders || !this.orders.length) this.registerUpdates();
      this.isLoading = false;
      //for (let o of res.data) this.setupOrderProgress(o);
      this.orders = this.orders.concat(res.data);
      this.doneAll = (!res.data || !res.data.length);
      if (this.infiniteScrollEvent) this.infiniteScrollEvent.target.complete();
      if (this.refresher) this.refresher.target.complete();
      this.uiElementService.dismissLoading();
    }, err => {
      console.log("getOrders", err);
      this.isLoading = false;
      if (this.infiniteScrollEvent) this.infiniteScrollEvent.target.complete();
      if (this.refresher) this.refresher.target.complete();
      this.uiElementService.dismissLoading();
    });
  }

  doInfinite(event) {
    console.log('call')
    if (this.doneAll) {
      event.target.complete();
    } else {
      this.infiniteScrollEvent = event;
      this.pageNo = this.pageNo + 1;
      this.getOrders(this.showOrder);
    }
  }

  doRefresh(refresher) {
    this.unRegisterUpdates();
    if (this.isLoading) refresher.target.complete();
    this.refresher = refresher;
    this.pageNo = 1;
    this.isLoading = true;
    this.orders = [];
    // this.inProcessList = [];
    // this.pastOrderList = [];
    this.getOrders(this.showOrder);
  }

  navOrderInfo(order: Order) {
    let navigationExtras: NavigationExtras = { state: { order: order } };
    this.navCtrl.navigateForward(['./order-info'], navigationExtras);
  }

  addFireOrder(newOrder: Order) {
    if (newOrder.status != "new") return;
    let existingIndex = -1
    if (this.orders.length) {
      for (let i = 0; i < this.orders.length; i++) {
        if (this.orders[i].id == newOrder.id) {
          existingIndex = i;
          break;
        }
      }
    }
    this.apiService.setupOrder(newOrder);
    if (existingIndex == -1) {
      this.orders.unshift(newOrder);
    } else {
      this.orders[existingIndex] = newOrder;
    }
  }

  updateStatusOnId(oId: number, oNew: Order) {
    let index = -1;
    for (let i = 0; i < this.orders.length; i++) {
      if (this.orders[i].id == oId) {
        index = i;
        break;
      }
    }
    if (index != -1) {

      this.orders[index].status = oNew.status;
      if (oNew.delivery != null) {
        oNew.delivery.delivery.user.image_url = "assets/images/empty_dp";
        if (!oNew.delivery.delivery.user.mediaurls || !oNew.delivery.delivery.user.mediaurls.images) oNew.delivery.delivery.user.mediaurls = { images: [] };
        for (let imgObj of oNew.delivery.delivery.user.mediaurls.images) if (imgObj["default"]) { oNew.delivery.delivery.user.image_url = imgObj["default"]; break; }
        this.orders[index].delivery = oNew.delivery;
      }

      this.orders.unshift(this.orders.splice(index, 1)[0]);
    }
  }

  registerUpdates() {
    const component = this;
    if (this.myOrdersRef != null) {
      this.myOrdersRef.on('child_added', function (data) {
        var fireOrder = data.val() as { data: Order };
        // console.log("child_added", fireOrder);
        if (fireOrder.data != null) component.addFireOrder(fireOrder.data);
      });
      this.myOrdersRef.on('child_changed', function (data) {
        var fireOrder = data.val() as { data: Order };
        console.log("child_changed", fireOrder);
        if (fireOrder.data != null) component.updateStatusOnId(fireOrder.data.id, fireOrder.data);
      });
    }
  }

  unRegisterUpdates() {
    if (this.myOrdersRef != null) {
      this.myOrdersRef.off();
    }
  }

}
