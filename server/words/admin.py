from django.contrib import admin
from django.shortcuts import redirect
from django.forms import TextInput, Textarea
from django.db import models
from django.db.models import Count
from django.contrib.messages import ERROR

from models import Response, Prompt, Tag, ResponseTag, PromptTag, FunnyVote, Vote, Card, Round, WordGame

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
    list_display = ['id', 'active', 'is_cah', percent_funny, 'num_funny_votes', 'text']

    def get_queryset(self, request):
        qs = super(WordAdmin, self).get_queryset(request)
        qs = qs.annotate(num_funny_votes=models.Count('funnyvote'))
        return qs

    def num_funny_votes(self, obj):
        return obj.num_funny_votes
    num_funny_votes.admin_order_field = 'num_funny_votes'
    num_funny_votes.short_description = 'FV'

    def is_cah(self, obj):
        return not 'Cards Against Humanity' in [t.text for t in obj.tags.all()[:]]
    is_cah.short_description = '!CAH'
    is_cah.boolean = True

    list_editable = ['text']
    list_filter = ('active', 'tags')
    list_per_page = 1000
    save_on_top = True

    formfield_overrides = wider_tag_edit_fields

    actions = ['mark_active', 'mark_inactive', 'create_using', 'create_from_active']

    def mark_active(self, request, queryset):
        rows_updated = queryset.update(active=True)
        if rows_updated == 1:
            message_bit = "1 word was"
        else:
            message_bit = "%s words were" % rows_updated
        self.message_user(request, "%s successfully marked as active." % message_bit)

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


@admin.register(Round)
class Round(admin.ModelAdmin):
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


@admin.register(WordGame)
class WordGameAdmin(admin.ModelAdmin):

    list_display = ('created_on', 'party', 'created_by', 'num_players') #, 'num_rounds')

    def get_queryset(self, request):
        qs = super(WordGameAdmin, self).get_queryset(request)
        qs = qs.annotate(num_players=models.Count('playergame'), num_rounds=models.Count('round'))
        return qs

    def num_players(self, obj):
        return obj.num_players
    num_players.admin_order_field = 'num_players'

    # TODO: figure out why this isn't working
    #def num_rounds(self, obj):
        #return obj.num_rounds
    #num_rounds.admin_order_field = 'num_rounds'

