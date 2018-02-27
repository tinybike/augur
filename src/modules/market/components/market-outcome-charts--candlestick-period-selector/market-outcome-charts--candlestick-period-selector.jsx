import React, { Component } from 'react'
import PropTypes from 'prop-types'
import classNames from 'classnames'

import { ChevronUp, ChevronDown } from 'modules/common/components/icons'

import { isEqual, isEmpty } from 'lodash'

import { RANGES, PERIODS } from 'modules/market/constants/permissible-periods'

import Styles from 'modules/market/components/market-outcome-charts--candlestick-period-selector/market-outcome-charts--candlestick-period-selector.styles'

// TODO --
// Select/Update period selection

export default class PeriodSelector extends Component {
  static propTypes = {
    priceTimeSeries: PropTypes.array.isRequired,
    updateSelectedPeriod: PropTypes.func.isRequired
  }

  constructor(props) {
    super(props)

    this.state = {
      selectedRange: -1,
      selectedPeriod: -1,
      permissibleRanges: [],
      permissiblePeriods: [],
      isModalActive: false
    }

    this.updatePermissibleValues = this.updatePermissibleValues.bind(this)
    this.validateAndUpdateSelection = this.validateAndUpdateSelection.bind(this)
  }

  componentWillMount() {
    this.updatePermissibleValues(this.props.priceTimeSeries, this.state.selectedRange, this.state.selectedPeriod)
  }

  componentWillUpdate(nextProps, nextState) {
    if (
      !isEqual(this.props.priceTimeSeries, nextProps.priceTimeSeries) ||
      this.state.selectedRange !== nextState.selectedRange ||
      this.state.selectedPeriod !== nextState.selectedPeriod
    ) {
      this.updatePermissibleValues(nextProps.priceTimeSeries, nextState.selectedRange, nextState.selectedPeriod)
    }
  }

  updatePermissibleValues(priceTimeSeries, selectedRange, selectedPeriod) {
    console.log('updatePermissibleValues -- ', selectedRange, selectedPeriod)
    // NOTE --  fundamental assumption is that the RANGES and PERIODS arrays have
    //          the same number of values that also directly correspond to each other

    // const seriesRange = !isEmpty(priceTimeSeries) ?
    //   priceTimeSeries[priceTimeSeries.length - 1][0] - priceTimeSeries[0][0] :
    //   null

    const seriesRange = 31557600001

    let permissibleRanges = []
    let permissiblePeriods = []

    if (seriesRange !== null) {
      // Going to do this in two steps (easier to reason about)

      // Permissible ranges based on series
      permissibleRanges = RANGES.reduce((p, currentRange, i) => {
        const updatedPermissibleRange = p

        // Lower Bound + initial upper
        if (i === 0) {
          updatedPermissibleRange[0] = currentRange.range
          updatedPermissibleRange[1] = currentRange.range

          return updatedPermissibleRange
        }

        // Upper Bound
        if (currentRange.range === null) { // null is a special case that denotes 'Full range'
          if (seriesRange > RANGES[i - 1].range) updatedPermissibleRange[1] = currentRange.range
        } else if (currentRange.range <= seriesRange) {
          updatedPermissibleRange[1] = currentRange.range
        }

        return updatedPermissibleRange
      }, [])

      // Permissible ranges based on selection
      if (selectedPeriod !== null && selectedPeriod !== -1) { // null denotes 'Every block'
        RANGES.find((range, i) => {
          if (selectedPeriod === range.range) {
            permissibleRanges[0] = RANGES[i + 1].range
            return true
          }

          return false
        })
      }

      // Permissible periods based on series
      permissiblePeriods = PERIODS.reduce((p, currentPeriod, i) => {
        const updatedPermissiblePeriod = p

        // Lower Bound + initial upper
        if (i === 0) {
          updatedPermissiblePeriod[0] = currentPeriod.period
          updatedPermissiblePeriod[1] = currentPeriod.period

          return updatedPermissiblePeriod
        }

        // Upper Bound
        if (
          currentPeriod.period !== null &&
          currentPeriod.period <= seriesRange
        ) {
          updatedPermissiblePeriod[1] = currentPeriod.period
        }

        return updatedPermissiblePeriod
      }, [])

      // Permissible periods based on selection
      if (selectedRange !== null && selectedRange !== -1) { // null denotes 'Full range'
        PERIODS.find((period, i) => {
          if (selectedRange === period.period) {
            permissiblePeriods[1] = PERIODS[i - 1].period
            return true
          }

          return false
        })
      }
    }

    console.log(permissibleRanges, permissiblePeriods)

    this.setState({
      permissibleRanges,
      permissiblePeriods
    }, () => this.validateAndUpdateSelection(permissibleRanges, permissiblePeriods, selectedRange, selectedPeriod))
  }

  validateAndUpdateSelection(permissibleRanges, permissiblePeriods, selectedRange, selectedPeriod) {
    // No valid options to select
    if (isEmpty(permissibleRanges) || isEmpty(permissiblePeriods)) {
      return this.setState({
        selectedRange: -1,
        selectedPeriod: -1
      })
    }

    // Update Range Selection
    if (
      selectedRange === -1 ||
      (
        selectedPeriod !== -1 &&
        selectedPeriod !== null &&
        selectedRange <= selectedPeriod
      )
    ) {
      this.setState({
        selectedRange: permissibleRanges[1],
      })
    } else {
      this.setState({ selectedRange })
    }

    // Update Period Selection
    if (
      selectedPeriod === -1 ||
      (
        selectedRange !== -1 &&
        selectedRange !== null &&
        selectedPeriod >= selectedRange
      )

    ) {
      this.setState({
        selectedPeriod: permissiblePeriods[1]
      })
    } else {
      this.setState({
        selectedPeriod
      })
    }
  }

  render() {
    const s = this.state

    return (
      <section className={Styles.PeriodSelector}>
        <button
          className={Styles.PeriodSelector__button}
          onClick={() => this.setState({ isModalActive: !s.isModalActive })}
        >
          <span>Period|Range</span>
          {s.isModalActive ?
            <ChevronUp /> :
            <ChevronDown />
          }
        </button>
        <div
          className={classNames(
            Styles.PeriodSelector__modal,
            {
              [Styles['PeriodSelector__modal--active']]: s.isModalActive
            }
          )
          }
        >
          <div className={Styles.PeriodSelector__column}>
            <h1>Period</h1>
            <ul>
              {PERIODS.map(period => (
                <li className={Styles.PeriodSelector__value}>
                  <button
                    className={
                      classNames({
                        [Styles['PeriodSelector__value--active']]: period.period === s.selectedPeriod
                      })
                    }
                    disabled={
                      period.period !== s.selectedPeriod &&
                      (period.period < s.permissiblePeriods[0] || period.period > s.permissiblePeriods[1])
                    }
                    onClick={() => {
                      this.setState({
                        selectedPeriod: period.period === s.selectedPeriod ? -1 : period.period
                      })
                    }}
                  >
                    {period.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>
          <div className={Styles.PeriodSelector__column}>
            <h1>Range</h1>
            <ul>
              {RANGES.map(range => (
                <li className={Styles.PeriodSelector__value}>
                  <button
                    className={
                      classNames({
                        [Styles['PeriodSelector__value--active']]: range.range === s.selectedRange
                      })
                    }
                    disabled={isRangeDisabled(range.range, s.permissibleRanges)}
                    onClick={() => {
                      this.setState({
                        selectedRange: range.range === s.selectedRange ? -1 : range.range
                      })
                    }}
                  >
                    {range.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>
    )
  }
}

function isRangeDisabled(range, permissibleRanges) {
  console.log('isRangeDisabled -- ', range)

  // between range

  // if (range === null) {
  //   if (permissibleRanges[])
  //   return true
  // } else if (range ){
  //
  // }
}