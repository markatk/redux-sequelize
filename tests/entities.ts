/*
 * File: entities.ts
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

import { Entity, RelatedEntity, RelatedEntities, mapRelatedEntities, mapRelatedEntity, Includeable } from '../lib';
import { Model } from 'sequelize';

interface WorkerModel extends Entity {
    name: string;
    workId: number;

    projects: RelatedEntities<Project>;
    department: RelatedEntity<Department>;
    boss: RelatedEntity<Worker>;
}

export type Worker = Partial<WorkerModel>;

export function toWorker(data: Model): Worker {
    return {
        id: data.get('id') as number,
        name: data.get('name') as string,
        workId: data.get('workId') as number,

        projects: mapRelatedEntities<Project>('projects', data.get('projects') as Project[]),
        department: mapRelatedEntity<Department>('departments', data.get('department') as Department),
        boss: mapRelatedEntity<Worker>('workers', data.get('boss') as Worker)
    };
}

export const workerInclude: Includeable[] = [
    { table: 'projects', key: 'projects' },
    { table: 'departments', key: 'department' },
    { table: 'workers', key: 'boss', toEntity: toWorker }
];

interface ProjectModel extends Entity {
    name: string;

    workers: RelatedEntities<Worker>;
}

export type Project = Partial<ProjectModel>;

export function toProject(data: Model): Project {
    return {
        id: data.get('id') as number,
        name: data.get('name') as string,

        workers: mapRelatedEntities<Worker>('workers', data.get('workers') as Worker[])
    };
}

export const projectInclude: Includeable[] = [
    { table: 'workers', key: 'workers' }
];

interface DepartmentModel extends Entity {
    name: string;
    floor: number;

    workers: RelatedEntities<Worker>;
}

export type Department = Partial<DepartmentModel>;

export function toDepartment(data: Model): Department {
    return {
        id: data.get('id') as number,
        name: data.get('name') as string,
        floor: data.get('floor') as number,

        workers: mapRelatedEntities<Worker>('workers', data.get('workers') as Worker[])
    };
}

export const departmentInclude: Includeable[] = [
    { table: 'workers', key: 'workers' }
];
