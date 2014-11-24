from datetime import datetime
from time import strftime

from django.db import models


class TimestampField(models.DateTimeField):

    def db_type(self, connection):
        type_spec = ['TIMESTAMP']

        if self.auto_now:
            type_spec.append('DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP')

        if self.auto_now_add:
            type_spec.append('DEFAULT CURRENT_TIMESTAMP')

        return ' '.join(type_spec)

    def to_python(self, value):
        if isinstance(value, int):
            value = datetime.fromtimestamp(value)
        return models.DateTimeField.to_python(self, value)

    def get_db_prep_value(self, value, connection, prepared=False):
        if value is None:
            return value
        return strftime('%Y-%m-%d %H:%M:%S', value.timetuple())


class BooleanField(models.BooleanField):
    """Same as normal boolean field, but adds defaults at DB level."""

    def db_type_suffix(self, connection):
        if self.default:
            return "DEFAULT TRUE"
        else:
            return "DEFAULT FALSE"
