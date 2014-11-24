from django.db import models

from util.fields import TimestampField

class Answer(models.Model):
    """Generic model for questions we ask the user."""
    id = models.AutoField(primary_key=True)
    question = models.TextField()
    answer = models.IntegerField()
    ip_address = models.IPAddressField()
    created_on = TimestampField(auto_now_add=True)

    def __unicode__(self):
        return u'Answer {}: {}'.format(self.question, self.answer)
