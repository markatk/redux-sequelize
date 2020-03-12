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

import { Includeable as SequelizeIncludeable, Sequelize } from 'sequelize';

import { Includeable } from './types';

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
