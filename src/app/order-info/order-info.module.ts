import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';

import { IonicModule } from '@ionic/angular';

import { OrderInfoPageRoutingModule } from './order-info-routing.module';

import { OrderInfoPage } from './order-info.page';
import { CallNumber } from '@ionic-native/call-number/ngx';
import { GoogleMapsService } from '../services/network/google-maps.service';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    TranslateModule,
    OrderInfoPageRoutingModule
  ],
  providers: [CallNumber, GoogleMapsService],
  declarations: [OrderInfoPage]
})
export class OrderInfoPageModule { }
