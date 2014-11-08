from django.conf.urls import patterns, url

from views import check_password, set_password

urlpatterns = patterns('',
    (r'^check_password$', check_password_view),
    (r'^set_password$', set_password_view),
)
