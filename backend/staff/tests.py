from django.test import TestCase, override_settings
from django.urls import reverse


class DjangoAdminUrlTests(TestCase):
    def test_django_admin_lives_under_django_admin(self):
        url = reverse('admin:index')
        self.assertTrue(url.startswith('/django-admin/'))

    def test_legacy_admin_path_is_not_django_admin(self):
        response = self.client.get('/admin/')
        self.assertNotEqual(response.status_code, 200)
