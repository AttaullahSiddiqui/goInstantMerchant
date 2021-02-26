import { Injectable } from '@angular/core';
import { Network } from '@ionic-native/network/ngx';
import { Platform } from '@ionic/angular';

@Injectable({
  providedIn: 'root'
})
export class ConnectivityService {
  private onDevice: boolean;

  constructor(private platform: Platform, private network: Network) { }

  isOnline(): boolean {
    if (this.onDevice && this.network.type) {
      return this.network.type != 'none';
    } else {
      return navigator.onLine;
    }
  }

  isOffline(): boolean {
    if (this.onDevice && this.network.type) {
      return this.network.type == 'none';
    } else {
      return !navigator.onLine;
    }
  }

  watchOnline(): any {
    return this.network.onConnect();
  }

  watchOffline(): any {
    return this.network.onDisconnect();
  }

}
