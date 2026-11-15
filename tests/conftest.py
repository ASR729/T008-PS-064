"""
Shared test fixtures for PS-064 test suite.
"""

from decimal import Decimal
from datetime import datetime
from typing import Dict

import pytest

from src.billing_engine import (
    MasterDataLoader,
    Category,
    Gender,
    BedDayCounter,
    PricingService,
    TransferService,
    PackageService,
    DiscountService,
    GSTService,
    DemandService,
    LedgerService,
    BillingCalculator,
    CommandProcessor,
)


@pytest.fixture
def loader():
    """Load master data for tests."""
    loader = MasterDataLoader()
    loader.load_all()
    return loader


@pytest.fixture
def command_processor(loader):
    """Create a command processor with loaded data."""
    return CommandProcessor(loader)


@pytest.fixture
def bed_day_counter():
    """Create a bed day counter."""
    return BedDayCounter()


@pytest.fixture
def pricing_service(loader):
    """Create a pricing service."""
    return PricingService(loader.categories)


@pytest.fixture
def transfer_service(loader):
    """Create a transfer service."""
    return TransferService(loader.beds)


@pytest.fixture
def package_service(loader):
    """Create a package service."""
    return PackageService(loader.packages)


@pytest.fixture
def discount_service():
    """Create a discount service."""
    return DiscountService()


@pytest.fixture
def gst_service():
    """Create a GST service."""
    return GSTService()


@pytest.fixture
def demand_service():
    """Create a demand service."""
    return DemandService()


@pytest.fixture
def ledger_service():
    """Create a ledger service."""
    return LedgerService()


@pytest.fixture
def billing_calculator(loader):
    """Create a billing calculator."""
    return BillingCalculator(loader.categories)


@pytest.fixture
def sample_admission_data():
    """Sample admission data for testing."""
    return {
        'adm_id': 'ADM-TEST-001',
        'patient_id': 'PAT-TEST-001',
        'patient_name': 'Test Patient',
        'gender': Gender.M,
        'date_of_birth': datetime(1970, 1, 1),
        'mobile': '9999999999',
        'city': 'Test City',
        'requested_category': Category.GENERAL,
        'admitting_doctor_id': 'DOC-01',
        'package_code': None,
        'employee_referral': False,
    }
