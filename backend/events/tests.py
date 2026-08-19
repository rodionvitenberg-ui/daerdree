from django.utils import timezone
from rest_framework.test import APITestCase
from events.models import Event


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
