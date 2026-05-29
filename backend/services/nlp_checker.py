import re
from typing import Any, Dict, Iterable, List, Optional, Tuple

from rapidfuzz import fuzz, process

LANG_KEYS = ("kz", "ru", "en")
TOKEN_RE = re.compile(r"[\wА-Яа-яЁёӘәҒғҚқҢңӨөҰұҮүҺһІі-]+|[^\w\s]", re.UNICODE)
STOPWORDS = {
    "және", "мен", "немесе", "үшін", "арқылы",
    "в", "и", "или", "для", "на", "с", "по",
    "and", "or", "for", "with",
}


def normalize(value: str) -> str:
    return re.sub(r"\s+", " ", value or "").strip().lower()


class NLPChecker:
    def __init__(self, db_terms: Iterable[Dict[str, Any]]):
        self.db_terms = list(db_terms)
        self.choices: List[Tuple[str, Dict[str, Any], str, str]] = []

        for term in self.db_terms:
            for lang in LANG_KEYS:
                value = normalize(term.get(lang) or "")
                if value:
                    self.choices.append((value, term, lang, "canonical"))

            for alias in term.get("aliases") or []:
                value = normalize(alias)
                if value:
                    self.choices.append((value, term, "alias", "alias"))

            for deprecated in term.get("deprecated") or []:
                value = normalize(deprecated)
                if value:
                    self.choices.append((value, term, "deprecated", "deprecated"))

        self.choice_texts = [choice[0] for choice in self.choices]

    def check_text(self, text: str, language: str = "kz") -> Dict[str, Any]:
        tokens = TOKEN_RE.findall(text)
        results: List[Dict[str, Any]] = []
        recommendations: List[Dict[str, Any]] = []
        stats = {
            "words": 0,
            "checked_terms": 0,
            "correct": 0,
            "warnings": 0,
            "errors": 0,
            "mixed_lang": 0,
            "unknown": 0,
            "quality": 100,
        }

        i = 0
        while i < len(tokens):
            token = tokens[i]
            if not self._is_word(token):
                results.append({"word": token, "status": "neutral", "original": token})
                i += 1
                continue

            if normalize(token) in STOPWORDS:
                stats["words"] += 1
                results.append({"word": token, "status": "neutral", "original": token})
                i += 1
                continue

            phrase, consumed = self._longest_phrase(tokens, i)
            stats["words"] += len([part for part in phrase.split() if self._is_word(part)])
            match = self._match_phrase(phrase)

            if not match:
                stats["unknown"] += 1
                results.append({"word": phrase, "status": "neutral", "original": phrase})
                i += consumed
                continue

            choice_text, term, matched_lang, match_type, score = match
            status, suggestion, reason = self._classify(language, term, matched_lang, match_type, score)
            self._increment_stats(stats, status)
            stats["checked_terms"] += 1

            item = {
                "word": phrase,
                "status": status,
                "suggestion": suggestion,
                "original": phrase,
                "reason": reason,
                "score": int(score),
                "term": self._public_term(term),
            }
            results.append(item)

            if status in {"yellow", "red", "blue"}:
                recommendations.append(
                    {
                        "fragment": phrase,
                        "status": status,
                        "suggestion": suggestion,
                        "reason": reason,
                        "score": int(score),
                    }
                )

            i += consumed

        risk = stats["errors"] * 12 + stats["warnings"] * 6 + stats["mixed_lang"] * 8
        stats["quality"] = max(0, min(100, 100 - risk))
        return {"results": results, "stats": stats, "recommendations": recommendations}

    def _longest_phrase(self, tokens: List[str], start: int, max_words: int = 5) -> Tuple[str, int]:
        best = tokens[start]
        consumed = 1
        best_score = 0
        words_seen = 0
        parts = []

        for idx in range(start, min(len(tokens), start + max_words * 2)):
            part = tokens[idx]
            if not self._is_word(part):
                if part in {",", ".", ";", ":"}:
                    break
                continue
            parts.append(part)
            words_seen += 1
            candidate = " ".join(parts)
            score = self._best_score(candidate)
            if score > best_score or (score == best_score == 100 and words_seen > len(best.split())):
                best = candidate
                consumed = idx - start + 1
                best_score = score
            if words_seen >= max_words:
                break

        return best, consumed

    def _best_score(self, phrase: str) -> int:
        if not self.choice_texts:
            return 0
        result = process.extractOne(normalize(phrase), self.choice_texts, scorer=fuzz.ratio, score_cutoff=84)
        return int(result[1]) if result else 0

    def _match_phrase(self, phrase: str) -> Optional[Tuple[str, Dict[str, Any], str, str, int]]:
        if not self.choice_texts:
            return None

        result = process.extractOne(normalize(phrase), self.choice_texts, scorer=fuzz.ratio, score_cutoff=80)
        if not result:
            return None

        choice_text, score, index = result
        _, term, matched_lang, match_type = self.choices[index]
        return choice_text, term, matched_lang, match_type, int(score)

    def _classify(
        self, language: str, term: Dict[str, Any], matched_lang: str, match_type: str, score: int
    ) -> Tuple[str, Optional[str], str]:
        target_lang = language if language in LANG_KEYS else "kz"
        suggestion = term.get(target_lang) or term.get("kz") or term.get("ru") or term.get("en")

        if match_type == "deprecated":
            return "red", suggestion, "Устаревший или нерекомендуемый вариант"

        if language != "mix" and matched_lang in LANG_KEYS and matched_lang != target_lang:
            return "blue", suggestion, "Термин найден на другом языке"

        if score >= 96 and match_type in {"canonical", "alias"}:
            return "green", None, "Термин соответствует базе"

        if score >= 86:
            return "yellow", suggestion, "Похоже на термин из базы, проверьте написание"

        return "red", suggestion, "Вероятная терминологическая ошибка"

    @staticmethod
    def _increment_stats(stats: Dict[str, Any], status: str) -> None:
        mapping = {
            "green": "correct",
            "yellow": "warnings",
            "red": "errors",
            "blue": "mixed_lang",
        }
        key = mapping.get(status)
        if key:
            stats[key] += 1

    @staticmethod
    def _is_word(token: str) -> bool:
        return bool(re.search(r"[\wА-Яа-яЁёӘәҒғҚқҢңӨөҰұҮүҺһІі]", token, re.UNICODE))

    @staticmethod
    def _public_term(term: Dict[str, Any]) -> Dict[str, Any]:
        return {
            "_id": str(term.get("_id", "")),
            "kz": term.get("kz"),
            "ru": term.get("ru"),
            "en": term.get("en"),
            "category": term.get("category", "Фармацевтика"),
        }
