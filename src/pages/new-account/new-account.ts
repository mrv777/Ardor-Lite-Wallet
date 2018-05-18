import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams, ViewController, AlertController } from 'ionic-angular';
// import { Screenshot } from '@ionic-native/screenshot';

import * as bip39 from 'bip39';

import { AccountDataProvider } from '../../providers/account-data/account-data';

@IonicPage()
@Component({
  selector: 'page-new-account',
  templateUrl: 'new-account.html',
})
export class NewAccountPage {
  passphrase: string;
  accountID: string;
  saved: boolean = false;
  accountName: string = '';
  savePassphrase: boolean = false;

  constructor(public navCtrl: NavController, public navParams: NavParams, public accountData: AccountDataProvider, public viewCtrl: ViewController, private alertCtrl: AlertController) {
  }

  ionViewDidLoad() {
    this.passphrase = bip39.generateMnemonic();
    this.accountID = this.accountData.convertPasswordToAccount(this.passphrase);
  }

  presentPrompt() {
	  let alert = this.alertCtrl.create({
	    title: 'Verify Passphrase',
	    message: 'Please enter your passphrase to verify you have saved it correctly.',
	    inputs: [
	      {
	        name: 'password',
	        placeholder: 'Passphrase',
	        type: 'text'
	      }
	    ],
	    buttons: [
	      {
	        text: 'Cancel',
	        role: 'cancel',
	        handler: data => {
	          console.log('Cancel clicked');
	        }
	      },
	      {
	        text: 'Verify',
	        handler: data => {
	          if (data.password == this.passphrase) {
	            // Success
	            this.closeModal();
	            return true;
	          } else {
	            // invalid passphrase
	            this.presentMessage("Incorrect Passphrase");
	            return true;
	          }
	        }
	      }
	    ]
	  });
	  alert.present();
	}

	presentMessage(msg: string) {
	  let alert = this.alertCtrl.create({
	    title: msg,
	    buttons: ['Dismiss']
	  });
	  alert.present();
	}

  closeModal() {
  	this.accountData.saveSavedPassword(this.passphrase, this.accountID, this.accountName, 1, this.savePassphrase);
    this.viewCtrl.dismiss(this.accountID);
  }
}
