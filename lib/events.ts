/*
 * File: events.ts
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

import { Entity } from './types';

export const UPDATING_ENTITIES = 'RS_UPDATING_ENTITIES';
export const UPDATING_ENTITIES_FAILED = 'RS_UPDATING_ENTITIES_FAILED';
export const SET_ENTITY = 'RS_SET_ENTITY';
export const SET_ENTITIES = 'RS_SET_ENTITIES';
export const DELETE_ENTITY = 'RS_DELETE_ENTITY';
export const CLEAR_ENTITIES = 'RS_CLEAR_ENTITIES';

export interface UpdatingEntitiesAction {
    type: typeof UPDATING_ENTITIES;
    table: string;
}

export interface UpdatingEntitiesFailedAction {
    type: typeof UPDATING_ENTITIES_FAILED;
    table: string;
    message: string;
    action: string;
    data?: any;
}

export interface SetEntityAction<T extends Entity> {
    type: typeof SET_ENTITY;
    table: string;
    entity: T;
}

export interface SetEntitiesAction<T extends Entity> {
    type: typeof SET_ENTITIES;
    table: string;
    entities: T[];
}

export interface DeleteEntityAction {
    type: typeof DELETE_ENTITY;
    table: string;
    id: number;
}

export interface ClearEntitiesAction {
    type: typeof CLEAR_ENTITIES;
    table: string;
}

export type EntityActions<T extends Entity> = UpdatingEntitiesAction | UpdatingEntitiesFailedAction | SetEntityAction<T> | SetEntitiesAction<T> |
    DeleteEntityAction | ClearEntitiesAction;
