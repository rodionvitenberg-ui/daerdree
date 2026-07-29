from rest_framework import serializers
from .models import Category, Tag, BoardGame, Expansion

class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ['id', 'name', 'slug', 'icon', 'description']

class TagSerializer(serializers.ModelSerializer):
    class Meta:
        model = Tag
        fields = ['id', 'name', 'slug']

# Сериализатор для дополнения
class ExpansionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Expansion
        fields = ['id', 'title', 'description']

class BoardGameSerializer(serializers.ModelSerializer):
    categories = CategorySerializer(many=True, read_only=True)
    tags = TagSerializer(many=True, read_only=True)
    expansions = ExpansionSerializer(many=True, read_only=True)

    class Meta:
        model = BoardGame
        fields = '__all__'

    def to_representation(self, instance):
        """Безопасная сериализация: приводит RichTextField к строке."""
        data = super().to_representation(instance)
        # Принудительно преобразуем description в строку (CKEditor иногда отдаёт объект)
        if data.get('description') is not None:
            data['description'] = str(data['description'])
        return data

class GameMarqueeSerializer(serializers.ModelSerializer):
    """Облегченный сериализатор чисто для бегущей строки"""
    class Meta:
        model = BoardGame
        fields = ['id', 'title', 'image', 'slug']
