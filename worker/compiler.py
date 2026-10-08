import os
import subprocess
from typing import Tuple, Optional

class Compiler:
    @staticmethod
    def compile_cpp(source_path: str, binary_path: str) -> Tuple[bool, Optional[str]]:
        """
        Compiles C++ source with clang++ or g++ with strict optimizations and security warnings.
        """
        # Select compiler (clang++ is standard on Termux, g++ on Linux)
        compiler_bin = "clang++" if shutil_which("clang++") else "g++"
        
        cmd = [
            compiler_bin,
            "-O2",
            "-std=c++17",
            "-Wall",
            "-Wextra",
            source_path,
            "-o",
            binary_path
        ]

        try:
            res = subprocess.run(
                cmd,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                text=True,
                timeout=15  # Max 15s for compilation
            )
            if res.returncode == 0:
                return True, None
            else:
                return False, res.stderr
        except subprocess.TimeoutExpired:
            return False, "Compilation timed out (max 15s limit reached)."
        except Exception as e:
            return False, f"Compiler error: {str(e)}"

def shutil_which(cmd: str) -> Optional[str]:
    import shutil
    return shutil.which(cmd)
