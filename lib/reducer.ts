/*
 * File: reducer.ts
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

import { UPDATING_ENTITIES, UPDATING_ENTITIES_FAILED, GET_ENTITY, GET_ENTITIES, SET_ENTITY, CREATE_ENTITY, DELETE_ENTITY, EntityActions } from './events';
import { Entity } from './entity';

interface EntitiesState<T extends Entity> {
    updating: number;
    data: Map<number, T>;
    relatedTables: string[];
}

const initialState = {
    updating: 0,
    data: new Map(),
    relatedTables: []
};

export default function reducer<T extends Entity>(table: string) {
    return (state: EntitiesState<T> = initialState, action: EntityActions<T>): EntitiesState<T> => {
        switch (action.type) {
            default:
                return state;
        }
    };
}
