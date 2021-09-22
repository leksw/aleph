import { createReducer } from 'redux-act';

import { queryEntities } from 'actions';
import { sameEntityObjects } from 'reducers/util';

const initialState = {};


export default createReducer({
  [queryEntities.COMPLETE]: (state, { result }) => sameEntityObjects(state, result),
}, initialState);
