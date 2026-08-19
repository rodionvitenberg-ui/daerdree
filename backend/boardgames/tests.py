import tempfile
import uuid
from django.contrib.auth.models import User
from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import override_settings
from rest_framework.test import APITestCase
from boardgames.models import BoardGame, Category, Expansion, GameImage, Tag

GIF = (
    b'GIF89a\x01\x00\x01\x00\x80\x00\x00\xff\xff\xff'
    b'\x00\x00\x00\x21\xf9\x04\x01\x00\x00\x00\x00\x2c'
    b'\x00\x00\x00\x00\x01\x00\x01\x00\x00\x02\x02D\x01\x00;'
)


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


class AdminGameTests(APITestCase):
    def setUp(self):
        self.media_dir = tempfile.TemporaryDirectory()
        media_override = override_settings(MEDIA_ROOT=self.media_dir.name)
        media_override.enable()
        self.addCleanup(media_override.disable)
        self.addCleanup(self.media_dir.cleanup)
        self.staff = User.objects.create_user(username='keeper', password='secret-pass', is_staff=True)
        self.client.force_authenticate(self.staff)
        self.cat, _ = Category.objects.get_or_create(
            slug='strategy',
            defaults={'name': 'Стратегия'},
        )

    def test_create_with_expansion_and_slug(self):
        response = self.client.post(
            '/api/admin/games/',
            {
                'title_ru': 'Кодовые имена',
                'title_en': 'Codenames',
                'description_ru': '<p>да</p>',
                'description_en': '<p>yes</p>',
                'min_players': 2,
                'max_players': 8,
                'play_time': 20,
                'difficulty': 2,
                'categories': [self.cat.id],
                'tags': [],
                'expansions': [
                    {'title_ru': 'Дуэт', 'title_en': 'Duet', 'description_ru': '', 'description_en': ''}
                ],
                'is_active': True,
                'is_visible_ru': True,
                'is_visible_en': True,
            },
            format='json',
        )
        self.assertEqual(response.status_code, 201)
        self.assertTrue(response.data['slug'])
        game_id = response.data['id']
        self.assertEqual(Expansion.objects.filter(game_id=game_id).count(), 1)

    def test_slug_suffix_when_taken(self):
        base = f'slug-t8-{uuid.uuid4().hex[:8]}'
        BoardGame.objects.create(
            title='Existing', slug=base, description='', play_time=10
        )
        response = self.client.post(
            '/api/admin/games/',
            {
                'title_ru': base,
                'description_ru': '<p>x</p>',
                'play_time': 10,
            },
            format='json',
        )
        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.data['slug'], f'{base}-2')

    def test_upload_cover_and_gallery(self):
        game = BoardGame.objects.create(
            title='X', slug=f'x-{uuid.uuid4().hex[:8]}', description='', play_time=10
        )
        cover = SimpleUploadedFile('c.gif', GIF, content_type='image/gif')
        cover_res = self.client.post(
            f'/api/admin/games/{game.id}/image/',
            {'file': cover},
            format='multipart',
        )
        self.assertEqual(cover_res.status_code, 200)
        gal = SimpleUploadedFile('g.gif', GIF, content_type='image/gif')
        gal_res = self.client.post(
            f'/api/admin/games/{game.id}/gallery/',
            {'file': gal, 'image_type': 'gallery', 'order': 0, 'alt': 'стол'},
            format='multipart',
        )
        self.assertEqual(gal_res.status_code, 201)
        self.assertEqual(GameImage.objects.filter(game=game).count(), 1)
        image_id = gal_res.data['id']
        patch_res = self.client.patch(
            f'/api/admin/games/{game.id}/gallery/{image_id}/',
            {'order': 3, 'alt': 'стол 2'},
            format='json',
        )
        self.assertEqual(patch_res.status_code, 200)
        self.assertEqual(patch_res.data['order'], 3)
        del_res = self.client.delete(f'/api/admin/games/{game.id}/gallery/{image_id}/')
        self.assertEqual(del_res.status_code, 204)
        self.assertEqual(GameImage.objects.filter(game=game).count(), 0)

    def test_hidden_game_not_on_public_list(self):
        hidden_title = f'Secret-{uuid.uuid4().hex[:8]}'
        BoardGame.objects.create(
            title=hidden_title,
            slug=f'secret-{uuid.uuid4().hex[:8]}',
            description='',
            play_time=10,
            is_active=True,
            is_visible_ru=False,
            is_visible_en=False,
        )
        public = self.client.get('/api/games/')
        self.assertEqual(public.status_code, 200)
        # unauthenticated public list uses is_visible_ru by default
        self.client.force_authenticate(user=None)
        public = self.client.get('/api/games/')
        titles = [row['title'] for row in (public.data if isinstance(public.data, list) else public.data.get('results', public.data))]
        self.assertNotIn(hidden_title, titles)
