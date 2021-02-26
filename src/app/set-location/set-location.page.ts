import { Component, OnInit, ViewChild, ElementRef, NgZone } from '@angular/core';
import { ModalController, AlertController, NavController, Platform } from '@ionic/angular';
import { MyAddress } from 'src/models/address.models';
import { Helper } from 'src/models/helper.models';
import { Subscription } from 'rxjs';
import { User } from 'src/models/user.models';
import { TranslateService } from '@ngx-translate/core';
import { Router } from '@angular/router';
import { ApiService } from '../services/network/api.service';
import { UiElementsService } from '../services/common/ui-elements.service';
import { Geolocation } from '@ionic-native/geolocation/ngx';
import { Diagnostic } from '@ionic-native/diagnostic/ngx';
import { LocationAccuracy } from '@ionic-native/location-accuracy/ngx';
import { GoogleMapsService } from '../services/network/google-maps.service';

@Component({
  selector: 'app-set-location',
  templateUrl: './set-location.page.html',
  styleUrls: ['./set-location.page.scss']
})
export class SetLocationPage implements OnInit {
  @ViewChild("pleaseConnect", { static: true }) pleaseConnect: ElementRef;
  @ViewChild("map", { static: true }) mapElement: ElementRef;
  private autocompleteService: any;
  private placesService: any;
  private initialized: boolean;
  private marker: google.maps.Marker;
  private detecting = false;
  private subscriptions = new Array<Subscription>();
  query = "";
  places = [];
  location: MyAddress;

  constructor(private geolocation: Geolocation, private zone: NgZone, private translate: TranslateService, private modalController: ModalController, private router: Router,
    private diagnostic: Diagnostic, private alertCtrl: AlertController, private navCtrl: NavController, private apiService: ApiService, private paltform: Platform,
    private maps: GoogleMapsService, private uiElementService: UiElementsService, private locationAccuracy: LocationAccuracy) { }

  ngOnInit() {
    if (this.router.getCurrentNavigation().extras.state) this.location = this.router.getCurrentNavigation().extras.state.address;
  }

  ngOnDestroy() {
    for (let sub of this.subscriptions) sub.unsubscribe();
    this.uiElementService.dismissLoading();
  }

  ionViewDidEnter() {
    if (!this.initialized) {
      let mapLoaded = this.maps.init(this.mapElement.nativeElement, this.pleaseConnect.nativeElement, this.location).then(() => {
        this.autocompleteService = new google.maps.places.AutocompleteService();
        this.placesService = new google.maps.places.PlacesService(this.maps.map);
        this.maps.map.addListener('click', (event) => {
          if (event && event.latLng) {
            let pos = new google.maps.LatLng(event.latLng.lat(), event.latLng.lng());
            this.geocode(pos);
          }
        });
        this.initialized = true;
        if (this.location) {
          let pos = new google.maps.LatLng(Number(this.location.latitude), Number(this.location.longitude));
          this.plotMarker(pos);
        } else {
          this.detect();
        }
      }).catch(err => this.close());
      mapLoaded.catch(err => this.close());
    }
  }

  searchPlace() {
    if (this.autocompleteService && this.query.length > 0) {
      let config = { input: this.query }
      this.autocompleteService.getPlacePredictions(config, (predictions, status) => {
        if (status == google.maps.places.PlacesServiceStatus.OK && predictions) {
          this.places = [];
          predictions.forEach((prediction) => this.places.push(prediction));
        }
      });
    } else {
      this.places = [];
    }
  }

  selectPlace(place) {
    this.query = place.description;
    this.places = [];
    let myLocation = new MyAddress();
    myLocation.id = -1;
    if (this.location) {
      myLocation.id = this.location.id;
      myLocation.title = this.location.title;
    }
    myLocation.formatted_address = place.name;
    this.placesService.getDetails({ placeId: place.place_id }, (details) => {
      this.zone.run(() => {
        let form_address = '';
        details.address_components.map(element => {
          if (element.types[0] != "country" && element.types[0] != "postal_code" && element.types[0] != "administrative_area_level_1") {
            form_address = form_address ? form_address + ", " + element.long_name : element.long_name
          }
        })
        myLocation.formatted_address = form_address;
        // myLocation.formatted_address = (details.formatted_address && details.formatted_address.length) ? details.formatted_address : details.name;
        myLocation.latitude = String(details.geometry.location.lat());
        myLocation.longitude = String(details.geometry.location.lng());
        let lc = { lat: details.geometry.location.lat(), lng: details.geometry.location.lng() };
        this.maps.map.setCenter(lc);
        this.location = myLocation;
        let pos = new google.maps.LatLng(Number(lc.lat), Number(lc.lng));
        this.plotMarker(pos);
      });
    });
  }

  save() {
    if (this.location) {
      // this.modalController.create({ component: TitlePage, componentProps: { address: this.location } }).then((modalElement) => {
      //   modalElement.onDidDismiss().then(data => {
      //     console.log(data);
      //     if (data && data.data) {
      //       this.location = data.data;
      //       this.location.formatted_address = String(this.location.formatted_address);
      //       this.location.latitude = String(this.location.latitude);
      //       this.location.longitude = String(this.location.longitude);
      Helper.setLocationDefault(this.location);
      this.close();
      //     }
      //   });
      //   modalElement.present();
      // })
    } else {
      this.selectAddress(this.location);
    }
  }

  selectAddress(address: MyAddress) {
    Helper.setAddressSelected(address);
    this.close();
  }

  close() {
    this.navCtrl.pop();
  }

  detect() {
    this.diagnostic.isLocationEnabled().then((isAvailable) => {
      if (!isAvailable) if (this.paltform.is("cordova")) this.alertLocationServices();
    }).catch((e) => {
      console.error(e);
      if (this.paltform.is("cordova")) this.alertLocationServices();
    });

    if (!this.detecting) {
      this.detecting = true;
      this.geolocation.getCurrentPosition().then((position) => {
        let pos = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);
        this.geocode(pos);
        this.detecting = false;
      }).catch((err) => {
        console.log("getCurrentPosition", err);
        this.translate.get("curr_pos_fail").subscribe(value => this.uiElementService.presentToast(value));
        this.detecting = false;
      });
    }
  }

  geocode(pos: google.maps.LatLng) {
    let geocoder = new google.maps.Geocoder();
    let request = { location: pos };
    geocoder.geocode(request, (results, status) => {
      if (status == google.maps.GeocoderStatus.OK && results.length > 0) {
        let myLocation = new MyAddress();
        myLocation.id = -1;
        if (this.location) {
          myLocation.id = this.location.id;
          myLocation.title = this.location.title;
        }
        let form_address = '';
        results[0].address_components.map(element => {
          if (element.types[0] != "country" && element.types[0] != "postal_code" && element.types[0] != "administrative_area_level_1") {
            form_address = form_address ? form_address + ", " + element.long_name : element.long_name;
          }
        })
        myLocation.formatted_address = form_address;
        // myLocation.formatted_address = results[0].formatted_address;
        myLocation.latitude = String(pos.lat());
        myLocation.longitude = String(pos.lng());
        this.location = myLocation;
        this.plotMarker(pos);
        this.uiElementService.presentToast(this.location.formatted_address);
      }
    });
  }

  plotMarker(pos: google.maps.LatLng) {
    if (!this.marker) {
      this.marker = new google.maps.Marker({
        position: pos, map: this.maps.map
        //, icon: 'assets/images/marker_map_me.png'
      });
      this.marker.setClickable(true);
      this.marker.addListener('click', (event) => {
        console.log("markerevent", event);
        this.uiElementService.presentToast(this.location.formatted_address);
      });
    }
    else {
      this.marker.setPosition(pos);
    }
    this.maps.map.panTo(pos);
  }

  alertLocationServices() {
    this.translate.get(['location_services_title', 'location_services_message', 'okay']).subscribe(text => {
      this.alertCtrl.create({
        header: text['location_services_title'],
        message: text['location_services_message'],
        buttons: [{
          text: text['okay'],
          role: 'cancel',
          handler: () => {
            this.locationAccuracy.canRequest().then((canRequest: boolean) => {
              if (canRequest) {
                // the accuracy option will be ignored by iOS
                this.locationAccuracy.request(this.locationAccuracy.REQUEST_PRIORITY_HIGH_ACCURACY).then(res => console.log('Request successful', res), error => console.log('Error requesting location permissions', error));
              }
            });
          }
        }]
      }).then(alert => alert.present());
    })
  }

}
