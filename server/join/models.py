from django.db import models


class Player(models.Model):
    id = models.AutoField(primary_key=True, db_column='pId')
    name = models.CharField(max_length=255, db_column='pName')
    created_on = models.DateTimeField(auto_now_add=True, db_column='pCreatedOn')

    class Meta:
        db_table = 'tbPlayer'
        managed = False

    def __unicode__(self):
        return u'Player {}'.format(self.id)


class Game(models.Model):
    id = models.AutoField(primary_key=True, db_column='gId')
    party = models.CharField(max_length=255, db_column='gParty')
    created_on = models.DateTimeField(auto_now_add=True, db_column='gCreatedOn')
    created_by = models.ForeignKey('Player', db_column='gCreatedBy', related_name='+')
    started_on = models.DateTimeField(db_column='gStartedOn', blank=True, null=True)
    type = models.CharField(max_length=255, db_column='gType')
    master = models.ForeignKey('PlayerGame', db_column='gMaster', null=True, blank=True, related_name="masters_of")
    players = models.ManyToManyField('Player', through='PlayerGame')

    class Meta:
        db_table = 'tbGame'
        managed = False

    def __unicode__(self):
        return u'Game {}'.format(self.id)


class PlayerGame(models.Model):
    id = models.AutoField(primary_key=True, db_column='pgId')
    player = models.ForeignKey('Player', db_column='pId')
    game = models.ForeignKey('Game', db_column='gId')
    active = models.BooleanField(db_column='pgActive', default=True)
    created_on = models.DateTimeField(auto_now_add=True, db_column='pgCreatedOn')

    class Meta:
        db_table = 'tbPlayerGame'
        managed = False

    def __unicode__(self):
        return u'{} in {}'.format(self.player, self.game)
