import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams, ViewController } from 'ionic-angular';
import { BarcodeScanner } from '@ionic-native/barcode-scanner';

import { AccountDataProvider } from '../../providers/account-data/account-data';

@IonicPage()
@Component({
  selector: 'page-guest-login',
  templateUrl: 'guest-login.html',
})
export class GuestLoginPage {

  accountID: string;
  node: string;
  nodeSelect: string;
  hideCustom: boolean = true;
  error: string = '';

  theme: string;

  constructor(public navCtrl: NavController, public navParams: NavParams, public viewCtrl: ViewController, private barcodeScanner: BarcodeScanner, public accountData: AccountDataProvider) {
  }

  ionViewWillEnter() {
    this.accountData.getTheme().then((theme) => {
      this.theme = theme;
    });
    this.nodeSelect = "mainnet/";
    this.node = this.nodeSelect;
  }

  openBarcodeScanner() {
    this.barcodeScanner.scan().then((barcodeData) => {
      this.accountID = barcodeData['text'];
    }, (err) => {
        // An error occurred
    });
  }

  changeNode() {
    if (this.nodeSelect == "") {
      this.hideCustom = false;
    } else {
      this.hideCustom = true;
    }
    this.node = this.nodeSelect;
  }

  closeModal() {
  	this.accountData.setNode(this.node).then(() => {
      this.accountData.checkNode().subscribe(
        (nodeStatus) => {
          if (nodeStatus['blockchainState'] == "UP_TO_DATE") {
            this.viewCtrl.dismiss(this.accountID);
          } else {
            this.error = "Node error or out of sync. Please try again.";
          }
        },
        (err) => {
          this.error = "Node not online. Please try again.";
        });
    });
  }

}
