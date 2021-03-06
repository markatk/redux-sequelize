/*
 * File: helpers.test.ts
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

import {
    isRelatedEntity,
    isRelatedEntities,
    includeablesToSequelizeInclude,
    createRelatedEntity,
    createRelatedEntities,
    isRelatedEntityEqual,
    isRelatedEntitiesEqual,
    entityCollectionToArray
} from '../lib/helpers';
import createDatabase from './database';
import { toWorker, Worker } from './entities';
import { RelatedEntity, RelatedEntities } from '../lib';

const worker = {
    id: 5,
    name: 'Thomas',
    workId: 55
};

const database = createDatabase();

describe('helper functions', () => {
    beforeAll(() => {
        return database.sync();
    });

    beforeEach(() => {
        return database.truncate();
    });

    it('valid related entity', () => {
        expect(isRelatedEntity({
            table: 'workers',
            id: '5',
            entity: null
        })).toBe(true);

        expect(isRelatedEntity({
            table: 'workers',
            id: null,
            entity: null
        })).toBe(true);

        expect(isRelatedEntity({
            table: 'workers',
            id: 5,
            entity: worker
        })).toBe(true);
    });

    it('invalid related entity', () => {
        expect(isRelatedEntity(null)).toBe(false);
        expect(isRelatedEntity(undefined)).toBe(false);
        expect(isRelatedEntity({})).toBe(false);

        expect(isRelatedEntity({
            id: 5
        })).toBe(false);

        expect(isRelatedEntity({
            table: null
        })).toBe(false);

        expect(isRelatedEntity({
            entity: worker
        })).toBe(false);

        expect(isRelatedEntity({
            table: null,
            id: 5,
            entity: worker
        })).toBe(false);

        expect(isRelatedEntity({
            table: null,
            id: 5,
            entity: null
        })).toBe(false);

        expect(isRelatedEntity({
            table: null,
            id: null,
            entity: null
        })).toBe(false);
    });

    it('valid related entities', () => {
        expect(isRelatedEntities({
            table: 'workers',
            entities: {}
        })).toBe(true);

        expect(isRelatedEntities({
            table: 'workers',
            entities: {
                [5]: null
            }
        })).toBe(true);

        expect(isRelatedEntities({
            table: 'workers',
            entities: {
                [5]: worker
            }
        })).toBe(true);
    });

    it('invalid related entities', () => {
        expect(isRelatedEntities(null)).toBe(false);
        expect(isRelatedEntities(undefined)).toBe(false);
        expect(isRelatedEntities({})).toBe(false);

        expect(isRelatedEntities({
            entities: {}
        })).toBe(false);

        expect(isRelatedEntities({
            table: null
        })).toBe(false);

        expect(isRelatedEntities({
            table: null,
            entities: {
                [5]: worker
            }
        })).toBe(false);

        expect(isRelatedEntities({
            table: 'workers',
            entities: null
        })).toBe(false);

        expect(isRelatedEntities({
            table: null,
            entities: null
        })).toBe(false);
    });

    it('compare related entity', () => {
        const a: RelatedEntity<Worker> = {
            table: 'workers',
            linkedKey: 'workers',
            id: 3,
            entity: worker
        };

        expect(isRelatedEntityEqual(null, null)).toBeTruthy();
        expect(isRelatedEntityEqual(a, null)).toBeFalsy();
        expect(isRelatedEntityEqual(null, a)).toBeFalsy();

        expect(isRelatedEntityEqual(a, a)).toBeTruthy();
        expect(isRelatedEntityEqual(a, {...a})).toBeTruthy();
        expect(isRelatedEntityEqual(a, {
            table: 'workers',
            linkedKey: 'workers',
            id: 3,
            entity: null
        })).toBeFalsy();
        expect(isRelatedEntityEqual(a, {
            table: 'workers',
            linkedKey: 'workers',
            id: null,
            entity: worker
        })).toBeFalsy();
        expect(isRelatedEntityEqual(a, {
            table: 'workers',
            linkedKey: 'worker',
            id: 3,
            entity: worker
        })).toBeFalsy();
        expect(isRelatedEntityEqual(a, {
            table: 'worker',
            linkedKey: 'workers',
            id: 3,
            entity: worker
        })).toBeFalsy();
    });

    it('compare related entities', () => {
        const a: RelatedEntities<Worker> = {
            table: 'workers',
            linkedKey: 'workers',
            entities: {
                [3]: worker
            }
        };

        expect(isRelatedEntitiesEqual(null, null)).toBeTruthy();
        expect(isRelatedEntitiesEqual(a, null)).toBeFalsy();
        expect(isRelatedEntitiesEqual(null, a)).toBeFalsy();

        expect(isRelatedEntitiesEqual(a, a)).toBeTruthy();
        expect(isRelatedEntitiesEqual(a, {...a})).toBeTruthy();
        expect(isRelatedEntitiesEqual(a, {
            table: 'workers',
            linkedKey: 'workers',
            entities: {
                [3]: null
            }
        })).toBeFalsy();
        expect(isRelatedEntitiesEqual(a, {
            table: 'workers',
            linkedKey: 'workers',
            entities: {
                [2]: worker
            }
        })).toBeFalsy();
        expect(isRelatedEntitiesEqual(a, {
            table: 'workers',
            linkedKey: 'worker',
            entities: {
                [3]: worker
            }
        })).toBeFalsy();
        expect(isRelatedEntitiesEqual(a, {
            table: 'worker',
            linkedKey: 'workers',
            entities: {
                [3]: worker
            }
        })).toBeFalsy();
        expect(isRelatedEntitiesEqual(a, {
            table: 'worker',
            linkedKey: 'workers',
            entities: {}
        })).toBeFalsy();
    });

    it('valid includeables', () => {
        expect(includeablesToSequelizeInclude(database, database.model('workers'), [
            {
                table: 'projects',
                key: 'projects',
            },
            {
                table: 'departments',
                key: 'department'
            },
            {
                table: 'workers',
                key: 'boss',
                toEntity: toWorker
            }
        ])).toEqual([
            {
                as: 'projects',
                model: database.model('projects'),
                attributes: ['id']
            },
            {
                as: 'department',
                model: database.model('departments'),
                attributes: ['id']
            },
            {
                as: 'boss',
                model: database.model('workers'),
                attributes: undefined
            }
        ]);
    });

    it('create entity relation', () => {
        expect(createRelatedEntity('workers')).toEqual({
            table: 'workers',
            id: null,
            entity: null,
            linkedKey: null
        });

        expect(createRelatedEntity('workers', 'employees')).toEqual({
            table: 'workers',
            id: null,
            entity: null,
            linkedKey: 'employees'
        });

        expect(createRelatedEntity('workers', null, 5)).toEqual({
            table: 'workers',
            id: 5,
            entity: null,
            linkedKey: null
        });

        expect(createRelatedEntity('workers', 'employees', 5)).toEqual({
            table: 'workers',
            id: 5,
            entity: null,
            linkedKey: 'employees'
        });
    });

    it('create entities relation', () => {
        expect(createRelatedEntities('workers')).toEqual({
            table: 'workers',
            entities: {},
            linkedKey: null
        });

        expect(createRelatedEntities('workers', 'boss')).toEqual({
            table: 'workers',
            entities: {},
            linkedKey: 'boss'
        });

        expect(createRelatedEntities('workers', null, [2, 3])).toEqual({
            table: 'workers',
            entities: {
                [2]: null,
                [3]: null
            },
            linkedKey: null
        });

        expect(createRelatedEntities('workers', 'boss', [2, 3])).toEqual({
            table: 'workers',
            entities: {
                [2]: null,
                [3]: null
            },
            linkedKey: 'boss'
        });
    });

    it('convert includeables', () => {
        expect(includeablesToSequelizeInclude(database, database.model('workers'),[
            {
                key: 'department',
                table: 'departments',
                linkedKey: 'workers'
            },
            {
                key: 'boss',
                table: 'workers',
                toEntity: toWorker
            }
        ])).toEqual([
            {
                as: 'department',
                model: database.model('departments'),
                attributes: ['id']
            },
            {
                as: 'boss',
                model: database.model('workers'),
                attributes: undefined
            }
        ]);
    });

    it('convert entity collections to arrays', () => {
        const boss: Worker = {
            id: 7,
            name: 'Mike',
            workId: 10
        };

        const collection: {[id: number]: Worker} = {
            [5]: worker,
            [7]: boss
        };

        expect(entityCollectionToArray(null)).toEqual([]);
        expect(entityCollectionToArray({})).toEqual([]);
        expect(entityCollectionToArray({
            [5]: null,
            [7]: null
        })).toEqual([]);
        expect(entityCollectionToArray(collection)).toEqual([
            worker,
            boss
        ]);
        expect(entityCollectionToArray(collection, null)).toEqual([
            worker,
            boss
        ]);
        expect(entityCollectionToArray(collection, entity => entity.id !== 5)).toEqual([
            boss
        ]);
        expect(entityCollectionToArray(collection, (entity: Worker, index: number) => index > 0)).toEqual([
            boss
        ]);
        expect(entityCollectionToArray(collection, () => false)).toEqual([]);
    });
});
