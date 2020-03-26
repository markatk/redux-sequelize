# Redux Sequelize

[![npm](https://img.shields.io/npm/v/redux-sequelize)](https://www.npmjs.com/package/redux-sequelize)
[![Build Status](https://travis-ci.org/markatk/redux-sequelize.svg?branch=master)](https://travis-ci.org/markatk/redux-sequelize)
[![Coverage Status](https://coveralls.io/repos/github/markatk/redux-sequelize/badge.svg?branch=master)](https://coveralls.io/github/markatk/redux-sequelize?branch=master)
[![GitHub](https://img.shields.io/github/license/markatk/redux-sequelize)](https://github.com/markatk/redux-sequelize/blob/master/LICENSE)

## Description

Redux middleware, reducer and actions to work with sequelize databases.

## Usage

### Models

For each sequelize model create an entity type:

```ts
import { Entity, RelatedEntities, mapRelatedEntities } from 'redux-sequelize';
import { Model } from 'sequelize';

import { Project } from './project';

export interface Project extends Entity {
    name: string;
    workId: number

    projects: RelatedEntities<Project>;
}

export function toAnimal(data: Model): Animal {
    return {
        id: data.get('id') as number,
        name: data.get('name') as string,
        workId: data.get('workId') as number,
        projects: mapRelatedEntities<Project>('projects', data.get('projects') as Project[], 'workers')
    };
}
```

### Actions

For each model create store actions:

```ts
import { createActions } from 'redux-sequelize';

import { Worker, toWorker } from '../types/worker';

import database from '../database';

export const include = [
    { key: 'projects', table: 'projects' }
];

const {
    createEntity: createWorker,
    deleteEntity: deleteWorker,
    getEntities: getWorkers,
    getEntity: getWorker,
    setEntity: setWorker
} = createActions<Worker>(() => database.sequelize, 'workers', toWorker, include);

export {
    createWorker,
    deleteWorker,
    getWorkers,
    getWorker,
    setWorker
};
```

### Middleware

Add the redux-sequelize middleware to the redux-store:

```ts
import { createStore, applyMiddleware } from 'redux';
import thunk from 'redux-thunk';
import { middleware as sequelizeMiddleware } from 'redux-sequelize';

import reducers from './reducers';

const logger = createLogger();

export default createStore(reducers, undefined, applyMiddleware(thunk, sequelizeMiddleware));
```

### Reducers

Create reducers for each database model:

```ts
import { combineReducers } from 'redux';
import { reducer as sequelizeReducer } from 'redux-sequelize';

import { Worker } from '../types/worker';
import { Project } from '../types/project';

const rootReducer = combineReducers({
    workers: sequelizeReducer<Worker>('workers'),
    projects: sequelizeReducer<Project>('projects')
});

export default rootReducer;
export type AppState = ReturnType<typeof rootReducer>;
```

### Use entities in components

```ts
const mapStateToProps = (state: AppState) => ({
    workers: state.workers.data,
    updating: state.workers.updating > 0
});

const mapDispatchToProps = (dispatch: Dispatch) => bindActionCreators({
    getWorkers,
    getWorker,
    deleteWorker,
    setWorker,
    createWorker
}, dispatch);
```

## License

MIT License

Copyright (c) 2020 MarkAtk

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
