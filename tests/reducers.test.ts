/*
 * File: reducers.test.ts
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

import { Reducer } from 'redux';

import { reducer, Events, createRelatedEntity, createRelatedEntities } from '../lib';
import { updateEntities, updatingEntitiesFailed, setEntity, setEntities, deleteEntity, clearEntities } from '../lib/actions';
import { Worker } from './entities';

const initialState = {
    updating: 0,
    data: {},
    relatedTables: []
};

const table = 'workers';
let workerReducer: Reducer;

describe('entity reducer', () => {
    beforeEach(() => {
        workerReducer = reducer<Worker>(table);
    });

    it('create valid reducer', () => {
        expect(workerReducer).not.toBeNull();
    });

    it('handle unknown action', () => {
        expect(workerReducer(undefined, {} as Events.EntityActions<Worker>)).toEqual(initialState);
        expect(workerReducer(undefined, { type: 'UNKNOWN' } as unknown as Events.EntityActions<Worker>)).toEqual(initialState);
    });

    it('updating increases counter', () => {
        expect(workerReducer(undefined, updateEntities(table))).toEqual({
            updating: 1,
            data: {},
            relatedTables: []
        });
    });

    it('updating failed decreases counter', () => {
        const state = {
            updating: 1,
            data: {},
            relatedTables: []
        };

        const newState = workerReducer(state, updatingEntitiesFailed(table, null, null));

        expect(newState).not.toBe(state);
        expect(newState).toEqual({
            updating: 0,
            data: {},
            relatedTables: []
        });
    });

    it('set entity action', () => {
        const worker = {
            id: 1,
            name: 'Thomas',
            workId: 55,
            boss: createRelatedEntity('workers'),
            department: createRelatedEntity('departments', 'workers'),
            projects: createRelatedEntities('projects', 'workers')
        };

        const state = {
            updating: 1,
            data: {},
            relatedTables: []
        };

        const newState = workerReducer(state, setEntity(table, worker));

        expect(newState).not.toBe(state);
        expect(newState).toEqual({
            updating: 0,
            data: {
                [worker.id]: worker
            },
            relatedTables: [ 'workers', 'departments', 'projects' ]
        });
    });

    it('set entity action overwrite existing entity', () => {
        const worker = {
            id: 1,
            name: 'Thomas',
            workId: 55,
            boss: createRelatedEntity('workers'),
            department: createRelatedEntity('departments', 'workers'),
            projects: createRelatedEntities('projects', 'workers')
        };

        const state = {
            updating: 1,
            data: {
                [worker.id]: {
                    ...worker,
                    name: 'Mike',
                    workId: 3
                }
            },
            relatedTables: []
        };

        const newState = workerReducer(state, setEntity(table, worker));

        expect(newState).not.toBe(state);
        expect(newState).toEqual({
            updating: 0,
            data: {
                [worker.id]: worker
            },
            relatedTables: [ 'workers', 'departments', 'projects' ]
        });
    });

    it('set entities action', () => {
        const workers = [
            {
                id: 1,
                name: 'Thomas',
                workId: 55,
                boss: createRelatedEntity('workers'),
                department: createRelatedEntity('departments', 'workers'),
                projects: createRelatedEntities('projects', 'workers')
            },
            {
                id: 2,
                name: 'Mike',
                workId: 3,
                boss: createRelatedEntity('workers'),
                department: createRelatedEntity('departments', 'workers'),
                projects: createRelatedEntities('projects', 'workers')
            }
        ];

        const state = {
            updating: 1,
            data: {},
            relatedTables: []
        };

        const newState = workerReducer(state, setEntities(table, workers));

        expect(newState).not.toBe(state);
        expect(newState).toEqual({
            updating: 0,
            data: {
                [workers[0].id]: workers[0],
                [workers[1].id]: workers[1]
            },
            relatedTables: ['workers', 'departments', 'projects']
        });
    });

    it('delete entity action', () => {
        const state = {
            updating: 1,
            data: {
                [1]: {
                    id: 1,
                    name: 'Thomas',
                    workId: 55,
                    boss: createRelatedEntity('workers'),
                    department: createRelatedEntity('departments', 'workers'),
                    projects: createRelatedEntities('projects', 'workers')
                }
            },
            relatedTables: ['workers', 'departments', 'projects']
        };

        const newState = workerReducer(state, deleteEntity(table, 1));

        expect(newState).not.toBe(state);
        expect(newState).toEqual({
            updating: 0,
            data: {},
            relatedTables: ['workers', 'departments', 'projects']
        });
    });

    it('delete invalid entity', () => {
        const state = {
            updating: 1,
            data: {
                [1]: {
                    id: 1,
                    name: 'Thomas',
                    workId: 55,
                    boss: createRelatedEntity('workers'),
                    department: createRelatedEntity('departments', 'workers'),
                    projects: createRelatedEntities('projects', 'workers')
                }
            },
            relatedTables: ['workers', 'departments', 'projects']
        };

        const newState = workerReducer(state, deleteEntity(table, 2));

        expect(newState).not.toBe(state);
        expect(newState).toEqual({
            updating: 0,
            data: {
                [1]: {
                    id: 1,
                    name: 'Thomas',
                    workId: 55,
                    boss: createRelatedEntity('workers'),
                    department: createRelatedEntity('departments', 'workers'),
                    projects: createRelatedEntities('projects', 'workers')
                }
            },
            relatedTables: ['workers', 'departments', 'projects']
        });
    });

    it('update existing entity in state', () => {
        let state = {
            updating: 0,
            data: {
                [1]: {
                    id: 1,
                    name: 'Thomas',
                    workId: 55,
                    boss: createRelatedEntity('workers'),
                    department: createRelatedEntity('departments', 'workers', 1),
                    projects: createRelatedEntities('projects', 'workers')
                }
            },
            relatedTables: ['workers', 'departments', 'projects']
        };

        let newState = workerReducer(state, setEntity('departments', {
            id: 1,
            name: 'Development'
        }));

        expect(newState).not.toBe(state);
        expect(newState).toEqual({
            updating: 0,
            data: {
                [1]: {
                    id: 1,
                    name: 'Thomas',
                    workId: 55,
                    boss: createRelatedEntity('workers'),
                    department: {
                        table: 'departments',
                        id: 1,
                        entity: {
                            id: 1,
                            name: 'Development'
                        },
                        linkedKey: 'workers'
                    },
                    projects: createRelatedEntities('projects', 'workers')
                }
            },
            relatedTables: ['workers', 'departments', 'projects']
        });

        state = {
            updating: 0,
            data: {
                [1]: {
                    id: 1,
                    name: 'Thomas',
                    workId: 55,
                    boss: createRelatedEntity('workers'),
                    department: createRelatedEntity('departments', 'workers', 1),
                    projects: createRelatedEntities('projects', 'workers')
                }
            },
            relatedTables: ['workers', 'departments', 'projects']
        };

        newState = workerReducer(state, setEntities('departments', [
            {
                id: 1,
                name: 'Development'
            }
        ]));

        expect(newState).not.toBe(state);
        expect(newState).toEqual({
            updating: 0,
            data: {
                [1]: {
                    id: 1,
                    name: 'Thomas',
                    workId: 55,
                    boss: createRelatedEntity('workers'),
                    department: {
                        table: 'departments',
                        id: 1,
                        entity: {
                            id: 1,
                            name: 'Development'
                        },
                        linkedKey: 'workers'
                    },
                    projects: createRelatedEntities('projects', 'workers')
                }
            },
            relatedTables: ['workers', 'departments', 'projects']
        });

        state = {
            updating: 0,
            data: {
                [1]: {
                    id: 1,
                    name: 'Thomas',
                    workId: 55,
                    boss: createRelatedEntity('workers'),
                    department: createRelatedEntity('departments', 'workers'),
                    projects: createRelatedEntities('projects', 'workers', [1])
                }
            },
            relatedTables: ['workers', 'departments', 'projects']
        };

        newState = workerReducer(state, setEntity('projects', {
            id: 1,
            name: 'Project Deep'
        }));

        expect(newState).not.toBe(state);
        expect(newState).toEqual({
            updating: 0,
            data: {
                [1]: {
                    id: 1,
                    name: 'Thomas',
                    workId: 55,
                    boss: createRelatedEntity('workers'),
                    department: createRelatedEntity('departments', 'workers'),
                    projects: {
                        table: 'projects',
                        entities: {
                            [1]: {
                                id: 1,
                                name: 'Project Deep'
                            }
                        },
                        linkedKey: 'workers'
                    }
                }
            },
            relatedTables: ['workers', 'departments', 'projects']
        });
    });

    it('no update on existing entity in state', () => {
        let state = {
            updating: 0,
            data: {
                [1]: {
                    id: 1,
                    name: 'Thomas',
                    workId: 55,
                    boss: createRelatedEntity('workers'),
                    department: createRelatedEntity('departments', 'workers', 1),
                    projects: createRelatedEntities('projects', 'workers')
                }
            },
            relatedTables: ['workers', 'departments', 'projects']
        };

        let newState = workerReducer(state, setEntity('projects', {
            id: 1,
            name: 'Project Deep'
        }));

        expect(newState).toBe(state);
        expect(newState).toEqual({
            updating: 0,
            data: {
                [1]: {
                    id: 1,
                    name: 'Thomas',
                    workId: 55,
                    boss: createRelatedEntity('workers'),
                    department: createRelatedEntity('departments', 'workers', 1),
                    projects: createRelatedEntities('projects', 'workers')
                }
            },
            relatedTables: ['workers', 'departments', 'projects']
        });

        state = {
            updating: 0,
            data: {
                [1]: {
                    id: 1,
                    name: 'Thomas',
                    workId: 55,
                    boss: createRelatedEntity('workers'),
                    department: createRelatedEntity('departments', 'workers', 1),
                    projects: createRelatedEntities('projects', 'workers')
                }
            },
            relatedTables: ['workers', 'departments', 'projects']
        };

        newState = workerReducer(state, updateEntities('projects'));

        expect(newState).toBe(state);
        expect(newState).toEqual({
            updating: 0,
            data: {
                [1]: {
                    id: 1,
                    name: 'Thomas',
                    workId: 55,
                    boss: createRelatedEntity('workers'),
                    department: createRelatedEntity('departments', 'workers', 1),
                    projects: createRelatedEntities('projects', 'workers')
                }
            },
            relatedTables: ['workers', 'departments', 'projects']
        });
    });

    it('do not update entity on invalid related entity', () => {
        const state = {
            updating: 0,
            data: {
                [1]: {
                    id: 1,
                    name: 'Thomas',
                    workId: 55,
                    boss: createRelatedEntity('workers'),
                    department: createRelatedEntity('departments', 'workers', 1),
                    projects: createRelatedEntities('projects', 'workers')
                }
            },
            relatedTables: ['workers', 'departments', 'projects']
        };

        const newState = workerReducer(state, setEntity('departments', {
            id: 2,
            name: 'Top-Secret'
        }));

        expect(newState).toBe(state);
        expect(newState).toEqual({
            updating: 0,
            data: {
                [1]: {
                    id: 1,
                    name: 'Thomas',
                    workId: 55,
                    boss: createRelatedEntity('workers'),
                    department: createRelatedEntity('departments', 'workers', 1),
                    projects: createRelatedEntities('projects', 'workers')
                }
            },
            relatedTables: ['workers', 'departments', 'projects']
        });
    });

    it('delete related entity', () => {
        let state = {
            updating: 0,
            data: {
                [1]: {
                    id: 1,
                    name: 'Thomas',
                    workId: 55,
                    boss: createRelatedEntity('workers'),
                    department: {
                        table: 'departments',
                        id: 1,
                        entity: {
                            id: 1,
                            name: 'Development'
                        },
                        linkedKey: 'workers'
                    },
                    projects: createRelatedEntities('projects', 'workers')
                }
            },
            relatedTables: ['workers', 'departments', 'projects']
        };

        let newState = workerReducer(state, deleteEntity('departments', 1));

        expect(newState).not.toBe(state);
        expect(newState).toEqual({
            updating: 0,
            data: {
                [1]: {
                    id: 1,
                    name: 'Thomas',
                    workId: 55,
                    boss: createRelatedEntity('workers'),
                    department: createRelatedEntity('departments', 'workers'),
                    projects: createRelatedEntities('projects', 'workers')
                }
            },
            relatedTables: ['workers', 'departments', 'projects']
        });

        state = {
            updating: 0,
            data: {
                [1]: {
                    id: 1,
                    name: 'Thomas',
                    workId: 55,
                    boss: createRelatedEntity('workers'),
                    department: createRelatedEntity('departments', 'workers'),
                    projects: {
                        table: 'projects',
                        entities: {
                            [1]: {
                                id: 1,
                                name: 'Project Deep'
                            },
                            [2]: {
                                id: 2,
                                name: 'Project Unknown'
                            }
                        }
                    }
                }
            },
            relatedTables: ['workers', 'departments', 'projects']
        };

        newState = workerReducer(state, deleteEntity('projects', 1));

        expect(newState).not.toBe(state);
        expect(newState).toEqual({
            updating: 0,
            data: {
                [1]: {
                    id: 1,
                    name: 'Thomas',
                    workId: 55,
                    boss: createRelatedEntity('workers'),
                    department: createRelatedEntity('departments', 'workers'),
                    projects: {
                        table: 'projects',
                        entities: {
                            [2]: {
                                id: 2,
                                name: 'Project Unknown'
                            }
                        }
                    }
                }
            },
            relatedTables: ['workers', 'departments', 'projects']
        });
    });

    it('update double linked entity relation', () => {
        const worker = {
            id: 1,
            name: 'Thomas',
            workId: 55,
            boss: createRelatedEntity('workers'),
            department: createRelatedEntity('departments', 'workers'),
            projects: createRelatedEntities('projects', 'workers')
        };

        const department = {
            id: 1,
            name: 'Development',
            workers: {
                table: 'workers',
                linkedKey: 'department',
                entities: {
                    [1]: worker
                }
            }
        };

        const state = {
            updating: 0,
            data: {
                [1]: worker
            },
            relatedTables: ['workers', 'departments', 'projects']
        };

        const newState = workerReducer(state, setEntity('departments', department));

        expect(newState).not.toBe(state);
        expect(newState).toEqual({
            updating: 0,
            data: {
                [1]: {
                    ...worker,
                    department: {
                        ...worker.department,
                        id: 1,
                        entity: department
                    }
                }
            },
            relatedTables: ['workers', 'departments', 'projects']
        });
    });

    it('move double linked entity relation', () => {
        const workers = [
            {
                id: 1,
                name: 'Thomas',
                workId: 55,
                boss: createRelatedEntity('workers'),
                department: createRelatedEntity('departments', 'workers'),
                projects: createRelatedEntities('projects', 'workers')
            },
            {
                id: 2,
                name: 'Mike',
                workId: 3,
                boss: createRelatedEntity('workers'),
                department: createRelatedEntity('departments', 'workers'),
                projects: createRelatedEntities('projects', 'workers')
            }
        ];

        const department = {
            id: 1,
            name: 'Development',
            workers: {
                table: 'workers',
                linkedKey: 'department',
                entities: {
                    [workers[1].id]: workers[1]
                }
            }
        };

        workers[0].department.id = department.id;
        workers[0].department.entity = department;

        const state = {
            updating: 0,
            data: {
                [workers[0].id]: workers[0],
                [workers[1].id]: workers[1]
            },
            relatedTables: ['workers', 'departments', 'projects']
        };

        const newState = workerReducer(state, setEntity('departments', department));

        expect(newState).not.toBe(state);
        expect(newState).toEqual({
            updating: 0,
            data: {
                [workers[0].id]: {
                    ...workers[0],
                    department: {
                        ...workers[0].department,
                        id: null,
                        entity: null
                    }
                },
                [workers[1].id]: {
                    ...workers[1],
                    department: {
                        ...workers[1].department,
                        id: 1,
                        entity: department
                    }
                }
            },
            relatedTables: ['workers', 'departments', 'projects']
        });
    });

    it('update double linked entities relation', () => {
        const worker = {
            id: 1,
            name: 'Thomas',
            workId: 55,
            boss: createRelatedEntity('workers'),
            department: createRelatedEntity('departments', 'workers'),
            projects: createRelatedEntities('projects', 'workers')
        };

        const project = {
            id: 1,
            name: 'Project Deep',
            workers: {
                table: 'workers',
                linkedKey: 'projects',
                entities: {
                    [1]: worker
                }
            }
        };

        const state = {
            updating: 0,
            data: {
                [1]: worker
            },
            relatedTables: ['workers', 'departments', 'projects']
        };

        const newState = workerReducer(state, setEntity('projects', project));

        expect(newState).not.toBe(state);
        expect(newState).toEqual({
            updating: 0,
            data: {
                [1]: {
                    ...worker,
                    projects: {
                        ...worker.projects,
                        entities: {
                            [project.id]: project
                        }
                    }
                }
            },
            relatedTables: ['workers', 'departments', 'projects']
        });
    });

    it('remove double linked entity relation', () => {
        const worker = {
            id: 1,
            name: 'Thomas',
            workId: 55,
            boss: createRelatedEntity('workers'),
            department: createRelatedEntity('departments', 'workers', 1),
            projects: createRelatedEntities('projects', 'workers')
        };

        const department = {
            id: 1,
            name: 'Development',
            workers: {
                table: 'workers',
                linkedKey: 'department',
                entities: {
                    [1]: worker
                }
            }
        };

        worker.department.entity = department;

        const state = {
            updating: 0,
            data: {
                [1]: worker
            },
            relatedTables: ['workers', 'departments', 'projects']
        };

        const newState = workerReducer(state, setEntity('departments', {
            ...department,
            workers: {
                ...department.workers,
                entities: {}
            }
        }));

        expect(newState).not.toBe(state);
        expect(newState).toEqual({
            updating: 0,
            data: {
                [1]: {
                    ...worker,
                    department: {
                        ...worker.department,
                        id: null,
                        entity: null
                    }
                }
            },
            relatedTables: ['workers', 'departments', 'projects']
        });
    });

    it('remove double linked entities relation', () => {
        const worker = {
            id: 1,
            name: 'Thomas',
            workId: 55,
            boss: createRelatedEntity('workers'),
            department: createRelatedEntity('departments', 'workers'),
            projects: createRelatedEntities('projects', 'workers', [1])
        };

        const project = {
            id: 1,
            name: 'Project Deep',
            workers: {
                table: 'workers',
                linkedKey: 'projects',
                entities: {
                    [1]: worker
                }
            }
        };

        worker.projects.entities[1] = project;

        const state = {
            updating: 0,
            data: {
                [1]: worker
            },
            relatedTables: ['workers', 'departments', 'projects']
        };

        const newState = workerReducer(state, setEntity('projects', {
            ...project,
            workers: {
                ...project.workers,
                entities: {}
            }
        }));

        expect(newState).not.toBe(state);
        expect(newState).toEqual({
            updating: 0,
            data: {
                [1]: {
                    ...worker,
                    projects: {
                        ...worker.projects,
                        entities: {}
                    }
                }
            },
            relatedTables: ['workers', 'departments', 'projects']
        });
    });

    it('delete double linked entity', () => {
        const worker = {
            id: 1,
            name: 'Thomas',
            workId: 55,
            boss: createRelatedEntity('workers'),
            department: createRelatedEntity('departments', 'workers', 1),
            projects: createRelatedEntities('projects', 'workers')
        };

        const department = {
            id: 1,
            name: 'Development',
            workers: {
                table: 'workers',
                linkedKey: 'department',
                entities: {}
            }
        };

        worker.department.entity = department;

        const state = {
            updating: 0,
            data: {
                [1]: worker
            },
            relatedTables: ['workers', 'departments', 'projects']
        };

        const newState = workerReducer(state, deleteEntity('departments', 1));

        expect(newState).not.toBe(state);
        expect(newState).toEqual({
            updating: 0,
            data: {
                [1]: {
                    ...worker,
                    department: {
                        ...worker.department,
                        id: null,
                        entity: null
                    }
                }
            },
            relatedTables: ['workers', 'departments', 'projects']
        });
    });

    it('update double linked entities relation', () => {
        const worker = {
            id: 1,
            name: 'Thomas',
            workId: 55,
            boss: createRelatedEntity('workers'),
            department: createRelatedEntity('departments', 'workers'),
            projects: createRelatedEntities('projects', 'workers', [1])
        };

        const project = {
            id: 1,
            name: 'Project Deep',
            workers: {
                table: 'workers',
                linkedKey: 'projects',
                entities: {
                    [1]: worker
                }
            }
        };

        worker.projects.entities[1] = project;

        const state = {
            updating: 0,
            data: {
                [1]: worker
            },
            relatedTables: ['workers', 'departments', 'projects']
        };

        const newState = workerReducer(state, deleteEntity('projects', 1));

        expect(newState).not.toBe(state);
        expect(newState).toEqual({
            updating: 0,
            data: {
                [1]: {
                    ...worker,
                    projects: {
                        ...worker.projects,
                        entities: {}
                    }
                }
            },
            relatedTables: ['workers', 'departments', 'projects']
        });
    });

    it('updating state entity related entity immutable', () => {
        const originalDepartment = createRelatedEntity('departments', 'workers');

        const worker = {
            id: 1,
            name: 'Thomas',
            workId: 55,
            boss: createRelatedEntity('workers'),
            department: originalDepartment,
            projects: createRelatedEntities('projects', 'workers')
        };

        const department = {
            id: 1,
            name: 'Development',
            workers: createRelatedEntities('workers', 'department', [1])
        };

        department.workers.entities[1] = worker;

        const state = {
            updating: 0,
            data: {
                [worker.id]: worker
            },
            relatedTables: ['workers', 'departments', 'projects']
        };

        const newState = workerReducer(state, setEntity('departments', department));

        expect(newState).not.toBe(state);
        expect(newState).toEqual({
            updating: 0,
            data: {
                [worker.id]: {
                    ...worker,
                    department: {
                        ...worker.department,
                        id: department.id,
                        entity: department
                    }
                }
            },
            relatedTables: ['workers', 'departments', 'projects']
        });

        // Verify department is actually a new object
        expect(worker.department).not.toBe(originalDepartment);
    });

    it('updating state entity related entities immutable', () => {
        const originalProjects = createRelatedEntities('projects', 'workers');

        const worker = {
            id: 1,
            name: 'Thomas',
            workId: 55,
            boss: createRelatedEntity('workers'),
            department: createRelatedEntity('departments', 'workers'),
            projects: originalProjects
        };

        const project = {
            id: 1,
            name: 'Project Deep',
            workers: createRelatedEntities('workers', 'projects', [1])
        };

        project.workers.entities[1] = worker;

        const state = {
            updating: 0,
            data: {
                [worker.id]: worker
            },
            relatedTables: ['workers', 'departments', 'projects']
        };

        const newState = workerReducer(state, setEntity('projects', project));

        expect(newState).not.toBe(state);
        expect(newState).toEqual({
            updating: 0,
            data: {
                [worker.id]: {
                    ...worker,
                    projects: {
                        ...worker.projects,
                        entities: {
                            ...worker.projects.entities,
                            [project.id]: project
                        }
                    }
                }
            },
            relatedTables: ['workers', 'departments', 'projects']
        });

        // Verify projects is actually a new object
        expect(worker.projects).not.toBe(originalProjects);
    });

    it('deleting state entity related entity immutable', () => {
        const originalDepartment = createRelatedEntity('departments', 'workers', 1);

        const worker = {
            id: 1,
            name: 'Thomas',
            workId: 55,
            boss: createRelatedEntity('workers'),
            department: originalDepartment,
            projects: createRelatedEntities('projects', 'workers')
        };

        const department = {
            id: 1,
            name: 'Development',
            workers: createRelatedEntities('workers', 'department', [1])
        };

        worker.department.entity = department;
        department.workers.entities[1] = worker;

        const state = {
            updating: 0,
            data: {
                [worker.id]: worker
            },
            relatedTables: ['workers', 'departments', 'projects']
        };

        const newState = workerReducer(state, deleteEntity('departments', 1));

        expect(newState).not.toBe(state);
        expect(newState).toEqual({
            updating: 0,
            data: {
                [worker.id]: {
                    ...worker,
                    department: {
                        ...worker.department,
                        id: null,
                        entity: null
                    }
                }
            },
            relatedTables: ['workers', 'departments', 'projects']
        });

        // Verify department is actually a new object
        expect(worker.department).not.toBe(originalDepartment);
    });

    it('deleting state entity related entities immutable', () => {
        const originalProjects = createRelatedEntities('projects', 'workers', [1]);

        const worker = {
            id: 1,
            name: 'Thomas',
            workId: 55,
            boss: createRelatedEntity('workers'),
            department: createRelatedEntity('departments', 'workers'),
            projects: originalProjects
        };

        const project = {
            id: 1,
            name: 'Project Deep',
            workers: createRelatedEntities('workers', 'projects', [1])
        };

        worker.projects.entities[1] = project;
        project.workers.entities[1] = worker;

        const state = {
            updating: 0,
            data: {
                [worker.id]: worker
            },
            relatedTables: ['workers', 'departments', 'projects']
        };

        const newState = workerReducer(state, deleteEntity('projects', 1));

        expect(newState).not.toBe(state);
        expect(newState).toEqual({
            updating: 0,
            data: {
                [worker.id]: {
                    ...worker,
                    projects: {
                        ...worker.projects,
                        entities: {}
                    }
                }
            },
            relatedTables: ['workers', 'departments', 'projects']
        });

        // Verify projects is actually a new object
        expect(worker.projects).not.toBe(originalProjects);
    });

    it('clear entities from store', () => {
        const state = {
            updating: 1,
            data: {
                [1]: {
                    id: 1,
                    name: 'Thomas',
                    workId: 55,
                    boss: createRelatedEntity('workers'),
                    department: createRelatedEntity('departments', 'workers'),
                    projects: createRelatedEntities('projects', 'workers')
                }
            },
            relatedTables: ['workers', 'departments', 'projects']
        };

        const newState = workerReducer(state, clearEntities(table));

        expect(newState).not.toBe(state);
        expect(newState).toEqual({
            updating: 1,
            data: {},
            relatedTables: ['workers', 'departments', 'projects']
        });
    });
});
