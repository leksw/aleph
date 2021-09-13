import React from 'react';
import { Link } from 'react-router-dom';
import { defineMessages, FormattedMessage, injectIntl } from 'react-intl';
import queryString from 'query-string';
import { Alignment, Button, Navbar as Bp3Navbar } from '@blueprintjs/core';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { withRouter } from 'react-router';
import c from 'classnames';

import AuthButtons from 'components/AuthButtons/AuthButtons';
import { selectMetadata, selectSession, selectPages, selectEntitiesResult } from 'selectors';
import { HotkeysContainer, SearchTwoBox } from 'components/common';
import getPageLink from 'util/getPageLink';
import { entitiesQuery } from 'queries';

import './Navbar.scss';

const messages = defineMessages({
  hotkey_focus: {
    id: 'hotkeys.search_focus',
    defaultMessage: 'Search',
  },
  placeholder: {
    id: 'search.placeholder',
    defaultMessage: 'Search companies, people and documents',
  },
  placeholderName: {
    id: 'search.placeholder',
    defaultMessage: 'Search by Name',
  },
  placeholderNumber: {
    id: 'search.placeholder',
    defaultMessage: 'Search by Code',
  },
});

export class Navbar extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      mobileSearchOpen: false,
    };

    this.onToggleMobileSearch = this.onToggleMobileSearch.bind(this);
    this.onSearchSubmit = this.onSearchSubmit.bind(this);
    this.navbarRef = React.createRef();
    this.inputNameRef = React.createRef();
    this.inputCodeRef = React.createRef();
    this.inputRef = React.createRef();
  }

  onToggleMobileSearch(event) {
    event.preventDefault();
    this.setState(({ mobileSearchOpen }) => ({ mobileSearchOpen: !mobileSearchOpen }));
  }

  onSearchSubmit(queryName, queryCode) {
    const { history, query } = this.props;
    let search = queryString.stringify({ name: queryName, code: queryCode });
    if (query) {
      const newQuery = query.set('name', queryName).set('code', queryCode);
      search = newQuery.toLocation();
    }

    history.push({
      pathname: '/search',
      search
    });
  }

  render() {
    const { metadata, pages, session, query, isHomepage, intl } = this.props;
    const { mobileSearchOpen } = this.state;

    const menuPages = pages.filter((page) => page.menu);

    return (
      <>
        <div className="Navbar" ref={this.navbarRef}>
          <Bp3Navbar id="Navbar" className={c('bp3-dark', { 'mobile-force-open': mobileSearchOpen })} >
            <Bp3Navbar.Group align={Alignment.LEFT} className={c('Navbar__left-group', { hide: mobileSearchOpen })}>
              <Link to="/" className="Navbar__home-link">
                {!!metadata.app.logo && <img src={metadata.app.logo} alt={metadata.app.title} />}
                {!!metadata.app.title && <span className="Navbar__home-link__text">{metadata.app.title}</span>}
              </Link>
            </Bp3Navbar.Group>
            <Bp3Navbar.Group align={Alignment.CENTER} className={c('Navbar__middle-group', { 'mobile-force-open': mobileSearchOpen })}>
              {!isHomepage && (
                <div className="Navbar__search-container">
                  <div className="Navbar__search-container__content">
                    <div className="Navbar__search-container__searchbar">
                      <SearchTwoBox
                        mobileSearchOpen={mobileSearchOpen}
                        onSearch={this.onSearchSubmit}
                        query={query}
                        inputProps={{
                          inputCodeRef: this.inputCodeRef,
                          inputNameRef: this.inputNameRef,
                        }}
                        placeholderNumber={intl.formatMessage(messages.placeholderNumber)}
                        placeholderName={intl.formatMessage(messages.placeholderName)}
                        className={c({ 'mobile-force-close': !mobileSearchOpen })}
                      />
                    </div>
                  </div>
                </div>
              )}
            </Bp3Navbar.Group>
            <Bp3Navbar.Group align={Alignment.RIGHT} className="Navbar__right-group" id="navbarSupportedContent">
              {!isHomepage && (
                <>
                  <div className="Navbar__mobile-search-toggle">
                    {!mobileSearchOpen && (
                      <Button icon="search" className="bp3-minimal" onClick={this.onToggleMobileSearch} />
                    )}
                    {mobileSearchOpen && (
                      <Button icon="cross" className="bp3-minimal" onClick={this.onToggleMobileSearch} />
                    )}
                  </div>
                  {!mobileSearchOpen && <Bp3Navbar.Divider className="Navbar__mobile-search-divider" />}
                </>
              )}
              {!mobileSearchOpen && (
                <>
                  <Link to="/datasets">
                    <Button icon="database" className="Navbar_collections-button bp3-minimal">
                      <FormattedMessage id="nav.collections" defaultMessage="Datasets" />
                    </Button>
                  </Link>
                  {session.loggedIn && (
                    <Link to="/investigations">
                      <Button icon="briefcase" className="Navbar__collections-button mobile-hide bp3-minimal">
                        <FormattedMessage id="nav.cases" defaultMessage="Investigations" />
                      </Button>
                    </Link>
                  )}
                  {menuPages.map(page => (
                    <Link to={getPageLink(page)} key={page.name}>
                      <Button icon={page.icon} className="Navbar__collections-button mobile-hide bp3-minimal">
                        {page.short}
                      </Button>
                    </Link>
                  ))}
                </>
              )}
              <Bp3Navbar.Divider className={c({ 'mobile-hidden': mobileSearchOpen })} />
              <div className={c({ 'mobile-hidden': mobileSearchOpen })}>
                <AuthButtons className={c({ hide: mobileSearchOpen })} />
              </div>
            </Bp3Navbar.Group>
          </Bp3Navbar>
        </div>
        <HotkeysContainer
          hotkeys={[
            {
              combo: "/",
              global: true,
              preventDefault: true,
              label: intl.formatMessage(messages.hotkey_focus),
              onKeyDown: () => this.inputRef?.current?.focus(),
            }
          ]}
        />
      </>
    );
  }
}
const mapStateToProps = (state, ownProps) => {
  const { location } = ownProps;
  const query = entitiesQuery(location);
  return ({
    query,
    result: selectEntitiesResult(state, query),
    isHomepage: location.pathname === '/',
    metadata: selectMetadata(state),
    session: selectSession(state),
    pages: selectPages(state),
  });
};

export default compose(
  withRouter,
  connect(mapStateToProps),
  injectIntl,
)(Navbar);
