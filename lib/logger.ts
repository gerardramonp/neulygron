import * as Sentry from "@sentry/nextjs";

type LogLevel = "info" | "warn" | "error";

interface LogContext {
  userId?: string;
  email?: string;
  [key: string]: unknown;
}

/**
 * Centralized logger that sends errors to Sentry
 * and maintains console logging for development
 */
export const logger = {
  /**
   * Log informational messages (not sent to Sentry)
   */
  info(message: string, context?: LogContext) {
    console.info(`[INFO] ${message}`, context ?? "");
  },

  /**
   * Log warning messages (sent to Sentry as breadcrumb)
   */
  warn(message: string, context?: LogContext) {
    console.warn(`[WARN] ${message}`, context ?? "");
    Sentry.addBreadcrumb({
      category: "warning",
      message,
      level: "warning",
      data: context,
    });
  },

  /**
   * Log error messages (sent to Sentry)
   */
  error(message: string, error?: Error | unknown, context?: LogContext) {
    console.error(`[ERROR] ${message}`, error, context ?? "");

    // Set user context if available
    if (context?.userId || context?.email) {
      Sentry.setUser({
        id: context.userId,
        email: context.email,
      });
    }

    // Add extra context
    if (context) {
      Sentry.setContext("additional", context);
    }

    // Capture the error
    if (error instanceof Error) {
      Sentry.captureException(error, {
        extra: { message, ...context },
      });
    } else {
      Sentry.captureMessage(message, {
        level: "error",
        extra: { error, ...context },
      });
    }
  },

  /**
   * Set user context for all subsequent logs
   */
  setUser(user: { id?: string; email?: string; username?: string }) {
    Sentry.setUser(user);
  },

  /**
   * Clear user context (call on logout)
   */
  clearUser() {
    Sentry.setUser(null);
  },
};

/**
 * Wrapper for API route error handling
 * Use in catch blocks to log and return appropriate error response
 */
export function logApiError(
  error: unknown,
  context: {
    route: string;
    method: string;
    userId?: string;
    [key: string]: unknown;
  }
): { message: string; status: number } {
  const errorMessage =
    error instanceof Error ? error.message : "Unknown error occurred";

  logger.error(`API Error: ${context.route}`, error, context);

  return {
    message: "Something went wrong",
    status: 500,
  };
}
