import os
import sys
import json

from django.conf.global_settings import TEMPLATE_CONTEXT_PROCESSORS as TCP

from util.conf import grab_or_generate_secret_key, create_dir

AUTH_USER_MODEL = 'join.Player'

BASE_DIR = os.path.dirname(__file__)

ADMINS = (
    'david', 'david@gather.gg',
    'adam', 'adam@gather.gg',
)

MANAGERS = ADMINS

CONFIG = json.load(open(os.path.join(BASE_DIR, "../_local.json")))

SECRET_KEY_PATH = os.path.join(BASE_DIR, '../_var/secret.txt')
SECRET_KEY = grab_or_generate_secret_key(SECRET_KEY_PATH)

INTERNAL_IPS = ('127.0.0.1',)

DEBUG = CONFIG['ENV'] == "DEV"

if DEBUG == True:
    # load test admin user
    FIXTURE_DIRS = (BASE_DIR,)

TEMPLATE_DEBUG = CONFIG['ENV'] == "DEV"

if CONFIG['ENV'] == "DEV":
    ALLOWED_HOSTS = []
else:
    ALLOWED_HOSTS = [".gather.gg"]

TEMPLATE_CONTEXT_PROCESSORS = TCP + (
    'django.core.context_processors.request',
)


INSTALLED_APPS = (
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'util',
    'words',
    'join',
    'common',
    'landing',
    'api',
)

MIDDLEWARE_CLASSES = (
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.auth.middleware.SessionAuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
)

ROOT_URLCONF = 'urls'

WSGI_APPLICATION = 'wsgi.application'


DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.mysql',
        'NAME': CONFIG['DB_NAME'],
        'USER': CONFIG['DB_USERNAME'],
        'PASSWORD': CONFIG['DB_PASSWORD'],
    }
}

LANGUAGE_CODE = 'en-us'

TIME_ZONE = 'UTC'

USE_I18N = True

USE_L10N = True

USE_TZ = True

STATIC_URL = '/static/'
STATIC_ROOT = os.path.join(BASE_DIR, "../_var/collected_static/")
STATICFILES_DIRS = (
    os.path.join(BASE_DIR, "../static"),
)

# set EMAIL_HOST_PASSWORD in local.py
EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
EMAIL_USE_TLS = True
EMAIL_USE_SSL = True
EMAIL_PORT = 587
EMAIL_HOST = 'smtp.gmail.com'
EMAIL_HOST_USER = 'david@gather.gg'
EMAIL_HOST_PASSWORD = CONFIG['EMAIL_PASSWORD']
EMAIL_SUBJECT_PREFIX = '[Gather.gg Site]'

LOG_PATH = create_dir(os.path.join(BASE_DIR, "../_var/"))


LOGGING = {
    "version": 1,
    "disable_existing_loggers": True,
    "formatters": {
        "standard": {
            "format": "[%(asctime)s] %(levelname)5s %(name)s:%(lineno)d %(message)s",
            "datefmt": "%d/%b/%Y %H:%M:%S",
        },
        "console": {
            "format": "[%(asctime)s] %(levelname)5s [%(name)s:%(lineno)d] %(message)s",
            "datefmt": "%H:%M:%S",
        }
    },
    "filters": {
        "require_debug_false": {
            "()": "django.utils.log.RequireDebugFalse",
        },
    },
    "handlers": {
        "mail_admins": {
            "level": "ERROR",
            "filters": ["require_debug_false"],
            "class": "django.utils.log.AdminEmailHandler",
            "include_html": False,  # should be False for security purposes; don't email stack traces!
        },
        "console": {
            "level": "INFO",
            "class": "logging.StreamHandler",
            "formatter": "console",
            "stream": sys.stdout,
        },
        "file": {
            "level": "INFO",
            "filters": [],
            "class": "logging.FileHandler",
            "formatter": "standard",
            "filename": os.path.join(LOG_PATH, "log.txt"),
        },
    },
    "loggers": {
        "": {
            "level": "DEBUG",
            "handlers": ["console", "file", "mail_admins"],
        },
        "django": {
            "level": "INFO",
            "handlers": ["console"],
            "propagate": False,
        },
        "django.request": {
            "level": "ERROR",
            "handlers": ["console", "file", "mail_admins"],
            "propagate": False,
        },
        "django.db.backends": {
            "level": "DEBUG",
            "handlers": ["console"],
            "propagate": False,
        },
        "django.commands": {
            "level": "ERROR",
            "handlers": ["console"],
            "propagate": False,
        },
    }
}
