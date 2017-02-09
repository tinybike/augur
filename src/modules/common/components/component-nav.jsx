import React from 'react';
import classNames from 'classnames';

import Link from 'modules/link/components/link';

const ComponentNav = p => (
  <ul
    className={classNames('component-nav', { 'full-width-nav': p.fullWidth })}
  >
    {Object.keys(p.navItems || {}).map(nav => (
      <Link
        key={nav}
        className={classNames({ selected: p.selectedNav === nav, 'mobile-only': p.navItems[nav].isMobile })}
        onClick={() => { p.updateSelectedNav(nav); }}
      >
        <li className={classNames({ selected: p.selectedNav === nav })} >
          {p.navItems[nav].label}
        </li>
      </Link>
    ))}
  </ul>
);

export default ComponentNav;
