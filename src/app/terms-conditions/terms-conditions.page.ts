import { Component, OnInit } from '@angular/core';
import { Helper } from 'src/models/helper.models';

@Component({
  selector: 'app-terms-conditions',
  templateUrl: './terms-conditions.page.html',
  styleUrls: ['./terms-conditions.page.scss']
})
export class TermsConditionsPage implements OnInit {
  privacy_policy: string;

  constructor() { }

  ngOnInit() {
  }

  ionViewDidEnter() {
    this.privacy_policy = Helper.getSetting("terms");
  }
}
