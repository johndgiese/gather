from os import path, makedirs
import os


def grab_or_generate_secret_key(secret_file_path):
    """
    Look in the provided filename for a secret key for django.  If the file
    doesn't exist, attempt to make one and generate a secrety key for it.

    Two things are wrong with Django's default `secret_key` system:

    1. It is not random but pseudo-random
    2. It saves and displays the secret_key in `settings.py`

    This snippet
    1. uses `SystemRandom()` instead to generate a random key
    2. saves the secret in a local text file

    The result is a random and safely hidden `secret_key`.
    """
    try:
        secret_key = open(secret_file_path).read().strip()
    except IOError:
        try:
            from random import SystemRandom
            valid_chars = 'abcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*(-_=+)'
            secret_key_as_list = [SystemRandom().choice(valid_chars) for i in range(50)]
            secret_key = ''.join(secret_key_as_list)
            secret = file(secret_file_path, 'w')
            secret.write(secret_key)
            secret.close()
        except IOError:
            Exception('Please create a %s file with random characters \
                to generate your secret key!' % secret_file_path)

    return secret_key


def create_dir(d):
    if not path.exists(d):
        makedirs(d, 0775)
    return d


def create_dirs(var_directories):
    for d in var_directories:
        create_dir(d)

