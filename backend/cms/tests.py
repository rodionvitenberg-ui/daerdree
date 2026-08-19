import json
import tempfile
from pathlib import Path
from django.contrib.auth.models import User
from django.test import override_settings
from rest_framework.test import APITestCase
from cms.json_i18n import flatten_json, unflatten_json


class FlattenTests(APITestCase):
    def test_roundtrip(self):
        nested = {'A': {'b': 'x', 'c': 'y'}}
        flat = flatten_json(nested)
        self.assertEqual(flat, {'A.b': 'x', 'A.c': 'y'})
        self.assertEqual(unflatten_json(flat), nested)


class TranslationsApiTests(APITestCase):
    def setUp(self):
        self.staff = User.objects.create_user(
            username='keeper', password='secret-pass', is_staff=True
        )

    def test_anonymous_401(self):
        self.assertEqual(self.client.get('/api/admin/translations/').status_code, 401)

    def test_get_and_put_roundtrip(self):
        with tempfile.TemporaryDirectory() as tmp:
            tmp_path = Path(tmp)
            ru = {'Header': {'cta': 'Бронь'}}
            en = {'Header': {'cta': 'Book'}}
            (tmp_path / 'ru.json').write_text(json.dumps(ru), encoding='utf-8')
            (tmp_path / 'en.json').write_text(json.dumps(en), encoding='utf-8')
            with override_settings(MESSAGES_DIR=str(tmp_path)):
                # json_i18n must read settings.MESSAGES_DIR if set, else default path
                self.client.force_authenticate(self.staff)
                got = self.client.get('/api/admin/translations/')
                self.assertEqual(got.status_code, 200)
                keys = {item['key']: item for g in got.data['groups'] for item in g['keys']}
                self.assertEqual(keys['Header.cta']['ru'], 'Бронь')
                payload = {'keys': {'Header.cta': {'ru': 'Забронировать', 'en': 'Reserve'}}}
                put = self.client.put('/api/admin/translations/', payload, format='json')
                self.assertEqual(put.status_code, 200)
                written_ru = json.loads((tmp_path / 'ru.json').read_text(encoding='utf-8'))
                self.assertEqual(written_ru['Header']['cta'], 'Забронировать')
