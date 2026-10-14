package restaurant_management.exception;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.HashMap;
import java.util.Map;

@RestControllerAdvice
public class GlobalExceptionHandler {

    // =========================================================
    // VALIDATION ERROR
    // =========================================================

    @ExceptionHandler(
            MethodArgumentNotValidException.class
    )
    public ResponseEntity<Map<String, Object>>
    handleValidationException(
            MethodArgumentNotValidException ex
    ) {

        Map<String, String> errors =
                new HashMap<>();

        ex.getBindingResult()
                .getFieldErrors()
                .forEach(error ->
                        errors.put(
                                error.getField(),
                                error.getDefaultMessage()
                        )
                );

        Map<String, Object> response =
                new HashMap<>();

        response.put(
                "status",
                HttpStatus.BAD_REQUEST.value()
        );

        response.put(
                "error",
                "Validation Failed"
        );

        response.put(
                "messages",
                errors
        );

        return ResponseEntity
                .status(HttpStatus.BAD_REQUEST)
                .body(response);
    }

    // =========================================================
    // ILLEGAL ARGUMENT
    // =========================================================

    @ExceptionHandler(
            IllegalArgumentException.class
    )
    public ResponseEntity<Map<String, Object>>
    handleIllegalArgumentException(
            IllegalArgumentException ex
    ) {

        return buildResponse(
                HttpStatus.BAD_REQUEST,
                "Bad Request",
                ex.getMessage()
        );
    }

    // =========================================================
    // SECURITY ERROR
    // =========================================================

    @ExceptionHandler(
            SecurityException.class
    )
    public ResponseEntity<Map<String, Object>>
    handleSecurityException(
            SecurityException ex
    ) {

        return buildResponse(
                HttpStatus.FORBIDDEN,
                "Forbidden",
                ex.getMessage()
        );
    }

    // =========================================================
    // SPRING SECURITY ACCESS DENIED
    // =========================================================

    @ExceptionHandler(org.springframework.security.access.AccessDeniedException.class)
    public ResponseEntity<Map<String, Object>> handleAccessDeniedException(
            org.springframework.security.access.AccessDeniedException ex) {
        return buildResponse(HttpStatus.FORBIDDEN, "Forbidden", "You are not allowed to perform this action.");
    }

    // =========================================================
    // ENTITY NOT FOUND
    // =========================================================

    @ExceptionHandler(
            jakarta.persistence.EntityNotFoundException.class
    )
    public ResponseEntity<Map<String, Object>>
    handleEntityNotFoundException(
            jakarta.persistence.EntityNotFoundException ex
    ) {

        return buildResponse(
                HttpStatus.NOT_FOUND,
                "Not Found",
                ex.getMessage()
        );
    }

    // =========================================================
    // CONSTRAINT VIOLATION
    // =========================================================

    @ExceptionHandler(
            jakarta.validation.ConstraintViolationException.class
    )
    public ResponseEntity<Map<String, Object>>
    handleConstraintViolationException(
            jakarta.validation.ConstraintViolationException ex
    ) {

        return buildResponse(
                HttpStatus.BAD_REQUEST,
                "Constraint Violation",
                ex.getMessage()
        );
    }

    // =========================================================
    // DATABASE CONSTRAINT ERROR
    // =========================================================

    @ExceptionHandler(
            DataIntegrityViolationException.class
    )
    public ResponseEntity<Map<String, Object>>
    handleDataIntegrityViolationException(
            DataIntegrityViolationException ex
    ) {

        String message =
                "The requested operation violates a "
                        + "database constraint.";

        String rootMessage = null;

        if (ex.getMostSpecificCause() != null) {

            rootMessage =
                    ex.getMostSpecificCause()
                            .getMessage();
        }

        if (rootMessage != null) {

            String lower =
                    rootMessage.toLowerCase();

            if (lower.contains("duplicate")
                    && lower.contains("ingredient")) {

                message =
                        "An ingredient with the same "
                                + "name already exists.";
            }
        }

        return buildResponse(
                HttpStatus.CONFLICT,
                "Database Conflict",
                message
        );
    }

    // =========================================================
    // ILLEGAL STATE
    // =========================================================

    @ExceptionHandler(
            IllegalStateException.class
    )
    public ResponseEntity<Map<String, Object>>
    handleIllegalStateException(
            IllegalStateException ex
    ) {

        return buildResponse(
                HttpStatus.CONFLICT,
                "Operation Failed",
                ex.getMessage()
        );
    }

    // =========================================================
    // RUNTIME EXCEPTION
    // =========================================================

    @ExceptionHandler(
            RuntimeException.class
    )
    public ResponseEntity<Map<String, Object>>
    handleRuntimeException(
            RuntimeException ex
    ) {

        String message =
                ex.getMessage();

        if (message == null
                || message.isBlank()) {

            message =
                    "An unexpected error occurred.";
        }

        String lowerMessage =
                message.toLowerCase();

        // -----------------------------------------------------
        // Not found
        // -----------------------------------------------------

        if (lowerMessage.contains("not found")
                || lowerMessage.contains("does not exist")) {

            return buildResponse(
                    HttpStatus.NOT_FOUND,
                    "Not Found",
                    message
            );
        }

        return buildResponse(
                HttpStatus.BAD_REQUEST,
                "Bad Request",
                message
        );
    }

    // =========================================================
    // UNEXPECTED EXCEPTION
    // =========================================================

    @ExceptionHandler(
            Exception.class
    )
    public ResponseEntity<Map<String, Object>>
    handleGenericException(
            Exception ex
    ) {

        /*
         * Never expose database details, SQL statements,
         * file paths or stack traces to the frontend.
         */

        return buildResponse(
                HttpStatus.INTERNAL_SERVER_ERROR,
                "Internal Server Error",
                "An unexpected error occurred. "
                        + "Please try again later."
        );
    }

    // =========================================================
    // RESPONSE BUILDER
    // =========================================================

    private ResponseEntity<Map<String, Object>>
    buildResponse(
            HttpStatus status,
            String error,
            String message
    ) {

        Map<String, Object> response =
                new HashMap<>();

        response.put(
                "status",
                status.value()
        );

        response.put(
                "error",
                error
        );

        response.put(
                "message",
                message != null
                        ? message
                        : error
        );

        return ResponseEntity
                .status(status)
                .body(response);
    }
}