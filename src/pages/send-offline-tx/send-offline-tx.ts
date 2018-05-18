import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams, ViewController } from 'ionic-angular';
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

  constructor(public navCtrl: NavController, public navParams: NavParams, private barcodeScanner: BarcodeScanner, public viewCtrl: ViewController, public transactions: TransactionsProvider, public accountData: AccountDataProvider) {
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
    this.barcodeScanner.scan().then((barcodeData) => {
      this.tx = barcodeData['text'];
    }, (err) => {
        // An error occurred
    });
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
