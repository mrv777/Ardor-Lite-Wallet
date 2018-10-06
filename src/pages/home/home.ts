import { Component } from '@angular/core';
import { NavController, ModalController, PopoverController } from 'ionic-angular';

import { LoginPage } from '../login/login';
import { TransactionsTabPage } from '../transactions-tab/transactions-tab';
import { ReceiveTabPage } from '../receive-tab/receive-tab';
import { SendTabPage } from '../send-tab/send-tab';
import { AccountMenuPage } from '../account-menu/account-menu';
import { LeaseMenuPage } from '../lease-menu/lease-menu';

import { AccountDataProvider } from '../../providers/account-data/account-data';
import { SharedProvider } from '../../providers/shared/shared';
import { CurrenciesProvider } from '../../providers/currencies/currencies';

@Component({
  selector: 'page-home',
  templateUrl: 'home.html'
})
export class HomePage {

  guest: boolean = false;
  accountID: string;
  balance: object;
  chain: number = 1;
  chainName: string = 'ARDR';
  chains: string[] = [];
  chainNumbers: number[] = [];
  decimals: number = 100000000;
  leased: boolean = true;

  txSelected: boolean = true;
  sendSelected: boolean = false;
  receiveSelected: boolean = false;

  price: number = 0;
  change: number = 0;
  currency: string = 'USD';
  currencies: string[] = ['BTC','ETH','USD','EUR','CNY','AUD'];
  symbol: string = '$';
  currencySymbols: string[] = ['฿','Ξ','$','€','¥','A$'];

  subscriptionBalance;

  private rootPage = TransactionsTabPage;
  private txPage = TransactionsTabPage;
  private receivePage = ReceiveTabPage;
  private sendPage = SendTabPage;

  constructor(public navCtrl: NavController, public accountData: AccountDataProvider, public shared: SharedProvider, public modalCtrl: ModalController, public popoverCtrl: PopoverController, public currenciesProv: CurrenciesProvider) {

  }

  ionViewWillEnter() {
    if (this.accountData.hasLoggedIn()) {
      this.guest = this.accountData.isGuestLogin();
      this.accountID = this.accountData.getAccountID();
      this.chain = this.shared.getChainOnce();
      this.chainName = this.shared.getChainNameOnce();
      if (this.chain == 1){ 
        this.accountData.getAccount(this.accountID).subscribe((account) => {
          if (!account['currentLessee']) {
            this.leased = false;
          } else {
            this.leased = true;
          }
        });
      } else {
        this.leased = true;
      }
      this.currency = this.shared.getCurrencyOnce();
      this.loadBalance();
      this.changeCurrency();     
      const chainObjects = this.shared.getConstants()['chains'];
      this.chains = Object.keys(chainObjects);
  	  for (const key of this.chains) {
  		    this.chainNumbers.push(chainObjects[key]);
  		}
    } else {
      this.navCtrl.setRoot(LoginPage);
    }
  }

  loadBalance() {
    this.decimals = Math.pow(10, this.shared.getConstants()['chainProperties'][this.chain]['decimals']);
  	if (this.subscriptionBalance) {
      this.subscriptionBalance.unsubscribe();
    }
  	this.subscriptionBalance = this.accountData.getBalance(this.chain, this.accountID).subscribe((balance) => {
	  	this.balance = balance;
	  });
  }

  openPage(page) {
    // Reset the nav controller to have just this page
    // we wouldn't want the back button to show in this scenario
    this.rootPage = page;
    if (page == this.txPage) {
    	this.txSelected = true;
    	this.sendSelected = false;
    	this.receiveSelected = false;
    } else if (page  == this.sendPage) {
    	this.txSelected = false;
    	this.sendSelected = true;
    	this.receiveSelected = false;
    } else {
    	this.txSelected = false;
    	this.sendSelected = false;
    	this.receiveSelected = true;
    }
  }

  presentPopover(myEvent, account, name) {
    let popover = this.popoverCtrl.create(AccountMenuPage);
    popover.present({
      ev: myEvent,

    });
    popover.onDidDismiss(data => {
      if (data == 'remove') {
        this.logout();
      } else if (data == 'settings') {
        this.currency = this.shared.getCurrencyOnce();
        this.chainName = this.shared.getChainNameOnce();
        this.changeChain();
      }  
    });
  }

  presentPopoverLease(myEvent) {
    let popover = this.popoverCtrl.create(LeaseMenuPage);
    popover.present({
      ev: myEvent,

    });
    popover.onDidDismiss(data => {
      // if (!this.accountData.getAccount(this.accountID)['currentLessee']) {
      //   this.leased = false;
      // } else {
      //   this.leased = true;
      // }
    });
  }

  changeCurrency() {
  	this.symbol = this.currencySymbols[this.currencies.indexOf(this.currency)];
  	this.price = 0;
    this.change = 0;

    let currencyChain;
    if (this.chainName == 'BITSWIFT') {
      currencyChain = 'BITS';
    } else {
      currencyChain = this.chainName;
    }

    this.currenciesProv.getPriceFull(currencyChain, this.currency)
    .subscribe(
      price => {
        if (price != null && price['RAW'] && price['RAW'][`${currencyChain}`] != null && price['RAW'][`${currencyChain}`][`${this.currency}`] != null) {
          this.price = price['RAW'][`${currencyChain}`][`${this.currency}`]['PRICE'];
          this.change = price['RAW'][`${currencyChain}`][`${this.currency}`]['CHANGEPCT24HOUR'];
        }
        this.shared.emitConversion(this.price, this.currency, this.currencySymbols[this.currencies.indexOf(this.currency)]);
      },
      err => { console.log(err); });
    
  	// this.currenciesProv.getPrice(this.chainName, this.currency)
   //  .subscribe(
   //    price => {
   //    	if (price != null && price[`${this.currency}`] != null) {
   //    		this.price = price[`${this.currency}`];
   //    	}
   //      this.shared.emitConversion(this.price,this.currencySymbols[this.currencies.indexOf(this.currency)]);
   //    },
   //    err => { console.log(err); });
  }

  changeChain() {
  	this.chain = this.chainNumbers[this.chains.indexOf(this.chainName)];
    this.shared.emitChain(this.chainName,this.chain);
    if (this.chain == 1){ 
      this.accountData.getAccount(this.accountID).subscribe((account) => {
        if (!account['currentLessee']) {
          this.leased = false;
        } else {
          this.leased = true;
        }
      });
    } else {
      this.leased = true;
    }
    this.changeCurrency();
  	this.loadBalance();
  }

  logout() {
    this.openPage(this.receivePage);
    this.subscriptionBalance.unsubscribe();
    this.accountData.logout();
    this.navCtrl.setRoot(LoginPage);
  }

  ionViewWillLeave() {
    this.openPage(this.receivePage);
    this.subscriptionBalance.unsubscribe();
  }

}
