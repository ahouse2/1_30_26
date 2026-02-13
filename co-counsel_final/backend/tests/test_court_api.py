import importlib.metadata
import sys
import types
import unittest


if "email_validator" not in sys.modules:
    stub = types.ModuleType("email_validator")

    class EmailNotValidError(ValueError):
        pass

    def validate_email(email, *args, **kwargs):
        return {"email": email, "local": email.split("@")[0] if "@" in email else email}

    stub.EmailNotValidError = EmailNotValidError
    stub.validate_email = validate_email
    sys.modules["email_validator"] = stub

_real_version = importlib.metadata.version


def _patched_version(name: str) -> str:
    if name == "email-validator":
        return "2.0.0"
    return _real_version(name)


importlib.metadata.version = _patched_version


if "fastapi" not in sys.modules:
    fastapi_stub = types.ModuleType("fastapi")

    class HTTPException(Exception):
        def __init__(self, status_code: int, detail: str):
            super().__init__(detail)
            self.status_code = status_code
            self.detail = detail

    class APIRouter:
        def __init__(self, *args, **kwargs):
            self.routes = []

        def get(self, path: str, **kwargs):
            def decorator(func):
                self.routes.append(("GET", path, func))
                return func
            return decorator

        def post(self, path: str, **kwargs):
            def decorator(func):
                self.routes.append(("POST", path, func))
                return func
            return decorator

    def Depends(callable_obj):
        return callable_obj

    fastapi_stub.APIRouter = APIRouter
    fastapi_stub.HTTPException = HTTPException
    fastapi_stub.Depends = Depends
    sys.modules["fastapi"] = fastapi_stub

from backend.app.api import courts


class CourtApiTests(unittest.TestCase):
    def test_court_provider_status_route(self):
        routes = {(method, path) for method, path, _ in courts.router.routes}
        self.assertIn(("GET", "/courts/providers"), routes)
