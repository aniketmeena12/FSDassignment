export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
};

export const ROLES = {
  USER: 'user',
  ADMIN: 'admin',
};

export const TASK_STATUS = {
  PENDING: 'pending',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
};

export const TASK_PRIORITY = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
};

export const ERROR_MESSAGES = {
  UNAUTHORIZED: 'Authentication failed. Please login.',
  FORBIDDEN: 'You do not have permission to perform this action.',
  NOT_FOUND: 'Resource not found.',
  INVALID_CREDENTIALS: 'Invalid email or password.',
  USER_EXISTS: 'User already exists with this email.',
  INTERNAL_ERROR: 'An internal server error occurred.',
  VALIDATION_ERROR: 'Validation error.',
  INVALID_FILE: 'Invalid file format or size.',
  MAX_FILES_EXCEEDED: 'Maximum file limit exceeded.',
};

export const SUCCESS_MESSAGES = {
  CREATED: 'Resource created successfully.',
  UPDATED: 'Resource updated successfully.',
  DELETED: 'Resource deleted successfully.',
  LOGIN_SUCCESS: 'Login successful.',
  LOGOUT_SUCCESS: 'Logout successful.',
};
