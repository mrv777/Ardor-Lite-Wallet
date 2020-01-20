import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams, ViewController, AlertController } from 'ionic-angular';
import { BarcodeScanner } from '@ionic-native/barcode-scanner';
import { FingerprintAIO } from '@ionic-native/fingerprint-aio';
import { PinDialog } from '@ionic-native/pin-dialog';
import { TranslateService } from '@ngx-translate/core';

import * as Big from 'big.js';

import { AccountDataProvider } from '../../providers/account-data/account-data';
import { AssetsProvider } from '../../providers/assets/assets';
import { TransactionsProvider } from '../../providers/transactions/transactions';
import { SharedProvider } from '../../providers/shared/shared';

@IonicPage()
@Component({
  selector: 'page-assets-modal',
  templateUrl: 'assets-modal.html',
})
export class AssetsModalPage {
	asset: object;
	orginalRate: Big;
  rate: Big;
  max: Big;
  quantity: Big;
  fee: Big;
  type: string;
  chainDecimals: number;
  chainDecimalsPow: number = 1;
  assetDecimals: number;
  assetDecimalsPow: number = 1;
  exchangeQuantity: Big;

  accountID: string;
  balance: Big;
  balanceAsset: Big = 0;

  chainName: string;
  chainNumber: number;

  status: number;
  theme: string;
  password: string;
  passwordType: string = 'password';
  hasPassphrase: boolean = false;
  fingerAvailable: boolean = false;
  usePin: boolean = false;
  guest: boolean = false;

  resultTxt: string = '';
  disableExchange: boolean = false;

  qrText: string = 'Place QR code inside the scan area';
  incorrectPass: string = 'Incorrect Passphrase';
  enterPin: string = 'Enter your PIN';
  verifyPin: string = 'Verify your PIN';
  notEnough: string = 'Not enough IGNIS to cover the fee';

  constructor(
  	public navCtrl: NavController, 
  	public navParams: NavParams,
  	public viewCtrl: ViewController,
  	private alertCtrl: AlertController,
  	private barcodeScanner: BarcodeScanner, 
  	private faio: FingerprintAIO, 
  	private pinDialog: PinDialog,
  	public accountData: AccountDataProvider, 
  	public translate: TranslateService,
  	public assetsProvider: AssetsProvider,
  	public transactionsProvider: TransactionsProvider,
  	public sharedProvider: SharedProvider
  	) {

  	this.chainName = navParams.get('chain');
    this.asset = navParams.get('asset');
    this.rate = navParams.get('rate');
    this.orginalRate = this.rate;
    this.max = navParams.get('max');
    this.type = navParams.get('type');

    this.assetDecimals = navParams.get('assetDecimals');
    if (this.assetDecimals != 0) {
      this.assetDecimalsPow = Math.round( Math.log(this.assetDecimals) / Math.log(10) );
    }

    this.chainDecimals = navParams.get('chainDecimals');
    if (this.chainDecimals != 0) {
      this.chainDecimalsPow = Math.round( Math.log(this.chainDecimals) / Math.log(10) );
    }
  }

  ionViewDidLoad() {
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
    this.translate.get('NOT_ENOUGH', {chainName: this.chainName}).subscribe((res: string) => {
      this.notEnough = res;
    });

    this.assetsProvider.getAccountAssets(this.accountID, this.asset['asset'])
	  .subscribe(
        accountAsset => {
        	if (accountAsset['quantityQNT']) {
        		this.balanceAsset = accountAsset['quantityQNT']/this.assetDecimals;
        	} else {
        		this.balanceAsset = 0;
        	}
        }
    );

    this.transactionsProvider.getBundlerRates()
    .subscribe(
      bundlerRates => {
        let rates = bundlerRates['rates'];
        this.accountData.getBalanceOnce(this.chainName, this.accountID)
        .subscribe(
          balance => {
            this.balance = balance['unconfirmedBalanceNQT']/this.chainDecimals;

            const chainObjects = this.sharedProvider.getConstants()['chains'];
	  	      const chains = Object.keys(chainObjects);
	  	      let chainNumbers = [];
	  	  	  for (const key of chains) {
	  	  	    chainNumbers.push(chainObjects[key]);
	  	  	  }

	  	  	  this.chainNumber = chainNumbers[chains.indexOf(this.chainName)];

            /* Calculate fee for exchange */
            let ratesIndex = rates.findIndex(x => x['chain']==(this.chainNumber));
            this.fee = new Big(rates[ratesIndex]['minRateNQTPerFXT']/this.chainDecimals);
            this.fee = this.fee.times(0.01).toFixed(8);

            if (this.balance < this.fee) {
              this.disableExchange = true;
              this.resultTxt = this.notEnough;
            }
          }
        );
      }
    );
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

  updateExchangeQuantity() {
    if (this.quantity !='' && !isNaN(this.quantity)) {
    	this.quantity = new Big(this.quantity).round(this.assetDecimalsPow);
      this.rate = new Big(this.rate);
      this.exchangeQuantity = new Big(this.rate.times(this.quantity).round(this.chainDecimalsPow));
    }
  }

  updateExchangeQuantityExchange(ev) {
    if (ev.target.value !='' && !isNaN(ev.target.value)) {
    	this.rate = new Big(this.rate);
    	let val = new Big(ev.target.value);
    	this.quantity = new Big(val.div(this.rate).round(this.assetDecimalsPow));
    }
  }

  exchange() {
    if (this.accountData.convertPasswordToAccount(this.password) == this.accountData.getAccountID()) {
      this.disableExchange = true;
      this.status = 0;
      this.accountData.setPublicKeyPassword(this.password);

      let txRate = Math.round(this.rate*this.chainDecimals);
      let txQuantity = Math.round(this.quantity*this.assetDecimals);

      if (this.type == "Buy") {
        this.transactionsProvider.placeBidOrder(this.chainName, this.asset['asset'], txRate, txQuantity)
        .subscribe(
        	unsignedBytes => {
        		if (unsignedBytes['errorDescription']) {
            	this.resultTxt = unsignedBytes['errorDescription'];
              this.disableExchange = false;
            } else {
            	let signedTx = this.accountData.verifyAndSignTransaction(unsignedBytes['unsignedTransactionBytes'], this.password, 'placeBidOrder', { recipient: 0, amountNQT: 0 });
            	if (signedTx != 'failed') {
	              this.transactionsProvider.broadcastTransaction(signedTx)
	                .subscribe(
	                  broadcastResults => {
	                    console.log(broadcastResults);
	                    if (broadcastResults['fullHash'] != null) {
	                      this.resultTxt = `Placed order successfully`;
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
        this.transactionsProvider.placeAskOrder(this.chainName, this.asset['asset'], txRate, txQuantity)
        .subscribe(
        	unsignedBytes => {
        		if (unsignedBytes['errorDescription']) {
            	this.resultTxt = unsignedBytes['errorDescription'];
              this.disableExchange = false;
            } else {
            	let signedTx = this.accountData.verifyAndSignTransaction(unsignedBytes['unsignedTransactionBytes'], this.password, 'placeAskOrder', { recipient: 0, amountNQT: 0 });
            	if (signedTx != 'failed') {
	              this.transactionsProvider.broadcastTransaction(signedTx)
	                .subscribe(
	                  broadcastResults => {
	                    console.log(broadcastResults);
	                    if (broadcastResults['fullHash'] != null) {
	                      this.resultTxt = `Placed order successful`;
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
      }

      // this.transactionsProvider.exchangeCoins(txChain, txExchangeChain, txRate, txQuantity)
      //   .subscribe(
      //     unsignedBytes => {
      //        //console.log(unsignedBytes['unsignedTransactionBytes']);
      //        if (unsignedBytes['errorDescription']) {
      //           this.resultTxt = unsignedBytes['errorDescription'];
      //           this.disableExchange = false;
      //        } else {
      //          let signedTx = this.accountData.verifyAndSignTransaction(unsignedBytes['unsignedTransactionBytes'], this.password, 'exchangeCoins', { recipient: 0, amountNQT: 0 });
      //          if (signedTx != 'failed') {
      //            this.transactionsProvider.broadcastTransaction(signedTx)
      //             .subscribe(
      //               broadcastResults => {
      //                 console.log(broadcastResults);
      //                 if (broadcastResults['fullHash'] != null) {
      //                   this.resultTxt = `Exchange successful`;
      //                   this.status = 1;
      //                 } else {
      //                   this.resultTxt = broadcastResults['errorDescription'];
      //                   this.disableExchange = false;
      //                   this.status = -1;
      //                 }
      //               }
      //             );
      //          } else {
      //             this.resultTxt = 'Exchange Failed - WARNING: Transaction returned from node is incorrect';
      //             this.status = -1;
      //             this.disableExchange = false;
      //          }
      //        }
      //     }
      //   );
    } else {
      this.resultTxt = this.incorrectPass;
      this.status = -1;
    }
  }

  closeModal() {
    this.viewCtrl.dismiss();
  }

}
