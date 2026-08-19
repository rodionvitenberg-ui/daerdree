from django.contrib.auth.models import User
from rest_framework.test import APITestCase
from boardgames.models import Category, Tag, BoardGame


class AdminCategoryTagTests(APITestCase):
    def setUp(self):
        self.staff = User.objects.create_user(username='keeper', password='secret-pass', is_staff=True)
        self.client.force_authenticate(self.staff)

    def test_create_category_autogen_slug(self):
        response = self.client.post(
            '/api/admin/categories/',
            {'name_ru': 'Стратегия', 'name_en': 'Strategy'},
            format='json',
        )
        self.assertEqual(response.status_code, 201)
        self.assertTrue(response.data['slug'])

    def test_delete_category_in_use_409(self):
        cat = Category.objects.create(name='Пати', slug='party')
        game, _ = BoardGame.objects.get_or_create(
            slug='codenames',
            defaults={'title': 'Codenames', 'description': '', 'play_time': 20},
        )
        game.categories.add(cat)
        response = self.client.delete(f'/api/admin/categories/{cat.id}/')
        self.assertEqual(response.status_code, 409)
        self.assertTrue(Category.objects.filter(id=cat.id).exists())

    def test_anonymous_401(self):
        self.client.force_authenticate(user=None)
        response = self.client.get('/api/admin/categories/')
        self.assertEqual(response.status_code, 401)
