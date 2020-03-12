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

import { createActions, Events } from '../lib';
import { Worker, toWorker } from './entity';
import createDatabase from './database';

const table = 'workers';
const database = createDatabase();

const {
    createEntity: createWorker,
    deleteEntity: deleteWorker,
    getEntities: getWorkers,
    getEntity: getWorker,
    setEntity: setWorker
} = createActions<Worker>(database, table, toWorker);

const worker = {
    id: 1,
    name: 'Thomas',
    workId: 55
};

const mockStore = configureMockStore([thunk]);

describe('entity actions', () => {
    beforeAll(() => {
        return database.sync();
    });

    afterAll(() => {
        database.close();
    });

    it('create actions', () => {
        expect(createWorker).toBeInstanceOf(Function);
        expect(deleteWorker).toBeInstanceOf(Function);
        expect(getWorkers).toBeInstanceOf(Function);
        expect(getWorker).toBeInstanceOf(Function);
        expect(setWorker).toBeInstanceOf(Function);
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
                entity: worker
            }
        ];

        const store = mockStore();

        await store.dispatch(createWorker(worker));
        expect(store.getActions()).toEqual(expectedActions);

        expect(await database.model(table).count()).toBe(1);
    });
});
