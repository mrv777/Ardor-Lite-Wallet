import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams, ViewController } from 'ionic-angular';
import { AccountDataProvider } from '../../providers/account-data/account-data';

@IonicPage()
@Component({
  selector: 'page-leasing-info',
  templateUrl: 'leasing-info.html',
})
export class LeasingInfoPage {

  theme: string;

  constructor(public navCtrl: NavController, public navParams: NavParams, public viewCtrl: ViewController, public accountData: AccountDataProvider) {
  }

  ionViewWillEnter() {
  	this.accountData.getTheme().then((theme) => {
      this.theme = theme;
    });
  }
  
  closeModal() {
    this.viewCtrl.dismiss();
  }

}
