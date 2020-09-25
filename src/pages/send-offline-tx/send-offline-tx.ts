import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams, Platform, ViewController, ToastController } from 'ionic-angular';
import { BarcodeScanner } from '@ionic-native/barcode-scanner';
import { TranslateService } from '@ngx-translate/core';
import { FingerprintAIO } from '@ionic-native/fingerprint-aio';
import { PinDialog } from '@ionic-native/pin-dialog';

import { AccountDataProvider } from '../../providers/account-data/account-data';
import { TransactionsProvider } from '../../providers/transactions/transactions';

@IonicPage()
@Component({
  selector: 'page-send-offline-tx',
  templateUrl: 'send-offline-tx.html',
})
export class SendOfflineTxPage {

  tx: string;
  txBytes: string;
  txAttachment: string;

  node: string;
  nodeSelect: string;
  hideCustom: boolean = true;
  disableSend: boolean = false;
  disableClose: boolean = false;
  resultTxt: string = '';
  status: number;
  sign: boolean = false;
  password: string;
  passwordType: string = 'password';
  fingerAvailable: boolean = false;
  usePin: boolean = false;
  guest: boolean = false;
  hasPassphrase: boolean = false;

  theme: string;

  qrText: string = 'Place QR code inside the scan area';
  infoOffline: string = 'For generating offline transactions, you can use the Ardor API (if you are running a full node, an easy to use page can be found at http://localhost:27876/test) or you can use SIGBRO OFFLINE';
  closeText: string = 'Close';
  enterPin: string = 'Enter your PIN';
  verifyPin: string = 'Verify your PIN';
  incorrectPass: string = 'Incorrect Passphrase';

  constructor(public navCtrl: NavController, public navParams: NavParams, private barcodeScanner: BarcodeScanner, public viewCtrl: ViewController, private toastCtrl: ToastController, public transactions: TransactionsProvider, 
    public platform: Platform,
    private translate: TranslateService, 
    private faio: FingerprintAIO, 
    private pinDialog: PinDialog,
    public accountData: AccountDataProvider) {

    if (navParams.get('sign')) {
      this.sign = true;
    }
    if (navParams.get('tx')) {
      this.tx = navParams.get('tx');
    }
  }

  ionViewWillEnter() {
    this.accountData.getTheme().then((theme) => {
      this.theme = theme;
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
    this.nodeSelect = "mainnet/";
    this.node = this.nodeSelect;

    this.translate.get('CLOSE').subscribe((res: string) => {
      this.closeText = res;
    });
    this.translate.get('QR_SCAN').subscribe((res: string) => {
      this.qrText = res;
    });
    this.translate.get('INFO_OFFLINE').subscribe((res: string) => {
      this.infoOffline = res;
    });
    this.translate.get('ENTER_PIN').subscribe((res: string) => {
        this.enterPin = res;
    });
    this.translate.get('VERIFY_PIN').subscribe((res: string) => {
        this.verifyPin = res;
    });
    this.translate.get('INCORRECT_PASS').subscribe((res: string) => {
        this.incorrectPass = res;
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

  openBarcodeScanner() {
    this.barcodeScanner.scan({prompt : this.qrText, disableSuccessBeep: true}).then((barcodeData) => {
      this.tx = barcodeData['text'];
    }, (err) => {
        // An error occurred
    });
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
            //this.presentMessage("Incorrect PIN");
          }
        } else if(result.buttonIndex == 2) {
          console.log('User cancelled');
        }
      }
    );
  }

  openBarcodeScannerPassword() {
    this.barcodeScanner.scan({prompt : this.qrText, disableSuccessBeep: true}).then((barcodeData) => {
       this.password = barcodeData['text'];
    }, (err) => {
        // An error occurred
    });
  }

  showInfo() {
    let toast = this.toastCtrl.create({
      message: this.infoOffline,
      showCloseButton: true,
      closeButtonText: this.closeText,
      dismissOnPageChange: true,
      position: 'bottom'
    });

    toast.onDidDismiss(() => {
      console.log('Dismissed toast');
    });

    toast.present();
  }

  signTX() {
    if (this.tx) { // Make sure transaction is not empty
      this.disableSend = true;
      this.txBytes = this.tx.split("||")[0];
      this.txAttachment = this.tx.split("||")[1];

      if (this.sign && this.password) {
        if (this.accountData.convertPasswordToAccount(this.password) == this.accountData.getAccountID()) { //If we are siging make sure passphrase is for the correct account
          this.txBytes = this.accountData.signTransaction(this.txBytes, this.password);
          this.onSend();
        } else {
          this.resultTxt = this.incorrectPass;
          this.disableSend = false;
          this.status = -1;
        }
      } else {
        this.onSend();
      }
    } else {
      this.resultTxt = "No Transaction";
    }
  }

  onSend() {
    this.resultTxt = `Attempting to send tx: ${this.tx} on ${this.node}`;

    //let txObject = JSON.parse(this.tx);
    this.accountData.setNode(this.node).then(() => {
      this.transactions.broadcastTransaction(this.txBytes, this.txAttachment).subscribe((result) => {
    		if (!result['fullHash']) {
    			this.resultTxt = result['errorDescription'];
    			this.disableSend = false;
    			this.status = -1;
    		} else {
    			this.status = 1;
    			this.resultTxt = `Transaction successfully broadcasted with id: ${result['fullHash']}`;
    		}
  	  }, (error) => {
        this.resultTxt = "Failed to communicate with node";
        this.disableSend = false;
        this.status = -1;
      }
      );
    });
    this.status = 0;
  }

  togglePassword() {
    if (this.passwordType == 'password') {
      this.passwordType = 'text';
    } else {
      this.passwordType = 'password';
    }
  }

  closeModal() {
    this.viewCtrl.dismiss();
  }

}
