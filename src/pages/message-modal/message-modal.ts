import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams, ViewController } from 'ionic-angular';

import { TransactionsProvider } from '../../providers/transactions/transactions';
import { AccountDataProvider } from '../../providers/account-data/account-data';

@IonicPage()
@Component({
  selector: 'page-message-modal',
  templateUrl: 'message-modal.html',
})
export class MessageModalPage {
  chain: number;
  fullHash: string;
  sender: string;
  message: string;

  theme: string;

  constructor(public navCtrl: NavController, public navParams: NavParams, public transactionsProvider: TransactionsProvider, public viewCtrl: ViewController, public accountData: AccountDataProvider) {
    this.chain = navParams.get('chain');
    this.fullHash = navParams.get('fullHash');
  }

  ionViewWillEnter() {
    this.accountData.getTheme().then((theme) => {
      this.theme = theme;
    });
    this.transactionsProvider.getTransaction(this.chain, this.fullHash)
    .subscribe(
      transaction => {
        this.sender = transaction['senderRS'];
        this.message = transaction['attachment']['message'];
      }
    );
  }

  closeModal() {
    this.viewCtrl.dismiss();
  }

}
