from django.db import models
from django.contrib.auth.models import BaseUserManager, AbstractBaseUser, PermissionsMixin
from django.utils import timezone


class PersonManager(BaseUserManager):
    def create_user(self, email, password=None):
        if not email:
            raise ValueError('Users must have an email address')
        user = self.model(email=self.normalize_email(email))
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password):
        user = self.create_user(email, password=password)
        user.is_admin = True
        user.save(using=self._db)
        return user


class Player(AbstractBaseUser, PermissionsMixin):
    id = models.AutoField(primary_key=True, db_column='pId')
    name = models.CharField(max_length=255, db_column='pName')
    created_on = models.DateTimeField(auto_now_add=True, db_column='pCreatedOn')
    email = models.EmailField(max_length=255, unique=True, null=True, blank=True, db_column='pEmail')
    is_active = models.BooleanField(default=True, db_column='pActive')
    is_admin = models.BooleanField(default=False, db_column='pAdmin')
    password_reset_token = models.CharField(max_length=255, db_column='pResetToken', null=True, blank=True)
    password_reset_token_timeout = models.DateTimeField(db_column='pResetTokenTimeout', null=True, blank=True)

    objects = PersonManager()

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = []

    def get_full_name(self):
        return self.email

    def get_short_name(self):
        return self.email

    @property
    def is_staff(self):
        return self.is_admin

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
