import { Component, ViewChild } from '@angular/core';
import { IonicPage, NavController, NavParams, ModalController, Platform, Select, MenuController, FabContainer, AlertController } from 'ionic-angular';
import { BarcodeScanner } from '@ionic-native/barcode-scanner';
import { TranslateService } from '@ngx-translate/core';

import { HomePage } from '../home/home';
import { NewAccountPage } from '../new-account/new-account';
import { FingerprintWizardPage } from '../fingerprint-wizard/fingerprint-wizard';
import { GuestLoginPage } from '../guest-login/guest-login';
import { SendOfflineTxPage } from '../send-offline-tx/send-offline-tx';

import { AccountDataProvider } from '../../providers/account-data/account-data';
import { SharedProvider } from '../../providers/shared/shared';


@IonicPage()
@Component({
  selector: 'page-login',
  templateUrl: 'login.html',
})
export class LoginPage {
  @ViewChild('selectAccount') selectAccount: Select;
  password: string = '';
  disableLogin: boolean = false;
  fingerAvailable: boolean = false;
  cordovaAvailable: boolean = false;
  account: string;
  accounts: object[];
  accountsLoaded: boolean = false;
  loopIndex: number = 0;
  error: string;
  loginError: string;
  language: string = "en";
  accountIcon: any;
  guest: boolean = false;
  loading: boolean = true;
  firstTimeLoading: boolean = false;

  qrText: string = 'Place QR code inside the scan area';
  unknownAccount: string = 'Alias not found, or incorrect account address';
  notSecure: string = 'Account importing only works on mobile devices with the device secured';

  constructor(public navCtrl: NavController, public navParams: NavParams, public shared: SharedProvider, public accountData: AccountDataProvider, private barcodeScanner: BarcodeScanner, public modalCtrl: ModalController, public platform: Platform, private menu: MenuController, public translate: TranslateService, private alertCtrl: AlertController) {

  }

  ionViewDidLoad() { 
  	this.platform.ready().then((readySource) => {
      this.menu.swipeEnable(false);
      this.accountData.getLang().then((lang) => {
        if (lang && lang != '') {
          this.translate.use(lang);
          this.language = lang;
        } else {
          let userLang = this.translate.getBrowserLang();
          this.translate.use(userLang);
          this.language = userLang;
        }
      });

      this.firstTimeLoading = this.accountData.firstLoad();
      if (this.firstTimeLoading) {
        this.accountData.getDefaultCurrency().then((defaultCurrency) => {
          if (defaultCurrency && defaultCurrency != '') {
            this.shared.emitConversion(0,defaultCurrency,0);
          } else {
            this.shared.emitConversion(0,'USD',0);
          }
        });
      }

      this.translate.get('QR_SCAN').subscribe((res: string) => {
        this.qrText = res;
      });
      this.translate.get('UNKNOWN_ALIAS_ADDRESS').subscribe((res: string) => {
        this.unknownAccount = res;
      });
      this.translate.get('DEVICE_NOT_SECURE').subscribe((res: string) => {
        this.notSecure = res;
      });

      this.setNode();
  	});
  }

  setNode() {
    this.error = null;
    this.loading = true;
    this.accountData.setNode("mainnet/").then(() => {
      this.accountData.checkNode().subscribe(
        (nodeStatus) => {
          if (nodeStatus['blockchainState'] == "UP_TO_DATE") {
            this.error = null;
            this.shared.getConstantsHttp().subscribe((sharedData) => {
              this.shared.setConstants(sharedData);
              
             //Desktop Testing
             //this.accounts = [{account: 'ARDOR-BK2J-ZMY4-93UY-8EM9V' , name: 'MrV', password: '', chain: 1},{account: 'ARDOR-2QHM-H99Q-8C9Y-C4XTN' , name: 'MrV2', password: '', chain: 2}];
             //this.setBalances();
              if (this.platform.is('cordova')) {
                this.accountData.init().then(() => {
                  this.loading = false;
                  this.cordovaAvailable = this.accountData.isDeviceSecure(); // Account importing only works on mobile devices with the device secured
                  if (this.cordovaAvailable) {
                    this.accounts = this.accountData.getSavedAccounts();
                    this.setBalances();
                  } else {
                    if (this.firstTimeLoading) {
                      this.presentMessage(this.notSecure);
                    }
                  }
                });
              } else {
                this.accountData.getTheme().then((theme) => {
                  this.accountData.setTheme(theme);
                });
                this.loading = false;
              }
            });
          } else {
            this.error = "Node error or out of sync";
            this.loading = false;
          }
        },
        (err) => {
          this.error = "Node not online";
          this.loading = false;
        });
    });
  }

  setBalances() {
    this.error = null;
    this.accountData.getBalanceOnce(this.accounts[this.loopIndex]['chain'], this.accounts[this.loopIndex]['account'])
    .subscribe(
         account => {
  	      if (!account || !account['unconfirmedBalanceNQT']) {
            this.error = "Error getting balance";
            this.accounts[this.loopIndex]['balance'] = 0;
            if (this.loopIndex >= this.accounts.length-1) {
              this.accountsLoaded = true;
            } else {
              this.loopIndex = this.loopIndex + 1;
              this.setBalances();
            }
  	      } else {
  	        if (account && account['unconfirmedBalanceNQT']) {
  	          this.accounts[this.loopIndex]['balance'] = account['unconfirmedBalanceNQT'];
  	        } else {
  	          this.accounts[this.loopIndex]['balance'] = 0;
  	        }
            let chainName = this.shared.getConstants()['chainProperties'][this.accounts[this.loopIndex]['chain']]['name'];
            this.accounts[this.loopIndex]['chainName'] = chainName;
  	        if (this.loopIndex >= this.accounts.length-1) {
  	          this.accountsLoaded = true;
  	        } else {
  	          this.loopIndex = this.loopIndex + 1;
  	          this.setBalances();
  	        }
  	      }
  	    },
         error => console.log("Error :: " + error)
     );

  }

  onLogin(account: string, type: string = "Account") {
    this.loginError = null;
    if (!this.platform.is('cordova')) {
      this.accountData.setGuestLogin();
      this.guest = true;
    }
    this.disableLogin = true;
    account = account.toUpperCase();
    this.shared.getConstantsHttp().subscribe((shared) => {
    	this.shared.setConstants(shared);
      if (type == "Account" && (account.substring(0, 4) != "NXT-" && account.substring(0, 6) != "ARDOR-" && account.substring(0, 6) != "IGNIS-" && account.substring(0, 4) != "BITS-" && account.substring(0, 5) != "AEUR-")) {
      this.accountData.getAlias('ignis', account)
        .subscribe(
          alias => {
            if (alias['errorDescription']) {
              if (alias['errorDescription'] == 'Unknown alias') {
                this.loginError = this.unknownAccount;
              } else {
                this.loginError = alias['errorDescription'];
              }
              console.log(alias['errorDescription']);
            } else {
              this.accountData.login(alias['accountRS'], type);
              if (!this.guest) {
                 let accountChain = this.accountData.getAccountChain();
                 let chainName = this.shared.getConstants()['chainProperties'][accountChain]['name'];
                 this.shared.emitChain(chainName, accountChain);
              }
              this.navCtrl.setRoot(HomePage);
            }
          });
      } else {
        this.accountData.login(account, type);
        if (!this.guest) {
           let accountChain = this.accountData.getAccountChain();
           let chainName = this.shared.getConstants()['chainProperties'][accountChain]['name'];
           this.shared.emitChain(chainName, accountChain);
        }
        this.navCtrl.setRoot(HomePage);
      }	
    });
  }

  openBarcodeScanner() {
    this.barcodeScanner.scan({prompt : this.qrText, disableSuccessBeep: true}).then((barcodeData) => {
      this.password = barcodeData['text'];
    }, (err) => {
        // An error occurred
    });
  }

  presentMessage(msg: string) {
    let alert = this.alertCtrl.create({
      title: msg,
      buttons: ['Dismiss']
    });
    alert.present();
  }

  setLanguage(lang, fab: FabContainer) {
    this.translate.use(lang);
    this.accountData.setLang(lang);
    this.language = lang;
    fab.close();
  }

  openModal(modal:string) {
    if (modal == 'fingerprint') {
      let myModal = this.modalCtrl.create(FingerprintWizardPage);
	    myModal.present();
	    myModal.onDidDismiss(data => {
        this.loopIndex = 0;
	      this.setBalances();
	    });
    } else if (modal == 'guest') {    
      let myModal = this.modalCtrl.create(GuestLoginPage);
      myModal.present();
      myModal.onDidDismiss(data => {
        if (data) {
          this.accountData.setGuestLogin();
          this.guest = true;
          this.onLogin(data);
        }
      });
    } else if (modal == 'offlineTx') {
       let myModal = this.modalCtrl.create(SendOfflineTxPage);
      myModal.present();
    } else { 
      let myModal = this.modalCtrl.create(NewAccountPage);
	    myModal.present();
	    myModal.onDidDismiss(data => {
        if (data) {
          this.onLogin(data);
        }
	    });
    }
  }

  openSelectAccount() {
    this.selectAccount.open();
  }

}