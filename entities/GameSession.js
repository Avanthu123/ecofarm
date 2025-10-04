let sessions = [];
let nextId = 1;

export class GameSession {
  static async create(data) {
    return new Promise((resolve) => {
      const newSession = { id: nextId++, ...data };
      sessions.push(newSession);
      setTimeout(() => resolve(newSession), 200);
    });
  }

  static async update(id, updates) {
    return new Promise((resolve, reject) => {
      const index = sessions.findIndex(s => s.id === id);
      if (index === -1) {
        reject(new Error('Session not found'));
        return;
      }
      sessions[index] = { ...sessions[index], ...updates };
      setTimeout(() => resolve(sessions[index]), 200);
    });
  }
}
