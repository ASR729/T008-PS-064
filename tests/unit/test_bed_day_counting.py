"""
Unit tests for BR-01: Bed-day counting.

Tests the exact official bed-day rules:
- Noon counting anchor for non-ICU
- ICU 08:00 counting anchor
- Admission before noon behavior
- Admission exactly at noon behavior
- Discharge at 14:00 behavior
- Discharge after 14:00 behavior
- Minimum one-day rule for stay under 24 hours
- Correct counting over multiple calendar days
"""

from datetime import datetime
from decimal import Decimal

import pytest

from src.billing_engine import BedDayCounter, Category


class TestBedDayCounting:
    """Tests for BR-01 bed-day counting rules."""

    def test_admission_before_noon_counts_noon(self, bed_day_counter):
        """Admission before noon counts that day's noon as bed day."""
        admit = datetime(2026, 1, 15, 11, 30, 0)
        discharge = datetime(2026, 1, 16, 10, 0, 0)

        bed_days = bed_day_counter.count_bed_days(
            'ADM-001', Category.GENERAL, admit, discharge
        )

        # Should count Jan 15 noon (admission before noon)
        assert len(bed_days) >= 1
        jan15_entries = [b for b in bed_days if str(b['date']) == '2026-01-15']
        assert len(jan15_entries) == 1
        assert jan15_entries[0]['category'] == Category.GENERAL

    def test_admission_exactly_at_noon_does_not_count(self, bed_day_counter):
        """Admission at exactly 12:00:00 does NOT count that noon."""
        admit = datetime(2026, 1, 15, 12, 0, 0)
        discharge = datetime(2026, 1, 16, 10, 0, 0)

        bed_days = bed_day_counter.count_bed_days(
            'ADM-001', Category.GENERAL, admit, discharge
        )

        # Jan 15 should NOT be counted (admission at exactly noon)
        jan15_entries = [b for b in bed_days if str(b['date']) == '2026-01-15']
        assert len(jan15_entries) == 0

        # Jan 16: discharge at exactly 10:00 adds nothing per rules,
        # but minimum one-day rule adds one entry since stay < 24h
        jan16_entries = [b for b in bed_days if str(b['date']) == '2026-01-16']
        assert len(jan16_entries) == 1
        assert jan16_entries[0]['reason'] == 'minimum_one_day_rule'

    def test_discharge_after_1400_adds_extra_bed_day(self, bed_day_counter):
        """Discharge after 14:00:00 adds one extra bed day."""
        admit = datetime(2026, 1, 15, 10, 0, 0)
        discharge = datetime(2026, 1, 16, 14, 30, 0)

        bed_days = bed_day_counter.count_bed_days(
            'ADM-001', Category.GENERAL, admit, discharge
        )

        # Jan 16 discharge after 14:00 should add extra bed day
        jan16_entries = [b for b in bed_days if str(b['date']) == '2026-01-16']
        assert len(jan16_entries) == 1

    def test_discharge_at_1400_adds_nothing(self, bed_day_counter):
        """Discharge at exactly 14:00:00 adds nothing."""
        admit = datetime(2026, 1, 15, 10, 0, 0)
        discharge = datetime(2026, 1, 16, 14, 0, 0)

        bed_days = bed_day_counter.count_bed_days(
            'ADM-001', Category.GENERAL, admit, discharge
        )

        # Jan 16 discharge at exactly 14:00 adds nothing
        jan16_entries = [b for b in bed_days if str(b['date']) == '2026-01-16']
        assert len(jan16_entries) == 0

    def test_discharge_at_1000_adds_nothing(self, bed_day_counter):
        """Discharge at exactly 10:00:00 adds nothing."""
        admit = datetime(2026, 1, 15, 10, 0, 0)
        discharge = datetime(2026, 1, 16, 10, 0, 0)

        bed_days = bed_day_counter.count_bed_days(
            'ADM-001', Category.GENERAL, admit, discharge
        )

        jan16_entries = [b for b in bed_days if str(b['date']) == '2026-01-16']
        assert len(jan16_entries) == 0

    def test_discharge_before_1000_adds_extra_bed_day(self, bed_day_counter):
        """Discharge before 10:00:00 adds one extra bed day unless planned."""
        admit = datetime(2026, 1, 15, 10, 0, 0)
        discharge = datetime(2026, 1, 16, 9, 30, 0)

        bed_days = bed_day_counter.count_bed_days(
            'ADM-001', Category.GENERAL, admit, discharge
        )

        jan16_entries = [b for b in bed_days if str(b['date']) == '2026-01-16']
        assert len(jan16_entries) == 1

    def test_stay_under_24_hours_minimum_one_day(self, bed_day_counter):
        """Minimum one-day rule: stay under 24h with no bed day counted gets one at discharge."""
        admit = datetime(2026, 1, 15, 12, 0, 0)  # Exactly noon - doesn't count
        discharge = datetime(2026, 1, 15, 23, 0, 0)  # Same day, under 24h

        bed_days = bed_day_counter.count_bed_days(
            'ADM-001', Category.GENERAL, admit, discharge
        )

        # Should still count at least one bed day (minimum rule)
        assert len(bed_days) >= 1

    def test_icu_0800_anchor(self, bed_day_counter):
        """ICU beds counted at 08:00 anchor."""
        admit = datetime(2026, 1, 15, 7, 0, 0)  # Before 08:00
        discharge = datetime(2026, 1, 16, 9, 0, 0)

        bed_days = bed_day_counter.count_bed_days(
            'ADM-001', Category.ICU, admit, discharge
        )

        # ICU entry before 08:00 should count at 08:00 anchor
        jan15_entries = [b for b in bed_days if str(b['date']) == '2026-01-15']
        assert len(jan15_entries) >= 1
        assert jan15_entries[0]['category'] == Category.ICU

    def test_no_duplicate_bed_day(self, bed_day_counter):
        """Each bed day charged no more than once."""
        admit = datetime(2026, 1, 15, 10, 0, 0)
        discharge = datetime(2026, 1, 16, 10, 0, 0)

        bed_days = bed_day_counter.count_bed_days(
            'ADM-001', Category.GENERAL, admit, discharge
        )

        # No duplicate dates
        dates = [b['date'] for b in bed_days]
        assert len(dates) == len(set(dates))

    def test_multiple_calendar_days(self, bed_day_counter):
        """Correct counting over multiple calendar days."""
        admit = datetime(2026, 1, 15, 10, 0, 0)
        discharge = datetime(2026, 1, 18, 10, 0, 0)  # 3 days

        bed_days = bed_day_counter.count_bed_days(
            'ADM-001', Category.GENERAL, admit, discharge
        )

        dates = sorted([str(b['date']) for b in bed_days])
        assert '2026-01-15' in dates
        assert '2026-01-16' in dates
        assert '2026-01-17' in dates
        # Jan 18 discharge at 10:00 adds nothing
        assert '2026-01-18' not in dates

    def test_icu_entered_after_0800_counted_at_noon(self, bed_day_counter):
        """ICU entered after 08:00 counted at noon as ICU."""
        admit = datetime(2026, 1, 15, 9, 0, 0)  # After 08:00
        discharge = datetime(2026, 1, 16, 10, 0, 0)

        bed_days = bed_day_counter.count_bed_days(
            'ADM-001', Category.ICU, admit, discharge
        )

        jan15_entries = [b for b in bed_days if str(b['date']) == '2026-01-15']
        assert len(jan15_entries) >= 1
        assert jan15_entries[0]['category'] == Category.ICU
