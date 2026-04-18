/**
 * Async handler wrapper to catch errors in async route handlers
 * @param {Function} fn - Async function to execute
 * @returns {Function} Express middleware function
 */
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

export default asyncHandler;
