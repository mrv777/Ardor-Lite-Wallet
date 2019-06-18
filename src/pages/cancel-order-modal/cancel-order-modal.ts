import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams, ViewController, Platform, AlertController } from 'ionic-angular';
import { BarcodeScanner } from '@ionic-native/barcode-scanner';
import { FingerprintAIO } from '@ionic-native/fingerprint-aio';
import { PinDialog } from '@ionic-native/pin-dialog';
import { TranslateService } from '@ngx-translate/core';

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

  incorrectPass: string = 'Incorrect Passphrase';
  enterPin: string = 'Enter your PIN';
  verifyPin: string = 'Verify your PIN';
  qrText: string = 'Place QR code inside the scan area';

  theme: string;
  password: string;
  passwordType: string = 'password';
  hasPassphrase: boolean = false;
  usePin: boolean = false;
  fingerAvailable: boolean = false;
  guest: boolean = false;
  
  constructor(public navCtrl: NavController, public navParams: NavParams, public accountData: AccountDataProvider, public viewCtrl: ViewController, private barcodeScanner: BarcodeScanner, private faio: FingerprintAIO, private pinDialog: PinDialog, public coinExchangeProvider: CoinExchangeProvider, public transactionsProvider: TransactionsProvider, public translate: TranslateService, public platform: Platform, private alertCtrl: AlertController) {
  	this.order = navParams.get('order');
    this.chain = navParams.get('chain');
  }

  ionViewDidLoad() {
    this.translate.get('ENTER_PIN').subscribe((res: string) => {
        this.enterPin = res;
    });
    this.translate.get('VERIFY_PIN').subscribe((res: string) => {
        this.verifyPin = res;
    });
    this.translate.get('INCORRECT_PASS').subscribe((res: string) => {
        this.incorrectPass = res;
    });
    this.translate.get('QR_SCAN').subscribe((res: string) => {
        this.qrText = res;
    });

    this.guest = this.accountData.isGuestLogin();
    if (!this.guest) {
      this.hasPassphrase = this.accountData.hasSavedPassword();
      if (this.platform.is('cordova')) {
        this.faio.isAvailable().then((available) => {
          if (available == 'OK' || available == 'Available' || available == 'finger' || available == 'face') {
            this.fingerAvailable = true;
            this.usePin = false;
          } else {
            this.fingerAvailable = false;
            this.usePin = true;
          }
        })
        .catch((error: any) => {
          console.log(error);
          this.usePin = true;
        });
      }
    }

    this.accountData.getTheme().then((theme) => {
        this.theme = theme;
      });
  }

  cancelOrder(){
    if (this.accountData.convertPasswordToAccount(this.password) == this.accountData.getAccountID()) {
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
               let signedTx = this.accountData.verifyAndSignTransaction(unsignedBytes['unsignedTransactionBytes'], this.password, 'exchangeCoins', { recipient: 0, amountNQT: 0 });
               if (signedTx != 'failed') {
                 this.transactionsProvider.broadcastTransaction(signedTx)
                  .subscribe(
                    broadcastResults => {
                      console.log(broadcastResults);
                      if (broadcastResults['fullHash'] != null) {
                        this.resultTxt = `Successfully canceled order`;
                        this.status = 1;
                      } else {
                        this.resultTxt = broadcastResults['errorDescription'];
                        this.disableCancel = false;
                        this.status = -1;
                      }
                    }
                  );
                } else {
                    this.resultTxt = 'Cancel Failed - WARNING: Transaction returned from node is incorrect';
                    this.status = -1;
                    this.disableCancel = false;
                 }
             }
          }
        );
    } else {
      this.resultTxt = this.incorrectPass;
      this.status = -1;
    }
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
      disableBackup: false,  //Only for Android(optional)
      localizedFallbackTitle: 'Use Pin', //Only for iOS
      localizedReason: 'Please authenticate' //Only for iOS
    })
    .then((result: any) => { 
    	this.password = this.accountData.getSavedPassword();
    })
    .catch((error: any) => console.log(error));
  }

  showPin() {
    this.pinDialog.prompt(this.enterPin, this.verifyPin, ['OK', 'Cancel'])
    .then(
      (result: any) => {
        if (result.buttonIndex == 1) {
          if (this.accountData.checkPin(result.input1)) {
            this.password = this.accountData.getSavedPassword();
          } else {
            this.presentMessage("Incorrect PIN");
          }
        } else if(result.buttonIndex == 2) {
          console.log('User cancelled');
        }
      }
    );
  }

  presentMessage(msg: string) {
    let alert = this.alertCtrl.create({
      title: msg,
      buttons: ['Dismiss']
    });
    alert.present();
  }

  openBarcodeScannerPassword(password: string) {
  	this.barcodeScanner.scan({prompt : this.qrText, disableSuccessBeep: true}).then((barcodeData) => {
     	this.password = barcodeData['text'];
    }, (err) => {
        // An error occurred
    });
  }

  closeModal() {
    this.viewCtrl.dismiss();
  }

}
