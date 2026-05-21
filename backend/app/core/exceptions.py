"""
Custom Exception Classes and Global Exception Handlers.
Ensures no raw stack traces or DB errors leak to the client (OWASP compliance).
"""

from fastapi import Request, status
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError


class AppException(Exception):
    """Base application exception."""
    def __init__(self, status_code: int, detail: str, error_code: str = "APP_ERROR"):
        self.status_code = status_code
        self.detail = detail
        self.error_code = error_code


class NotFoundException(AppException):
    def __init__(self, resource: str = "Resource"):
        super().__init__(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"{resource} not found.",
            error_code="NOT_FOUND",
        )


class UnauthorizedException(AppException):
    def __init__(self, detail: str = "Invalid credentials."):
        super().__init__(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=detail,
            error_code="UNAUTHORIZED",
        )


class ForbiddenException(AppException):
    def __init__(self, detail: str = "You do not have permission to perform this action."):
        super().__init__(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=detail,
            error_code="FORBIDDEN",
        )


class ConflictException(AppException):
    def __init__(self, detail: str = "Resource already exists."):
        super().__init__(
            status_code=status.HTTP_409_CONFLICT,
            detail=detail,
            error_code="CONFLICT",
        )


class BadRequestException(AppException):
    def __init__(self, detail: str = "Invalid request."):
        super().__init__(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=detail,
            error_code="BAD_REQUEST",
        )


# ---------------------------------------------------------------------------
# Global Exception Handlers (registered on the FastAPI app)
# ---------------------------------------------------------------------------

async def app_exception_handler(request: Request, exc: AppException):
    """Handle all custom application exceptions with standardized JSON."""
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "success": False,
            "error": {
                "code": exc.error_code,
                "message": exc.detail,
            },
        },
    )


async def validation_exception_handler(request: Request, exc: RequestValidationError):
    """
    Handle Pydantic validation errors.
    Formats them into a user-friendly structure without leaking internals.
    This is the key defense against DevTools bypass — backend ALWAYS validates.
    """
    errors = []
    for error in exc.errors():
        field = " → ".join(str(loc) for loc in error["loc"] if loc != "body")
        errors.append({
            "field": field,
            "message": error["msg"],
            "type": error["type"],
        })
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "success": False,
            "error": {
                "code": "VALIDATION_ERROR",
                "message": "Request validation failed.",
                "details": errors,
            },
        },
    )


async def generic_exception_handler(request: Request, exc: Exception):
    """
    Catch-all handler. NEVER expose raw exceptions to the client.
    In production, log to a monitoring service.
    """
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "success": False,
            "error": {
                "code": "INTERNAL_ERROR",
                "message": "An unexpected error occurred. Please try again later.",
            },
        },
    )
