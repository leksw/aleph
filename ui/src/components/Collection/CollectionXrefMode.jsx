import React from 'react';
import { defineMessages, injectIntl } from 'react-intl';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { withRouter } from 'react-router';
import { Button, Intent } from '@blueprintjs/core';
import queryString from 'query-string';

import SearchActionBar from 'components/common/SearchActionBar';
import SearchFacets from 'components/Facet/SearchFacets';
import { QueryInfiniteLoad } from 'components/common';
import CollectionXrefManageMenu from 'components/Collection/CollectionXrefManageMenu';
import XrefTable from 'components/XrefTable/XrefTable';
import SortingBar from 'components/SortingBar/SortingBar';
import SortingBarSelect from 'components/SortingBar/SortingBarSelect';
import { collectionXrefFacetsQuery } from 'queries';
import { selectCollection, selectCollectionXrefResult, selectTester } from 'selectors';
import { queryCollectionXref, queryRoles } from 'actions';

import './CollectionXrefMode.scss';

const messages = defineMessages({
  random: {
    id: 'xref.sort.random',
    defaultMessage: 'Random',
  },
  default: {
    id: 'xref.sort.default',
    defaultMessage: 'Default',
  },
  doubt: {
    id: 'xref.sort.doubt',
    defaultMessage: 'Doubt',
  },
  sort_label: {
    id: "xref.sort.label",
    defaultMessage: "Sort by:"
  }
});

export class CollectionXrefMode extends React.Component {
  constructor(props) {
    super(props);
    this.updateQuery = this.updateQuery.bind(this);
    this.onSort = this.onSort.bind(this);
  }

  updateQuery(newQuery) {
    const { history, location } = this.props;
    const parsedHash = queryString.parse(location.hash);
    parsedHash.selectedId = undefined;

    history.push({
      pathname: location.pathname,
      search: newQuery.toLocation(),
      hash: queryString.stringify(parsedHash),
    });
  }

  onSort(nextSort) {
    const { query } = this.props;
    const { field } = nextSort;

    if (field === 'default') {
      this.updateQuery(query.clear('sort'));
    } else {
      this.updateQuery(query.sortBy(field, 'desc'));
    }
  }

  render() {
    const { activeSortField, collection, isRandomSort, intl, isTester, query, result } = this.props;

    const sortOptions = ['default', 'random', 'doubt'].map(field => ({ field, label: intl.formatMessage(messages[field]) }));

    return (
      <section className="CollectionXrefMode">
        <div className="pane-layout">
          <div className="pane-layout-side">
            <SearchFacets
              facets={['match_collection_id', 'schema', 'countries']}
              query={query}
              result={result}
              updateQuery={this.updateQuery}
            />
          </div>
          <div className="pane-layout-main">
            <div className="CollectionXrefMode__actions">
              <CollectionXrefManageMenu
                collection={collection}
                result={result}
                query={query}
              />
              <SearchActionBar result={result}>
                {isTester && (
                  <SortingBar
                    filterButtonLabel={intl.formatMessage(messages.sort_label)}
                    filterButton={
                      <SortingBarSelect
                        items={sortOptions}
                        onSelect={this.onSort}
                        activeItem={sortOptions.find(({ field }) => field === activeSortField)}
                      />
                    }
                  />
                )}
              </SearchActionBar>
            </div>
            <XrefTable result={result} />
            <QueryInfiniteLoad
              query={query}
              result={result}
              fetch={this.props.queryCollectionXref}
            />
          </div>
        </div>
      </section>
    );
  }
}

const mapStateToProps = (state, ownProps) => {
  const { collectionId, location } = ownProps;
  const query = collectionXrefFacetsQuery(location, collectionId);
  return {
    collection: selectCollection(state, collectionId),
    query,
    isTester: selectTester(state),
    activeSortField: query.getSort()?.field || 'default',
    result: selectCollectionXrefResult(state, query),
  };
};

export default compose(
  withRouter,
  connect(mapStateToProps, { queryCollectionXref, queryRoles }),
  injectIntl,
)(CollectionXrefMode);
