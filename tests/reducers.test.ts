/*
 * File: reducers.test.ts
 * Author: MarkAtk
 * Date: 11.03.20
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

import { Reducer } from 'redux';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';

import { reducer, Events } from '../lib';
import { updateEntities, updatingEntitiesFailed } from '../lib/actions';
import { Worker } from './entity';

const initialState = {
    updating: 0,
    data: {},
    relatedTables: []
};

const table = 'workers';
let workerReducer: Reducer;

describe('entity reducer', () => {
    beforeEach(() => {
        workerReducer = reducer<Worker>(table);
    });

    it('create valid reducer', () => {
        expect(workerReducer).not.toBeNull();
    });

    it('handle unknown action', () => {
        expect(workerReducer(undefined, {} as Events.EntityActions<Worker>)).toEqual(initialState);
        expect(workerReducer(undefined, { type: 'UNKNOWN' } as unknown as Events.EntityActions<Worker>)).toEqual(initialState);
    });

    it('updating increases counter', () => {
        expect(workerReducer(undefined, updateEntities(table))).toEqual({
            updating: 1,
            data: {},
            relatedTables: []
        });
    });

    it('updating failed decreases counter', () => {
        expect(workerReducer(undefined, updatingEntitiesFailed(table, null, null))).toEqual({
            updating: -1,
            data: {},
            relatedTables: []
        });
    });
});
