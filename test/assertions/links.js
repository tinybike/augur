import { describe, it } from 'mocha';
import { assert } from 'chai';
import assertLink from '../../test/assertions/common/link';


export default function (links) {
  describe('links state', () => {
    assert.isDefined(links, `links isn't defined`);
    assert.isObject(links, `links isn't an object`);

    it('authLink', () => {
      assertLink(links.authLink, 'authLink');
    });

    it('marketsLink', () => {
      assertLink(links.marketsLink, 'marketsLink');
    });

    it('transactionsLink', () => {
      assertLink(links.transactionsLink, 'transactionsLink');
    });

    it('marketLink', () => {
      assertLink(links.marketLink, 'marketLink');
    });

    it('previousLink', () => {
      assertLink(links.previousLink, 'previousLink');
    });

    it('createMarketLink', () => {
      assertLink(links.createMarketLink, 'createMarketLink');
    });

    it('loginMessageLink', () => {
      assertLink(links.loginMessageLink, 'loginMessageLink');
    });

    it('topicsLink', () => {
      assertLink(links.topicsLink, 'topicsLink');
    });
  });
}
