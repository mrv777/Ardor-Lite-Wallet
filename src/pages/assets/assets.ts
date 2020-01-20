import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams, AlertController, ToastController, ModalController } from 'ionic-angular';
import { StockChart } from 'angular-highcharts';
import { TranslateService } from '@ngx-translate/core';
import { DecimalPipe } from '@angular/common';

import { AccountDataProvider } from '../../providers/account-data/account-data';
import { AssetsProvider } from '../../providers/assets/assets';
import { SharedProvider } from '../../providers/shared/shared';
import { AssetsModalPage } from '../assets-modal/assets-modal';
import { SendModalPage } from '../send-modal/send-modal';
import { CancelOrderModalPage } from '../cancel-order-modal/cancel-order-modal';


@IonicPage()
@Component({
  selector: 'page-assets',
  templateUrl: 'assets.html',
})
export class AssetsPage {
	assets: string[];
	assetsInfo: object[] = [];
	selectedAsset: object;
	listActive: boolean = true;
	searchAssetID: string;
	message: string;
	accountAssets: boolean = true;
	theme: string;

	accountId: string;
	balance: number;

	chain: string = 'IGNIS';
	chains: string[] = ['IGNIS', 'BITSWIFT'];
	chainDecimals: number = 100000000;
	decimals: number;
	currentPrice: number;

	trades: object[] = [];
	openOrders: object[];
  buyOrders: object[];
  sellOrders: object[];

  buyOrdersPage: number = 1;
  sellOrdersPage: number = 1;
  tradesOrdersPage: number = 1;
	allTrades: boolean = true;

	volumeString: string = 'Volume';
  priceString: string = 'Price';
  closeText: string = 'Close';

	chart: StockChart;
  chartOptions: object;
  data: any[] = [];
  volume: any[] = [];

  loading: boolean = true;

  constructor(
  	public navCtrl: NavController, 
  	public navParams: NavParams,
  	private alertCtrl: AlertController,
  	private toastCtrl: ToastController,
  	private modalCtrl: ModalController,
  	public translate: TranslateService,
  	private dp: DecimalPipe,
  	public accountData: AccountDataProvider,
  	public assetsProvider: AssetsProvider,
  	public shared: SharedProvider
  	) {
  }

  ionViewDidLoad() {
  	this.accountId = this.accountData.getAccountID();
  	this.accountData.getTheme().then((theme) => {
      this.theme = theme;
    });
    this.translate.get('VOLUME').subscribe((res: string) => {
        this.volumeString = res;
    });
    this.translate.get('PRICE').subscribe((res: string) => {
        this.priceString = res;
    });
    this.translate.get('CLOSE').subscribe((res: string) => {
      this.closeText = res;
    });

    const chainObjects = this.shared.getConstants()['chains'];
    this.chains = Object.keys(chainObjects);

  	this.loadAssets();
  }

  loadAssets() {
  	this.assetsInfo = []; //Reset array
  	this.loading = true;
  	if (this.accountAssets) {
  	  this.assetsProvider.getAccountAssets(this.accountId)
  	  .subscribe(
	        assets => {
	          if (assets['errorDescription']) {
	            
	          } else {
	          	let assetList = assets['accountAssets'];
	          	for (let i=0;i < assetList.length; i++) {
	          		assetList[i]['quantity'] = assetList[i]['quantityQNT']/Math.pow(10, assetList[i]['decimals']);
	          		this.assetsInfo.push( assetList[i] );
	          	}
	          	this.loading = false;
	          }
	        }
	    );
  	} else {
  		if (this.shared.getDisclaimer()) {
  			this.presentDisclaimer();
  			this.shared.setDisclaimer();
  		}
	  	this.assetsProvider.getTrustedAssets()
	  	.subscribe(
	        alias => {
	          if (alias['errorDescription']) {
	            
	          } else {
	            const aliasURI = alias['aliasURI'];
	    				this.assets = aliasURI.split("||");
	    				for (let i=0;i < this.assets.length; i++) {
					    	this.assetsProvider.getAsset(this.assets[i], true)
					    	.subscribe(
					          asset => {
					            if (asset['errorDescription']) {
					              
					            } else {
					            	asset['quantity'] = asset['quantityQNT']/Math.pow(10, asset['decimals']);
					              this.assetsInfo.push( asset );
					            }
					            if (i == this.assets.length) {
						          	this.loading = false;
						          }
					          }
					      );
					    }
	          }
	        }
	    );
	  }
  }

  viewMyAssets(myAssets: boolean = true) {
  	this.accountAssets = myAssets;
  	this.loadAssets();
  }

  setAsset(asset: string) {
  	this.searchAssetID = asset;
  	this.searchAsset();  	
  }

  searchAsset() {
  	this.assetsProvider.getAsset(this.searchAssetID, true)
	    	.subscribe(
	          asset => {
	            if (asset['errorDescription']) {
	              this.message = asset['errorDescription'];
	            } else {
	            	this.message = null;
	            	this.decimals = Math.pow(10, asset['decimals']);
	            	asset['quantity'] = asset['quantityQNT']/this.decimals;
	              this.selectedAsset = asset;
	              this.assetsProvider.getAccountAssets(this.accountId, asset['asset'])
					  	  .subscribe(
						        accountAsset => {
						        	if (accountAsset['quantityQNT']) {
						        		this.balance = accountAsset['quantityQNT']/this.decimals;
						        	} else {
						        		this.balance = 0;
						        	}
						        }
						    );
						    this.getOrders();
	              this.getTrades();
	              this.listActive = false;
	            }
	          }
	      );
  }

  getOrders() { 
  	// Get Buy and Sell orders
    this.assetsProvider.getAskOrders(this.searchAssetID, this.chain).subscribe(orders => {
    	if (orders && orders['askOrders'] && orders['askOrders'][0]){
    		this.buyOrders = orders['askOrders'];
    		let sum = 0;
    		for (let i=0;i < this.buyOrders.length; i++) {
    			this.buyOrders[i]['sum'] = sum + this.buyOrders[i]['quantityQNT']/this.decimals;
    			sum = this.buyOrders[i]['sum'];
    		}
    	} else {
    		this.buyOrders = [];
    	}
    });
    this.assetsProvider.getBidOrders(this.searchAssetID, this.chain).subscribe(orders => {
    	if (orders && orders['bidOrders'] && orders['bidOrders'][0]){
    		this.sellOrders = orders['bidOrders'];
    		let sum = 0;
    		for (let i=0;i < this.sellOrders.length; i++) {
    			this.sellOrders[i]['sum'] = sum + this.sellOrders[i]['quantityQNT']/this.decimals;
    			sum = this.sellOrders[i]['sum'];
    		}
    	} else {
    		this.sellOrders = [];
    	}
    });

    //Get account's open orders
    this.assetsProvider.getAccountCurrentAskOrders(this.searchAssetID, this.accountId, this.chain).subscribe(orders => {
      if (orders && orders['askOrders'] && orders['askOrders'][0]){
      	for (let i=0;i < orders['askOrders'].length; i++) {
      		orders['askOrders'][i]['type'] = "Sell";
      	}
        this.openOrders = orders['askOrders'];
      } else {
        this.openOrders = [];
      }

      this.assetsProvider.getAccountCurrentBidOrders(this.searchAssetID, this.accountId, this.chain).subscribe(orders => {
        if (orders && orders['bidOrders'] && orders['bidOrders'][0]){
        	for (let i=0;i < orders['bidOrders'].length; i++) {
	      		orders['bidOrders'][i]['type'] = "Buy";
	      	}
          this.openOrders.push(...orders['bidOrders']);
        }
      });
    });
  }

  getTrades() {
  	//Reset trades array
  	this.trades = [];
  	let accountTrades = '';
  	let dataTemp = [];
	  let dataVolume = [];

  	if (!this.allTrades) {
  		accountTrades = this.accountId;
  	} else {
	  	// Reset arrays for chart
	    this.data = [];
	    this.volume = [];
  	}
  	this.assetsProvider.getMultipleTrades(this.searchAssetID, this.chain, accountTrades)
  		.subscribe(
	     	trades => {
	     		if (trades['errorDescription']) {
            this.message = trades[0]['errorDescription'];
          } else {
		      	for (let i=0;i < trades.length; i++) {
		      		this.trades.push(...trades[i]['trades']);
		       	}
          	this.message = null;

          	for (let i=0;i < this.trades.length; i++) {
		          this.trades[i]['date'] = new Date((new Date("2018-01-01T00:00:00Z").getTime()/1000 + this.trades[i]['timestamp'])*1000);
		          this.trades[i]['price'] = parseFloat((this.trades[i]['priceNQTPerShare']/this.chainDecimals).toFixed(8));
		          dataTemp.push([this.trades[i]['date'].getTime(), this.trades[i]['price'], this.trades[i]['price'], this.trades[i]['price'], this.trades[i]['price']]);

		          this.trades[i]['quantity'] = this.trades[i]['quantityQNT']/this.decimals;
		          dataVolume.push([this.trades[i]['date'].getTime(), parseFloat(this.trades[i]['quantity'].toFixed(8))]);

		          if (this.allTrades && i == 0) {
		          	this.currentPrice = this.trades[i]['price'];
		          }
		        }

		        if (this.allTrades) {
			        this.data = dataTemp.reverse();
	    				this.volume = dataVolume.reverse();
	    				this.createChart();
	    			}
				
   				}
	      }
	  	);
  }

  presentDisclaimer() {
    let alert = this.alertCtrl.create({
    	title: "Disclaimer",
      message: "These assets have been verified by the Ardor Lite team to be what they say they are but we make no guarantees.<br /><br /><b>Invest at your own risk</b>",
      buttons: ['Ok']
    });
    alert.present();
  }

  showInfo() {
    let toast = this.toastCtrl.create({
      message: 'Description: ' + this.selectedAsset['description'] + '\n\nSupply: ' + this.dp.transform(this.selectedAsset['quantity'], '1.0-8') + '\n\nCreator: ' + this.selectedAsset['accountRS'],
      showCloseButton: true,
      closeButtonText: this.closeText,
      dismissOnPageChange: true,
      position: 'top'
    });

    toast.onDidDismiss(() => {
      console.log('Dismissed toast');
    });

    toast.present();
  }

  showTransfer(asset: object) {
    let myModal = this.modalCtrl.create(SendModalPage, { asset: asset, chain: this.chain, assetDecimals: this.decimals });
    myModal.present();
  }

  showExchange(rate:number, max:number, type:string) {
    let myModal = this.modalCtrl.create(AssetsModalPage, { asset: this.selectedAsset, chain: this.chain, assetDecimals: this.decimals, chainDecimals: this.chainDecimals, rate: rate, max: max, type: type });
    myModal.present();
  }

  cancelOrder(order: number, chain: number, type: string) {
    let myModal = this.modalCtrl.create(CancelOrderModalPage, { order: order, chain: chain, type: type });
    myModal.present();
  }

  createChart() {

  	let groupingUnits = [
                  [
                    'day', 
                			[1]
                	], [
										'week',
										  [1]
									], [
										'month',
										  [1, 2, 3, 4, 6]
									]];

		let bgColor = '#ffffff';
		let forColor = '#333333';
		if (this.theme == 'darkTheme') {
			bgColor = '#333333';
			forColor = '#aaaaaa';
		}

	  	this.chart = new StockChart(<any>{
		// chart: {
		// 		type: 'candlestick'
		// 	},
			chart: {
				backgroundColor: bgColor,
				color: forColor
			},
			plotOptions: {
				candlestick: {
					color: '#f43d3d',
					upColor: '#26a335',
	        lineColor: '#f43d3d',
	        upLineColor: '#26a335'
				},
				column: {
					color: 'rgba(17, 98, 161, 0.50)'
				}
			},
			rangeSelector: {
				enabled: false,
	            inputEnabled: false,
	            selected: 3,
	            buttons: [{
	                type: 'week',
	                count: 1,
	                text: '1w'
	            }, {
	                type: 'month',
	                count: 1,
	                text: '1m'
	            }, {
	                type: 'year',
	                count: 1,
	                text: '1y'
	            }, {
	                type: 'all',
	                text: 'All'
	            }]
	        },
			title: {
				text: ''
			},
			navigator: {
				enabled: true,
		        maskFill: 'rgba(22, 97, 162, 0.2)'
		    },
	    xAxis: {
	      labels: {
	        style: {
	          color: forColor
	        } 
	      }
	    },
	    scrollbar: {
	      enabled: false
	    },
	    tooltip: {
	      shared: true
	    },
			yAxis: [{
	            labels: {
	                align: 'right',
	                x: -3,
	                style: {
	                  color: forColor
	                }
	            },
	            tickColor: forColor,
	            lineWidth: 1,
	            opposite: true,
	            resize: {
	                enabled: true
	            }
	        }, {
	            labels: {
	                align: 'right',
	                x: -3,
	                style: {
	                  color: forColor
	                },
	                enabled: false
	            },
	            tickColor: forColor,
	            offset: 0,
	            lineWidth: 1
	        }],
			series: [
	    {
	      type: 'column',
	      name: this.volumeString,
	      data: this.volume,
	      yAxis: 1,
	      showInNavigator: false,
	      dataGrouping: {
	        forced: true,
	        groupAll: false,
	        units: groupingUnits,
	        groupPixelWidth: 60
	      }
	    }, {
				type: 'candlestick',
				name: `${this.selectedAsset['name']} / ${this.chain.toUpperCase()}`,
				data: this.data,
	      showInNavigator: true,
				dataGrouping: {
					forced: true,
					groupAll: false,
					units: groupingUnits,
					groupPixelWidth: 60
				}
			}
			],
			credits: {
	        	enabled: false
	        }
		}); //End of Chart

  }

}
