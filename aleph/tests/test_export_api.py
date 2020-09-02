from datetime import timedelta

from aleph.logic.export import (
    create_export,
    complete_export,
    export_url,
)
from aleph.model import Export
from aleph.tests.util import TestCase
from aleph.views.util import validate


class ExportApiTestCase(TestCase):
    def setUp(self):
        super(ExportApiTestCase, self).setUp()
        self.load_fixtures()
        self.email = "test@pudo.org"
        self.role_email = self.create_user("with_email", email=self.email)
        _, self.headers = self.login(foreign_id="with_email")

        csv_path = self.get_fixture_path("experts.csv")
        temp_path = self._create_temporary_copy(csv_path, "experts.csv")
        self.export1 = create_export(
            "TEST", self.role_email.id, "test1", expires_after=Export.DEFAULT_EXPIRATION
        )
        complete_export(self.export1.id, temp_path)

        temp_path = self._create_temporary_copy(csv_path, "experts.csv")
        self.export2 = create_export(
            "TEST", self.role_email.id, "test2", expires_after=timedelta(days=-1)
        )
        complete_export(self.export2.id, temp_path)

    def test_exports_index(self):
        res = self.client.get("/api/2/exports")
        assert res.status_code == 403, res
        _, headers = self.login()
        res = self.client.get("/api/2/exports", headers=headers)
        assert res.status_code == 200, res
        assert res.json["total"] == 0, res.json
        res = self.client.get("/api/2/exports", headers=self.headers)
        assert res.status_code == 200, res
        validate(res.json, "QueryResponse")
        assert res.json["total"] == 2, res.json
        results = res.json["results"]
        validate(results[0], "Export")

    def test_invalid_claim(self):
        res = self.client.get("/api/2/exports/1/download?claim=banana")
        assert res.status_code == 401, res
        res = self.client.get(
            "/api/2/exports/1/download?claim=banana", headers=self.headers
        )
        assert res.status_code == 401, res

    def test_anon_claim(self):
        claim_url = export_url(2, self.role_email.id)
        res = self.client.get(claim_url)
        assert res.status_code == 200, res.status_code
        disposition = res.headers.get("Content-Disposition")
        assert "attachment; filename=experts.csv" in disposition, res.headers

    def test_no_claim(self):
        res = self.client.get("/api/2/exports/1/download")
        assert res.status_code == 403, res
        _, headers = self.login()
        res = self.client.get("/api/2/exports/1/download", headers=headers)
        assert res.status_code == 404, res
        res = self.client.get("/api/2/exports/1/download", headers=self.headers)
        assert res.status_code == 200, res
        disposition = res.headers.get("Content-Disposition")
        assert "attachment; filename=experts.csv" in disposition, res.headers
