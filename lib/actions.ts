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
import { Sequelize, WhereOptions, Model, ModelCtor } from 'sequelize';
import _ from 'lodash';

import * as Events from './events';
import { Entity, Includeable, ToEntity, FromEntity } from './types';
import { includeablesToSequelizeInclude, includeablesToEntityStore, arrayEquals, isRelatedEntity } from './helpers';

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

export function clearEntities(table: string): Events.ClearEntitiesAction {
    return {
        type: Events.CLEAR_ENTITIES,
        table
    };
}

export function dispatchIncludedEntities<T extends Entity>(
    model: ModelCtor<Model>,
    dispatch: Dispatch<Events.EntityActions<T>>,
    entities: Model[],
    includeables: Includeable[] = []
): {[table: string]: Entity[]} {
    const data = includeablesToEntityStore(model, includeables);

    for (const table in data) {
        if (data.hasOwnProperty(table)) {
            dispatch(updateEntities(table));
        }
    }

    // parse all included entities into arrays
    const conversionIncludeables = includeables.filter(includeable => includeable.toEntity != null);

    for (const entity of entities) {
        for (const includeable of conversionIncludeables) {
            const includedEntity = entity.get(includeable.key as any);

            if (_.isArray(includedEntity)) {
                for (const element of includedEntity) {
                    if (data[includeable.table].some(ent => ent.id === element.id) === false) {
                        data[includeable.table].push(includeable.toEntity!(element));
                    }
                }
            } else if (includedEntity != null && data[includeable.table].some(ent => ent.id === includedEntity.id) === false) {
                data[includeable.table].push(includeable.toEntity!(includedEntity));
            }
        }
    }

    // dispatch all tables
    for (const table in data) {
        if (data.hasOwnProperty(table)) {
            dispatch(setEntities(table, data[table] as T[]));
        }
    }

    return data;
}

async function updateAssociations<T extends Entity>(
    sequelize: Sequelize,
    model: ModelCtor<Model>,
    entity: Model,
    data: T,
    include: Includeable[] = [],
    checkCurrent: boolean = false
) {
    for (const includeable of include) {
        const related = data[includeable.key];
        if (related == null) {
            continue;
        }

        // update keys for each association
        const association = model.associations[includeable.key] as any;
        if (association == null) {
            // set relation on linked entity if there is any. Seems like it isn't required for related entities at all
            if (related.linkedKey != null && isRelatedEntity(related)) {
                const relatedModel = sequelize.model(related.table);
                const relatedAssociation = relatedModel.associations[related.linkedKey] as any;
                const relatedEntity = await relatedModel.findByPk(related.id);

                if (relatedAssociation != null && relatedEntity != null) {
                    const id = entity.get('id') as number;

                    // set external relation
                    entity.setDataValue(includeable.key as any, relatedEntity);

                    // set internal relation
                    await relatedAssociation.set(relatedEntity, id);
                }
            }

            continue;
        }

        if (association.isMultiAssociation) {
            if (checkCurrent) {
                // do not update relation if nothing changed
                const currentRelatedEntities = await association.get(entity);
                const currentKeys = currentRelatedEntities.map((ent: Entity) => ent.get('id').toString());
                if (arrayEquals(currentKeys, Object.keys(related.entities))) {
                    continue;
                }
            }

            // set external relation
            entity.set(includeable.key as any, Object.keys(related.entities).map(id => ({ id })));

            // set internal relation
            const keys = Object.keys(related.entities);

            await association.set(entity, keys);
        } else {
            if (checkCurrent) {
                // do not update relation if nothing changed
                const currentRelatedEntity = await association.get(entity);
                const currentId = currentRelatedEntity != null ? currentRelatedEntity.get('id') as number : null;
                if (currentId === related.id) {
                    continue;
                }
            }

            // set external relation
            entity.set(includeable.key as any, data[includeable.key]);

            // set internal relation
            await association.set(entity, related.id);
        }
    }
}

interface ActionOptions<T extends Entity> {
    table: string,
    toEntity: ToEntity<T>,
    fromEntity?: FromEntity<T>,
    include?: Includeable[]
}

export function createActions<T extends Entity>(databaseCallback: () => Sequelize, options: ActionOptions<T>) {
    return {
        createEntity: (data: T) => {
            return async (dispatch: Dispatch<Events.EntityActions<T>>) => {
                dispatch(updateEntities(options.table));

                try {
                    const sequelize = databaseCallback();
                    const model = sequelize.model(options.table);

                    // create entity and search for it to include related objects
                    const entityData = options.fromEntity != null ? options.fromEntity(data) : data;

                    let entity = await model.create(entityData);
                    entity = await model.findByPk(entity.get('id') as number, { include: includeablesToSequelizeInclude(sequelize, model, options.include) }) as Model;

                    // set related entities
                    await updateAssociations(sequelize, model, entity, data, options.include);

                    dispatch(setEntity<T>(options.table, options.toEntity(entity)));

                    // set id on original data for chained actions
                    data.id = entity.get('id') as number;
                } catch (err) {
                    dispatch(updatingEntitiesFailed(options.table, 'create', err.message, data));
                }
            };
        },
        getEntity: (id: number) => {
            return async (dispatch: Dispatch<Events.EntityActions<T>>) => {
                dispatch(updateEntities(options.table));

                try {
                    const sequelize = databaseCallback();
                    const model = sequelize.model(options.table);

                    const entity = await model.findByPk(id, { include: includeablesToSequelizeInclude(sequelize, model, options.include) });
                    if (entity == null) {
                        dispatch(updatingEntitiesFailed(options.table, 'get', 'Entity not found', id));

                        return;
                    }

                    dispatchIncludedEntities(model, dispatch, [entity], options.include);

                    dispatch(setEntity<T>(options.table, options.toEntity(entity)));
                } catch (err) {
                    dispatch(updatingEntitiesFailed(options.table, 'get', err.message, id));
                }
            }
        },
        getEntities: (where: WhereOptions = {}) => {
            return async (dispatch: Dispatch<Events.EntityActions<T>>) => {
                dispatch(updateEntities(options.table));

                try {
                    const sequelize = databaseCallback();
                    const model = sequelize.model(options.table);

                    const entities = await model.findAll({ where, include: includeablesToSequelizeInclude(sequelize, model, options.include) });

                    dispatchIncludedEntities(model, dispatch, entities, options.include);

                    // convert models to entities and dispatch
                    dispatch(setEntities<T>(options.table, entities.map(entity => options.toEntity(entity))));
                } catch (err) {
                    dispatch(updatingEntitiesFailed(options.table, 'get', err.message, where));
                }
            }
        },
        setEntity: (data: T) => {
            return async (dispatch: Dispatch<Events.EntityActions<T>>) => {
                dispatch(updateEntities(options.table));

                try {
                    const sequelize = databaseCallback();
                    const model = sequelize.model(options.table);

                    const entity = await model.findByPk(data.id, { include: includeablesToSequelizeInclude(sequelize, model, options.include) });
                    if (entity == null) {
                        dispatch(updatingEntitiesFailed(options.table, 'set', 'Entity not found', data));

                        return;
                    }

                    if (model.options.version && entity.get('version') as number > data.version) {
                        dispatch(updatingEntitiesFailed(options.table, 'set', 'Entity outdated', data));

                        return;
                    }

                    // apply changes
                    const entityData = options.fromEntity != null ? options.fromEntity(data) : data;

                    if (options.include != null) {
                        for (const key in entityData) {
                            if (entityData.hasOwnProperty(key) && options.include!.some(includeable => includeable.key === key) === false) {
                                entity.set(key as any, entityData[key]);
                            }
                        }
                    }

                    await entity.save();

                    // update related entities
                    await updateAssociations(sequelize, model, entity, data, options.include, true);

                    dispatch(setEntity(options.table, options.toEntity(entity)));
                } catch (err) {
                    dispatch(updatingEntitiesFailed(options.table, 'set', err.message, data));
                }
            };
        },
        deleteEntity: (id: number) => {
            return async (dispatch: Dispatch<Events.EntityActions<T>>) => {
                dispatch(updateEntities(options.table));

                try {
                    const sequelize = databaseCallback();
                    const model = sequelize.model(options.table);

                    const count = await model.destroy({ where: { id }});
                    if (count === 0) {
                        dispatch(updatingEntitiesFailed(options.table, 'delete', 'Entity not found', id));

                        return;
                    }

                    dispatch(deleteEntity(options.table, id));
                } catch (err) {
                    dispatch(updatingEntitiesFailed(options.table, 'delete', err.message, id));
                }
            };
        },
        clearEntities: () => {
            return clearEntities(options.table);
        },
        createOrSetEntity: (data: T) => {
            return async (dispatch: Dispatch<Events.EntityActions<T>>) => {
                dispatch(updateEntities(options.table));

                try {
                    const sequelize = databaseCallback();
                    const model = sequelize.model(options.table);

                    const entityData = options.fromEntity != null ? options.fromEntity(data) : data;
                    let entity: Model | null;
                    let created = false;

                    if (data.id == null) {
                        // create new entity
                        entity = await model.create(entityData);
                        entity = await model.findByPk(entity.get('id') as number, { include: includeablesToSequelizeInclude(sequelize, model, options.include) }) as Model;

                        created = true;
                    } else {
                        // try to get entity
                        entity = await model.findByPk(data.id, { include: includeablesToSequelizeInclude(sequelize, model, options.include) });
                        if (entity == null) {
                            // create entity because none was found for the id
                            entity = await model.create(entityData);
                            entity = await model.findByPk(entity.get('id') as number, { include: includeablesToSequelizeInclude(sequelize, model, options.include) }) as Model;

                            created = true;
                        } else if (model.options.version && entity.get('version') as number > data.version) {
                            dispatch(updatingEntitiesFailed(options.table, 'set', 'Entity outdated', data));

                            return;
                        }
                    }

                    if (created === false) {
                        // apply changes
                        if (options.include != null) {
                            for (const key in entityData) {
                                if (entityData.hasOwnProperty(key) && options.include!.some(includeable => includeable.key === key) === false) {
                                    entity.set(key as any, entityData[key]);
                                }
                            }
                        }

                        await entity.save();
                    }

                    // update related entities
                    await updateAssociations(sequelize, model, entity, data, options.include, true);

                    dispatch(setEntity(options.table, options.toEntity(entity)));
                } catch (err) {
                    dispatch(updatingEntitiesFailed(options.table, 'set', err.message, data));
                }
            };
        }
    };
}
