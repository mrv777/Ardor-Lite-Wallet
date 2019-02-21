import { Component, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { IonicPage, NavController, NavParams, ViewController, Select, Platform, AlertController } from 'ionic-angular';
import { BarcodeScanner } from '@ionic-native/barcode-scanner';
import { FingerprintAIO } from '@ionic-native/fingerprint-aio';
import { PinDialog } from '@ionic-native/pin-dialog';
import { Subscription } from 'rxjs/Subscription';
import { TranslateService } from '@ngx-translate/core';

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
  usePin: boolean = false;
  guest: boolean = false;
  hasPassphrase: boolean = false;
  passwordType: string = 'password';
  privateMsg: boolean = false;
  noContacts: string = 'No Saved Contacts';
  successSend: string = 'Successfully Sent';

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

  constructor(public navCtrl: NavController, public accountData: AccountDataProvider, public navParams: NavParams, public viewCtrl: ViewController, private barcodeScanner: BarcodeScanner, private formBuilder: FormBuilder, private faio: FingerprintAIO, private pinDialog: PinDialog, public sharedProvider: SharedProvider, public transactions: TransactionsProvider, public currenciesProv: CurrenciesProvider, public platform: Platform, private alertCtrl: AlertController, public translate: TranslateService) {
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
    this.translate.get('NO_SAVED_CONTACTS').subscribe((res: string) => {
        this.noContacts = res;
    });
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

  updateConversion(type: string) {
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
    if ((this.recipient.substring(0, 3) != "NXT" && this.recipient.substring(0, 5) != "ARDOR" && this.recipient.substring(0, 5) != "IGNIS" && this.recipient.substring(0, 4) != "BITS" && this.recipient.substring(0, 4) != "AEUR") || this.recipient.length < 20 || this.recipient.length > 26) {
       this.accountData.getAlias('ignis', this.recipient)
        .subscribe(
          alias => {
            if (alias['errorDescription']) {
              this.resultTxt = "Alias not found, or incorrect account address";
              this.status = -1;
            } else {
              this.onSendAfterAliasCheck(alias['accountRS']);
            }
          });
    } else {
      this.onSendAfterAliasCheck(this.recipient);
    }
  }

  onSendAfterAliasCheck(recipient:string) {
    if (this.accountData.convertPasswordToAccount(this.password) == this.accountData.getAccountID()) {
      this.disableSend = true;
      let amountBig = new Big(this.amount);
      let convertedAmount = new Big(amountBig.times(this.decimals));
      let chainName = this.sharedProvider.getConstants()['chainProperties'][this.chain]['name'];
      this.resultTxt = `Attempting to send ${recipient} ${amountBig} ${chainName}`;
      this.status = 0;
      this.accountData.setPublicKeyPassword(this.password);
      this.transactions.sendMoney(this.chain, recipient, convertedAmount, this.message, this.privateMsg)
      .subscribe(
        unsignedBytes => {
          if (unsignedBytes['errorDescription'] || !unsignedBytes['unsignedTransactionBytes']) {
              this.resultTxt = unsignedBytes['errorDescription'];
              this.disableSend = false;
              this.status = -1;
          } else {
            this.resultTxt = `Signing transaction and sending ${recipient} ${amountBig} ${chainName}`;
            let attachment = null;
            if (this.message && this.message != '') {
              attachment = unsignedBytes['transactionJSON']['attachment'];
            }
            let signedTx = this.accountData.verifyAndSignTransaction(unsignedBytes['unsignedTransactionBytes'], this.password, 'sendMoney', { recipient: recipient, amountNQT: convertedAmount.toString() });
            if (signedTx != 'failed') {
              this.transactions.broadcastTransaction(signedTx, attachment)
              .subscribe(
                broadcastResults => {
                  console.log(broadcastResults);
                  if (broadcastResults['fullHash'] != null) {
                    this.translate.get('SUCCESS_SEND', {recipient: recipient, amountBig: amountBig, chainName: chainName}).subscribe((res: string) => {
                        this.successSend = res;
                        // this.resultTxt = `Successfully sent! Transaction fullHash: ${broadcastResults['fullHash']}`;
                        this.resultTxt = this.successSend;
                        this.status = 1;
                    });
                  } else {
                    this.resultTxt = `Send Failed - ${broadcastResults['errorDescription']}`;
                    this.status = -1;
                    this.disableSend = false;
                  }
                }
              );
            } else {
              this.resultTxt = 'Send Failed - WARNING: Transaction returned from node is incorrect';
              this.status = -1;
              this.disableSend = false;
            }
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
        this.contacts = [{ name:this.noContacts,account:'' }];
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

  presentMessage(msg: string) {
    let alert = this.alertCtrl.create({
      title: msg,
      buttons: ['Dismiss']
    });
    alert.present();
  }

  ionViewDidLeave() { 
    this.subscriptionChain.unsubscribe();
    this.subscriptionCurrancy.unsubscribe();
  }

}
