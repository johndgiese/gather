from join.models import Player

from django.views.decorators.http import require_GET, require_POST
from django.contrib.auth.hashers import check_password, make_password, is_password_usable
from django.http import HttpResponse, HttpResponseNotFound
from django.contrib.auth import authenticate

@require_GET
def check_password_view(request):
    email = request.GET.get('email', None)
    password = request.GET.get('password', None)
    if (not email is None) and (not password is None):
        user = authenticate(username=email, password=password)
        if not user is None:
            return HttpResponse()
    return HttpResponseNotFound()


@require_POST
def set_password_view(request):
    email = request.POST.get('email', None)
    password = request.POST.get('password', None)
    if (not email is None) and (not password is None):
        user = authenticate(username=email, password=password)
        if not user is None:
            return HttpResponse()
    return HttpResponseNotFound()

