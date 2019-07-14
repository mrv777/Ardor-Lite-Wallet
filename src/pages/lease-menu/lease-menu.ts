import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams, ModalController, ViewController } from 'ionic-angular';

import { LeaseBalanceModalPage } from '../lease-balance-modal/lease-balance-modal';
import { LeasingInfoPage } from '../leasing-info/leasing-info';
import { AccountDataProvider } from '../../providers/account-data/account-data';

@IonicPage()
@Component({
  selector: 'page-lease-menu',
  templateUrl: 'lease-menu.html',
})
export class LeaseMenuPage {
  darkMode: boolean = false;
  leased: boolean = false;
  lease: string;
  leaseBlock: number;

  constructor(public navCtrl: NavController, public navParams: NavParams, public modalCtrl: ModalController, public viewCtrl: ViewController, public accountData: AccountDataProvider) {
    this.leased = this.navParams.get('leased');
  }

  ionViewWillEnter() {
    if (this.leased) {
      const accountID = this.accountData.getAccountID();
      this.accountData.getAccount(accountID).subscribe((account) => {
        this.lease = account['currentLesseeRS'];
        this.accountData.checkNode().subscribe((blockchain) => {
          this.leaseBlock = (account['currentLeasingHeightTo'] - blockchain['numberOfBlocks']) / 60 / 24; //Get number of blocks difference then convert to hours and then days
        });
      });
    }
    this.accountData.getTheme().then((theme) => {
      if (theme == 'darkTheme') {
        this.darkMode = true;
      } else {
        this.darkMode = false;
      }
    });
  }

  leaseBalance(address) {
    let myModal;
    if (address != 'none') {
      myModal = this.modalCtrl.create(LeaseBalanceModalPage, { address: address });
    } else {
      myModal = this.modalCtrl.create(LeaseBalanceModalPage);
    }
    myModal.present();
    myModal.onDidDismiss(data => {
      this.viewCtrl.dismiss('lease');
    });
  }

  closeMenu() {
    this.viewCtrl.dismiss();
  }

  moreInfo() {
    let myModal = this.modalCtrl.create(LeasingInfoPage);
    myModal.present();
  }

}
