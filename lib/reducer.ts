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

import _ from 'lodash';

import { UPDATING_ENTITIES, UPDATING_ENTITIES_FAILED, SET_ENTITY, SET_ENTITIES, DELETE_ENTITY, EntityActions } from './events';
import { Entity } from './types';
import { isRelatedEntities, isRelatedEntity } from './helpers';

function getRelatedTables(currentTables: string[], entities: Entity[]): string[] {
    return _.uniq(currentTables.concat(...entities.map((entity): string[] => {
        return Object.keys(entity)
            .filter(id => isRelatedEntity(entity[id]) || isRelatedEntities(entity[id]))
            .map(id => entity[id].table);
        }))
    );
}

interface EntitiesState<T extends Entity> {
    updating: number;
    data: {[id: number]: T};
    relatedTables: string[];
}

const initialState = {
    updating: 0,
    data: {},
    relatedTables: []
};

export default function reducer<T extends Entity>(table: string) {
    return (state: EntitiesState<T> = initialState, action: EntityActions<T>): EntitiesState<T> => {
        if (action.table !== table) {
            return state;
        }

        switch (action.type) {
            case UPDATING_ENTITIES:
                return {
                    ...state,
                    updating: state.updating + 1
                };

            case UPDATING_ENTITIES_FAILED:
                // TODO: Handle error
                return {
                    ...state,
                    updating: state.updating - 1
                };

            case SET_ENTITY:
                return {
                    ...state,
                    updating: state.updating - 1,
                    relatedTables: getRelatedTables(state.relatedTables, [action.entity]),
                    data: {
                        ...state.data,
                        [action.entity.id as number]: action.entity
                    }
                };

            case SET_ENTITIES:
                const updatedData = action.entities.reduce((ent: {[id: number]: T}, entity) => {
                    ent[entity.id as number] = entity;

                    return ent;
                }, { ...state.data });

                return {
                    ...state,
                    updating: state.updating - 1,
                    relatedTables: getRelatedTables(state.relatedTables, action.entities),
                    data: updatedData
                };

            case DELETE_ENTITY:
                const { [action.id]: removedEntity, ...data } = state.data;

                return {
                    ...state,
                    updating: state.updating - 1,
                    data,
                };

            default:
                return state;
        }
    };
}
