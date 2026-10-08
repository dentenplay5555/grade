from typing import Tuple

class Judge:
    @staticmethod
    def compare_output(user_output: str, expected_output: str) -> bool:
        """
        Normalizes line endings and trailing whitespace for fair comparison.
        """
        user_lines = [line.rstrip() for line in user_output.strip().splitlines() if line.strip()]
        expected_lines = [line.rstrip() for line in expected_output.strip().splitlines() if line.strip()]
        
        return user_lines == expected_lines
