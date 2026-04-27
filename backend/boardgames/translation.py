from modeltranslation.translator import register, TranslationOptions
from .models import BoardGame, Category, Tag, Expansion

@register(Category)
class CategoryTranslationOptions(TranslationOptions):
    fields = ('name', 'description')

@register(Tag)
class TagTranslationOptions(TranslationOptions):
    fields = ('name',)

@register(BoardGame)
class BoardGameTranslationOptions(TranslationOptions):
    fields = ('title', 'description') 

@register(Expansion)
class ExpansionTranslationOptions(TranslationOptions):
    fields = ('title', 'description')