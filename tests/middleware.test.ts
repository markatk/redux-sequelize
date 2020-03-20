/*
 * File: middleware.test.ts
 * Author: MarkAtk
 * Date: 14.03.20
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

import { middleware, createRelatedEntity, createRelatedEntities } from '../lib';
import { updateEntities, setEntity, setEntities } from '../lib/actions';

const create = (state: object = {}) => {
    const store = {
        getState: jest.fn(() => (state)),
        dispatch: jest.fn()
    };

    const next = jest.fn();

    const invoke = action => middleware(store)(next)(action);

    return {
        store,
        next,
        invoke
    };
}

describe('middleware', () => {
    it('handle unknown action', () => {
        const { next, invoke } = create();
        const action = {
            name: 'TEST_ACTION',
        };

        invoke(action);
        expect(next).toHaveBeenCalledWith(action);
        expect(action).toEqual({ name: 'TEST_ACTION' });
    });

    it('handle irrelevant action', () => {
        const { next, invoke } = create();
        const action = updateEntities('workers');

        invoke(action);
        expect(next).toHaveBeenCalledWith(action);
        expect(action).toEqual(updateEntities('workers'));
    });

    it('handle single entity action', () => {
        const boss = {
            id: 1,
            name: 'Mike',
            workId: 3,
            boss: createRelatedEntity('workers'),
            department: createRelatedEntity('departments', 'workers'),
            projects: createRelatedEntities('projects', 'workers')
        };

        const state = {
            workers: {
                updating: 0,
                data: {
                    [boss.id]: boss
                },
                relatedTables: ['workers', 'departments', 'projects']
            }
        };

        const worker = {
            id: 2,
            name: 'Thomas',
            workId: 55,
            boss: createRelatedEntity('workers', null, boss.id),
            department: createRelatedEntity('departments', 'workers'),
            projects: createRelatedEntities('projects', 'workers')
        };

        const { next, invoke } = create(state);
        const action = setEntity('workers', worker);

        invoke(action);
        expect(next).toHaveBeenCalledWith(action);

        expect(action).toEqual({
            ...setEntity('workers', worker),
            entity: {
                ...worker,
                boss: {
                    ...worker.boss,
                    entity: boss
                }
            }
        });
    });

    it('handle multiple entity action', () => {
        const boss = {
            id: 1,
            name: 'Mike',
            workId: 3,
            boss: createRelatedEntity('workers'),
            department: createRelatedEntity('departments', 'workers'),
            projects: createRelatedEntities('projects', 'workers')
        };

        const state = {
            workers: {
                updating: 0,
                data: {
                    [boss.id]: boss
                },
                relatedTables: ['workers', 'departments', 'projects']
            }
        };

        const worker1 = {
            id: 2,
            name: 'Thomas',
            workId: 55,
            boss: createRelatedEntity('workers', null, boss.id),
            department: createRelatedEntity('departments', 'workers'),
            projects: createRelatedEntities('projects', 'workers')
        };

        const worker2 = {
            id: 3,
            name: 'Steven',
            workId: 67,
            boss: createRelatedEntity('workers', null, boss.id),
            department: createRelatedEntity('departments', 'workers'),
            projects: createRelatedEntities('projects', 'workers')
        }

        const { next, invoke } = create(state);
        const action = setEntities('workers', [worker1, worker2]);

        invoke(action);
        expect(next).toHaveBeenCalledWith(action);

        expect(action).toEqual({
            ...setEntities('workers', [worker1, worker2]),
            entities: [
                {
                    ...worker1,
                    boss: {
                        ...worker1.boss,
                        entity: boss
                    }
                },
                {
                    ...worker2,
                    boss: {
                        ...worker2.boss,
                        entity: boss
                    }
                }
            ]
        });
    });
});
