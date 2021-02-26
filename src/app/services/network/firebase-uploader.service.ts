import { Injectable } from '@angular/core';
import { File, FileEntry, Entry } from '@ionic-native/file/ngx';
import { Platform } from '@ionic/angular';
import * as firebase from 'firebase';

@Injectable({
  providedIn: 'root'
})
export class FirebaseUploaderService {

  constructor(private platform: Platform, private file: File) { }

  resolveUriAndUpload(uri: string) {
    return new Promise((resolve, reject) => {
      // console.log('uri: ' + uri);
      // if (this.platform.is("android") && uri.startsWith('content://') && uri.indexOf('/storage/') != -1) {
      //   uri = "file://" + uri.substring(uri.indexOf("/storage/"), uri.length);
      //   console.log('file: ' + uri);
      // }

      this.file.resolveLocalFilesystemUrl(uri).then((entry: Entry) => {
        console.log(entry);
        var fileEntry = entry as FileEntry;
        fileEntry.file(success => {
          var mimeType = success.type;
          console.log("mimeType", mimeType);
          // let dirPath = entry.nativeURL;
          // this.upload(dirPath, entry.name, mimeType);
          var reader = new FileReader();
          reader.onloadend = (evt: any) => {
            var imgBlob: any = new Blob([evt.target.result], { type: mimeType });
            imgBlob.name = entry.name;
            this.uploadBlob(imgBlob).then(res => resolve(res), err => reject(err))
          };
          reader.onerror = (e) => reject(e);
          reader.readAsArrayBuffer(success);
        }, error => {
          console.log(error);
        });
      })

      // this.file.resolveLocalFilesystemUrl(uri).then((entry: Entry) => {
      //   console.log(entry);
      //   var fileEntry = entry as FileEntry;
      //   fileEntry.file(success => {
      //     var mimeType = success.type;
      //     console.log(mimeType);
      //     let dirPath = entry.nativeURL;

      //     let path = dirPath;
      //     let name = entry.name;
      //     let mime = mimeType;

      //     console.log('original: ' + path);
      //     let dirPathSegments = path.split('/');
      //     dirPathSegments.pop();
      //     path = dirPathSegments.join('/');
      //     console.log('dir: ' + path);

      //     this.file.readAsArrayBuffer(path, name).then(buffer => this.uploadBlob(new Blob([buffer], { type: mime })).then(res => resolve(res), err => reject(err))).catch(err => reject(err))
      //   }, error => reject(error));
      // })
    });
  }

  uploadBlob(blob: Blob) {
    return new Promise((resolve, reject) => {
      let storageRef = firebase.storage().ref();
      storageRef.child(new Date().getTime().toString()).put(blob).then(snapshot => {
        console.log(snapshot);
        firebase.storage().ref(snapshot.metadata.fullPath).getDownloadURL().then(url => resolve(url)).catch(err => reject(err))
      }, err => {
        reject(err);
      })
    });
  }

  uploadFile(file) {
    return new Promise((resolve, reject) => {
      let storageRef = firebase.storage().ref();
      storageRef.child(new Date().getTime().toString()).put(file).then(snapshot => {
        console.log(snapshot);
        firebase.storage().ref(snapshot.metadata.fullPath).getDownloadURL().then(url => resolve(url)).catch(err => reject(err))
      }, err => {
        reject(err);
      })
    });
  }

  uploadImage(imageURI) {
    return new Promise<any>((resolve, reject) => {
      let storageRef = firebase.storage().ref();
      let imageRef = storageRef.child('image').child('imageName');
      this.encodeImageUri(imageURI, function (image64) {
        imageRef.putString(image64, 'data_url').then(snapshot => {
          resolve(snapshot.downloadURL)
        }, err => {
          reject(err);
        })
      })
    });
  }

  encodeImageUri(imageUri, callback) {
    var c = document.createElement('canvas');
    var ctx = c.getContext("2d");
    var img = new Image();
    img.onload = function () {
      var aux: any = this;
      c.width = aux.width;
      c.height = aux.height;
      ctx.drawImage(img, 0, 0);
      var dataURL = c.toDataURL("image/jpeg");
      callback(dataURL);
    };
    img.src = imageUri;
  }

}
