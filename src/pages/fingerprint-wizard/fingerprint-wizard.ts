import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { IonicPage, NavController, NavParams, ViewController, Platform } from 'ionic-angular';
import { BarcodeScanner } from '@ionic-native/barcode-scanner';
import { FingerprintAIO } from '@ionic-native/fingerprint-aio';
import { PinDialog } from '@ionic-native/pin-dialog';

import { AccountDataProvider } from '../../providers/account-data/account-data';
import { SharedProvider } from '../../providers/shared/shared';

@IonicPage()
@Component({
  selector: 'page-fingerprint-wizard',
  templateUrl: 'fingerprint-wizard.html',
})
export class FingerprintWizardPage {
  private loginForm: FormGroup;
  password: string;
  passwordType: string = 'password';
  savePassphrase: boolean = false;
  accountName: string = "";
  account: string;
  chains: string[] = [];
  chainNumbers: number[] = [];
  chainName: string = 'ARDR';
  chain: number = 1;

  fingerAvailable: boolean = false;
  pin: string;

  message: string;
  theme: string;

  constructor(public navCtrl: NavController, public navParams: NavParams, public viewCtrl: ViewController, public accountData: AccountDataProvider, private formBuilder: FormBuilder, private barcodeScanner: BarcodeScanner, public sharedProvider: SharedProvider, private faio: FingerprintAIO, private pinDialog: PinDialog, public platform: Platform) {
  	this.loginForm = this.formBuilder.group({
      accountForm: ['', Validators.compose([Validators.required,Validators.minLength(26),Validators.maxLength(26)])],
      passwordForm: [''],
      accountChainForm: [''],
      saveForm: [''],
      accountNameForm: ['', Validators.maxLength(16)]
    });
  }

  ionViewWillEnter() {
    if (this.platform.is('cordova')) {
       this.faio.isAvailable().then((available) => {
        if (available == 'OK' || available == 'Available' || available == 'finger' || available == 'face') {
          this.fingerAvailable = true;
        } else {
          this.fingerAvailable = false;
        }
      });
     }
      this.accountData.getTheme().then((theme) => {
        this.theme = theme;
      });
      const chainObjects = this.sharedProvider.getConstants()['chains'];
      this.chains = Object.keys(chainObjects);
      for (const key of this.chains) {
        this.chainNumbers.push(chainObjects[key]);
      }
  }

  openBarcodeScannerAccount() {
    this.barcodeScanner.scan({prompt : "Place QR code inside the scan area", disableSuccessBeep: true}).then((barcodeData) => {
      this.account = barcodeData['text'];
    }, (err) => {
        // An error occurred
    });
  }

  openBarcodeScannerPassword() {
    this.barcodeScanner.scan({prompt : "Place QR code inside the scan area", disableSuccessBeep: true}).then((barcodeData) => {
      this.password = barcodeData['text'];
    }, (err) => {
        // An error occurred
    });
  }

  togglePassword() {
    if (this.passwordType == 'password') {
      this.passwordType = 'text';
    } else {
      this.passwordType = 'password';
    }
  }

  changeChain() {
    this.chain = this.chainNumbers[this.chains.indexOf(this.chainName)];
  }

  setPin() {
    this.pinDialog.prompt('Please enter a pin that will be used to retrieve your saved passphrase', 'Set your PIN', ['OK', 'Cancel'])
    .then(
      (result: any) => {
        if (result.buttonIndex == 1) {
          this.pin = result.input1;
        }
      }
    );
  }

  saveLogin() {
    this.message = null;
    if (this.password != null && this.password != '') {
      let accountCheck = this.accountData.getAccountFromPassword(this.password);
      if (this.account.toUpperCase() == accountCheck) {
        this.accountData.saveSavedPassword(this.password, this.account.toUpperCase(), this.accountName, this.chain, this.savePassphrase, this.pin);
        this.closeModal();
      } else {
        this.message = 'Provided passphrase does not open account specified';
      }
    } else {
  	  this.accountData.saveSavedPassword(this.password, this.account.toUpperCase(), this.accountName, this.chain, this.savePassphrase, this.pin);
  	  this.closeModal();
    }
  }

  closeModal() {
    this.viewCtrl.dismiss(this.password);
  }

}
