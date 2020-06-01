import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams, ToastController, ModalController } from 'ionic-angular';
import { StockChart } from 'angular-highcharts';
import { TranslateService } from '@ngx-translate/core';

import * as Big from 'big.js';

import { AccountDataProvider } from '../../providers/account-data/account-data';
import { SharedProvider } from '../../providers/shared/shared';
import { CoinExchangeProvider } from '../../providers/coin-exchange/coin-exchange';
import { CoinExchangeModalPage } from '../coin-exchange-modal/coin-exchange-modal';
import { CancelOrderModalPage } from '../cancel-order-modal/cancel-order-modal';


@IonicPage()
@Component({
  selector: 'page-coin-exchange',
  templateUrl: 'coin-exchange.html',
})
export class CoinExchangePage {
  chains: string[] = [];
  chainNumbers: number[] = [];
  chain: number;
  chainName: string;
  exchangeChain: number = 1;
  exchangeChainName: string = 'ARDR';
  exchanges: object[];
  bestExchange: number[];
  decimals: Big = 100000000;
  exchangeDecimals: Big = 100000000;
  data: any[] = [];
  volume: any[] = [];
  accountId: string;

  volumeString: string = 'Volume';
  priceString: string = 'Price';
  infoCE: string = 'The Chain Gateway is an Ardor feature where you can swap tokens between the various chains on the blockchain.';
  closeText: string = 'Close';

  buyOrdersPage: number = 1;
  sellOrdersPage: number = 1;
  tradesOrdersPage: number = 1;
  allTrades: boolean = true;

  chart: StockChart;
  chartOptions: object;
  theme: string;
  loaded: boolean = false;
  error: string;
  updating: boolean = false;

  trades: object[];
  openOrders: object[];
  buyOrders: object[];
  sellOrders: object[];

  constructor(public navCtrl: NavController, public navParams: NavParams, public accountData: AccountDataProvider, public sharedProvider: SharedProvider, public coinExchangeProvider: CoinExchangeProvider, private toastCtrl: ToastController, public modalCtrl: ModalController, public translate: TranslateService) {
  }

  ionViewWillEnter() {
    this.loaded = false;
    this.accountId = this.accountData.getAccountID();
	  this.chain = this.sharedProvider.getChainOnce();
	  this.chainName = this.sharedProvider.getConstants()['chainProperties'][this.chain]['name'];
	  const chainObjects = this.sharedProvider.getConstants()['chains'];
	  this.chains = Object.keys(chainObjects);
		  for (const key of this.chains) {
		    this.chainNumbers.push(chainObjects[key]);
		  }

    this.translate.get('VOLUME').subscribe((res: string) => {
        this.volumeString = res;
    });
    this.translate.get('PRICE').subscribe((res: string) => {
        this.priceString = res;
    });
    this.translate.get('INFO_CE').subscribe((res: string) => {
      this.infoCE = res;
    });
    this.translate.get('CLOSE').subscribe((res: string) => {
      this.closeText = res;
    });

	  this.accountData.getTheme().then((theme) => {
        this.theme = theme;
      });
	  this.updateChains();
  }

  doRefresh(refresher) {
    this.loaded = false;
    this.changeChain();
    refresher.complete();
  }

  showInfo() {
    let toast = this.toastCtrl.create({
      message: this.infoCE,
      showCloseButton: true,
      closeButtonText: this.closeText,
      dismissOnPageChange: true,
      position: 'bottom'
    });

    toast.onDidDismiss(() => {
      console.log('Dismissed toast');
    });

    toast.present();
  }

  changeNode() {
    this.error = null;
    this.accountData.setNode(this.accountData.getCurrentNetwork());
    this.changeChain();
  }

  swapChains() {
    this.updating = true;
    let temp = this.chainName;
    this.chainName = this.exchangeChainName;
    this.exchangeChainName = temp;
    this.updating = false;
  }

  toggleTrades() {
    //this.allTrades = !this.allTrades;

    if (this.allTrades) {
      this.coinExchangeProvider.getMultipleExchangeTrades(this.chain, this.exchangeChainName).subscribe(trades => {
        this.trades = [];
        for (let i=0;i < trades.length; i++) {
          this.trades.push(...trades[i]['trades']);
         }

         for (let i=0;i < this.trades.length; i++) {
          this.trades[i]['date'] = new Date((new Date("2018-01-01T00:00:00Z").getTime()/1000 + this.trades[i]['timestamp'])*1000);
          this.trades[i]['price'] = parseFloat((1/this.trades[i]['exchangeRate']).toFixed(8));
          this.trades[i]['quantity'] = (this.trades[i]['quantityQNT']*this.trades[i]['exchangeRate'])/this.exchangeDecimals;
        }

        this.trades.sort(function(b,a) {return (a['date'] > b['date']) ? 1 : ((b['date'] > a['date']) ? -1 : 0);} ); 
      },
        (err) => {
          this.error = "Node not online";
      }
      );
    } else {
      this.coinExchangeProvider.getAccountCoinExchangeTrades(this.chain, this.exchangeChainName, 0, this.accountId).subscribe(trades => {
        this.trades = trades['trades'];

        for (let i=0;i < this.trades.length; i++) {
          this.trades[i]['date'] = new Date((new Date("2018-01-01T00:00:00Z").getTime()/1000 + this.trades[i]['timestamp'])*1000);
          this.trades[i]['price'] = parseFloat((1/this.trades[i]['exchangeRate']).toFixed(8));
          this.trades[i]['quantity'] = (this.trades[i]['quantityQNT']*this.trades[i]['exchangeRate'])/this.exchangeDecimals;
        }

        this.trades.sort(function(b,a) {return (a['date'] > b['date']) ? 1 : ((b['date'] > a['date']) ? -1 : 0);} ); 
      },
        (err) => {
          this.error = "Node not online";
      }
      );
    }
  }

  updateChains() {
      if (!this.updating) {
    	  this.chain = this.chainNumbers[this.chains.indexOf(this.chainName)];
    	  this.exchangeChain = this.chainNumbers[this.chains.indexOf(this.exchangeChainName)];
    	  if (this.exchangeChain == this.chain && this.exchangeChain<this.chains.length) {
    	  	this.exchangeChain++;
    	  	this.exchangeChainName = this.sharedProvider.getConstants()['chainProperties'][this.exchangeChain]['name'];
    	  } else if (this.exchangeChain == this.chain && this.exchangeChain==this.chains.length) {
    	  	this.exchangeChain = 1;
    	  	this.exchangeChainName = this.sharedProvider.getConstants()['chainProperties'][this.exchangeChain]['name'];
    	  } else {
    	  	this.changeChain();
    	  }
      }
  }

  changeChain() {
      this.allTrades = true;
      this.decimals = Math.pow(10, this.sharedProvider.getConstants()['chainProperties'][this.chain]['decimals']);
      this.exchangeDecimals = Math.pow(10, this.sharedProvider.getConstants()['chainProperties'][this.exchangeChain]['decimals']);

      // Get Buy and Sell orders
      this.coinExchangeProvider.getCoinExchangeOrders(this.chain, this.exchangeChainName, null).subscribe(orders => {
      	if (orders && orders['orders'] && orders['orders'][0]){
      		this.buyOrders = orders['orders'];
      		let sum = 0;
      		for (let i=0;i < this.buyOrders.length; i++) {
      			this.buyOrders[i]['sum'] = sum + this.buyOrders[i]['exchangeQNT']/this.decimals;
      			sum = this.buyOrders[i]['sum'];
      		}
      	} else {
      		this.buyOrders = [];
      	}
      });
      this.coinExchangeProvider.getCoinExchangeOrders(this.exchangeChain, this.chainName, null).subscribe(orders => {
      	if (orders && orders['orders'] && orders['orders'][0]){
      		this.sellOrders = orders['orders'];
      		let sum = 0;
      		for (let i=0;i < this.sellOrders.length; i++) {
      			this.sellOrders[i]['sum'] = sum + this.sellOrders[i]['quantityQNT']/this.decimals;
      			sum = this.sellOrders[i]['sum'];
      		}
      	} else {
      		this.sellOrders = [];
      	}
      });

      // Get account's open orders
      this.coinExchangeProvider.getCoinExchangeOrders(this.chain, this.exchangeChainName, this.accountId).subscribe(orders => {
        if (orders && orders['orders'] && orders['orders'][0]){
          this.openOrders = orders['orders'];
        } else {
          this.openOrders = [];
        }

        this.coinExchangeProvider.getCoinExchangeOrders(this.exchangeChain, this.chainName, this.accountId).subscribe(orders => {
          if (orders && orders['orders'] && orders['orders'][0]){
            this.openOrders.push(...orders['orders']);
          }
        });
      });
      
      // Reset chart arrays
      this.data = [];
      this.volume = [];
      let dataTemp = [];
      let dataVolume = [];

      this.coinExchangeProvider.getMultipleExchangeTrades(this.chain, this.exchangeChainName).subscribe(trades => {
      	this.trades = [];
      	for (let i=0;i < trades.length; i++) {
      		this.trades.push(...trades[i]['trades']);
       	}

        for (let i=this.trades.length-1;i >= 0; i--) {
          if (i < this.trades.length-1) {
            if (this.trades[i]['exchangeRate'] < this.trades[i+1]['exchangeRate']) {
              this.trades[i]['tradeType'] = "buy";
            } else if (this.trades[i]['exchangeRate'] == this.trades[i+1]['exchangeRate']) {
              this.trades[i]['tradeType'] = this.trades[i+1]['tradeType'];
            } else {
              this.trades[i]['tradeType'] = "sell";
            }
          } else {
            this.trades[this.trades.length-1]['tradeType'] = "";
          }

          this.trades[i]['date'] = new Date((new Date("2018-01-01T00:00:00Z").getTime()/1000 + this.trades[i]['timestamp'])*1000);
          this.trades[i]['price'] = parseFloat((1/this.trades[i]['exchangeRate']).toFixed(8));
          

          // let txChain = this.chain;
          // if (this.exchangeChain == 1) { // If the exchange chain is Ardor, then we need to use that
          //   txChain = this.exchangeChain;
          // }
          // this.transactions.getTransaction(txChain, this.trades[i]['orderFullHash']).subscribe(
          //   tradeTx => {
          //     if (tradeTx['chain'] == this.trades[this.tradeTxNum]['chain']) {
          //       this.trades[this.tradeTxNum]['tradeType'] = "buy";
          //     } else {
          //       this.trades[this.tradeTxNum]['tradeType'] = "sell";
          //     }
          //     this.tradeTxNum++;
          //   },
          //   (err) => {
          //     this.error = "Could not get trade type";
          //     this.tradeTxNum++;
          // });
          
          
          this.data.push([this.trades[i]['date'].getTime(), this.trades[i]['price'], this.trades[i]['price'], this.trades[i]['price'], this.trades[i]['price']]);
          
          this.trades[i]['quantity'] = (this.trades[i]['quantityQNT']*this.trades[i]['exchangeRate'])/this.exchangeDecimals;
          this.volume.push([this.trades[i]['date'].getTime(), parseFloat(this.trades[i]['quantity'].toFixed(8))]);
        }

    		//this.data = dataTemp.reverse();
    		//this.volume = dataVolume.reverse();

    		//this.trades.sort(function(b,a) {return (a['date'] > b['date']) ? 1 : ((b['date'] > a['date']) ? -1 : 0);} ); 

    		this.createChart();
        this.loaded = true;
      },
        (err) => {
          this.error = "Node not online";
      });
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
		//tooltip: { enabled: false },
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
	    // xAxis: {
	    //     range: 30 * 24 * 3600 * 1000 // 1 month days
	    // },
	    //xAxis: {
	    //     minRange: 24 * 3600 * 1000 // one day
	    // },
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
            //opposite: false,
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
      // dataGrouping: {
      //   groupPixelWidth: 5
      // }
      dataGrouping: {
        forced: true,
        groupAll: false,
        units: groupingUnits,
        groupPixelWidth: 60
      }
    }, {
			type: 'candlestick',
			name: `${this.chainName} / ${this.exchangeChainName.toUpperCase()}`,
			data: this.data,
			// dataGrouping: {
			// 	groupPixelWidth: 5
			// }
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

  roundDate(timeStamp){
    var d = new Date(timeStamp);
    return (new Date(d.getFullYear(),d.getMonth(),d.getDate(),0,0,0,0)).getTime();
  }

  showExchange(rate:number, max:number, type:string) {
    let myModal = this.modalCtrl.create(CoinExchangeModalPage, { exchangeChain: this.exchangeChainName, chain: this.chainName, rate: rate, max: max, type: type });
    myModal.present();
  } 

  cancelOrder(order: number, chain: number) {
    let myModal = this.modalCtrl.create(CancelOrderModalPage, { order: order, chain: chain });
    myModal.present();
  }

  ionViewWillLeave() {
  	this.data = null;
  	this.volume = null;
  	this.chart = null;
  }

}