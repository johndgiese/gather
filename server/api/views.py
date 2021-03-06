from django.views.decorators.http import require_GET, require_POST
from django.contrib.auth.hashers import check_password, make_password, is_password_usable
from django.http import HttpResponse, HttpResponseNotFound, HttpResponseForbidden
from django.contrib.auth import authenticate
from django.views.decorators.csrf import csrf_exempt
from django.conf import settings

from join.models import Player


def internal_only(view):
    def decorated_view(request, *args, **kwargs):
        secret = request.POST.get('secret', None)
        if secret is None or secret != settings.CONFIG['SECRET']:
            return HttpResponseNotFound()
        else:
            return view(request, *args, **kwargs)
    return decorated_view


@require_POST
@csrf_exempt
@internal_only
def check_password_view(request):
    email = request.POST.get('email', None)
    password = request.POST.get('password', None)
    if (not email is None) and (not password is None):
        try:
            player = Player.objects.get(email=email)
            if player.check_password(password):
                return HttpResponse()
            else:
                # return different error code so we can inform the user if it
                # was a bad email or bad password
                return HttpResponseForbidden()
        except Player.DoesNotExist:
            pass

    return HttpResponseNotFound()


@require_POST
@csrf_exempt
@internal_only
def set_password_view(request):
    email = request.POST.get('email', None)
    password = request.POST.get('password', None)
    if (not email is None) and (not password is None):
        try:
            player = Player.objects.get(email=email)
            player.set_password(password)
            player.password_reset_token = None;
            player.password_reset_token_timeout = None;
            player.save()
            return HttpResponse()
        except Player.DoesNotExist:
            pass
    return HttpResponseNotFound()

