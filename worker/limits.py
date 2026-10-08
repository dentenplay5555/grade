import os
import sys

def set_process_limits(cpu_time_sec: int = 2, memory_mb: int = 128, max_processes: int = 5):
    """
    Applies OS-level resource limits to the child process via resource.setrlimit.
    Supported on Linux / Android Termux.
    """
    try:
        import resource
        
        # CPU Limit (seconds)
        resource.setrlimit(resource.RLIMIT_CPU, (cpu_time_sec, cpu_time_sec + 1))
        
        # Address Space (Virtual Memory) Limit in bytes
        mem_bytes = memory_mb * 1024 * 1024
        resource.setrlimit(resource.RLIMIT_AS, (mem_bytes, mem_bytes))
        
        # Max child processes / threads
        if hasattr(resource, "RLIMIT_NPROC"):
            resource.setrlimit(resource.RLIMIT_NPROC, (max_processes, max_processes))
            
        # File size limit (prevent disk filling via large output: 10MB)
        max_file_size = 10 * 1024 * 1024
        resource.setrlimit(resource.RLIMIT_FSIZE, (max_file_size, max_file_size))

        # Core dump limit: 0 (disable core dumps)
        if hasattr(resource, "RLIMIT_CORE"):
            resource.setrlimit(resource.RLIMIT_CORE, (0, 0))

    except ImportError:
        # Running on Windows dev environment without resource module
        pass
    except Exception as e:
        sys.stderr.write(f"Warning: Failed to set some resource limits: {e}\n")
