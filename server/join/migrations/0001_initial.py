# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import models, migrations
import util.fields
import django.utils.timezone
from django.conf import settings


class Migration(migrations.Migration):

    dependencies = [
        ('auth', '0001_initial'),
    ]

    operations = [
        migrations.CreateModel(
            name='Player',
            fields=[
                ('password', models.CharField(max_length=128, verbose_name='password')),
                ('last_login', models.DateTimeField(default=django.utils.timezone.now, verbose_name='last login')),
                ('is_superuser', models.BooleanField(default=False, help_text='Designates that this user has all permissions without explicitly assigning them.', verbose_name='superuser status')),
                ('id', models.AutoField(serialize=False, primary_key=True, db_column=b'pId')),
                ('name', models.CharField(max_length=255, db_column=b'pName')),
                ('created_on', util.fields.TimestampField(auto_now_add=True, db_column=b'pCreatedOn')),
                ('email', models.EmailField(max_length=255, unique=True, null=True, db_column=b'pEmail', blank=True)),
                ('is_active', util.fields.BooleanField(default=True, db_column=b'pActive')),
                ('is_admin', util.fields.BooleanField(default=False, db_column=b'pAdmin')),
                ('password_reset_token', models.CharField(max_length=255, null=True, db_column=b'pResetToken', blank=True)),
                ('password_reset_token_timeout', util.fields.TimestampField(null=True, db_column=b'pResetTokenTimeout', blank=True)),
                ('on_email_list', util.fields.BooleanField(default=True, db_column=b'pOnEmailList')),
                ('groups', models.ManyToManyField(related_query_name='user', related_name='user_set', to='auth.Group', blank=True, help_text='The groups this user belongs to. A user will get all permissions granted to each of his/her group.', verbose_name='groups')),
                ('user_permissions', models.ManyToManyField(related_query_name='user', related_name='user_set', to='auth.Permission', blank=True, help_text='Specific permissions for this user.', verbose_name='user permissions')),
            ],
            options={
                'db_table': 'tbPlayer',
            },
            bases=(models.Model,),
        ),
        migrations.CreateModel(
            name='Game',
            fields=[
                ('id', models.AutoField(serialize=False, primary_key=True, db_column=b'gId')),
                ('party', models.CharField(max_length=255, db_column=b'gParty')),
                ('created_on', util.fields.TimestampField(auto_now_add=True, db_column=b'gCreatedOn')),
                ('started_on', util.fields.TimestampField(null=True, db_column=b'gStartedOn', blank=True)),
                ('type', models.CharField(max_length=255, db_column=b'gType')),
                ('created_by', models.ForeignKey(related_name=b'+', db_column=b'gCreatedBy', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'db_table': 'tbGame',
            },
            bases=(models.Model,),
        ),
        migrations.CreateModel(
            name='PlayerGame',
            fields=[
                ('id', models.AutoField(serialize=False, primary_key=True, db_column=b'pgId')),
                ('active', util.fields.BooleanField(default=True, db_column=b'pgActive')),
                ('created_on', util.fields.TimestampField(auto_now_add=True, db_column=b'pgCreatedOn')),
                ('game', models.ForeignKey(to='join.Game', db_column=b'gId')),
                ('player', models.ForeignKey(to=settings.AUTH_USER_MODEL, db_column=b'pId')),
            ],
            options={
                'db_table': 'tbPlayerGame',
            },
            bases=(models.Model,),
        ),
        migrations.AddField(
            model_name='game',
            name='master',
            field=models.ForeignKey(related_name=b'masters_of', db_column=b'gMaster', default=None, blank=True, to='join.PlayerGame', null=True),
            preserve_default=True,
        ),
        migrations.AddField(
            model_name='game',
            name='players',
            field=models.ManyToManyField(to=settings.AUTH_USER_MODEL, through='join.PlayerGame'),
            preserve_default=True,
        ),
    ]
