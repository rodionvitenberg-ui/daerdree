from django.db import transaction
from django.utils.text import slugify
from rest_framework import serializers
from .models import BoardGame, Category, Expansion, GameImage, Tag


def unique_slug(model, base, exclude_pk=None, max_length=200):
    base = (base or 'game')[:max_length]
    qs = model.objects.all()
    if exclude_pk:
        qs = qs.exclude(pk=exclude_pk)
    candidate = base
    n = 2
    while qs.filter(slug=candidate).exists():
        suffix = f'-{n}'
        candidate = f'{base[:max_length - len(suffix)]}{suffix}'
        n += 1
    return candidate


class SlugAutogenMixin:
    def validate(self, attrs):
        if attrs.get('slug'):
            return attrs
        if self.instance is not None and 'slug' not in getattr(self, 'initial_data', {}):
            return attrs
        attrs['slug'] = slugify(
            attrs.get('name_ru') or attrs.get('name') or '',
            allow_unicode=True,
        )
        return attrs


class CategoryAdminSerializer(SlugAutogenMixin, serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = [
            'id',
            'slug',
            'name_ru',
            'name_en',
            'description_ru',
            'description_en',
            'icon',
        ]
        extra_kwargs = {
            'slug': {'required': False, 'allow_blank': True, 'allow_unicode': True},
        }


class TagAdminSerializer(SlugAutogenMixin, serializers.ModelSerializer):
    class Meta:
        model = Tag
        fields = ['id', 'slug', 'name_ru', 'name_en', 'icon']
        extra_kwargs = {
            'slug': {'required': False, 'allow_blank': True, 'allow_unicode': True},
        }


class ExpansionAdminSerializer(serializers.ModelSerializer):
    id = serializers.IntegerField(required=False)

    class Meta:
        model = Expansion
        fields = ['id', 'title_ru', 'title_en', 'description_ru', 'description_en']
        extra_kwargs = {
            'title_en': {'required': False, 'allow_blank': True},
            'description_ru': {'required': False, 'allow_blank': True},
            'description_en': {'required': False, 'allow_blank': True},
        }


class GameImageAdminSerializer(serializers.ModelSerializer):
    class Meta:
        model = GameImage
        fields = ['id', 'image', 'image_type', 'order', 'alt']
        extra_kwargs = {
            'image': {'read_only': True},
        }


class BoardGameListSerializer(serializers.ModelSerializer):
    categories = CategoryAdminSerializer(many=True, read_only=True)
    tags = TagAdminSerializer(many=True, read_only=True)

    class Meta:
        model = BoardGame
        fields = [
            'id',
            'title_ru',
            'title_en',
            'image',
            'is_active',
            'is_visible_ru',
            'is_visible_en',
            'slug',
            'categories',
            'tags',
        ]


class BoardGameAdminSerializer(serializers.ModelSerializer):
    categories = serializers.PrimaryKeyRelatedField(
        many=True, queryset=Category.objects.all(), required=False
    )
    tags = serializers.PrimaryKeyRelatedField(
        many=True, queryset=Tag.objects.all(), required=False
    )
    expansions = ExpansionAdminSerializer(many=True, required=False)
    images = GameImageAdminSerializer(many=True, read_only=True)

    class Meta:
        model = BoardGame
        fields = [
            'id',
            'slug',
            'title_ru',
            'title_en',
            'description_ru',
            'description_en',
            'categories',
            'tags',
            'min_players',
            'max_players',
            'play_time',
            'difficulty',
            'designer',
            'bgg_type',
            'image',
            'setup_image',
            'images',
            'expansions',
            'is_active',
            'is_visible_ru',
            'is_visible_en',
            'created_at',
        ]
        extra_kwargs = {
            'slug': {'required': False, 'allow_blank': True, 'allow_unicode': True},
            'title_en': {'required': False, 'allow_blank': True},
            'description_en': {'required': False, 'allow_blank': True},
            'designer': {'required': False, 'allow_blank': True},
            'bgg_type': {'required': False, 'allow_blank': True},
            'image': {'read_only': True},
            'setup_image': {'read_only': True},
            'created_at': {'read_only': True},
        }

    def to_representation(self, instance):
        data = super().to_representation(instance)
        data['categories'] = CategoryAdminSerializer(
            instance.categories.all(), many=True, context=self.context
        ).data
        data['tags'] = TagAdminSerializer(
            instance.tags.all(), many=True, context=self.context
        ).data
        return data

    def validate(self, attrs):
        if attrs.get('slug'):
            return attrs
        if self.instance is not None and 'slug' not in getattr(self, 'initial_data', {}):
            return attrs
        base = slugify(
            attrs.get('title_ru') or attrs.get('title') or '',
            allow_unicode=True,
        )
        attrs['slug'] = unique_slug(
            BoardGame,
            base,
            exclude_pk=self.instance.pk if self.instance is not None else None,
        )
        return attrs

    @transaction.atomic
    def create(self, validated_data):
        categories = validated_data.pop('categories', [])
        tags = validated_data.pop('tags', [])
        expansions = validated_data.pop('expansions', [])
        game = BoardGame.objects.create(**validated_data)
        game.categories.set(categories)
        game.tags.set(tags)
        self._sync_expansions(game, expansions)
        return game

    @transaction.atomic
    def update(self, instance, validated_data):
        categories = validated_data.pop('categories', None)
        tags = validated_data.pop('tags', None)
        expansions = validated_data.pop('expansions', None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        if categories is not None:
            instance.categories.set(categories)
        if tags is not None:
            instance.tags.set(tags)
        if expansions is not None:
            self._sync_expansions(instance, expansions)
        return instance

    def _sync_expansions(self, game, items):
        keep_ids = []
        for item in items:
            item = dict(item)
            exp_id = item.pop('id', None)
            if exp_id:
                try:
                    obj = Expansion.objects.get(pk=exp_id, game=game)
                except Expansion.DoesNotExist:
                    raise serializers.ValidationError(
                        {'expansions': 'Дополнение не найдено.'}
                    )
                for key, value in item.items():
                    setattr(obj, key, value)
                obj.save()
                keep_ids.append(obj.id)
            else:
                obj = Expansion.objects.create(game=game, **item)
                keep_ids.append(obj.id)
        game.expansions.exclude(id__in=keep_ids).delete()
