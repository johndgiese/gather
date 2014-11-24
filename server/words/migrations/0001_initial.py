# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import models, migrations
import util.fields
from django.conf import settings


class Migration(migrations.Migration):

    dependencies = [
        ('join', '0001_initial'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='Card',
            fields=[
                ('id', models.AutoField(serialize=False, primary_key=True, db_column=b'cId')),
                ('created_on', util.fields.TimestampField(auto_now_add=True, db_column=b'cCreatedOn')),
                ('played_on', util.fields.TimestampField(auto_now=True, db_column=b'cPlayedOn')),
                ('owner', models.ForeignKey(to='join.PlayerGame', db_column=b'pgId')),
            ],
            options={
                'db_table': 'tbCard',
            },
            bases=(models.Model,),
        ),
        migrations.CreateModel(
            name='FunnyVote',
            fields=[
                ('id', models.AutoField(serialize=False, primary_key=True)),
                ('funny', util.fields.BooleanField(default=True)),
            ],
            options={
            },
            bases=(models.Model,),
        ),
        migrations.CreateModel(
            name='Prompt',
            fields=[
                ('id', models.AutoField(serialize=False, primary_key=True, db_column=b'proId')),
                ('text', models.CharField(max_length=255, db_column=b'proText')),
                ('active', util.fields.BooleanField(default=True, db_column=b'proActive')),
                ('created_on', util.fields.TimestampField(auto_now_add=True, db_column=b'proCreatedOn')),
                ('created_by', models.ForeignKey(to=settings.AUTH_USER_MODEL, db_column=b'proCreatedBy')),
            ],
            options={
                'db_table': 'tbPrompt',
            },
            bases=(models.Model,),
        ),
        migrations.CreateModel(
            name='PromptTag',
            fields=[
                ('id', models.AutoField(serialize=False, primary_key=True, db_column=b'qtId')),
                ('created_on', util.fields.TimestampField(auto_now_add=True, db_column=b'qtCreatedOn')),
                ('created_by', models.ForeignKey(to=settings.AUTH_USER_MODEL, db_column=b'qtCreatedBy')),
                ('prompt', models.ForeignKey(to='words.Prompt', db_column=b'proId')),
            ],
            options={
                'db_table': 'tbPromptTag',
            },
            bases=(models.Model,),
        ),
        migrations.CreateModel(
            name='Response',
            fields=[
                ('id', models.AutoField(serialize=False, primary_key=True, db_column=b'resId')),
                ('text', models.CharField(max_length=255, db_column=b'resText')),
                ('active', util.fields.BooleanField(default=True, db_column=b'resActive')),
                ('created_on', util.fields.TimestampField(auto_now_add=True, db_column=b'resCreatedOn')),
                ('created_by', models.ForeignKey(to=settings.AUTH_USER_MODEL, db_column=b'resCreatedBy')),
            ],
            options={
                'db_table': 'tbResponse',
            },
            bases=(models.Model,),
        ),
        migrations.CreateModel(
            name='ResponseTag',
            fields=[
                ('id', models.AutoField(serialize=False, primary_key=True, db_column=b'atId')),
                ('created_on', util.fields.TimestampField(auto_now_add=True, db_column=b'atCreatedOn')),
                ('created_by', models.ForeignKey(to=settings.AUTH_USER_MODEL, db_column=b'atCreatedBy')),
                ('response', models.ForeignKey(to='words.Response', db_column=b'resId')),
            ],
            options={
                'db_table': 'tbResponseTag',
            },
            bases=(models.Model,),
        ),
        migrations.CreateModel(
            name='Round',
            fields=[
                ('id', models.AutoField(serialize=False, primary_key=True, db_column=b'rId')),
                ('number', models.IntegerField(db_column=b'rNumber')),
                ('created_on', util.fields.TimestampField(auto_now_add=True, db_column=b'rCreatedOn')),
                ('done_reading_prompt', util.fields.TimestampField(null=True, db_column=b'rDoneReadingPrompt', blank=True)),
                ('done_choosing', util.fields.TimestampField(null=True, db_column=b'rDoneChoosing', blank=True)),
                ('done_reading_choices', util.fields.TimestampField(null=True, db_column=b'rDoneReadingChoices', blank=True)),
                ('done_voting', util.fields.TimestampField(null=True, db_column=b'rDoneVoting', blank=True)),
                ('game', models.ForeignKey(related_name=b'rounds', db_column=b'gId', to='join.Game')),
                ('prompt', models.ForeignKey(to='words.Prompt', db_column=b'proId')),
                ('reader', models.ForeignKey(to='join.PlayerGame', db_column=b'pgId')),
            ],
            options={
                'db_table': 'tbRound',
            },
            bases=(models.Model,),
        ),
        migrations.CreateModel(
            name='Tag',
            fields=[
                ('id', models.AutoField(serialize=False, primary_key=True, db_column=b'tId')),
                ('text', models.CharField(max_length=255, db_column=b'tText')),
                ('created_on', util.fields.TimestampField(auto_now_add=True, db_column=b'tCreatedOn')),
                ('created_by', models.ForeignKey(to=settings.AUTH_USER_MODEL, db_column=b'tCreatedBy')),
            ],
            options={
                'db_table': 'tbTag',
            },
            bases=(models.Model,),
        ),
        migrations.CreateModel(
            name='Vote',
            fields=[
                ('id', models.AutoField(serialize=False, primary_key=True, db_column=b'vId')),
                ('created_on', util.fields.TimestampField(auto_now_add=True, db_column=b'vCreatedOn')),
                ('card', models.ForeignKey(to='words.Card', db_column=b'cId')),
                ('voter', models.ForeignKey(to='join.PlayerGame', db_column=b'pgId')),
            ],
            options={
                'db_table': 'tbVote',
            },
            bases=(models.Model,),
        ),
        migrations.AlterUniqueTogether(
            name='round',
            unique_together=set([('game', 'number')]),
        ),
        migrations.AddField(
            model_name='responsetag',
            name='tag',
            field=models.ForeignKey(to='words.Tag', db_column=b'tId'),
            preserve_default=True,
        ),
        migrations.AddField(
            model_name='response',
            name='tags',
            field=models.ManyToManyField(to='words.Tag', through='words.ResponseTag'),
            preserve_default=True,
        ),
        migrations.AddField(
            model_name='prompttag',
            name='tag',
            field=models.ForeignKey(to='words.Tag', db_column=b'tId'),
            preserve_default=True,
        ),
        migrations.AddField(
            model_name='prompt',
            name='tags',
            field=models.ManyToManyField(to='words.Tag', through='words.PromptTag'),
            preserve_default=True,
        ),
        migrations.AddField(
            model_name='funnyvote',
            name='prompt',
            field=models.ForeignKey(to='words.Prompt'),
            preserve_default=True,
        ),
        migrations.AddField(
            model_name='funnyvote',
            name='response',
            field=models.ForeignKey(to='words.Response'),
            preserve_default=True,
        ),
        migrations.AddField(
            model_name='card',
            name='response',
            field=models.ForeignKey(to='words.Response', db_column=b'resId'),
            preserve_default=True,
        ),
        migrations.AddField(
            model_name='card',
            name='round_played',
            field=models.ForeignKey(db_column=b'rId', default=None, blank=True, to='words.Round', null=True),
            preserve_default=True,
        ),
        migrations.CreateModel(
            name='WordGame',
            fields=[
            ],
            options={
                'proxy': True,
            },
            bases=('join.game',),
        ),
    ]
