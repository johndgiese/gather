import random

from django.shortcuts import render, redirect
from django import forms
from django.forms.models import modelformset_factory
from django.core.urlresolvers import reverse_lazy
from django.views.generic import TemplateView
from django.views.generic.edit import CreateView
from django.contrib.auth.decorators import login_required

from models import Prompt, Response, Tag, FunnyVote


# CREATE NEW

class ResponseCreate(CreateView):
    model = Response
    fields = ['text']
    initial = {
        'tags': Tag.objects.get(text='Custom')
    }

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

NUM_COMPARES = 5

FunnyVoteFormset = modelformset_factory(FunnyVote, extra=NUM_COMPARES, fields=('response', 'prompt', 'funny'))

class ValidateWordView(TemplateView):
    AddClass = None
    MatchClass = None

    template_name='words/validate.html'

    def get_context_data(self, **kwargs):
        context = super(ValidateWordView, self).get_context_data(**kwargs)

        # randomly select from opposite class to compare against
        validate_using = list(self.request.session['validate_using'])
        validate_subset = random.sample(validate_using, NUM_COMPARES)
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
        print(request.POST)
        formset.save()

        if self.AddClass == Prompt:
            return redirect('prompt_new')
        elif self.AddClass == Response:
            return redirect('response_new')
        else:
            raise Exception("Invalid class")


response_validate = login_required(ValidateWordView.as_view(
    AddClass=Response,
    MatchClass=Prompt))

prompt_validate = login_required(ValidateWordView.as_view(
    AddClass=Prompt,
    MatchClass=Response))

