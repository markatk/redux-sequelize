/*
 * File: database.ts
 * Author: MarkAtk
 * Date: 12.03.20
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

import { Sequelize, DataTypes, Model, Association } from 'sequelize';

class Worker extends Model {
    public id: number;
    public name: string;
    public workId: number;

    public readonly projects?: Project[];
    public readonly department?: Department[];
    public readonly boss?: Worker;
    public readonly workPlace?: WorkPlace;

    public static associations: {
        projects: Association<Worker, Project>;
        department: Association<Worker, Department>;
        boss: Association<Worker, Worker>;
        workPlace: Association<Worker, WorkPlace>;
    };
}

class WorkPlace extends Model {
    public id: number;
    public name: string;

    public readonly worker?: Worker;

    public static associations: {
        worker: Association<WorkPlace, Worker>;
    };
}

class Project extends Model {
    public id: number;
    public name: string;

    public readonly workers: Worker[];

    public static associations: {
        workers: Association<Project, Worker>;
    };
}

class Department extends Model {
    public id: number;
    public name: string;
    public floor: number;

    public readonly workers: Worker[];

    public static associations: {
        workers: Association<Department, Worker>;
    }
}

export default function createDatabase(): Sequelize {
    const sequelize = new Sequelize({
        logging: false,
        dialect: 'sqlite'
    });

    Worker.init({
        name: DataTypes.STRING,
        workId: DataTypes.NUMBER
    }, {
        sequelize,
        modelName: 'workers'
    });

    WorkPlace.init({
        name: DataTypes.STRING
    }, {
        sequelize,
        modelName: 'workPlaces'
    })

    Project.init({
        name: DataTypes.STRING
    }, {
        sequelize,
        modelName: 'projects'
    });

    Department.init({
        name: DataTypes.STRING,
        floor: DataTypes.NUMBER
    }, {
        sequelize,
        modelName: 'departments'
    });

    Worker.belongsToMany(Project, { as: 'projects', through: 'WorkerProject', foreignKey: 'workerId' });
    Worker.belongsTo(Department, { as: 'department' });
    Worker.belongsTo(Worker, { as: 'boss' });
    Worker.hasOne(WorkPlace, { as: 'workPlace' });

    Project.belongsToMany(Worker, { as: 'workers', through: 'WorkerProject', foreignKey: 'projectId' });

    Department.hasMany(Worker, { as: 'workers' });

    return sequelize;
}
