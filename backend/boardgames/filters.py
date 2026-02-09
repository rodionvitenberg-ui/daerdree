import django_filters
from .models import BoardGame, Tag, Category

class BoardGameFilter(django_filters.FilterSet):
    players_count = django_filters.NumberFilter(method='filter_players')
    min_time = django_filters.NumberFilter(field_name='play_time', lookup_expr='gte')
    max_time = django_filters.NumberFilter(field_name='play_time', lookup_expr='lte')

    min_difficulty = django_filters.NumberFilter(field_name='difficulty', lookup_expr='gte')
    max_difficulty = django_filters.NumberFilter(field_name='difficulty', lookup_expr='lte')

    tags = django_filters.ModelMultipleChoiceFilter(
        field_name='tags__slug', # Можно фильтровать по slug (tags=dice), можно по id. Выберем slug для красоты URL или id для простоты фронта.
        to_field_name='slug',
        queryset=Tag.objects.all(),
        conjoined=False  # False = ИЛИ (игры с тегом А или Б), True = И (игры с тегом А и Б одновременно)
    )

    # 5. Категория (можно оставить одну, можно несколько)
    category = django_filters.ModelMultipleChoiceFilter(
        field_name='category__slug',
        to_field_name='slug',
        queryset=Category.objects.all()
    )

    class Meta:
        model = BoardGame
        fields = ['category', 'tags', 'difficulty']

    def filter_players(self, queryset, name, value):
        """
        Ищет игры, в которые можно сыграть указанным составом.
        """
        return queryset.filter(min_players__lte=value, max_players__gte=value)