import { Component, OnInit, OnDestroy } from '@angular/core';
import { Product } from 'src/models/product.models';
import { Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { UiElementsService } from '../services/common/ui-elements.service';
import { ApiService } from '../services/network/api.service';
import { Subscription } from 'rxjs';
import { Rating } from 'src/models/rating.models';
import { Review } from 'src/models/review.models';
import { BaseListResponse } from 'src/models/base-list.models';
import { Helper } from 'src/models/helper.models';
import { Profile } from 'src/models/profile.models';

@Component({
  selector: 'app-reviews',
  templateUrl: './reviews.page.html',
  styleUrls: ['./reviews.page.scss']
})
export class ReviewsPage implements OnInit, OnDestroy {
  private subscriptions = new Array<Subscription>();
  private infiniteScrollEvent;
  private nextUrl: string;
  isLoading = true;
  rating: Rating;
  reviews = new Array<Review>();
  profile: Profile;

  constructor(private router: Router, private translate: TranslateService,
    private uiElementService: UiElementsService, private apiService: ApiService) { }

  ngOnInit() {
    this.profile = Helper.getProfile();
        this.translate.get("loading").subscribe(value => {
          this.uiElementService.presentLoading(value);
          // this.subscriptions.push(this.apiService.getRatingSummaryProduct(this.vendor.id).subscribe(res => this.rating = res, err => console.log("getRatingSummaryProduct", err)));
          this.subscriptions.push(this.apiService.getReviewsVendor(this.profile.id, 1).subscribe(res => setTimeout(() => this.reviewsRes(res), 500), err => this.reviewsErr(err)));
        });
      }

  ngOnDestroy() {
    for (let sub of this.subscriptions) sub.unsubscribe();
    this.uiElementService.dismissLoading();
  }

  doInfiniteReviews(event) {
    if (this.nextUrl == null) {
      event.target.complete();
    } else {
      this.infiniteScrollEvent = event;
      this.subscriptions.push(this.apiService.getURL(this.nextUrl).subscribe(res => {
        let locale = Helper.getLocale();
        for (let review of res.data) review.created_at = Helper.formatTimestampDate(review.created_at, locale);
        this.reviewsRes(res);
      }, err => this.reviewsErr(err)));
    }
  }

  reviewsRes(res: BaseListResponse) {
    this.reviews = this.reviews.concat(res.data);
    this.nextUrl = res.links.next;
    if (this.infiniteScrollEvent) this.infiniteScrollEvent.target.complete();
    this.isLoading = false;
    this.uiElementService.dismissLoading();
  }

  reviewsErr(err) {
    console.log("productsErr", err);
    this.uiElementService.dismissLoading();
    if (this.infiniteScrollEvent) this.infiniteScrollEvent.target.complete();
    this.isLoading = false;
  }

}
