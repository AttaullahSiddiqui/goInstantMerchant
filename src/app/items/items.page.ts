import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { NavController } from '@ionic/angular';
import { TranslateService } from '@ngx-translate/core';
import { UiElementsService } from '../services/common/ui-elements.service';
import { ApiService } from '../services/network/api.service';
import { Product } from 'src/models/product.models';
import { Helper } from 'src/models/helper.models';
import { BaseListResponse } from 'src/models/base-list.models';
import { NavigationExtras } from '@angular/router';
import { Category } from 'src/models/category.models';
import { ProductQuantity, ProductRequest } from 'src/models/product-request.models';
import { MyEventsService } from '../services/events/my-events.service';
import { Profile } from 'src/models/profile.models';

@Component({
  selector: 'app-items',
  templateUrl: './items.page.html',
  styleUrls: ['./items.page.scss']
})
export class ItemsPage implements OnInit, OnDestroy {
  private subscriptions = new Array<Subscription>();
  private infiniteScrollEvent;
  private nextUrl: string;
  products = new Array<Product>();
  isLoading = true;
  categoriesMenuItems: { category: Category; menu_items: Array<Product>; }[];
  menuItemsToShow: Product[];
  tabIndex = 0;
  productQuantity = new ProductQuantity();
  private profileMe: Profile;
  private pageNo = 1;

  constructor(private navCtrl: NavController, private translate: TranslateService, private myEvent: MyEventsService,
    private uiElementService: UiElementsService, private apiService: ApiService) { }

  ngOnInit() {
    this.profileMe = Helper.getProfile();

    this.translate.get("loading").subscribe(value => {
      this.uiElementService.presentLoading(value);
      this.loadProducts();
    });
    this.myEvent.getUpdatePoductObservable().subscribe(product => {
      this.translate.get("loading").subscribe(value => {
        this.uiElementService.presentLoading(value);
        this.products = [];
        this.categoriesMenuItems = [];
        this.menuItemsToShow = [];
        this.tabIndex = 0;
        this.loadProducts();
      });
    });
  }

  ngOnDestroy() {
    for (let sub of this.subscriptions) sub.unsubscribe();
    this.uiElementService.dismissLoading();
  }

  segmentChanged(index) {
    this.menuItemsToShow = this.categoriesMenuItems[index].menu_items;
    this.tabIndex = index;
  }

  loadProducts() {
    this.subscriptions.push(this.apiService.getProducts(this.profileMe.id, this.pageNo).subscribe(res => this.productsRes(res), err => this.productsErr(err)));
  }

  private setupMenuItems() {
    this.categoriesMenuItems = new Array<{ category: Category; menu_items: Array<Product> }>();
    let catsAll = new Array<Category>();
    for (let item of this.products) {
      for (let cat of item.categories) {
        let exists = false;
        for (let catExisting of catsAll) {
          if (cat.id == catExisting.id) {
            exists = true;
            break;
          }
        }
        if (!exists) catsAll.push(cat);
      }
    }

    for (let cat of catsAll) {
      let menuItemsOut = new Array<Product>();
      for (let item of this.products) {
        item.stock_quantity_status = item.vendor_products[0].stock_quantity ? true : false
        for (let catMI of item.categories) {
          if (catMI.id == cat.id) {
            menuItemsOut.push(item);
            break;
          }
        }
      }
      this.categoriesMenuItems.push({ category: cat, menu_items: menuItemsOut });
      // this.categoriesMenuItems = []
    }

    if (!this.categoriesMenuItems.length && this.products.length) {
      let cat = Category.getAllDefault();
      cat.title = this.translate.instant("all");
      this.categoriesMenuItems.push({ category: cat, menu_items: this.products });
    }

    // let cat = Category.getAllDefault();
    // cat.title = this.translate.instant("all");
    // this.categoriesMenuItems.unshift({ category: cat, menu_items: this.products });

    if (this.categoriesMenuItems.length) this.menuItemsToShow = this.categoriesMenuItems[0].menu_items;
  }

  productsRes(res: BaseListResponse) {
    this.products = this.products.concat(res.data);
    this.setupMenuItems();
    this.nextUrl = res.links.next;
    if (this.infiniteScrollEvent) this.infiniteScrollEvent.target.complete();
    this.isLoading = false;
    this.uiElementService.dismissLoading();
  }

  productsErr(err) {
    console.log("productsErr", err);
    this.uiElementService.dismissLoading();
    if (this.infiniteScrollEvent) this.infiniteScrollEvent.target.complete();
    this.isLoading = false;
  }

  doInfiniteProducts(event) {
    if (this.nextUrl == null) {
      event.target.complete();
    } else {
      this.infiniteScrollEvent = event;
      this.subscriptions.push(this.apiService.getURL(this.nextUrl).subscribe(res => {
        if (res && res.data && res.data.length) for (let pro of res.data) this.apiService.setupProduct(pro);
        this.productsRes(res);
      }, err => this.productsErr(err)));
    }
  }

  navItemDetail(product) {
    let navigationExtras: NavigationExtras = { state: { product: product } };
    this.navCtrl.navigateForward(['./edit-product'], navigationExtras);
  }

  changeProQuantity(item) {
    this.translate.get("just_moment").subscribe(value => {
      this.uiElementService.presentLoading(value);
      let productRequest = ProductRequest.fromProduct(item);
      let pur = {
        title: productRequest.title,
        detail: productRequest.detail,
        price: productRequest.price,
        vendor_id: this.profileMe.id,
        categories: productRequest.categories,
        image_urls: productRequest.image_urls,
        stock_quantity: productRequest.stock_quantity,
        meta: JSON.stringify(productRequest.meta)
      }
      this.subscriptions.push(this.apiService.updateProduct(item.id, pur).subscribe(res => { console.log(res); this.uiElementService.dismissLoading() }, err => this.uiElementService.dismissLoading()));
    });
    //this.menuItemsToShow.map(el => { if (el.id == id) { this.productQuantity.stock_quantity = !el.stock_quantity_status ? "-1" : '0'; } })

  }

}
