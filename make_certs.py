import json
import re
from pathlib import Path

ROOT = Path("certs")
EXT = {".pdf", ".png", ".jpg", ".jpeg"}

# folder name -> label shown on the site (this order is the chip order)
LABELS = {
    "Coursera": "Coursera",
    "Hacker_Rank": "HackerRank",
    "LinkedIn": "LinkedIn Learning",
    "WSU": "WSU",
}
ROOT_LABEL = "Google"  # loose files sitting directly in certs/

ACRONYMS = {"Sql": "SQL"}
FIXES = {"CSharp Basic": "C# Basic"}  # add any title the rules get wrong


def clean(stem, group):
    t = re.sub(r"^CertificateOfCompletion_", "", stem)
    t = re.sub(r"^(Coursera|HackerRank)[ _]", "", t, flags=re.I)
    t = re.sub(r"^\d+_\d+_\d+_", "", t)  # leading date like 4_16_24_
    t = re.sub(r"[_ ]?(LinkedIn ?Learning|LinkedIn)( Certificate)?$", "", t, flags=re.I)
    if group == "HackerRank":
        t = re.sub(r"[_ ]certificate$", "", t, flags=re.I)
    t = t.replace("_", " ").replace("-", " ")
    t = re.sub(r"\s+", " ", t).strip()
    if " " not in t:  # one long CamelCase word
        t = re.sub(r"(?<=[a-z])(?=[A-Z])", " ", t)
    if group in ("HackerRank", "WSU"):
        t = " ".join(w[0].upper() + w[1:] for w in t.split())
    t = " ".join(ACRONYMS.get(w, w) for w in t.split())
    return FIXES.get(t, t)


items = []
for p in sorted(ROOT.rglob("*")):
    if not p.is_file():
        continue
    if p.suffix.lower() not in EXT:
        print("skipped (not a pdf or image):", p)
        continue
    rel = p.relative_to(ROOT)
    folder = rel.parts[0] if len(rel.parts) > 1 else None
    group = LABELS.get(folder, folder.replace("_", " ")) if folder else ROOT_LABEL
    items.append({"t": clean(p.stem, group), "g": group, "f": "certs/" + rel.as_posix()})

order = list(LABELS.values()) + [ROOT_LABEL]
items.sort(key=lambda c: (order.index(c["g"]) if c["g"] in order else 99, c["t"].lower()))

Path("certs-data.js").write_text("window.CERTS = " + json.dumps(items, indent=1) + ";\n", encoding="utf-8")
print(len(items), "certificates written to certs-data.js")
