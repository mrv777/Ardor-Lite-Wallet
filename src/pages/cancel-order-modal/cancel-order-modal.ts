import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams, ViewController } from 'ionic-angular';
import { BarcodeScanner } from '@ionic-native/barcode-scanner';
import { FingerprintAIO } from '@ionic-native/fingerprint-aio';

import { AccountDataProvider } from '../../providers/account-data/account-data';
import { CoinExchangeProvider } from '../../providers/coin-exchange/coin-exchange';
import { TransactionsProvider } from '../../providers/transactions/transactions';

@IonicPage()
@Component({
  selector: 'page-cancel-order-modal',
  templateUrl: 'cancel-order-modal.html',
})
export class CancelOrderModalPage {
  chain: number;
  order: number;
  disableCancel: boolean = false;
  resultTxt: string = '';
  status: number;

  theme: string;
  password: string;
  passwordType: string = 'password';
  fingerAvailable: boolean = false;
  guest: boolean = false;
  
  constructor(public navCtrl: NavController, public navParams: NavParams, public accountData: AccountDataProvider, public viewCtrl: ViewController, private barcodeScanner: BarcodeScanner, private faio: FingerprintAIO, public coinExchangeProvider: CoinExchangeProvider, public transactionsProvider: TransactionsProvider) {
  	this.order = navParams.get('order');
    this.chain = navParams.get('chain');
  }

  ionViewDidLoad() {
    this.accountData.getTheme().then((theme) => {
        this.theme = theme;
      });
  }

  cancelOrder(){
  	this.disableCancel = true;
    this.status = 0;
    this.accountData.setPublicKeyPassword(this.password);

    this.coinExchangeProvider.cancelCoinExchange(this.order, this.chain)
      .subscribe(
        unsignedBytes => {
           if (unsignedBytes['errorDescription']) {
              this.resultTxt = unsignedBytes['errorDescription'];
              this.disableCancel = false;
           } else {
             this.transactionsProvider.broadcastTransaction(this.accountData.signTransaction(unsignedBytes['unsignedTransactionBytes'], this.password))
              .subscribe(
                broadcastResults => {
                  console.log(broadcastResults);
                  if (broadcastResults['fullHash'] != null) {
                    this.resultTxt = `Exchange successful with fullHash: ${broadcastResults['fullHash']}`;
                    this.status = 1;
                  } else {
                    this.resultTxt = broadcastResults['errorDescription'];
                    this.disableCancel = false;
                    this.status = -1;
                  }
                }
              );
           }
        }
      );
  }

  togglePassword() {
  	if (this.passwordType == 'password') {
  		this.passwordType = 'text';
  	} else {
  		this.passwordType = 'password';
  	}
  }

  showFingerprint() {
    this.faio.show({
      clientId: 'Ardor-Lite',
      clientSecret: this.accountData.getFingerSecret(), //Only necessary for Android
      disableBackup: false  //Only for Android(optional)
    })
    .then((result: any) => { 
    	this.password = this.accountData.getSavedPassword();
    })
    .catch((error: any) => console.log(error));
  }

  openBarcodeScannerPassword(password: string) {
  	this.barcodeScanner.scan().then((barcodeData) => {
     	this.password = barcodeData['text'];
    }, (err) => {
        // An error occurred
    });
  }

  closeModal() {
    this.viewCtrl.dismiss();
  }

}
