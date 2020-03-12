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

import { isRelatedEntity, isRelatedEntities, includeablesToSequelizeInclude } from '../lib/helpers';
import createDatabase from './database';
import { toWorker } from './entities';

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

    it('valid includeables', () => {
        expect(includeablesToSequelizeInclude(database, [
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
});
