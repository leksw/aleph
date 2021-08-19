import React, { Component } from 'react';
import { injectIntl } from 'react-intl';
import c from 'classnames';
import { compose } from 'redux';
import { withRouter } from 'react-router';

import EntitySearchBlockResultsRow from './EntitySearchBlockResultsRow';
import { ErrorSection } from 'components/common';

import './EntitySearchBlockResults.scss';


class EntitySearchBlockResults extends Component {
  render() {
    const { result, location } = this.props;
    const { hideCollection = false, showPreview = true } = this.props;

    if (result.isError) {
      return <ErrorSection error={result.error} />;
    }

    if (!result.isPending && result.total === 0 && result.page === 1) {
      return null;
    }

    const skeletonItems = [...Array(15).keys()];

    const entityWithoutTable = result.results.filter(
      entity => entity.schema.label !== "Table",
    );

    return (
      <div className="EntitySearchBlockResults">
        <ul className={c({ updating: result.isPending })}>
          {entityWithoutTable.map(entity => (
            <EntitySearchBlockResultsRow
              key={entity.id}
              entity={entity}
              location={location}
              hideCollection={hideCollection}
              showPreview={showPreview}
            />
          ))}
          {result.isPending && skeletonItems.map(item => (
            <EntitySearchBlockResultsRow
              key={item}
              hideCollection={hideCollection}
              isPending
            />
          ))}
        </ul>
      </div>
    );
  }
}

export default compose(
  withRouter,
  injectIntl,
)(EntitySearchBlockResults);
