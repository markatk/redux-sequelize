/*
 * File: actions.test.ts
 * Author: MarkAtk
 * Date: 12.03.20
 *
 * MIT License
 *
 * Copyright (c) 2020 MarkAtk
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';

import { createActions, Events, createRelatedEntity, createRelatedEntities } from '../lib';
import { updateEntities, updatingEntitiesFailed, setEntity, setEntities, deleteEntity } from '../lib/actions';
import { Worker, toWorker, workerInclude } from './entities';
import createDatabase from './database';

const table = 'workers';
const database = createDatabase();

const {
    createEntity: createWorker,
    deleteEntity: deleteWorker,
    getEntities: getWorkers,
    getEntity: getWorker,
    setEntity: setWorker
} = createActions<Worker>(() => database, table, toWorker, workerInclude);

const worker = {
    id: 1,
    name: 'Thomas',
    workId: 55
};

const boss = {
    id: 2,
    name: 'Steven',
    workId: 3
};

const mockStore = configureMockStore([thunk]);

describe('entity actions', () => {
    beforeAll(() => {
        return database.sync();
    });

    beforeEach(() => {
        return database.truncate();
    });

    afterAll(() => {
        database.close();
    });

    it('create entity actions', () => {
        expect(createWorker).toBeInstanceOf(Function);
        expect(deleteWorker).toBeInstanceOf(Function);
        expect(getWorkers).toBeInstanceOf(Function);
        expect(getWorker).toBeInstanceOf(Function);
        expect(setWorker).toBeInstanceOf(Function);
    });

    it('fail with invalid database', async () => {
        const expectedActions = [
            {
                type: Events.UPDATING_ENTITIES,
                table
            },
            {
                type: Events.UPDATING_ENTITIES_FAILED,
                table,
                action: 'create',
                message: 'databaseCallback is not a function',
                data: worker
            }
        ];

        const store = mockStore();
        const { createEntity } = createActions<Worker>(null, 'workers', toWorker, workerInclude);

        await store.dispatch(createEntity(worker));
        expect(store.getActions()).toEqual(expectedActions);
    });

    it('create entity', async () => {
        const expectedActions = [
            {
                type: Events.UPDATING_ENTITIES,
                table
            },
            {
                type: Events.SET_ENTITY,
                table,
                entity: {
                    ...worker,
                    boss: createRelatedEntity('workers'),
                    department: createRelatedEntity('departments', 'workers'),
                    projects: createRelatedEntities('projects', 'workers')
                }
            }
        ];

        const store = mockStore();

        await store.dispatch(createWorker(worker));
        expect(store.getActions()).toEqual(expectedActions);

        expect(await database.model(table).count()).toBe(1);
    });

    it('create entity on invalid model', async () => {
        const expectedActions = [
            {
                type: Events.UPDATING_ENTITIES,
                table: 'test'
            },
            {
                type: Events.UPDATING_ENTITIES_FAILED,
                table: 'test',
                action: 'create',
                message: 'test has not been defined',
                data: worker
            }
        ];

        const store = mockStore();
        const { createEntity: createTest } = createActions<Worker>(() => database, 'test', toWorker);

        await store.dispatch(createTest(worker));
        expect(store.getActions()).toEqual(expectedActions);

        expect(await database.model(table).count()).toBe(0);
    });

    it('get valid entity', async () => {
        await database.model(table).create(worker);
        expect(await database.model(table).count()).toBe(1);

        const expectedActions = [
            {
                type: Events.UPDATING_ENTITIES,
                table
            },
            {
                type: Events.UPDATING_ENTITIES,
                table: 'workers'
            },
            {
                type: Events.SET_ENTITIES,
                table: 'workers',
                entities: []
            },
            {
                type: Events.SET_ENTITY,
                table,
                entity: {
                    ...worker,
                    boss: createRelatedEntity('workers'),
                    department: createRelatedEntity('departments', 'workers'),
                    projects: createRelatedEntities('projects', 'workers')
                }
            }
        ];

        const store = mockStore();

        await store.dispatch(getWorker(1));
        expect(store.getActions()).toEqual(expectedActions);

        expect(await database.model(table).count()).toBe(1);
    });

    it('get invalid entity', async () => {
        const expectedActions = [
            {
                type: Events.UPDATING_ENTITIES,
                table
            },
            {
                type: Events.UPDATING_ENTITIES_FAILED,
                table,
                action: 'get',
                message: 'Entity not found',
                data: 1
            }
        ];

        const store = mockStore();

        await store.dispatch(getWorker(1));
        expect(store.getActions()).toEqual(expectedActions);
    });

    it('update valid entity', async () => {
        await database.model(table).create(worker);
        expect(await database.model(table).count()).toBe(1);

        const expectedActions = [
            {
                type: Events.UPDATING_ENTITIES,
                table
            },
            {
                type: Events.SET_ENTITY,
                table,
                entity: {
                    ...worker,
                    name: 'Mike',
                    boss: createRelatedEntity('workers'),
                    department: createRelatedEntity('departments', 'workers'),
                    projects: createRelatedEntities('projects', 'workers')
                }
            }
        ];

        const store = mockStore();

        await store.dispatch(setWorker({
            id: worker.id,
            name: 'Mike'
        }));

        expect(store.getActions()).toEqual(expectedActions);

        expect(await database.model(table).count()).toBe(1);
    });

    it('update invalid entity', async () => {
        await database.model(table).create(worker);
        expect(await database.model(table).count()).toBe(1);

        const expectedActions = [
            {
                type: Events.UPDATING_ENTITIES,
                table
            },
            {
                type: Events.UPDATING_ENTITIES_FAILED,
                table,
                action: 'set',
                message: 'Entity not found',
                data: {
                    id: worker.id + 5,
                    name: 'Mike'
                }
            }
        ];

        const store = mockStore();

        await store.dispatch(setWorker({
            id: worker.id + 5,
            name: 'Mike'
        }));

        expect(store.getActions()).toEqual(expectedActions);

        expect(await database.model(table).count()).toBe(1);
    });

    it('get with related entity', async () => {
        const workerEntity = await database.model(table).create(worker);
        const bossEntity = await database.model(table).create(boss);

        const association = database.model(table).associations.boss as any;
        await association.set(workerEntity, 2);

        expect(await database.model(table).count()).toBe(2);

        const expectedActions = [
            {
                type: Events.UPDATING_ENTITIES,
                table
            },
            {
                type: Events.UPDATING_ENTITIES,
                table: 'workers'
            },
            {
                type: Events.SET_ENTITIES,
                table: 'workers',
                entities: [toWorker(bossEntity)]
            },
            {
                type: Events.SET_ENTITY,
                table,
                entity: {
                    ...worker,
                    boss: createRelatedEntity('workers', null, boss.id),
                    department: createRelatedEntity('departments', 'workers'),
                    projects: createRelatedEntities('projects', 'workers')
                }
            }
        ];

        const store = mockStore();

        await store.dispatch(getWorker(workerEntity.get('id') as number));
        expect(store.getActions()).toEqual(expectedActions);

        const result = await database.model(table).findByPk(workerEntity.get('id') as number);
        expect(result.get('bossId')).toBe(bossEntity.get('id') as number);

        expect(await database.model(table).count()).toBe(2);
    });

    it('get with related entities', async () => {
        const projectA = await database.model('projects').create({ name: 'Project A' });
        const projectB = await database.model('projects').create({ name: 'Project B' });
        const workerEntity = await database.model(table).create(worker);

        const association = database.model(table).associations.projects as any;
        await association.set(workerEntity, [projectA.get('id') as number, projectB.get('id') as number]);

        expect(await database.model(table).count()).toBe(1);
        expect(await database.model('projects').count()).toBe(2);

        const expectedActions = [
            {
                type: Events.UPDATING_ENTITIES,
                table
            },
            {
                type: Events.UPDATING_ENTITIES,
                table: 'workers'
            },
            {
                type: Events.SET_ENTITIES,
                table: 'workers',
                entities: []
            },
            {
                type: Events.SET_ENTITY,
                table,
                entity: {
                    ...worker,
                    boss: createRelatedEntity('workers'),
                    department: createRelatedEntity('departments', 'workers'),
                    projects: createRelatedEntities('projects', 'workers', [projectA.get('id') as number, projectB.get('id') as number])
                }
            }
        ];

        const store = mockStore();

        await store.dispatch(getWorker(workerEntity.get('id') as number));
        expect(store.getActions()).toEqual(expectedActions);

        expect(await database.model(table).count()).toBe(1);
    });

    it('get multiple entities', async () => {
        await database.model(table).create(worker);
        await database.model(table).create(boss);
        expect(await database.model(table).count()).toBe(2);

        const expectedActions = [
            {
                type: Events.UPDATING_ENTITIES,
                table
            },
            {
                type: Events.UPDATING_ENTITIES,
                table: 'workers'
            },
            {
                type: Events.SET_ENTITIES,
                table: 'workers',
                entities: []
            },
            {
                type: Events.SET_ENTITIES,
                table,
                entities: [
                    {
                        ...worker,
                        boss: createRelatedEntity('workers'),
                        department: createRelatedEntity('departments', 'workers'),
                        projects: createRelatedEntities('projects', 'workers')
                    },
                    {
                        ...boss,
                        boss: createRelatedEntity('workers'),
                        department: createRelatedEntity('departments', 'workers'),
                        projects: createRelatedEntities('projects', 'workers')
                    }
                ]
            }
        ];

        const store = mockStore();

        await store.dispatch(getWorkers());
        expect(store.getActions()).toEqual(expectedActions);

        expect(await database.model(table).count()).toBe(2);
    });

    it('get multiple entities with related entity', async () => {
        const projectA = await database.model('projects').create({ name: 'Project A' });
        const projectB = await database.model('projects').create({ name: 'Project B' });

        const workerEntity = await database.model(table).create(worker);
        const bossEntity = await database.model(table).create(boss);

        const association = database.model(table).associations.projects as any;
        await association.set(workerEntity, [projectA.get('id') as number]);
        await association.set(bossEntity, [projectB.get('id') as number]);

        expect(await database.model(table).count()).toBe(2);
        expect(await database.model('projects').count()).toBe(2);

        const expectedActions = [
            {
                type: Events.UPDATING_ENTITIES,
                table
            },
            {
                type: Events.UPDATING_ENTITIES,
                table: 'workers'
            },
            {
                type: Events.SET_ENTITIES,
                table: 'workers',
                entities: []
            },
            {
                type: Events.SET_ENTITIES,
                table,
                entities: [
                    {
                        ...worker,
                        boss: createRelatedEntity('workers'),
                        department: createRelatedEntity('departments', 'workers'),
                        projects: createRelatedEntities('projects', 'workers', [projectA.get('id') as number])
                    },
                    {
                        ...boss,
                        boss: createRelatedEntity('workers'),
                        department: createRelatedEntity('departments', 'workers'),
                        projects: createRelatedEntities('projects', 'workers', [projectB.get('id') as number])
                    }
                ]
            }
        ];

        const store = mockStore();

        await store.dispatch(getWorkers());
        expect(store.getActions()).toEqual(expectedActions);

        expect(await database.model(table).count()).toBe(2);
    });

    it('set related entity', async () => {
        await database.model(table).create(worker);
        await database.model(table).create(boss);
        expect(await database.model(table).count()).toBe(2);

        const expectedActions = [
            {
                type: Events.UPDATING_ENTITIES,
                table
            },
            {
                type: Events.SET_ENTITY,
                table,
                entity: {
                    ...worker,
                    boss: createRelatedEntity('workers', null, boss.id),
                    department: createRelatedEntity('departments', 'workers'),
                    projects: createRelatedEntities('projects', 'workers')
                }
            }
        ];

        const store = mockStore();

        await store.dispatch(setWorker({
            ...worker,
            boss: {
                table: 'workers',
                id: boss.id,
                entity: null,
                linkedKey: null
            }
        }));
        expect(store.getActions()).toEqual(expectedActions);

        const result = await database.model(table).findByPk(1);
        expect(result.get('bossId')).toBe(2);

        expect(await database.model(table).count()).toBe(2);
    });

    it('set related entities', async () => {
        const projectA = await database.model('projects').create({ name: 'Project A' });
        const projectB = await database.model('projects').create({ name: 'Project B' });
        await database.model(table).create(worker);

        expect(await database.model(table).count()).toBe(1);
        expect(await database.model('projects').count()).toBe(2);

        const expectedActions = [
            {
                type: Events.UPDATING_ENTITIES,
                table
            },
            {
                type: Events.SET_ENTITY,
                table,
                entity: {
                    ...worker,
                    boss: createRelatedEntity('workers'),
                    department: createRelatedEntity('departments', 'workers'),
                    projects: createRelatedEntities('projects', 'workers', [projectA.get('id') as number, projectB.get('id') as number])
                }
            }
        ];

        const store = mockStore();

        await store.dispatch(setWorker({
            ...worker,
            projects: {
                table: 'projects',
                entities: {
                    [projectA.get('id') as number]: null,
                    [projectB.get('id') as number]: null
                },
                linkedKey: 'workers'
            }
        }));
        expect(store.getActions()).toEqual(expectedActions);

        expect(await database.model(table).count()).toBe(1);
    });

    it('create with related entity', async () => {
        await database.model(table).create(boss);
        expect(await database.model(table).count()).toBe(1);

        const expectedActions = [
            {
                type: Events.UPDATING_ENTITIES,
                table
            },
            {
                type: Events.SET_ENTITY,
                table,
                entity: {
                    ...worker,
                    boss: createRelatedEntity('workers', null, boss.id),
                    department: createRelatedEntity('departments', 'workers'),
                    projects: createRelatedEntities('projects', 'workers')
                }
            }
        ];

        const store = mockStore();

        await store.dispatch(createWorker({
            ...worker,
            boss: {
                table: 'workers',
                id: boss.id,
                entity: null,
                linkedKey: null
            }
        }));
        expect(store.getActions()).toEqual(expectedActions);

        const result = await database.model(table).findByPk(1);
        expect(result.get('bossId')).toBe(2);

        expect(await database.model(table).count()).toBe(2);
    });

    it('create with related entities', async () => {
        const projectA = await database.model('projects').create({ name: 'Project A' });
        const projectB = await database.model('projects').create({ name: 'Project B' });

        expect(await database.model('projects').count()).toBe(2);

        const expectedActions = [
            {
                type: Events.UPDATING_ENTITIES,
                table
            },
            {
                type: Events.SET_ENTITY,
                table,
                entity: {
                    ...worker,
                    boss: createRelatedEntity('workers'),
                    department: createRelatedEntity('departments', 'workers'),
                    projects: createRelatedEntities('projects', 'workers', [projectA.get('id') as number, projectB.get('id') as number])
                }
            }
        ];

        const store = mockStore();

        await store.dispatch(createWorker({
            ...worker,
            projects: createRelatedEntities('projects', 'workers', [projectA.get('id') as number, projectB.get('id') as number])
        }));
        expect(store.getActions()).toEqual(expectedActions);

        expect(await database.model(table).count()).toBe(1);
    });

    it('delete valid entity', async () => {
        await database.model(table).create(worker);
        expect(await database.model(table).count()).toBe(1);

        const expectedActions = [
            {
                type: Events.UPDATING_ENTITIES,
                table
            },
            {
                type: Events.DELETE_ENTITY,
                table,
                id: worker.id
            }
        ];

        const store = mockStore();

        await store.dispatch(deleteWorker(worker.id));
        expect(store.getActions()).toEqual(expectedActions);

        expect(await database.model(table).count()).toBe(0);
    });

    it('delete invalid entity', async () => {
        await database.model(table).create(worker);
        expect(await database.model(table).count()).toBe(1);

        const expectedActions = [
            {
                type: Events.UPDATING_ENTITIES,
                table
            },
            {
                type: Events.UPDATING_ENTITIES_FAILED,
                table,
                action: 'delete',
                message: 'Entity not found',
                data: worker.id + 5
            }
        ];

        const store = mockStore();

        await store.dispatch(deleteWorker(worker.id + 5));
        expect(store.getActions()).toEqual(expectedActions);

        expect(await database.model(table).count()).toBe(1);
    });

    it('do not update relations on no change', async () => {
        const projectA = await database.model('projects').create({ name: 'Project A' });
        const workerEntity = await database.model(table).create(worker);

        const association = database.model(table).associations.projects as any;
        await association.set(workerEntity, [projectA.get('id') as number]);

        expect(await database.model(table).count()).toBe(1);
        expect(await database.model('projects').count()).toBe(1);

        const expectedActions = [
            {
                type: Events.UPDATING_ENTITIES,
                table
            },
            {
                type: Events.SET_ENTITY,
                table,
                entity: {
                    ...worker,
                    name: 'Steven',
                    boss: createRelatedEntity('workers'),
                    department: createRelatedEntity('departments', 'workers'),
                    projects: createRelatedEntities('projects', 'workers', [projectA.get('id') as number])
                }
            }
        ];

        const store = mockStore();

        await store.dispatch(setWorker({
            ...worker,
            name: 'Steven'
        }));
        expect(store.getActions()).toEqual(expectedActions);

        expect(await database.model(table).count()).toBe(1);
    });
});

describe('internal actions', () => {
    it('update entities action', () => {
        expect(updateEntities(table)).toEqual({
            type: Events.UPDATING_ENTITIES,
            table
        });
    });

    it('update entities failed action', () => {
        expect(updatingEntitiesFailed(table, 'test', 'test message', worker)).toEqual({
            type: Events.UPDATING_ENTITIES_FAILED,
            table,
            action: 'test',
            message: 'test message',
            data: worker
        });

        expect(updatingEntitiesFailed(table, 'test', 'test message')).toEqual({
            type: Events.UPDATING_ENTITIES_FAILED,
            table,
            action: 'test',
            message: 'test message',
            data: null
        });
    });

    it('set entity action', () => {
        expect(setEntity(table, worker)).toEqual({
            type: Events.SET_ENTITY,
            table,
            entity: worker
        });
    });

    it('set entities action', () => {
        expect(setEntities(table, [worker])).toEqual({
            type: Events.SET_ENTITIES,
            table,
            entities: [worker]
        });
    });

    it('delete entity action', () => {
        expect(deleteEntity(table, 5)).toEqual({
            type: Events.DELETE_ENTITY,
            table,
            id: 5
        });
    });
});
