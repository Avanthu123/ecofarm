export class User {
  static async me() {
    // Simulate fetching user data, return a dummy user object
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({ id: 1, name: 'Test User' });
      }, 200);
    });
  }
}
