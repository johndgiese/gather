from django.db import models
from join.models import Game


class Response(models.Model):
    id = models.AutoField(primary_key=True, db_column='resId')
    text = models.CharField(max_length=255, db_column='resText')
    active = models.BooleanField(default=True, db_column='resActive')
    tags = models.ManyToManyField('Tag', through='ResponseTag')

    @property
    def is_cah(self):
        try:
            self.tags.get(text="Cards Against Humanity")
        except Exception as e:
            print(e)
            return False
        return True
    
    class Meta:
        db_table = 'tbResponse'
        managed = False

    def __unicode__(self):
        return self.text


class Prompt(models.Model):
    id = models.AutoField(primary_key=True, db_column='proId')
    text = models.CharField(max_length=255, db_column='proText')
    active = models.BooleanField(default=True, db_column='proActive')
    tags = models.ManyToManyField('Tag', through='PromptTag')

    @property
    def is_cah(self):
        try:
            self.tags.get(text="Cards Against Humanity")
        except Exception as e:
            print(e)
            return False
        return True

    class Meta:
        db_table = 'tbPrompt'
        managed = False

    def __unicode__(self):
        return self.text


class Tag(models.Model):
    id = models.AutoField(primary_key=True, db_column='tId')
    text = models.CharField(max_length=255, db_column='tText')

    class Meta:
        db_table = 'tbTag'
        managed = False

    def __unicode__(self):
        return self.text


class ResponseTag(models.Model):
    id = models.AutoField(primary_key=True, db_column='atId')
    tag = models.ForeignKey(Tag, db_column='tId')
    response = models.ForeignKey(Response, db_column='resId')

    class Meta:
        db_table = 'tbResponseTag'
        managed = False

    def __unicode__(self):
        return u'{} <--> {}'.format(self.tag, self.response)


class PromptTag(models.Model):
    id = models.AutoField(primary_key=True, db_column='qtId')
    tag = models.ForeignKey(Tag, db_column='tId')
    prompt = models.ForeignKey(Prompt, db_column='proId')

    class Meta:
        db_table = 'tbPromptTag'
        managed = False

    def __unicode__(self):
        return u'{} <--> {}'.format(self.tag, self.prompt)


class FunnyVote(models.Model):
    id = models.AutoField(primary_key=True)
    response = models.ForeignKey(Response)
    prompt = models.ForeignKey(Prompt)
    funny = models.BooleanField(default=True)

    def __unicode__(self):
        return u'{} <--> {}'.format(self.prompt, self.response)


class Round(models.Model):
    id = models.AutoField(primary_key=True, db_column='rId')
    game = models.ForeignKey('join.Game', db_column='gId')
    prompt = models.ForeignKey('Prompt', db_column='proId')
    reader = models.ForeignKey('join.PlayerGame', db_column='pgId')
    number = models.IntegerField(db_column='rNumber')
    created_on = models.DateTimeField(auto_now_add=True, db_column='rCreatedOn')
    done_reading_prompt = models.DateTimeField(db_column='rDoneReadingPrompt', blank=True, null=True)
    done_choosing = models.DateTimeField(db_column='rDoneChoosing', blank=True, null=True)
    done_reading_choices = models.DateTimeField(db_column='rDoneReadingChoices', blank=True, null=True)
    done_voting = models.DateTimeField(db_column='rDoneVoting', blank=True, null=True)

    class Meta:
        unique_together = (("game", "number"),)
        db_table = 'tbRound'

    def __unicode__(self):
        return u'Round {} of {}'.format(self.number, self.game)


class Card(models.Model):
    id = models.AutoField(primary_key=True, db_column='cId')
    response = models.ForeignKey('Response', db_column='resId')
    round_played = models.ForeignKey('Round', db_column='rId', blank=True, null=True)
    owner = models.ForeignKey('join.PlayerGame', db_column='pgId')
    created_on = models.DateTimeField(auto_now_add=True, db_column='cCreatedOn')
    played_on = models.DateTimeField(auto_now=True, db_column='cPlayedOn')

    class Meta:
        db_table = 'tbCard'

    def __unicode__(self):
        return u'Card {} in hand of {}'.format(self.response.text, self.owner.player.name)


class Vote(models.Model):
    id = models.AutoField(primary_key=True, db_column='vId')
    voter = models.ForeignKey('join.PlayerGame', db_column='pgId')
    card = models.ForeignKey('Card', db_column='cId')
    created_on = models.DateTimeField(auto_now_add=True, db_column='vCreatedOn')

    class Meta:
        db_table = 'tbVote'

    def __unicode__(self):
        return u'Vote by {} for {}'.format(self.voter, self.card)


class WordGame(Game):
    class Meta:
        proxy = True

