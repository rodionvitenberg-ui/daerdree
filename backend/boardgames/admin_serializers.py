from django.utils.text import slugify
from rest_framework import serializers
from .models import Category, Tag


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
