from unittest.mock import patch

from django.contrib.auth.models import User
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

    def test_singular_booking_path_creates(self):
        """Site form POSTs /api/booking/ (no s); nginx sends /api/* to Django."""
        response = self.client.post(
            '/api/booking/',
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


class AdminBookingTests(APITestCase):
    def setUp(self):
        self._telegram_post = patch('bookings.models.requests.post')
        self.telegram_post = self._telegram_post.start()
        self.addCleanup(self._telegram_post.stop)
        self.staff = User.objects.create_user(username='keeper', password='secret-pass', is_staff=True)
        self.client.force_authenticate(self.staff)
        self.booking = Booking.objects.create(
            name='Ada', contact='+357', date='завтра', guests='2', status='pending'
        )

    def test_list_and_patch_status(self):
        listing = self.client.get('/api/admin/bookings/')
        self.assertEqual(listing.status_code, 200)
        telegram_calls = self.telegram_post.call_count
        patch = self.client.patch(
            f'/api/admin/bookings/{self.booking.id}/',
            {'status': 'confirmed', 'name': 'Ada Lovelace'},
            format='json',
        )
        self.assertEqual(patch.status_code, 200)
        self.booking.refresh_from_db()
        self.assertEqual(self.booking.status, 'confirmed')
        self.assertEqual(self.booking.name, 'Ada Lovelace')
        self.assertEqual(self.telegram_post.call_count, telegram_calls)

    def test_create_not_allowed(self):
        response = self.client.post('/api/admin/bookings/', {'name': 'x'}, format='json')
        self.assertEqual(response.status_code, 405)

    def test_delete_not_allowed(self):
        response = self.client.delete(f'/api/admin/bookings/{self.booking.id}/')
        self.assertEqual(response.status_code, 405)

    def test_anonymous_401(self):
        self.client.force_authenticate(user=None)
        self.assertEqual(self.client.get('/api/admin/bookings/').status_code, 401)
