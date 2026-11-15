export function createState(initialState) {

  const listeners = {};
  
  return {
    state: new Proxy(initialState, {
      set(target, prop, value) {
        const oldValue = target[prop];
        target[prop] = value;
        listeners[prop]?.forEach(callback => callback(value, oldValue));
        return true;
      }
    }),
    onStateChange(prop, callback) {
      if (!(prop in listeners)) listeners[prop] = [];
      if (!listeners[prop].includes(callback)) listeners[prop].push(callback);
    },
    offStateChange(prop, callback) {
      const index = listeners[prop]?.indexOf(callback);
      if (index != null && index !== -1) listeners[prop].splice(index, 1);
    }
  };
}
