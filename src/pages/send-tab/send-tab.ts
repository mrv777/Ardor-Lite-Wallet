import { Component, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { IonicPage, NavController, NavParams, ViewController, Select } from 'ionic-angular';
import { BarcodeScanner } from '@ionic-native/barcode-scanner';
import { FingerprintAIO } from '@ionic-native/fingerprint-aio';
import { Subscription } from 'rxjs/Subscription';

import * as Big from 'big.js';

import { AccountDataProvider } from '../../providers/account-data/account-data';
import { SharedProvider } from '../../providers/shared/shared';
import { TransactionsProvider } from '../../providers/transactions/transactions';

@IonicPage()
@Component({
  selector: 'page-send-tab',
  templateUrl: 'send-tab.html',
})
export class SendTabPage {
  @ViewChild(Select) select: Select;

  private sendForm : FormGroup;
  recipient: string = '';
  amount: number = 0;
  chain: number = 1;
  message: string;
  decimals: number = 100000000;
  status: number;
  disableSend: boolean = false;
  resultTxt: string = '';
  contacts: object[];
  wasAccountLogin: boolean;
  password: string;
  fingerAvailable: boolean = false;
  guest: boolean = false;
  passwordType: string = 'password';

  subscriptionChain: Subscription;

  constructor(public navCtrl: NavController, public accountData: AccountDataProvider, public navParams: NavParams, public viewCtrl: ViewController, private barcodeScanner: BarcodeScanner, private formBuilder: FormBuilder, private faio: FingerprintAIO, public sharedProvider: SharedProvider, public transactions: TransactionsProvider) {
  	this.sendForm = this.formBuilder.group({
      recipientForm: ['', Validators.required],
      amountForm: ['', Validators.required],
      messageForm: [''],
      passwordForm: ['', Validators.required]
    });
    if (navParams.get('address')) {
      this.recipient = navParams.get('address');
    }

    this.wasAccountLogin = this.accountData.wasAccountLogin();
  }

  ionViewDidLoad() {
    this.guest = this.accountData.isGuestLogin();
  	 this.faio.isAvailable().then((available) => {
	    if (available == 'OK' || available == 'Available') {
	      this.fingerAvailable = true;
	    } else {
	      this.fingerAvailable = false;
	    }
	  });
    this.loadContacts();
    this.subscriptionChain = this.sharedProvider.getChain().subscribe(sharedChain => { 
      this.chain = sharedChain; 
      this.decimals = Math.pow(10, this.sharedProvider.getConstants()['chainProperties'][this.chain]['decimals']);
    });
  }

  onSend() {
    if (this.accountData.convertPasswordToAccount(this.password) == this.accountData.getAccountID()) {
      this.disableSend = true;
      let amountBig = new Big(this.amount);
      let convertedAmount = new Big(amountBig.times(this.decimals));
      let chainName = this.sharedProvider.getConstants()['chainProperties'][this.chain]['name'];
      this.resultTxt = `Attempting to send ${this.recipient} ${amountBig} ${chainName}`;
      this.status = 0;
      this.accountData.setPublicKeyPassword(this.password);
      this.transactions.sendMoney(this.chain, this.recipient, convertedAmount, this.message)
      .subscribe(
        unsignedBytes => {
          // console.log(unsignedBytes['unsignedTransactionBytes']);
          // console.log(this.accountData.signTransaction(unsignedBytes['unsignedTransactionBytes']));
          if (unsignedBytes['errorDescription']) {
              this.resultTxt = unsignedBytes['errorDescription'];
              this.disableSend = false;
              this.status = -1;
          } else {
            this.transactions.broadcastTransaction(this.accountData.signTransaction(unsignedBytes['unsignedTransactionBytes'], this.password))
            .subscribe(
              broadcastResults => {
                console.log(broadcastResults);
                if (broadcastResults['fullHash'] != null) {
                  this.resultTxt = `Successfully sent! Transaction fullHash: ${broadcastResults['fullHash']}`;
                  this.status = 1;
                } else {
                  this.resultTxt = 'Send Failed';
                  this.status = -1;
                  this.disableSend = false;
                }
              }
            );
          }
        }
      );
    } else {
      this.resultTxt = "Incorrect Passphrase";
      this.status = -1;
    }
  }

  openContacts() {
    this.select.open();
  }

  loadContacts() {
    this.accountData.getContacts().then((currentContacts) => {
      if (currentContacts != null) {
        this.contacts = currentContacts;
      } else {
        this.contacts = [{ name:'No Saved Contacts',account:'' }];
      }
    });
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

  openBarcodeScanner() {
    this.barcodeScanner.scan().then((barcodeData) => {
      this.recipient = barcodeData['text'];
    }, (err) => {
        // An error occurred
    });
  }

  openBarcodeScannerPassword(password: string) {
  	this.barcodeScanner.scan().then((barcodeData) => {
     	this.password = barcodeData['text'];
    }, (err) => {
        // An error occurred
    });
  }

  ionViewDidLeave() { 
    this.subscriptionChain.unsubscribe();
  }

}
