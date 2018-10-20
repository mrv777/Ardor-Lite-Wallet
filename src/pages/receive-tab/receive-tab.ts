import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams, ViewController, ToastController } from 'ionic-angular';
import { Clipboard } from '@ionic-native/clipboard';

import { AccountDataProvider } from '../../providers/account-data/account-data';

@IonicPage()
@Component({
  selector: 'page-receive-tab',
  templateUrl: 'receive-tab.html',
})
export class ReceiveTabPage {
  qrCode: string;
  accountID: string;

  constructor(public navCtrl: NavController, public navParams: NavParams, public accountData: AccountDataProvider, public viewCtrl: ViewController, private clipboard: Clipboard, private toastCtrl: ToastController) {
  }

  ionViewDidLoad() {
    this.accountID = this.accountData.getAccountID();
  }

  copyAccount() {
  	this.clipboard.copy(this.accountID);
  	this.showToast('Address copied to clipboard');
  }

  showToast(message: string) {
    let toast = this.toastCtrl.create({
      message: message,
      duration: 3000,
      position: 'bottom'
    });

    toast.onDidDismiss(() => {
      console.log('Dismissed toast');
    });

    toast.present();
  }

}
