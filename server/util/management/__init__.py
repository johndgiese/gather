import sys
import logging

from django.core.management.base import BaseCommand, CommandError


logger = logging.getLogger("cron")

class CronCommand(BaseCommand):
    """
    Management command this is designed to be used in a CRON job.

    At the moment, this only means there is additional error logging if there
    is an uncaught exception.
    """

    def execute(self, *args, **options):
        try:
            super(CronCommand, self).execute(self, *args, **options)
        except:
            logger.critical("CRON Error", exc_info=True)
            sys.exit(1)


