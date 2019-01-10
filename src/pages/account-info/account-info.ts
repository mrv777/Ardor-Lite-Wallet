import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams, ViewController, ToastController, AlertController, Platform } from 'ionic-angular';
import { Clipboard } from '@ionic-native/clipboard';
import { BarcodeScanner } from '@ionic-native/barcode-scanner';
import { FingerprintAIO } from '@ionic-native/fingerprint-aio';
import { PinDialog } from '@ionic-native/pin-dialog';

import { AccountDataProvider } from '../../providers/account-data/account-data';
import { AliasesProvider } from '../../providers/aliases/aliases';

@IonicPage()
@Component({
  selector: 'page-account-info',
  templateUrl: 'account-info.html',
})
export class AccountInfoPage {
	accountID: string;
	publicKey: string;
	accountname: string;
	accountDes: string;
	message: string;
	password: string;
	passwordType: string = 'password';
	fingerAvailable: boolean = false;
  usePin: boolean = false;
  guest: boolean = false;
  hasPassphrase: boolean = false;
	darkMode: boolean = false;
	loaded: boolean = false;
  aliases: object;

  constructor(public navCtrl: NavController, public navParams: NavParams, public accountData: AccountDataProvider, public viewCtrl: ViewController, private toastCtrl: ToastController, private barcodeScanner: BarcodeScanner, private faio: FingerprintAIO, private pinDialog: PinDialog, private clipboard: Clipboard, public platform: Platform, private alertCtrl: AlertController, public aliasesProvider: AliasesProvider) {
  }

  ionViewDidLoad() {
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
    this.accountID = this.accountData.getAccountID();
    this.aliasesProvider.getAliases(this.accountID).subscribe((aliases) => {
      if (aliases['aliases'] && aliases['aliases'].length > 0) {
        this.aliases = aliases['aliases'];
      }
    });
    this.accountData.getAccount(this.accountID).subscribe((account) => {
      if (account['errorCode'] && !this.publicKey && !this.password) {
      	this.message = account['errorDescription'];
      } else {
      	if (account['name']) {
      		this.accountname = account['name'];
      	}
      	if (account['description']) {
      		this.accountDes = account['description'];
      	}
      	this.publicKey = account['publicKey'];
      }
    });
    this.accountData.getTheme().then((theme) => {
        if (theme == 'darkTheme') {
          this.darkMode = true;
        } else {
          this.darkMode = false;
        }
        this.loaded = true;
      });
  }

  copyText(toCopy: string, toCopyText: string) {
  	this.clipboard.copy(toCopy);
  	this.showToast(toCopyText);
  }

  togglePassword() {
  	if (this.passwordType == 'password') {
  		this.passwordType = 'text';
  	} else {
  		this.passwordType = 'password';
  	}
  }

  openBarcodeScannerPassword(password: string) {
  	this.barcodeScanner.scan().then((barcodeData) => {
     	this.password = barcodeData['text'];
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
    this.pinDialog.prompt('Enter your PIN', 'Verify PIN', ['OK', 'Cancel'])
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

  generatePublicKey() {
  	if (this.accountData.convertPasswordToAccount(this.password) == this.accountData.getAccountID()) {
  		this.message = null;
  		this.publicKey = this.accountData.getPublicKeyPassword(this.password);
  	} else {
  		this.message = "Incorrect Passphrase for Account";
  	}
  }

  showToast(copyText: string) {
    let toast = this.toastCtrl.create({
      message: `${copyText} Copied`,
      duration: 2000,
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
