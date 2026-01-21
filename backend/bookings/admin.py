from django.contrib import admin
from .models import Booking

@admin.register(Booking)
class BookingAdmin(admin.ModelAdmin):
    list_display = ('name', 'date', 'contact', 'guests', 'status', 'created_at')
    list_filter = ('status', 'date')
    readonly_fields = ('created_at',)