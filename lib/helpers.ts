/*
 * File: helpers.ts
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

import { Includeable as SequelizeIncludeable, Sequelize, Model } from 'sequelize';

import { Includeable, Entity, RelatedEntity, RelatedEntities } from './types';

export function isRelatedEntity(value: {[key: string]: any}): boolean {
    if (value instanceof Object === false) {
        return false;
    }

    if ('table' in value === false || 'id' in value === false || 'entity' in value === false) {
        return false;
    }

    return value[`table`] != null;
}

export function isRelatedEntities(value: {[key: string]: any}): boolean {
    if (value instanceof Object === false) {
        return false;
    }

    if ('table' in value === false || 'entities' in value === false) {
        return false;
    }

    return value[`table`] != null && value[`entities`] != null;
}

export function includeablesToSequelizeInclude(sequelize: Sequelize, includeables: Includeable[]): SequelizeIncludeable[] {
    return includeables.map(includeable => ({
        as: includeable.key,
        model: sequelize.model(includeable.table),
        attributes: includeable.toEntity == null ? ['id'] : undefined
    }));
}

export function includeablesToEntityStore(includeables: Includeable[]): {[table: string]: Entity[]} {
    return includeables
        .filter(includeable => includeable.toEntity != null)
        .reduce((data: {[table: string]: Entity[]}, includeable) => {
            data[includeable.table] = [];

            return data;
        }, {});
}

export function mapRelatedEntity<T extends Entity>(table: string, data: T, linkedKey: string | null = null): RelatedEntity<T> {
    return {
        table,
        id: data != null ? data.get('id') as number : null,
        entity: null,
        linkedKey
    };
}

export function createRelatedEntity(table: string, linkedKey: string | null = null, id: number | null = null): RelatedEntity<Entity> {
    return {
        table,
        id,
        entity: null,
        linkedKey
    };
}

export function mapRelatedEntities<T extends Entity>(table: string, data: T[], linkedKey: string | null = null): RelatedEntities<T> {
    let entities = {};
    if (data != null) {
        entities = data.reduce((ent: {[id: number]: T | null}, entity: T) => {
            ent[entity.get('id') as number] = null;

            return ent;
        }, {});
    }

    return {
        table,
        entities,
        linkedKey
    };
}

export function createRelatedEntities(table: string, linkedKey: string | null = null, ids: number[] = []): RelatedEntities<Entity> {
    return {
        table,
        entities: ids.reduce((ent: {[key: number]: Entity | null}, id) => {
            ent[id] = null;

            return ent;
        }, {}),
        linkedKey
    };
}

export function arrayEquals(arr1: any[], arr2: any[]): boolean {
    if (arr1 == null || arr2 == null || arr1.length !== arr2.length) {
        return false;
    }

    for (let i = 0; i < arr1.length; i++) {
        if (arr1[i] != arr2[i]) {
            return false;
        }
    }

    return true;
}
