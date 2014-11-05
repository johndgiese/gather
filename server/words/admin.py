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


def stats_field(stats_key, short_description):
    """Generate a `list_display` callable for stats fields."""
    def get_stat(obj):
        return getattr(obj.stats, stats_key)
    get_stat.short_description = short_description
    get_stat.admin_order_field = 'stats__' + stats_key
    return get_stat


wider_tag_edit_fields = {
    models.CharField: {'widget': TextInput(attrs={'size': '100'})},
}


# THE MODEL ADMINS

class WordAdmin(admin.ModelAdmin):
    """Abstract base word admin class."""

    Model = None  # fill in in subclass

    list_display = [
        'id', 
        'active', 
        'is_cah', 
        stats_field('num_funny_votes', 'NFV'),
        stats_field('percent_funny_votes', '%FV'),
        'text'
    ]


    list_editable = ['text']
    list_filter = ('active', 'tags')
    list_per_page = 1000
    save_on_top = True

    formfield_overrides = wider_tag_edit_fields

    actions = ['mark_active', 'mark_inactive', 'create_using', 'create_from_active', 'refresh_stats', 'claim_to_have_created_these']

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
        request.session['validate_using'] = [q.id for q in self.Model.objects.filter(active=True)]
        if self.Model == Prompt:
            return redirect('prompt_new')
        else:
            return redirect('response_new')

    def refresh_stats(self, request, queryset):
        if len(queryset) == 0:
            queryset = self.Model.objects.all()

        for m in queryset:
            m.refresh_stats()


@admin.register(Response)
class ResponseAdmin(WordAdmin):
    Model = Response
    inlines = [ResponseTagInline]

    # insert extra stats after base stats, but before text
    list_display = list(WordAdmin.list_display)
    just_before_text = len(list_display) - 1

    list_display.insert(just_before_text, stats_field('num_votes', 'NV'))
    just_before_text += 1

    list_display.insert(just_before_text, stats_field('percent_votes', '%VWP'))
    just_before_text += 1


@admin.register(Prompt)
class PromptAdmin(WordAdmin):
    Model = Prompt
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

