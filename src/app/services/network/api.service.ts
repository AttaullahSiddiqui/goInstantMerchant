import { Injectable, Inject } from '@angular/core';
import { APP_CONFIG, AppConfig } from 'src/app/app.config';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { forkJoin, Observable, of } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { Country } from 'src/models/country.models';
import { AuthResponse } from 'src/models/auth-response.models';
import { SocialLoginRequest } from 'src/models/sociallogin-request.models';
import { SignUpRequest } from 'src/models/auth-signup-request.models';
import { User } from 'src/models/user.models';
import { MyAddress } from 'src/models/address.models';
import { MyMeta } from 'src/models/meta.models';
import { SupportRequest } from 'src/models/support-request.models';
import { Profile } from 'src/models/profile.models';
import { Helper } from 'src/models/helper.models';
import { Order } from 'src/models/order.models';
import { BaseListResponse } from 'src/models/base-list.models';
import { Product } from 'src/models/product.models';
import { Category } from 'src/models/category.models';
import { ProductRequest, ProductQuantity } from 'src/models/product-request.models';
import { WalletTransaction } from 'src/models/wallet-transaction.models';
import { PayoutRequest } from 'src/models/payout-request.models';
import { EarningInsight } from 'src/models/insight-earning.models';
import { OrderInsight } from 'src/models/insight-order.models';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private myHeaders: HttpHeaders;

  private currency_icon: string;
  private locale: string;
  private uuid: string = "xxx";
  private platform: string = "android";

  constructor(@Inject(APP_CONFIG) private config: AppConfig, private http: HttpClient) { }

  reloadSetting() {
    this.currency_icon = Helper.getSetting("currency_icon");
    this.locale = Helper.getSetting("locale");
  }

  setupHeaders(authToken?: string) {
    let tokenToUse = authToken ? authToken : Helper.getToken();
    let savedLanguageCode = Helper.getLanguageDefault();
    this.myHeaders = tokenToUse ? new HttpHeaders({
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'Authorization': ('Bearer ' + tokenToUse),
      'X-Localization': String(savedLanguageCode ? savedLanguageCode : this.config.availableLanguages[0].code),
      'X-Device-Id': this.uuid ? this.uuid : "xxx",
      'X-Device-Type': this.platform ? this.platform : "android"
    }) : new HttpHeaders({
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'X-Localization': String(savedLanguageCode ? savedLanguageCode : this.config.availableLanguages[0].code),
      'X-Device-Id': this.uuid ? this.uuid : "xxx",
      'X-Device-Type': this.platform ? this.platform : "android"
    });
  }

  setUuidAndPlatform(uuid: string, platform: string) {
    this.uuid = uuid;
    this.platform = platform ? String(platform).toLowerCase() : platform;
    this.setupHeaders();
  }

  public getCountries(): Observable<Array<Country>> {
    return this.http.get<Array<Country>>('./assets/json/countries.json').pipe(
      tap(data => {
        let indiaIndex = -1;
        // if (data) {
        //   for (let i = 0; i < data.length; i++) {
        //     if (data[i].name == "India") {
        //       indiaIndex = i;
        //       break;
        //     }
        //   }
        // }
        if (indiaIndex != -1) data.unshift(data.splice(indiaIndex, 1)[0]);
      }),
      catchError(this.handleError<Array<Country>>('getCountries', []))
    );
  }

  public getContactLink(): Observable<{ link: string }> {
    return this.http.get<{ link: string }>('https://dashboard.vtlabs.dev/whatsapp.php?product_name=foodoz&source=application', { headers: this.myHeaders });
  }
  
  public postNotification(roleTo: string, userIdTo: string): Observable<any> {
    return this.http.post<any>(this.config.apiBase + 'api/user/push-notification', { role: roleTo, user_id: userIdTo }, { headers: this.myHeaders });
  }

  public getURL(url: string): Observable<any> {
    return this.http.get<any>(url, { headers: this.myHeaders });
  }

  public getSettings(): Observable<Array<MyMeta>> {
    return this.http.get<Array<MyMeta>>(this.config.apiBase + 'api/settings', { headers: this.myHeaders });
  }

  public submitSupport(supportRequest: SupportRequest): Observable<{}> {
    return this.http.post<{}>(this.config.apiBase + "api/support", supportRequest, { headers: this.myHeaders });
  }

  public checkUser(checkUserRequest: any): Observable<{}> {
    return this.http.post<{}>(this.config.apiBase + 'api/check-user', checkUserRequest, { headers: this.myHeaders });
  }

  public loginSocial(socialLoginRequest: SocialLoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(this.config.apiBase + 'api/social/login', socialLoginRequest, { headers: this.myHeaders }).pipe(tap(data => this.setupUserMe(data)));
  }

  public loginUser(loginTokenRequest: { token: string, role: string }): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(this.config.apiBase + 'api/login', loginTokenRequest, { headers: this.myHeaders }).pipe(tap(data => this.setupUserMe(data)));
  }

  public createUser(signUpRequest: SignUpRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(this.config.apiBase + 'api/register', signUpRequest, { headers: this.myHeaders }).pipe(tap(data => this.setupUserMe(data)));
  }

  public updateUser(updateRequest): Observable<User> {
    return this.http.put<User>(this.config.apiBase + 'api/user', updateRequest, { headers: this.myHeaders }).pipe(tap(data => this.setupUserMe(data)));
  }

  public getProfile(): Observable<Profile> {
    return this.http.get<Profile>(this.config.apiBase + "api/vendors", { headers: this.myHeaders }).pipe(tap(data => this.setupProfile(data)));
  }

  public updateProfile(profileUpdateRequest, profileId): Observable<Profile> {
    return this.http.put<Profile>(this.config.apiBase + "api/vendors/" + profileId, profileUpdateRequest, { headers: this.myHeaders }).pipe(tap(data => this.setupProfile(data)));
  }

  public updateProduct(proId, proReq: ProductRequest): Observable<Product> {
    return this.http.put<Product>(this.config.apiBase + "api/products/" + proId, proReq, { headers: this.myHeaders });
  }

  public updateProductQuantity(proId, proReq: ProductQuantity): Observable<Product> {
    return this.http.put<Product>(this.config.apiBase + "api/products/" + proId, proReq, { headers: this.myHeaders });
  }

  public createProduct(proReq: ProductRequest): Observable<Product> {
    return this.http.post<Product>(this.config.apiBase + "api/products", proReq, { headers: this.myHeaders });
  }

  public walletTransfer(wtr: PayoutRequest): Observable<any> {
    return this.http.post<any>(this.config.apiBase + 'api/user/wallet/payout', wtr, { headers: this.myHeaders });
  }

  public updateOrder(orderId, updateBody): Observable<Order> {
    this.reloadSetting();
    return this.http.put<Order>(this.config.apiBase + "api/orders/" + orderId, updateBody, { headers: this.myHeaders }).pipe(tap(data => {
      this.setupOrder(data);
    }));
  }

  public getOrders(pageNo: number, vendor_id?: number, show?: string): Observable<BaseListResponse> {
    let showOrder = `&${show}=1`
    this.reloadSetting();
    return this.http.get<BaseListResponse>(this.config.apiBase + "api/orders?page=" + pageNo + "&vendor=" + vendor_id + showOrder, { headers: this.myHeaders }).pipe(tap(data => {
      for (let order of data.data) this.setupOrder(order);
    }));
  }

  public getOrderById(orderId): Observable<Order> {
    this.reloadSetting();
    return this.http.get<Order>(this.config.apiBase + "api/orders/" + orderId, { headers: this.myHeaders }).pipe(tap(data => {
      this.setupOrder(data);
    }));
  }

  public getProducts(vendor_id: number, page: number): Observable<BaseListResponse> {
    let urlParams = new URLSearchParams();
    urlParams.append("vendor", String(vendor_id));
    urlParams.append("page", String(page));
    return this.http.get<BaseListResponse>(this.config.apiBase + "api/products?" + urlParams.toString(), { headers: this.myHeaders }).pipe(tap(data => {
      if (data && data.data && data.data.length) for (let pro of data.data) this.setupProduct(pro);
    })
      //, catchError(this.handleError<BaseListResponse>('getProductsWithCategoryId', this.getTestProducts()))
    );
  }

  public getProductsForTypes(scope: string, types: Array<string>) {
    this.reloadSetting();
    let requests = [];
    for (let type of types) requests.push(this.getBestProducts(scope, type));
    return forkJoin(requests).pipe(catchError(error => of(error)));
  }

  public getBestProducts(scope: string, type: string) {
    let urlParams = new URLSearchParams();
    urlParams.append("pagination", "0");
    urlParams.append(type, "1");
    urlParams.append("scope", scope);
    return this.http.get<BaseListResponse>(this.config.apiBase + "api/products?" + urlParams.toString(), { headers: this.myHeaders }).pipe(tap(data => {
      if (data && data.data && data.data.length) for (let pro of data.data) this.setupProduct(pro);
    }), catchError(this.handleError<BaseListResponse>('getProducts', new BaseListResponse())));
  }

  // public getRatingSummaryProduct(productId): Observable<Rating> {
  //   return this.http.get<Rating>(this.config.apiBase + "api/products/ratings/summary/" + productId, { headers: this.myHeaders }).pipe(tap(data => {
  //     let ratingSummaries = RatingSummary.defaultArray();
  //     for (let ratingSummaryResult of data.summary) {
  //       ratingSummaries[ratingSummaryResult.rounded_rating - 1].total = ratingSummaryResult.total;
  //       ratingSummaries[ratingSummaryResult.rounded_rating - 1].percent = ((ratingSummaryResult.total / data.total_ratings) * 100);
  //     }
  //     data.summary = ratingSummaries;
  //   }));
  // }

  // public getReviewsProduct(productId, pageNo: number): Observable<BaseListResponse> {
  //   return this.http.get<BaseListResponse>(this.config.apiBase + "api/products/ratings/" + productId + "?page=" + pageNo, { headers: this.myHeaders }).pipe(tap(data => {
  //     let locale = Helper.getLocale();
  //     for (let review of data.data) review.created_at = Helper.formatTimestampDate(review.created_at, locale);
  //   }));
  // }

  public getReviewsVendor(productId, pageNo: number): Observable<BaseListResponse> {
    return this.http.get<BaseListResponse>(this.config.apiBase + "api/vendors/ratings/" + productId + "?page=" + pageNo, { headers: this.myHeaders }).pipe(tap(data => {
      let locale = Helper.getLocale();
      for (let review of data.data) review.created_at = Helper.formatTimestampDate(review.created_at, locale);
    }));
  }


  public addressAdd(address): Observable<MyAddress> {
    return this.http.post<MyAddress>(this.config.apiBase + 'api/addresses', address, { headers: this.myHeaders });
  }

  public addressUpdate(address): Observable<MyAddress> {
    return this.http.put<MyAddress>(this.config.apiBase + 'api/addresses/' + address.id + '/update', address, { headers: this.myHeaders });
  }

  public getInsightEarning(insightRequest: { duration: string; limit: number }): Observable<EarningInsight> {
    let urlParams = new URLSearchParams();
    urlParams.append("duration", insightRequest.duration);
    urlParams.append("limit", String(insightRequest.limit));
    return this.http.get<EarningInsight>(this.config.apiBase + 'api/user/wallet/earnings?' + urlParams.toString(), { headers: this.myHeaders });
  }

  public getInsightOrder(deliveryId, insightRequest: { duration: string; limit: number }): Observable<OrderInsight> {
    let urlParams = new URLSearchParams();
    urlParams.append("duration", insightRequest.duration);
    urlParams.append("limit", String(insightRequest.limit));
    return this.http.get<OrderInsight>(this.config.apiBase + 'api/delivery/' + deliveryId + '/summary?' + urlParams.toString(), { headers: this.myHeaders }).pipe(tap(data => {
      if (!data.orders_chart_data) data.orders_chart_data = [{ period: "0", total: "10" }, { period: "0", total: "10" }, { period: "0", total: "10" }, { period: "0", total: "10" }, { period: "0", total: "10" }];
    }));
  }

  public setupProfile(profile: Profile) {
    profile.image_urls = [];
    if (profile.mediaurls && profile.mediaurls.images) for (let imgObj of profile.mediaurls.images) if (imgObj["default"]) { profile.image_urls.push(imgObj["default"]); break; }

    if (profile.address != null) profile.address = String(profile.address);
    if (profile.latitude != null) profile.latitude = String(profile.latitude);
    if (profile.longitude != null) profile.longitude = String(profile.longitude);

    if (!profile.categories) profile.categories = [];
    for (let cat of profile.categories) this.setupCategory(cat);

    if (typeof profile.meta == "string") profile.meta = JSON.parse(profile.meta as string);
    if (profile.meta == null) profile.meta = {};
  }

  public getCategoriesParents(scope?: string): Observable<Array<Category>> {
    let urlParams = new URLSearchParams();
    urlParams.append("pagination", "0");
    urlParams.append("parent", "1");
    if (scope != null) urlParams.append("scope", scope);
    return this.http.get<Array<Category>>(this.config.apiBase + "api/categories?" + urlParams.toString(), { headers: this.myHeaders }).pipe(tap(data => {
      if (data && data.length) for (let cat of data) this.setupCategory(cat);
    })
      //, catchError(this.handleError<Array<Category>>('getCategoriesParents', this.getTestCategories()))
    );
  }

  public getCategoriesChild(childCategories: Array<Category>): Observable<Array<Category>> {
    let urlParams = new URLSearchParams();
    let catIds = new Array<number>();
    for (let cat of childCategories) catIds.push(cat.id);
    urlParams.append((catIds.length > 1 ? "categories" : "category"), catIds.join());
    urlParams.append("pagination", "0");
    return this.http.get<Array<Category>>(this.config.apiBase + "api/categories?" + urlParams.toString(), { headers: this.myHeaders }).pipe(tap(data => {
      if (data && data.length) for (let cat of data) this.setupCategory(cat);
    })
      //, catchError(this.handleError<Array<Category>>('getCategoriesParents', this.getTestCategories()))
    );
  }

  public getBalance(): Observable<{ balance: number }> {
    return this.http.get<{ balance: number }>(this.config.apiBase + 'api/user/wallet/balance', { headers: this.myHeaders }).pipe(tap(data => {
      if (!data.balance) data.balance = 0;
      data.balance = Number(data.balance.toFixed(2));
    }));
  }

  public getTransactions(): Observable<BaseListResponse> {
    return this.http.get<BaseListResponse>(this.config.apiBase + 'api/user/wallet/transactions', { headers: this.myHeaders }).pipe(tap(data => {
      if (data && data.data && data.data.length) for (let trans of data.data) this.setupTransaction(trans);
    }));
  }

  public setupTransaction(transaction: WalletTransaction) {
    transaction.created_at = Helper.formatTimestampDateTime(transaction.created_at, this.locale);
    transaction.updated_at = Helper.formatTimestampDateTime(transaction.updated_at, this.locale);
    if (!transaction.amount) transaction.amount = 0;
    transaction.amount = Number(transaction.amount.toFixed(2));
    if (transaction.meta && transaction.meta.source_amount) transaction.meta.source_amount = Number(Number(transaction.meta.source_amount).toFixed(2));
  }

  private setupCategory(category: Category) {
    if (category.mediaurls && category.mediaurls.images) for (let imgObj of category.mediaurls.images) if (imgObj["default"]) { category.image = imgObj["default"]; break; }
    if (!category.image) category.image = "assets/images/plc_item_image.png";
  }

  public setupProduct(product: Product) {
    //product.prescription_required = (product.meta && product.meta.prescription);

    if (!product.ratings) product.ratings = 0;
    if (!product.ratings_count) product.ratings_count = 0;
    if (!product.price) product.price = 0;
    product.priceToShow = this.currency_icon + product.price.toFixed(2);
    product.ratings = Number(product.ratings.toFixed(2));

    if (product.vendor_products && product.vendor_products.length) {
      for (let vp of product.vendor_products) {
        if (!vp.sale_price) vp.sale_price = 0;
        vp.priceToShow = this.currency_icon + vp.price.toFixed(2);
        vp.sale_priceToShow = this.currency_icon + vp.sale_price.toFixed(2);

        if (vp.vendor) {
          if (!vp.vendor.mediaurls || !vp.vendor.mediaurls.images) vp.vendor.mediaurls = { images: [] };
          vp.vendor.image = "assets/images/plc_item_image.png";
          for (let imgObj of vp.vendor.mediaurls.images) if (imgObj["default"]) { vp.vendor.image = imgObj["default"]; break; }
        }
      }
    }

    if (product.categories && product.categories.length) {
      for (let cat of product.categories) this.setupCategory(cat);
    }

    product.image_urls = new Array<string>();
    if (product.mediaurls && product.mediaurls.images) for (let imgObj of product.mediaurls.images) if (imgObj["default"]) product.image_urls.push(imgObj["default"]);
    if (!product.image_urls.length) product.image_urls.push("assets/images/plc_item_image.png");
  }

  private setupUserMe(data) {
    if (!data.mediaurls || !data.mediaurls.images) data.mediaurls = { images: [] };
    if (!data.image_url) for (let imgObj of data.mediaurls.images) if (imgObj["default"]) { data.image_url = imgObj["default"]; break; }
  }

  public setupOrder(order: Order) {
    order.created_at = Helper.formatTimestampDateTime(order.created_at, this.locale);
    if (order.scheduled_on) order.scheduled_on = Helper.formatTimestampDate(order.scheduled_on, this.locale);

    order.total_toshow = this.currency_icon + Number(order.total).toFixed(2);
    order.subtotal_toshow = this.currency_icon + Number(order.subtotal).toFixed(2);
    if (order.delivery_fee) order.delivery_fee_toshow = this.currency_icon + Number(order.delivery_fee).toFixed(2);
    if (order.discount) order.discount_toshow = this.currency_icon + Number(order.discount).toFixed(2);
    if (order.taxes) order.taxes_toshow = this.currency_icon + Number(order.taxes).toFixed(2);

    for (let product of order.products) {
      product.total_toshow = this.currency_icon + Number(product.total).toFixed(2);
      if (product.vendor_product && product.vendor_product.product) {
        if (!product.vendor_product.product.price) product.vendor_product.product.price = 0;
        product.vendor_product.product.priceToShow = this.currency_icon + Number(product.vendor_product.product.price).toFixed(2);

        product.vendor_product.product.image_urls = new Array<string>();
        if (product.vendor_product.product.mediaurls && product.vendor_product.product.mediaurls.images) for (let imgObj of product.vendor_product.product.mediaurls.images) if (imgObj["default"]) product.vendor_product.product.image_urls.push(imgObj["default"]);
        if (!product.vendor_product.product.image_urls.length) product.vendor_product.product.image_urls.push("assets/images/plc_item_image.png");

        product.vendor_product.product.prescription_required = (product.vendor_product.product.meta && product.vendor_product.product.meta.prescription);
      }
    }

    if (order.vendor) {
      if (!order.vendor.mediaurls || !order.vendor.mediaurls.images) order.vendor.mediaurls = { images: [] };
      order.vendor.image = "assets/images/plc_item_image.png";
      for (let imgObj of order.vendor.mediaurls.images) if (imgObj["default"]) { order.vendor.image = imgObj["default"]; break; }
    }

    if (order.user) {
      if (!order.user.mediaurls || !order.user.mediaurls.images) order.user.mediaurls = { images: [] };
      order.user.image_url = "assets/images/empty_dp.png";
      for (let imgObj of order.user.mediaurls.images) if (imgObj["default"]) { order.user.image_url = imgObj["default"]; break; }
    }

    if (order.delivery && order.delivery.delivery && order.delivery.delivery.user) {
      if (!order.delivery.delivery.user.mediaurls || !order.delivery.delivery.user.mediaurls.images) order.delivery.delivery.user.mediaurls = { images: [] };
      order.delivery.delivery.user.image_url = "assets/images/empty_dp.png";
      for (let imgObj of order.delivery.delivery.user.mediaurls.images) if (imgObj["default"]) { order.delivery.delivery.user.image_url = imgObj["default"]; break; }
    }
  }

  private handleError<T>(operation = 'operation', result?: T) {
    return (error: any): Observable<T> => {
      // TODO: send the error to remote logging infrastructure
      console.error(error); // log to console instead
      // TODO: better job of transforming error for user consumption
      console.log(`${operation} failed: ${error.message}`);
      // Let the app keep running by returning an empty result.
      return of(result as T);
    };
  }

}
