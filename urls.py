from django.conf.urls import patterns, include, url
from django.contrib import admin

urlpatterns = patterns('',
    url(r'^response$', 'words.views.response_new', name='response_new'),
    url(r'^prompt$', 'words.views.prompt_new', name='prompt_new'),
    url(r'^response/validate/(?P<id>\d+)$', 'words.views.response_validate', name='response_validate'),
    url(r'^prompt/validate/(?P<id>\d+)$', 'words.views.prompt_validate', name='prompt_validate'),

    url(r'^admin/', include(admin.site.urls)),
)
