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

import { reducer, Events } from '../lib';
import { updateEntities, updatingEntitiesFailed, setEntity, setEntities, deleteEntity } from '../lib/actions';
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
        expect(workerReducer({
            updating: 1,
            data: {},
            relatedTables: []
        }, updatingEntitiesFailed(table, null, null))).toEqual({
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
            boss: {
                table: 'workers',
                id: null,
                entity: null
            },
            department: {
                table: 'departments',
                id: null,
                entity: null
            },
            projects: {
                table: 'projects',
                entities: {}
            }
        };

        expect(workerReducer({
            updating: 1,
            data: {},
            relatedTables: []
        }, setEntity(table, worker))).toEqual({
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
            boss: {
                table: 'workers',
                id: null,
                entity: null
            },
            department: {
                table: 'departments',
                id: null,
                entity: null
            },
            projects: {
                table: 'projects',
                entities: {}
            }
        };

        expect(workerReducer({
            updating: 1,
            data: {
                [worker.id]: {
                    ...worker,
                    name: 'Mike',
                    workId: 3
                }
            },
            relatedTables: []
        }, setEntity(table, worker))).toEqual({
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
                boss: {
                    table: 'workers',
                    id: null,
                    entity: null
                },
                department: {
                    table: 'departments',
                    id: null,
                    entity: null
                },
                projects: {
                    table: 'projects',
                    entities: {}
                }
            },
            {
                id: 2,
                name: 'Mike',
                workId: 3,
                boss: {
                    table: 'workers',
                    id: null,
                    entity: null
                },
                department: {
                    table: 'departments',
                    id: null,
                    entity: null
                },
                projects: {
                    table: 'projects',
                    entities: {}
                }
            }
        ];

        expect(workerReducer({
            updating: 1,
            data: {},
            relatedTables: []
        }, setEntities(table, workers))).toEqual({
            updating: 0,
            data: {
                [workers[0].id]: workers[0],
                [workers[1].id]: workers[1]
            },
            relatedTables: ['workers', 'departments', 'projects']
        });
    });

    it('delete entity action', () => {
        expect(workerReducer({
            updating: 1,
            data: {
                [1]: {
                    id: 1,
                    name: 'Thomas',
                    workId: 55,
                    boss: {
                        table: 'workers',
                        id: null,
                        entity: null
                    },
                    department: {
                        table: 'departments',
                        id: null,
                        entity: null
                    },
                    projects: {
                        table: 'projects',
                        entities: {}
                    }
                }
            },
            relatedTables: ['workers', 'departments', 'projects']
        }, deleteEntity(table, 1))).toEqual({
            updating: 0,
            data: {},
            relatedTables: ['workers', 'departments', 'projects']
        });
    });

    it('delete invalid entity', () => {
        expect(workerReducer({
            updating: 1,
            data: {
                [1]: {
                    id: 1,
                    name: 'Thomas',
                    workId: 55,
                    boss: {
                        table: 'workers',
                        id: null,
                        entity: null
                    },
                    department: {
                        table: 'departments',
                        id: null,
                        entity: null
                    },
                    projects: {
                        table: 'projects',
                        entities: {}
                    }
                }
            },
            relatedTables: ['workers', 'departments', 'projects']
        }, deleteEntity(table, 2))).toEqual({
            updating: 0,
            data: {
                [1]: {
                    id: 1,
                    name: 'Thomas',
                    workId: 55,
                    boss: {
                        table: 'workers',
                        id: null,
                        entity: null
                    },
                    department: {
                        table: 'departments',
                        id: null,
                        entity: null
                    },
                    projects: {
                        table: 'projects',
                        entities: {}
                    }
                }
            },
            relatedTables: ['workers', 'departments', 'projects']
        });
    });

    it('update existing entity in state', () => {
        expect(workerReducer({
            updating: 0,
            data: {
                [1]: {
                    id: 1,
                    name: 'Thomas',
                    workId: 55,
                    boss: {
                        table: 'workers',
                        id: null,
                        entity: null
                    },
                    department: {
                        table: 'departments',
                        id: 1,
                        entity: null
                    },
                    projects: {
                        table: 'projects',
                        entities: {}
                    }
                }
            },
            relatedTables: ['workers', 'departments', 'projects']
        }, setEntity('departments', {
            id: 1,
            name: 'Development'
        }))).toEqual({
            updating: 0,
            data: {
                [1]: {
                    id: 1,
                    name: 'Thomas',
                    workId: 55,
                    boss: {
                        table: 'workers',
                        id: null,
                        entity: null
                    },
                    department: {
                        table: 'departments',
                        id: 1,
                        entity: {
                            id: 1,
                            name: 'Development'
                        }
                    },
                    projects: {
                        table: 'projects',
                        entities: {}
                    }
                }
            },
            relatedTables: ['workers', 'departments', 'projects']
        });

        expect(workerReducer({
            updating: 0,
            data: {
                [1]: {
                    id: 1,
                    name: 'Thomas',
                    workId: 55,
                    boss: {
                        table: 'workers',
                        id: null,
                        entity: null
                    },
                    department: {
                        table: 'departments',
                        id: 1,
                        entity: null
                    },
                    projects: {
                        table: 'projects',
                        entities: {}
                    }
                }
            },
            relatedTables: ['workers', 'departments', 'projects']
        }, setEntities('departments', [
            {
                id: 1,
                name: 'Development'
            }
        ]))).toEqual({
            updating: 0,
            data: {
                [1]: {
                    id: 1,
                    name: 'Thomas',
                    workId: 55,
                    boss: {
                        table: 'workers',
                        id: null,
                        entity: null
                    },
                    department: {
                        table: 'departments',
                        id: 1,
                        entity: {
                            id: 1,
                            name: 'Development'
                        }
                    },
                    projects: {
                        table: 'projects',
                        entities: {}
                    }
                }
            },
            relatedTables: ['workers', 'departments', 'projects']
        });

        expect(workerReducer({
            updating: 0,
            data: {
                [1]: {
                    id: 1,
                    name: 'Thomas',
                    workId: 55,
                    boss: {
                        table: 'workers',
                        id: null,
                        entity: null
                    },
                    department: {
                        table: 'departments',
                        id: null,
                        entity: null
                    },
                    projects: {
                        table: 'projects',
                        entities: {
                            [1]: null
                        }
                    }
                }
            },
            relatedTables: ['workers', 'departments', 'projects']
        }, setEntity('projects', {
            id: 1,
            name: 'Project Deep'
        }))).toEqual({
            updating: 0,
            data: {
                [1]: {
                    id: 1,
                    name: 'Thomas',
                    workId: 55,
                    boss: {
                        table: 'workers',
                        id: null,
                        entity: null
                    },
                    department: {
                        table: 'departments',
                        id: null,
                        entity: null
                    },
                    projects: {
                        table: 'projects',
                        entities: {
                            [1]: {
                                id: 1,
                                name: 'Project Deep'
                            }
                        }
                    }
                }
            },
            relatedTables: ['workers', 'departments', 'projects']
        });
    });

    it('no update on existing entity in state', () => {
        expect(workerReducer({
            updating: 0,
            data: {
                [1]: {
                    id: 1,
                    name: 'Thomas',
                    workId: 55,
                    boss: {
                        table: 'workers',
                        id: null,
                        entity: null
                    },
                    department: {
                        table: 'departments',
                        id: 1,
                        entity: null
                    },
                    projects: {
                        table: 'projects',
                        entities: {}
                    }
                }
            },
            relatedTables: ['workers', 'departments', 'projects']
        }, setEntity('projects', {
            id: 1,
            name: 'Project Deep'
        }))).toEqual({
            updating: 0,
            data: {
                [1]: {
                    id: 1,
                    name: 'Thomas',
                    workId: 55,
                    boss: {
                        table: 'workers',
                        id: null,
                        entity: null
                    },
                    department: {
                        table: 'departments',
                        id: 1,
                        entity: null
                    },
                    projects: {
                        table: 'projects',
                        entities: {}
                    }
                }
            },
            relatedTables: ['workers', 'departments', 'projects']
        });

        expect(workerReducer({
            updating: 0,
            data: {
                [1]: {
                    id: 1,
                    name: 'Thomas',
                    workId: 55,
                    boss: {
                        table: 'workers',
                        id: null,
                        entity: null
                    },
                    department: {
                        table: 'departments',
                        id: 1,
                        entity: null
                    },
                    projects: {
                        table: 'projects',
                        entities: {}
                    }
                }
            },
            relatedTables: ['workers', 'departments', 'projects']
        }, updateEntities('projects'))).toEqual({
            updating: 0,
            data: {
                [1]: {
                    id: 1,
                    name: 'Thomas',
                    workId: 55,
                    boss: {
                        table: 'workers',
                        id: null,
                        entity: null
                    },
                    department: {
                        table: 'departments',
                        id: 1,
                        entity: null
                    },
                    projects: {
                        table: 'projects',
                        entities: {}
                    }
                }
            },
            relatedTables: ['workers', 'departments', 'projects']
        });
    });

    it('do not update entity on invalid related entity', () => {
        expect(workerReducer({
            updating: 0,
            data: {
                [1]: {
                    id: 1,
                    name: 'Thomas',
                    workId: 55,
                    boss: {
                        table: 'workers',
                        id: null,
                        entity: null
                    },
                    department: {
                        table: 'departments',
                        id: 1,
                        entity: null
                    },
                    projects: {
                        table: 'projects',
                        entities: {}
                    }
                }
            },
            relatedTables: ['workers', 'departments', 'projects']
        }, setEntity('departments', {
            id: 2,
            name: 'Top-Secret'
        }))).toEqual({
            updating: 0,
            data: {
                [1]: {
                    id: 1,
                    name: 'Thomas',
                    workId: 55,
                    boss: {
                        table: 'workers',
                        id: null,
                        entity: null
                    },
                    department: {
                        table: 'departments',
                        id: 1,
                        entity: null
                    },
                    projects: {
                        table: 'projects',
                        entities: {}
                    }
                }
            },
            relatedTables: ['workers', 'departments', 'projects']
        });
    });
});
