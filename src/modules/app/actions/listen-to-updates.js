import BigNumber from 'bignumber.js';
import { augur, abi } from '../../../services/augurjs';
import { updateAssets } from '../../auth/actions/update-assets';
import { syncBlockchain } from '../../app/actions/sync-blockchain';
import { syncBranch } from '../../branch/actions/sync-branch';
import { addOrder, removeOrder, fillOrder } from '../../bids-asks/actions/update-market-order-book';
import { loadMarketsInfo } from '../../markets/actions/load-markets-info';
import { updateOutcomePrice } from '../../markets/actions/update-outcome-price';
import { claimProceeds } from '../../my-positions/actions/claim-proceeds';
import { convertLogsToTransactions, convertTradeLogToTransaction } from '../../transactions/actions/convert-logs-to-transactions';
import { updateMarketTopicPopularity } from '../../topics/actions/update-topics';
import { SELL } from '../../outcomes/constants/trade-types';
import { loadFullMarketWithPosition } from '../../my-positions/actions/load-full-market-with-position';

export function listenToUpdates() {
  return (dispatch, getState) => {
    augur.filters.listen({

      // block arrivals
      block: (blockHash) => {
        dispatch(syncBlockchain());
        dispatch(updateAssets());
        dispatch(syncBranch());
      },

      collectedFees: (msg) => {
        if (msg && msg.sender === getState().loginAccount.address) {
          console.log('collectedFees:', msg);
          dispatch(updateAssets());
          dispatch(convertLogsToTransactions('collectedFees', [msg]));
        }
      },

      payout: (msg) => {
        if (msg && msg.sender === getState().loginAccount.address) {
          console.log('payout:', msg);
          dispatch(updateAssets());
          dispatch(convertLogsToTransactions('payout', [msg]));
        }
      },

      penalizationCaughtUp: (msg) => {
        if (msg && msg.sender === getState().loginAccount.address) {
          console.log('penalizationCaughtUp:', msg);
          dispatch(updateAssets());
          dispatch(convertLogsToTransactions('penalizationCaughtUp', [msg]));
        }
      },

      // Reporter penalization
      penalize: (msg) => {
        if (msg && msg.sender === getState().loginAccount.address) {
          console.log('penalize:', msg);
          dispatch(updateAssets());
          dispatch(convertLogsToTransactions('penalize', [msg]));
        }
      },

      registration: (msg) => {
        if (msg && msg.sender === getState().loginAccount.address) {
          console.log('registration:', msg);
          dispatch(convertLogsToTransactions('registration', [msg]));
        }
      },

      submittedReport: (msg) => {
        if (msg && msg.sender === getState().loginAccount.address) {
          console.log('submittedReport:', msg);
          dispatch(updateAssets());
          dispatch(convertLogsToTransactions('submittedReport', [msg]));
        }
      },

      submittedReportHash: (msg) => {
        if (msg && msg.sender === getState().loginAccount.address) {
          console.log('submittedReportHash:', msg);
          dispatch(updateAssets());
          dispatch(convertLogsToTransactions('submittedReportHash', [msg]));
        }
      },

      slashedRep: (msg) => {
        console.log('slashedRep:', msg);
        const { address } = getState().loginAccount;
        if (msg && (msg.sender === address || msg.reporter === address)) {
          dispatch(updateAssets());
          dispatch(convertLogsToTransactions('slashedRep', [msg]));
        }
      },

      // trade filled: { market, outcome (id), price }
      log_fill_tx: (msg) => {
        console.log('log_fill_tx:', msg);
        if (msg && msg.market && msg.price && msg.outcome !== undefined && msg.outcome !== null) {
          dispatch(updateOutcomePrice(msg.market, msg.outcome, abi.bignum(msg.price)));
          dispatch(updateMarketTopicPopularity(msg.market, msg.amount));
          const { address } = getState().loginAccount;
          if (msg.sender !== address) dispatch(fillOrder(msg));
          if (msg.sender === address || msg.owner === address) {
            dispatch(convertTradeLogToTransaction('log_fill_tx', {
              [msg.market]: { [msg.outcome]: [{
                ...msg,
                maker: msg.owner === address
              }] }
            }, msg.market));
            dispatch(updateAssets());
            dispatch(loadMarketsInfo([msg.market]));
            dispatch(loadFullMarketWithPosition(msg.market));
          }
        }
      },

      // short sell filled
      log_short_fill_tx: (msg) => {
        console.log('log_short_fill_tx:', msg);
        if (msg && msg.market && msg.price && msg.outcome !== undefined && msg.outcome !== null) {
          dispatch(updateOutcomePrice(msg.market, msg.outcome, abi.bignum(msg.price)));
          dispatch(updateMarketTopicPopularity(msg.market, msg.amount));
          if (msg.sender !== address) dispatch(fillOrder({ ...msg, type: SELL }));
          const { address } = getState().loginAccount;

          // if the user is either the maker or taker, add it to the transaction display
          if (msg.sender === address || msg.owner === address) {
            dispatch(convertTradeLogToTransaction('log_fill_tx', {
              [msg.market]: { [msg.outcome]: [{
                ...msg,
                isShortSell: true,
                maker: msg.owner === address
              }] }
            }, msg.market));
            dispatch(updateAssets());
            dispatch(loadMarketsInfo([msg.market]));
            dispatch(loadFullMarketWithPosition(msg.market));
          }
        }
      },

      // order added to orderbook
      log_add_tx: (msg) => {
        console.log('log_add_tx:', msg);
        if (msg && msg.market && msg.outcome !== undefined && msg.outcome !== null) {
          if (msg.isShortAsk) {
            const market = getState().marketsData[msg.market];
            if (market && market.numOutcomes) {
              dispatch(updateMarketTopicPopularity(msg.market, new BigNumber(msg.amount, 10).times(market.numOutcomes)));
            } else {
              dispatch(loadMarketsInfo([msg.market], () => {
                const market = getState().marketsData[msg.market];
                if (market && market.numOutcomes) {
                  dispatch(updateMarketTopicPopularity(msg.market, new BigNumber(msg.amount, 10).times(market.numOutcomes)));
                }
              }));
            }
          }
          dispatch(addOrder(msg));

          // if this is the user's order, then add it to the transaction display
          if (msg.sender === getState().loginAccount.address) {
            dispatch(convertTradeLogToTransaction('log_add_tx', {
              [msg.market]: { [msg.outcome]: [msg] }
            }, msg.market));
            dispatch(updateAssets());
            dispatch(loadFullMarketWithPosition(msg.market));
          }
        }
      },

      // order removed from orderbook
      log_cancel: (msg) => {
        console.log('log_cancel:', msg);
        if (msg && msg.market && msg.outcome !== undefined && msg.outcome !== null) {
          dispatch(removeOrder(msg));

          // if this is the user's order, then add it to the transaction display
          if (msg.sender === getState().loginAccount.address) {
            dispatch(convertTradeLogToTransaction('log_cancel', {
              [msg.market]: { [msg.outcome]: [msg] }
            }, msg.market));
            dispatch(updateAssets());
          }
        }
      },

      completeSets_logReturn: (msg) => {
        if (msg) {
          console.log('completeSets_logReturn:', msg);
          let amount = new BigNumber(msg.amount, 10).times(msg.numOutcomes);
          if (msg.type === SELL) amount = amount.neg();
          dispatch(updateMarketTopicPopularity(msg.market, amount.toFixed()));
        }
      },

      // new market: msg = { marketID }
      marketCreated: (msg) => {
        if (msg && msg.marketID) {
          console.log('marketCreated:', msg);
          dispatch(loadMarketsInfo([msg.marketID]));
          if (msg.sender === getState().loginAccount.address) {
            dispatch(updateAssets());
            dispatch(convertLogsToTransactions('marketCreated', [msg]));
          }
        }
      },

      // market trading fee updated (decrease only)
      tradingFeeUpdated: (msg) => {
        console.log('tradingFeeUpdated:', msg);
        if (msg && msg.marketID) {
          dispatch(loadMarketsInfo([msg.marketID]));
          dispatch(updateAssets());
          dispatch(convertLogsToTransactions('tradingFeeUpdated', [msg]));
        }
      },

      deposit: (msg) => {
        if (msg && msg.sender === getState().loginAccount.address) {
          console.log('deposit:', msg);
          dispatch(updateAssets());
          dispatch(convertLogsToTransactions('deposit', [msg]));
        }
      },

      withdraw: (msg) => {
        if (msg && msg.sender === getState().loginAccount.address) {
          console.log('withdraw:', msg);
          dispatch(updateAssets());
          dispatch(convertLogsToTransactions('withdraw', [msg]));
        }
      },

      // Cash (ether) transfer
      sentCash: (msg) => {
        if (msg) {
          console.log('sentCash:', msg);
          const { address } = getState().loginAccount;
          if (msg._from === address || msg._to === address) {
            dispatch(updateAssets());
            dispatch(convertLogsToTransactions('Transfer', [msg]));
          }
        }
      },

      // Reputation transfer
      Transfer: (msg) => {
        if (msg) {
          console.log('Transfer:', msg);
          const { address } = getState().loginAccount;
          if (msg._from === address || msg._to === address) {
            dispatch(updateAssets());
            dispatch(convertLogsToTransactions('Transfer', [msg]));
          }
        }
      },

      Approval: (msg) => {
        if (msg) {
          console.log('Approval:', msg);
          const { address } = getState().loginAccount;
          if (msg._owner === address || msg._spender === address) {
            dispatch(updateAssets());
            dispatch(convertLogsToTransactions('Approval', [msg]));
          }
        }
      },

      closedMarket: (msg) => {
        if (msg && msg.market) {
          console.log('closedMarket:', msg);
          const { branch, loginAccount } = getState();
          if (branch.id === msg.branch) {
            dispatch(loadMarketsInfo([msg.market], () => {
              const { volume } = getState().marketsData[msg.market];
              dispatch(updateMarketTopicPopularity(msg.market, abi.bignum(volume).neg().toNumber()));
              if (loginAccount.address) dispatch(claimProceeds());
            }));
          }
        }
      }
    }, filters => console.log('Listening to filters:', filters));
  };
}
