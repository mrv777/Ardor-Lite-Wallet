import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { IonicPage, NavController, NavParams, ViewController } from 'ionic-angular';
import { BarcodeScanner } from '@ionic-native/barcode-scanner';

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

  message: string;
  theme: string;

  constructor(public navCtrl: NavController, public navParams: NavParams, public viewCtrl: ViewController, public accountData: AccountDataProvider, private formBuilder: FormBuilder, private barcodeScanner: BarcodeScanner, public sharedProvider: SharedProvider) {
  	this.loginForm = this.formBuilder.group({
      accountForm: ['', Validators.compose([Validators.required,Validators.minLength(26),Validators.maxLength(26)])],
      passwordForm: [''],
      accountChainForm: [''],
      saveForm: [''],
      accountNameForm: ['', Validators.maxLength(16)]
    });
  }

  ionViewWillEnter() {
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
    this.barcodeScanner.scan().then((barcodeData) => {
      this.account = barcodeData['text'];
    }, (err) => {
        // An error occurred
    });
  }

  openBarcodeScannerPassword() {
    this.barcodeScanner.scan().then((barcodeData) => {
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

  saveLogin() {
    this.message = null;
    if (this.password != null && this.password != '') {
      let accountCheck = this.accountData.getAccountFromPassword(this.password);
      if (this.account.toUpperCase() == accountCheck) {
        this.accountData.saveSavedPassword(this.password, this.account.toUpperCase(), this.accountName, this.chain, this.savePassphrase);
        this.closeModal();
      } else {
        this.message = 'Provided passphrase does not open account specified';
      }
    } else {
  	  this.accountData.saveSavedPassword(this.password, this.account.toUpperCase(), this.accountName, this.chain, this.savePassphrase);
  	  this.closeModal();
    }
  }

  closeModal() {
    this.viewCtrl.dismiss(this.password);
  }

}
