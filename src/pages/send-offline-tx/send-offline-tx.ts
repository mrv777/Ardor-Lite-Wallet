import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams, ViewController, ToastController } from 'ionic-angular';
import { BarcodeScanner } from '@ionic-native/barcode-scanner';

import { AccountDataProvider } from '../../providers/account-data/account-data';
import { TransactionsProvider } from '../../providers/transactions/transactions';

@IonicPage()
@Component({
  selector: 'page-send-offline-tx',
  templateUrl: 'send-offline-tx.html',
})
export class SendOfflineTxPage {

  tx: string;
  node: string;
  nodeSelect: string;
  hideCustom: boolean = true;
  disableSend: boolean = false;
  disableClose: boolean = false;
  resultTxt: string = '';
  status: number;

  theme: string;

  constructor(public navCtrl: NavController, public navParams: NavParams, private barcodeScanner: BarcodeScanner, public viewCtrl: ViewController, private toastCtrl: ToastController, public transactions: TransactionsProvider, public accountData: AccountDataProvider) {
  }

  ionViewWillEnter() {
    this.accountData.getTheme().then((theme) => {
      this.theme = theme;
    });
    this.nodeSelect = "mainnet/";
    this.node = this.nodeSelect;
  }

  changeNode() {
    if (this.nodeSelect == "") {
      this.hideCustom = false;
    } else {
      this.hideCustom = true;
    }
    this.node = this.nodeSelect;
  }

  openBarcodeScanner() {
    this.barcodeScanner.scan({prompt : "Place QR code inside the scan area", disableSuccessBeep: true}).then((barcodeData) => {
      this.tx = barcodeData['text'];
    }, (err) => {
        // An error occurred
    });
  }

  showInfo() {
    let toast = this.toastCtrl.create({
      message: "For generating offline transactions, you can use the Ardor API (if you are running a full node, an easy to use page can be found at http://localhost:27876/test) or you can use SIGBRO OFFLINE",
      showCloseButton: true,
      dismissOnPageChange: true,
      position: 'bottom'
    });

    toast.onDidDismiss(() => {
      console.log('Dismissed toast');
    });

    toast.present();
  }

  onSend() {
  	this.disableSend = true;
    this.resultTxt = `Attempting to send tx: ${this.tx} on ${this.node}`;

    //let txObject = JSON.parse(this.tx);
    this.accountData.setNode(this.node).then(() => {
      this.transactions.broadcastTransaction(this.tx).subscribe((result) => {
    		if (!result['fullHash']) {
    			this.resultTxt = result['errorDescription'];
    			this.disableSend = false;
    			this.status = -1;
    		} else {
    			this.status = 1;
    			this.resultTxt = `Transaction successfully broadcasted with id: ${result['fullHash']}`;
    		}
  	  });
    });
    this.status = 0;
  }

  closeModal() {
    this.viewCtrl.dismiss();
  }

}
