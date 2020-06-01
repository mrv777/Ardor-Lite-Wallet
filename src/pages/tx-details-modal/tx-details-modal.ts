import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams, ViewController } from 'ionic-angular';

import { AccountDataProvider } from '../../providers/account-data/account-data';
import { TransactionsProvider } from '../../providers/transactions/transactions';
import { SharedProvider } from '../../providers/shared/shared';
import { AssetsProvider } from '../../providers/assets/assets';

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
  decimals: number = 100000000;

  theme: string;

  constructor(public navCtrl: NavController, public navParams: NavParams, public transactions: TransactionsProvider, public viewCtrl: ViewController, public sharedProvider: SharedProvider, public accountData: AccountDataProvider, public assetsProvider: AssetsProvider) {
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
      this.tx['date'] = new Date((new Date("2018-01-01T00:00:00Z").getTime()/1000 + this.tx['timestamp'])*1000);

      this.decimals = Math.pow(10, this.sharedProvider.getConstants()['chainProperties'][this.chain]['decimals']);
      if (this.tx['type'] == 2 && this.tx['subtype'] == 1) {
        this.assetsProvider.getAsset(this.tx['attachment']['asset'], false)
        .subscribe(
            asset => {
              if (asset['errorDescription']) {
                this.tx['amount'] = -1;
              } else {
                this.tx['amount'] = this.tx['attachment']['quantityQNT']/Math.pow(10, asset['decimals']);
              }
            }
        );
      } else {
        this.tx['amount'] = this.tx['amountNQT']/this.decimals;
      }
	  	// this.tx['transaction']['date'] = new Date((1464109200 + this.tx['transaction']['timestamp'])*1000);
	  });
    
  }

  closeModal() {
    this.viewCtrl.dismiss();
  }

}
