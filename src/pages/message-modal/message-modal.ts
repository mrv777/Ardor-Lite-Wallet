import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams, ViewController, AlertController, ToastController, Platform } from 'ionic-angular';
import { BarcodeScanner } from '@ionic-native/barcode-scanner';
import { FingerprintAIO } from '@ionic-native/fingerprint-aio';
import { PinDialog } from '@ionic-native/pin-dialog';
import { TranslateService } from '@ngx-translate/core';
import { Clipboard } from '@ionic-native/clipboard';

import { TransactionsProvider } from '../../providers/transactions/transactions';
import { AccountDataProvider } from '../../providers/account-data/account-data';

@IonicPage()
@Component({
  selector: 'page-message-modal',
  templateUrl: 'message-modal.html',
})
export class MessageModalPage {
  chain: number;
  fullHash: string;
  sender: string;
  message: string;
  passwordType: string = 'password';
  fingerAvailable: boolean = false;
  usePin: boolean = false;
  guest: boolean = false;
  hasPassphrase: boolean = false;

  decryptNeeded: boolean = false;
  passphrase: string;
  encryptedMsg: object;
  sharedKey: string;

  infoShared: string = 'The key to decrypt this specific encrypted message without having to reveal the account passphrase.';
  closeText: string = 'Close';
  qrText: string = 'Place QR code inside the scan area';
  incorrectPass: string = 'Incorrect Passphrase';
  enterPin: string = 'Enter your PIN';
  verifyPin: string = 'Verify your PIN';

  theme: string;

  constructor(public navCtrl: NavController, public navParams: NavParams, public transactionsProvider: TransactionsProvider, public viewCtrl: ViewController, public platform: Platform, private alertCtrl: AlertController,  private barcodeScanner: BarcodeScanner, private faio: FingerprintAIO, private pinDialog: PinDialog, public accountData: AccountDataProvider, private toastCtrl: ToastController, public translate: TranslateService, private clipboard: Clipboard) {
    this.chain = navParams.get('chain');
    this.fullHash = navParams.get('fullHash');
  }

  ionViewWillEnter() {
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
    this.translate.get('INFO_SHARED').subscribe((res: string) => {
      this.infoShared = res;
    });
    this.translate.get('CLOSE').subscribe((res: string) => {
      this.closeText = res;
    });
    this.translate.get('INCORRECT_PASS').subscribe((res: string) => {
        this.incorrectPass = res;
    });
    this.translate.get('QR_SCAN').subscribe((res: string) => {
        this.qrText = res;
    });
    this.translate.get('ENTER_PIN').subscribe((res: string) => {
        this.enterPin = res;
    });
    this.translate.get('VERIFY_PIN').subscribe((res: string) => {
        this.verifyPin = res;
    });

    this.transactionsProvider.getTransaction(this.chain, this.fullHash)
    .subscribe(
      transaction => {
        this.sender = transaction['senderRS'];
        if (transaction['attachment']['message']) {
          this.message = transaction['attachment']['message'];
        } else {
          this.decryptNeeded = true;
          this.encryptedMsg = transaction['attachment']['encryptedMessage'];
          this.message = "Encrypted Message";
        }
      }
    );
  }

  decryptMessage() {
    if (this.accountData.convertPasswordToAccount(this.passphrase) == this.accountData.getAccountID()) {
      let publicKey = this.accountData.getAccountPublicKey(this.sender)
      .subscribe(
        pubKey => {
          this.encryptedMsg['publicKey'] = pubKey['publicKey'];
          let msg = this.accountData.decryptMsg(this.encryptedMsg['data'], this.encryptedMsg, this.passphrase);
          this.message = msg['message'];
          this.sharedKey = msg['sharedKey'];
          this.decryptNeeded = false;
        }
      );
    } else {
      this.presentMessage(this.incorrectPass);
    }
  }

  togglePassword() {
    if (this.passwordType == 'password') {
      this.passwordType = 'text';
    } else {
      this.passwordType = 'password';
    }
  }

  openBarcodeScannerPassword() {
    this.barcodeScanner.scan({prompt : this.qrText, disableSuccessBeep: true}).then((barcodeData) => {
       this.passphrase = barcodeData['text'];
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
      this.passphrase = this.accountData.getSavedPassword();
    })
    .catch((error: any) => console.log(error));
  }

  showPin() {
    this.pinDialog.prompt(this.enterPin, this.verifyPin, ['OK', 'Cancel'])
    .then(
      (result: any) => {
        if (result.buttonIndex == 1) {
          if (this.accountData.checkPin(result.input1)) {
            this.passphrase = this.accountData.getSavedPassword();
          } else {
            this.presentMessage("Incorrect PIN");
          }
        } else if(result.buttonIndex == 2) {
          console.log('User cancelled');
        }
      }
    );
  }

  showInfo() {
    let toast = this.toastCtrl.create({
      message: this.infoShared,
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

  presentMessage(msg: string) {
    let alert = this.alertCtrl.create({
      title: msg,
      buttons: ['Dismiss']
    });
    alert.present();
  }

  copyKey() {
    this.clipboard.copy(this.sharedKey);
     let toast = this.toastCtrl.create({
      message: 'Shared key copied to clipboard',
      duration: 3000,
      position: 'bottom'
    });

    toast.onDidDismiss(() => {
      console.log('Dismissed toast');
    });

    toast.present();
  }

  closeModal() {
    this.viewCtrl.dismiss();
  }

}
