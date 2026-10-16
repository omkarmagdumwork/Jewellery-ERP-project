// Works on Express 4 and 5: forwards async errors to the central error handler
export default (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
