import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { NavController } from '@ionic/angular';
import { TranslateService } from '@ngx-translate/core';
import { UiElementsService } from '../services/common/ui-elements.service';
import { ApiService } from '../services/network/api.service';
import { Helper } from 'src/models/helper.models';
import { EarningInsight } from 'src/models/insight-earning.models';
import { OrderInsight } from 'src/models/insight-order.models';
import { Constants } from 'src/models/constants.models';
import { Product } from 'src/models/product.models';
import * as firebase from 'firebase';
import * as moment from 'moment';

@Component({
  selector: 'app-insight',
  templateUrl: './insight.page.html',
  styleUrls: ['./insight.page.scss']
})
export class InsightPage implements OnInit, OnDestroy {
  private subscriptions = new Array<Subscription>();
  currency_icon: string;
  duration = "today";
  insightsEarning: EarningInsight;
  priceRangeEarning: Array<number>;
  chartDataParsedEarning: Array<{ date: string, percent: string, price: string }>;
  insightsOrder: OrderInsight;
  priceRangeOrder: Array<number>;
  chartDataParsedOrder: Array<{ date: string, percent: string, price: string }>;
  private productTypes = [{ name: "best-seller", title: "products_best_seller" }];
  isLoading: boolean;
  productTypesMap = new Array<{ productType: { name: string; title: string; }; products: Array<Product>; }>();

  private deliveryStats = new Array<{ distance: number, duration: number }>();
  distance_metric = "km";

  constructor(private navCtrl: NavController, private translate: TranslateService,
    private uiElementService: UiElementsService, private apiService: ApiService) { }

  ngOnInit() {
    let values = Helper.getSettingsValue(["currency_icon", "distance_metric"]);
    if (values && values[0]) this.currency_icon = values[0];
    if (values && values[1]) this.distance_metric = values[1].toLowerCase();

    this.setupDefaultInsightsEarning();
    this.setupDefaultInsightsOrder();
    this.loadInsight();
    this.loadProductsByType();
    //this.loadDeliverySummary();

    const component = this;
    let refDeliveryStatAll = firebase.database().ref().child("deliveries").child(String(Helper.getProfile().id)).child("order_stats");
    refDeliveryStatAll.once('value').then(function (snapshot) {
      let data = snapshot.val();
      if (data != null) {
        for (var prop in data) if (Object.prototype.hasOwnProperty.call(data, prop)) component.deliveryStats.push(data[prop]);
        component.reFilterTravelledStat();
      }
    });
  }

  ngOnDestroy() {
    for (let sub of this.subscriptions) sub.unsubscribe();
    this.uiElementService.dismissLoading();
  }

  loadProductsByType() {
    let types = [];
    for (let type of this.productTypes) types.push(type.name);
    this.subscriptions.push(this.apiService.getProductsForTypes(Constants.SCOPE_ECOMMERCE, types).subscribe(res => {
      console.log("getProductsForTypes", res);
      for (let i = 0; i < this.productTypes.length; i++)if (res[i].data && res[i].data.length) this.productTypesMap.push({ productType: this.productTypes[i], products: res[i].data });
      this.uiElementService.dismissLoading();
      this.isLoading = false;
    }, err => {
      console.log("getProductsForTypes", err);
      this.uiElementService.dismissLoading();
      this.isLoading = false;
    }));
  }

  haveNothingToShow(): boolean {
    let toReturn = true;
    if (this.productTypesMap) {
      for (let catPros of this.productTypesMap) {
        if (catPros && catPros.products.length) {
          toReturn = false;
          break;
        }
      }
    }
    return this.isLoading ? false : toReturn;
  }

  private reFilterTravelledStat() {
    let totalDistance = 0;
    if (this.insightsOrder.orders_count && this.deliveryStats) {
      let limit = this.insightsOrder.orders_count > this.deliveryStats.length ? this.deliveryStats.length : this.insightsOrder.orders_count;
      for (let i = 0; i < limit; i++) totalDistance += this.deliveryStats[i].distance;
    }
    this.insightsOrder.distance_travelled = Number(Helper.formatDistance(totalDistance, this.distance_metric));
  }

  setupDefaultInsightsOrder() {
    this.insightsOrder = new OrderInsight();
    if (this.insightsOrder && this.insightsOrder.orders_chart_data.length) {
      let maxEarning = 100;
      let breaker = maxEarning / 5;
      this.priceRangeOrder = [];
      for (let i = 0; i <= 5; i++) this.priceRangeOrder.push(Number((((i == 0) ? maxEarning : (this.priceRangeOrder[i - 1] - breaker))).toFixed(2)));
      this.chartDataParsedOrder = [];
      for (let cd of this.insightsOrder.orders_chart_data) this.chartDataParsedOrder.push({ date: "0", percent: String(((Number(cd.total) * 100) / maxEarning)), price: "" });
    }
  }

  setupDefaultInsightsEarning() {
    this.insightsEarning = new EarningInsight();
    if (this.insightsEarning && this.insightsEarning.earnings_chart_data.length) {
      let maxEarning = 100;
      let breaker = maxEarning / 5;
      this.priceRangeEarning = [];
      for (let i = 0; i <= 5; i++) this.priceRangeEarning.push(Number((((i == 0) ? maxEarning : (this.priceRangeEarning[i - 1] - breaker))).toFixed(2)));
      this.chartDataParsedEarning = [];
      for (let cd of this.insightsEarning.earnings_chart_data) this.chartDataParsedEarning.push({ date: "0", percent: String(((Number(cd.total) * 100) / maxEarning)), price: "" });
    }
  }

  loadInsight() {
    this.loadInsightEarnings();
    this.loadInsightOrders();
  }

  loadInsightEarnings() {
    this.translate.get("loading").subscribe(value => {
      this.uiElementService.presentToast(value);
      let insightRequest = this.getInsightRequest();
      this.subscriptions.push(this.apiService.getInsightEarning(insightRequest).subscribe(res => {
        if (!res.total_earnings) res.total_earnings = 0; res.total_earnings = Number(Number(res.total_earnings).toFixed(2));
        this.insightsEarning = res;
        console.log('irming ', res);
        if (this.insightsEarning && this.insightsEarning.earnings_chart_data.length) {
          let maxEarning = 0;
          for (let cd of this.insightsEarning.earnings_chart_data) if (Number(cd.total) > maxEarning) maxEarning = Number(cd.total);
          let breaker = maxEarning / 5;
          this.priceRangeEarning = [];
          for (let i = 0; i <= 5; i++) this.priceRangeEarning.push(Number((((i == 0) ? maxEarning : (this.priceRangeEarning[i - 1] - breaker))).toFixed(2)));
          this.chartDataParsedEarning = [];
          for (let cd of this.insightsEarning.earnings_chart_data) this.chartDataParsedEarning.push({ date: this.getPeriodText(cd.period, insightRequest), percent: String(((Number(cd.total) * 100) / maxEarning)), price: this.currency_icon + " " + Number(cd.total).toFixed() });
        } else {
          this.setupDefaultInsightsEarning();
        }
        this.uiElementService.dismissLoading();
      }, err => {
        console.log("insights", err);
        this.uiElementService.dismissLoading();
      }));
    });
  }

  loadInsightOrders() {
    let insightRequest = this.getInsightRequest();
    this.subscriptions.push(this.apiService.getInsightOrder(Helper.getProfile().id, insightRequest).subscribe(res => {
      //if (!res.total_earnings) res.total_earnings = 0; res.total_earnings = Number(Number(res.total_earnings).toFixed(2));
      this.insightsOrder = res;
      if (this.insightsOrder && this.insightsOrder.orders_chart_data.length) {
        let maxEarning = 0;
        for (let cd of this.insightsOrder.orders_chart_data) if (Number(cd.total) > maxEarning) maxEarning = Number(cd.total);
        let breaker = maxEarning / 5;
        this.priceRangeOrder = [];
        for (let i = 0; i <= 5; i++) this.priceRangeOrder.push(Number((((i == 0) ? maxEarning : (this.priceRangeOrder[i - 1] - breaker))).toFixed(2)));
        this.chartDataParsedOrder = [];
        for (let cd of this.insightsOrder.orders_chart_data) this.chartDataParsedOrder.push({ date: this.getPeriodText(cd.period, insightRequest), percent: String(((Number(cd.total) * 100) / maxEarning)), price: Number(cd.total).toFixed() });
      } else {
        this.setupDefaultInsightsOrder();
      }
      this.reFilterTravelledStat();
      this.uiElementService.dismissLoading();
    }, err => {
      console.log("insights", err);
      this.uiElementService.dismissLoading();
    }));
  }

  // loadDeliverySummary() {
  //   let profile = Helper.getProfile();
  //   this.subscriptions.push(this.apiService.getSummary(String(profile.id)).subscribe(res => {
  //     this.profileSummary = res;
  //     Helper.setProfileSummary(this.profileSummary);
  //   }, err => {
  //     console.log("getSummary", err);
  //   }));
  // }

  navTransactions() {
    this.navCtrl.navigateRoot(['/wallet']);
  }

  private getInsightRequest() {
    //  'duration' => 'required|in:hours,days,months,years',
    //  'limit' => 'required|numeric'
    let toReturn = { duration: "", limit: 0 };
    switch (this.duration) {
      case "today":
        toReturn.duration = "hours";
        toReturn.limit = 24;
        break;
      case "week":
        toReturn.duration = "days";
        toReturn.limit = 7;
        break;
      case "month":
        toReturn.duration = "months";
        toReturn.limit = 12;
        break;
      case "year":
        toReturn.duration = "years";
        toReturn.limit = 12;
        break;
    }
    return toReturn;
  }

  private getPeriodText(period: string, ir: { duration: string; limit: number }): string {
    let months = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];
    let days = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];

    let toReturn = String(period);
    if (toReturn.includes("-")) {
      return moment(toReturn).format("DD/MM");
    } else {
      switch (ir.duration) {
        case "hours":
          if (toReturn.length == 1) toReturn = "0" + toReturn;
          break;
        case "months":
          let index = Number(toReturn);
          toReturn = this.translate.instant(months[index > 0 ? index - 1 : index]);
          break;
      }
    }
    return toReturn;
  }

}
