import os
import sys
import time
import subprocess
from typing import Tuple, Optional

class ExecutionResult:
    def __init__(
        self,
        exit_code: int,
        stdout: str,
        stderr: str,
        time_ms: int,
        memory_kb: int,
        is_timeout: bool = False,
        is_memory_limit: bool = False,
        error: Optional[str] = None
    ):
        self.exit_code = exit_code
        self.stdout = stdout
        self.stderr = stderr
        self.time_ms = time_ms
        self.memory_kb = memory_kb
        self.is_timeout = is_timeout
        self.is_memory_limit = is_memory_limit
        self.error = error

class Runner:
    @staticmethod
    def run_testcase(
        binary_path: str,
        input_data: str,
        time_limit_ms: int,
        memory_limit_mb: int,
        cwd: str
    ) -> ExecutionResult:
        """
        Runs the compiled executable using piped stdin and captures stdout.
        Never passes testcase file paths to the user binary.
        """
        time_limit_sec = max(1, (time_limit_ms + 999) // 1000)
        
        preexec_fn = None
        # On POSIX / Termux, attach setrlimit to preexec
        if sys.platform != "win32":
            from worker.limits import set_process_limits
            def preexec():
                set_process_limits(time_limit_sec, memory_limit_mb)
            preexec_fn = preexec

        start_time = time.perf_counter()
        try:
            proc = subprocess.Popen(
                [binary_path],
                stdin=subprocess.PIPE,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                text=True,
                cwd=cwd,
                preexec_fn=preexec_fn
            )

            stdout, stderr = proc.communicate(
                input=input_data,
                timeout=(time_limit_ms / 1000.0) + 0.5  # Soft margin before hard kill
            )
            elapsed_ms = int((time.perf_counter() - start_time) * 1000)

            return ExecutionResult(
                exit_code=proc.returncode,
                stdout=stdout,
                stderr=stderr,
                time_ms=elapsed_ms,
                memory_kb=0
            )

        except subprocess.TimeoutExpired:
            proc.kill()
            stdout, stderr = proc.communicate()
            return ExecutionResult(
                exit_code=-1,
                stdout="",
                stderr="",
                time_ms=time_limit_ms + 1,
                memory_kb=0,
                is_timeout=True
            )
        except Exception as e:
            return ExecutionResult(
                exit_code=-1,
                stdout="",
                stderr=str(e),
                time_ms=0,
                memory_kb=0,
                error=str(e)
            )
