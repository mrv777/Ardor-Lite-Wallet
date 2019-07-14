import { BrowserModule } from '@angular/platform-browser';
import { ErrorHandler, NgModule } from '@angular/core';
import { IonicApp, IonicErrorHandler, IonicModule } from 'ionic-angular';
import { TranslateModule, TranslateLoader } from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';
import { HttpClientModule, HttpClient } from '@angular/common/http';
import { IonicStorageModule } from '@ionic/storage';
import { SecureStorage } from '@ionic-native/secure-storage';
import { BarcodeScanner } from '@ionic-native/barcode-scanner';
import { FingerprintAIO } from '@ionic-native/fingerprint-aio';
import { PinDialog } from '@ionic-native/pin-dialog';
import { HeaderColor } from '@ionic-native/header-color';
import { Keyboard } from '@ionic-native/keyboard';

import { MyApp } from './app.component';
import { HomePage } from '../pages/home/home';

import { LoginPageModule } from '../pages/login/login.module'
import { FingerprintWizardPageModule } from '../pages/fingerprint-wizard/fingerprint-wizard.module';
import { GuestLoginPageModule } from '../pages/guest-login/guest-login.module';
import { NewAccountPageModule } from '../pages/new-account/new-account.module';
import { SendOfflineTxPageModule } from '../pages/send-offline-tx/send-offline-tx.module';
import { TransactionsTabPageModule } from '../pages/transactions-tab/transactions-tab.module';
import { TxDetailsModalPageModule } from '../pages/tx-details-modal/tx-details-modal.module';
import { ContactsPageModule } from '../pages/contacts/contacts.module';
import { ContactsMenuPageModule } from '../pages/contacts-menu/contacts-menu.module';
import { EditContactModalPageModule } from '../pages/edit-contact-modal/edit-contact-modal.module';
import { ReceiveTabPageModule } from '../pages/receive-tab/receive-tab.module';
import { SendTabPageModule } from '../pages/send-tab/send-tab.module';
import { AboutPageModule } from '../pages/about/about.module';
import { AccountMenuPageModule } from '../pages/account-menu/account-menu.module';
import { RenameAccountPageModule } from '../pages/rename-account/rename-account.module';
import { CoinExchangePageModule } from '../pages/coin-exchange/coin-exchange.module';
import { CoinExchangeModalPageModule } from '../pages/coin-exchange-modal/coin-exchange-modal.module';
import { MessageModalPageModule } from '../pages/message-modal/message-modal.module';
import { AccountSettingsPageModule } from '../pages/account-settings/account-settings.module';
import { LeaseBalanceModalPageModule } from '../pages/lease-balance-modal/lease-balance-modal.module';
import { LeaseMenuPageModule } from '../pages/lease-menu/lease-menu.module';
import { LeasingInfoPageModule } from '../pages/leasing-info/leasing-info.module';
import { CancelOrderModalPageModule } from '../pages/cancel-order-modal/cancel-order-modal.module';
import { AccountInfoPageModule } from '../pages/account-info/account-info.module';
import { AssetsPageModule } from '../pages/assets/assets.module';

import { StatusBar } from '@ionic-native/status-bar';
import { SplashScreen } from '@ionic-native/splash-screen';
import { AccountDataProvider } from '../providers/account-data/account-data';
import { TransactionsProvider } from '../providers/transactions/transactions';
import { SharedProvider } from '../providers/shared/shared';
import { CurrenciesProvider } from '../providers/currencies/currencies';
import { CoinExchangeProvider } from '../providers/coin-exchange/coin-exchange';
import { AliasesProvider } from '../providers/aliases/aliases';

export function createTranslateLoader(http: HttpClient) {
  return new TranslateHttpLoader(http, './assets/i18n/', '.json');
}

import jdenticon from 'jdenticon';
import { AssetsProvider } from '../providers/assets/assets';

jdenticon.config = {
  replaceMode: "observe"
};

@NgModule({
  declarations: [
    MyApp,
    HomePage,
  ],
  imports: [
    BrowserModule,
    IonicModule.forRoot(MyApp),
    HttpClientModule,
    IonicStorageModule.forRoot(),
     TranslateModule.forRoot({
      loader: {
        provide: TranslateLoader,
        useFactory: (createTranslateLoader),
        deps: [HttpClient]
      }
    }),
    FingerprintWizardPageModule,
    GuestLoginPageModule,
    NewAccountPageModule,
    SendOfflineTxPageModule,
    TransactionsTabPageModule,
    TxDetailsModalPageModule,
    EditContactModalPageModule,
    ReceiveTabPageModule,
    SendTabPageModule,
    LoginPageModule,
    ContactsPageModule,
    ContactsMenuPageModule,
    AboutPageModule,
    AccountMenuPageModule,
    RenameAccountPageModule,
    CoinExchangePageModule,
    CoinExchangeModalPageModule,
    MessageModalPageModule,
    AccountSettingsPageModule,
    LeaseBalanceModalPageModule,
    LeaseMenuPageModule,
    LeasingInfoPageModule,
    CancelOrderModalPageModule,
    AccountInfoPageModule,
    AssetsPageModule
  ],
  bootstrap: [IonicApp],
  entryComponents: [
    MyApp,
    HomePage,
  ],
  providers: [
    StatusBar,
    SplashScreen,
    {provide: ErrorHandler, useClass: IonicErrorHandler},
    SecureStorage,
    BarcodeScanner,
    FingerprintAIO,
    PinDialog,
    HeaderColor,
    Keyboard,
    AccountDataProvider,
    TransactionsProvider,
    SharedProvider,
    CurrenciesProvider,
    CoinExchangeProvider,
    AliasesProvider,
    AssetsProvider
  ]
})
export class AppModule {}
