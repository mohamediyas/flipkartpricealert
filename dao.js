const sqlite3 = require("sqlite3");
const Promise = require("bluebird");

class AppDAO {
  constructor(dbpath) {
    this.db = new sqlite3.Database(dbpath, (err) => {
      if (err) {
        console.log("something went wrong" + err);
      } else {
        console.log("Connected Database");
      }
    });
  }

  run(sql, params = []) {
    return new Promise((res, rej) => {
      this.db.run(sql, params, function (err) {
        if (err) {
          console.log("Error running sql " + sql);
          console.log(err);
          rej(err);
        } else {
          console.log("called", this.lastID);

          res({ id: this.lastID });
        }
      });
    });
  }

  get(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.get(sql, params, (err, result) => {
        if (err) {
          console.log("Error running sql: " + sql);
          console.log(err);
          reject(err);
        } else {
          resolve(result);
        }
      });
    });
  }

  all(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.all(sql, params, (err, rows) => {
        if (err) {
          console.log("Error running sql: " + sql);
          console.log(err);
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }
}

class ProjectRepository {
  constructor(dao) {
    this.dao = dao;
  }

  createTable() {
    const sql = `
      CREATE TABLE IF NOT EXISTS projects (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT)`;
    return this.dao.run(sql);
  }

  create(name) {
    return this.dao.run("INSERT INTO projects (name) VALUES (?)", [name]);
  }

  update(project) {
    const { id, name } = project;
    return this.dao.run(`UPDATE projects SET name = ? WHERE id = ?`, [
      name,
      id,
    ]);
  }

  delete(id) {
    return this.dao.run(`DELETE FROM projects WHERE id = ?`, [id]);
  }

  getById(id) {
    return this.dao.get(`SELECT * FROM projects WHERE id = ?`, [id]);
  }

  getAll() {
    return this.dao.all(`SELECT * FROM projects`);
  }
}

class TaskRepository {
  constructor(dao) {
    this.dao = dao;
  }

  createTable() {
    const sql = `
        CREATE TABLE IF NOT EXISTS tasks (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT,
          description TEXT,
          isComplete INTEGER DEFAULT 0,
          projectId INTEGER,
          CONSTRAINT tasks_fk_projectId FOREIGN KEY (projectId)
            REFERENCES projects(id) ON UPDATE CASCADE ON DELETE CASCADE)`;
    return this.dao.run(sql);
  }

  create(name, description, isComplete, projectId) {
    return this.dao.run(
      `INSERT INTO tasks (name, description, isComplete, projectId)
        VALUES (?, ?, ?, ?)`,
      [name, description, isComplete, projectId]
    );
  }

  update(task) {
    const { id, name, description, isComplete, projectId } = task;
    return this.dao.run(
      `UPDATE tasks
      SET name = ?,
        description = ?,
        isComplete = ?,
        projectId = ?
      WHERE id = ?`,
      [name, description, isComplete, projectId, id]
    );
  }

  delete(id) {
    return this.dao.run(`DELETE FROM tasks WHERE id = ?`, [id]);
  }

  getById(id) {
    return this.dao.get(`SELECT * FROM tasks WHERE id = ?`, [id]);
  }
  getAll() {
    return this.dao.all(`SELECT * FROM tasks`);
  }
  getTasks(projectId) {
    return this.dao.all(`SELECT * FROM tasks WHERE projectId = ?`, [projectId]);
  }
}

function main() {
  const dao = new AppDAO("./database.sqlite3");

  const blogProjectData = { name: "Write Node.js - SQLite Tutorial" };

  const projectRepo = new ProjectRepository(dao);
  const taskRepo = new TaskRepository(dao);

  console.log(dao);

  let projectId;
  //
  projectRepo
    .createTable()
    .then(() => taskRepo.createTable())
    .then(() => projectRepo.create(blogProjectData.name))
    .then((data) => {
      console.log(data);
      projectId = data.id;

      const tasks = [
        {
          name: "Outline",
          description: "High level overview of sections",
          isComplete: 1,
          projectId,
        },
        {
          name: "Write",
          description: "Write article contents and code examples",
          isComplete: 0,
          projectId,
        },
      ];

      return Promise.all(
        tasks.map((task) => {
          const { name, description, isComplete, projectId } = task;
          return taskRepo.create(name, description, isComplete, projectId);
        })
      );
    })
    .then(() => projectRepo.getById(projectId))
    .then((project) => {
      console.log(`\nRetreived project from database`);
      console.log(`project id = ${project?.id}`);
      console.log(`project name = ${project?.name}`);
      return taskRepo.getTasks(project?.id);
    })
    .then((tasks) => {
      console.log("\nRetrieved project tasks from database");
      console.log(tasks);

      projectRepo.getAll().then((value) => {
        console.log(value);
      });

      return new Promise((resolve, reject) => {
        tasks.forEach((task) => {
          console.log(`task id = ${task.id}`);
          console.log(`task name = ${task.name}`);
          console.log(`task description = ${task.description}`);
          console.log(`task isComplete = ${task.isComplete}`);
          console.log(`task projectId = ${task.projectId}`);
        });
      });
      resolve("success");
    })
    .catch((err) => {
      console.log("Error: ");
      console.log(JSON.stringify(err.message));
    });
}

// main();

module.exports = AppDAO;
