from django.db import models
from django.contrib.auth.models import BaseUserManager, AbstractBaseUser, PermissionsMixin
from django.utils import timezone
from util.fields import TimestampField, BooleanField


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
    created_on = TimestampField(auto_now_add=True, db_column='pCreatedOn')
    email = models.EmailField(max_length=255, unique=True, null=True, blank=True, db_column='pEmail')
    is_active = BooleanField(default=True, db_column='pActive')
    is_admin = BooleanField(default=False, db_column='pAdmin')
    password_reset_token = models.CharField(max_length=255, db_column='pResetToken', null=True, blank=True)
    password_reset_token_timeout = TimestampField(db_column='pResetTokenTimeout', null=True, blank=True)
    on_email_list = BooleanField(default=True, db_column='pOnEmailList')

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

    def __unicode__(self):
        return u'{}'.format(self.name)


class Game(models.Model):
    id = models.AutoField(primary_key=True, db_column='gId')
    party = models.CharField(max_length=255, db_column='gParty')
    created_on = TimestampField(auto_now_add=True, db_column='gCreatedOn')
    created_by = models.ForeignKey('Player', db_column='gCreatedBy', related_name='+')
    started_on = TimestampField(db_column='gStartedOn', blank=True, null=True)
    type = models.CharField(max_length=255, db_column='gType')
    master = models.ForeignKey('PlayerGame', db_column='gMaster', default=None, null=True, blank=True, related_name="masters_of")
    players = models.ManyToManyField('Player', through='PlayerGame')

    class Meta:
        db_table = 'tbGame'

    def __unicode__(self):
        return u'Game {}'.format(self.id)


class PlayerGame(models.Model):
    id = models.AutoField(primary_key=True, db_column='pgId')
    player = models.ForeignKey('Player', db_column='pId')
    game = models.ForeignKey('Game', db_column='gId')
    active = BooleanField(db_column='pgActive', default=True)
    created_on = TimestampField(auto_now_add=True, db_column='pgCreatedOn')

    class Meta:
        db_table = 'tbPlayerGame'

    def __unicode__(self):
        return u'{} in {}'.format(self.player, self.game)
