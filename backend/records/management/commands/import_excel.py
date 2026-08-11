import os

import pandas as pd

from django.conf import settings
from django.core.management.base import BaseCommand

from records.models import RainfallRecord


class Command(BaseCommand):

    help = "Import Telangana 2022 rainfall data from Excel"

    def handle(self, *args, **options):

        # Excel file path
        file_path = os.path.join(
            settings.BASE_DIR,
            "data",
            "Telangana_Rainfall_2022_All_Months.xlsx"
        )

        # Check if Excel exists
        if not os.path.exists(file_path):

            self.stdout.write(
                self.style.ERROR(
                    f"Excel file not found:\n{file_path}"
                )
            )

            return

        self.stdout.write(
            self.style.SUCCESS(
                "Excel file found."
            )
        )

        # Read workbook
        excel = pd.ExcelFile(file_path)

        self.stdout.write(
            f"Sheets found: {len(excel.sheet_names)}"
        )

        # Remove existing records
        existing_count = RainfallRecord.objects.count()

        if existing_count > 0:

            self.stdout.write(
                f"Removing {existing_count} existing records..."
            )

            RainfallRecord.objects.all().delete()

        total_records = 0

        # Process every sheet
        for sheet_name in excel.sheet_names:

            self.stdout.write(
                f"\nProcessing: {sheet_name}"
            )

            df = pd.read_excel(
                file_path,
                sheet_name=sheet_name
            )

            # Clean column names
            df.columns = (
                df.columns
                .astype(str)
                .str.strip()
            )

            # Convert date
            df["Date"] = pd.to_datetime(
                df["Date"],
                errors="coerce"
            )

            # Convert rainfall
            df["Rain (mm)"] = pd.to_numeric(
                df["Rain (mm)"],
                errors="coerce"
            ).fillna(0)

            # Convert minimum humidity
            df["Min Humidity (%)"] = pd.to_numeric(
                df["Min Humidity (%)"],
                errors="coerce"
            )

            # Convert maximum humidity
            df["Max Humidity (%)"] = pd.to_numeric(
                df["Max Humidity (%)"],
                errors="coerce"
            )

            records = []

            for _, row in df.iterrows():

                # Skip rows without valid dates
                if pd.isna(row["Date"]):
                    continue

                min_humidity = row[
                    "Min Humidity (%)"
                ]

                max_humidity = row[
                    "Max Humidity (%)"
                ]

                # Treat -1 humidity as missing
                if (
                    pd.notna(min_humidity)
                    and min_humidity < 0
                ):
                    min_humidity = None

                if (
                    pd.notna(max_humidity)
                    and max_humidity < 0
                ):
                    max_humidity = None

                records.append(
                    RainfallRecord(
                        district=str(
                            row["District"]
                        ).strip(),

                        mandal=str(
                            row["Mandal"]
                        ).strip(),

                        date=row["Date"].date(),

                        rain_mm=float(
                            row["Rain (mm)"]
                        ),

                        min_humidity=(
                            float(min_humidity)
                            if pd.notna(min_humidity)
                            else None
                        ),

                        max_humidity=(
                            float(max_humidity)
                            if pd.notna(max_humidity)
                            else None
                        ),
                    )
                )

            # Insert records into SQLite
            RainfallRecord.objects.bulk_create(
                records,
                batch_size=5000
            )

            total_records += len(records)

            self.stdout.write(
                self.style.SUCCESS(
                    f"{sheet_name}: "
                    f"{len(records)} records imported"
                )
            )

        # Final message
        self.stdout.write("")

        self.stdout.write(
            self.style.SUCCESS(
                "=========================================="
            )
        )

        self.stdout.write(
            self.style.SUCCESS(
                "RAINFALL DATA IMPORT COMPLETED"
            )
        )

        self.stdout.write(
            self.style.SUCCESS(
                f"Total records imported: {total_records}"
            )
        )

        self.stdout.write(
            self.style.SUCCESS(
                "=========================================="
            )
        )