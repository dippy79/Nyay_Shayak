import re

CNR_PATTERN = re.compile(r'^[A-Z]{2,6}\d{0,2}-?\d{6}-?\d{4}$', re.IGNORECASE)


def test_cnr_regex_valid_formats():
    valid_cnrs = ['DLSC01-002315-2024', 'MHAU01-123456-2023', 'UPSC010012342024']
    for cnr in valid_cnrs:
        assert CNR_PATTERN.match(cnr), f"Should accept: {cnr}"


def test_cnr_regex_invalid_formats():
    invalid_cnrs = ['INVALID', '123-456-789', '', 'AB-1234']
    for cnr in invalid_cnrs:
        assert not CNR_PATTERN.match(cnr), f"Should reject: {cnr}"

