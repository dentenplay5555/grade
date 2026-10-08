import os
import json
from typing import List, Optional
from app.config import settings
from app.schemas.problem import ProblemSummary, ProblemDetail, ProblemCreate, ProblemUpdate

class ProblemService:
    def __init__(self):
        self.base_dir = settings.PROBLEMS_DIR
        os.makedirs(self.base_dir, exist_ok=True)

    def list_problems(self) -> List[ProblemSummary]:
        problems = []
        if not os.path.exists(self.base_dir):
            return problems
            
        for prob_id in sorted(os.listdir(self.base_dir)):
            prob_path = os.path.join(self.base_dir, prob_id)
            config_file = os.path.join(prob_path, "config.json")
            if os.path.isdir(prob_path) and os.path.isfile(config_file):
                try:
                    with open(config_file, "r", encoding="utf-8") as f:
                        cfg = json.load(f)
                    problems.append(ProblemSummary(
                        id=prob_id,
                        title=cfg.get("title", f"Problem {prob_id}"),
                        slug=cfg.get("slug", prob_id),
                        time_limit_ms=cfg.get("time_limit_ms", 1000),
                        memory_limit_mb=cfg.get("memory_limit_mb", 128),
                        score=cfg.get("score", 100),
                        is_active=cfg.get("is_active", True)
                    ))
                except Exception:
                    continue
        return problems

    def get_problem_detail(self, problem_id: str) -> Optional[ProblemDetail]:
        prob_path = os.path.join(self.base_dir, problem_id)
        config_file = os.path.join(prob_path, "config.json")
        statement_file = os.path.join(prob_path, "statement.md")

        if not os.path.exists(config_file):
            return None

        with open(config_file, "r", encoding="utf-8") as f:
            cfg = json.load(f)

        statement = ""
        if os.path.exists(statement_file):
            with open(statement_file, "r", encoding="utf-8") as f:
                statement = f.read()

        return ProblemDetail(
            id=problem_id,
            title=cfg.get("title", f"Problem {problem_id}"),
            slug=cfg.get("slug", problem_id),
            statement=statement,
            time_limit_ms=cfg.get("time_limit_ms", 1000),
            memory_limit_mb=cfg.get("memory_limit_mb", 128),
            score=cfg.get("score", 100),
            is_active=cfg.get("is_active", True),
            sample_inputs=cfg.get("sample_inputs", []),
            sample_outputs=cfg.get("sample_outputs", [])
        )

    def create_problem(self, problem_id: str, data: ProblemCreate) -> ProblemDetail:
        prob_path = os.path.join(self.base_dir, problem_id)
        os.makedirs(os.path.join(prob_path, "testcases"), exist_ok=True)

        config_data = {
            "title": data.title,
            "slug": data.slug,
            "time_limit_ms": data.time_limit_ms,
            "memory_limit_mb": data.memory_limit_mb,
            "score": data.score,
            "is_active": data.is_active,
            "sample_inputs": data.sample_inputs,
            "sample_outputs": data.sample_outputs
        }

        with open(os.path.join(prob_path, "config.json"), "w", encoding="utf-8") as f:
            json.dump(config_data, f, indent=2, ensure_ascii=False)

        with open(os.path.join(prob_path, "statement.md"), "w", encoding="utf-8") as f:
            f.write(data.statement)

        return self.get_problem_detail(problem_id)

problem_service = ProblemService()
