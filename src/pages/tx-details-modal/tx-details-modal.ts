import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams, ViewController } from 'ionic-angular';

import { AccountDataProvider } from '../../providers/account-data/account-data';
import { TransactionsProvider } from '../../providers/transactions/transactions';
import { SharedProvider } from '../../providers/shared/shared';

@IonicPage()
@Component({
  selector: 'page-tx-details-modal',
  templateUrl: 'tx-details-modal.html',
})
export class TxDetailsModalPage {
  transactionTypes: object[];
  chain: number;
  chainName: string;
  txId: string;
  tx: object;

  theme: string;

  constructor(public navCtrl: NavController, public navParams: NavParams, public transactions: TransactionsProvider, public viewCtrl: ViewController, public sharedProvider: SharedProvider, public accountData: AccountDataProvider) {
  	this.txId = navParams.get('tx');
    this.chain = navParams.get('chain');
  }

  ionViewWillEnter() {
    this.accountData.getTheme().then((theme) => {
      this.theme = theme;
    });
    this.transactionTypes = this.sharedProvider.getTransactionTypes();
    this.chainName = this.sharedProvider.getConstants()['chainProperties'][this.chain]['name'];
    this.transactions.getTransaction(this.chain, this.txId).subscribe((tx) => {
	  	this.tx = tx;
      let arrayType = this.tx['type']+4;
      let arraySubType = this.tx['subtype'];
      this.tx['typeName'] = this.transactionTypes[arrayType][arraySubType];
	  	// this.tx['transaction']['date'] = new Date((1464109200 + this.tx['transaction']['timestamp'])*1000);
	  });
    
  }

  closeModal() {
    this.viewCtrl.dismiss();
  }

}
