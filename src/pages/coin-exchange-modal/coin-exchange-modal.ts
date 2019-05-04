import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams, ViewController, AlertController } from 'ionic-angular';
import { BarcodeScanner } from '@ionic-native/barcode-scanner';
import { FingerprintAIO } from '@ionic-native/fingerprint-aio';
import { PinDialog } from '@ionic-native/pin-dialog';
import { TranslateService } from '@ngx-translate/core';

import * as Big from 'big.js';

import { AccountDataProvider } from '../../providers/account-data/account-data';
import { TransactionsProvider } from '../../providers/transactions/transactions';
import { CoinExchangeProvider } from '../../providers/coin-exchange/coin-exchange';
import { SharedProvider } from '../../providers/shared/shared';

/**
  Exchange Chain and chain got switched!!  Should be rewritten so variable names are consistant
**/

@IonicPage()
@Component({
  selector: 'page-coin-exchange-modal',
  templateUrl: 'coin-exchange-modal.html',
})
export class CoinExchangeModalPage {
  chains: string[] = [];
  chainNumbers: number[] = [];

  accountID: string;
  balance: Big;
  balanceFee: Big;
  chain: string;
  chainNumber: number;
  exchangeChain: string;
  exchangeChainNumber: number;
  feeChain: string;
  feeChainNumber: number;
  feeChainDecimals: number;
  status: number;
  orginalRate: Big;
  rate: Big;
  max: Big;
  quantity: Big;
  fee: Big;
  type: string;
  exchangeQuantity: Big;
  resultTxt: string = '';
  disableExchange: boolean = false;
  rates: object[];
  chainDecimals: number;
  exchangeDecimals: number;

  theme: string;
  password: string;
  passwordType: string = 'password';
  hasPassphrase: boolean = false;
  fingerAvailable: boolean = false;
  usePin: boolean = false;
  guest: boolean = false;

  qrText: string = 'Place QR code inside the scan area';
  incorrectPass: string = 'Incorrect Passphrase';
  enterPin: string = 'Enter your PIN';
  verifyPin: string = 'Verify your PIN';

  constructor(public navCtrl: NavController, public navParams: NavParams, public viewCtrl: ViewController, public accountData: AccountDataProvider, public coinExchangeProvider: CoinExchangeProvider, public sharedProvider: SharedProvider, public transactionsProvider: TransactionsProvider, private barcodeScanner: BarcodeScanner, private faio: FingerprintAIO, private pinDialog: PinDialog, private alertCtrl: AlertController, public translate: TranslateService) {
  	this.exchangeChain = navParams.get('chain');
    this.chain = navParams.get('exchangeChain');
    this.rate = navParams.get('rate');
    this.orginalRate = this.rate;
    this.max = navParams.get('max');
    this.type = navParams.get('type');
  }

  ionViewWillEnter() {
    this.accountID = this.accountData.getAccountID();
    this.guest = this.accountData.isGuestLogin();
    this.accountData.getTheme().then((theme) => {
      this.theme = theme;
    });
    if (!this.guest) {
      this.hasPassphrase = this.accountData.hasSavedPassword();
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
        this.usePin = true;
      });
    }

    this.translate.get('QR_SCAN').subscribe((res: string) => {
      this.qrText = res;
    });
    this.translate.get('INCORRECT_PASS').subscribe((res: string) => {
      this.incorrectPass = res;
    });
    this.translate.get('ENTER_PIN').subscribe((res: string) => {
      this.enterPin = res;
    });
    this.translate.get('VERIFY_PIN').subscribe((res: string) => {
      this.verifyPin = res;
    });

    this.coinExchangeProvider.getBundlerRates()
      .subscribe(
        rates => {
          this.rates = rates['rates'];
          const chainObjects = this.sharedProvider.getConstants()['chains'];
  	      this.chains = Object.keys(chainObjects);
  	  	  for (const key of this.chains) {
  	  	    this.chainNumbers.push(chainObjects[key]);
  	  	  }

  	  	  this.chainNumber = this.chainNumbers[this.chains.indexOf(this.chain)];
  		    this.exchangeChainNumber = this.chainNumbers[this.chains.indexOf(this.exchangeChain)];
          this.chainDecimals = Math.pow(10, this.sharedProvider.getConstants()['chainProperties'][this.chainNumber]['decimals']);
          this.exchangeDecimals = Math.pow(10, this.sharedProvider.getConstants()['chainProperties'][this.exchangeChainNumber]['decimals']);

          let sellChain; let sellDecimals;
          if (this.type == "Buy") {
            sellChain = this.chain;
            sellDecimals = this.chainDecimals;
          } else {
            sellChain = this.exchangeChain;
            sellDecimals = this.exchangeDecimals;
          }
          this.accountData.getBalanceOnce(sellChain, this.accountID)
          .subscribe(
            balance => {
              this.balance = balance['unconfirmedBalanceNQT']/sellDecimals;
            }
          );
          

          /* Calculate fee for exchange */
          if (this.exchangeChain != 'ARDR' && this.chain != 'ARDR') {
            if (this.type == "Buy") {
              let ratesIndex = this.rates.findIndex(x => x['chain']==(this.chainNumber));
              this.fee = new Big(this.rates[ratesIndex]['minRateNQTPerFXT']/this.chainDecimals);
              this.fee = this.fee.times(0.01).toFixed(8);
              this.feeChain = this.chain;
              this.feeChainNumber = this.chainNumber;
              this.feeChainDecimals = Math.pow(10, this.sharedProvider.getConstants()['chainProperties'][this.chainNumber]['decimals']);
            } else {
              let ratesIndex = this.rates.findIndex(x => x['chain']==(this.exchangeChainNumber));
              this.fee = new Big(this.rates[ratesIndex]['minRateNQTPerFXT']/this.exchangeDecimals);
              this.fee = this.fee.times(0.01).toFixed(8);
              this.feeChain = this.exchangeChain;
              this.feeChainNumber = this.exchangeChainNumber;
              this.feeChainDecimals = Math.pow(10, this.sharedProvider.getConstants()['chainProperties'][this.exchangeChainNumber]['decimals']);
            }
          } else {
            this.fee = 0.5;
            this.feeChain = 'ARDR';
            this.feeChainNumber = 1;
            this.feeChainDecimals = Math.pow(10, this.sharedProvider.getConstants()['chainProperties'][this.feeChainNumber]['decimals']);
          }

          

          this.accountData.getBalanceOnce(this.feeChainNumber, this.accountID)
          .subscribe(
            balance => {
              this.balanceFee = balance['unconfirmedBalanceNQT']/this.feeChainDecimals;

              if (this.balanceFee < this.fee) {
                this.disableExchange = true;
                this.resultTxt = `Not enough ${this.feeChain} to cover the fee`;
              }
            }
          );
        }
      );
  }

  exchange() {
    if (this.accountData.convertPasswordToAccount(this.password) == this.accountData.getAccountID()) {
      this.disableExchange = true;
      this.status = 0;
      this.accountData.setPublicKeyPassword(this.password);
      let txChain; let txExchangeChain; let txRate; let txQuantity;
      if (this.type == "Buy") {
        txChain = this.chain;
        txExchangeChain = this.exchangeChain;
        txRate = (this.rate*this.chainDecimals).toFixed(0);
        txQuantity = (this.quantity*this.exchangeDecimals).toFixed(0);
      } else {
        txChain = this.exchangeChain;
        txExchangeChain = this.chain;
        txRate = ((1/this.rate)*this.exchangeDecimals).toFixed(0);
        txQuantity = (this.exchangeQuantity*this.chainDecimals).toFixed(0);
      }
      this.transactionsProvider.exchangeCoins(txChain, txExchangeChain, txRate, txQuantity)
        .subscribe(
          unsignedBytes => {
             //console.log(unsignedBytes['unsignedTransactionBytes']);
             if (unsignedBytes['errorDescription']) {
                this.resultTxt = unsignedBytes['errorDescription'];
                this.disableExchange = false;
             } else {
               let signedTx = this.accountData.verifyAndSignTransaction(unsignedBytes['unsignedTransactionBytes'], this.password, 'exchangeCoins', { recipient: 0, amountNQT: 0 });
               if (signedTx != 'failed') {
                 this.transactionsProvider.broadcastTransaction(signedTx)
                  .subscribe(
                    broadcastResults => {
                      console.log(broadcastResults);
                      if (broadcastResults['fullHash'] != null) {
                        this.resultTxt = `Exchange successful`;
                        this.status = 1;
                      } else {
                        this.resultTxt = broadcastResults['errorDescription'];
                        this.disableExchange = false;
                        this.status = -1;
                      }
                    }
                  );
               } else {
                  this.resultTxt = 'Exchange Failed - WARNING: Transaction returned from node is incorrect';
                  this.status = -1;
                  this.disableExchange = false;
               }
             }
          }
        );
    } else {
      this.resultTxt = this.incorrectPass;
      this.status = -1;
    }
  }

  updateExchangeQuantity(ev) {
    if (ev.target.value !='' && !isNaN(ev.target.value)) {
      this.rate = new Big(this.rate);
      let sellChain;
      if (this.type == "Buy") {
        sellChain = this.chain;
      } else {
        sellChain = this.exchangeChain;
      }
      this.exchangeQuantity = new Big(this.rate.times(ev.target.value).round(this.sharedProvider.getConstants()['chainProperties'][this.chainNumber]['decimals']));
      if (this.balance < this.exchangeQuantity.plus(this.fee)) {
        this.disableExchange = true;
        this.resultTxt = `Not enough ${sellChain} to exchange`;
      } else {
        this.disableExchange = false;
        this.resultTxt = '';
      }
    }
  }

  updateExchangeQuantityExchange(ev) {
    if (ev.target.value !='' && !isNaN(ev.target.value)) {
      let exQuantity = new Big(this.exchangeQuantity);
      let val = new Big(ev.target.value);
      let sellChain;
      if (this.type == "Buy") {
        sellChain = this.chain;
      } else {
        sellChain = this.exchangeChain;
      }
      this.quantity = new Big(val.div(this.rate).round(this.sharedProvider.getConstants()['chainProperties'][this.exchangeChainNumber]['decimals']));
      if (this.balance < exQuantity.plus(this.fee)) {
        this.disableExchange = true;
        this.resultTxt = `Not enough ${sellChain} to exchange`;
      } else {
        this.disableExchange = false;
        this.resultTxt = '';
      }
    }
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
            this.presentMessage("Incorrect PIN");
          }
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

  openBarcodeScannerPassword(password: string) {
  	this.barcodeScanner.scan({prompt : this.qrText, disableSuccessBeep: true}).then((barcodeData) => {
     	this.password = barcodeData['text'];
    }, (err) => {
        // An error occurred
    });
  }

  closeModal() {
    this.viewCtrl.dismiss();
  }

}
