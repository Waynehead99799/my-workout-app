import { describe, it, expect } from "vitest";
import { SET_TYPES, USER_ROLES, API_ERRORS, HTTP_STATUS } from "./constants";

describe("constants", () => {
  describe("SET_TYPES", () => {
    it("should have warmup and working set types", () => {
      expect(SET_TYPES.WARMUP).toBe("warmup");
      expect(SET_TYPES.WORKING).toBe("working");
    });
  });

  describe("USER_ROLES", () => {
    it("should have user role defined", () => {
      expect(USER_ROLES.USER).toBe("user");
    });
  });

  describe("API_ERRORS", () => {
    it("should have required error messages", () => {
      expect(API_ERRORS.UNAUTHORIZED).toBe("Unauthorized");
      expect(API_ERRORS.MISSING_MONGO_URI).toBe("Missing MONGODB_URI environment variable.");
    });
  });

  describe("HTTP_STATUS", () => {
    it("should have correct status codes", () => {
      expect(HTTP_STATUS.OK).toBe(200);
      expect(HTTP_STATUS.BAD_REQUEST).toBe(400);
      expect(HTTP_STATUS.UNAUTHORIZED).toBe(401);
      expect(HTTP_STATUS.INTERNAL_ERROR).toBe(500);
    });
  });
});