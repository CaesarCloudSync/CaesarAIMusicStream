// abortManager.js
class AbortManager {
  constructor() {
    this.requestControllers = {};
  }

  createRequest(id) {
    const controller = new AbortController();
    this.requestControllers[id] = controller;
    return controller;
  }

  abortRequest(id) {
    if (this.requestControllers[id]) {
      this.requestControllers[id].abort();
      delete this.requestControllers[id];
    }
  }

  abortAllRequests() {
    Object.keys(this.requestControllers).forEach(id => {
      this.requestControllers[id].abort();
      delete this.requestControllers[id];
    });
  }
}

export const abortManager = new AbortManager();
