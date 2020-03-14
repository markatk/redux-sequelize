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
import { Sequelize, WhereOptions, Model } from 'sequelize';

import * as Events from './events';
import { Entity, Includeable, ToEntity } from './types';
import { includeablesToSequelizeInclude } from './helpers';

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
    data: any = null
): Events.UpdatingEntitiesFailedAction {
    return {
        type: Events.UPDATING_ENTITIES_FAILED,
        table,
        action,
        message,
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

                    // create entity and search for it to include related objects
                    let entity = await model.create(data);
                    entity = await model.findByPk(entity.get('id') as number, { include: includeablesToSequelizeInclude(sequelize, include) }) as Model;

                    // set related entities
                    let changed = false;

                    for (const includeable of include) {
                        const related = data[includeable.key];
                        if (related == null) {
                            continue;
                        }

                        // update keys for each association
                        const association = model.associations[includeable.key] as any;

                        if (association.isMultiAssociation) {
                            // set external relation
                            entity.set(includeable.key as any, Object.keys(related.entities).map(id => ({ id })));

                            // set internal relation
                            const keys = Object.keys(related.entities);

                            await association.set(entity, keys);
                        } else {
                            // set external relation
                            entity.set(includeable.key as any, data[includeable.key]);

                            // set internal relation
                            await association.set(entity, related.id);
                        }

                        changed = true;
                    }

                    if (changed) {
                        await entity.save();
                    }

                    dispatch(setEntity<T>(table, toEntity(entity)));
                } catch (err) {
                    dispatch(updatingEntitiesFailed(table, 'create', err.message, data));
                }
            };
        },
        getEntity: (id: number) => {
            return async (dispatch: Dispatch<Events.EntityActions<T>>) => {
                dispatch(updateEntities(table));

                try {
                    const model = sequelize.model(table);
                    const entity = await model.findByPk(id, { include: includeablesToSequelizeInclude(sequelize, include) });
                    if (entity == null) {
                        dispatch(updatingEntitiesFailed(table, 'get', 'Entity not found', id));

                        return;
                    }

                    dispatch(setEntity<T>(table, toEntity(entity)));
                } catch (err) {
                    dispatch(updatingEntitiesFailed(table, 'get', err.message, id));
                }
            }
        },
        getEntities: (where: WhereOptions) => {
            return async (dispatch: Dispatch<Events.EntityActions<T>>) => {
                dispatch(updateEntities(table));

                try {
                    const model = sequelize.model(table);
                    const entities = await model.findAll({ where, include: includeablesToSequelizeInclude(sequelize, include) });

                    // convert models to entities and dispatch
                    dispatch(setEntities<T>(table, entities.map(entity => toEntity(entity))));
                } catch (err) {
                    dispatch(updatingEntitiesFailed(table, 'get', err.message, where));
                }
            }
        },
        setEntity: (data: T) => {
            return async (dispatch: Dispatch<Events.EntityActions<T>>) => {
                dispatch(updateEntities(table));

                try {
                    const model = sequelize.model(table);
                    const entity = await model.findByPk(data.id, { include: includeablesToSequelizeInclude(sequelize, include) });
                    if (entity == null) {
                        dispatch(updatingEntitiesFailed(table, 'get', 'Entity not found', data));

                        return;
                    }

                    // apply changes
                    for (const key in data) {
                        if (data.hasOwnProperty(key) && include.some(includeable => includeable.key === key) === false) {
                            entity.set(key as any, data[key]);
                        }
                    }

                    // update related entities
                    for (const includeable of include) {
                        const related = data[includeable.key];
                        if (related == null) {
                            continue;
                        }

                        // update keys for each association
                        const association = model.associations[includeable.key] as any;

                        if (association.isMultiAssociation) {
                            // set external relation
                            entity.set(includeable.key as any, Object.keys(related.entities).map(id => ({ id })));

                            // set internal relation
                            const keys = Object.keys(related.entities);

                            await association.set(entity, keys);
                        } else {
                            // set external relation
                            entity.set(includeable.key as any, data[includeable.key]);

                            // set internal relation
                            await association.set(entity, related.id);
                        }
                    }

                    await entity.save();

                    dispatch(setEntity(table, toEntity(entity)));
                } catch (err) {
                    dispatch(updatingEntitiesFailed(table, 'set', err.message, data));
                }
            };
        },
        deleteEntity: (id: number) => {
            return async (dispatch: Dispatch<Events.EntityActions<T>>) => {
                dispatch(updateEntities(table));

                try {
                    const model = sequelize.model(table);
                    const count = await model.destroy({ where: { id }});
                    if (count === 0) {
                        dispatch(updatingEntitiesFailed(table, 'delete', 'Entity not found', id));

                        return;
                    }

                    dispatch(deleteEntity(table, id));
                } catch (err) {
                    dispatch(updatingEntitiesFailed(table, 'delete', err.message, id));
                }
            };
        }
    };
}
