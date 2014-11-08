from django.views.decorators.http import require_GET, require_POST
from django.contrib.auth.hashers import check_password, make_password, is_password_usable
from django.http import HttpResponse, HttpResponseNotFound
from django.contrib.auth import authenticate
from django.views.decorators.csrf import csrf_exempt

from join.models import Player


# TODO: consider whether this is secure or not
def internal_only(view):
    def decorated_view(request, *args, **kwargs):
        ip_addr = request.META.get('REMOTE_ADDR')
        if ip_addr != '127.0.0.1':
            return HttpResponseNotFound()
        else:
            return view(request, *args, **kwargs)
    return decorated_view


@require_GET
@internal_only
def check_password_view(request):
    email = request.GET.get('email', None)
    password = request.GET.get('password', None)
    if (not email is None) and (not password is None):
        player = authenticate(username=email, password=password)
        if not player is None:
            return HttpResponse()
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
            player.save()
            return HttpResponse()
        except Player.DoesNotExist:
            pass
    return HttpResponseNotFound()

