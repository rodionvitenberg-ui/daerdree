from unittest.mock import patch

from rest_framework.test import APITestCase
from bookings.models import Booking


class PublicBookingApiTests(APITestCase):
    def setUp(self):
        Booking.objects.all().delete()
        self._telegram_post = patch('bookings.models.requests.post')
        self._telegram_post.start()
        self.addCleanup(self._telegram_post.stop)

    def test_create_ok(self):
        response = self.client.post(
            '/api/bookings/',
            {
                'name': 'Ada',
                'contact': '+357',
                'date': 'завтра 19:00',
                'guests': '2',
            },
            format='json',
        )
        self.assertEqual(response.status_code, 201)
        self.assertEqual(Booking.objects.count(), 1)

    def test_list_not_allowed(self):
        response = self.client.get('/api/bookings/')
        self.assertEqual(response.status_code, 405)
