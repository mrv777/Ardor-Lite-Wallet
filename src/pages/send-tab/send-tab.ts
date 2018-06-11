import { Component, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { IonicPage, NavController, NavParams, ViewController, Select, Platform } from 'ionic-angular';
import { BarcodeScanner } from '@ionic-native/barcode-scanner';
import { FingerprintAIO } from '@ionic-native/fingerprint-aio';
import { Subscription } from 'rxjs/Subscription';

import * as Big from 'big.js';

import { AccountDataProvider } from '../../providers/account-data/account-data';
import { SharedProvider } from '../../providers/shared/shared';
import { TransactionsProvider } from '../../providers/transactions/transactions';
import { CurrenciesProvider } from '../../providers/currencies/currencies';

@IonicPage()
@Component({
  selector: 'page-send-tab',
  templateUrl: 'send-tab.html',
})
export class SendTabPage {
  @ViewChild(Select) select: Select;

  private sendForm : FormGroup;
  recipient: string = '';
  amount: number;
  amountCurrency: number;
  chain: number = 1;
  chainName: string = 'ARDR';
  message: string;
  decimals: number = 100000000;
  status: number;
  disableSend: boolean = false;
  resultTxt: string = '';
  contacts: object[];
  password: string;
  fingerAvailable: boolean = false;
  guest: boolean = false;
  passwordType: string = 'password';
  privateMsg: boolean = false;

  disableCurrency: boolean = false;
  currencyPlaceholder: string;

  price: number = 0;
  currency: string = 'USD';
  currencies: string[] = ['BTC','ETH','USD','EUR','CNY','AUD'];
  currencyDecimal: number = 2;
  currencyDecimals: number[] = [8,8,2,2,2,2];
  symbol: string = '$';
  currencySymbols: string[] = ['฿','Ξ','$','€','¥','A$'];

  subscriptionChain: Subscription;
  subscriptionCurrancy: Subscription;

  constructor(public navCtrl: NavController, public accountData: AccountDataProvider, public navParams: NavParams, public viewCtrl: ViewController, private barcodeScanner: BarcodeScanner, private formBuilder: FormBuilder, private faio: FingerprintAIO, public sharedProvider: SharedProvider, public transactions: TransactionsProvider, public currenciesProv: CurrenciesProvider, public platform: Platform) {
  	this.sendForm = this.formBuilder.group({
      recipientForm: ['', Validators.required],
      amountForm: ['', Validators.required],
      amountCurrencyForm: [''],
      messageForm: [''],
      msgTypeForm: [''],
      passwordForm: ['', Validators.required]
    });
    if (navParams.get('address')) {
      this.recipient = navParams.get('address');
    }
  }

  ionViewDidLoad() {
    this.guest = this.accountData.isGuestLogin();
  	 if (this.platform.is('cordova')) {
       this.faio.isAvailable().then((available) => {
  	    if (available == 'OK' || available == 'Available' || available == 'finger' || available == 'face') {
  	      this.fingerAvailable = true;
  	    } else {
  	      this.fingerAvailable = false;
  	    }
  	  });
     }
    this.loadContacts();
    this.subscriptionChain = this.sharedProvider.getChain().subscribe(sharedChain => {
      this.chain = sharedChain; 
      this.chainName = this.sharedProvider.getChainNameOnce();
      this.decimals = Math.pow(10, this.sharedProvider.getConstants()['chainProperties'][this.chain]['decimals']);
      this.price = this.sharedProvider.getPriceOnce();
      if (!this.amountCurrency || this.amountCurrency <= 0) {
        this.updateConversion('currency');
      }
    });

    this.subscriptionCurrancy = this.sharedProvider.getCurrancy().subscribe(sharedCurrancy => {
      let sharedCurrancyNumber = this.currencies.indexOf(sharedCurrancy);
      this.currency = sharedCurrancy;
      this.symbol = this.currencySymbols[sharedCurrancyNumber];
      this.currencyDecimal = this.currencyDecimals[sharedCurrancyNumber];
      this.price = this.sharedProvider.getPriceOnce();
      this.updateConversion('chain');
    });
    
  }

  // updatePrice() {
  //   let currencyChain;
  //   if (this.chainName == 'BITSWIFT') {
  //     currencyChain = 'SWIFT';
  //   } else {
  //     currencyChain = this.chainName;
  //   }

  //   this.currenciesProv.getPrice(currencyChain, this.currency)
  //   .subscribe(
  //     price => {
  //       if (price != null && price[`${this.currency}`] != null) {
  //         this.price = price[`${this.currency}`];
  //       }
  //     },
  //     err => { console.log(err); });
  // }

  updateConversion(type: string) { console.log(this.chainName);
    if (this.chainName == 'AEUR') {
      this.disableCurrency = true;
      this.amountCurrency = null;
      this.currencyPlaceholder = "Unavailable";
    } else {
      this.disableCurrency = false;
      this.currencyPlaceholder = null;
    }
    if (type == 'chain') {
      if (this.amount && this.amount > 0 && !this.disableCurrency) {
        let amountCurrencyBig = new Big(this.amount * this.price)
        this.amountCurrency = amountCurrencyBig.round(this.currencyDecimal);
      }
    } else {
      if (this.amountCurrency && this.amountCurrency > 0) {
        let amountBig = new Big(this.amountCurrency / this.price)
        this.amount = amountBig.round(this.sharedProvider.getConstants()['chainProperties'][this.chain]['decimals']);
      }
    }
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
      this.transactions.sendMoney(this.chain, this.recipient, convertedAmount, this.message, this.privateMsg)
      .subscribe(
        unsignedBytes => {
          // console.log(unsignedBytes['unsignedTransactionBytes']);
          // console.log(this.accountData.signTransaction(unsignedBytes['unsignedTransactionBytes']));
          let attachment = null;
          if (this.message && this.message != '') {
            attachment = unsignedBytes['transactionJSON']['attachment'];
          }
          if (unsignedBytes['errorDescription']) {
              this.resultTxt = unsignedBytes['errorDescription'];
              this.disableSend = false;
              this.status = -1;
          } else {
            this.transactions.broadcastTransaction(this.accountData.signTransaction(unsignedBytes['unsignedTransactionBytes'], this.password), attachment)
            .subscribe(
              broadcastResults => {
                console.log(broadcastResults);
                if (broadcastResults['fullHash'] != null) {
                  this.resultTxt = `Successfully sent! Transaction fullHash: ${broadcastResults['fullHash']}`;
                  this.status = 1;
                } else {
                  this.resultTxt = `Send Failed - ${broadcastResults['errorDescription']}`;
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

  setMsg() {
    this.privateMsg = !this.privateMsg;
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
    this.subscriptionCurrancy.unsubscribe();
  }

}
