export const SET_TYPES = {
  WARMUP: "warmup",
  WORKING: "working",
} as const;

export const USER_ROLES = {
  USER: "user",
} as const;

export const API_ERRORS = {
  UNAUTHORIZED: "Unauthorized",
  MISSING_MONGO_URI: "Missing MONGODB_URI environment variable.",
  NO_PROGRAM_DATA: "No program data found.",
  NO_EXERCISES: "No exercises found for this training day.",
  MONTH_REQUIRED: "month is required.",
  INVALID_CREDENTIALS: "Invalid credentials format",
  INVALID_PASSWORD: "Invalid password",
  NO_USER_FOUND: "No user found",
} as const;

export const HTTP_STATUS = {
  OK: 200,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  INTERNAL_ERROR: 500,
} as const;