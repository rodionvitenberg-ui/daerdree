from rest_framework import serializers
from .models import Category, Tag, BoardGame

class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ['id', 'name', 'slug', 'icon', 'description']

class TagSerializer(serializers.ModelSerializer):
    class Meta:
        model = Tag
        fields = ['id', 'name', 'slug']

class BoardGameSerializer(serializers.ModelSerializer):

    category = CategorySerializer(read_only=True)
    

    tags = TagSerializer(many=True, read_only=True) 

    class Meta:
        model = BoardGame
        fields = '__all__'

class GameMarqueeSerializer(serializers.ModelSerializer):
    """Облегченный сериализатор чисто для бегущей строки"""
    class Meta:
        model = BoardGame
        # Берем только то, что нужно для отрисовки и клика
        fields = ['id', 'title', 'image', 'slug']