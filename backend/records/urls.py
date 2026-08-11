from django.urls import path
from . import views

urlpatterns = [

    path(
        "daily/<str:date>/",
        views.daily_rainfall,
        name="daily-rainfall"
    ),

    path(
        "calendar/",
        views.yearly_calendar,
        name="yearly-calendar"
    ),

    path(
        "districts/",
        views.district_list,
        name="district-list"
    ),

    path(
        "mandals/",
        views.mandal_list,
        name="mandal-list"
    ),

    path(
        "district/<str:district_name>/",
        views.district_analysis,
        name="district-analysis"
    ),

    path(
        "mandal/<str:district_name>/<str:mandal_name>/",
        views.mandal_analysis,
        name="mandal-analysis"
    ),

    path(
        "trends/",
        views.rainfall_trends,
        name="rainfall-trends"
    ),

    path(
        "humidity/analysis/",
        views.humidity_analysis,
        name="humidity-analysis"
    ),
]