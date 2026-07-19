from __future__ import annotations

from io import BytesIO
import json
import os
import unittest
from unittest.mock import patch
from urllib.error import HTTPError

from scripts.sync.client import ContentSyncClient, DEFAULT_USER_AGENT


class FakeResponse:
    def __enter__(self) -> "FakeResponse":
        return self

    def __exit__(self, exc_type, exc_value, traceback) -> None:
        return None

    def read(self) -> bytes:
        return b'{"ok":true}'


class ContentSyncClientTests(unittest.TestCase):
    @patch("scripts.sync.client.urlopen", return_value=FakeResponse())
    def test_sync_sends_explicit_user_agent_and_authorization(self, mocked_urlopen) -> None:
        client = ContentSyncClient(
            "https://prompt.example.test",
            "secret-token",
            attempts=1,
            user_agent="test-content-sync/1.0",
        )

        result = client.sync({"schemaVersion": 1}, prune=True)

        self.assertEqual(result, {"ok": True})
        request = mocked_urlopen.call_args.args[0]
        self.assertEqual(request.get_header("User-agent"), "test-content-sync/1.0")
        self.assertEqual(request.get_header("Authorization"), "Bearer secret-token")
        self.assertEqual(request.get_header("Content-type"), "application/json; charset=utf-8")
        self.assertEqual(
            json.loads(request.data.decode("utf-8")),
            {
                "manifest": {"schemaVersion": 1},
                "prune": True,
                "dryRun": False,
            },
        )

    @patch("scripts.sync.client.time.sleep")
    @patch("scripts.sync.client.urlopen")
    def test_retries_unauthorized_during_secret_propagation(
        self,
        mocked_urlopen,
        mocked_sleep,
    ) -> None:
        unauthorized = HTTPError(
            "https://prompt.example.test/api/admin/library/sync",
            401,
            "Unauthorized",
            {},
            BytesIO(b'{"error":"Unauthorized."}'),
        )
        mocked_urlopen.side_effect = [unauthorized, FakeResponse()]
        client = ContentSyncClient(
            "https://prompt.example.test",
            "newly-rotated-token",
            attempts=2,
            retry_delay=0.01,
        )

        result = client.sync({"schemaVersion": 1})

        self.assertEqual(result, {"ok": True})
        self.assertEqual(mocked_urlopen.call_count, 2)
        mocked_sleep.assert_called_once_with(0.01)

    @patch.dict(
        os.environ,
        {
            "PROMPT_API_BASE_URL": "https://prompt.example.test",
            "CONTENT_SYNC_TOKEN": "secret-token",
        },
        clear=True,
    )
    def test_environment_client_uses_cloudflare_compatible_default(self) -> None:
        client = ContentSyncClient.from_environment()
        self.assertEqual(client.user_agent, DEFAULT_USER_AGENT)


if __name__ == "__main__":
    unittest.main()
