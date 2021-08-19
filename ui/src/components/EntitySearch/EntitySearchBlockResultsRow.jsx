import _ from 'lodash';
import React, { Component } from 'react';
import queryString from 'query-string';
import c from 'classnames';

import ensureArray from 'util/ensureArray';
import {
  Collection, Entity, Skeleton,  Property, Mention,
} from 'components/common';
/* eslint-disable */


class EntitySearchBlockResultsRow extends Component {
  renderSkeleton() {
    const { hideCollection } = this.props;
    
    return (
      <li className={c('EntitySearchBlcokResultsRow', 'nowrap', 'skeleton')} key="skeleton">
        {!hideCollection && (
          <div className="collection">
            <Skeleton.Text type="span" length={15} />
          </div>
        )}
        <div className="entity">
          <Skeleton.Text type="span" length={15} />
        </div>
      </li>
    );
  }

  render() {
    const {
      entity,
      isPending,
      location,
      hideCollection,
      showPreview,
    } = this.props;
    
    if (isPending) {
      return this.renderSkeleton();
    }
    const parsedHash = queryString.parse(location.hash);
    const isActive = parsedHash['preview:id'] && parsedHash['preview:id'] === entity.id;
    const resultClass = c('EntitySearchBlockResultsRow', 'nowrap', { active: isActive });
    const featured = entity.schema.getFeaturedProperties();
    const existing = entity.getProperties().filter(prop => !prop.hidden);
    const sorted = _.sortBy(existing, p => p.label).filter(p => featured.indexOf(p) === -1);
    const properties = [...featured, ...sorted].filter(p => ensureArray(entity.getProperty(p)).length);

    return (
      <li key={entity.id} className="data-block">
        <div className={resultClass}>
          <div key="entity" className="entity">
            {!hideCollection
              && (
                <div key="collection" className="collection">
                  <Collection.Link preview collection={entity.collection} icon />
                </div>
              )
            }
            <Entity.Link
              preview={showPreview}
              entity={entity}
              icon
            />
          </div>
          <div className="ItemOverview__content__section">
            <ul className="EntityProperties info-sheet">
              { properties.map(prop => (
                <li key={prop.name}>
                  <span className="key">
                    <Property.Name prop={prop} />
                  </span>
                  <span className="value">
                    <Mention.List prop={prop} values={entity.getProperty(prop)} translitLookup={entity.latinized} />
                  </span>
                </li>
              ))}
            </ul>
        </div>
        </div>
      </li>
    );
  }
}

export default EntitySearchBlockResultsRow;
