from django.contrib import admin

from util.models import Answer

@admin.register(Answer)
class AnswerAdmin(admin.ModelAdmin):
    list_display = ('id', 'question', 'answer', 'ip_address')
