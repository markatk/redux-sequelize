/*
 * File: actions.ts
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

import { Dispatch } from 'redux';
import { Sequelize, WhereOptions } from 'sequelize';

import * as Events from './events';
import { Entity, Includeable, ToEntity } from './types';

export function updateEntities(table: string): Events.UpdatingEntitiesAction {
    return {
        type: Events.UPDATING_ENTITIES,
        table
    };
}

export function updatingEntitiesFailed(
    table: string,
    action: string,
    message: string,
    error: any = null,
    data: object = null
): Events.UpdatingEntitiesFailedAction {
    return {
        type: Events.UPDATING_ENTITIES_FAILED,
        table,
        action,
        message,
        error,
        data
    };
}

export function setEntity<T extends Entity>(table: string, entity: T): Events.SetEntityAction<T> {
    return {
        type: Events.SET_ENTITY,
        table,
        entity
    };
}

export function setEntities<T extends Entity>(table: string, entities: T[]): Events.SetEntitiesAction<T> {
    return {
        type: Events.SET_ENTITIES,
        table,
        entities
    };
}

export function deleteEntity(table: string, id: number): Events.DeleteEntityAction {
    return {
        type: Events.DELETE_ENTITY,
        table,
        id
    };
}

export function createActions<T extends Entity>(sequelize: Sequelize, table: string, toEntity: ToEntity<T>, include: Includeable[] = []) {
    return {
        createEntity: (data: T) => {
            return async (dispatch: Dispatch<Events.EntityActions<T>>) => {
                dispatch(updateEntities(table));

                try {
                    const model = sequelize.model(table);
                    if (model == null) {
                        dispatch(updatingEntitiesFailed(table, 'create', `Model for table "${table}" not found`, null, data));

                        return;
                    }

                    const entity = model.build(data);

                    await entity.save();

                    dispatch(setEntity(table, toEntity(entity)));
                } catch (err) {
                    dispatch(updatingEntitiesFailed(table, 'create', `Unable to create entity`, err, data));
                }
            };
        },
        getEntity: (id: number) => {
            return async (dispatch: Dispatch<Events.EntityActions<T>>) => {
                dispatch(updateEntities(table));
            }
        },
        getEntities: (where: WhereOptions) => {
            return async (dispatch: Dispatch<Events.EntityActions<T>>) => {
                dispatch(updateEntities(table));
            }
        },
        setEntity: (data: T) => {
            return async (dispatch: Dispatch<Events.EntityActions<T>>) => {
                dispatch(updateEntities(table));
            };
        },
        deleteEntity: (id: number) => {
            return async (dispatch: Dispatch<Events.EntityActions<T>>) => {
                dispatch(updateEntities(table));
            };
        }
    };
}
