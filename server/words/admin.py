from django.contrib import admin
from django.shortcuts import redirect
from django.forms import TextInput, Textarea
from django.db import models
from django.db.models import Count
from django.contrib.messages import ERROR

from models import Response, Prompt, Tag, ResponseTag, PromptTag, FunnyVote, Vote, Card, Round, WordGame
from join.models import PlayerGame

# ACTIONS



# RANDOM CRAP

class ResponseTagInline(admin.StackedInline):
    model = ResponseTag


class PromptTagInline(admin.StackedInline):
    model = PromptTag


def print_tags(instance):
    return ", ".join([i.text for i in instance.tags.all()])
print_tags.short_description = 'Tags'


def percent_funny(instance):
    num_funny = instance.funnyvote_set.filter(funny=True).count()
    total = instance.num_funny_votes
    if total == 0:
        return int(0)
    else:
        return int(round((num_funny/float(total))*100.0))
percent_funny.short_description = '% Funny'


wider_tag_edit_fields = {
    models.CharField: {'widget': TextInput(attrs={'size': '100'})},
}



# THE MODEL ADMINS

class WordAdmin(admin.ModelAdmin):
    list_display = ['id', 'created_by', 'created_on', 'active', percent_funny, 'num_funny_votes', 'text']

    def get_queryset(self, request):
        qs = super(WordAdmin, self).get_queryset(request)
        qs = qs.annotate(num_funny_votes=models.Count('funnyvote'))
        return qs

    def num_funny_votes(self, obj):
        return obj.num_funny_votes
    num_funny_votes.admin_order_field = 'num_funny_votes'
    num_funny_votes.short_description = 'FV'

    list_editable = ['text']
    list_filter = ('active', 'tags')
    list_per_page = 1000
    save_on_top = True

    formfield_overrides = wider_tag_edit_fields

    actions = ['mark_active', 'mark_inactive', 'create_using', 'create_from_active', 'claim_to_have_created_these']

    def mark_active(self, request, queryset):
        rows_updated = queryset.update(active=True)
        if rows_updated == 1:
            message_bit = "1 word was"
        else:
            message_bit = "%s words were" % rows_updated
        self.message_user(request, "%s successfully marked as active." % message_bit)

    def claim_to_have_created_these(self, request, queryset):
        rows_updated = queryset.update(created_by=request.user)
        self.message_user(request, "Successfully claimed creation of %d words." % rows_updated)

    def mark_inactive(self, request, queryset):
        rows_updated = queryset.update(active=False)
        if rows_updated == 1:
            message_bit = "1 word was"
        else:
            message_bit = "%s words were" % rows_updated
        self.message_user(request, "%s successfully marked as inactive." % message_bit)

    def create_using(self, request, queryset):
        request.session['validate_using'] = [q.id for q in queryset]
        if self.model == Prompt:
            return redirect('response_new')
        else:
            return redirect('prompt_new')

    def create_from_active(self, request, queryset):
        if self.model == Prompt:
            request.session['validate_using'] = [q.id for q in Response.objects.filter(active=True)]
            return redirect('prompt_new')
        else:
            request.session['validate_using'] = [q.id for q in Prompt.objects.filter(active=True)]
            return redirect('response_new')


@admin.register(Response)
class ResponseAdmin(WordAdmin):
    model = Response
    inlines = [ResponseTagInline]

    list_display = list(WordAdmin.list_display)
    list_display.insert(5, 'num_votes')

    def num_votes(self, response):
        return response.card_set.annotate(num_votes=Count('vote')).aggregate(Count('num_votes'))['num_votes__count']
    num_votes.short_description = 'Votes'


@admin.register(Prompt)
class PromptAdmin(WordAdmin):
    model = Prompt
    inlines = [PromptTagInline]


@admin.register(Tag)
class TagAdmin(admin.ModelAdmin):
    list_display = ['id', 'text']
    list_editable = ['text']


@admin.register(FunnyVote)
class FunnyVoteAdmin(admin.ModelAdmin):
    list_display = ['funny', 'prompt', 'response']


class CardInline(admin.TabularInline):
    model = Card
    extra = 0
    can_delete = False

@admin.register(Round)
class Round(admin.ModelAdmin):
    inlines = [CardInline]

    list_display = [
        'id',
        'game', 
        'created_on', 
        'number', 
        'cards_played',
        'prompt', 
        'stage',
    ]

    def stage(self, round):
        if round.done_reading_prompt is None:
            return 0
        elif round.done_choosing is None:
            return 1
        elif round.done_reading_choices is None:
            return 2
        elif round.done_voting is None:
            return 3
        else:
            return 4
    stage.short_description = 'Stage'

    def cards_played(self, round):
        return round.card_set.count()
    cards_played.short_description = 'Cards Played'


@admin.register(Vote)
class Vote(admin.ModelAdmin):
    pass


@admin.register(Card)
class Card(admin.ModelAdmin):
    pass


class PlayerGameInline(admin.TabularInline):
    model = PlayerGame
    fk_name = 'game'
    extra = 0
    can_delete = False


class GameLengthFilter(admin.SimpleListFilter):
    title = 'game length'
    parameter_name = 'gamelength'

    def lookups(self, request, model_admin):
        return (
            ('short', '1 - 5 rounds'),
            ('medium', '6 - 19 rounds'),
            ('long', '20+  rounds'),
        )

    def queryset(self, request, queryset):
        if self.value() == "short":
            return queryset.annotate(n_rounds=Count('rounds')).filter(n_rounds__lte=5)
        elif self.value() == "medium":
            return queryset.annotate(n_rounds=Count('rounds')).filter(n_rounds__gte=6, n_rounds__lte=19)
        elif self.value() == "long":
            return queryset.annotate(n_rounds=Count('rounds')).filter(n_rounds__gte=20)
        else:
            return queryset


@admin.register(WordGame)
class WordGameAdmin(admin.ModelAdmin):
    inlines = [PlayerGameInline]

    list_display = ('id', 'started_on', 'party', 'created_by', 'num_players', 'num_rounds')
    list_filter = ('started_on', GameLengthFilter)

    def num_players(self, obj):
        return obj.players.count()

    def num_rounds(self, obj):
        return obj.rounds.count()

    def get_queryset(self, request):
        qs = super(WordGameAdmin, self).get_queryset(request)
        qs = qs.exclude(started_on=None)  # filter out games that don't start
        qs = qs.filter(started_on__gte='2014-9-30')  # filter out pre-beta games
        return qs

