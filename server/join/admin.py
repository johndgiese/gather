from django.contrib import admin
from django.db import models

from models import Player, Game, PlayerGame


@admin.register(Player)
class PlayerAdmin(admin.ModelAdmin):
    list_display = ('id', 'created_on', 'name')


# disable for now, to avoid confusion
#@admin.register(Game)
class GameAdmin(admin.ModelAdmin):

    list_display = ('id', 'created_on', 'party', 'created_by', 'num_players')

    def get_queryset(self, request):
        qs = super(GameAdmin, self).get_queryset(request)
        qs = qs.annotate(num_players=models.Count('playergame'))
        return qs

    def num_players(self, obj):
        return obj.num_players
    num_players.admin_order_field = 'num_players'

@admin.register(PlayerGame)
class PlayerGameAdmin(admin.ModelAdmin):
    pass
