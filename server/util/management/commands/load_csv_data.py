import csv, sys, warnings
from os import path
import re
import optparse, logging

from django.db.utils import IntegrityError
import MySQLdb

from util.management import CronCommand
from django.db import transaction, connection


logger = logging.getLogger(__name__)


def row_converter(r):
    """Helper to cope with differences between sqlserver and mysql."""

    result=[]
    for item in r:
        if item == 'True':
            val = 1
        elif item == 'False':
            val = 0
        elif item == '':
            val = None
        else:
            val = item
        result.append(val)
    return result


class Command(CronCommand):

    args = "<csvfile csvfile ...>"

    help = ("Load database data from csv files in specified directory.  Note "
    "that the csv files MUST have the same name as the table they are inserted "
    "into.  Also, the first row of the csv file must have the appropriate column names.")


    def handle(self, *args, **options):

        with warnings.catch_warnings(record=True) as w:
            # cause all warnings to always be triggered
            warnings.simplefilter("default")

            cursor = connection.cursor()

            csv_file_names = args[1:]

            table_name = re.compile(r'.*?([^/.]*)\.[^/]*$')

            tables = []
            for csv_file_name in csv_file_names:
                match = table_name.match(csv_file_name)
                if match:
                    tables.append(match.groups()[0])
                else:
                    raise ValueError("Fixtures must be csv files.")

            insert_sql_template = 'insert into {0} ({1}) values ({2});'

            for table, csv_file_name in zip(tables, csv_file_names):

                logger.info("loading data from %s", csv_file_name)
                with transaction.commit_manually():
                    try:
                        row = None
                        with open(csv_file_name, 'r') as csv_file:
                            csvreader = csv.reader(csv_file, delimiter=',', doublequote=False, escapechar="\\", strict=True)

                            # format sql based off first row (contains column names)
                            first_row = csvreader.next()
                            column_names = ','.join(first_row)
                            fill_ins = ', '.join(['%s' for column in first_row])
                            insert_sql = insert_sql_template.format(table, column_names, fill_ins)

                            # plug in data for remaining rows
                            linenum = 2
                            for row in csvreader:
                                data = row_converter(row)
                                cursor.execute(insert_sql, data)
                                linenum += 1

                    except:
                        if not row is None:
                            row_dump = "\n".join(['  {} = {}'.format(c, d) for c, d in zip(first_row, row) if d != ''])
                            logger.error("error on line no %s:\n%s", linenum, row_dump)
                        transaction.rollback()
                        raise
                    else:
                        transaction.commit()

