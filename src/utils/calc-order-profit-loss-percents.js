import BigNumber from 'bignumber.js';
import { BUY } from 'modules/trade/constants/types';

/**
 *
 * @param numShares number of shares the user wants to buy or sell
 * @param limitPrice maximum price for purchases or minimum price for sales the user wants to purchase or sell at
 * @param side BUY or SELL; whether or not the user wishes to buy or sell shares
 * @param minValue only relevant for scalar markets; all other markets min is created and set to 0
 * @param maxValue only relevant for scalar markets; all other markets max is created and set to 1
 * @returns object with the following properties
 *    potentialEthLoss:       number, maximum number of ether that can be lost according to the current numShares and limit price
 *    potentialEthProfit:     number, maximum number of ether that can be made according to the current numShares and limit price
 *    potentialProfitPercent: number, the maximum percentage profit that can be earned with current numShares and limit price,
 *                                    excluding first 100% (so a 2x is a 100% return and not a 200% return). For BUYs, loss is always 100% (exc. fees)
 *    potentialLossPercent:   number, the max percentage loss that can be lost with current numShares and limit price; for SELLs loss is always 100%
 */

export default function (numShares, limitPrice, side, minValue, maxValue, type) {

  if (limitPrice > 1 && type !== 'scalar') return {};
  //  If minValue is less than zero, set minValue and maxValue to both be greater than zero (but same range) to prevent division by zero when determining percents below
  const max = type !== 'scalar' ? 1 : Math.abs(maxValue - minValue);
  // const min = type !== 'scalar' ? 1 : 0;
  const limit = type !== 'scalar' ? limitPrice : Math.abs(limitPrice - minValue);

  console.log(`max      : ${max}`);
  console.log(`side     : ${side}`);
  console.log(`type     : ${type}`);
  console.log(`limit    : ${limit}`);
  console.log(`numShares: ${numShares}`);
  const potentialEthProfit = side === BUY ? new BigNumber(max).minus(limit).times(numShares).toString() : new BigNumber(limit).times(numShares).toString();
  const potentialEthLoss = side === BUY ? new BigNumber(limit).times(numShares) : new BigNumber(numShares).times(max - limit).toString();
  const potentialProfitPercent = side === BUY ? new BigNumber(max).div(limit).times(100).minus(100).toString() : new BigNumber(limit).div(max - limit).times(100).toString();
  const potentialLossPercent = side === BUY ? new BigNumber(100).toString() : new BigNumber(max - limit).div(limit).times(100).toString();

  console.log(`potentialEthProfit     : ${potentialEthProfit}`);
  console.log(`potentialEthLoss       : ${potentialEthLoss}`);
  console.log(`potentialProfitPercent : ${potentialProfitPercent}`);
  console.log(`potentialLossPercent   : ${potentialLossPercent}`);

  return {
    potentialEthProfit,
    potentialEthLoss,
    potentialProfitPercent,
    potentialLossPercent
  };

}
