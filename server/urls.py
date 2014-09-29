from django.conf.urls import patterns, include, url
from django.contrib import admin

urlpatterns = patterns('',
    url(r'^', include('landing.urls')),
    url(r'^game/', include('join.urls')),
    url(r'^share/', include('words.share_urls')),
    url(r'^admin/', include(admin.site.urls)),
    url(r'^addwords/', include('words.admin_urls')),
)
