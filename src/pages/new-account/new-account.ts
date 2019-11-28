import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams, ViewController, AlertController, Platform } from 'ionic-angular';
import { FingerprintAIO } from '@ionic-native/fingerprint-aio';
import { PinDialog } from '@ionic-native/pin-dialog';
import { TranslateService } from '@ngx-translate/core';

import * as bip39 from 'bip39';

import { AccountDataProvider } from '../../providers/account-data/account-data';

@IonicPage()
@Component({
  selector: 'page-new-account',
  templateUrl: 'new-account.html',
})
export class NewAccountPage {
  passphrase: string;
  accountID: string;
  saved: boolean = false;
  accountName: string = '';
  savePassphrase: boolean = true;
  blur: string = '';
  fingerAvailable: boolean = false;
  pin: string;
  secureDevice: boolean = false;

  // Translation variables
  verifyPassString: string;
  verifyString: string;
  cancelString: string;
  setPinString: string;
  okString: string;
  incorrectPass: string = 'Incorrect Passphrase';
  enterSetPin: string = 'Please enter a pin that will be used to retrieve the saved passphrase to access your account';

  verifyPage: boolean = false;
  verifyPass: string[];
  shuffledPass: string[];

  constructor(public navCtrl: NavController, public navParams: NavParams, public accountData: AccountDataProvider, public viewCtrl: ViewController, private alertCtrl: AlertController, public platform: Platform, private faio: FingerprintAIO, private pinDialog: PinDialog, public translate: TranslateService) {
  }

  ionViewDidLoad() {
  	this.translate.get('VERIFY_PASS').subscribe((res: string) => {
        this.verifyPassString = res;
    });
    this.translate.get('VERIFY').subscribe((res: string) => {
        this.verifyString = res;
    });
		this.translate.get('CANCEL').subscribe((res: string) => {
        this.cancelString = res;
    });
    this.translate.get('SET_PIN').subscribe((res: string) => {
        this.setPinString = res;
    });
    this.translate.get('OK').subscribe((res: string) => {
        this.okString = res;
    });
    this.translate.get('INCORRECT_PASS').subscribe((res: string) => {
        this.incorrectPass = res;
    });
    this.translate.get('ENTER_SET_PIN').subscribe((res: string) => {
        this.enterSetPin = res;
    });

  	if (this.platform.is('cordova')) {
  		this.secureDevice = this.accountData.isDeviceSecure();
       this.faio.isAvailable().then((available) => {
        if (available == 'OK' || available == 'Available' || available == 'finger' || available == 'face') {
          this.fingerAvailable = true;
        } else {
          this.fingerAvailable = false;
        }
      });
     }
    this.passphrase = bip39.generateMnemonic();
    this.accountID = this.accountData.convertPasswordToAccount(this.passphrase);
  }

  verifyPassphrase() {
    this.verifyPass = [];
    this.verifyPage = true;
    let fakePassphrase = bip39.generateMnemonic();
    let passphraseWords = fakePassphrase.split(" ").slice(0,12).concat(this.passphrase.split(" ").slice());
    this.shuffledPass = this.shuffle(passphraseWords);
  }

  addWordToVerifyArray(num: number) {
    if (this.verifyPass.length < 12) {
      this.verifyPass.push(this.shuffledPass.splice(num, 1)[0]);
      if (this.verifyPass.length >= 12) {
        this.checkPass();
      }
    }
  }

  removeWord(num: number) {
    this.shuffledPass.push(this.verifyPass.splice(num, 1)[0]);
  }

  checkPass() {
    if (this.verifyPass.join(" ") == this.passphrase) {
      this.closeModal();
    } else {
      this.presentMessage(this.incorrectPass);
    }
  }

	presentMessage(msg: string) {
	  let alert = this.alertCtrl.create({
	    title: msg,
	    buttons: ['Dismiss']
	  });
	  alert.present();
	}

  /**
   * Randomly shuffle an array
   * https://stackoverflow.com/a/2450976/1293256
   * @param  {Array} array The array to shuffle
   * @return {String}      The first item in the shuffled array
   */
  shuffle(array) {
    var currentIndex = array.length;
    var temporaryValue, randomIndex;

    // While there remain elements to shuffle...
    while (0 !== currentIndex) {
      // Pick a remaining element...
      randomIndex = Math.floor(Math.random() * currentIndex);
      currentIndex -= 1;

      // And swap it with the current element.
      temporaryValue = array[currentIndex];
      array[currentIndex] = array[randomIndex];
      array[randomIndex] = temporaryValue;
    }

    return array;
  };


	setPin() {
    this.pinDialog.prompt(this.enterSetPin, this.setPinString, [this.okString, this.cancelString])
    .then(
      (result: any) => {
        if (result.buttonIndex == 1) {
          this.pin = result.input1;
        }
      }
    );
  }

  closeModalNoLogin() {
    this.viewCtrl.dismiss();
  }

  closeModal() {
  	if (this.secureDevice) {
  		this.accountData.saveSavedPassword(this.passphrase, this.accountID.toUpperCase(), this.accountName, 1, this.savePassphrase);
  	}
    this.viewCtrl.dismiss(this.accountID);
  }
}
