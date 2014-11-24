# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import models, migrations
import util.fields


class Migration(migrations.Migration):

    dependencies = [
    ]

    operations = [
        migrations.CreateModel(
            name='Answer',
            fields=[
                ('id', models.AutoField(serialize=False, primary_key=True)),
                ('question', models.TextField()),
                ('answer', models.IntegerField()),
                ('ip_address', models.IPAddressField()),
                ('created_on', util.fields.TimestampField(auto_now_add=True)),
            ],
            options={
            },
            bases=(models.Model,),
        ),
    ]
