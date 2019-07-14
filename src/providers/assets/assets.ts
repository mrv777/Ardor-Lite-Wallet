import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/Rx';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/catch';

import { AccountDataProvider } from '../account-data/account-data';

@Injectable()
export class AssetsProvider {

  constructor(public http: HttpClient, public accountData: AccountDataProvider) {
  	
  }

  getTrustedAssets(): Observable<object> {
  	return this.http.get(`${this.accountData.getNodeFromMemory()}nxt?requestType=getAlias&chain=ignis&aliasName=ArdorLiteAssets`)
  }

  getAsset(asset: string, count: boolean = false): Observable<object> {
    return this.http.get(`${this.accountData.getNodeFromMemory()}nxt?requestType=getAsset&includeCounts=${count}&asset=${asset}`)
  }

  getAccountAssets(account: string, asset: string = ''): Observable<object> {
    return this.http.get(`${this.accountData.getNodeFromMemory()}nxt?requestType=getAccountAssets&account=${account}&includeAssetInfo=true&asset=${asset}`)
  }

  getTrades(asset: string, chain: string = 'ignis', account: string = ''): Observable<object> {
    return this.http.get(`${this.accountData.getNodeFromMemory()}nxt?requestType=getTrades&chain=${chain}&asset=${asset}&account=${account}`)
  }

  getMultipleTrades(asset: string, chain: string = 'ignis', account: string = ''): Observable<object[]> {
    return Observable.forkJoin(
      this.http.get(`${this.accountData.getNodeFromMemory()}nxt?requestType=getTrades&chain=${chain}&asset=${asset}&firstIndex=0&account=${account}`).timeout(5000),
      this.http.get(`${this.accountData.getNodeFromMemory()}nxt?requestType=getTrades&chain=${chain}&asset=${asset}&firstIndex=100&account=${account}`).timeout(5000),
      this.http.get(`${this.accountData.getNodeFromMemory()}nxt?requestType=getTrades&chain=${chain}&asset=${asset}&firstIndex=200&account=${account}`).timeout(5000)
    );
  }

}
