from django.urls import path
from . import views

app_name = "intelligence"

urlpatterns = [
    path("", views.home, name="home"),
]