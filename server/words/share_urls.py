from django.conf.urls import patterns, url

from constants import CARDS_IN_HAND


card_id_capture = "".join(['(?P<card_' + str(num) + '>\d+)/' for num in range(CARDS_IN_HAND)])

urlpatterns = patterns('words.views',
    (r'^prompt/(?P<prompt>\d+)/hand/' + card_id_capture + '$', 'share_hand'),
    (r'^prompt/(?P<prompt>\d+)/choice/(?P<card_0>\d+)/after/$', 'share_hand_after'),
)
