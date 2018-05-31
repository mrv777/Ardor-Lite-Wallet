import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams, ModalController, ViewController } from 'ionic-angular';

import { LeaseBalanceModalPage } from '../lease-balance-modal/lease-balance-modal';
import { LeasingInfoPage } from '../leasing-info/leasing-info';

@IonicPage()
@Component({
  selector: 'page-lease-menu',
  templateUrl: 'lease-menu.html',
})
export class LeaseMenuPage {

  constructor(public navCtrl: NavController, public navParams: NavParams, public modalCtrl: ModalController, public viewCtrl: ViewController) {
  }

  ionViewDidLoad() {

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

  moreInfo() {
    let myModal = this.modalCtrl.create(LeasingInfoPage);
    myModal.present();
  }

}
