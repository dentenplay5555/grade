import os
import shutil
import tempfile
from typing import List, Optional
from worker.limits import set_process_limits

class Sandbox:
    def __init__(self, submission_id: str):
        self.submission_id = submission_id
        self.workspace_dir: Optional[str] = None

    def __enter__(self):
        # Create isolated temporary workspace
        self.workspace_dir = tempfile.mkdtemp(prefix=f"grader_{self.submission_id[:8]}_")
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        # Clean up workspace immediately after judging
        if self.workspace_dir and os.path.exists(self.workspace_dir):
            shutil.rmtree(self.workspace_dir, ignore_errors=True)

    def get_preexec_fn(self, cpu_time_sec: int, memory_mb: int):
        """Returns preexec_fn for subprocess to drop limits right before exec"""
        def preexec():
            set_process_limits(cpu_time_sec, memory_mb)
        return preexec
