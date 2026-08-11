from rest_framework import serializers

from .models import RainfallRecord


class RainfallRecordSerializer(serializers.ModelSerializer):

    class Meta:
        model = RainfallRecord

        fields = [
            "id",
            "district",
            "mandal",
            "date",
            "rain_mm",
            "min_humidity",
            "max_humidity",
        ]