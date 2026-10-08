import os
import sys
import json
import time
import redis
from pathlib import Path

# Add project root to PYTHONPATH
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "backend")))

from app.config import settings
from app.db.supabase import get_supabase_admin_client
from app.schemas.submission import Verdict
from worker.sandbox import Sandbox
from worker.compiler import Compiler
from worker.runner import Runner
from worker.judge import Judge

def process_submission(raw_payload: str):
    data = json.loads(raw_payload)
    submission_id = data["submission_id"]
    problem_id = data["problem_id"]
    language = data.get("language", "cpp")
    source_code = data["source_code"]
    time_limit_ms = data.get("time_limit_ms", 1000)
    memory_limit_mb = data.get("memory_limit_mb", 128)

    print(f"[*] Processing submission {submission_id} (Problem: {problem_id}, Lang: {language})")

    # Helper to update Supabase status
    def update_verdict(verdict: Verdict, score: int = 0, time_ms: int = 0, compile_err: str = None):
        try:
            db = get_supabase_admin_client()
            db.table("submissions").update({
                "verdict": verdict.value,
                "score": score,
                "execution_time_ms": time_ms,
                "compile_error": compile_err
            }).eq("id", submission_id).execute()
        except Exception as e:
            print(f"[!] Warning: Could not update Supabase: {e}")

    update_verdict(Verdict.COMPILING)

    with Sandbox(submission_id) as sandbox:
        src_ext = "cpp" if language == "cpp" else ("c" if language == "c" else "py")
        src_path = os.path.join(sandbox.workspace_dir, f"solution.{src_ext}")
        bin_path = os.path.join(sandbox.workspace_dir, "solution.out")

        with open(src_path, "w", encoding="utf-8") as f:
            f.write(source_code)

        # Step 1: Compile
        if language in ("cpp", "c"):
            ok, err = Compiler.compile_cpp(src_path, bin_path)
            if not ok:
                print(f"[-] Compilation error for {submission_id}")
                update_verdict(Verdict.COMPILATION_ERROR, score=0, compile_err=err)
                return

        # Step 2: Load Testcases
        testcases_dir = os.path.join(settings.PROBLEMS_DIR, problem_id, "testcases")
        if not os.path.exists(testcases_dir):
            print(f"[!] Error: Testcases directory not found: {testcases_dir}")
            update_verdict(Verdict.SYSTEM_ERROR, score=0, compile_err="Testcases not found on server.")
            return

        in_files = sorted(list(Path(testcases_dir).glob("*.in")))
        if not in_files:
            update_verdict(Verdict.ACCEPTED, score=100, time_ms=0)
            return

        total_cases = len(in_files)
        passed_cases = 0
        max_time_ms = 0
        final_verdict = Verdict.ACCEPTED

        update_verdict(Verdict.RUNNING)

        for in_file in in_files:
            out_file = in_file.with_suffix(".out")
            if not out_file.exists():
                continue

            with open(in_file, "r", encoding="utf-8") as f:
                input_data = f.read()
            with open(out_file, "r", encoding="utf-8") as f:
                expected_output = f.read()

            exec_res = Runner.run_testcase(
                binary_path=bin_path,
                input_data=input_data,
                time_limit_ms=time_limit_ms,
                memory_limit_mb=memory_limit_mb,
                cwd=sandbox.workspace_dir
            )

            max_time_ms = max(max_time_ms, exec_res.time_ms)

            if exec_res.is_timeout:
                final_verdict = Verdict.TIME_LIMIT_EXCEEDED
                break
            elif exec_res.exit_code != 0:
                final_verdict = Verdict.RUNTIME_ERROR
                break
            else:
                if Judge.compare_output(exec_res.stdout, expected_output):
                    passed_cases += 1
                else:
                    final_verdict = Verdict.WRONG_ANSWER
                    break

        score = int((passed_cases / total_cases) * 100) if total_cases > 0 else 0
        print(f"[+] Verdict for {submission_id}: {final_verdict.value} (Score: {score}/100, Max Time: {max_time_ms}ms)")
        update_verdict(final_verdict, score=score, time_ms=max_time_ms)

def main():
    print("==================================================")
    print(" 🛡️ Guarding Grader Worker Started")
    print(f" Redis: {settings.REDIS_HOST}:{settings.REDIS_PORT} (Queue: {settings.REDIS_QUEUE_NAME})")
    print("==================================================")

    r = redis.Redis(
        host=settings.REDIS_HOST,
        port=settings.REDIS_PORT,
        db=settings.REDIS_DB,
        password=settings.REDIS_PASSWORD or None,
        decode_responses=True
    )

    while True:
        try:
            # Blocking pop from Redis queue (timeout 2s)
            item = r.blpop(settings.REDIS_QUEUE_NAME, timeout=2)
            if item:
                _, raw_payload = item
                process_submission(raw_payload)
        except redis.ConnectionError:
            print("[!] Redis connection failed. Retrying in 5 seconds...")
            time.sleep(5)
        except KeyboardInterrupt:
            print("\n[*] Stopping Worker...")
            break
        except Exception as e:
            print(f"[!] Worker unhandled error: {e}")
            time.sleep(1)

if __name__ == "__main__":
    main()
