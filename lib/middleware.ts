/*
 * File: middleware.ts
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

import { Middleware } from 'redux';
import _ from 'lodash';

import { SET_ENTITY, SET_ENTITIES } from './events';
import { Entity } from './types';
import { isRelatedEntity, isRelatedEntities } from './helpers';

function updateEntity(state: any, entity: Entity) {
    for (const key in entity) {
        if (entity.hasOwnProperty(key) === false) {
            continue;
        }

        if (isRelatedEntity(entity[key])) {
            const related = entity[key];
            if (related.id == null) {
                continue;
            }

            related.entity = _.get(state, [related.table, 'data', related.id]);
        } else if (isRelatedEntities(entity[key])) {
            const related = entity[key];

            for (const id in related.entities) {
                if (related.entities.hasOwnProperty(id)) {
                    related.entities[id] = _.get(state, [related.table, 'data', id]);
                }
            }
        }
    }
}

const middleware: Middleware = store => next => action => {
    if ('type' in action === false) {
        return next(action);
    }

    // update entities in action
    const type = action.type;
    if (type !== SET_ENTITY && type !== SET_ENTITIES) {
        return next(action);
    }

    const state = store.getState();

    if ('entities' in action) {
        for (const entity of action.entities) {
            updateEntity(state, entity);
        }
    } else {
        updateEntity(state, action.entity);
    }

    return next(action);
};

export default middleware;
