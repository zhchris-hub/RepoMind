import json
from pathlib import Path

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from tree_sitter import Language, Parser

from app.models.project import File, Project

TREE_SITTER_LANGS = {
    "Python": "python",
    "JavaScript": "javascript",
    "JavaScript (React)": "javascript",
    "TypeScript": "typescript",
    "TypeScript (React)": "typescript",
    "Java": "java",
    "Go": "go",
    "Rust": "rust",
    "Ruby": "ruby",
    "C": "c",
    "C++": "cpp",
    "C/C++ Header": "c",
    "C++ Header": "cpp",
}

_parser_cache: dict[str, Parser] = {}


def get_parser(language: str) -> Parser | None:
    ts_lang_name = TREE_SITTER_LANGS.get(language)
    if not ts_lang_name:
        return None

    if ts_lang_name in _parser_cache:
        return _parser_cache[ts_lang_name]

    try:
        from tree_sitter_languages import get_language
        lang = get_language(ts_lang_name)
        parser = Parser()
        parser.set_language(lang)
        _parser_cache[ts_lang_name] = parser
        return parser
    except Exception:
        return None


def extract_imports(node, language: str) -> list[str]:
    imports = []

    if language in ("Python",):
        if node.type == "import_statement":
            for child in node.children:
                if child.type == "dotted_name":
                    imports.append(child.text.decode())
        elif node.type == "import_from_statement":
            module = ""
            for child in node.children:
                if child.type == "dotted_name":
                    module = child.text.decode()
                    break
            if module:
                imports.append(module)

    elif language in ("JavaScript", "JavaScript (React)", "TypeScript", "TypeScript (React)"):
        if node.type == "import_statement":
            source = node.child_by_field_name("source")
            if source:
                imports.append(source.text.decode().strip("'\""))

    elif language == "Java":
        if node.type == "import_declaration":
            for child in node.children:
                if child.type == "scoped_identifier":
                    imports.append(child.text.decode())

    elif language == "Go":
        if node.type == "import_declaration":
            for child in node.children:
                if child.type == "import_spec":
                    for sub in child.children:
                        if sub.type == "interpreted_string_literal":
                            imports.append(sub.text.decode().strip('"'))

    return imports


def extract_functions(node, language: str) -> list[dict]:
    functions = []

    if language in ("Python",):
        if node.type == "function_definition":
            name_node = node.child_by_field_name("name")
            if name_node:
                func = {"name": name_node.text.decode(), "line": node.start_point[0] + 1}
                params = node.child_by_field_name("parameters")
                if params:
                    func["params"] = params.text.decode()
                functions.append(func)

    elif language in ("JavaScript", "JavaScript (React)", "TypeScript", "TypeScript (React)"):
        if node.type in ("function_declaration", "method_definition"):
            name_node = node.child_by_field_name("name")
            if name_node:
                func = {"name": name_node.text.decode(), "line": node.start_point[0] + 1}
                params = node.child_by_field_name("parameters")
                if params:
                    func["params"] = params.text.decode()
                functions.append(func)

    elif language == "Java":
        if node.type == "method_declaration":
            name_node = node.child_by_field_name("name")
            if name_node:
                func = {"name": name_node.text.decode(), "line": node.start_point[0] + 1}
                params = node.child_by_field_name("parameters")
                if params:
                    func["params"] = params.text.decode()
                functions.append(func)

    elif language == "Go":
        if node.type == "function_declaration":
            name_node = node.child_by_field_name("name")
            if name_node:
                func = {"name": name_node.text.decode(), "line": node.start_point[0] + 1}
                params = node.child_by_field_name("parameters")
                if params:
                    func["params"] = params.text.decode()
                functions.append(func)

    for child in node.children:
        functions.extend(extract_functions(child, language))

    return functions


def extract_classes(node, language: str) -> list[dict]:
    classes = []

    if language in ("Python",):
        if node.type == "class_definition":
            name_node = node.child_by_field_name("name")
            if name_node:
                cls = {"name": name_node.text.decode(), "line": node.start_point[0] + 1}
                for child in node.children:
                    if child.type == "argument_list":
                        cls["bases"] = child.text.decode()
                classes.append(cls)

    elif language in ("JavaScript", "JavaScript (React)", "TypeScript", "TypeScript (React)"):
        if node.type == "class_declaration":
            name_node = node.child_by_field_name("name")
            if name_node:
                cls = {"name": name_node.text.decode(), "line": node.start_point[0] + 1}
                classes.append(cls)

    elif language == "Java":
        if node.type in ("class_declaration", "interface_declaration"):
            name_node = node.child_by_field_name("name")
            if name_node:
                cls = {"name": name_node.text.decode(), "line": node.start_point[0] + 1}
                classes.append(cls)

    for child in node.children:
        classes.extend(extract_classes(child, language))

    return classes


def analyze_file(content: str, language: str) -> dict | None:
    parser = get_parser(language)
    if not parser:
        return None

    try:
        tree = parser.parse(content.encode())
        root = tree.root_node

        imports = extract_imports(root, language)
        functions = extract_functions(root, language)
        classes = extract_classes(root, language)

        return {
            "imports": imports,
            "functions": functions,
            "classes": classes,
        }
    except Exception:
        return None


async def analyze_ast(project: Project, db: AsyncSession) -> Project:
    result = await db.execute(select(File).where(File.project_id == project.id))
    files = result.scalars().all()

    analysis_summary = {
        "total_files": len(files),
        "analyzed_files": 0,
        "total_functions": 0,
        "total_classes": 0,
        "total_imports": 0,
        "file_analyses": {},
        "dependency_graph": {},
    }

    for file in files:
        analysis = analyze_file(file.content, file.language)
        if analysis:
            analysis_summary["analyzed_files"] += 1
            analysis_summary["total_functions"] += len(analysis["functions"])
            analysis_summary["total_classes"] += len(analysis["classes"])
            analysis_summary["total_imports"] += len(analysis["imports"])

            analysis_summary["file_analyses"][file.path] = analysis
            if analysis["imports"]:
                analysis_summary["dependency_graph"][file.path] = analysis["imports"]

    project.status = "ast_analyzed"
    await db.commit()
    return project
