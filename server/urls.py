from django.conf.urls import patterns, include, url
from django.contrib import admin

urlpatterns = patterns('',
    url(r'^', include('landing.urls')),
    url(r'^g/', include('join.urls')),
    url(r'^share/', include('words.share_urls')),
    url(r'^admin/', include(admin.site.urls)),
    url(r'^add/', include('words.admin_urls')),
    url(r'^api/', include('api.urls')),
)
