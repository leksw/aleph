import React, { PureComponent } from 'react';
import { injectIntl } from 'react-intl';
import { InputGroup, ControlGroup, Button, FormGroup } from '@blueprintjs/core';


export class SearchTwoBox extends PureComponent {
  constructor(props) {
    super(props);
    this.state = {};
    this.onQueryNameChange = this.onQueryNameChange.bind(this);
    this.onQueryCodeChange = this.onQueryCodeChange.bind(this);
    this.onSubmitSearch = this.onSubmitSearch.bind(this);
  }

  static getDerivedStateFromProps(nextProps, prevState) {
    const nextQueryName = nextProps.query ? nextProps.query.getString('name') : prevState.queryName;
    const nextQueryCode = nextProps.query ? nextProps.query.getString('code') : prevState.queryCode;
    const queryNameChanged = !prevState?.prevQuery || prevState.prevQuery.getString('name') !== nextQueryName;
    const queryCodeChanged = !prevState?.prevQuery || prevState.prevQuery.getString('code') !== nextQueryCode;

    return {
      prevQuery: nextProps.query,
      queryName: queryNameChanged ? nextQueryName : prevState.queryName,
      queryCode: queryCodeChanged ? nextQueryCode : prevState.queryCode,
    };
  }

  onQueryNameChange(e) {
    const queryName = e.target.value;
    this.setState({ queryName });
  }

  onQueryCodeChange(e) {
    const queryCode = e.target.value;
    if (+queryCode || +queryCode === 0) { 
      this.setState({ queryCode });
    }
  }

  onSubmitSearch(event) {
    const { onSearch } = this.props;
    const { queryName, queryCode } = this.state;
    event.preventDefault();
    if (onSearch) {
      onSearch(queryName, queryCode);
    }
  }

  render() {
    const { placeholderName, placeholderNumber, className, inputProps } = this.props;
    const { inputNameRef, inputCodeRef } = inputProps;
    const { queryName, queryCode } = this.state;

    if (!this.props.onSearch) {
      return null;
    }

    return (
      <form onSubmit={this.onSubmitSearch} className={className}>
        <ControlGroup fill={true} vertical={false}>
          <FormGroup
            label="Name"
            labelFor="name-input"
            inline={true}
          >
            <InputGroup
              fill
              leftIcon="user"
              id="name-input"
              onChange={this.onQueryNameChange}
              placeholder={placeholderName}
              value={queryName}
              inputRef={inputNameRef}
            />
          </FormGroup>
          <FormGroup
            label="Code"
            labelFor="code-input"
            inline={true}
            className="Navbar__search-container second-group"
          >
            <InputGroup
              fill
              id="code-input"
              leftIcon="numerical"
              onChange={this.onQueryCodeChange}
              placeholder={placeholderNumber}
              value={queryCode}
              inputRef={inputCodeRef}
            />
          </FormGroup>
          <FormGroup>
            <Button
              className="Navbar__search-container__search-tips bp3-button"
              type="submit"
              text="Search"
              onClick={this.onSubmitSearch}
            />
          </FormGroup>
        </ControlGroup>

      </form>
    );
  }
}
export default injectIntl(SearchTwoBox);
