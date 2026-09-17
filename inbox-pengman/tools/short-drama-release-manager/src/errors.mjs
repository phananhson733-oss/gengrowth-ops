export class ShortDramaError extends Error {
  constructor(code, message, details = {}) {
    super(message);
    this.name = "ShortDramaError";
    this.code = code;
    this.details = details;
  }
}

export function toErrorResult(error) {
  const known = error instanceof ShortDramaError;
  return {
    status: "failed",
    error: {
      code: known ? error.code : "internal_error",
      message: known ? error.message : "Internal short-drama runner error",
      details: known ? error.details : {},
    },
  };
}
