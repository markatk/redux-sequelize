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
import { Worker, toWorker, workerInclude, workPlaceInclude, toWorkPlace, WorkPlace, Config, toConfig, fromConfig } from './entities';
import createDatabase from './database';

const table = 'workers';
const database = createDatabase();

const {
    createEntity: createWorker,
    deleteEntity: deleteWorker,
    getEntities: getWorkers,
    getEntity: getWorker,
    setEntity: setWorker,
    clearEntities: clearWorkers,
    createOrSetEntity: createOrSetWorker
} = createActions<Worker>(() => database, {
    table,
    toEntity: toWorker,
    include: workerInclude
});

const {
    setEntity: setWorkPlace
} = createActions<WorkPlace>(() => database, {
    table: 'workPlaces',
    toEntity: toWorkPlace,
    include: workPlaceInclude
});

const {
    getEntity: getConfig,
    createEntity: createConfig
} = createActions<Config>(() => database, {
    table: 'configs',
    toEntity: toConfig,
    fromEntity: fromConfig
});

const worker = {
    id: 1,
    name: 'Thomas',
    workId: 55,
    version: 1
};

const boss = {
    id: 2,
    name: 'Steven',
    workId: 3,
    version: 1
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
        const { createEntity } = createActions<Worker>(null, {
            table: 'workers',
            toEntity: toWorker,
            include: workerInclude
        });

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
                    projects: createRelatedEntities('projects', 'workers'),
                    workPlace: createRelatedEntity('workPlaces', 'worker')
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
        const { createEntity: createTest } = createActions<Worker>(() => database, {
            table: 'test',
            toEntity: toWorker
        });

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
                type: Events.UPDATING_ENTITIES,
                table: 'workPlaces'
            },
            {
                type: Events.SET_ENTITIES,
                table: 'workers',
                entities: []
            },
            {
                type: Events.SET_ENTITIES,
                table: 'workPlaces',
                entities: []
            },
            {
                type: Events.SET_ENTITY,
                table,
                entity: {
                    ...worker,
                    boss: createRelatedEntity('workers'),
                    department: createRelatedEntity('departments', 'workers'),
                    projects: createRelatedEntities('projects', 'workers'),
                    workPlace: createRelatedEntity('workPlaces', 'worker')
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
                    version: 2,
                    name: 'Mike',
                    boss: createRelatedEntity('workers'),
                    department: createRelatedEntity('departments', 'workers'),
                    projects: createRelatedEntities('projects', 'workers'),
                    workPlace: createRelatedEntity('workPlaces', 'worker')
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

    it('update outdated entity', async () => {
        await database.model(table).create({
            ...worker,
            version: 3
        });
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
                message: 'Entity outdated',
                data: {
                    id: worker.id,
                    name: 'Mike',
                    version: 1
                }
            }
        ];

        const store = mockStore();

        await store.dispatch(setWorker({
            id: worker.id,
            name: 'Mike',
            version: 1
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
                type: Events.UPDATING_ENTITIES,
                table: 'workPlaces'
            },
            {
                type: Events.SET_ENTITIES,
                table: 'workers',
                entities: [toWorker(bossEntity)]
            },
            {
                type: Events.SET_ENTITIES,
                table: 'workPlaces',
                entities: []
            },
            {
                type: Events.SET_ENTITY,
                table,
                entity: {
                    ...worker,
                    version: 2,
                    boss: createRelatedEntity('workers', null, boss.id),
                    department: createRelatedEntity('departments', 'workers'),
                    projects: createRelatedEntities('projects', 'workers'),
                    workPlace: createRelatedEntity('workPlaces', 'worker')
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
                type: Events.UPDATING_ENTITIES,
                table: 'workPlaces'
            },
            {
                type: Events.SET_ENTITIES,
                table: 'workers',
                entities: []
            },
            {
                type: Events.SET_ENTITIES,
                table: 'workPlaces',
                entities: []
            },
            {
                type: Events.SET_ENTITY,
                table,
                entity: {
                    ...worker,
                    boss: createRelatedEntity('workers'),
                    department: createRelatedEntity('departments', 'workers'),
                    projects: createRelatedEntities('projects', 'workers', [projectA.get('id') as number, projectB.get('id') as number]),
                    workPlace: createRelatedEntity('workPlaces', 'worker')
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
                type: Events.UPDATING_ENTITIES,
                table: 'workPlaces'
            },
            {
                type: Events.SET_ENTITIES,
                table: 'workers',
                entities: []
            },
            {
                type: Events.SET_ENTITIES,
                table: 'workPlaces',
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
                        projects: createRelatedEntities('projects', 'workers'),
                        workPlace: createRelatedEntity('workPlaces', 'worker')
                    },
                    {
                        ...boss,
                        boss: createRelatedEntity('workers'),
                        department: createRelatedEntity('departments', 'workers'),
                        projects: createRelatedEntities('projects', 'workers'),
                        workPlace: createRelatedEntity('workPlaces', 'worker')
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
                type: Events.UPDATING_ENTITIES,
                table: 'workPlaces'
            },
            {
                type: Events.SET_ENTITIES,
                table: 'workers',
                entities: []
            },
            {
                type: Events.SET_ENTITIES,
                table: 'workPlaces',
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
                        projects: createRelatedEntities('projects', 'workers', [projectA.get('id') as number]),
                        workPlace: createRelatedEntity('workPlaces', 'worker')
                    },
                    {
                        ...boss,
                        boss: createRelatedEntity('workers'),
                        department: createRelatedEntity('departments', 'workers'),
                        projects: createRelatedEntities('projects', 'workers', [projectB.get('id') as number]),
                        workPlace: createRelatedEntity('workPlaces', 'worker')
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
                    version: 2,
                    boss: createRelatedEntity('workers', null, boss.id),
                    department: createRelatedEntity('departments', 'workers'),
                    projects: createRelatedEntities('projects', 'workers'),
                    workPlace: createRelatedEntity('workPlaces', 'worker')
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

    // TODO: Enable two-way test again
    // it('two-way set related entity', async () => {
    //     const workPlace = {
    //         id: 5,
    //         name: '2nd floor'
    //     };

    //     await database.model(table).create(worker);
    //     expect(await database.model(table).count()).toBe(1);

    //     await database.model('workPlaces').create(workPlace);
    //     expect(await database.model('workPlaces').count()).toBe(1);

    //     const expectedActions = [
    //         {
    //             type: Events.UPDATING_ENTITIES,
    //             table
    //         },
    //         {
    //             type: Events.SET_ENTITY,
    //             table,
    //             entity: {
    //                 ...worker,
    //                 boss: createRelatedEntity('workers', null),
    //                 department: createRelatedEntity('departments', 'workers'),
    //                 projects: createRelatedEntities('projects', 'workers'),
    //                 workPlace: createRelatedEntity('workPlaces', 'worker', workPlace.id)
    //             }
    //         }
    //     ];

    //     const store = mockStore();

    //     await store.dispatch(setWorker({
    //         ...worker,
    //         workPlace: {
    //             id: workPlace.id,
    //             table: 'workPlaces',
    //             linkedKey: 'worker',
    //             entity: null
    //         }
    //     }));
    //     expect(store.getActions()).toEqual(expectedActions);

    //     let result = toWorker(await database.model(table).findByPk(worker.id, {
    //         include: includeablesToSequelizeInclude(database, database.model(table), workerInclude)
    //     }));
    //     expect(result.workPlace.id).toBe(workPlace.id);

    //     // Try same from other side
    //     await database.model(table).truncate();
    //     await database.model('workPlaces').truncate();

    //     store.clearActions();

    //     await database.model(table).create(worker);
    //     expect(await database.model(table).count()).toBe(1);

    //     await database.model('workPlaces').create(workPlace);
    //     expect(await database.model('workPlaces').count()).toBe(1);

    //     const expectedReverseActions = [
    //         {
    //             type: Events.UPDATING_ENTITIES,
    //             table: 'workPlaces'
    //         },
    //         {
    //             type: Events.SET_ENTITY,
    //             table: 'workPlaces',
    //             entity: {
    //                 ...workPlace,
    //                 worker: createRelatedEntity('workers', 'workPlace', worker.id)
    //             }
    //         }
    //     ];

    //     await store.dispatch(setWorkPlace({
    //         ...workPlace,
    //         worker: {
    //             id: worker.id,
    //             table: 'workers',
    //             linkedKey: 'workPlace',
    //             entity: null
    //         }
    //     }));
    //     expect(store.getActions()).toEqual(expectedReverseActions);

    //     result = await database.model('workPlaces').findByPk(workPlace.id, {
    //         include: includeablesToSequelizeInclude(database, database.model('workPlaces'), workPlaceInclude)
    //     });
    //     expect(result.worker.id).toBe(worker.id);
    // });

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
                    projects: createRelatedEntities('projects', 'workers', [projectA.get('id') as number, projectB.get('id') as number]),
                    workPlace: createRelatedEntity('workPlaces', 'worker')
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
                    version: 2,
                    boss: createRelatedEntity('workers', null, boss.id),
                    department: createRelatedEntity('departments', 'workers'),
                    projects: createRelatedEntities('projects', 'workers'),
                    workPlace: createRelatedEntity('workPlaces', 'worker')
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
                    projects: createRelatedEntities('projects', 'workers', [projectA.get('id') as number, projectB.get('id') as number]),
                    workPlace: createRelatedEntity('workPlaces', 'worker')
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
                    version: 2,
                    boss: createRelatedEntity('workers'),
                    department: createRelatedEntity('departments', 'workers'),
                    projects: createRelatedEntities('projects', 'workers', [projectA.get('id') as number]),
                    workPlace: createRelatedEntity('workPlaces', 'worker')
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

    it('get entity with json field', async () => {
        const configData = {
            boo: 'foo',
            bee: 2
        };

        const config = await database.model('configs').create({ semVer: '1.0', data: JSON.stringify(configData) });
        expect(await database.model('configs').count()).toBe(1);

        const expectedActions = [
            {
                type: Events.UPDATING_ENTITIES,
                table: 'configs'
            },
            {
                type: Events.SET_ENTITY,
                table: 'configs',
                entity: {
                    id: config.get('id') as number,
                    semVer: '1.0',
                    data: configData
                }
            }
        ];

        const store = mockStore();

        await store.dispatch(getConfig(config.get('id') as number));
        expect(store.getActions()).toEqual(expectedActions);

        expect(await database.model('configs').count()).toBe(1);
    });

    it('create entity with json field', async () => {
        const configData = {
            boo: 'foo',
            bee: 2
        };

        const expectedActions = [
            {
                type: Events.UPDATING_ENTITIES,
                table: 'configs'
            },
            {
                type: Events.SET_ENTITY,
                table: 'configs',
                entity: {
                    id: 1,
                    semVer: '1.0',
                    data: configData
                }
            }
        ];

        const store = mockStore();

        await store.dispatch(createConfig({ id: 1, semVer: '1.0', data: configData }));
        expect(store.getActions()).toEqual(expectedActions);

        expect(await database.model('configs').count()).toBe(1);
    });

    it('clear action', () => {
        expect(clearWorkers()).toEqual({
            type: Events.CLEAR_ENTITIES,
            table
        });
    });

    it('create or set new valid entity', async () => {
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
                    projects: createRelatedEntities('projects', 'workers'),
                    workPlace: createRelatedEntity('workPlaces', 'worker')
                }
            }
        ];

        const store = mockStore();

        await store.dispatch(createOrSetWorker(worker));
        expect(store.getActions()).toEqual(expectedActions);

        expect(await database.model(table).count()).toBe(1);
    });

    it('create or set new valid entity without id', async () => {
        const expectedActions = [
            {
                type: Events.UPDATING_ENTITIES,
                table
            },
            {
                type: Events.SET_ENTITY,
                table,
                entity: {
                    id: 3,
                    name: 'Thomas',
                    workId: 6,
                    version: 0,
                    boss: createRelatedEntity('workers'),
                    department: createRelatedEntity('departments', 'workers'),
                    projects: createRelatedEntities('projects', 'workers'),
                    workPlace: createRelatedEntity('workPlaces', 'worker')
                }
            }
        ];

        const store = mockStore();

        await store.dispatch(createOrSetWorker({
            name: 'Thomas',
            workId: 6
        }));
        expect(store.getActions()).toEqual(expectedActions);

        expect(await database.model(table).count()).toBe(1);
    });

    it('create or set existing valid entity', async () => {
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
                    name: 'Thomas',
                    boss: createRelatedEntity('workers'),
                    department: createRelatedEntity('departments', 'workers'),
                    projects: createRelatedEntities('projects', 'workers'),
                    workPlace: createRelatedEntity('workPlaces', 'worker')
                }
            }
        ];

        const store = mockStore();

        await store.dispatch(createOrSetWorker({
            ...worker,
            name: 'Thomas'
        }));
        expect(store.getActions()).toEqual(expectedActions);

        expect(await database.model(table).count()).toBe(1);
    });

    it('create or set existing valid entity without id', async () => {
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
                    id: 4,
                    name: 'Thomas',
                    boss: createRelatedEntity('workers'),
                    department: createRelatedEntity('departments', 'workers'),
                    projects: createRelatedEntities('projects', 'workers'),
                    workPlace: createRelatedEntity('workPlaces', 'worker')
                }
            }
        ];

        const store = mockStore();

        await store.dispatch(createOrSetWorker({
            ...worker,
            id: undefined,
            name: 'Thomas'
        }));
        expect(store.getActions()).toEqual(expectedActions);

        expect(await database.model(table).count()).toBe(2);
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
