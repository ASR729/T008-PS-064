"""
Master data loading for PS-064 Hospital Inpatient Billing and Bed Management Engine.

This module provides functionality to load and validate master data from CSV files
according to the official PS-064 specification.
"""

from typing import Dict, List, Optional, Any
from decimal import Decimal
import csv
from datetime import datetime
from pathlib import Path

from .models import (
    Category, Bed, Doctor, TariffItem, Package, Admission, Patient
)

class MasterDataLoader:
    """Load and validate master data from CSV files."""

    def __init__(self, data_dir: str = "data/official/T008-PS-064-sample-data"):
        self.data_dir = Path(data_dir)
        self.categories: Dict[str, Category] = {}
        self.beds: Dict[str, Bed] = {}
        self.doctors: Dict[str, Doctor] = {}
        self.tariffs: Dict[str, TariffItem] = {}
        self.packages: Dict[str, Package] = {}
        self.admissions: Dict[str, Admission] = {}

    def load_categories(self) -> Dict[str, Category]:
        """Load categories from categories.csv."""
        categories_path = self.data_dir / "categories.csv"
        categories = {}

        with open(categories_path, newline='', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            for i, row in enumerate(reader, start=2):
                try:
                    category = self._parse_category(row, i)
                    categories[category.category] = category
                except Exception as e:
                    raise ValueError(f"Error parsing categories.csv line {i}: {e}")

        if len(categories) != 5:
            raise ValueError(f"Expected 5 categories in categories.csv, got {len(categories)}")

        self.categories = categories
        return categories

    def _parse_category(self, row: Dict[str, str], line_num: int) -> Category:
        """Parse a single category row from CSV."""
        try:
            return Category(
                category=row["category"],
                upgrade_rank=int(row["upgrade_rank"]),
                daily_bed_charge=Decimal(row["daily_bed_charge"]),
                nursing_charge=Decimal(row["nursing_charge"]),
                visit_multiplier=Decimal(row["visit_multiplier"]),
                procedure_multiplier=Decimal(row["procedure_multiplier"]),
                ot_multiplier=Decimal(row["ot_multiplier"]),
                investigation_multiplier=Decimal(row["investigation_multiplier"]),
                pharmacy_consumable_multiplier=Decimal(row["pharmacy_consumable_multiplier"]),
                max_chargeable_doctors_per_day=int(row["max_chargeable_doctors_per_day"])
            )
        except (KeyError, ValueError, TypeError) as e:
            raise ValueError(f"Invalid category data in line {line_num}: {e}")

    def load_beds(self) -> Dict[str, Bed]:
        """Load beds from beds.csv."""
        beds_path = self.data_dir / "beds.csv"
        beds = {}

        with open(beds_path, newline='', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            for i, row in enumerate(reader, start=2):
                try:
                    bed = self._parse_bed(row, i)
                    beds[bed.bed_id] = bed
                except Exception as e:
                    raise ValueError(f"Error parsing beds.csv line {i}: {e}")

        if len(beds) != 60:
            raise ValueError(f"Expected 60 beds in beds.csv, got {len(beds)}")

        self.beds = beds
        return beds

    def _parse_bed(self, row: Dict[str, str], line_num: int) -> Bed:
        """Parse a single bed row from CSV."""
        try:
            category = Category(row["category"])
            daily_bed_charge = Decimal(row["daily_bed_charge"])
            nursing_charge = Decimal(row["nursing_charge"])

            bed = Bed(
                bed_id=row["bed_id"],
                ward_id=row["ward_id"],
                ward_name=row["ward_name"],
                category=category,
                gender_restriction=row["gender_restriction"],
                daily_bed_charge=daily_bed_charge,
                nursing_charge=nursing_charge,\nn                floor=int(row["floor"]),
                status="AVAILABLE"
            )

            if bed.category == Category.GENERAL:
                if bed.gender_restriction not in ["M", "F"]:
                    raise ValueError(f"Invalid gender restriction in line {line_num}")

            return bed
        except (KeyError, ValueError, TypeError) as e:
            raise ValueError(f"Invalid bed data in line {line_num}: {e}")

    def load_doctors(self) -> Dict[str, Doctor]:
        """Load doctors from doctors.csv."""
        doctors_path = self.data_dir / "doctors.csv"
        doctors = {}

        with open(doctors_path, newline='', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            for i, row in enumerate(reader, start=2):
                try:
                    doctor = self._parse_doctor(row, i)
                    doctors[doctor.doctor_id] = doctor
                except Exception as e:
                    raise ValueError(f"Error parsing doctors.csv line {i}: {e}")

        if len(doctors) != 14:
            raise ValueError(f"Expected 14 doctors in doctors.csv, got {len(doctors)}")

        self.doctors = doctors
        return doctors

    def _parse_doctor(self, row: Dict[str, str], line_num: int) -> Doctor:
        """Parse a single doctor row from CSV."""
        try:
            return Doctor(
                doctor_id=row["doctor_id"],
                doctor_name=row["doctor_name"],
                specialty=row["specialty"],
                visit_fee=Decimal(row["visit_fee"]),
                is_intensivist=row["is_intensivist"].lower() == "true"
            )
        except (KeyError, ValueError, TypeError) as e:
            raise ValueError(f"Invalid doctor data in line {line_num}: {e}")

    def load_tariffs(self) -> Dict[str, TariffItem]:
        """Load tariffs from tariff.csv."""
        tariffs_path = self.data_dir / "tariff.csv"
        tariffs = {}

        with open(tariffs_path, newline='', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            for i, row in enumerate(reader, start=2):
                try:
                    tariff = self._parse_tariff(row, i)
                    tariffs[tariff.item_code] = tariff
                except Exception as e:
                    raise ValueError(f"Error parsing tariff.csv line {i}: {e}")

        if len(tariffs) != 80:
            raise ValueError(f"Expected 80 tariffs in tariff.csv, got {len(tariffs)}")

        self.tariffs = tariffs
        return tariffs

    def _parse_tariff(self, row: Dict[str, str], line_num: int) -> TariffItem:
        """Parse a single tariff row from CSV."""
        try:
            return TariffItem(
                item_code=row["item_code"],
                description=row["description"],
                head=row["head"],
                base_rate=Decimal(row["base_rate"]),
                unit=row["unit"]
            )
        except (KeyError, ValueError, TypeError) as e:
            raise ValueError(f"Invalid tariff data in line {line_num}: {e}")

    def load_packages(self) -> Dict[str, Package]:
        """Load packages from packages.csv."""
        packages_path = self.data_dir / "packages.csv"
        packages = {}

        with open(packages_path, newline='', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            for i, row in enumerate(reader, start=2):
                try:
                    package = self._parse_package(row, i)
                    packages[package.package_code] = package
                except Exception as e:
                    raise ValueError(f"Error parsing packages.csv line {i}: {e}")

        if len(packages) != 6:
            raise ValueError(f"Expected 6 packages in packages.csv, got {len(packages)}")

        self.packages = packages
        return packages

    def _parse_package(self, row: Dict[str, str], line_num: int) -> Package:
        """Parse a single package row from CSV."""
        try:
            return Package(
                package_code=row["package_code"],
                package_name=row["package_name"],
                package_category=Category(row["package_category"]),
                package_price=Decimal(row["package_price"]),
                los_days=int(row["los_days"]),
                included_procedures=row["included_procedures"].split(";"),
                exclusions=row["exclusions"].split(";"),
                covered_heads=row["covered_heads"].split(";")
            )
        except (KeyError, ValueError, TypeError) as e:
            raise Value، f"Invalid package data in line {line_num}: {e}")

    def load_admissions(self) -> Dict[str, Admission]:
        """Load admissions from admissions.csv."""
        admissions_path = self.data_dir / "admissions.csv"
        admissions = {}

        with open(admissions_path, newline='', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            for i, row in enumerate(reader, start=2):
                try:
                    admission = self._parse_admission(row, i)
                    admissions[admission.adm_id] = admission
                except Exception as e:
                    raise ValueError(f"Error parsing admissions.csv line {i}: {e}")

        if len(admissions) != 40:
            raise ValueError(f"Expected 40 admissions in admissions.csv, got {len(admissions)}")

        self.admissions = admissions
        return admissions

    def _parse_admission(self, row: Dict[str, str], line_num: int) -> Admission:
        """Parse a single admission row from CSV."""
        try:
            admission = Admission(
                adm_id=row["adm_id"],
                patient_id=row["patient_id"],
                patient_name=row["patient_name"],
                gender=Category(row["gender"]) if row["gender"] else Gender.M,
                date_of_birth=self._parse_date(row["date_of_birth"]),
                mobile=row["mobile"],
                city=row["city"],
                requested_category=Category(row["requested_category"]),
                admitting_doctor_id=row["admitting_doctor_id"],
                package_code=row["package_code"] if row["package_code"] else None,
                employee_referral=row["employee_referral"].lower() == "true"
            )
            return admission
        except (KeyError, ValueError, TypeError) as e:
            raise ValueError(f"Invalid admission data in line {line_num}: {e}")

    def _parse_date(self, date_str: str) -> datetime:
        """Parse date string from CSV."""
        try:
            return datetime.strptime(date_str, "%Y-%m-%d")
        except ValueError:
            raise ValueError(f"Invalid date format: {date_str}")

    def load_all(self) -> None:
        """Load all master data."""
        self.load_categories()
        self.load_beds()
        self.load_doctors()
        self.load_tariffs()
        self.load_packages()
        self.load_admissions()

    def validate_consistency(self) -> List[str]:
        """Validate consistency between master data."""
        errors = []

        for bed_id, bed in self.beds.items():
            if bed.category not in self.categories:
                errors.append(f"Bed {bed_id} references unknown category {bed.category}")

            if bed.category == Category.GENERAL:
                if bed.gender_restriction not in ["M", "F"]:
                    errors.append(f"General bed {bed_id} has invalid gender restriction")

        for doc_id, doctor in self.doctors.items():
            if doctor.is_intensivist and not self._is_valid_intensivist(doctor):
                errors.append(f"Intensivist doctor {doc_id} has no ICU patients")

        for adm_id, admission in self.admissions.items():
            if admission.package_code and admission.package_code not in self.packages:
                errors.append(f"Admission {adm_id} references unknown package {admission.package_code}")

            if admission.admitting_doctor_id not in self.doctors:
                errors.append(f"Admission {adm_id} references unknown doctor {admission.admitting_doctor_id}")

        return errors

    def _is_valid_intensivist(self, doctor: Doctor) -> bool:
        """Check if an intensivist has ICU patients."""
        for adm_id, admission in self.admissions.items():
            if admission.admitting_doctor_id == doctor.doctor_id:
                if admission.requested_category == Category.ICU:
                    return True
        return False

    def get_category(self, category_name: str) -> Category:
        """Get category by name."""
        return self.categories[category_name]

    def get_bed(self, bed_id: str) -> Bed:
        """Get bed by ID."""
        return self.beds[bed_id]

    def get_doctor(self, doctor_id: str) -> Doctor:
        """Get doctor by ID."""
        return self.doctors[doctor_id]

    def get_tariff(self, item_code: str) -> TariffItem:
        """Get tariff by item code."""
        return self.tariffs[item_code]

    def get_package(self, package_code: str) -> Package:
        """Get package by code."""
        return self.packages[package_code]

    def get_admission(self, adm_id: str) -> Admission:
        """Get admission by ID."""
        return self.admissions[adm_id]


# Global instance for easy access
loader = MasterDataLoader()


def load_all_master_data() -> MasterDataLoader:
    """Load all master data and return the loader instance."""
    loader.load_all()
    return loader


def validate_master_data() -> List[str]:
    """Validate consistency of master data."""
    return loader.validate_consistency()