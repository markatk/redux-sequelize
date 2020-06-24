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

// Worker
interface WorkerModel extends Entity {
    name: string;
    workId: number;
    version: number;

    projects: RelatedEntities<Project>;
    department: RelatedEntity<Department>;
    boss: RelatedEntity<Worker>;
    workPlace: RelatedEntity<WorkPlace>;
}

export type Worker = Partial<WorkerModel>;

export function toWorker(data: Model): Worker {
    return {
        id: data.get('id') as number,
        name: data.get('name') as string,
        workId: data.get('workId') as number,
        version: data.get('version') as number,

        projects: mapRelatedEntities<Project>('projects', data.get('projects') as Project[], 'workers'),
        department: mapRelatedEntity<Department>('departments', data.get('department') as Department, 'workers'),
        boss: mapRelatedEntity<Worker>('workers', data.get('boss') as Worker),
        workPlace: mapRelatedEntity<WorkPlace>('workPlaces', data.get('workPlace') as WorkPlace, 'worker')
    };
}

export const workerInclude: Includeable[] = [
    { table: 'projects', key: 'projects', linkedKey: 'workers' },
    { table: 'departments', key: 'department', linkedKey: 'workers' },
    { table: 'workers', key: 'boss', toEntity: toWorker },
    { table: 'workPlaces', key: 'workPlace', linkedKey: 'worker', toEntity: toWorkPlace }
];

// Work place
interface WorkPlaceModel extends Entity {
    name: string;

    worker: RelatedEntity<Worker>;
}

export type WorkPlace = Partial<WorkPlaceModel>;

export function toWorkPlace(data: Model): WorkPlace {
    return {
        id: data.get('id') as number,
        name: data.get('name') as string,
        worker: mapRelatedEntity<Worker>('workers', data.get('worker') as Worker, 'workPlace')
    };
}

export const workPlaceInclude: Includeable[] = [
    { table: 'workers', key: 'worker', linkedKey: 'workPlace' }
];

// Project
interface ProjectModel extends Entity {
    name: string;

    workers: RelatedEntities<Worker>;
}

export type Project = Partial<ProjectModel>;

export function toProject(data: Model): Project {
    return {
        id: data.get('id') as number,
        name: data.get('name') as string,

        workers: mapRelatedEntities<Worker>('workers', data.get('workers') as Worker[], 'projects')
    };
}

export const projectInclude: Includeable[] = [
    { table: 'workers', key: 'workers', linkedKey: 'projects' }
];

// Department
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

        workers: mapRelatedEntities<Worker>('workers', data.get('workers') as Worker[], 'department')
    };
}

export const departmentInclude: Includeable[] = [
    { table: 'workers', key: 'workers', linkedKey: 'department' }
];

// Config
interface ConfigModel extends Entity {
    semVer: string;
    data: object;
}

export type Config = Partial<ConfigModel>;

export function toConfig(data: Model): Config {
    return {
        id: data.get('id') as number,
        semVer: data.get('semVer') as string,
        data: JSON.parse(data.get('data') as string)
    };
}
