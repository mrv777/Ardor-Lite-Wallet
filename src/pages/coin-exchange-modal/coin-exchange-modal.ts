import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams, ViewController } from 'ionic-angular';
import { BarcodeScanner } from '@ionic-native/barcode-scanner';
import { FingerprintAIO } from '@ionic-native/fingerprint-aio';

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
  fingerAvailable: boolean = false;
  guest: boolean = false;

  constructor(public navCtrl: NavController, public navParams: NavParams, public viewCtrl: ViewController, public accountData: AccountDataProvider, public coinExchangeProvider: CoinExchangeProvider, public sharedProvider: SharedProvider, public transactionsProvider: TransactionsProvider, private barcodeScanner: BarcodeScanner, private faio: FingerprintAIO,) {
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
  	this.faio.isAvailable().then((available) => {
  	  if (available == 'OK' || available == 'Available') {
  	    this.fingerAvailable = true;
  	  } else {
  	    this.fingerAvailable = false;
  	  }
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
          

          /* Calculate fee for exchange */
          if (this.exchangeChain != 'ARDR' && this.chain != 'ARDR') {
            if (this.type == "Buy") {
              let ratesIndex = this.rates.findIndex(x => x['chain']==(this.chainNumber));
              this.fee = new Big(this.rates[ratesIndex]['minRateNQTPerFXT']/this.chainDecimals);
              this.fee = this.fee.times(0.1).toFixed(8);
              this.feeChain = this.chain;
              this.feeChainNumber = this.chainNumber;
              this.feeChainDecimals = Math.pow(10, this.sharedProvider.getConstants()['chainProperties'][this.chainNumber]['decimals']);
            } else {
              let ratesIndex = this.rates.findIndex(x => x['chain']==(this.exchangeChainNumber));
              this.fee = new Big(this.rates[ratesIndex]['minRateNQTPerFXT']/this.exchangeDecimals);
              this.fee = this.fee.times(0.1).toFixed(8);
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
              this.balance = balance['balanceNQT']/this.feeChainDecimals;

              if (this.balance < this.fee) {
                this.disableExchange = true;
                this.resultTxt = `Not enough ${this.feeChain} to cover the fee`;
              }
            }
          );
        }
      );
  }

  exchange() {
    this.disableExchange = true;
    this.status = 0;
    this.accountData.setPublicKeyPassword(this.password);
    let txChain; let txExchangeChain; let txRate; let txQuantity;
    if (this.type == "Buy") {
      txChain = this.chain;
      txExchangeChain = this.exchangeChain;
      txRate = this.rate*this.chainDecimals;
      txQuantity = this.quantity*this.exchangeDecimals;
    } else {
      txChain = this.exchangeChain;
      txExchangeChain = this.chain;
      txRate = (1/this.rate)*this.exchangeDecimals;
      txQuantity = this.quantity*this.chainDecimals;
    }
    this.transactionsProvider.exchangeCoins(txChain, txExchangeChain, txRate, txQuantity)
      .subscribe(
        unsignedBytes => {
           console.log(unsignedBytes['unsignedTransactionBytes']);
           if (unsignedBytes['errorDescription']) {
              this.resultTxt = unsignedBytes['errorDescription'];
              this.disableExchange = false;
           } else {
             this.transactionsProvider.broadcastTransaction(this.accountData.signTransaction(unsignedBytes['unsignedTransactionBytes'], this.password))
              .subscribe(
                broadcastResults => {
                  console.log(broadcastResults);
                  if (broadcastResults['fullHash'] != null) {
                    this.resultTxt = `Exchange successful with fullHash: ${broadcastResults['fullHash']}`;
                    this.status = 1;
                  } else {
                    this.resultTxt = broadcastResults['errorDescription'];
                    this.disableExchange = false;
                    this.status = -1;
                  }
                }
              );
           }
        }
      );
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
      disableBackup: false  //Only for Android(optional)
    })
    .then((result: any) => { 
    	this.password = this.accountData.getSavedPassword();
    })
    .catch((error: any) => console.log(error));
  }

  openBarcodeScannerPassword(password: string) {
  	this.barcodeScanner.scan().then((barcodeData) => {
     	this.password = barcodeData['text'];
    }, (err) => {
        // An error occurred
    });
  }

  closeModal() {
    this.viewCtrl.dismiss();
  }

}
