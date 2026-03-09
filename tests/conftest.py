import shutil
from pathlib import Path

import pytest

from flow.config import Settings


@pytest.fixture
def tmp_data_dir(tmp_path: Path) -> Path:
    data_dir = tmp_path / "data"
    data_dir.mkdir()
    return data_dir


@pytest.fixture
def test_settings(tmp_data_dir: Path) -> Settings:
    return Settings(data_dir=tmp_data_dir)
