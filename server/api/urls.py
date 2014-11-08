from django.conf.urls import patterns, url


urlpatterns = patterns('api.views',
    (r'^check_password$', 'check_password_view'),
    (r'^set_password$', 'set_password_view'),
)
