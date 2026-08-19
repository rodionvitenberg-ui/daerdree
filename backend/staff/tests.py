from django.contrib.auth.models import User
from django.test import TestCase, override_settings
from django.urls import reverse
from rest_framework.test import APITestCase


class DjangoAdminUrlTests(TestCase):
    def test_django_admin_lives_under_django_admin(self):
        url = reverse('admin:index')
        self.assertTrue(url.startswith('/django-admin/'))

    def test_legacy_admin_path_is_not_django_admin(self):
        response = self.client.get('/admin/')
        self.assertNotEqual(response.status_code, 200)


class StaffAuthTests(APITestCase):
    def setUp(self):
        self.staff = User.objects.create_user(
            username='keeper', password='secret-pass', is_staff=True
        )
        self.guest = User.objects.create_user(
            username='guest', password='secret-pass', is_staff=False
        )

    def test_me_anonymous_401(self):
        response = self.client.get('/api/admin/me/')
        self.assertEqual(response.status_code, 401)

    def test_login_staff_ok_and_me(self):
        response = self.client.post(
            '/api/admin/login/',
            {'username': 'keeper', 'password': 'secret-pass'},
            format='json',
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['username'], 'keeper')
        me = self.client.get('/api/admin/me/')
        self.assertEqual(me.status_code, 200)
        self.assertEqual(me.data['username'], 'keeper')

    def test_login_non_staff_403(self):
        response = self.client.post(
            '/api/admin/login/',
            {'username': 'guest', 'password': 'secret-pass'},
            format='json',
        )
        self.assertEqual(response.status_code, 403)

    def test_login_bad_password_400(self):
        response = self.client.post(
            '/api/admin/login/',
            {'username': 'keeper', 'password': 'nope'},
            format='json',
        )
        self.assertEqual(response.status_code, 400)

    def test_logout_then_me_401(self):
        self.client.post(
            '/api/admin/login/',
            {'username': 'keeper', 'password': 'secret-pass'},
            format='json',
        )
        out = self.client.post('/api/admin/logout/', format='json')
        self.assertEqual(out.status_code, 200)
        me = self.client.get('/api/admin/me/')
        self.assertEqual(me.status_code, 401)

    def test_csrf_endpoint_sets_cookie(self):
        response = self.client.get('/api/admin/csrf/')
        self.assertEqual(response.status_code, 200)
        self.assertIn('csrftoken', response.cookies)
