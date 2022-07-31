class UrlSchema {
  constructor(db) {
    this.dao = db;
  }

  createTable() {
    const sql = `
        CREATE TABLE IF NOT EXISTS urls (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          email TEXT,
          url TEXT,
          isComplete INTEGER DEFAULT 0,
          phone INTEGER,
          price INTEGER
         )`;
    return this.dao.run(sql);
  }

  create(email, url, phone, price) {
    return this.dao.run(
      `INSERT INTO urls (email, url, phone, price)
        VALUES (?, ?, ?, ?)`,
      [email, url, phone, price]
    );
  }

  update(task) {
    const { id, isComplete } = task;
    return this.dao.run(
      `UPDATE urls
      SET isComplete = ?,
      WHERE id = ?`,
      [isComplete, id]
    );
  }

  delete(id) {
    return this.dao.run(`DELETE FROM urls WHERE id = ?`, [id]);
  }

  getById(id) {
    return this.dao.get(`SELECT * FROM urls WHERE id = ?`, [id]);
  }
  getAll() {
    return this.dao.all(`SELECT * FROM urls`);
  }
}

module.exports = UrlSchema;
