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

import * as Events from './events';
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

function getEntityFromAction(action: any, id: number): Entity | null {
    if (action.entity != null) {
        return action.entity.id === id ? action.entity : null;
    }

    if (action.entities != null) {
        return action.entities.find((entity: Entity) => entity.id === id);
    }

    return null;
}

function updateEntities<T extends Entity>(state: EntitiesState<T>, action: Events.EntityActions<T>): EntitiesState<T> {
    const updated: {[key: number]: T} = {};

    for (const id in state.data) {
        if (state.data.hasOwnProperty(id) === false) {
            continue;
        }

        const entity = state.data[id];

        for (const key in entity) {
            if (isRelatedEntity(entity[key])) {
                const related = entity[key];
                if (related.table !== action.table || related.id == null) {
                    continue;
                }

                let relatedEntity = getEntityFromAction(action, related.id);
                if (relatedEntity != null) {
                    if (related.linkedKey != null) {
                        // unset related entity if changed in related
                        if (isRelatedEntity(relatedEntity[related.linkedKey])) {
                            if (relatedEntity[related.linkedKey].id !== entity.id) {
                                relatedEntity = null;
                            }
                        } else if (isRelatedEntities(relatedEntity[related.linkedKey])) {
                            if (Object.keys(relatedEntity[related.linkedKey].entities).includes(entity.id!.toString()) === false) {
                                relatedEntity = null;
                            }
                        }
                    }

                    // remove related entry if no longer linked
                    if (relatedEntity != null) {
                        entity[key] = {
                            ...related,
                            entity: relatedEntity
                        };
                    } else {
                        entity[key] = {
                            ...related,
                            id: null,
                            entity: null
                        };
                    }

                    updated[id] = entity;
                }
            } else if (isRelatedEntities(entity[key])) {
                const related = entity[key];
                if (related.table !== action.table) {
                    continue;
                }

                for (const relatedId in related.entities) {
                    if (related.entities.hasOwnProperty(relatedId) === false) {
                        continue;
                    }

                    let relatedEntity = getEntityFromAction(action, parseInt(relatedId));
                    if (relatedEntity != null) {
                        if (related.linkedKey != null) {
                            // unset related entity if changed in related
                            if (isRelatedEntity(relatedEntity[related.linkedKey])) {
                                if (relatedEntity[related.linkedKey].id !== entity.id) {
                                    relatedEntity = null;
                                }
                            } else if (isRelatedEntities(relatedEntity[related.linkedKey])) {
                                if (Object.keys(relatedEntity[related.linkedKey].entities).includes(entity.id!.toString()) === false) {
                                    relatedEntity = null;
                                }
                            }
                        }

                        // remove related entry if no longer linked
                        if (relatedEntity != null) {
                            entity[key] = {
                                ...related,
                                entities: {
                                    ...related.entities,
                                    [relatedId]: relatedEntity
                                }
                            };
                        } else {
                            const { [relatedId]: deletedEntity, ...updatedEntities } = related.entities;

                            entity[key] = {
                                ...related,
                                entities: updatedEntities
                            };
                        }

                        updated[id] = entity;
                    }
                }
            }
        }
    }

    if (Object.keys(updated).length === 0) {
        return state;
    }

    return {
        ...state,
        data: {
            ...state.data,
            ...updated
        }
    };
}

function updateDeletedEntity<T extends Entity>(state: EntitiesState<T>, action: Events.DeleteEntityAction): EntitiesState<T> {
    const updated: {[key: number]: T} = {};

    for (const id in state.data) {
        if (state.data.hasOwnProperty(id) === false) {
            continue;
        }

        const entity = state.data[id];

        for (const key in entity) {
            if (isRelatedEntity(entity[key])) {
                const related = entity[key];
                if (related.table !== action.table || related.id !== action.id) {
                    continue;
                }

                entity[key] = {
                    ...related,
                    id: null,
                    entity: null
                };

                updated[id] = entity;
            } else if (isRelatedEntities(entity[key])) {
                const related = entity[key];
                if (related.table !== action.table) {
                    continue;
                }

                const { [action.id]: deletedEntity, ...updatedEntities } = related.entities;

                entity[key] = {
                    ...related,
                    entities: updatedEntities
                };

                updated[id] = entity;
            }
        }
    }

    if (Object.keys(updated).length === 0) {
        return state;
    }

    return {
        ...state,
        data: {
            ...state.data,
            ...updated
        }
    };
}

function updateRelatedEntity<T extends Entity>(state: EntitiesState<T>, entity: Entity) {
    for (const key in entity) {
        if (isRelatedEntity(entity[key])) {
            const related = entity[key];
            if (related.entity == null || related.linkedKey == null) {
                continue;
            }

            const linkedRelated = related.entity[related.linkedKey];

            if (isRelatedEntity(linkedRelated)) {
                related.entity[related.linkedKey] = {
                    ...linkedRelated,
                    id: entity.id,
                    entity
                };
            } else if (isRelatedEntities(linkedRelated)) {
                related.entity[related.linkedKey] = {
                    ...linkedRelated,
                    entities: {
                        ...linkedRelated.entities,
                        [entity.id as number]: entity
                    }
                };
            }
        } else if (isRelatedEntities(entity[key])) {
            const related = entity[key];
            if (related.linkedKey == null) {
                continue;
            }

            for (const relatedId in related.entities) {
                if (related.entities.hasOwnProperty(relatedId) === false || related.entities[relatedId] == null) {
                    continue;
                }

                const linkedRelated = related.entities[relatedId][related.linkedKey];

                if (isRelatedEntity(linkedRelated)) {
                    related.entities[relatedId][related.linkedKey] = {
                        ...linkedRelated,
                        id: entity.id,
                        entity
                    };
                } else if (isRelatedEntities(linkedRelated)) {
                    related.entities[relatedId][related.linkedKey] = {
                        ...linkedRelated,
                        entities: {
                            ...linkedRelated.entities,
                            [entity.id as number]: entity
                        }
                    };
                }
            }
        }
    }
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
    return (state: EntitiesState<T> = initialState, action: Events.EntityActions<T>): EntitiesState<T> => {
        // update existing entities' relations
        if (action.table !== table) {
            if (state.relatedTables.includes(action.table) === false) {
                return state;
            }

            const type = action.type;
            if (type === Events.DELETE_ENTITY) {
                return updateDeletedEntity<T>(state, action as Events.DeleteEntityAction);
            }

            if (type !== Events.SET_ENTITY && type !== Events.SET_ENTITIES) {
                return state;
            }

            if (type === Events.SET_ENTITIES) {
                const entities = (action as Events.SetEntitiesAction<Entity>).entities;

                for (const id in entities) {
                    if (entities.hasOwnProperty(id)) {
                        updateRelatedEntity<T>(state, entities[id]);
                    }
                }
            } else {
                const entity = (action as Events.SetEntityAction<Entity>).entity;
                updateRelatedEntity<T>(state, entity);
            }

            return updateEntities<T>(state, action);
        }

        switch (action.type) {
            case Events.UPDATING_ENTITIES:
                return {
                    ...state,
                    updating: state.updating + 1
                };

            case Events.UPDATING_ENTITIES_FAILED:
                // TODO: Handle error
                return {
                    ...state,
                    updating: state.updating - 1
                };

            case Events.SET_ENTITY:
                return {
                    ...state,
                    updating: state.updating - 1,
                    relatedTables: getRelatedTables(state.relatedTables, [action.entity]),
                    data: {
                        ...state.data,
                        [action.entity.id as number]: action.entity
                    }
                };

            case Events.SET_ENTITIES:
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

            case Events.DELETE_ENTITY:
                const { [action.id]: removedEntity, ...data } = state.data;

                return {
                    ...state,
                    updating: state.updating - 1,
                    data,
                };

            case Events.CLEAR_ENTITIES:
                return {
                    ...state,
                    data: {}
                };

            default:
                return state;
        }
    };
}
