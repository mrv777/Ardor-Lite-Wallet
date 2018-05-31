import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams, ViewController } from 'ionic-angular';

import { AccountDataProvider } from '../../providers/account-data/account-data';
import { SharedProvider } from '../../providers/shared/shared';

@IonicPage()
@Component({
  selector: 'page-account-settings',
  templateUrl: 'account-settings.html',
})
export class AccountSettingsPage {
  guest: boolean = false;
  darkMode: boolean = false;
  chains: string[] = [];
  chainNumbers: number[] = [];
  chainName: string = 'ARDR';
  chain: number = 1;
  changes: boolean = false;
  loaded: boolean = false;

  constructor(public navCtrl: NavController, public navParams: NavParams, public accountData: AccountDataProvider, public sharedProvider: SharedProvider, public viewCtrl: ViewController) {
  }

  ionViewDidLoad() {
    this.guest = this.accountData.isGuestLogin();
    if (!this.guest) {
      this.chain = this.accountData.getAccountChain();
      this.chainName = this.sharedProvider.getConstants()['chainProperties'][this.chain]['name'];
      const chainObjects = this.sharedProvider.getConstants()['chains'];
      this.chains = Object.keys(chainObjects);
      for (const key of this.chains) {
        this.chainNumbers.push(chainObjects[key]);
      }
    }
    this.accountData.getTheme().then((theme) => {
        if (theme == 'darkTheme') {
          this.darkMode = true;
        } else {
          this.darkMode = false;
        }
        this.loaded = true;
      });
  }

  setTheme() {
  	if (this.darkMode == true) {
  		this.accountData.setTheme('darkTheme');
  	} else {
  		this.accountData.setTheme('lightTheme');
  	}
  }

  setChain() {
    if (this.loaded) {
      this.changes = true;
      this.chain = this.chainNumbers[this.chains.indexOf(this.chainName)];
      this.accountData.editAccountChain(this.chain);
      this.sharedProvider.emitChain(this.chainName, this.chain);
    }
  }

  closeModal() {
    this.viewCtrl.dismiss(this.changes);
  }

}
