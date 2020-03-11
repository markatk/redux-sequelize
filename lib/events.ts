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

import { Entity } from './entity';

export const UPDATING_ENTITIES = 'RS_UPDATING_ENTITIES';
export const UPDATING_ENTITIES_FAILED = 'RS_UPDATING_ENTITIES_FAILED';
export const CREATE_ENTITY = 'RS_CREATE_ENTITY';
export const GET_ENTITY = 'RS_GET_ENTITY';
export const GET_ENTITIES = 'RS_GET_ENTITIES';
export const SET_ENTITY = 'RS_SET_ENTITY';
export const DELETE_ENTITY = 'RS_DELETE_ENTITY';

interface UpdatingEntitiesAction {
    type: typeof UPDATING_ENTITIES;
    table: string;
}

interface UpdatingEntitiesFailedAction {
    type: typeof UPDATING_ENTITIES_FAILED;
    table: string;
    message: string;
    action: string;
    data?: any;
    error?: any;
}

interface CreateEntityAction<T extends Entity> {
    type: typeof CREATE_ENTITY;
    table: string;
    entity: T;
}

interface GetEntityAction<T extends Entity> {
    type: typeof GET_ENTITY;
    table: string;
    entity: T;
}

interface GetAllEntitiesAction<T extends Entity> {
    type: typeof GET_ENTITIES;
    table: string;
    entities: T[];
}

interface SetEntityAction<T extends Entity> {
    type: typeof SET_ENTITY;
    table: string;
    entity: T;
}

interface DeleteEntityAction {
    type: typeof DELETE_ENTITY;
    table: string;
    key: number;
}

export type EntityActions<T extends Entity> = UpdatingEntitiesAction | UpdatingEntitiesFailedAction | CreateEntityAction<T> | GetEntityAction<T> |
    GetAllEntitiesAction<T> | SetEntityAction<T> | DeleteEntityAction;
