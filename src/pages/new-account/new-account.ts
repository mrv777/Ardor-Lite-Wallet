import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams, ViewController, AlertController, Platform } from 'ionic-angular';
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
  blur: string = '';

  constructor(public navCtrl: NavController, public navParams: NavParams, public accountData: AccountDataProvider, public viewCtrl: ViewController, private alertCtrl: AlertController, public platform: Platform) {
  }

  ionViewDidLoad() {
    this.passphrase = bip39.generateMnemonic();
    this.accountID = this.accountData.convertPasswordToAccount(this.passphrase);
  }

  presentPrompt() {
  	this.blur = 'blur';
  	let words = this.passphrase.split(" ");
  	let randomNum = Math.floor(Math.random() * 12);
  	let word = words.splice(randomNum, 1);
  	//let random = words.sort(() => .5 - Math.random()).slice(0,4)
	  let alert = this.alertCtrl.create({
	    title: 'Verify Passphrase',
	    message: `Please enter word number ${randomNum+1} in your passphrase to verify you have saved it correctly.`,
	    inputs: [
	      {
	        name: 'password',
	        placeholder: '',
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
	          if (data.password == word) {
	            // Success
	            this.closeModal();
	            return true;
	          } else {
	            // invalid passphrase
	            this.presentMessage("Incorrect Word");
	            return true;
	          }
	        }
	      }
	    ]
	  });
	  alert.present();
	  alert.onDidDismiss(data => {
	    this.blur = '';
	  });
	}

	presentMessage(msg: string) {
	  let alert = this.alertCtrl.create({
	    title: msg,
	    buttons: ['Dismiss']
	  });
	  alert.present();
	}

  closeModal() {
  	if (this.platform.is('cordova')) {
  		this.accountData.saveSavedPassword(this.passphrase, this.accountID.toUpperCase(), this.accountName, 1, this.savePassphrase);
  	}
    this.viewCtrl.dismiss(this.accountID);
  }
}
