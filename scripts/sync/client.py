from __future__ import annotations

import json
import os
import time
from typing import Any
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen


DEFAULT_USER_AGENT = "curl/8.10.1 prompt-web-content-sync/1.1"
RETRYABLE_HTTP_STATUS_CODES = {401, 408, 425, 429, 500, 502, 503, 504}


class ContentSyncClientError(RuntimeError):
    pass


class ContentSyncClient:
    def __init__(
        self,
        base_url: str,
        token: str,
        *,
        attempts: int = 6,
        retry_delay: float = 2.0,
        timeout: float = 30.0,
        user_agent: str = DEFAULT_USER_AGENT,
    ) -> None:
        self.base_url = base_url.rstrip("/")
        self.token = token.strip()
        self.attempts = attempts
        self.retry_delay = retry_delay
        self.timeout = timeout
        self.user_agent = user_agent.strip()
        if not self.base_url.startswith(("http://", "https://")):
            raise ContentSyncClientError("Base URL must start with http:// or https://.")
        if not self.token:
            raise ContentSyncClientError("Content sync token is empty.")
        if not self.user_agent:
            raise ContentSyncClientError("Content sync user agent is empty.")
        if self.attempts < 1:
            raise ContentSyncClientError("Content sync attempts must be at least 1.")
        if self.retry_delay < 0:
            raise ContentSyncClientError("Content sync retry delay cannot be negative.")
        if self.timeout <= 0:
            raise ContentSyncClientError("Content sync timeout must be positive.")

    @classmethod
    def from_environment(
        cls,
        base_url: str | None = None,
        token_env: str = "CONTENT_SYNC_TOKEN",
    ) -> "ContentSyncClient":
        resolved_url = base_url or os.environ.get("PROMPT_API_BASE_URL", "")
        token = os.environ.get(token_env, "")
        user_agent = os.environ.get("CONTENT_SYNC_USER_AGENT", DEFAULT_USER_AGENT)
        return cls(resolved_url, token, user_agent=user_agent)

    def _request(self, method: str, path: str, payload: Any | None = None) -> Any:
        body = (
            json.dumps(payload, ensure_ascii=False, separators=(",", ":")).encode("utf-8")
            if payload is not None
            else None
        )
        request = Request(
            f"{self.base_url}{path}",
            data=body,
            method=method,
            headers={
                "Authorization": f"Bearer {self.token}",
                "Accept": "application/json",
                "User-Agent": self.user_agent,
                **({"Content-Type": "application/json; charset=utf-8"} if body else {}),
            },
        )

        last_error: Exception | None = None
        for attempt in range(1, self.attempts + 1):
            try:
                with urlopen(request, timeout=self.timeout) as response:
                    raw = response.read().decode("utf-8")
                    return json.loads(raw) if raw else None
            except HTTPError as error:
                response_body = error.read().decode("utf-8", errors="replace")
                message = ContentSyncClientError(
                    f"Content sync API returned HTTP {error.code}: {response_body}"
                )
                if error.code not in RETRYABLE_HTTP_STATUS_CODES:
                    raise message from error
                last_error = message
            except (URLError, TimeoutError, json.JSONDecodeError) as error:
                last_error = error

            if attempt < self.attempts:
                time.sleep(self.retry_delay * attempt)

        raise ContentSyncClientError(
            f"Content sync request failed after {self.attempts} attempts: {last_error}"
        ) from last_error

    def snapshot(self) -> dict[str, Any]:
        result = self._request("GET", "/api/admin/library/snapshot")
        if not isinstance(result, dict):
            raise ContentSyncClientError("Snapshot response is not a JSON object.")
        return result

    def plan(self, manifest: dict[str, Any], *, prune: bool = False) -> dict[str, Any]:
        result = self._request(
            "POST",
            "/api/admin/library/sync",
            {"manifest": manifest, "prune": prune, "dryRun": True},
        )
        if not isinstance(result, dict):
            raise ContentSyncClientError("Plan response is not a JSON object.")
        return result

    def sync(self, manifest: dict[str, Any], *, prune: bool = False) -> dict[str, Any]:
        result = self._request(
            "POST",
            "/api/admin/library/sync",
            {"manifest": manifest, "prune": prune, "dryRun": False},
        )
        if not isinstance(result, dict):
            raise ContentSyncClientError("Sync response is not a JSON object.")
        return result
