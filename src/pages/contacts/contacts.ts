import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams, ModalController, PopoverController } from 'ionic-angular';

import { AccountDataProvider } from '../../providers/account-data/account-data';
import { ContactsMenuPage } from '../contacts-menu/contacts-menu';
import { EditContactModalPage } from '../edit-contact-modal/edit-contact-modal';

@IonicPage()
@Component({
  selector: 'page-contacts',
  templateUrl: 'contacts.html',
})
export class ContactsPage {
  contacts: object[];
  guest: boolean = false;

  constructor(public navCtrl: NavController, public accountData: AccountDataProvider, public navParams: NavParams, public modalCtrl: ModalController, public popoverCtrl: PopoverController) {
  }

  ionViewDidLoad() {
    this.loadContacts();
  }

  loadContacts() {
    this.guest = this.accountData.isGuestLogin();
    if (!this.guest) {
      this.accountData.getContacts().then((currentContacts) => {
        if (currentContacts != null && currentContacts.length != 0) {
          this.contacts = currentContacts;
          this.contacts.sort((a, b) => a['name'].localeCompare(b['name']));

          // this.contacts.sort((b, a) => {
          //   if (a['name'] < b['name']) return -1;
          //   else if (a['name'] > b['name']) return 1;
          //   else return 0;
          // });
        } else {
          this.contacts = null;
        }
      });
    }
  }

  editContact(name:string, account:string, type:string) {
    let myModal = this.modalCtrl.create(EditContactModalPage, { name: name, account: account, type: type });
    myModal.present();
    myModal.onDidDismiss(data => {
      this.loadContacts();
    });  
  }

  presentPopover(myEvent, account, name) {
    let popover = this.popoverCtrl.create(ContactsMenuPage, { account: account, name: name } );
    popover.present({
      ev: myEvent,

    });
    popover.onDidDismiss(data => {
      this.loadContacts();
    });
  }

}