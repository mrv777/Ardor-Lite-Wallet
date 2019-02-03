import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/Rx';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/catch';

import { AccountDataProvider } from '../account-data/account-data';

@Injectable()
export class AliasesProvider {
  API_URL = "https://ardor.jelurida.com";

  constructor(public http: HttpClient, public accountData: AccountDataProvider) {
    this.accountData.getNode().then((node) => {
      this.API_URL = node;
    });
  }

  getAliases(accountID: string): Observable<object> {
    return this.http.get(`${this.accountData.getNodeFromMemory()}nxt?requestType=getAliases&chain=ignis&account=${accountID}`)
  }

}
