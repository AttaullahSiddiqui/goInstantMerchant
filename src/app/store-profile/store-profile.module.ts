import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';

import { IonicModule } from '@ionic/angular';

import { StoreProfilePageRoutingModule } from './store-profile-routing.module';

import { StoreProfilePage } from './store-profile.page';
import { Camera } from '@ionic-native/camera/ngx';
import { IOSFilePicker } from '@ionic-native/file-picker/ngx';
import { Crop } from '@ionic-native/crop/ngx';
@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    TranslateModule,    
    StoreProfilePageRoutingModule
  ],
  providers: [Camera, IOSFilePicker, Crop],
  declarations: [StoreProfilePage]
})
export class StoreProfilePageModule {}
