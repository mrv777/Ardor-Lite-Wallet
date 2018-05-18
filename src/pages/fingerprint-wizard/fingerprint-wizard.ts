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
  savePassphrase: boolean = false;
  accountName: string = "";
  account: string;
  chains: string[] = [];
  chainNumbers: number[] = [];
  chainName: string = 'ARDR';
  chain: number = 1;

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

  changeChain() {
    this.chain = this.chainNumbers[this.chains.indexOf(this.chainName)];
  }

  saveLogin() {
  	this.accountData.saveSavedPassword(this.password, this.account.toUpperCase(), this.accountName, this.chain, this.savePassphrase);
  	this.closeModal();
  }

  closeModal() {
    this.viewCtrl.dismiss(this.password);
  }

}
