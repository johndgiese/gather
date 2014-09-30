from django.conf.urls import patterns, url

from constants import CARDS_IN_HAND


def card_id_capture(num_cards):
    return "".join(['(?P<card_' + str(num) + '>\d+)/' for num in range(num_cards)])

urlpatterns = patterns('words.views',
    (r'^prompt/(?P<prompt>\d+)/hand/' + card_id_capture(CARDS_IN_HAND) + '$', 'share_hand'),
    (r'^prompt/(?P<prompt>\d+)/choice/' + card_id_capture(1) + 'after/$', 'share_hand_after'),

    (r'^prompt/(?P<prompt>\d+)/mychoice/' + card_id_capture(1) + '$', 'share_mychoice'),

    (r'^prompt/(?P<prompt>\d+)/groupchoices/' + card_id_capture(2) + '$', 'share_groupchoices'),
    (r'^prompt/(?P<prompt>\d+)/groupchoices/' + card_id_capture(3) + '$', 'share_groupchoices'),
    (r'^prompt/(?P<prompt>\d+)/groupchoices/' + card_id_capture(4) + '$', 'share_groupchoices'),
    (r'^prompt/(?P<prompt>\d+)/groupchoices/' + card_id_capture(5) + '$', 'share_groupchoices'),
    (r'^prompt/(?P<prompt>\d+)/groupchoices/' + card_id_capture(6) + '$', 'share_groupchoices'),
    (r'^prompt/(?P<prompt>\d+)/groupchoices/' + card_id_capture(7) + '$', 'share_groupchoices'),
    (r'^prompt/(?P<prompt>\d+)/groupchoices/' + card_id_capture(8) + '$', 'share_groupchoices'),
    (r'^prompt/(?P<prompt>\d+)/groupchoices/' + card_id_capture(9) + '$', 'share_groupchoices'),
    (r'^prompt/(?P<prompt>\d+)/groupchoices/' + card_id_capture(10) + '$', 'share_groupchoices'),
    (r'^prompt/(?P<prompt>\d+)/groupchoices/' + card_id_capture(11) + '$', 'share_groupchoices'),
    (r'^prompt/(?P<prompt>\d+)/groupchoices/' + card_id_capture(12) + '$', 'share_groupchoices'),
    (r'^prompt/(?P<prompt>\d+)/groupchoices/' + card_id_capture(13) + '$', 'share_groupchoices'),
    (r'^prompt/(?P<prompt>\d+)/groupchoices/' + card_id_capture(14) + '$', 'share_groupchoices'),
    (r'^prompt/(?P<prompt>\d+)/groupchoices/' + card_id_capture(15) + '$', 'share_groupchoices'),
    (r'^prompt/(?P<prompt>\d+)/groupchoices/' + card_id_capture(16) + '$', 'share_groupchoices'),
    (r'^prompt/(?P<prompt>\d+)/groupchoices/' + card_id_capture(17) + '$', 'share_groupchoices'),
    (r'^prompt/(?P<prompt>\d+)/groupchoices/' + card_id_capture(18) + '$', 'share_groupchoices'),
    (r'^prompt/(?P<prompt>\d+)/groupchoices/' + card_id_capture(1) + 'after/$', 'share_groupchoices_after'),

    (r'^prompt/(?P<prompt>\d+)/mywin/' + card_id_capture(1) + '$', 'share_mywin'),
)
