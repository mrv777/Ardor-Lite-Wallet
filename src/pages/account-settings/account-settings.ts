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

  darkMode: boolean;
  chains: string[] = [];
  chainNumbers: number[] = [];
  chainName: string = 'ARDR';
  chain: number = 1;

  constructor(public navCtrl: NavController, public navParams: NavParams, public accountData: AccountDataProvider, public sharedProvider: SharedProvider, public viewCtrl: ViewController) {
  }

  ionViewDidLoad() {
  	this.chain = this.sharedProvider.getChainOnce();
    this.chainName = this.sharedProvider.getChainNameOnce();
    const chainObjects = this.sharedProvider.getConstants()['chains'];
  	this.chains = Object.keys(chainObjects);
  	for (const key of this.chains) {
  	  this.chainNumbers.push(chainObjects[key]);
  	}
    this.accountData.getTheme().then((theme) => {
        if (theme == 'darkTheme') {
          this.darkMode = true;
        } else {
          this.darkMode = false;
        }
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
    this.chain = this.chainNumbers[this.chains.indexOf(this.chainName)];
    this.accountData.editAccountChain(this.chain);
    this.sharedProvider.emitChain(this.chainName, this.chain);
  }

  closeModal() {
    this.viewCtrl.dismiss();
  }

}
