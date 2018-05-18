import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams, ViewController } from 'ionic-angular';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

import { AccountDataProvider } from '../../providers/account-data/account-data';

@IonicPage()
@Component({
  selector: 'page-rename-account',
  templateUrl: 'rename-account.html',
})
export class RenameAccountPage {
  private editForm: FormGroup;
  name: string;

  theme: string;

  constructor(public navCtrl: NavController, public navParams: NavParams, public viewCtrl: ViewController, public accountData: AccountDataProvider, private formBuilder: FormBuilder) {
    this.editForm = this.formBuilder.group({
      accountNameForm: ['', Validators.compose([Validators.required,Validators.maxLength(16)])]
    });
  }

  ionViewWillEnter() {
    this.accountData.getTheme().then((theme) => {
      this.theme = theme;
    });
    this.name = this.accountData.getAccountName();
  }

  editAccount(){
	this.accountData.editAccountName(this.name).then(() => {
	  this.viewCtrl.dismiss();
	});
  }

  closeModal() {
    this.viewCtrl.dismiss();
  }

}
