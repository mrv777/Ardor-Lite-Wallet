import { Component } from '@angular/core';
import { IonicPage, NavController, ModalController, ViewController, ToastController } from 'ionic-angular';
import { Clipboard } from '@ionic-native/clipboard';
import { Subscription } from 'rxjs/Subscription';

import { MessageModalPage } from '../message-modal/message-modal'
import { TxDetailsModalPage } from '../tx-details-modal/tx-details-modal';
import { EditContactModalPage } from '../edit-contact-modal/edit-contact-modal';

import { AccountDataProvider } from '../../providers/account-data/account-data';
import { SharedProvider } from '../../providers/shared/shared';

@IonicPage()
@Component({
  selector: 'page-transactions-tab',
  templateUrl: 'transactions-tab.html',
})
export class TransactionsTabPage {
  chain: number;
  chainName: string;
  decimals: number = 100000000;
  accountID: string;
  account: object;
  transactions: object[];
  transactionTypes: object[];
  transactionsCount: number;
  p: number = 1;
  total: number = 0;
  numToDisplay: number = 8;
  contacts: string[];
  contactNames: string[];
  recentTxId: string;
  recentUnconfirmedTxId: number;
  guest: boolean = false;
  newTX: boolean = false;
  loaded: boolean = false;

  price: number = 0;
  currency: string = 'USD';
  currencies: string[] = ['BTC','ETH','USD','EUR','CNY'];
  symbol: string = '$';
  currencySymbols: string[] = ['฿','Ξ','$','€','¥'];

  subscriptionTx: Subscription;
  subscriptionUnconfirmedTxs: Subscription;
  subscriptionChain: Subscription;

  constructor(public navCtrl: NavController, public accountData: AccountDataProvider, public modalCtrl: ModalController, private viewCtrl: ViewController, public sharedProvider: SharedProvider, private clipboard: Clipboard, private toastCtrl: ToastController) {
  }

  ionViewDidLoad() {
  	this.accountID = this.accountData.getAccountID();
  	// this.chain = this.accountData.getAccountChain();
	  this.guest = this.accountData.isGuestLogin();
    this.transactionTypes = this.sharedProvider.getTransactionTypes();
    this.subscriptionChain = this.sharedProvider.getChain().subscribe(sharedChain => {
      this.loaded = false;
      if (this.recentTxId){ // If there is a recent TX ID then it is not the initial load
        this.accountData.setLastTX(this.accountID,this.chain,this.recentTxId); // Set Last Seen TX when changing changes
        console.log(this.chain);
        this.recentTxId = null;
      }
      if (this.subscriptionUnconfirmedTxs) {
        this.subscriptionUnconfirmedTxs.unsubscribe();
      }
      this.chain = sharedChain; 
      this.chainName = this.sharedProvider.getConstants()['chainProperties'][this.chain]['name'];
      this.transactions = null;
      this.decimals = Math.pow(10, this.sharedProvider.getConstants()['chainProperties'][this.chain]['decimals']);
      this.loadTxs(); 

      // Watch for any new transactions
      this.subscriptionUnconfirmedTxs = this.accountData.getUnconfirmedAccountTransactions(this.chain, this.accountID).subscribe((transactions) => {
        if (transactions['unconfirmedTransactions'][0] && transactions['unconfirmedTransactions'][0]['fullHash'] && transactions['unconfirmedTransactions'][0]['fullHash'] != this.recentUnconfirmedTxId) {
          this.recentUnconfirmedTxId = transactions['unconfirmedTransactions'][0]['fullHash'];
          this.newTX = true;
          for (let i=0;i < transactions['unconfirmedTransactions'].length; i++) {
            transactions['unconfirmedTransactions'][i]['date'] = new Date((new Date("2018-01-01T00:00:00Z").getTime()/1000 + transactions['unconfirmedTransactions'][i]['timestamp'])*1000);
            transactions['unconfirmedTransactions'][i]['unconfirmed'] = true;
            if (this.transactions) {
              this.total = this.transactions.unshift(transactions['unconfirmedTransactions'][i]); 
            } else {
              this.total = 1;
            }
          }           
        } else if (this.newTX && !transactions['unconfirmedTransactions'][0]) {
          this.loadTxs();
          this.newTX = false;
        }
      });
    });
  }

  openModal(modal:string, tx:string = null) {
    if (modal == 'message') {
      let myModal = this.modalCtrl.create(MessageModalPage, { chain: this.chain, fullHash: tx });
      myModal.present();
    } else {
     let myModal = this.modalCtrl.create(TxDetailsModalPage, { tx: tx, chain: this.chain });
     myModal.present();
    }
  }


  loadTxs() {
    this.loaded = false;
  	this.accountData.getContacts().then((currentContacts) => {
        if (currentContacts != null) {
          this.contacts = [];
          this.contactNames = [];
          for (let i=0;i < currentContacts.length; i++) {
            this.contacts.push(currentContacts[i]['account']);
            if (currentContacts[i]['name'] != '') {
              this.contactNames.push(currentContacts[i]['name']);
            } else {
              this.contactNames.push(currentContacts[i]['account']);
            }
          }
        } else {
          this.contacts = [''];
          this.contactNames = [''];
        }
      });
  	this.subscriptionTx = this.accountData.getAccountTransactions(this.chain, this.accountID, this.numToDisplay, (this.numToDisplay * (this.p-1))).subscribe((transactions) => {
	  	if (transactions['errorDescription']) {
        this.transactions = [];
        this.total = 0;
      } else {
	  	  this.transactions = transactions['transactions'];
        if (transactions['transactions'][0] && transactions['transactions'][0]['fullHash']) {
          this.recentTxId = this.transactions[0]['fullHash']; // Record the most recent TX full hash
          this.accountData.getLastTX(this.accountID,this.chain).then(
            (tx) => {
              if (tx && tx != null) {
                if (tx != this.recentTxId) { // If the most recent TX is not the last one we seen, then we need to mark the new txs and record the newest one we've seen now
                  this.loadTXList(tx);
                } else {
                  this.loadTXList('');
                }
              } else {
                this.loadTXList('');
              }
            },
            error => this.loadTXList('')
          );
        } else {
          this.loaded = true; // If there are 0 transactions then no need to load the list, but we should state its loaded
        }
        this.total = transactions['transactions'].length;
        }
	  });
  }

  loadTXList(lastSeenTx: string) {
    let lastSeenTxId = lastSeenTx;
    for (let i=0;i < this.transactions.length; i++) {
      if (this.transactions[i]['type'] != 0) {
        let arrayType = this.transactions[i]['type']+4;
        let arraySubType = this.transactions[i]['subtype'];
        this.transactions[i]['typeName'] = this.transactionTypes[arrayType][arraySubType];
      }
      this.transactions[i]['date'] = new Date((new Date("2018-01-01T00:00:00Z").getTime()/1000 + this.transactions[i]['timestamp'])*1000);
      if(lastSeenTxId != '' && lastSeenTxId != this.transactions[i]['fullHash']) {
        this.transactions[i]['newTx'] = true;
      } else if (lastSeenTxId == this.transactions[i]['fullHash']) { // We are caught up so we don't need to mark any more txs as new
        lastSeenTxId = '';
      }
    }
    this.loaded = true;
  }

  addNewContact(account:string) {
    let myModal = this.modalCtrl.create(EditContactModalPage, { name: '', account: account, type: 'new' });
    myModal.present();
    myModal.onDidDismiss(data => {
      this.accountData.getContacts().then((currentContacts) => {
        if (currentContacts != null) {
          this.contacts = [];
          this.contactNames = [];
          for (let i=0;i < currentContacts.length; i++) {
            this.contacts.push(currentContacts[i]['account']);
            if (currentContacts[i]['name'] != '') {
              this.contactNames.push(currentContacts[i]['name']);
            } else {
              this.contactNames.push(currentContacts[i]['account']);
            }
          }
        } else {
          this.contacts = [''];
          this.contactNames = [''];
        }
      });
      this.viewCtrl.dismiss();
    });
  }

  copyAccount(address: string) {
    this.clipboard.copy(address);
    this.showToast('Address copied to clipboard');
  }

  showToast(message: string) {
    let toast = this.toastCtrl.create({
      message: message,
      duration: 2000,
      position: 'bottom'
    });

    toast.onDidDismiss(() => {
      console.log('Dismissed toast');
    });

    toast.present();
  }

  pageChanged(event){
  	this.p = event;
  	this.loadTxs();
  }

  ionViewWillLeave() { 
    this.subscriptionUnconfirmedTxs.unsubscribe();
    this.subscriptionChain.unsubscribe();
    this.subscriptionTx.unsubscribe();
    this.accountData.setLastTX(this.accountID,this.chain,this.recentTxId); // Set Last Seen TX when leaving
  }

}
