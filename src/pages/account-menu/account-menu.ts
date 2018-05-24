import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams, ViewController, ModalController } from 'ionic-angular';

import { AccountDataProvider } from '../../providers/account-data/account-data';
import { RenameAccountPage } from '../rename-account/rename-account';
import { AccountSettingsPage } from '../account-settings/account-settings';
import { LeaseBalanceModalPage } from '../lease-balance-modal/lease-balance-modal';

@IonicPage()
@Component({
  selector: 'page-account-menu',
  templateUrl: 'account-menu.html',
})
export class AccountMenuPage {
  hasPassphrase: boolean = false;
  guest: boolean = false;

  constructor(public navCtrl: NavController, public navParams: NavParams, public viewCtrl: ViewController, public accountData: AccountDataProvider, public modalCtrl: ModalController,) {
  }

  ionViewDidLoad() {
    this.guest = this.accountData.isGuestLogin();
    if (!this.guest) {
      this.hasPassphrase = this.accountData.hasSavedPassword();
    }
    
  }

  removeAccount() {
    this.accountData.removeCurrentAccount().then(() => {
      this.viewCtrl.dismiss('remove');
    });
  }

  accountSettings() {
    let myModal = this.modalCtrl.create(AccountSettingsPage);
    myModal.present();
    myModal.onDidDismiss(data => {
      this.viewCtrl.dismiss('settings');
    });
  }

  leaseBalance() {
    let myModal = this.modalCtrl.create(LeaseBalanceModalPage);
    myModal.present();
    myModal.onDidDismiss(data => {
      this.viewCtrl.dismiss('lease');
    });
  }

  savePassphrase() {

  }

  removePassphrase() {
  	this.accountData.removeSavedPssword().then(() => {
  		this.viewCtrl.dismiss('passphraseRemoved');
  	});
  }

  editAccount() {
    let myModal = this.modalCtrl.create(RenameAccountPage);
    myModal.present();
    myModal.onDidDismiss(data => {
      this.viewCtrl.dismiss();
    });
  }

}
