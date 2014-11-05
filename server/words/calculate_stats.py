from django.db.models import Count


def calculate_funny_votes(instance):
    total = instance.funnyvote_set.count()
    num_funny = instance.funnyvote_set.filter(funny=True).count()

    if total == 0:
        percent_funny_votes = 0.0
    else:
        percent_funny_votes = (num_funny/float(total))*100.0

    return total, percent_funny_votes

def calculate_response_stats(response):
    num_votes = 0
    times_played = 0

    avg_frac_of_possible_votes_when_played = 0

    cards = response.card_set.exclude(round_played=None).annotate(votes_for=Count('vote'))
    for c in cards:
        votes_for_card = c.votes_for
        total_votes_in_round = c.round_played.card_set.count()

        # subtract one, because you can't vote for yourself
        avg_frac_of_possible_votes_when_played += (100.0*float(votes_for_card)/float(total_votes_in_round - 1))

        times_played += 1
        num_votes += votes_for_card

    if times_played != 0:
        avg_frac_of_possible_votes_when_played /= times_played
    else:
        avg_frac_of_possible_votes_when_played = 0

    return num_votes, times_played, avg_frac_of_possible_votes_when_played
