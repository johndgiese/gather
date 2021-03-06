import random
import logging

from django.shortcuts import render, redirect
from django import forms
from django.forms.models import modelformset_factory
from django.core.urlresolvers import reverse_lazy
from django.views.generic import TemplateView
from django.views.generic.edit import CreateView
from django.contrib.auth.decorators import login_required
from django.http import Http404, HttpResponseRedirect
from django.db.models import Count

from models import Prompt, Response, Tag, FunnyVote
from util.models import Answer
from constants import CARDS_IN_HAND

logger = logging.getLogger(__name__)

# CREATE NEW

class ResponseCreate(CreateView):
    model = Response
    fields = ['text']

    def get_success_url(self):
        return reverse_lazy('response_validate', kwargs={'id': self.object.id})

response_new = login_required(ResponseCreate.as_view())


class PromptCreate(CreateView):
    model = Prompt
    fields = ['text']

    def get_success_url(self):
        return reverse_lazy('prompt_validate', kwargs={'id': self.object.id})

prompt_new = login_required(PromptCreate.as_view())


# VALIDATION

NUM_COMPARES = 12

FunnyVoteFormset = modelformset_factory(FunnyVote, extra=NUM_COMPARES, fields=('response', 'prompt', 'funny'))

class ValidateWordView(TemplateView):
    AddClass = None
    MatchClass = None

    template_name='words/validate.html'

    def get_context_data(self, **kwargs):
        context = super(ValidateWordView, self).get_context_data(**kwargs)

        # randomly select from opposite class to compare against
        validate_using = self.request.session.get('validate_using', None)
        if not validate_using is None:
            validate_using = list(self.request.session['validate_using'])
            validate_subset = random.sample(validate_using, NUM_COMPARES)
        else:
            validate_subset = random.sample([o.id for o in self.MatchClass.objects.filter(active=True)], NUM_COMPARES)

        validate_instances = self.MatchClass.objects.filter(id__in=validate_subset)
        matches = validate_instances
        context['matches'] = matches

        # create form instance with
        if self.AddClass == Prompt:
            prompt = self.AddClass.objects.get(id=kwargs['id'])
            context['prompt'] = prompt
            context['response'] = matches[0]
            context['add_class'] = 'prompt'
            context['match_class'] = 'response'
            initial_data = [{'response': m, 'prompt': prompt} for m in matches]
        elif self.AddClass == Response:
            response = self.AddClass.objects.get(id=kwargs['id'])
            context['prompt'] = matches[0]
            context['response'] = response
            context['add_class'] = 'response'
            context['match_class'] = 'prompt'
            initial_data = [{'response': response, 'prompt': m} for m in matches]
        else:
            raise Exception("Invalid class")
        context['formset'] = FunnyVoteFormset(queryset=FunnyVote.objects.none(), initial=initial_data)

        return context


    def post(self, request, *args, **kwargs):

        formset = FunnyVoteFormset(request.POST)
        funny_votes = formset.save()
        should_be_active = request.POST.get('should_be_active', "off") == "on"

        if self.AddClass == Prompt:
            prompt = funny_votes[0].prompt
            prompt.active = should_be_active
            prompt.created_by = request.user
            prompt.save()
            return redirect('prompt_new')
        elif self.AddClass == Response:
            response = funny_votes[0].response
            response.active = should_be_active
            response.created_by = request.user
            response.save()
            return redirect('response_new')
        else:
            raise Exception("Invalid class")


response_validate = login_required(ValidateWordView.as_view(
    AddClass=Response,
    MatchClass=Prompt))

prompt_validate = login_required(ValidateWordView.as_view(
    AddClass=Prompt,
    MatchClass=Response))


# SHARE VIEWS

class ShareCardsView(TemplateView):

    http_method_names = ['get']

    def get_context_data(self, **kwargs):
        context = super(ShareCardsView, self).get_context_data(**kwargs)

        prompt_str = kwargs.get('prompt', None)
        if not prompt_str is None:
            prompt_id = int(prompt_str)
            context['prompt'] = Prompt.objects.get(pk=prompt_id)

        # TODO: make more efficient
        card_id_keys = [c for c in kwargs.keys() if c.startswith('card_')]
        card_id_keys.sort(lambda c1, c2: int(c1[5:]) - int(c2[5:]))
        card_ids = [kwargs[c] for c in card_id_keys]
        context['cards'] = [Response.objects.get(pk=c) for c in card_ids]

        return context


class VotingView(ShareCardsView):

    after_view_name = None
    http_method_names = ['get', 'post']

    def post(self, request, *args, **kwargs):
        url = request.build_absolute_uri()
        ip_address = request.META['REMOTE_ADDR']
        answer = request.POST.get('answer', None)
        if answer is None:
            return HttpResponseRedirect(url)
        try:
            existing_answer = Answer.objects.get(ip_address=ip_address, question=url)
        except Answer.DoesNotExist:
            Answer.objects.create(ip_address=ip_address, question=url, answer=answer)
        return HttpResponseRedirect(url + 'after/')


class VotedView(ShareCardsView):

    def get_context_data(self, **kwargs):
        context = super(VotedView, self).get_context_data(**kwargs)
        question_url = self.request.build_absolute_uri()[:-len("after/")]
        results = Answer.objects.filter(question=question_url).values('answer').annotate(num_votes=Count('answer'))

        for card in context['cards']:
            card.num_votes = next((r['num_votes'] for r in results if r['answer'] == card.id), 0)
        
        context['cards'] = sorted(context['cards'], lambda a, b: b.num_votes - a.num_votes)

        # for some reason facebook doesn't like the trailing slash
        context['share_link'] = question_url[:-1]  
        return context

share_mychoice = ShareCardsView.as_view(template_name="words/share_mychoice.html")
share_mywin = ShareCardsView.as_view(template_name="words/share_mywin.html")

share_hand = VotingView.as_view(template_name="words/share_hand.html")
share_hand_after = VotedView.as_view(template_name="words/share_hand_after.html")

share_groupchoices = VotingView.as_view(template_name="words/share_groupchoices.html")
share_groupchoices_after = VotedView.as_view(template_name="words/share_groupchoices_after.html")

