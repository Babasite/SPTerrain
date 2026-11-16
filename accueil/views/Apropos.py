from django.shortcuts import render
from django.views.decorators.clickjacking import xframe_options_sameorigin


def apropos(request):
    return render(request, "accueil/apropos.html")


@xframe_options_sameorigin
def cv(request):
    return render(request, "accueil/CV/cv.html")