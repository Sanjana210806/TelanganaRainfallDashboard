from django.db import models


class RainfallRecord(models.Model):

    district = models.CharField(
        max_length=100
    )

    mandal = models.CharField(
        max_length=150
    )

    date = models.DateField()

    rain_mm = models.FloatField(
        default=0
    )

    min_humidity = models.FloatField(
        null=True,
        blank=True
    )

    max_humidity = models.FloatField(
        null=True,
        blank=True
    )

    class Meta:

        ordering = [
            "date",
            "district",
            "mandal",
        ]

        indexes = [

            models.Index(
                fields=["date"]
            ),

            models.Index(
                fields=["district"]
            ),

            models.Index(
                fields=["mandal"]
            ),

            models.Index(
                fields=["date", "district"]
            ),

        ]

    def __str__(self):

        return (
            f"{self.district} - "
            f"{self.mandal} - "
            f"{self.date}"
        )