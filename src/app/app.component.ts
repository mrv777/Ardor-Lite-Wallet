import { Component, ViewChild } from '@angular/core';
import { Nav, Platform, ToastController, IonicApp, MenuController } from 'ionic-angular';
import { StatusBar } from '@ionic-native/status-bar';
import { SplashScreen } from '@ionic-native/splash-screen';
import { TranslateService } from '@ngx-translate/core';
import { HeaderColor } from '@ionic-native/header-color';
import { Deeplinks } from '@ionic-native/deeplinks';

import { LoginPage } from '../pages/login/login';
import { HomePage } from '../pages/home/home';
import { ContactsPage } from '../pages/contacts/contacts';
import { CoinExchangePage } from '../pages/coin-exchange/coin-exchange';
import { AboutPage } from '../pages/about/about';
import { AssetsPage } from '../pages/assets/assets';
import { SendOfflineTxPage } from '../pages/send-offline-tx/send-offline-tx';

import { AccountDataProvider } from '../providers/account-data/account-data';

@Component({
  templateUrl: 'app.html'
})
export class MyApp {
  @ViewChild(Nav) nav: Nav;

  rootPage: any = LoginPage;
  theme: string = 'lightTheme';
  acActive: object = {'background-color': '#07426e'};
  coActive: object = {};
  ceActive: object = {};
  abActive: object = {};
  assetsActive: object = {};
  pressExit: string = 'Press Again to Exit';

  pages: Array<{title: string, component: any}>;

  backButtonPressedOnceToExit: boolean = false;

  constructor(public platform: Platform, public statusBar: StatusBar, public splashScreen: SplashScreen, private menuCtrl: MenuController, private ionicApp: IonicApp, private toastCtrl: ToastController, public accountData: AccountDataProvider, private translate: TranslateService, private headerColor: HeaderColor, private deeplinks: Deeplinks) {
    this.initializeApp();

    translate.setDefaultLang('en');

  }

  initializeApp() {
    this.platform.ready().then(() => {
      // Okay, so the platform is ready and our plugins are available.
      // Here you can do any higher level native things you might need.
      this.statusBar.styleDefault();
      this.statusBar.backgroundColorByHexString('#1162a1');
      this.headerColor.tint('#1162a1');
      this.accountData.getActiveTheme().subscribe(val => this.theme = val);
      this.splashScreen.hide();

      if (this.platform.is('cordova')) {
        this.deeplinks.routeWithNavController(this.nav, {
          //'/about-us': AboutPage
        }).subscribe((match) => {
          console.log('Successfully routed', match);
          let linkPath = match['$link']['url'];
          if (linkPath.search("tx/") > 0) {
            this.nav.push(SendOfflineTxPage, { sign: true, tx: linkPath.split('tx/')[1] } );
          } else {
            this.nav.push(SendOfflineTxPage);
          }
        }, (nomatch) => {
          console.warn('Unmatched Route', nomatch);
          let linkPath = nomatch['$link']['url'];
          if (linkPath.search("tx/") > 0) {
            this.nav.push(SendOfflineTxPage, { sign: true, tx: linkPath.split('tx/')[1] } );
          } else {
            this.nav.push(SendOfflineTxPage);
          }
        });
      }

      this.platform.registerBackButtonAction(() => {
        this.translate.get('PRESS_EXIT').subscribe((res: string) => {
          this.pressExit = res;
        });

        let activePortal = this.ionicApp._loadingPortal.getActive() ||
           this.ionicApp._modalPortal.getActive() ||
           this.ionicApp._overlayPortal.getActive();
    
        //activePortal is the active overlay like a modal,toast,etc
        if (activePortal) {
            activePortal.dismiss();
            return;
        }
        else if (this.menuCtrl.isOpen()) { // Close menu if open
            this.menuCtrl.close();
            return;
        }

        if (this.backButtonPressedOnceToExit) {
          this.platform.exitApp();
        } else if (this.nav.canGoBack()) {
          this.nav.pop({}).then(() => {
            let page = this.nav.getActive().component;
            if (page == HomePage){
              this.acActive = {'background-color': '#07426e'};
              this.coActive = {};
              this.ceActive = {};
              this.abActive = {};
              this.assetsActive = {};
            } else if (page == ContactsPage){
              this.acActive = {};
              this.coActive = {'background-color': '#07426e'};
              this.ceActive = {};
              this.abActive = {};
              this.assetsActive = {};
            } else if (page == CoinExchangePage){
              this.acActive = {};
              this.coActive = {};
              this.ceActive = {'background-color': '#07426e'};
              this.abActive = {};
              this.assetsActive = {};
            } else if (page == AboutPage){
              this.acActive = {};
              this.coActive = {};
              this.ceActive = {};
              this.abActive = {'background-color': '#07426e'};
              this.assetsActive = {};
            } else if (page == AssetsPage){
              this.acActive = {};
              this.coActive = {};
              this.ceActive = {};
              this.abActive = {};
              this.assetsActive = {'background-color': '#07426e'};
            }
          });
          
        } else {
          this.showToast();
          this.backButtonPressedOnceToExit = true;
          setTimeout(() => {
            this.backButtonPressedOnceToExit = false;
          },2000)
        }
      });
    });
  }

  showToast() {
    let toast = this.toastCtrl.create({
      message: this.pressExit,
      duration: 2000,
      position: 'bottom'
    });

    toast.onDidDismiss(() => {
      console.log('Dismissed toast');
    });

    toast.present();
  }

  openPage(page) {
    if (page == 'Account'){
      this.acActive = {'background-color': '#07426e'};
      this.coActive = {};
      this.ceActive = {};
      this.abActive = {};
      this.assetsActive = {};
      this.nav.push(HomePage);
    } else if (page == 'Contacts'){
      this.acActive = {};
      this.coActive = {'background-color': '#07426e'};
      this.ceActive = {};
      this.abActive = {};
      this.assetsActive = {};
      this.nav.push(ContactsPage);
    } else if (page == 'CoinExchange'){
      this.acActive = {};
      this.coActive = {};
      this.ceActive = {'background-color': '#07426e'};
      this.abActive = {};
      this.assetsActive = {};
      this.nav.push(CoinExchangePage);
    } else if (page == 'About'){
      this.acActive = {};
      this.coActive = {};
      this.ceActive = {};
      this.abActive = {'background-color': '#07426e'};
      this.assetsActive = {};
      this.nav.push(AboutPage);
    }
     else if (page == 'Assets'){
      this.acActive = {};
      this.coActive = {};
      this.ceActive = {};
      this.abActive = {};
      this.assetsActive = {'background-color': '#07426e'};
      this.nav.push(AssetsPage);
    }
  }

  logout() {
    this.acActive = {'background-color': '#07426e'};
    this.coActive = {};
    this.ceActive = {};
    this.abActive = {};
    this.assetsActive = {};
    this.accountData.logout();
    this.nav.setRoot(LoginPage);
  }
}
