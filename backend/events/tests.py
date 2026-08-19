import tempfile
import uuid
from datetime import timedelta

from django.contrib.auth.models import User
from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import override_settings
from django.utils import timezone
from rest_framework.test import APITestCase
from events.models import Event

GIF = (
    b'GIF89a\x01\x00\x01\x00\x80\x00\x00\xff\xff\xff'
    b'\x00\x00\x00\x21\xf9\x04\x01\x00\x00\x00\x00\x2c'
    b'\x00\x00\x00\x00\x01\x00\x01\x00\x00\x02\x02D\x01\x00;'
)


class PublicEventApiTests(APITestCase):
    def test_list_ok(self):
        response = self.client.get('/api/events/')
        self.assertEqual(response.status_code, 200)

    def test_create_not_allowed(self):
        response = self.client.post(
            '/api/events/',
            {
                'title': 'Hack',
                'description': 'nope',
                'event_date': timezone.now().isoformat(),
            },
            format='json',
        )
        self.assertEqual(response.status_code, 405)


class AdminEventTests(APITestCase):
    def setUp(self):
        self.media_dir = tempfile.TemporaryDirectory()
        media_override = override_settings(MEDIA_ROOT=self.media_dir.name)
        media_override.enable()
        self.addCleanup(media_override.disable)
        self.addCleanup(self.media_dir.cleanup)
        self.staff = User.objects.create_user(username='keeper', password='secret-pass', is_staff=True)
        self.client.force_authenticate(self.staff)

    def test_hidden_event_on_admin_not_public(self):
        title = f'Закрыто-{uuid.uuid4().hex[:8]}'
        image = SimpleUploadedFile('e.gif', GIF, content_type='image/gif')
        create = self.client.post(
            '/api/admin/events/',
            {
                'title': title,
                'description': 'текст',
                'event_date': (timezone.now() + timedelta(days=36500)).isoformat(),
                'is_visible': False,
                'image': image,
            },
            format='multipart',
        )
        self.assertEqual(create.status_code, 201)
        admin_list = self.client.get('/api/admin/events/')
        titles = [row['title'] for row in admin_list.data['results']]
        self.assertIn(title, titles)
        self.client.force_authenticate(user=None)
        public = self.client.get('/api/events/')
        public_rows = public.data['results']
        self.assertFalse(any(r['title'] == title for r in public_rows))

    def test_anonymous_401(self):
        self.client.force_authenticate(user=None)
        self.assertEqual(self.client.get('/api/admin/events/').status_code, 401)

    def test_json_patch_without_image(self):
        image = SimpleUploadedFile('e.gif', GIF, content_type='image/gif')
        create = self.client.post(
            '/api/admin/events/',
            {
                'title': f'Закрыто-{uuid.uuid4().hex[:8]}',
                'description': 'текст',
                'event_date': timezone.now().isoformat(),
                'is_visible': True,
                'image': image,
            },
            format='multipart',
        )
        self.assertEqual(create.status_code, 201)
        event_id = create.data['id']
        image_url = create.data['image']
        patch = self.client.patch(
            f'/api/admin/events/{event_id}/',
            {'title': 'Patched', 'title_en': 'Closed'},
            format='json',
        )
        self.assertEqual(patch.status_code, 200)
        self.assertEqual(patch.data['title'], 'Patched')
        self.assertEqual(patch.data['title_en'], 'Closed')
        self.assertEqual(patch.data['image'], image_url)

    def test_telegram_id_readonly(self):
        image = SimpleUploadedFile('e.gif', GIF, content_type='image/gif')
        create = self.client.post(
            '/api/admin/events/',
            {
                'title': f'Закрыто-{uuid.uuid4().hex[:8]}',
                'description': 'текст',
                'event_date': timezone.now().isoformat(),
                'is_visible': True,
                'telegram_id': f'should-ignore-{uuid.uuid4().hex[:8]}',
                'image': image,
            },
            format='multipart',
        )
        self.assertEqual(create.status_code, 201)
        self.assertIsNone(create.data['telegram_id'])
        event = Event.objects.get(id=create.data['id'])
        self.assertIsNone(event.telegram_id)
