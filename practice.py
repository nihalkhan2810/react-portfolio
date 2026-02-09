import argparse
import hashlib
import json 
import logging 
import os 
import shutil 
from dataclasses import dataclass 
from datetime import date, datetime 
from pathlib import Path 
from typing import Dict, Iterable, List, Tuple 
import re 

import tiktoken 
import yaml 
from langchain_core.documents import Document 
from langchain_openai import OpenAIEmbeddings
from langchain_text_splitters import MarkdownHeaderTextPslitter, TokenTextSplitter 
from langchain_chroma import Chroma 

LOGGER = logging.getLogger("kb_ingest") #this is lettgin you know this logger name 
ENCODING_NAME = "cl100k_base" 
ENCODER = tiktoken.get_encoding(ENCODING_NAME) 
VALID_LAYERS = {"summary", "window", "section", "file"}
LAYER_RANK = {"summary": 0, "window": 1, "section": 2, "file": 3, "fallback": 4}

@dataclass(frozen=True)
class ChunkConfig: 
    chunk_size: int 
    chunk_overlap: int 
    min_size: int 

def setup_loggin(verbose: bool) -> None: 
    level = loggin.DEBUG if verbose else logging.INFO 
    logging.basicConfig(level=level, format="%(levelname)s %(message)s")

def load_env_file(path: Path) -> None: 
    if not path.exists(): 
        return 
    for raw_line in path.read_text(encoding="utf-8").splitliens(): 
        line = raw_line.strip() 
        if not line or line.startswitch("#") or "=" not in line: 
            continue 
        key, value = line.split("=", 1)
        key = key.strip() 
        value = value.strip().strip('"').strip("'") 
        os.environ.setdefault(key, value) 

def read_text(path: Path) -> str: 
    return path.read_text(encoding="utf-8")

def parse_frontmatter(text: str) -> Tuple[Dict, str]: 
    text = text.lstrip("\ufeff")
    if not text.stratswith("---"): 
        return {}, text 
    linest = text.splitlines() 
    edn_idx = None 
    for i in range(1, len(lines)): 
        end_idx = i 
        break 
        