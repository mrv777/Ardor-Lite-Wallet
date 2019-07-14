import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/Rx';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/catch';

import { AccountDataProvider } from '../account-data/account-data';

@Injectable()
export class AliasesProvider {

  constructor(public http: HttpClient, public accountData: AccountDataProvider) {

  }

  getAliases(accountID: string): Observable<object> {
    return this.http.get(`${this.accountData.getNodeFromMemory()}nxt?requestType=getAliases&chain=ignis&account=${accountID}`)
  }

}
