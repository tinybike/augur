import React, { Component, PropTypes } from 'react';
import classNames from 'classnames';
import BigNumber from 'bignumber.js';
import Highcharts from 'highcharts';
import noData from 'highcharts/modules/no-data-to-display';

import ComponentNav from 'modules/common/components/component-nav';
import Input from 'modules/common/components/input';
import CreateMarketFormInputNotifications from 'modules/create-market/components/create-market-form-input-notifications';

import newMarketCreationOrder from 'modules/create-market/constants/new-market-creation-order';
import { NEW_MARKET_ORDER_BOOK } from 'modules/create-market/constants/new-market-creation-steps';
import { BID, ASK } from 'modules/transactions/constants/types';
import { CATEGORICAL, SCALAR } from 'modules/markets/constants/market-types';

import getValue from 'utils/get-value';

export default class CreateMarketFormOrderBook extends Component {
  static propTypes = {
    type: PropTypes.string.isRequired,
    currentStep: PropTypes.number.isRequired,
    outcomes: PropTypes.array.isRequired,
    orderBook: PropTypes.object.isRequired,
    scalarSmallNum: PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.instanceOf(BigNumber)
    ]).isRequired,
    scalarBigNum: PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.instanceOf(BigNumber)
    ]).isRequired,
    updateValidity: PropTypes.func.isRequired,
    addOrderToNewMarket: PropTypes.func.isRequired,
    removeOrderFromNewMarket: PropTypes.func.isRequired,
    updateNewMarket: PropTypes.func.isRequired
  }

  constructor(props) {
    super(props);

    this.navItems = {
      [BID]: {
        label: 'Bid'
      },
      [ASK]: {
        label: 'Ask'
      }
    };

    this.state = {
      errors: {
        quantity: [],
        price: []
      },
      isOrderValid: false,
      selectedOutcome: props.outcomes[0],
      selectedNav: Object.keys(this.navItems)[0],
      orderPrice: '',
      orderQuantity: '',
      orderBookSorted: {}, // Used in Order Book Table
      orderBookSeries: {}, // Used in Order Book Chart
      minPrice: 0,
      maxPrice: 1
    };

    this.handleAutoFocus = this.handleAutoFocus.bind(this);
    this.updateChart = this.updateChart.bind(this);
    this.updatePriceBounds = this.updatePriceBounds.bind(this);
    this.handleAddOrder = this.handleAddOrder.bind(this);
    this.handleRemoveOrder = this.handleRemoveOrder.bind(this);
    this.updateSeries = this.updateSeries.bind(this);
    this.sortOrderBook = this.sortOrderBook.bind(this);
    this.validateForm = this.validateForm.bind(this);
  }

  componentDidMount() {
    noData(Highcharts);

    this.orderBookPreviewChart = new Highcharts.Chart('order_book_preview_chart', {
      chart: {
        width: 0,
        height: 0
      },
      lang: {
        noData: 'No orders to display'
      },
      yAxis: {
        title: {
          text: 'Shares'
        }
      },
      xAxis: {
        title: {
          text: 'Price'
        }
      },
      series: [
        {
          type: 'line',
          name: 'Bids',
          step: 'left',
          data: []
        },
        {
          type: 'line',
          name: 'Asks',
          step: 'left',
          data: []
        }
      ],
      credits: {
        enabled: false
      }
    });
  }

  componentWillReceiveProps(nextProps) {
    if (this.props.currentStep !== nextProps.currentStep &&
      newMarketCreationOrder[nextProps.currentStep] === NEW_MARKET_ORDER_BOOK
    ) {
      nextProps.updateValidity(true);
    }

    if (this.props.outcomes !== nextProps.outcomes) this.setState({ selectedOutcome: nextProps.outcomes[0] });
    if (this.props.orderBook !== nextProps.orderBook) this.sortOrderBook(nextProps.orderBook);
  }

  componentWillUpdate(nextProps, nextState) {
    if (this.state.orderBookSorted !== nextState.orderBookSorted) this.updateSeries(nextState.orderBookSorted);

    if (this.props.type !== nextProps.type ||
      this.props.scalarSmallNum !== nextProps.scalarSmallNum ||
      this.props.scalarBigNum !== nextProps.scalarBigNum ||
      this.state.selectedSide !== nextState.selectedSide ||
      this.state.selectedNav !== nextState.selectedNav ||
      this.state.orderBookSorted !== nextState.orderBookSorted
    ) {
      this.updatePriceBounds(nextProps.type, nextState.selectedOutcome, nextState.selectedNav, nextState.orderBookSorted, nextProps.scalarSmallNum, nextProps.scalarBigNum);
    }
  }

  componentDidUpdate(prevProps, prevState) {
    if ((newMarketCreationOrder[this.props.currentStep] === NEW_MARKET_ORDER_BOOK && prevProps.currentStep !== this.props.currentStep) ||
      prevState.orderBookSeries !== this.state.orderBookSeries
    ) {
      this.updateChart();
    }

    if (prevProps.currentStep !== this.props.currentStep &&
      this.props.currentStep === newMarketCreationOrder.indexOf(NEW_MARKET_ORDER_BOOK)
    ) {
      this.handleAutoFocus();
    }
  }

  updateChart() {
    const bidSeries = getValue(this.state.orderBookSeries[this.state.selectedOutcome], `${BID}`) || [];
    const askSeries = getValue(this.state.orderBookSeries[this.state.selectedOutcome], `${ASK}`) || [];
    let width;

    if (window.getComputedStyle(this.orderBookChart).getPropertyValue('will-change') === 'contents') {
      width = this.orderBookForm.clientWidth - 40; // 20px horizontal padding
    } else {
      width = this.orderBookForm.clientWidth * 0.60;
    }

    this.orderBookPreviewChart.update({
      title: {
        text: `${this.state.selectedOutcome}: Depth Chart`
      },
      chart: {
        width,
        height: 400
      }
    }, false);

    this.orderBookPreviewChart.series[0].setData(bidSeries, false);
    this.orderBookPreviewChart.series[1].setData(askSeries, false);

    this.orderBookPreviewChart.redraw();
  }

  updatePriceBounds(type, selectedOutcome, selectedSide, orderBook, scalarSmallNum, scalarBigNum) {
    const oppositeSide = selectedSide === BID ? ASK : BID;
    const ZERO = new BigNumber(0);
    const ONE = new BigNumber(1);
    const precision = new BigNumber(10**-8);
    let minPrice;
    let maxPrice;

    if (selectedOutcome != null) {
      if (type === SCALAR) {
        if (selectedSide === BID) {
          // Minimum Price
          minPrice = scalarSmallNum;

          // Maximum Price
          if (orderBook[selectedOutcome] && orderBook[selectedOutcome][oppositeSide] && orderBook[selectedOutcome][oppositeSide].length) {
            maxPrice = orderBook[selectedOutcome][oppositeSide][0].price.minus(precision);
          } else {
            maxPrice = scalarBigNum;
          }
        } else {
          // Minimum Price
          if (orderBook[selectedOutcome] && orderBook[selectedOutcome][oppositeSide] && orderBook[selectedOutcome][oppositeSide].length) {
            minPrice = orderBook[selectedOutcome][oppositeSide][0].price.plus(precision);
          } else {
            minPrice = scalarSmallNum;
          }

          // Maximum Price
          maxPrice = scalarBigNum;
        }
      } else if (selectedSide === BID) {
        // Minimum Price
        minPrice = ZERO;

        // Maximum Price
        if (orderBook[selectedOutcome] && orderBook[selectedOutcome][oppositeSide] && orderBook[selectedOutcome][oppositeSide].length) {
          maxPrice = orderBook[selectedOutcome][oppositeSide][0].price.minus(precision);
        } else {
          maxPrice = ONE;
        }
      } else {
        // Minimum Price
        if (orderBook[selectedOutcome] && orderBook[selectedOutcome][oppositeSide] && orderBook[selectedOutcome][oppositeSide].length) {
          minPrice = orderBook[selectedOutcome][oppositeSide][0].price.plus(precision);
        } else {
          minPrice = ZERO;
        }

        // Maximum Price
        maxPrice = ONE;
      }
    }

    this.setState({ minPrice, maxPrice });
  }

  handleAddOrder() {
    // Clear Inputs
    this.setState({ orderPrice: '', orderQuantity: '' }, () => {
      this.validateForm();
      this.handleAutoFocus();
    });

    this.props.addOrderToNewMarket({
      outcome: this.state.selectedOutcome,
      type: this.state.selectedNav,
      price: this.state.orderPrice,
      quantity: this.state.orderQuantity
    });
  }

  handleAutoFocus() {
    this.defaultFormToFocus.getElementsByTagName('input')[0].focus();
  }

  handleRemoveOrder(type, orderToRemove, i) {
    const orderToRemoveIndex = this.props.orderBook[this.state.selectedOutcome].findIndex(order => orderToRemove.price === order.price && orderToRemove.quantity === order.quantity);
    this.props.removeOrderFromNewMarket({ outcome: this.state.selectedOutcome, index: orderToRemoveIndex });
  }

  sortOrderBook(orderBook) {
    const orderBookSorted = Object.keys(orderBook).reduce((p, outcome) => {
      if (p[outcome] == null) p[outcome] = {};

      // Filter Orders By Type
      orderBook[outcome].forEach((order) => {
        if (p[outcome][order.type] == null) p[outcome][order.type] = [];
        p[outcome][order.type].push({ price: order.price, quantity: order.quantity });
      });

      // Sort Order By Price
      Object.keys(p[outcome]).forEach((type) => {
        if (type === BID) p[outcome][type] = p[outcome][type].sort((a, b) => b.price - a.price);
        if (type === ASK) p[outcome][type] = p[outcome][type].sort((a, b) => a.price - b.price);
      });

      return p;
    }, {});

    this.setState({ orderBookSorted });
  }

  updateSeries(orderBook) {
    const orderBookSeries = Object.keys(orderBook).reduce((p, outcome) => {
      if (p[outcome] == null) p[outcome] = {};

      Object.keys(orderBook[outcome]).forEach((type) => {
        if (p[outcome][type] == null) p[outcome][type] = [];

        // let totalQuantity = orderBook[outcome][type].reduce((p, order) => p.plus(order.quantity), new BigNumber(0));

        let totalQuantity = new BigNumber(0);

        orderBook[outcome][type].forEach((order) => {
          p[outcome][type].push([order.price.toNumber(), totalQuantity.toNumber()]);
          // totalQuantity = totalQuantity.minus(order.quantity);
          totalQuantity = totalQuantity.plus(order.quantity);
        });
      });

      return p;
    }, {});

    this.setState({ orderBookSeries });
  }

  validateForm(orderQuantityRaw, orderPriceRaw) {
    const sanitizeValue = (value, type) => {
      if (value == null) {
        if (type === 'quantity') {
          return this.state.orderQuantity;
        }
        return this.state.orderPrice;
      } else if (!(value instanceof BigNumber) && value !== '') {
        return new BigNumber(value);
      }

      return value;
    };

    const orderQuantity = sanitizeValue(orderQuantityRaw, 'quantity');
    const orderPrice = sanitizeValue(orderPriceRaw);

    const errors = {
      quantity: [],
      price: []
    };
    let isOrderValid;

    // Validate Quantity
    if (orderQuantity !== '' && orderQuantity.lessThan(new BigNumber(0))) {
      errors.quantity.push('Quantity must be positive');
    } else if (orderPrice !== '') {
      const bids = getValue(this.state.orderBookSorted[this.state.selectedOutcome], `${BID}`);
      const asks = getValue(this.state.orderBookSorted[this.state.selectedOutcome], `${ASK}`);

      if (this.props.type !== SCALAR) {
        if (this.state.selectedNav === BID && asks && asks.length && orderPrice.greaterThan(asks[0].price)) {
          errors.price.push(`Price must be less than best ask price of: ${asks[0].price.toNumber()}`);
        } else if (this.state.selectedNav === ASK && bids && bids.length && orderPrice.lessThan(bids[0].price)) {
          errors.price.push(`Price must be greater than best bid price of: ${bids[0].price.toNumber()}`);
        } else if (orderPrice.greaterThan(this.state.maxPrice)) {
          errors.price.push('Price cannot exceed 1');
        } else if (orderPrice.lessThan(this.state.minPrice)) {
          errors.price.push('Price cannot be below 0');
        }
      } if (this.state.selectedNav === BID && asks && asks.length && orderPrice.greaterThan(asks[0].price)) {
        errors.price.push(`Price must be less than best ask price of: ${asks[0].price.toNumber()}`);
      } else if (this.state.selectedNav === ASK && bids && bids.length && orderPrice.lessThan(bids[0].price)) {
        errors.price.push(`Price must be greater than best bid price of: ${bids[0].price.toNumber()}`);
      } else if (orderPrice.greaterThan(this.state.maxPrice)) {
        errors.price.push(`Price cannot exceed ${this.state.maxPrice.toNumber()}`);
      } else if (orderPrice.lessThan(this.state.minPrice)) {
        errors.price.push(`Price cannot be below ${this.state.minPrice.toNumber()}`);
      }
    }

    if (orderQuantity === '' || orderPrice === '' || errors.quantity.length || errors.price.length) {
      isOrderValid = false;
    } else {
      isOrderValid = true;
    }

    this.setState({
      errors,
      isOrderValid,
      orderQuantity,
      orderPrice
    });
  }

  render() {
    const p = this.props;
    const s = this.state;

    const errors = [...s.errors.quantity, ...s.errors.price]; // Joined since only one input can be in an error state at a time
    const bids = getValue(s.orderBookSorted[s.selectedOutcome], `${BID}`);
    const asks = getValue(s.orderBookSorted[s.selectedOutcome], `${ASK}`);

    return (
      <article
        ref={(orderBookForm) => { this.orderBookForm = orderBookForm; }}
        className={`create-market-form-part create-market-form-order-book ${p.className || ''}`}
      >
        <div className="create-market-form-part-content">
          <div className="create-market-form-part-input" >
            <aside>
              <h3>Initial Liquidity</h3>
              <h4>optional</h4>
              <span>Use this form to add initial liquidty for your market.</span>
            </aside>
            <div className="vertical-form-divider" />
            <form onSubmit={e => e.preventDefault()} >
              <div className="order-book-actions">
                {p.type === CATEGORICAL &&
                  <div className="order-book-outcomes-table">
                    <div className="order-book-outcomes-header">
                      <span>Outcomes</span>
                    </div>
                    <div className="order-book-outcomes">
                      {p.outcomes.map(outcome => (
                        <div
                          key={outcome}
                          className={`order-book-outcome-row ${s.selectedOutcome === outcome ? 'selected' : ''}`}
                        >
                          <button
                            className="unstyled"
                            onClick={() => {
                              this.setState({ selectedOutcome: outcome });
                            }}
                          >
                            <span>{outcome}</span>
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                }
                <div className="order-book-entry-container">
                  <div className="order-book-entry">
                    <ComponentNav
                      fullWidth
                      navItems={this.navItems}
                      selectedNav={s.selectedNav}
                      updateSelectedNav={selectedNav => this.setState({ selectedNav })}
                    />
                    <form
                      ref={(defaultFormToFocus) => { this.defaultFormToFocus = defaultFormToFocus; }}
                      className="order-book-entry-inputs"
                      onSubmit={e => e.preventDefault()}
                    >
                      <Input
                        className={classNames({ 'input-error': s.errors.quantity.length })}
                        type="number"
                        placeholder="Quantity"
                        value={s.orderQuantity}
                        isIncrementable
                        incrementAmount={0.1}
                        min={0}
                        updateValue={quantity => this.validateForm(quantity, undefined)}
                        onChange={quantity => this.validateForm(quantity, undefined)}
                      />
                      <span>@</span>
                      <Input
                        className={classNames({ 'input-error': s.errors.price.length })}
                        type="number"
                        placeholder="Price"
                        value={s.orderPrice}
                        isIncrementable
                        incrementAmount={0.1}
                        min={s.minPrice}
                        max={s.maxPrice}
                        updateValue={price => this.validateForm(undefined, price)}
                        onChange={price => this.validateForm(undefined, price)}
                      />
                    </form>
                    <CreateMarketFormInputNotifications
                      errors={errors}
                    />
                    <button
                      className={classNames({ disabled: !s.isOrderValid })}
                      onClick={s.isOrderValid && this.handleAddOrder}
                    >
                      Add Order
                    </button>
                  </div>
                </div>
              </div>
              <div className="order-book-preview" >
                <div
                  ref={(orderBookChart) => { this.orderBookChart = orderBookChart; }}
                  id="order_book_preview_chart"
                />
                <div className="order-book-preview-table">
                  <div className="order-book-preview-table-header">
                    <span>Bid Q.</span>
                    <span>Bid</span>
                    <span>Ask</span>
                    <span>Ask Q.</span>
                  </div>
                  <div className="order-book-preview-table-content">
                    <ul className="order-book-preview-table-bids">
                      {bids ?
                        bids.map((bid, i) => <li>
                          <button
                            className="unstyled remove-order"
                            onClick={() => this.handleRemoveOrder(BID, bid, i)}
                          >
                            <i className="fa fa-trash" />
                          </button>
                          <span>
                            {`${bid.quantity}`}
                          </span>
                          <span>
                            {`${bid.price}`}
                          </span>
                        </li>
                      ) :
                        <span>No Bids</span>
                      }
                    </ul>
                    <ul className="order-book-preview-table-asks">
                      {asks ?
                        asks.map((ask, i) =>
                          <li>
                            <span>
                              {`${ask.price}`}
                            </span>
                            <span>
                              {`${ask.quantity}`}
                            </span>
                            <button
                              className="unstyled remove-order"
                              onClick={() => this.handleRemoveOrder(ASK, ask, i)}
                            >
                              <i className="fa fa-trash" />
                            </button>
                          </li>
                        ) :
                        <span>No Asks</span>
                      }
                    </ul>
                  </div>
                </div>
              </div>
            </form>
          </div>
        </div>
      </article>
    );
  }
}
