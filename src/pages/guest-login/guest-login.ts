import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams, ViewController } from 'ionic-angular';
import { BarcodeScanner } from '@ionic-native/barcode-scanner';
import { TranslateService } from '@ngx-translate/core';

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
  savePassphrase: boolean = false;

  theme: string;
  qrText: string = 'Place QR code inside the scan area';
  nodeOffline: string = 'Node not online. Please try again.';

  constructor(public navCtrl: NavController, public navParams: NavParams, public viewCtrl: ViewController, private translate: TranslateService, private barcodeScanner: BarcodeScanner, public accountData: AccountDataProvider) {
  }

  ionViewWillEnter() {
    this.translate.get('QR_SCAN').subscribe((res: string) => {
      this.qrText = res;
    });
    this.translate.get('NODE_OFFLINE').subscribe((res: string) => {
      this.nodeOffline = res;
    });

    this.accountData.getTheme().then((theme) => {
      this.theme = theme;
    });
    this.accountData.getSavedGuest().then((account) => {
      if (account && account != '') {
        this.accountID = account;
        this.savePassphrase = true;
      }
    });
    this.nodeSelect = "mainnet/";
    this.node = this.nodeSelect;
  }

  openBarcodeScanner() {
    this.barcodeScanner.scan({prompt : this.qrText, disableSuccessBeep: true}).then((barcodeData) => {
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

  closeModalNoLogin() {
    this.viewCtrl.dismiss();
  }

  closeModal() {
  	this.accountData.setNode(this.node).then(() => {
      this.accountData.checkNode().subscribe(
        (nodeStatus) => {
          if (nodeStatus['blockchainState'] == "UP_TO_DATE") {
            if (this.savePassphrase) {
              this.accountData.setSavedGuest(this.accountID);
            } else {
              this.accountData.setSavedGuest('');
            }
            this.viewCtrl.dismiss(this.accountID);
          } else {
            this.error = "Node error or out of sync. Please try again.";
          }
        },
        (err) => {
          this.error = this.nodeOffline;
        });
    });
  }

}
