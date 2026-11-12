export function createState(initialState) {

  const listeners = {};
  
  return {
    state: new Proxy(initialState, {
      set(target, prop, value) {
        target[prop] = value;
        listeners[prop]?.forEach(callback => callback(prop, value));
        return true;
      }
    }),
    onStateChange(prop, callback) {
      if (!(prop in listeners)) listeners[prop] = [];
      listeners[prop].push(callback);
    },
    offStateChange(prop, callback) {
      const index = listeners[prop]?.indexOf(callback);
      if (index != null && index !== -1) listeners[prop].splice(index, 1);
    }
  };
}
