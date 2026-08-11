import re
from difflib import get_close_matches

from django.core.cache import cache
from django.db import models
from django.db.models import (
    Sum,
    Avg,
    Max,
    Min,
    Count,
    F,
    Value,
    FloatField,
    ExpressionWrapper,
)
from django.db.models.functions import TruncMonth, TruncDay, ExtractMonth

from rest_framework.decorators import api_view
from rest_framework.response import Response

from .models import RainfallRecord


# ============================================================
# DISTRICT NORMALIZATION
# ============================================================

def normalize_district(name):
    return re.sub(
        r"[^a-z0-9]",
        "",
        str(name or "").strip().lower()
    )


DISTRICT_ALIASES = {
    "adilabad": ["adilabad"],
    "bhadradrikothagudem": [
        "bhadradrikothagudem",
        "bhadradri kothagudem",
        "bhadradri",
        "kothagudem",
    ],
    "hanumakonda": [
        "hanumakonda",
        "hanamkonda",
    ],
    "hyderabad": ["hyderabad"],
    "jagtial": ["jagtial", "jagitial"],
    "jayashankarbhupalapally": [
        "jayashankarbhupalapally",
        "jayashankar bhupalapally",
        "jayashankar bhupalpally",
        "bhupalapally",
        "bhupalpally",
    ],
    "jogulambagadwal": [
        "jogulamba gadwal",
        "jogulambagadwal",
        "gadwal",
    ],
    "kamareddy": ["kamareddy", "kamareddi"],
    "karimnagar": ["karimnagar"],
    "khammam": ["khammam"],
    "komarambheemasifabad": [
        "komaram bheem asifabad",
        "komaram bheem-asifabad",
        "komarambheemasifabad",
        "komaram bheem",
        "asifabad",
    ],
    "mahabubabad": ["mahabubabad", "mahbubabad"],
    "mahabubnagar": ["mahabubnagar", "mahbubnagar"],
    "mancherial": ["mancherial"],
    "medak": ["medak"],
    "medchalmalajgiri": [
        "medchal malkajgiri",
        "medchal-malajgiri",
        "medchalmalajgiri",
        "medchal",
    ],
    "mulugu": ["mulugu"],
    "nagarkurnool": [
        "nagarkurnool",
        "nagar kurnool",
    ],
    "nalgonda": ["nalgonda"],
    "narayanpet": ["narayanpet"],
    "nirmal": ["nirmal"],
    "nizamabad": ["nizamabad"],
    "peddapalli": [
        "peddapalli",
        "peddapally",
    ],
    "rajannasircilla": [
        "rajanna sircilla",
        "rajannasircilla",
        "sircilla",
    ],
    "rangareddy": [
        "ranga reddy",
        "rangareddy",
    ],
    "sangareddy": [
        "sangareddy",
        "sangareddi",
    ],
    "siddipet": ["siddipet"],
    "suryapet": ["suryapet"],
    "vikarabad": ["vikarabad"],
    "wanaparthy": [
        "wanaparthy",
        "wanaparthi",
    ],
    "warangalr": [
        "warangal (r)",
        "warangal(r)",
        "warangal rural",
        "warangalrural",
        "warangal r",
    ],
    "warangalurban": [
        "warangal urban",
        "warangalurban",
    ],
    "yadadribhuvanagiri": [
        "yadadri bhongir",
        "yadadri-bhongir",
        "yadadribhongiri",
        "yadadri bhuvanagiri",
        "yadadribhuvanagiri",
        "yadagiribhuvanagiri",
        "yadadri",
        "bhongir",
    ],
}


# ============================================================
# GET DISTRICT RECORDS
# ============================================================

def get_district_records(district_name):

    requested = str(
        district_name or ""
    ).strip()

    records = RainfallRecord.objects.filter(
        district__iexact=requested
    )

    if records.exists():
        return (
            records,
            records.values_list(
                "district",
                flat=True
            ).first()
        )

    names = list(
        RainfallRecord.objects.values_list(
            "district",
            flat=True
        ).distinct()
    )

    normalized = normalize_district(
        requested
    )

    for name in names:
        if normalize_district(name) == normalized:
            return (
                RainfallRecord.objects.filter(
                    district=name
                ),
                name
            )

    aliases = set()

    for key, values in DISTRICT_ALIASES.items():

        normalized_aliases = {
            normalize_district(x)
            for x in values
        }

        if (
            normalized == key
            or normalized in normalized_aliases
        ):
            aliases.update(
                normalized_aliases
            )

    for name in names:
        if normalize_district(name) in aliases:
            return (
                RainfallRecord.objects.filter(
                    district=name
                ),
                name
            )

    normalized_names = {
        normalize_district(name): name
        for name in names
    }

    matches = get_close_matches(
        normalized,
        list(normalized_names),
        n=1,
        cutoff=0.80
    )

    if matches:
        name = normalized_names[matches[0]]

        return (
            RainfallRecord.objects.filter(
                district=name
            ),
            name
        )

    return (
        RainfallRecord.objects.none(),
        requested
    )


# ============================================================
# DAILY RAINFALL
# ============================================================

@api_view(["GET"])
def daily_rainfall(request, date):

    records = RainfallRecord.objects.filter(
        date=date
    )

    if not records.exists():
        return Response({
            "success": False,
            "message": "No rainfall data found for this date.",
            "date": date,
        }, status=404)

    summary = records.aggregate(
        total_rainfall=Sum("rain_mm"),
        average_rainfall=Avg("rain_mm"),
        highest_rainfall=Max("rain_mm"),
        average_min_humidity=Avg("min_humidity"),
        average_max_humidity=Avg("max_humidity"),
        total_mandals=Count("id"),
    )

    distribution = {
        "no_rain": records.filter(
            rain_mm=0
        ).count(),

        "low": records.filter(
            rain_mm__gt=0,
            rain_mm__lt=10
        ).count(),

        "moderate": records.filter(
            rain_mm__gte=10,
            rain_mm__lt=50
        ).count(),

        "high": records.filter(
            rain_mm__gte=50,
            rain_mm__lt=100
        ).count(),

        "very_high": records.filter(
            rain_mm__gte=100
        ).count(),
    }

    top = records.order_by(
        "-rain_mm",
        "district",
        "mandal"
    )[:5]

    top_5 = [
        {
            "rank": i,
            "mandal": r.mandal,
            "district": r.district,
            "rainfall_mm": float(r.rain_mm or 0),
            "min_humidity": float(r.min_humidity or 0),
            "max_humidity": float(r.max_humidity or 0),
        }
        for i, r in enumerate(top, 1)
    ]

    mandals = [
        {
            "rank": i,
            "district": r["district"],
            "mandal": r["mandal"],
            "rainfall_mm": float(r["rain_mm"] or 0),
            "min_humidity": float(r["min_humidity"] or 0),
            "max_humidity": float(r["max_humidity"] or 0),
        }
        for i, r in enumerate(
            records.values(
                "district",
                "mandal",
                "rain_mm",
                "min_humidity",
                "max_humidity",
            ).order_by(
                "-rain_mm",
                "district",
                "mandal",
            ),
            1,
        )
    ]

    districts = [
        {
            "rank": i,
            "district": r["district"],
            "rainfall_mm": float(r["rainfall_mm"] or 0),
            "average_rainfall": float(
                r["average_rainfall"] or 0
            ),
            "mandal_count": r["mandal_count"],
        }
        for i, r in enumerate(
            records.values(
                "district"
            ).annotate(
                rainfall_mm=Sum("rain_mm"),
                average_rainfall=Avg("rain_mm"),
                mandal_count=Count("id"),
            ).order_by(
                "-rainfall_mm"
            ),
            1,
        )
    ]

    return Response({
        "success": True,
        "date": date,

        "summary": {
            "total_rainfall": float(
                summary["total_rainfall"] or 0
            ),
            "average_rainfall": float(
                summary["average_rainfall"] or 0
            ),
            "highest_rainfall": float(
                summary["highest_rainfall"] or 0
            ),
            "total_mandals": summary["total_mandals"],
            "rain_receiving_mandals": records.filter(
                rain_mm__gt=0
            ).count(),
            "no_rain_mandals": records.filter(
                rain_mm=0
            ).count(),
            "average_min_humidity": float(
                summary["average_min_humidity"] or 0
            ),
            "average_max_humidity": float(
                summary["average_max_humidity"] or 0
            ),
        },

        "wettest_district": (
            {
                "district": districts[0]["district"],
                "rainfall_mm": districts[0]["rainfall_mm"],
            }
            if districts
            else None
        ),

        "rainfall_distribution": distribution,
        "top_5_mandals": top_5,
        "districts": districts,
        "mandal_count": len(mandals),
        "mandals": mandals,
    })


# ============================================================
# YEARLY CALENDAR
# ============================================================

@api_view(["GET"])
def yearly_calendar(request):

    rows = (
        RainfallRecord.objects
        .values("date")
        .annotate(
            total_rainfall=Sum("rain_mm"),
            average_rainfall=Avg("rain_mm"),
            average_min_humidity=Avg("min_humidity"),
            average_max_humidity=Avg("max_humidity"),
        )
        .order_by("date")
    )

    calendar = [
        {
            "date": r["date"],
            "total_rainfall": round(
                float(r["total_rainfall"] or 0),
                2
            ),
            "average_rainfall": round(
                float(r["average_rainfall"] or 0),
                2
            ),
            "average_min_humidity": round(
                float(r["average_min_humidity"] or 0),
                2
            ),
            "average_max_humidity": round(
                float(r["average_max_humidity"] or 0),
                2
            ),
        }
        for r in rows
    ]

    return Response({
        "success": True,
        "year": 2022,
        "count": len(calendar),
        "calendar": calendar,
    })


# ============================================================
# DISTRICT LIST
# ============================================================

@api_view(["GET"])
def district_list(request):

    districts = list(
        RainfallRecord.objects
        .values_list(
            "district",
            flat=True
        )
        .distinct()
        .order_by("district")
    )

    return Response({
        "success": True,
        "count": len(districts),
        "districts": districts,
    })


# ============================================================
# MANDAL LIST
# ============================================================

@api_view(["GET"])
def mandal_list(request):

    district = request.GET.get(
        "district"
    )

    queryset = RainfallRecord.objects.all()
    actual_district = district

    if district:

        queryset, actual_district = (
            get_district_records(district)
        )

        if not queryset.exists():
            return Response({
                "success": False,
                "message": "No rainfall data found for this district.",
                "mandals": [],
            }, status=404)

    mandals = list(
        queryset
        .values(
            "mandal",
            "district"
        )
        .distinct()
        .order_by(
            "district",
            "mandal"
        )
    )

    return Response({
        "success": True,
        "district": actual_district,
        "count": len(mandals),
        "mandals": mandals,
    })


# ============================================================
# DISTRICT ANALYSIS
# ============================================================

@api_view(["GET"])
def district_analysis(
    request,
    district_name
):

    records, actual_district = (
        get_district_records(
            district_name
        )
    )

    if not records.exists():
        return Response({
            "success": False,
            "message": "No rainfall data found for this district.",
            "requested_district": district_name,
        }, status=404)

    summary = records.aggregate(
        average_rainfall=Avg("rain_mm"),
        highest_rainfall=Max("rain_mm"),
        lowest_rainfall=Min("rain_mm"),
        total_rainfall=Sum("rain_mm"),
    )

    daily = (
        records
        .values("date")
        .annotate(
            rainfall=Sum("rain_mm")
        )
        .order_by("date")
    )

    daily_list = list(daily)

    rainy_days = sum(
        1
        for item in daily_list
        if float(item["rainfall"] or 0) > 0
    )

    highest = (
        records
        .order_by(
            "-rain_mm",
            "date"
        )
        .first()
    )

    month_names = [
        "January",
        "February",
        "March",
        "April",
        "May",
        "June",
        "July",
        "August",
        "September",
        "October",
        "November",
        "December",
    ]

    monthly_values = {}

    for item in daily_list:

        month = item["date"].month

        monthly_values.setdefault(
            month,
            []
        ).append(
            float(item["rainfall"] or 0)
        )

    monthly_rainfall = []

    for month, name in enumerate(
        month_names,
        1
    ):

        values = monthly_values.get(
            month,
            []
        )

        monthly_rainfall.append({
            "month": month,
            "month_name": name,
            "rainfall_mm": round(
                sum(values) / len(values)
                if values
                else 0,
                2
            ),
        })

    daily_rainfall = [
        {
            "date": r["date"],
            "rainfall_mm": round(
                float(r["rainfall"] or 0),
                2
            ),
        }
        for r in daily_list
    ]

    mandals = [
        {
            "mandal": r["mandal"],
            "total_rainfall": round(
                float(r["total_rainfall"] or 0),
                2
            ),
            "average_rainfall": round(
                float(r["average_rainfall"] or 0),
                2
            ),
            "highest_rainfall": round(
                float(r["highest_rainfall"] or 0),
                2
            ),
            "rainy_days": r["rainy_days"],
        }
        for r in (
            records
            .values("mandal")
            .annotate(
                total_rainfall=Sum("rain_mm"),
                average_rainfall=Avg("rain_mm"),
                highest_rainfall=Max("rain_mm"),
                rainy_days=Count(
                    "date",
                    distinct=True
                ),
            )
            .order_by(
                "-total_rainfall"
            )
        )
    ]

    return Response({
        "success": True,
        "district": actual_district,
        "requested_district": district_name,
        "year": 2022,

        "summary": {
            "average_rainfall": round(
                float(
                    summary["average_rainfall"] or 0
                ),
                2
            ),
            "highest_rainfall": round(
                float(
                    summary["highest_rainfall"] or 0
                ),
                2
            ),
            "lowest_rainfall": round(
                float(
                    summary["lowest_rainfall"] or 0
                ),
                2
            ),
            "total_rainfall": round(
                float(
                    summary["total_rainfall"] or 0
                ),
                2
            ),
            "rainy_days": rainy_days,
            "highest_rainfall_date": (
                highest.date
                if highest
                else None
            ),
        },

        "monthly_rainfall": monthly_rainfall,
        "daily_rainfall": daily_rainfall,
        "mandals": mandals,
    })


# ============================================================
# MANDAL ANALYSIS
# ============================================================

@api_view(["GET"])
def mandal_analysis(
    request,
    district_name,
    mandal_name
):

    district_records, actual_district = (
        get_district_records(
            district_name
        )
    )

    if not district_records.exists():
        return Response({
            "success": False,
            "message": "No rainfall data found for this district.",
            "district": district_name,
        }, status=404)

    requested = re.sub(
        r"[^a-z0-9]",
        "",
        str(mandal_name).strip().lower()
    )

    mandal_names = list(
        district_records
        .values_list(
            "mandal",
            flat=True
        )
        .distinct()
    )

    actual_mandal = next(
        (
            name
            for name in mandal_names
            if re.sub(
                r"[^a-z0-9]",
                "",
                str(name).strip().lower()
            ) == requested
        ),
        None
    )

    if not actual_mandal:
        return Response({
            "success": False,
            "message": "No rainfall data found for this mandal.",
            "district": actual_district,
            "mandal": mandal_name,
        }, status=404)

    records = district_records.filter(
        mandal=actual_mandal
    )

    summary = records.aggregate(
        total_rainfall=Sum("rain_mm"),
        average_rainfall=Avg("rain_mm"),
        highest_rainfall=Max("rain_mm"),
        lowest_rainfall=Min("rain_mm"),
    )

    daily = list(
        records
        .values("date")
        .annotate(
            rainfall=Sum("rain_mm")
        )
        .order_by("date")
    )

    rainy_days = sum(
        1
        for r in daily
        if float(r["rainfall"] or 0) > 0
    )

    highest = (
        records
        .order_by(
            "-rain_mm",
            "date"
        )
        .first()
    )

    monthly = (
        records
        .annotate(
            month=TruncMonth("date")
        )
        .values("month")
        .annotate(
            rainfall=Sum("rain_mm")
        )
        .order_by("month")
    )

    monthly_rainfall = [
        {
            "month": r["month"].strftime("%b"),
            "month_name": r["month"].strftime("%B"),
            "rainfall_mm": round(
                float(r["rainfall"] or 0),
                1
            ),
        }
        for r in monthly
        if r["month"]
    ]

    daily_rainfall = [
        {
            "date": r["date"],
            "rainfall_mm": round(
                float(r["rainfall"] or 0),
                1
            ),
        }
        for r in daily
    ]

    seasons = {
        "Winter": {
            "months": [1, 2],
            "month_names": [
                "January",
                "February"
            ],
        },

        "Summer": {
            "months": [3, 4, 5],
            "month_names": [
                "March",
                "April",
                "May"
            ],
        },

        "Southwest Monsoon": {
            "months": [6, 7, 8, 9],
            "month_names": [
                "June",
                "July",
                "August",
                "September"
            ],
        },

        "Post-Monsoon": {
            "months": [10, 11, 12],
            "month_names": [
                "October",
                "November",
                "December"
            ],
        },
    }

    seasonal_rainfall = []

    total_rainfall = float(
        summary["total_rainfall"] or 0
    )

    for season, info in seasons.items():

        season_records = records.filter(
            date__month__in=info["months"]
        )

        season_daily = (
            season_records
            .values("date")
            .annotate(
                rainfall=Sum("rain_mm")
            )
        )

        season_total = float(
            season_records
            .aggregate(
                total=Sum("rain_mm")
            )["total"] or 0
        )

        season_rainy = sum(
            1
            for r in season_daily
            if float(r["rainfall"] or 0) > 0
        )

        season_days = season_daily.count()

        season_dry = (
            season_days -
            season_rainy
        )

        humidity = season_records.aggregate(
            min_humidity=Avg("min_humidity"),
            max_humidity=Avg("max_humidity"),
        )

        seasonal_rainfall.append({
            "season": season,
            "months": info["month_names"],
            "rainfall_mm": round(
                season_total,
                1
            ),
            "percentage": round(
                season_total /
                total_rainfall *
                100
                if total_rainfall
                else 0,
                1
            ),
            "average_rainfall": round(
                season_total /
                season_days
                if season_days
                else 0,
                1
            ),
            "rainy_days": season_rainy,
            "dry_days": season_dry,
            "rainy_day_ratio": round(
                season_rainy /
                season_days *
                100
                if season_days
                else 0,
                1
            ),
            "dry_day_ratio": round(
                season_dry /
                season_days *
                100
                if season_days
                else 0,
                1
            ),
            "average_min_humidity": round(
                float(
                    humidity["min_humidity"] or 0
                ),
                1
            ),
            "average_max_humidity": round(
                float(
                    humidity["max_humidity"] or 0
                ),
                1
            ),
        })

    return Response({
        "success": True,
        "district": actual_district,
        "mandal": actual_mandal,
        "requested_district": district_name,
        "requested_mandal": mandal_name,
        "year": 2022,

        "total_rainfall": round(
            total_rainfall,
            1
        ),

        "average_rainfall": round(
            float(
                summary["average_rainfall"] or 0
            ),
            1
        ),

        "highest_rainfall": round(
            float(
                summary["highest_rainfall"] or 0
            ),
            1
        ),

        "lowest_rainfall": round(
            float(
                summary["lowest_rainfall"] or 0
            ),
            1
        ),

        "highest_rainfall_date": (
            highest.date
            if highest
            else None
        ),

        "rainy_days": rainy_days,
        "monthly_rainfall": monthly_rainfall,
        "seasonal_rainfall": seasonal_rainfall,
        "daily_rainfall": daily_rainfall,
        "record_count": len(daily_rainfall),
    })


# ============================================================
# RAINFALL TRENDS
# ============================================================

@api_view(["GET"])
def rainfall_trends(request):

    try:

        records = RainfallRecord.objects.all()

        if not records.exists():
            return Response({
                "success": False,
                "message": "No rainfall data available.",
            }, status=404)

        daily_rows = list(
            records
            .values("date")
            .annotate(
                rainfall=Sum("rain_mm")
            )
            .order_by("date")
        )

        daily_values = [
            float(row["rainfall"] or 0)
            for row in daily_rows
        ]

        total_days = len(daily_rows)

        rainy_days = sum(
            value > 0
            for value in daily_values
        )

        rain_free_days = (
            total_days -
            rainy_days
        )

        total_rainfall = sum(
            daily_values
        )

        average_daily_rainfall = (
            total_rainfall /
            total_days
            if total_days
            else 0
        )

        highest_daily_rainfall = (
            max(daily_values)
            if daily_values
            else 0
        )

        top_days = sorted(
            daily_rows,
            key=lambda row:
                float(
                    row["rainfall"] or 0
                ),
            reverse=True
        )[:20]

        top_20_days = [
            {
                "rank": index,
                "date": row["date"].strftime(
                    "%Y-%m-%d"
                ),
                "rainfall_mm": round(
                    float(
                        row["rainfall"] or 0
                    ),
                    1
                ),
            }
            for index, row in enumerate(
                top_days,
                1
            )
        ]

        district_rows = list(
            records
            .values("district")
            .annotate(
                rainfall_mm=Sum("rain_mm"),
                average_rainfall=Avg("rain_mm"),
                rainy_records=Count("id"),
            )
            .order_by(
                "-rainfall_mm",
                "district"
            )[:5]
        )

        top_5_districts = [
            {
                "rank": index,
                "district": row["district"],
                "rainfall_mm": round(
                    float(
                        row["rainfall_mm"] or 0
                    ),
                    1
                ),
                "average_rainfall": round(
                    float(
                        row["average_rainfall"] or 0
                    ),
                    1
                ),
                "rainy_records": row[
                    "rainy_records"
                ],
            }
            for index, row in enumerate(
                district_rows,
                1
            )
        ]

        mandal_rows = list(
            records
            .values(
                "district",
                "mandal"
            )
            .annotate(
                rainfall_mm=Sum("rain_mm"),
                average_rainfall=Avg("rain_mm"),
                rainy_records=Count("id"),
            )
            .order_by(
                "-rainfall_mm",
                "district",
                "mandal"
            )[:20]
        )

        top_20_mandals = [
            {
                "rank": index,
                "district": row["district"],
                "mandal": row["mandal"],
                "rainfall_mm": round(
                    float(
                        row["rainfall_mm"] or 0
                    ),
                    1
                ),
                "average_rainfall": round(
                    float(
                        row["average_rainfall"] or 0
                    ),
                    1
                ),
                "rainy_records": row[
                    "rainy_records"
                ],
            }
            for index, row in enumerate(
                mandal_rows,
                1
            )
        ]

        intensity_distribution = {
            "no_rain": 0,
            "light": 0,
            "moderate": 0,
            "heavy": 0,
            "very_heavy": 0,
            "extreme": 0,
        }

        for value in daily_values:

            if value == 0:
                intensity_distribution[
                    "no_rain"
                ] += 1

            elif value < 10:
                intensity_distribution[
                    "light"
                ] += 1

            elif value < 50:
                intensity_distribution[
                    "moderate"
                ] += 1

            elif value < 100:
                intensity_distribution[
                    "heavy"
                ] += 1

            elif value < 200:
                intensity_distribution[
                    "very_heavy"
                ] += 1

            else:
                intensity_distribution[
                    "extreme"
                ] += 1

        monthly_rows = list(
            records
            .annotate(
                month=TruncMonth("date")
            )
            .values("month")
            .annotate(
                rainfall=Sum("rain_mm")
            )
            .order_by("month")
        )

        monthly_totals = {
            row["month"].month:
                float(
                    row["rainfall"] or 0
                )
            for row in monthly_rows
            if row["month"]
        }

        month_names = [
            "Jan", "Feb", "Mar", "Apr",
            "May", "Jun", "Jul", "Aug",
            "Sep", "Oct", "Nov", "Dec",
        ]

        month_full_names = [
            "January",
            "February",
            "March",
            "April",
            "May",
            "June",
            "July",
            "August",
            "September",
            "October",
            "November",
            "December",
        ]

        anomaly = []

        for month in range(1, 13):

            month_total = monthly_totals.get(
                month,
                0
            )

            days_in_month = sum(
                1
                for row in daily_rows
                if row["date"].month == month
            )

            monthly_average = (
                month_total /
                days_in_month
                if days_in_month
                else 0
            )

            deviation = (
                (
                    monthly_average -
                    average_daily_rainfall
                )
                /
                average_daily_rainfall
                *
                100
                if average_daily_rainfall
                else 0
            )

            anomaly.append({
                "month": month_names[month - 1],
                "month_name": month_full_names[
                    month - 1
                ],
                "rainfall_mm": round(
                    month_total,
                    1
                ),
                "average_daily_rainfall": round(
                    monthly_average,
                    2
                ),
                "deviation": round(
                    deviation,
                    1
                ),
            })

        quarters = {
            "Q1": [1, 2, 3],
            "Q2": [4, 5, 6],
            "Q3": [7, 8, 9],
            "Q4": [10, 11, 12],
        }

        quarterly_contribution = []

        for quarter, quarter_months in quarters.items():

            value = sum(
                monthly_totals.get(
                    month,
                    0
                )
                for month in quarter_months
            )

            percentage = (
                value /
                total_rainfall *
                100
                if total_rainfall
                else 0
            )

            quarterly_contribution.append({
                "quarter": quarter,
                "rainfall_mm": round(
                    value,
                    1
                ),
                "percentage": round(
                    percentage,
                    1
                ),
            })

        rainy_percentage = (
            rainy_days /
            total_days *
            100
            if total_days
            else 0
        )

        return Response({

            "success": True,

            "year": 2022,

            "summary": {
                "total_days": total_days,
                "rainy_days": rainy_days,
                "rain_free_days": rain_free_days,

                "rainy_day_percentage": round(
                    rainy_percentage,
                    1
                ),

                "rain_free_day_percentage": round(
                    100 - rainy_percentage,
                    1
                ),

                "total_rainfall": round(
                    total_rainfall,
                    1
                ),

                "average_daily_rainfall": round(
                    average_daily_rainfall,
                    2
                ),

                "highest_daily_rainfall": round(
                    highest_daily_rainfall,
                    1
                ),
            },

            "daily_rainfall": [
                {
                    "date": row["date"].strftime(
                        "%Y-%m-%d"
                    ),
                    "rainfall_mm": round(
                        float(
                            row["rainfall"] or 0
                        ),
                        1
                    ),
                }
                for row in daily_rows
            ],

            "intensity_distribution":
                intensity_distribution,

            "anomaly": anomaly,

            "top_20_days":
                top_20_days,

            "top_5_districts":
                top_5_districts,

            "top_20_mandals":
                top_20_mandals,

            "quarterly_contribution":
                quarterly_contribution,
        })

    except Exception as e:

        print(
            "Rainfall trends error:",
            e
        )

        return Response({
            "success": False,
            "message": "Unable to load rainfall trends data.",
            "error": str(e),
        }, status=500)


# ============================================================
# HUMIDITY ANALYSIS - OPTIMIZED
# ============================================================

@api_view(["GET"])
def humidity_analysis(request):

    CACHE_KEY = "telangana_humidity_analysis_2022"

    try:

        # ----------------------------------------------------
        # CHECK CACHE FIRST
        # ----------------------------------------------------

        cached_data = cache.get(
            CACHE_KEY
        )

        if cached_data is not None:
            return Response(
                cached_data
            )

        # ----------------------------------------------------
        # ONLY RECORDS WITH HUMIDITY
        # ----------------------------------------------------

        records = (
            RainfallRecord.objects
            .filter(
                min_humidity__isnull=False,
                max_humidity__isnull=False,
            )
        )

        if not records.exists():

            return Response({
                "success": False,
                "message": "No humidity data available.",
            }, status=404)

        # ----------------------------------------------------
        # HUMIDITY EXPRESSION
        #
        # Average humidity =
        # (minimum humidity + maximum humidity) / 2
        # ----------------------------------------------------

        humidity_expression = ExpressionWrapper(
            (
                F("min_humidity") +
                F("max_humidity")
            ) / Value(2.0),
            output_field=FloatField(),
        )

        # ====================================================
        # SUMMARY
        # ====================================================

        summary = (
            records
            .annotate(
                humidity=humidity_expression
            )
            .aggregate(
                average=Avg("humidity"),
                maximum=Max("max_humidity"),
                minimum=Min("min_humidity"),
            )
        )

        average_humidity = round(
            float(
                summary["average"] or 0
            ),
            1
        )

        maximum_humidity = round(
            float(
                summary["maximum"] or 0
            ),
            1
        )

        minimum_humidity = round(
            float(
                summary["minimum"] or 0
            ),
            1
        )

        # ====================================================
        # MONTHLY HUMIDITY
        # ====================================================

        month_names = [
            "Jan",
            "Feb",
            "Mar",
            "Apr",
            "May",
            "Jun",
            "Jul",
            "Aug",
            "Sep",
            "Oct",
            "Nov",
            "Dec",
        ]

        monthly_rows = (
            records
            .annotate(
                month=ExtractMonth("date"),
                humidity=humidity_expression,
            )
            .values("month")
            .annotate(
                average=Avg("humidity"),
                minimum=Min("min_humidity"),
                maximum=Max("max_humidity"),
            )
            .order_by("month")
        )

        monthly = []

        for row in monthly_rows:

            month_number = row["month"]

            if not month_number:
                continue

            monthly.append({

                "month":
                    month_names[
                        month_number - 1
                    ],

                "month_number":
                    month_number,

                "humidity":
                    round(
                        float(
                            row["average"] or 0
                        ),
                        1
                    ),

                "minimum":
                    round(
                        float(
                            row["minimum"] or 0
                        ),
                        1
                    ),

                "maximum":
                    round(
                        float(
                            row["maximum"] or 0
                        ),
                        1
                    ),
            })

        # ====================================================
        # PEAK MONTH
        # ====================================================

        peak_month = max(
            monthly,
            key=lambda x:
                x["humidity"],
            default=None,
        )

        peak_month_name = (
            peak_month["month"]
            if peak_month
            else "-"
        )

        # ====================================================
        # HUMIDITY DISTRIBUTION
        #
        # IMPORTANT:
        # Classification happens in database.
        # We don't create a 200k Python list.
        # ====================================================

        distribution_queryset = (
            records
            .annotate(
                humidity=humidity_expression
            )
        )

        distribution = [

            {
                "label": "Very Low",
                "value":
                    distribution_queryset
                    .filter(
                        humidity__lt=20
                    )
                    .count(),
            },

            {
                "label": "Low",
                "value":
                    distribution_queryset
                    .filter(
                        humidity__gte=20,
                        humidity__lt=40
                    )
                    .count(),
            },

            {
                "label": "Moderate",
                "value":
                    distribution_queryset
                    .filter(
                        humidity__gte=40,
                        humidity__lt=60
                    )
                    .count(),
            },

            {
                "label": "High",
                "value":
                    distribution_queryset
                    .filter(
                        humidity__gte=60,
                        humidity__lt=80
                    )
                    .count(),
            },

            {
                "label": "Very High",
                "value":
                    distribution_queryset
                    .filter(
                        humidity__gte=80
                    )
                    .count(),
            },
        ]

        # ====================================================
        # HUMIDITY RANGE
        # ====================================================

        humidity_range = [

            {
                "month":
                    item["month"],

                "minimum":
                    item["minimum"],

                "average":
                    item["humidity"],

                "maximum":
                    item["maximum"],

                "range":
                    round(
                        item["maximum"] -
                        item["minimum"],
                        1
                    ),
            }

            for item in monthly
        ]

        # ====================================================
        # DISTRICT HUMIDITY
        # ====================================================

        district_rows = (
            records
            .annotate(
                humidity=humidity_expression
            )
            .values("district")
            .annotate(
                average=Avg("humidity")
            )
            .order_by("-average")
        )

        districts = [

            {
                "rank": index,

                "district":
                    row["district"],

                "humidity":
                    round(
                        float(
                            row["average"] or 0
                        ),
                        1
                    ),
            }

            for index, row in enumerate(
                district_rows,
                1
            )
        ]

        # ====================================================
        # DISTRICT × MONTH HEATMAP
        # ====================================================

        heatmap_rows = (
            records
            .annotate(
                month=ExtractMonth("date"),
                humidity=humidity_expression,
            )
            .values(
                "district",
                "month",
            )
            .annotate(
                humidity_avg=Avg("humidity")
            )
            .order_by(
                "district",
                "month",
            )
        )

        heatmap_dict = {}

        for row in heatmap_rows:

            district = row["district"]
            month_number = row["month"]

            if not district or not month_number:
                continue

            if district not in heatmap_dict:

                heatmap_dict[district] = {
                    "district": district
                }

                for month in month_names:
                    heatmap_dict[district][month] = 0

            heatmap_dict[
                district
            ][
                month_names[
                    month_number - 1
                ]
            ] = round(
                float(
                    row["humidity_avg"] or 0
                ),
                1
            )

        heatmap = list(
            heatmap_dict.values()
        )

        # ====================================================
        # HUMIDITY VS RAINFALL
        #
        # VERY IMPORTANT:
        #
        # We aggregate by DATE.
        #
        # Instead of:
        # 200,286 points
        #
        # We return roughly:
        # 365 points
        # ====================================================

        relationship_rows = (
            records
            .annotate(
                day=TruncDay("date")
            )
            .values("day")
            .annotate(
                rainfall=Sum("rain_mm"),
                average_min=Avg("min_humidity"),
                average_max=Avg("max_humidity"),
            )
            .order_by("day")
        )

        relationship = []

        for row in relationship_rows:

            if not row["day"]:
                continue

            min_humidity = float(
                row["average_min"] or 0
            )

            max_humidity = float(
                row["average_max"] or 0
            )

            humidity = (
                min_humidity +
                max_humidity
            ) / 2

            relationship.append({

                "date":
                    row["day"].strftime(
                        "%Y-%m-%d"
                    ),

                "humidity":
                    round(
                        humidity,
                        1
                    ),

                "rainfall":
                    round(
                        float(
                            row["rainfall"] or 0
                        ),
                        1
                    ),
            })

        # ====================================================
        # FINAL RESPONSE
        # ====================================================

        response_data = {

            "success":
                True,

            "year":
                2022,

            "summary": {

                "average":
                    average_humidity,

                "average_humidity":
                    average_humidity,

                "maximum":
                    maximum_humidity,

                "maximum_humidity":
                    maximum_humidity,

                "minimum":
                    minimum_humidity,

                "minimum_humidity":
                    minimum_humidity,

                "peak_month":
                    peak_month_name,

                "peak_humidity_month":
                    peak_month_name,
            },

            "monthly":
                monthly,

            "distribution":
                distribution,

            "humidity_range":
                humidity_range,

            "humidity_rainfall":
                relationship,

            "districts":
                districts,

            "heatmap":
                heatmap,
        }

        # ====================================================
        # CACHE FOR 1 HOUR
        # ====================================================

        cache.set(
            CACHE_KEY,
            response_data,
            60 * 60
        )

        return Response(
            response_data
        )

    except Exception as e:

        print(
            "Humidity analysis error:",
            e
        )

        return Response({

            "success":
                False,

            "message":
                "Unable to load humidity analysis.",

            "error":
                str(e),

        }, status=500)