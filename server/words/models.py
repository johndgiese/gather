from django.db import models
from join.models import Game, Player
from django.core.exceptions import ObjectDoesNotExist

from join.models import Game
from calculate_stats import calculate_funny_votes, calculate_response_stats

from util.fields import TimestampField, BooleanField

class Response(models.Model):
    id = models.AutoField(primary_key=True, db_column='resId')
    text = models.CharField(max_length=255, db_column='resText')
    active = BooleanField(default=True, db_column='resActive')
    tags = models.ManyToManyField('Tag', through='ResponseTag')
    created_by = models.ForeignKey('join.Player', db_column='resCreatedBy')
    created_on = TimestampField(auto_now_add=True, db_column='resCreatedOn')

    def refresh_stats(self):
        try:
            self.stats
        except ObjectDoesNotExist:
            self.stats = ResponseStats()
        self.stats.refresh()

    class Meta:
        db_table = 'tbResponse'

    def __unicode__(self):
        return self.text


class Prompt(models.Model):
    id = models.AutoField(primary_key=True, db_column='proId')
    text = models.CharField(max_length=255, db_column='proText')
    active = BooleanField(default=True, db_column='proActive')
    created_by = models.ForeignKey('join.Player', db_column='proCreatedBy')
    created_on = TimestampField(auto_now_add=True, db_column='proCreatedOn')
    tags = models.ManyToManyField('Tag', through='PromptTag')


    def refresh_stats(self):
        try:
            self.stats
        except ObjectDoesNotExist:
            self.stats = PromptStats()
        self.stats.refresh()

    class Meta:
        db_table = 'tbPrompt'

    def __unicode__(self):
        return self.text


class Tag(models.Model):
    id = models.AutoField(primary_key=True, db_column='tId')
    created_by = models.ForeignKey('join.Player', db_column='tCreatedBy')
    text = models.CharField(max_length=255, db_column='tText')
    created_on = TimestampField(auto_now_add=True, db_column='tCreatedOn')

    class Meta:
        db_table = 'tbTag'

    def __unicode__(self):
        return self.text


class ResponseTag(models.Model):
    id = models.AutoField(primary_key=True, db_column='atId')
    tag = models.ForeignKey(Tag, db_column='tId')
    created_by = models.ForeignKey('join.Player', db_column='atCreatedBy')
    created_on = TimestampField(auto_now_add=True, db_column='atCreatedOn')
    response = models.ForeignKey(Response, db_column='resId')

    class Meta:
        db_table = 'tbResponseTag'

    def __unicode__(self):
        return u'{} <--> {}'.format(self.tag, self.response)


class PromptTag(models.Model):
    id = models.AutoField(primary_key=True, db_column='qtId')
    tag = models.ForeignKey(Tag, db_column='tId')
    created_by = models.ForeignKey('join.Player', db_column='qtCreatedBy')
    created_on = TimestampField(auto_now_add=True, db_column='qtCreatedOn')
    prompt = models.ForeignKey(Prompt, db_column='proId')

    class Meta:
        db_table = 'tbPromptTag'

    def __unicode__(self):
        return u'{} <--> {}'.format(self.tag, self.prompt)


class FunnyVote(models.Model):
    id = models.AutoField(primary_key=True)
    response = models.ForeignKey(Response)
    prompt = models.ForeignKey(Prompt)
    funny = BooleanField(default=True)

    def __unicode__(self):
        return u'{} <--> {}'.format(self.prompt, self.response)



class Round(models.Model):
    id = models.AutoField(primary_key=True, db_column='rId')
    game = models.ForeignKey('join.Game', db_column='gId', related_name="rounds")
    prompt = models.ForeignKey('Prompt', db_column='proId')
    reader = models.ForeignKey('join.PlayerGame', db_column='pgId')
    number = models.IntegerField(db_column='rNumber')
    created_on = TimestampField(auto_now_add=True, db_column='rCreatedOn')
    done_reading_prompt = TimestampField(db_column='rDoneReadingPrompt', blank=True, null=True)
    done_choosing = TimestampField(db_column='rDoneChoosing', blank=True, null=True)
    done_reading_choices = TimestampField(db_column='rDoneReadingChoices', blank=True, null=True)
    done_voting = TimestampField(db_column='rDoneVoting', blank=True, null=True)

    class Meta:
        unique_together = (("game", "number"),)
        db_table = 'tbRound'

    def __unicode__(self):
        return u'Round {} of {}'.format(self.number, self.game)


class Card(models.Model):
    id = models.AutoField(primary_key=True, db_column='cId')
    response = models.ForeignKey('Response', db_column='resId')
    round_played = models.ForeignKey('Round', db_column='rId', blank=True, null=True, default=None)
    owner = models.ForeignKey('join.PlayerGame', db_column='pgId')
    created_on = TimestampField(auto_now_add=True, db_column='cCreatedOn')
    played_on = TimestampField(auto_now=True, db_column='cPlayedOn')

    class Meta:
        db_table = 'tbCard'

    def __unicode__(self):
        return u'Card {} in hand of {}'.format(self.response.text, self.owner.player.name)


class Vote(models.Model):
    id = models.AutoField(primary_key=True, db_column='vId')
    voter = models.ForeignKey('join.PlayerGame', db_column='pgId')
    card = models.ForeignKey('Card', db_column='cId')
    created_on = TimestampField(auto_now_add=True, db_column='vCreatedOn')

    class Meta:
        db_table = 'tbVote'

    def __unicode__(self):
        return u'Vote by {} for {}'.format(self.voter, self.card)


class WordGame(Game):
    """Dummy proxy model; hack to allow two different admin views."""
    class Meta:
        proxy = True


class ResponseStats(models.Model):
    """
    Keep track of statistics related to responses.

    This is to keep performance high, as the calls require a lot of database hits.
    """
    response = models.OneToOneField('Response', related_name="stats", blank=True)

    num_funny_votes = models.IntegerField(default=0)
    percent_funny_votes = models.FloatField(default=0)

    times_played = models.IntegerField(default=0)
    num_votes = models.IntegerField(default=0)
    percent_votes = models.FloatField(default=0)

    def refresh(self):
        num_funny_votes, percent_funny_votes = calculate_funny_votes(self.response)
        self.num_funny_votes = num_funny_votes
        self.percent_funny_votes = percent_funny_votes

        num_votes, times_played, percent_votes = calculate_response_stats(self.response)
        self.num_votes = num_votes
        self.times_played = times_played
        self.percent_votes = percent_votes

        self.save()


class PromptStats(models.Model):
    prompt = models.OneToOneField('Prompt', related_name="stats", blank=True)

    num_funny_votes = models.IntegerField(default=0)
    percent_funny_votes = models.FloatField(default=0)

    def refresh(self):
        num_funny_votes, percent_funny_votes = calculate_funny_votes(self.prompt)
        self.num_funny_votes = num_funny_votes
        self.percent_funny_votes = percent_funny_votes

        self.save()

